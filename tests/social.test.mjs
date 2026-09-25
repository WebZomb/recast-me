import test from 'node:test';
import assert from 'node:assert/strict';
import { directionFromMention, attachedPhotos, runSocialPipeline, socialRoutes, ingestMentions } from '../src/social.js';
import { renderHealth } from '../src/render-health.js';

const jpeg=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(240,84)]);
class Bucket {
  items=new Map(); counter=0;
  async get(key){const x=this.items.get(key);if(!x)return null;return {etag:x.etag,body:new Blob([x.value]).stream(),json:async()=>JSON.parse(String(x.value)),text:async()=>String(x.value),arrayBuffer:async()=>new Blob([x.value]).arrayBuffer()};}
  async put(key,value,options={}){const current=this.items.get(key);const c=options.onlyIf;if((c instanceof Headers&&c.get('If-None-Match')==='*'&&current)||c?.etagMatches&&c.etagMatches!==current?.etag)return null;const stored={value:typeof value==='string'?value:Buffer.from(value),etag:String(++this.counter)};this.items.set(key,stored);return {etag:stored.etag};}
  async delete(key){this.items.delete(key);}
  async list({prefix,limit=100}){return {objects:[...this.items.keys()].filter(k=>k.startsWith(prefix)).sort().slice(0,limit).map(key=>({key}))};}
}
const tweet={id:'1234',author_id:'5678',text:'@recastmeai make me and my dog ready for Halloween',attachments:{media_keys:['photo1']}};
const media={media_key:'photo1',type:'photo',url:'https://pbs.twimg.com/media/photo.jpg'};
function setup(t,{quota=false,ambiguous=false}={}){
  const calls={ai:0,uploads:0,replies:[],mentions:[]};
  const env={PUBLIC_APP_URL:'https://recast.test',X_USER_ID:'999',X_USERNAME:'recastmeai',X_USER_ACCESS_TOKEN:'test',X_BOT_ENABLED:'true',X_BOT_APPROVED:'true',ARTWORK:new Bucket(),TURNSTILE_SECRET_KEY:'enabled',AI:{run:async()=>{calls.ai++;if(quota)throw new Error('3036 daily free allocation');return {image:jpeg.toString('base64')};}},ASSETS:{fetch:async()=>new Response('watermark')},IMAGES:{input:()=>{let drawn=false;const chain={transform:()=>chain,draw:()=>{drawn=true;return chain;},output:async()=>({response:()=>new Response(drawn?'watermarked-public-preview':jpeg)})};return chain;}}};
  t.mock.method(globalThis,'fetch',async(raw,options={})=>{
    const url=new URL(raw instanceof Request?raw.url:String(raw));
    if(url.pathname.endsWith('/mentions')){calls.mentions.push(url);return Response.json({data:[tweet],includes:{media:[media]}});}
    if(url.hostname==='pbs.twimg.com')return new Response(jpeg,{headers:{'content-type':'image/jpeg'}});
    if(url.pathname==='/2/media/upload'){
      calls.uploads++;assert.equal(await options.body.get('media').text(),'watermarked-public-preview');
      return Response.json({data:{id:'uploaded123',expires_after_secs:3600}});
    }
    if(url.pathname==='/2/tweets'){
      calls.replies.push(JSON.parse(options.body));
      if(ambiguous)throw new Error('socket closed after POST');
      return Response.json({data:{id:'reply123'}});
    }
    throw new Error(`Unexpected network request ${url}`);
  });
  return {env,calls};
}

test('Halloween request includes both subjects and only uses photos attached to the requesting post',()=>{
  const d=directionFromMention(tweet.text,'recastmeai');assert.equal(d.style,'halloween');assert.equal(d.subject,'person and pet');
  assert.deepEqual(attachedPhotos(tweet,[media,{media_key:'other',type:'photo',url:'https://pbs.twimg.com/media/stranger.jpg'}]),[media.url]);
  assert.deepEqual(attachedPhotos(tweet,[{...media,url:'https://internal.example/media/photo.jpg'}]),[]);
});

test('X request generates once, posts a watermarked image and links to its exact purchasable artwork',async t=>{
  const {env,calls}=setup(t);
  await runSocialPipeline(env);await runSocialPipeline(env);
  assert.equal(calls.ai,1);assert.equal(calls.uploads,1);assert.equal(calls.replies.length,1);
  const job=await (await env.ARTWORK.get('social/x/1234.json')).json();
  assert.equal(job.replyStatus,'replied');assert.ok(job.requestId);assert.ok(job.shareId);
  assert.deepEqual(calls.replies[0].media,{media_ids:['uploaded123']});
  assert.match(calls.replies[0].text,/poster, or a coffee mug/);assert.ok(calls.replies[0].text.includes(job.link));
  const meta=await (await env.ARTWORK.get(`requests/${job.requestId}/request.json`)).json();
  const response=await socialRoutes(new Request(`https://recast.test/api/social/${job.shareId}`),env,{});
  const publicData=await response.text();assert.ok(!publicData.includes(meta.accessToken));assert.ok(!publicData.includes(jpeg.toString('base64')));
  assert.equal(JSON.parse(publicData).requestId,job.requestId);
  const image=await socialRoutes(new Request(`https://recast.test/api/social/${job.shareId}/image`),env,{});
  assert.equal(await image.text(),'watermarked-public-preview');
});

test('quota pauses the X job without dropping it; the same request completes after capacity is restored',async t=>{
  const {env,calls}=setup(t,{quota:true});await runSocialPipeline(env);
  let job=await (await env.ARTWORK.get('social/x/1234.json')).json();
  assert.equal(job.replyStatus,'awaiting_capacity');assert.equal(calls.replies.length,0);
  assert.equal((await renderHealth(env)).state,'paused');
  assert.ok(await env.ARTWORK.get('social/pending/1234.json'));
  await runSocialPipeline(env);assert.equal(calls.ai,1);
  job.retryAt='2000-01-01';await env.ARTWORK.put('social/x/1234.json',JSON.stringify(job));await env.ARTWORK.delete('system/render-health.json');
  env.AI.run=async()=>{calls.ai++;return {image:jpeg.toString('base64')};};
  await runSocialPipeline(env);job=await (await env.ARTWORK.get('social/x/1234.json')).json();
  assert.equal(job.replyStatus,'replied');assert.equal(calls.ai,2);
});

test('ambiguous reply timeout is held for review instead of posting duplicate replies',async t=>{
  const {env,calls}=setup(t,{ambiguous:true});await runSocialPipeline(env);await runSocialPipeline(env);
  assert.equal(calls.replies.length,1);assert.equal(calls.ai,1);
  assert.equal((await (await env.ARTWORK.get('social/x/1234.json')).json()).replyStatus,'delivery_unknown');
});

test('overlapping cron runs respect the R2 lease',async t=>{
  const {env,calls}=setup(t);
  await env.ARTWORK.put('system/x-pipeline-lock.json',JSON.stringify({until:new Date(Date.now()+60000).toISOString()}));
  assert.equal((await runSocialPipeline(env)).busy,true);assert.equal(calls.mentions.length,0);assert.equal(calls.ai,0);
});

test('missing photo requests get a private upload link and never fabricate a likeness',async t=>{
  const {env,calls}=setup(t);
  const job={tweetId:'1234',authorId:'5678',direction:directionFromMention(tweet.text,'recastmeai'),requestText:'make me and my dog ready for Halloween',photos:[],replyStatus:'queued',createdAt:new Date().toISOString()};
  await env.ARTWORK.put('social/x/1234.json',JSON.stringify(job));await env.ARTWORK.put('social/pending/1234.json',JSON.stringify({tweetId:'1234'}));
  await runSocialPipeline(env);assert.equal(calls.ai,0);assert.equal(calls.uploads,0);assert.match(calls.replies[0].text,/upload it privately/);
});

test('mention pagination retains the prior cursor until every page is ingested',async t=>{
  const env={ARTWORK:new Bucket(),X_USER_ID:'999',X_USERNAME:'recastmeai',X_USER_ACCESS_TOKEN:'test'};
  await env.ARTWORK.put('system/x-state.json',JSON.stringify({sinceId:'100'}));let count=0;
  t.mock.method(globalThis,'fetch',async raw=>{
    const u=new URL(String(raw));assert.equal(u.searchParams.get('since_id'),'100');count++;
    if(count===1)return Response.json({data:[{...tweet,id:'300'}],includes:{media:[media]},meta:{next_token:'next-page'}});
    assert.equal(u.searchParams.get('pagination_token'),'next-page');return Response.json({data:[{...tweet,id:'200'}],includes:{media:[media]}});
  });
  await ingestMentions(env);assert.equal((await (await env.ARTWORK.get('system/x-state.json')).json()).sinceId,'100');
  await ingestMentions(env);assert.equal((await (await env.ARTWORK.get('system/x-state.json')).json()).sinceId,'300');
  assert.ok(await env.ARTWORK.get('social/pending/200.json'));assert.ok(await env.ARTWORK.get('social/pending/300.json'));
});

test('OAuth refresh persists rotated credentials privately and uses the refreshed access token',async t=>{
  const env={ARTWORK:new Bucket(),X_USER_ID:'999',X_USERNAME:'recastmeai',X_REFRESH_TOKEN:'old-refresh',X_CLIENT_ID:'client'};let refreshes=0;
  t.mock.method(globalThis,'fetch',async(raw,options)=>{
    if(String(raw).endsWith('/oauth2/token')){refreshes++;assert.equal(options.body.get('refresh_token'),'old-refresh');return Response.json({access_token:'new-access',refresh_token:'new-refresh',expires_in:7200});}
    assert.equal(options.headers.Authorization,'Bearer new-access');return Response.json({data:[]});
  });
  await ingestMentions(env);await ingestMentions(env);
  assert.equal(refreshes,1);assert.equal((await (await env.ARTWORK.get('system/x-oauth.json')).json()).refreshToken,'new-refresh');
});

test('public checkout uses the shared artwork and cannot substitute another Artwork ID',async t=>{
  const {env}=setup(t);await runSocialPipeline(env);
  const job=await (await env.ARTWORK.get('social/x/1234.json')).json();
  Object.assign(env,{SHOPIFY_SHOP:'test',SHOPIFY_CLIENT_ID:'client',SHOPIFY_CLIENT_SECRET:'secret'});
  t.mock.method(globalThis,'fetch',async raw=>{
    if(String(raw).endsWith('/access_token'))return Response.json({access_token:'shop-token',expires_in:3600});
    if(String(raw).includes('/graphql.json'))return Response.json({data:{shop:{name:'Test'},products:{nodes:[{id:'p',title:'Custom Recast Mug',handle:'mug',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/123',title:'11 oz',sku:'RECAST-MUG-11OZ',price:'24.99'}]}}]},orders:{nodes:[]}}});
    throw new Error('Unexpected network request');
  });
  const response=await socialRoutes(new Request(`https://recast.test/api/social/${job.shareId}/checkout`,{method:'POST',body:JSON.stringify({sku:'RECAST-MUG-11OZ',requestId:'another-artwork',accessToken:'attacker-choice'})}),env,{});
  const data=await response.json();assert.equal(data.ok,true);
  const url=new URL(data.checkoutUrl);const properties=JSON.parse(Buffer.from(url.searchParams.get('properties'),'base64url'));
  assert.equal(properties['Artwork ID'],job.requestId);
  assert.equal(url.hostname,'test.myshopify.com');
});
