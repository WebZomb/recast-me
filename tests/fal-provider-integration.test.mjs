import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import router from '../src/router.js';
import {selectHighQualityProvider,estimateHighQualityCosts,providerStatus} from '../src/provider-routing.js';
import {Bucket,imageMock,MARKED,CLEAN} from './security-helpers.mjs';
import {moderationVerdict} from './safety-fixtures.mjs';
const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),PHOTO=fs.readFileSync(path.join(repoRoot,'public/assets/jack-russell-source-v18.webp')),OUTPUT=CLEAN;
const JOB='01a11f0c-a595-72d0-b36d-b0f5db2d96ef',BASE='https://queue.fal.run/fal-ai/flux-2';
const HOST='https://recast.test',cookieReq=cookie=>new Request(HOST+'/api/render-credits',{headers:{'cf-connecting-ip':'198.51.100.33',...(cookie?{cookie}:{})}});
function envConfig(overrides={}){return {ARTWORK:new Bucket(),IMAGES:imageMock(),ADMIN_TOKEN:'offline-owner',AI:{run:async()=>({image:OUTPUT.toString('base64')})},CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'offline-key',RENDER_CREDITS_ENABLED:'true',RENDER_CREDITS_STORAGE_SALT:'true',HQ_FREE_ALLOWANCE:'3',STANDARD_FREE_ALLOWANCE:'5',AI_DAILY_CALL_LIMIT:'70',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7',IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',IMAGE_HIGH_QUALITY_GUIDANCE:'5',IMAGE_HIGH_QUALITY_STEPS:'18',RECAST_HQ_PROVIDER:'fal',FAL_PROVIDER_ENABLED:'true',FAL_PROVIDER_VERIFIED:'true',FAL_API_KEY:'MOCK-FAL-KEY-NO-REAL-CREDENTIAL-12345',...overrides};}
async function initWallet(env){const r=await router.fetch(new Request(HOST+'/api/render-credits',{method:'POST',headers:{'x-recast-request':'1',origin:HOST,'cf-connecting-ip':'198.51.100.33'}}),env,{});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];}
function submission(cookie,id='FAL-TEST-00001',n=1){const form=new FormData();form.set('style','royal');form.set('subject','pet');form.set('notes','Royal blue cape and crown in grand palace courtyard');form.set('qualityMode','high');form.set('clientAttemptId',id);for(let i=0;i<n;i++)form.set('image_'+i,new File([PHOTO],'dog-'+i+'.webp',{type:'image/webp'}));return new Request(HOST+'/api/transform-v2',{method:'POST',headers:{cookie,'x-recast-request':'1',origin:HOST,'cf-connecting-ip':'198.51.100.33'},body:form});}
const content=()=>Response.json(moderationVerdict());
test('fal-shaped JPEG fixture: screened twice, 1 queue POST, private R2, watermark, saved versions, credit used once',async t=>{
 const calls=[],env=envConfig();
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  calls.push({url:String(url),method:options.method||'GET'});
  if(String(url).startsWith('https://api.openai.com/v1/moderations'))return content();
  if(String(url)==='https://queue.fal.run/fal-ai/flux-2/edit'){
   const json=JSON.parse(options.body);assert.equal(json.num_inference_steps,18);assert.equal(json.image_urls.length,1);assert.ok(json.prompt.length<2500);assert.match(json.prompt,/royal/i);assert.match(json.prompt,/Same actual pet: keep exact eyes/i);assert.equal(json.image_size.width,1024);
   assert.equal(new Headers(options.headers).get('X-Fal-No-Retry'),'1');assert.equal(new Headers(options.headers).get('X-Fal-Store-IO'),'0');
   return Response.json({request_id:JOB,status_url:BASE+'/requests/'+JOB+'/status',response_url:BASE+'/requests/'+JOB});
  }
  if(String(url)===BASE+'/requests/'+JOB+'/status')return Response.json({status:'COMPLETED'});
  if(String(url)===BASE+'/requests/'+JOB)return Response.json({images:[{width:1024,height:1280,url:'data:image/jpeg;base64,'+OUTPUT.toString('base64')}],has_nsfw_concepts:[false]});
  throw Error('Unallowed external request: '+url);
 });
 await env.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 const cookie=await initWallet(env);const result=await router.fetch(submission(cookie),env,{});const data=await result.json();
 assert.equal(result.status,200,JSON.stringify(data).slice(0,500));assert.equal(data.providerUsed,'fal');assert.equal(data.watermarked,true);
 assert.equal(data.image,'data:image/jpeg;base64,'+MARKED.toString('base64'));
 const meta=await(await env.ARTWORK.get('requests/'+data.requestId+'/request.json')).json();
 assert.equal(meta.providerUsed,'fal');assert.equal(meta.promptVersion,'identity-first-48-worlds-v1');
 assert.equal(meta.safety.inputScreening.status,'passed');assert.equal(meta.safety.outputScreening.status,'passed');
 const original=await env.ARTWORK.get('requests/'+data.requestId+'/preview.b64');assert.equal(await original.text(),OUTPUT.toString('base64'));
 const balanced=await(await router.fetch(cookieReq(cookie),env,{})).json();assert.equal(balanced.remaining,2);
 const saved=await router.fetch(new Request(HOST+'/api/request/'+data.requestId+'/preview?token='+data.accessToken),env,{});assert.equal((await saved.json()).image,data.image);
 assert.equal(calls.filter(c=>c.url==='https://queue.fal.run/fal-ai/flux-2/edit').length,1);
 assert.equal(calls.filter(c=>c.url==='https://api.openai.com/v1/moderations').length,2);
 const repeated=await router.fetch(submission(cookie),env,{});assert.equal(repeated.status,409);
 assert.equal(calls.filter(c=>c.url==='https://queue.fal.run/fal-ai/flux-2/edit').length,1);
});
test('fixed fal-first priority avoids price checks and uses Cloudflare only when fal is already unavailable',async()=>{
 const env=envConfig({RECAST_HQ_PROVIDER:'auto',CF_PROVIDER_VERIFIED:'true'});
 await env.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 await env.ARTWORK.put('system/providers/hq-cloudflare.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 const one=await submission('unused').formData();
 const four=await submission('unused','MULTI',4).formData();
 assert.equal((await selectHighQualityProvider(env,one)).host,'fal');
 assert.equal((await selectHighQualityProvider(env,four)).host,'fal');
 const prices=estimateHighQualityCosts({photos:4});assert.ok(prices.cloudflareUsd<prices.falUsd);
 await env.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'failed',reason:'unavailable',checkedAt:new Date().toISOString()}));
 const backup=await selectHighQualityProvider(env,four);assert.equal(backup.host,'cloudflare');assert.equal(backup.usingBackup,true);
 await env.ARTWORK.put('system/providers/hq-cloudflare.json',JSON.stringify({status:'failed',reason:'unavailable',checkedAt:new Date().toISOString()}));
 await assert.rejects(selectHighQualityProvider(env,one),{code:'render_providers_unavailable'});
});
test('disabled fal fails before payment and cannot silently fallback to a new model',async()=>{
 const env=envConfig({FAL_PROVIDER_ENABLED:'false'});
 const form=await submission('unused').formData();
 await assert.rejects(selectHighQualityProvider(env,form),{code:'render_provider_config'});
});
test('failed accepted fal request records one job, refunds credit, never submits a second paid provider',async t=>{
 const env=envConfig();let submits=0;
 await env.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  if(String(url).includes('/moderations'))return content();
  if(String(url)==='https://queue.fal.run/fal-ai/flux-2/edit'){submits++;return Response.json({request_id:JOB,status_url:BASE+'/requests/'+JOB+'/status',response_url:BASE+'/requests/'+JOB});}
  if(String(url).endsWith('/status'))return Response.json({status:'COMPLETED'});
  if(String(url)===BASE+'/requests/'+JOB)return Response.json({images:[{url:'https://public.example.com/untrusted-output.jpg',width:1024,height:1280}],has_nsfw_concepts:[false]});
  throw Error('Unexpected external call '+url);
 });
 const cookie=await initWallet(env),r=await router.fetch(submission(cookie,'FAIL-URL'),env,{});assert.equal(submits,1);assert.equal(r.status,500);const balance=await(await router.fetch(cookieReq(cookie),env,{})).json();assert.equal(balance.remaining,3);
 const objects=await env.ARTWORK.list({prefix:'system/providers/fal-jobs/'});assert.equal(objects.objects.length,1);
 const job=await(await env.ARTWORK.get(objects.objects[0].key)).json();assert.equal(job.status,'completed_output_unavailable');assert.equal(job.requestId,JOB);
});
