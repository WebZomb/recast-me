import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bucket} from './security-helpers.mjs';
import {hash,recommendedCheckoutDesign} from '../src/commerce-store.js';
import {FULFILLMENT} from '../src/entry.js';
import {giftDefinition,giftMaster,giftBatchKey} from '../src/shop-gift-definitions.js';
import {smallGiftKey} from '../src/shop-small-gift-release.js';
import {HELD_TASK_IDS,reconcileOneHeldTask,runHeldTaskReconcile,heldTaskReconcileStatus,heldTaskReconcileRoute} from '../src/shop-held-task-reconcile.js';
const put=(env,key,value)=>env.ARTWORK.put(key,JSON.stringify(value));
const root='shop/reconciliation/20261106/';
async function fixture({id=HELD_TASK_IDS[0],status='pending',task=true}={}){
 const env={ARTWORK:new Bucket(),PREMADE_HELD_TASK_RECONCILE_ENABLED:'true'};
 const item=giftDefinition(id),source=giftMaster(item),design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
 const b64=Buffer.from('source-fixture-do-not-publish').toString('base64');
 const mockupId='exact-fixture-mockup',path=`mockups/${source.requestId}/${item.sku}/${mockupId}/task.json`;
 const meta={requestId:source.requestId,source:'premade-catalog',catalogDesignId:source.id,catalogMasterHash:source.sha256,catalogRightsConfirmedAt:'2026-11-03T00:00:00Z',contentSafety:{status:'approved'},accessToken:'private-fixture-access-token',width:1254,height:1254};
 await put(env,`requests/${source.requestId}/request.json`,meta);
 await env.ARTWORK.put(`requests/${source.requestId}/preview.b64`,b64);
 await put(env,'shop/catalog/v1.json',{version:1,offers:[{id:source.id+'-mug',designId:source.id,requestId:source.requestId,artworkRevision:source.sha256,status:'verified',proof:{provider:'printful',approved:true}}]});
 await put(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`,{status:'complete',productId:item.catalogId,variants:[{sku:item.sku,area:{width:item.width,height:item.height,dpi:300}}]});
 const state={id:item.id,status:'needs_review',code:id===HELD_TASK_IDS[0]?'gift_batch_poll':'gift_batch_create',design,...(id===HELD_TASK_IDS[0]?{mockupId}:{}),polls:2};
 await put(env,giftBatchKey(item.id),state);
 const record={requestId:source.requestId,sku:item.sku,mockupId,taskKey:'private-task-key',status,sourceHash:await hash(b64+'|'+JSON.stringify(design)),design,position:{area_width:item.width,area_height:item.height,width:item.width,height:item.height,top:0,left:0},printfulProductId:item.catalogId,printfulVariantId:item.variantId,...(status==='completed'?{images:[{title:'Front',url:'https://recast.test/private-supplier-image?token=private-preview'}]}:{})};
 if(task)await put(env,path,record);
 return {env,item,source,design,path,state,record,meta};
}
test('disabled reconciliation cannot touch records or call any provider',async()=>{
 const env={ARTWORK:new Bucket(),PREMADE_HELD_TASK_RECONCILE_ENABLED:'false'};
 assert.deepEqual(await runHeldTaskReconcile(env,{poll:()=>{throw Error('must not call')}}),{enabled:false});
 assert.equal(env.ARTWORK.objects.size,0);
 assert.equal(HELD_TASK_IDS.length,2);
 await assert.rejects(reconcileOneHeldTask(env,'../not-authorized'),/Unknown reconciliation target/);
});
test('a completed exact saved task resumes preparation with zero new supplier tasks or publication',async()=>{
 const fx=await fixture({status:'completed'}),before=await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).text();
 let polled=0;
 const result=await reconcileOneHeldTask(fx.env,fx.item.id,{poll:async()=>{polled++;throw Error('Already complete')}});
 assert.deepEqual(result,{acted:true,status:'existing_task_resumed'});
 const saved=await (await fx.env.ARTWORK.get(giftBatchKey(fx.item.id))).json();
 assert.equal(saved.status,'ready_for_review');assert.equal(saved.mockupId,fx.record.mockupId);
 assert.equal(saved.providerViewCount,1);assert.equal(polled,0);
 assert.deepEqual(await (await fx.env.ARTWORK.get(root+fx.item.id+'/original-hold.json')).json(),fx.state);
 assert.deepEqual(await (await fx.env.ARTWORK.get(root+fx.item.id+'/original-task.json')).json(),fx.record);
 assert.equal(await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).text(),before);
 assert.equal(await fx.env.ARTWORK.get(smallGiftKey(fx.item.id)),null);
 assert.deepEqual(await reconcileOneHeldTask(fx.env,fx.item.id),{acted:false,status:'already_examined'});
});
test('held create response can reconcile a unique saved task but does not infer a task when absent',async()=>{
 const fx=await fixture({id:HELD_TASK_IDS[1],status:'completed'});
 assert.equal((await reconcileOneHeldTask(fx.env,fx.item.id)).status,'existing_task_resumed');
 const missing=await fixture({id:HELD_TASK_IDS[1],task:false});let polled=0;
 assert.equal((await reconcileOneHeldTask(missing.env,missing.item.id,{poll:()=>{polled++;}})).status,'no_safe_task');
 assert.equal(polled,0);
 assert.equal((await (await missing.env.ARTWORK.get(giftBatchKey(missing.item.id))).json()).status,'needs_review');
 const journal=await (await missing.env.ARTWORK.get(root+missing.item.id+'.json')).json();
 assert.equal(journal.status,'no_saved_task_evidence');assert.equal(journal.providerCreateAllowed,false);
});
test('one existing provider GET can finish a transiently interrupted task, and no POST is sent',async()=>{
 const fx=await fixture();let polled=0;
 const poll=async request=>{
  polled++;assert.equal(request.method,'GET');
  const url=new URL(request.url);
  assert.equal(url.searchParams.get('sku'),fx.item.sku);
  assert.equal(url.searchParams.get('mockup'),fx.record.mockupId);
  assert.equal(url.searchParams.get('requestId'),fx.source.requestId);
  await put(fx.env,fx.path,{...fx.record,status:'completed',images:[{title:'Front',url:'https://recast.test/real-view?token=private-preview'}]});
  return Response.json({ok:true,status:'completed',images:[{url:'https://recast.test/real-view?token=private-preview'}]});
 };
 const result=await runHeldTaskReconcile(fx.env,{poll});
 assert.equal(result.status,'existing_task_resumed');assert.equal(polled,1);
 await runHeldTaskReconcile(fx.env,{poll});assert.equal(polled,1);
 const publicData=await heldTaskReconcileStatus(fx.env);
 assert.equal(publicData.supplierCreates,0);assert.equal(publicData.automaticPublication,false);
 assert.doesNotMatch(JSON.stringify(publicData),/private-fixture|private-preview|private-task-key|accessToken|sourceUrl|taskKey/);
});
test('confirmed provider failure stays held, with no automatic replacement request',async()=>{
 const fx=await fixture();let count=0;
 const poll=async()=>{count++;await put(fx.env,fx.path,{...fx.record,status:'failed',error:'image source unavailable private-token-value'});return Response.json({ok:false,status:'failed'},{status:502});};
 await runHeldTaskReconcile(fx.env,{poll});await runHeldTaskReconcile(fx.env,{poll});
 assert.equal(count,1);
 const journal=await (await fx.env.ARTWORK.get(root+fx.item.id+'.json')).json();
 assert.equal(journal.status,'supplier_confirmed_failed');assert.equal(journal.providerCreateAllowed,false);
 assert.deepEqual(await (await fx.env.ARTWORK.get(giftBatchKey(fx.item.id))).json(),fx.state);
 assert.doesNotMatch(JSON.stringify(await heldTaskReconcileStatus(fx.env)),/private-token-value/);
});
test('wrong source, wrong variant or duplicate saved tasks are not resumed',async()=>{
 for(const change of [{sourceHash:'f'.repeat(64)},{printfulVariantId:999999},{requestId:'RC-WRONG-SOURCE'}]){
  const fx=await fixture();await put(fx.env,fx.path,{...fx.record,...change});let polls=0;
  try{await reconcileOneHeldTask(fx.env,fx.item.id,{poll:()=>{polls++;}});}catch(error){assert.match(error.message,/Saved task/);}
  assert.equal(polls,0);assert.deepEqual(await (await fx.env.ARTWORK.get(giftBatchKey(fx.item.id))).json(),fx.state);
 }
 const duplicate=await fixture({id:HELD_TASK_IDS[1]});
 await put(duplicate.env,duplicate.path.replace('exact-fixture-mockup','other-task'),{...duplicate.record,mockupId:'other-task'});
 assert.equal((await reconcileOneHeldTask(duplicate.env,duplicate.item.id)).status,'no_safe_task');
});
test('concurrent reconciliation cannot double-poll and a changed hold cannot be overwritten',async()=>{
 const fx=await fixture();let calls=0;
 const poll=async()=>{calls++;await Promise.resolve();return Response.json({ok:true,status:'pending'});};
 const both=await Promise.all([runHeldTaskReconcile(fx.env,{poll}),runHeldTaskReconcile(fx.env,{poll})]);
 assert.ok(both.some(r=>r.busy));assert.equal(calls,1);
 const conflict=await fixture();
 await reconcileOneHeldTask(conflict.env,conflict.item.id,{poll:async()=>{await put(conflict.env,giftBatchKey(conflict.item.id),{...conflict.state,status:'manual_owner_hold'});return Response.json({ok:true,status:'pending'});}});
 assert.equal((await (await conflict.env.ARTWORK.get(giftBatchKey(conflict.item.id))).json()).status,'manual_owner_hold');
});
test('status endpoint is GET-only and does not trigger supplier work',async()=>{
 const fx=await fixture();
 const response=await heldTaskReconcileRoute(new Request('https://recast.test/api/shop/held-reconciliation'),fx.env);
 assert.equal(response.status,200);assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.equal((await response.json()).automaticPublication,false);
 assert.equal((await heldTaskReconcileRoute(new Request('https://recast.test/api/shop/held-reconciliation',{method:'POST'}),fx.env)).status,405);
 const code=readFileSync(new URL('../src/shop-held-task-reconcile.js',import.meta.url),'utf8');
 assert.doesNotMatch(code,/createMockup\(|\.delete\(|sendToProduction|publishSmallGift\(/);
});
