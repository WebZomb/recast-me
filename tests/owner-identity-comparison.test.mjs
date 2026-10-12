import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {Bucket,CLEAN,MARKED,imageMock} from './security-helpers.mjs';
import {moderationVerdict} from './safety-fixtures.mjs';
const JOB='01a11f14-bd12-7083-aa72-2e494db231a0';
const DETAIL=Buffer.concat([CLEAN,Buffer.from('original-detail-preserved')]);
function env(extra={}){return {ARTWORK:new Bucket(),IMAGES:imageMock(),ADMIN_TOKEN:'fake-admin',CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'offline',AI:{run:async()=>{throw Error('Unexpected Cloudflare inference')}},FAL_API_KEY:'MOCK-FAL-KEY-NOT-A-REAL-CREDENTIAL',FAL_OWNER_TEST_ENABLED:'true',RECAST_HQ_PROVIDER:'fal',FAL_PROVIDER_ENABLED:'true',FAL_PROVIDER_VERIFIED:'true',IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',IMAGE_HIGH_QUALITY_STEPS:'18',IMAGE_HIGH_QUALITY_GUIDANCE:'5',RENDER_CREDITS_ENABLED:'false',AI_DAILY_CALL_LIMIT:'70',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7',...extra}}
function req({choice='nano-banana',admin=true,path='/api/admin/model-test',host='fal',recipe='baseline'}={}){
 const f=new FormData();f.set('promptRecipe',recipe);f.set('ownerProvider',host);f.set('style','custom');f.set('subject','auto');f.set('notes','A royal blue cape');f.set('customWorld','Sunlit palace courtyard');f.set('qualityMode','high');f.set('image_0',new File([CLEAN],'small.jpg',{type:'image/jpeg'}));f.set('hq_image_0',new File([DETAIL],'detail.jpg',{type:'image/jpeg'}));
 // Forged public fields must never activate an owner experiment.
 f.set('RECAST_OWNER_IDENTITY_MODEL',choice);f.set('ownerModel',choice);
 return new Request('https://recast.test'+path+'?model='+choice,{method:'POST',headers:admin?{authorization:'Bearer fake-admin'}:{},body:f});
}
function mock(t,{nano=true,fail=false,remote=false,badCallback=false,blockedOutput=false}={}){
 const calls=[],root='https://queue.fal.run/fal-ai/'+(nano?'nano-banana':'flux-2'),endpoint=root+'/edit';let screens=0;
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  url=String(url);calls.push({url,method:options.method||'GET',body:options.body});
  if(url.endsWith('/moderations')){screens++;const result=moderationVerdict();if(blockedOutput&&screens===2)result.results[0].flagged=true;return Response.json(result)}
  if(url===endpoint){if(fail)return new Response('',{status:503});return Response.json({request_id:JOB,status_url:(badCallback?'https://evil.test':root)+'/requests/'+JOB+'/status',response_url:root+'/requests/'+JOB})}
  if(url===root+'/requests/'+JOB+'/status')return Response.json({status:'COMPLETED'});
  if(url===root+'/requests/'+JOB)return Response.json({images:[{url:remote?'https://evil.test/photo.jpg':'data:image/jpeg;base64,'+CLEAN.toString('base64'),width:1024,height:1280}],...(nano?{description:''}:{has_nsfw_concepts:[false]})});
  throw Error('Unexpected network request '+url);
 });return calls;
}
for(const choice of ['dev-edit','nano-banana'])test(choice+': one detailed private render, real model metadata, moderation, unchanged public health',async t=>{
 const e=env(),calls=mock(t,{nano:choice==='nano-banana'});
 const r=await router.fetch(req({choice}),e,{}),d=await r.json();assert.equal(r.status,200,JSON.stringify(d));assert.equal(d.image,'data:image/jpeg;base64,'+MARKED.toString('base64'));
 assert.equal(d.modelUsed,choice==='nano-banana'?'fal-ai/nano-banana/edit':'fal-ai/flux-2/edit');assert.equal(d.promptVersion,'owner-identity-edit-v1');
 const posts=calls.filter(c=>c.url.startsWith('https://queue.fal.run')&&c.method==='POST');assert.equal(posts.length,1);
 const sent=JSON.parse(posts[0].body);assert.equal(sent.image_urls.length,1);assert.equal(sent.image_urls[0],'data:image/jpeg;base64,'+DETAIL.toString('base64'));assert.match(sent.prompt,/Change the outfit and background only/);
 if(choice==='nano-banana'){assert.equal(sent.limit_generations,true);assert.equal(sent.safety_tolerance,'4');assert.equal(sent.aspect_ratio,'4:5');assert.equal(sent.num_images,1);assert.equal(sent.sync_mode,true);assert.equal(sent.guidance_scale,undefined)}else{assert.equal(sent.guidance_scale,2.5);assert.equal(sent.num_inference_steps,28)}
 assert.equal(calls.filter(c=>c.url.endsWith('/moderations')).length,2);
 assert.equal(await e.ARTWORK.get('system/providers/hq-fal.json'),null);
 const meta=await(await e.ARTWORK.get('requests/'+d.requestId+'/request.json')).json();assert.equal(meta.subjectType,'auto');assert.equal(meta.modelUsed,d.modelUsed);assert.equal(meta.promptVersion,d.promptVersion);assert.equal(meta.safety.outputScreening.status,'passed');
 const original=await e.ARTWORK.get('requests/'+d.requestId+'/input-0.jpg');assert.deepEqual(Buffer.from(await original.arrayBuffer()),DETAIL);
});
test('owner experiments fail before paid calls without authentication, activation, screening, supported choice or fal host',async t=>{
 let paid=0;t.mock.method(globalThis,'fetch',async()=>{paid++;throw Error('No external calls expected')});
 for(const [r,e] of [[req({admin:false}),env()],[req(),env({FAL_OWNER_TEST_ENABLED:'false'})],[req(),env({CONTENT_MODERATION_ENABLED:'false'})],[req({choice:'unknown'}),env()],[req({host:'cloudflare'}),env()]]){const response=await router.fetch(r,e,{});assert.ok(response.status>=400)}assert.equal(paid,0);
});
test('public forged experiment selection leaves production model and prompt intact',async t=>{
 const e=env(),calls=mock(t,{nano:false});await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 const r=await router.fetch(req({admin:false,path:'/api/transform-v2'}),e,{}),d=await r.json();assert.equal(r.status,200,JSON.stringify(d));assert.equal(d.modelUsed,'fal-ai/flux-2/edit');assert.notEqual(d.promptVersion,'owner-identity-edit-v1');
 const input=JSON.parse(calls.find(c=>c.url.endsWith('/flux-2/edit')).body);assert.equal(input.guidance_scale,5);assert.equal(input.num_inference_steps,18);
});
for(const problem of ['fail','remote','badCallback','blockedOutput'])test('candidate '+problem+' fails closed, no second paid call or public provider outage',async t=>{
 const e=env(),calls=mock(t,{[problem]:true});const r=await router.fetch(req(),e,{}),d=await r.json();assert.ok(r.status>=400,JSON.stringify(d));assert.equal(d.image,undefined);assert.equal(calls.filter(c=>c.url.includes('queue.fal.run')&&c.method==='POST').length,1);assert.equal(await e.ARTWORK.get('system/providers/hq-fal.json'),null);assert.equal((await e.ARTWORK.list({prefix:'requests/'})).objects.length,0);assert.ok(!calls.some(c=>c.url.includes('evil.test')));
});
test('candidate respects the existing daily generation limit',async t=>{
 const e=env({AI_DAILY_CALL_LIMIT:'0'}),calls=mock(t);const r=await router.fetch(req(),e,{});assert.ok(r.status>=400);assert.equal(calls.filter(c=>c.url.includes('queue.fal.run')).length,0);
});

test('approved public Nano route keeps moderation, one paid request, originals, metadata and health tracking',async t=>{
 const e=env({FAL_CUSTOMER_MODEL:'nano-banana'}),calls=mock(t);await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success'}));
 const r=await router.fetch(req({admin:false,path:'/api/transform-v2'}),e,{}),d=await r.json();assert.equal(r.status,200,JSON.stringify(d));assert.equal(d.modelUsed,'fal-ai/nano-banana/edit');assert.equal(d.promptVersion,'nano-identity-adventures-v6');assert.equal(d.image,'data:image/jpeg;base64,'+MARKED.toString('base64'));
 assert.equal(calls.filter(c=>c.url.includes('queue.fal.run')&&c.method==='POST').length,1);assert.equal(calls.filter(c=>c.url.endsWith('/moderations')).length,2);
 assert.equal((await(await e.ARTWORK.get('system/providers/hq-fal.json')).json()).status,'success');const meta=await(await e.ARTWORK.get('requests/'+d.requestId+'/request.json')).json();assert.equal(meta.modelUsed,d.modelUsed);assert.equal(meta.promptVersion,d.promptVersion);
});
test('public Nano requires output screening before any paid submission',async t=>{
 const e=env({FAL_CUSTOMER_MODEL:'nano-banana',CONTENT_MODERATION_ENABLED:'false'}),calls=mock(t);await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success'}));const r=await router.fetch(req({admin:false,path:'/api/transform-v2'}),e,{});assert.ok(r.status>=400);assert.equal(calls.filter(c=>c.url.includes('queue.fal.run')).length,0);
});

for(const choice of ['nano-banana','dev-edit'])test(choice+': concise recipe uses unchanged original, one generation and accurate version',async t=>{
 const e=env(),calls=mock(t,{nano:choice==='nano-banana'});
 const response=await router.fetch(req({choice,recipe:'concise'}),e,{}),data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data));assert.equal(data.promptVersion,'owner-identity-concise-v2');
 const posts=calls.filter(c=>c.url.includes('queue.fal.run')&&c.method==='POST');assert.equal(posts.length,1);
 const sent=JSON.parse(posts[0].body);assert.deepEqual(sent.image_urls,['data:image/jpeg;base64,'+DETAIL.toString('base64')]);
 assert.match(sent.prompt,/eye shape and spacing/);assert.match(sent.prompt,/Sunlit palace courtyard/);assert.match(sent.prompt,/A royal blue cape/);
 assert.doesNotMatch(sent.prompt,/Crop the lower body|frame a close head-and-upper-body/);
 assert.equal(await e.ARTWORK.get('system/providers/hq-fal.json'),null);
});
test('invalid recipe stops before any external call',async t=>{
 const calls=mock(t);const response=await router.fetch(req({recipe:'unknown'}),env(),{});
 assert.equal(response.status,400);assert.equal(calls.length,0);
});
