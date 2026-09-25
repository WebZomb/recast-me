import app from './entry.js';
import { highQualityTransform } from './highquality.js';
import { renderHealth } from './render-health.js';

const API = 'https://api.x.com/2';
const key = id => `social/x/${id}.json`;
const pending = id => `social/pending/${id}.json`;
const json = (data, status=200) => new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json','cache-control':'no-store'}});
const base = env => String(env.PUBLIC_APP_URL || '').replace(/\/$/,'');
const stamp = () => new Date().toISOString();
const hex = () => [...crypto.getRandomValues(new Uint8Array(20))].map(x=>x.toString(16).padStart(2,'0')).join('');
async function read(env, path) { const o=await env.ARTWORK.get(path); return o ? o.json() : null; }
async function write(env, path, data) { return env.ARTWORK.put(path,JSON.stringify(data),{httpMetadata:{contentType:'application/json'}}); }
function bytes64(value) { const b=atob(value); return Uint8Array.from(b,c=>c.charCodeAt(0)); }

export function directionFromMention(text, username) {
  const escaped=String(username).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const notes=String(text).replace(new RegExp(`@${escaped}\\b`,'ig'),'').replace(/https:\/\/t\.co\/\S+/g,'').trim().slice(0,1200);
  const style=/halloween|spooky|pumpkin/i.test(notes)?'halloween':/royal|king|queen|prince|princess/i.test(notes)?'royal':/space|astronaut/i.test(notes)?'space':/fantasy|wizard|knight/i.test(notes)?'fantasy':/comic|superhero/i.test(notes)?'comic':/future|cyberpunk/i.test(notes)?'future':/retro|1980|80s/i.test(notes)?'retro':'custom';
  const pet=/\b(dog|cat|pet|puppy|kitten)\b/i.test(notes);
  const people=/\b(me|myself|us|we|couple|family)\b/i.test(notes);
  return {notes,style,subject:pet?(people?'person and pet':'pet'):'person',customWorld:style==='custom'?notes:''};
}

export function attachedPhotos(tweet, media=[]) {
  const keys=new Set(tweet.attachments?.media_keys || []);
  return media.filter(m=>keys.has(m.media_key)&&m.type==='photo').map(m=>m.url).filter(raw=>{
    try {const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='pbs.twimg.com'&&u.pathname.startsWith('/media/');}catch{return false;}
  }).slice(0,4);
}

export function socialReadiness(env) {
  return {
    enabled:String(env.X_BOT_ENABLED)==='true',
    approved:String(env.X_BOT_APPROVED)==='true',
    credentials:Boolean(env.X_USER_ID&&env.X_USERNAME&&(env.X_USER_ACCESS_TOKEN||env.X_REFRESH_TOKEN&&env.X_CLIENT_ID)),
    tokenRefresh:Boolean(env.X_REFRESH_TOKEN&&env.X_CLIENT_ID),
    imageProcessing:Boolean(env.IMAGES),
    storage:Boolean(env.ARTWORK),
    ai:Boolean(env.AI)
  };
}

async function xAccessToken(env,force=false) {
  const saved=await read(env,'system/x-oauth.json');
  if(!force&&saved?.accessToken&&saved.expiresAt>Date.now()+60000)return saved.accessToken;
  const refreshToken=saved?.refreshToken||env.X_REFRESH_TOKEN;
  if(refreshToken&&env.X_CLIENT_ID){
    const headers={'content-type':'application/x-www-form-urlencoded'};
    const form=new URLSearchParams({grant_type:'refresh_token',refresh_token:refreshToken,client_id:env.X_CLIENT_ID});
    if(env.X_CLIENT_SECRET)headers.Authorization=`Basic ${btoa(`${encodeURIComponent(env.X_CLIENT_ID)}:${encodeURIComponent(env.X_CLIENT_SECRET)}`)}`;
    const response=await fetch(`${API}/oauth2/token`,{method:'POST',headers,body:form,signal:AbortSignal.timeout(15000)});
    const result=await response.json();
    if(!response.ok||!result.access_token)throw new Error('X token refresh failed. Reconnect the X app with offline.access.');
    await write(env,'system/x-oauth.json',{accessToken:result.access_token,refreshToken:result.refresh_token||refreshToken,expiresAt:Date.now()+(result.expires_in||7200)*1000});
    return result.access_token;
  }
  return env.X_USER_ACCESS_TOKEN;
}

async function xFetch(env,path,options={}) {
  const send=async token=>fetch(`${API}${path}`,{...options,signal:AbortSignal.timeout(25000),headers:{Authorization:`Bearer ${token}`,...options.headers}});
  const response=await send(await xAccessToken(env));
  if(response.status===401&&env.X_CLIENT_ID)return send(await xAccessToken(env,true));
  return response;
}

async function saveJob(env,job) {job.updatedAt=stamp(); await write(env,key(job.tweetId),job);}
async function finish(env,job,status) {job.replyStatus=status;await saveJob(env,job);await env.ARTWORK.delete(pending(job.tweetId));}

export async function ingestMentions(env) {
  const state=await read(env,'system/x-state.json')||{};
  const params=new URLSearchParams({max_results:'100','tweet.fields':'created_at,author_id,attachments','expansions':'attachments.media_keys','media.fields':'type,url'});
  if(state.sinceId)params.set('since_id',state.sinceId);
  if(state.pageToken)params.set('pagination_token',state.pageToken);
  const response=await xFetch(env,`/users/${encodeURIComponent(env.X_USER_ID)}/mentions?${params}`);
  const data=await response.json();
  if(!response.ok)throw new Error(`X mentions HTTP ${response.status}: ${data.detail||data.title||'Check API credentials and credits.'}`);
  let newest=state.newestId||state.sinceId;let found=0;
  for(const tweet of data.data||[]) {
    if(!newest||BigInt(tweet.id)>BigInt(newest))newest=tweet.id;
    if(tweet.author_id===String(env.X_USER_ID))continue;
    const direction=directionFromMention(tweet.text,env.X_USERNAME);
    if(/\b(stop|unsubscribe|opt out)\b/i.test(direction.notes)) {
      await write(env,`social/optout/${tweet.author_id}.json`,{at:stamp()});continue;
    }
    if(await read(env,`social/optout/${tweet.author_id}.json`))continue;
    // A bare tag or unrelated discussion is not an image request.
    if(!/\b(make|create|recast|transform|dress|generate|turn)\b/i.test(direction.notes))continue;
    if(await read(env,key(tweet.id)))continue;
    const job={tweetId:tweet.id,authorId:tweet.author_id,requestText:direction.notes,direction,photos:attachedPhotos(tweet,data.includes?.media),createdAt:stamp(),replyStatus:'queued',attempts:0};
    // Write queue marker first: a crash cannot leave a saved request unqueued.
    await write(env,pending(tweet.id),{tweetId:tweet.id});await saveJob(env,job);found++;
  }
  await write(env,'system/x-state.json',data.meta?.next_token
    ? {...state,pageToken:data.meta.next_token,newestId:newest,lastRun:stamp()}
    : {sinceId:newest||state.sinceId,pageToken:null,lastRun:stamp()});
  return found;
}

async function referencePhoto(env,url,index) {
  const u=new URL(url);
  if(u.protocol!=='https:'||u.hostname!=='pbs.twimg.com'||!u.pathname.startsWith('/media/'))throw new Error('Unsupported source photo URL.');
  u.searchParams.set('name','small');u.searchParams.set('format','jpg');
  const photo=await fetch(u,{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!photo.ok||!photo.headers.get('content-type')?.startsWith('image/'))throw new Error('The attached X photo is unavailable.');
  const prepared=(await env.IMAGES.input(photo.body).transform({width:500,height:500,fit:'scale-down'}).output({format:'image/jpeg',quality:90})).response();
  return new File([await prepared.arrayBuffer()],`reference-${index}.jpg`,{type:'image/jpeg'});
}

async function createPreview(env,job) {
  const stored=await env.ARTWORK.get(`requests/${job.requestId}/preview.b64`);
  if(!stored)throw new Error('Saved artwork is unavailable.');
  const mark=await env.ASSETS.fetch(new Request(`${base(env)}/assets/social-watermark.png`));
  if(!mark.ok)throw new Error('Preview watermark asset is missing.');
  const result=await env.IMAGES.input(new Blob([bytes64(await stored.text())]).stream())
    .transform({width:768,height:960,fit:'contain'})
    .draw(env.IMAGES.input(mark.body),{top:0,left:0})
    .output({format:'image/jpeg',quality:85});
  const response=result.response();if(!response.ok)throw new Error('Could not prepare the public preview.');
  job.shareId=job.shareId||hex();
  await env.ARTWORK.put(`social/previews/${job.shareId}.jpg`,await response.arrayBuffer(),{httpMetadata:{contentType:'image/jpeg'}});
  await write(env,`social/shares/${job.shareId}.json`,{requestId:job.requestId,tweetId:job.tweetId,createdAt:stamp()});
  job.link=`${base(env)}/recast.html?share=${job.shareId}`;
  job.previewReady=true;await saveJob(env,job);
}

async function postReply(env,job,text,mediaId) {
  // If a process dies during POST, do not send again: X has no idempotency key.
  job.replyStatus='sending';await saveJob(env,job);
  let response;
  try {
    response=await xFetch(env,'/tweets',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text,reply:{in_reply_to_tweet_id:job.tweetId},...(mediaId?{media:{media_ids:[mediaId]}}:{})})});
  } catch(error) {await finish(env,job,'delivery_unknown');throw error;}
  const data=await response.json().catch(()=>({}));
  if(response.ok&&data.data?.id){job.replyPostId=data.data.id;await finish(env,job,'replied');return;}
  job.error=`X reply HTTP ${response.status}: ${data.detail||data.title||'Unable to publish'}`;
  if(response.status===429){job.replyStatus='retry_wait';job.retryAt=new Date(Date.now()+15*60000).toISOString();await saveJob(env,job);return;}
  await finish(env,job,response.status>=500||response.ok?'delivery_unknown':'failed');
}

export async function processSocialJob(env,job) {
  if(['replied','delivery_unknown','failed','needs_review'].includes(job.replyStatus)){await env.ARTWORK.delete(pending(job.tweetId));return;}
  if(job.replyStatus==='sending'){await finish(env,job,'delivery_unknown');return;}
  if(job.retryAt&&Date.parse(job.retryAt)>Date.now())return;
  if(await read(env,`social/optout/${job.authorId}.json`)){await finish(env,job,'opted_out');return;}
  try {
    if(!job.photos.length) {
      const params=new URLSearchParams({source:'x',tweet:job.tweetId,request:job.requestText,style:job.direction.style});
      job.link=`${base(env)}/?${params}`;
      await postReply(env,job,`Please attach the photo you want transformed to a new request, or upload it privately here: ${job.link}`);return;
    }
    if(!env.IMAGES){job.replyStatus='configuration_required';job.error='Add the IMAGES binding for photo preparation and watermarked X previews.';await saveJob(env,job);return;}
    if(!job.requestId) {
      if((await renderHealth(env)).state==='paused'){
        job.replyStatus='awaiting_capacity';job.retryAt=new Date(Date.now()+5*60000).toISOString();await saveJob(env,job);return;
      }
      const form=new FormData();
      for(const [k,v] of Object.entries(job.direction))form.set(k,v);
      form.set('source','x');form.set('sourceTweet',job.tweetId);form.set('qualityMode','high');
      for(let i=0;i<job.photos.length;i++)form.set(`image_${i}`,await referencePhoto(env,job.photos[i],i));
      job.replyStatus='generating';await saveJob(env,job);
      const response=await highQualityTransform(new Request(`${base(env)}/api/transform-v2`,{method:'POST',body:form}),env,{trustedSocialJob:true});
      const rendered=await response.json();
      if(response.status===202||rendered.reason==='policy'||rendered.reason==='moderation'){job.error=rendered.userMessage;await finish(env,job,'needs_review');return;}
      if(!response.ok||!rendered.persisted) {
        job.error=rendered.userMessage||'Artwork could not be saved.';
        if(rendered.reason==='quota'){job.replyStatus='awaiting_capacity';job.retryAt=new Date(Date.now()+5*60000).toISOString();await saveJob(env,job);return;}
        throw new Error(job.error);
      }
      job.requestId=rendered.requestId;job.replyStatus='artwork_saved';job.error=null;await saveJob(env,job);
    }
    if(!job.previewReady)await createPreview(env,job);
    if(!job.mediaId||Date.parse(job.mediaExpiresAt)<=Date.now()) {
      const image=await env.ARTWORK.get(`social/previews/${job.shareId}.jpg`);
      const form=new FormData();form.set('media',new Blob([await image.arrayBuffer()],{type:'image/jpeg'}),'recast.jpg');form.set('media_category','tweet_image');
      const upload=await xFetch(env,'/media/upload',{method:'POST',body:form});const result=await upload.json();
      if(!upload.ok||!result.data?.id)throw new Error(`X media upload HTTP ${upload.status}. Check media.write scope and API credits.`);
      job.mediaId=result.data.id;job.mediaExpiresAt=new Date(Date.now()+(result.data.expires_after_secs||3600)*1000).toISOString();await saveJob(env,job);
    }
    await postReply(env,job,`Your AI Recast is ready! ✨ Want the clean high-resolution picture, a poster, or a coffee mug? Choose your favorite here: ${job.link}`,job.mediaId);
  } catch(error) {
    if(['replied','delivery_unknown','failed'].includes(job.replyStatus))return;
    job.attempts=(job.attempts||0)+1;job.error=String(error.message).slice(0,500);
    if(job.attempts>=3){await finish(env,job,'needs_review');return;}
    job.replyStatus='retry_wait';job.retryAt=new Date(Date.now()+job.attempts*60000).toISOString();await saveJob(env,job);
  }
}

export async function runSocialPipeline(env) {
  const ready=socialReadiness(env);
  if(!ready.enabled)return {ok:true,disabled:true};
  if(!ready.approved||!ready.credentials||!ready.storage||!ready.ai)return {ok:false,disabled:true,error:'X requires credentials, API access, approval, AI and private storage.',readiness:ready};
  const lockKey='system/x-pipeline-lock.json';
  const old=await env.ARTWORK.get(lockKey);
  if(old&&Date.parse((await old.json()).until)>Date.now())return {ok:true,busy:true};
  const lock=await env.ARTWORK.put(lockKey,JSON.stringify({until:new Date(Date.now()+15*60000).toISOString()}),{onlyIf:old?{etagMatches:old.etag}:new Headers({'If-None-Match':'*'})});
  if(!lock)return {ok:true,busy:true};
  try {
    let found=0,intakeError=null;
    try{found=await ingestMentions(env);}catch(error){intakeError=error.message;}
    const queue=await env.ARTWORK.list({prefix:'social/pending/',limit:100});
    const batch=Math.max(1,Math.min(2,Number(env.X_RENDER_BATCH_SIZE)||2));let processed=0;
    for(const item of queue.objects||[]) {
      if(processed>=batch)break;
      const marker=await read(env,item.key);const job=marker&&await read(env,key(marker.tweetId));
      if(!job){await env.ARTWORK.delete(item.key);continue;}
      if(job.retryAt&&Date.parse(job.retryAt)>Date.now())continue;
      await processSocialJob(env,job);processed++;
    }
    return {ok:!intakeError,found,processed,intakeError};
  } finally {await env.ARTWORK.delete(lockKey);}
}

export async function socialRoutes(request,env,ctx) {
  const url=new URL(request.url);const match=url.pathname.match(/^\/api\/social\/([a-f0-9]{40})(?:\/(image|products|checkout))?$/);
  if(!match)return null;
  const [,id,action]=match;
  if(!env.ARTWORK)return json({error:'Artwork unavailable.'},503);
  const shared=await read(env,`social/shares/${id}.json`);
  const meta=shared&&await read(env,`requests/${shared.requestId}/request.json`);
  if(!meta)return json({error:'This Recast is unavailable.'},404);
  if(!action&&request.method==='GET')return json({ok:true,styleName:meta.styleName,image:`/api/social/${id}/image`,requestId:meta.requestId});
  if(action==='image'&&request.method==='GET'){
    const preview=await env.ARTWORK.get(`social/previews/${id}.jpg`);
    return preview?new Response(preview.body,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=300'}}):json({error:'Preview unavailable.'},404);
  }
  // These two bridges grant purchase access only. Private artwork/source tokens never leave the server.
  if(action==='products'&&request.method==='GET'){
    const inner=new URL('/api/checkout-options',url.origin);inner.search=new URLSearchParams({requestId:meta.requestId,token:meta.accessToken});
    return app.fetch(new Request(inner),env,ctx);
  }
  if(action==='checkout'&&request.method==='POST'){
    const body=await request.json().catch(()=>({}));
    return app.fetch(new Request(new URL('/api/checkout-link',url.origin),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:meta.requestId,accessToken:meta.accessToken,sku:String(body.sku||'')})}),env,ctx);
  }
  return json({error:'Method not allowed.'},405);
}
