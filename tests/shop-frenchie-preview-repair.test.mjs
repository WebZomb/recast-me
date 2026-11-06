import test from 'node:test';import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {giftDefinition,giftMaster,giftBatchKey} from '../src/shop-gift-definitions.js';
import {hash} from '../src/commerce-store.js';
import {prepareFrenchiePreview,frenchiePreviewRepairRoute,FRENCHIE_ID} from '../src/shop-frenchie-preview-repair.js';
const root='shop/recovery/owner-frenchie-20261106/',item=giftDefinition(FRENCHIE_ID),source=giftMaster(item);
const put=(env,key,v)=>env.ARTWORK.put(key,JSON.stringify(v));const get=async(env,key)=>(await env.ARTWORK.get(key))?.json();
async function fixture(){
 const env={ARTWORK:new Bucket(),ADMIN_TOKEN:'fixture-secret'};
 const hold={id:item.id,status:'needs_review',code:'gift_batch_create',startedAt:'old-attempt'};
 await put(env,giftBatchKey(item.id),hold);await put(env,'shop/reconciliation/20261106/'+item.id+'.json',{status:'no_saved_task_evidence'});
 await put(env,`requests/${source.requestId}/request.json`,{requestId:source.requestId,source:'premade-catalog',catalogDesignId:source.id,catalogMasterHash:source.sha256,catalogRightsConfirmedAt:'2026-11-06',contentSafety:{status:'passed'},accessToken:'fixture-private',width:1254,height:1254});
 await env.ARTWORK.put(`requests/${source.requestId}/preview.b64`,'fixture-source');
 await put(env,'shop/catalog/v1.json',{offers:[{designId:source.id,requestId:source.requestId,artworkRevision:source.sha256,status:'verified',proof:{provider:'printful',approved:true}}]});
 await put(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`,{status:'complete',productId:item.catalogId,variants:[{sku:item.sku,area:{width:item.width,height:item.height,dpi:300}}]});
 return {env,hold};
}
const createFor=env=>async request=>{const b=await request.json();assert.equal(b.sku,item.sku);assert.equal(b.requestId,source.requestId);await put(env,`mockups/${source.requestId}/${item.sku}/fresh/task.json`,{taskKey:'private-task',mockupId:'fresh',requestId:source.requestId,sku:item.sku,printfulProductId:item.catalogId,printfulVariantId:item.variantId,design:b.design,sourceHash:await hash('fixture-source|'+JSON.stringify(b.design))});return Response.json({ok:true,mockupId:'fresh'});};
test('one explicit fresh mockup preserves original unknown attempt and cannot repeat or publish',async()=>{
 const {env,hold}=await fixture(),catalog=await get(env,'shop/catalog/v1.json');let calls=0;
 const create=async r=>{calls++;return createFor(env)(r);};
 assert.equal((await prepareFrenchiePreview(env,{create,rate:async()=>true})).status,'pending_preview');
 assert.deepEqual(await get(env,root+'original-hold.json'),hold);assert.equal((await get(env,root+'attempt.json')).priorProviderOutcome,'unknown');
 assert.deepEqual(await get(env,'shop/catalog/v1.json'),catalog);
 await assert.rejects(prepareFrenchiePreview(env,{create,rate:async()=>true}),/already recorded/);assert.equal(calls,1);
});
test('rate refusal, existing task, altered source and wrong hold prevent a new task',async()=>{
 for(const scenario of ['rate','task','source','hold']){
  const {env,hold}=await fixture();let calls=0;
  if(scenario==='task')await put(env,`mockups/${source.requestId}/${item.sku}/old/task.json`,{});
  if(scenario==='source')await put(env,'shop/catalog/v1.json',{offers:[]});
  if(scenario==='hold')await put(env,giftBatchKey(item.id),{...hold,code:'gift_batch_poll'});
  await assert.rejects(prepareFrenchiePreview(env,{create:()=>{calls++;},rate:async()=>scenario!=='rate'}));assert.equal(calls,0);
  assert.equal(await get(env,root+'attempt.json'),undefined);
 }
});
test('lost response remains held and is not automatically retried',async()=>{
 const {env,hold}=await fixture();let calls=0;const create=async()=>{calls++;throw Error('lost response');};
 await assert.rejects(prepareFrenchiePreview(env,{create,rate:async()=>true}));
 await assert.rejects(prepareFrenchiePreview(env,{create,rate:async()=>true}));
 assert.equal(calls,1);assert.deepEqual(await get(env,giftBatchKey(item.id)),hold);assert.equal((await get(env,root+'attempt.json')).status,'needs_review');
});
test('concurrent actions create once and a concurrent changed hold is never overwritten',async()=>{
 const {env}=await fixture();let calls=0;const create=async r=>{calls++;await put(env,giftBatchKey(item.id),{id:item.id,status:'manual_hold'});return createFor(env)(r);};
 await Promise.allSettled([prepareFrenchiePreview(env,{create,rate:async()=>true}),prepareFrenchiePreview(env,{create,rate:async()=>true})]);
 assert.equal(calls,1);assert.equal((await get(env,giftBatchKey(item.id))).status,'manual_hold');
});
test('owner route authenticates before reads and requires exact explicit acknowledgement',async()=>{
 const url='https://recast.test/api/admin/shop-source-repair/frenchie';
 const denied=await frenchiePreviewRepairRoute(new Request(url),{ADMIN_TOKEN:'secret',ARTWORK:{get(){throw Error('must not read');}}});assert.equal(denied.status,401);
 const {env}=await fixture();
 const response=await frenchiePreviewRepairRoute(new Request(url,{headers:{authorization:'Bearer fixture-secret'}}),env);assert.equal(response.status,200);assert.doesNotMatch(JSON.stringify(await response.json()),/fixture-secret|fixture-private|taskKey/);
 for(const origin of ['https://wrong.test','https://recast.test']){const r=await frenchiePreviewRepairRoute(new Request(url,{method:'POST',headers:{origin,authorization:'Bearer fixture-secret','x-recast-request':'1'},body:'{}'}),env);assert.ok([400,403].includes(r.status));}
 assert.equal(await get(env,root+'attempt.json'),undefined);
});
