import test from 'node:test';import assert from 'node:assert/strict';
import router from '../src/router.js';import {Bucket,CLEAN,imageMock,MARKED} from './security-helpers.mjs';import {moderationVerdict} from './safety-fixtures.mjs';
const ROOT='https://recast.test',ID='01a11f14-bd12-7083-aa72-2e494db231a0';
function request(admin=true){
 const form=new FormData();form.set('ownerProvider','fal');form.set('style','royal');form.set('subject','pet');form.set('notes','Blue cape and a palace background');form.set('qualityMode','high');form.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));form.set('clientAttemptId','OWNER-FAL-TEST-001');
 return new Request(ROOT+'/api/admin/model-test?model=dev',{method:'POST',headers:admin?{authorization:'Bearer fake-admin'}:{},body:form});
}
test('owner-only pilot requires admin and can use fal without changing public model',async t=>{
 const env={ARTWORK:new Bucket(),IMAGES:imageMock(),ADMIN_TOKEN:'fake-admin',CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'mock-key',AI:{run:async()=>({image:CLEAN.toString('base64')})},FAL_API_KEY:'mock-fal-key-more-than-20-chars',FAL_OWNER_TEST_ENABLED:'true',RECAST_HQ_PROVIDER:'cloudflare',IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',IMAGE_HIGH_QUALITY_STEPS:'18',IMAGE_HIGH_QUALITY_GUIDANCE:'5',RENDER_CREDITS_ENABLED:'false'};
 let submits=0;
 t.mock.method(globalThis,'fetch',async(url)=>{
  if(String(url).endsWith('/moderations'))return Response.json(moderationVerdict());
  if(String(url)==='https://queue.fal.run/fal-ai/flux-2/edit'){submits++;return Response.json({request_id:ID,status_url:'https://queue.fal.run/fal-ai/flux-2/requests/'+ID+'/status',response_url:'https://queue.fal.run/fal-ai/flux-2/requests/'+ID});}
  if(String(url).endsWith('/status'))return Response.json({status:'COMPLETED'});
  if(String(url).endsWith('/requests/'+ID))return Response.json({images:[{width:1024,height:1280,url:'data:image/jpeg;base64,'+CLEAN.toString('base64')}],has_nsfw_concepts:[false]});
  throw Error('Unexpected '+url);
 });
 const forbidden=await router.fetch(request(false),env,{});assert.equal(forbidden.status,401);
 const owner=await router.fetch(request(),env,{}),data=await owner.json();assert.equal(owner.status,200,JSON.stringify(data));assert.equal(data.providerUsed,'fal');assert.equal(data.watermarked,true);assert.equal(data.image,'data:image/jpeg;base64,'+MARKED.toString('base64'));assert.equal(submits,1);
 assert.equal(env.RECAST_HQ_PROVIDER,'cloudflare');assert.equal(env.FAL_PROVIDER_ENABLED,undefined);
});
import fs from 'node:fs';

test('Owner can explicitly test Cloudflare HQ even when fal would win public auto selection',async t=>{
 const env={ARTWORK:new Bucket(),IMAGES:imageMock(),ADMIN_TOKEN:'fake-admin',
  CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'offline',
  FAL_PROVIDER_ENABLED:'true',FAL_PROVIDER_VERIFIED:'true',FAL_API_KEY:'MOCK-FAL-OWNER-ONLY-NOT-REAL-KEY',
  RECAST_HQ_PROVIDER:'auto',CF_PROVIDER_VERIFIED:'false',
  IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',
  IMAGE_HIGH_QUALITY_STEPS:'18',IMAGE_HIGH_QUALITY_GUIDANCE:'5',
  RENDER_CREDITS_ENABLED:'false',AI_DAILY_CALL_LIMIT:'70',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7',
  AI:{run:async(model)=>{assert.equal(model,'@cf/black-forest-labs/flux-2-dev');return {image:CLEAN.toString('base64')}}}};
 const calls=[];
 t.mock.method(globalThis,'fetch',async(url)=>{calls.push(String(url));if(String(url)==='https://api.openai.com/v1/moderations')return Response.json(moderationVerdict());throw Error('Owner chose Cloudflare: no fal or other external endpoint allowed '+url)});
 const form=new FormData();form.set('ownerProvider','cloudflare');form.set('style','royal');form.set('subject','pet');form.set('notes','High Quality comparison photo');form.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));form.set('clientAttemptId','OWNER-CF-TEST-001');
 const res=await router.fetch(new Request('https://recast.test/api/admin/model-test?model=dev',{method:'POST',headers:{authorization:'Bearer fake-admin'},body:form}),env,{});
 const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));assert.equal(data.providerUsed,'cloudflare');assert.equal(data.watermarked,true);
 assert.equal(calls.length,2);const read=await env.ARTWORK.get('system/providers/hq-cloudflare.json');assert.equal((await read.json()).status,'success');
 const html=fs.readFileSync(new URL('../public/model-lab.js',import.meta.url),'utf8');assert.match(html,/ownerProvider.*cloudflare/);
});
