import test from 'node:test';import assert from 'node:assert/strict';
import {runFalEdit} from '../src/fal-service.js';import {standardOutageEligible,readinessSnapshot} from '../src/render-health.js';
import {Bucket,CLEAN,imageMock} from './security-helpers.mjs';
const ROOT='https://queue.fal.run/fal-ai/flux-2', ID='01a11f14-bd12-7083-aa72-2e494db231a0',MODEL='@cf/black-forest-labs/flux-2-dev';
function form(){const f=new FormData();f.set('prompt','The same pet in a realistic palace courtyard');f.set('width','1024');f.set('height','1280');f.set('steps','18');f.set('guidance','5');f.set('input_image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));const body=new Response(f);return {multipart:{body:body.body,contentType:body.headers.get('content-type')}}}
function env(){return {ARTWORK:new Bucket(),IMAGES:imageMock(),AI:{run:async()=>{throw Error('No Cloudflare inference allowed')}},IMAGE_MODEL_HIGH_QUALITY:MODEL,FAL_PROVIDER_ENABLED:'true',FAL_PROVIDER_VERIFIED:'true',CF_PROVIDER_VERIFIED:'true',FAL_API_KEY:'offline-test-token-not-real',RECAST_HQ_PROVIDER:'auto'}};
test('Accepted, uncertain fal queue job stays pending; no automatic second inference or Standard downgrade',async t=>{
 const e=env();let submits=0;
 t.mock.method(globalThis,'fetch',async(url)=>{
  const u=String(url);
  if(u==='https://queue.fal.run/fal-ai/flux-2/edit'){submits++;return Response.json({request_id:ID,status_url:ROOT+'/requests/'+ID+'/status',response_url:ROOT+'/requests/'+ID});}
  if(u===ROOT+'/requests/'+ID+'/status')return Response.json({message:'upstream not ready'},{status:503});
  throw Error('Unexpected network route '+u);
 });
 await assert.rejects(runFalEdit(e,MODEL,form()),{reason:'pending',pendingRequestId:ID});
 assert.equal(submits,1); // No retry and no Cloudflare second submit.
 const index=await e.ARTWORK.list({prefix:'system/providers/fal-jobs/'});assert.equal(index.objects.length,1);
 const job=await(await e.ARTWORK.get(index.objects[0].key)).json();
 assert.equal(job.status,'accepted_unknown_outcome');assert.equal(job.requestId,ID);
 const fal=await(await e.ARTWORK.get('system/providers/hq-fal.json')).json();
 assert.equal(fal.status,'pending');assert.equal(fal.reason,'awaiting_result');
 await e.ARTWORK.put('system/providers/hq-cloudflare.json',JSON.stringify({status:'failed',reason:'unavailable',lastFailureAt:new Date().toISOString()}));
 const health=await readinessSnapshot(e);assert.equal(health.modes.high.ready,false);assert.equal(health.standardOutageAvailable,false);
 await assert.rejects(runFalEdit({...e,RECAST_PROVIDER_ATTEMPT_ID:index.objects[0].key.split('/').at(-1).slice(0,-5)},MODEL,form()),{reason:'configuration'});
 assert.equal(submits,1);
});
test('Provider content refusal does not disable the entire fal renderer or prompt a Standard downgrade',async t=>{
 const e=env();let submits=0;
 t.mock.method(globalThis,'fetch',async(url)=>{
  const u=String(url);
  if(u==='https://queue.fal.run/fal-ai/flux-2/edit'){submits++;return Response.json({request_id:ID,status_url:ROOT+'/requests/'+ID+'/status',response_url:ROOT+'/requests/'+ID});}
  if(u===ROOT+'/requests/'+ID+'/status')return Response.json({status:'COMPLETED'});
  if(u===ROOT+'/requests/'+ID)return Response.json({has_nsfw_concepts:[true],images:[{url:'data:image/jpeg;base64,'+CLEAN.toString('base64'),width:1024,height:1280}]});
  throw Error('Unexpected network route '+u);
 });
 await assert.rejects(runFalEdit(e,MODEL,form()),{reason:'moderation'});
 assert.equal(submits,1);
 const active=await e.ARTWORK.get('system/providers/hq-fal.json');assert.equal(active,null);
 const jobs=await e.ARTWORK.list({prefix:'system/providers/fal-jobs/'});const job=await(await e.ARTWORK.get(jobs.objects[0].key)).json();
 assert.equal(job.status,'completed_output_unavailable');
 assert.equal(await standardOutageEligible(e),false);
});
import router from '../src/router.js';
import {moderationVerdict} from './safety-fixtures.mjs';

test('Actual Recast route tells customer accepted fal job is under review and disables retry',async t=>{
 const e=env();e.CONTENT_MODERATION_ENABLED='true';e.MODERATION_OPENAI_API_KEY='mock-only';e.CF_PROVIDER_VERIFIED='false';
 await e.ARTWORK.put('system/providers/hq-cloudflare.json',JSON.stringify({status:'failed',reason:'unavailable',lastFailureAt:new Date().toISOString()}));
 let submits=0;
 await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 t.mock.method(globalThis,'fetch',async(url)=>{
  const u=String(url);
  if(u==='https://api.openai.com/v1/moderations')return Response.json(moderationVerdict());
  if(u==='https://queue.fal.run/fal-ai/flux-2/edit'){submits++;return Response.json({request_id:ID,status_url:ROOT+'/requests/'+ID+'/status',response_url:ROOT+'/requests/'+ID});}
  if(u===ROOT+'/requests/'+ID+'/status')return Response.json({message:'please wait'},{status:503});
  throw Error('No unexpected external services '+u);
 });
 const f=new FormData();f.set('style','royal');f.set('subject','pet');f.set('qualityMode','high');f.set('notes','Blue cape royal scene');f.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));f.set('clientAttemptId','PENDING-API-001');
 const res=await router.fetch(new Request('https://recast.test/api/transform-v2',{method:'POST',headers:{'x-recast-request':'1',origin:'https://recast.test'},body:f}),e,{});
 const data=await res.json();assert.equal(res.status,503,JSON.stringify(data));assert.equal(data.reason,'pending');assert.equal(data.retryable,false);assert.match(data.userMessage,/do not retry/i);assert.equal(submits,1);
 const readiness=await(await router.fetch(new Request('https://recast.test/api/render-readiness'),e,{})).json();assert.equal(readiness.modes.high.ready,false);assert.equal(readiness.standardOutageAvailable,false);
});
