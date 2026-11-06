import test from 'node:test';
import assert from 'node:assert/strict';
import {nativeGiftFixture} from './gift-batch-fixtures.mjs';
import {GIFT_BATCH_ITEMS,giftBatchKey,giftMaster} from '../src/shop-gift-definitions.js';
import {recheckGiftPoll} from '../src/shop-gift-poll-recheck.js';
import {runGiftBatch} from '../src/shop-gift-batch.js';
import {freezeSmallGift,smallGiftKey} from '../src/shop-small-gift-release.js';
const audit=id=>'shop/preparation/gift-poll-rechecks/v1/'+id+'.json';
async function setup(){
 const item=GIFT_BATCH_ITEMS.find(x=>x.id==='christmas-village-poodle-sticker-sheet-six');
 const fx=await nativeGiftFixture(item);fx.env.PREMADE_GIFT_POLL_RECHECK_ENABLED='true';
 const state={id:item.id,status:'needs_review',code:'gift_batch_poll',sourceRevision:fx.source.sha256,mockupId:fx.task.mockupId,design:fx.task.design,polls:2,checkedAt:'2026-11-05T20:00:00Z'};
 const taskKey=`mockups/${fx.source.requestId}/${item.sku}/${state.mockupId}/task.json`;
 await fx.put(taskKey,{...fx.task,status:'pending',images:[]});
 await fx.put(giftBatchKey(item.id),state);
 const meta=await (await fx.env.ARTWORK.get(`requests/${fx.source.requestId}/request.json`)).json();
 return {...fx,item,state,meta,taskKey};
}
test('disabled and non-poll failures never read provider or reset task claims',async()=>{
 const fx=await setup();let calls=0;const poll=async()=>{calls++;throw Error('not allowed')};
 fx.env.PREMADE_GIFT_POLL_RECHECK_ENABLED='false';
 assert.equal((await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll})).attempted,false);
 fx.env.PREMADE_GIFT_POLL_RECHECK_ENABLED='true';
 for(const patch of [{code:'gift_batch_create'},{status:'creating_preview'},{mockupId:'../private'},{sourceRevision:'0'.repeat(64)},{polls:20}]){
  assert.equal((await recheckGiftPoll(fx.env,fx.item,{...fx.state,...patch},fx.meta,{poll})).attempted,false);
 }
 assert.equal(calls,0);assert.equal(await fx.env.ARTWORK.get(audit(fx.item.id)),null);
});
test('one existing-task GET recovers views without new provider creation, sale or native-file substitution',async()=>{
 const fx=await setup();let polls=0;
 const poll=async request=>{
  polls++;assert.equal(request.method,'GET');
  const u=new URL(request.url);assert.equal(u.pathname,'/api/mockup/status');
  assert.equal(u.searchParams.get('mockup'),fx.state.mockupId);
  assert.equal(u.searchParams.get('requestId'),fx.source.requestId);
  assert.equal(u.searchParams.get('sku'),fx.item.sku);
  return Response.json({ok:true,status:'completed',images:fx.task.images});
 };
 const result=await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll});
 assert.equal(result.attempted,true);assert.equal(polls,1);
 assert.equal(result.state.status,'ready_for_review');assert.equal(result.state.mockupId,fx.state.mockupId);
 assert.equal(result.state.sourceRevision,fx.source.sha256);assert.equal(result.state.polls,3);
 assert.equal(result.state.pollRecheckVersion,1);assert.equal(result.state.providerViewCount,1);
 assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
 assert.equal(await fx.env.ARTWORK.get(smallGiftKey(fx.item.id)),null);
 assert.equal((await (await fx.env.ARTWORK.get(audit(fx.item.id))).json()).status,'existing_views_recovered');
 await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll});assert.equal(polls,1);
});
test('confirmed failed provider task is recorded and never recreated or repeatedly polled',async()=>{
 const fx=await setup();await fx.put(fx.taskKey,{...fx.task,status:'failed'});let polls=0;
 const poll=async()=>{polls++;throw Error('no provider read needed')};
 const r=await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll});
 assert.equal(r.attempted,false);assert.equal(r.state.status,'needs_review');
 assert.equal((await (await fx.env.ARTWORK.get(audit(fx.item.id))).json()).status,'supplier_task_failed');
 await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll});assert.equal(polls,0);
});
test('network uncertainty consumes the one recheck, holds original state, and never leaks provider errors',async()=>{
 const fx=await setup();let polls=0;
 const poll=async()=>{polls++;throw Error('PRIVATE_SECRET_URL?token=hidden')};
 await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll});
 await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll});
 assert.equal(polls,1);
 assert.deepEqual(await (await fx.env.ARTWORK.get(giftBatchKey(fx.item.id))).json(),fx.state);
 assert.doesNotMatch(await (await fx.env.ARTWORK.get(audit(fx.item.id))).text(),/PRIVATE_SECRET|token=hidden/);
});
test('wrong source, supplier SKU and frozen file stop before provider reads; no review gates weakened',async()=>{
 for(const kind of ['source','sku','release']){
  const fx=await setup();let calls=0;
  if(kind==='source')fx.meta.catalogMasterHash='a'.repeat(64);
  if(kind==='sku')await fx.put(fx.taskKey,{...fx.task,sku:'RECAST-MAGNET-SET'});
  if(kind==='release')await fx.put(smallGiftKey(fx.item.id),{id:fx.item.id,status:'published',marker:'preserve'});
  const result=await recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll:async()=>{calls++;}});
  assert.equal(result.attempted,false);assert.equal(calls,0);assert.equal(await fx.env.ARTWORK.get(audit(fx.item.id)),null);
 }
});
test('concurrent rechecks share a durable claim and changed task state is never overwritten',async()=>{
 const fx=await setup();let calls=0;
 const poll=async()=>{calls++;await Promise.resolve();return Response.json({ok:true,status:'pending'});};
 await Promise.all([recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll}),recheckGiftPoll(fx.env,fx.item,fx.state,fx.meta,{poll})]);
 assert.equal(calls,1);
 const later=await setup();const changed={...later.state,status:'frozen',marker:'newer-wins'};
 await recheckGiftPoll(later.env,later.item,later.state,later.meta,{poll:async()=>{await later.put(giftBatchKey(later.item.id),changed);return Response.json({ok:true,status:'completed',images:later.task.images});}});
 assert.deepEqual(await (await later.env.ARTWORK.get(giftBatchKey(later.item.id))).json(),changed);
});
test('existing queue recovers exact saved proof into manual review, preserving catalog and respecting polling bound',async()=>{
 const fx=await setup();
 const catalog={version:1,offers:[{id:'existing-reviewed-mug',designId:fx.source.id,requestId:fx.source.requestId,artworkRevision:fx.source.sha256,status:'verified',proof:{provider:'printful',approved:true}}]};
 await fx.put('shop/catalog/v1.json',catalog);
 for(const item of GIFT_BATCH_ITEMS)if(item.id!==fx.item.id)await fx.put(giftBatchKey(item.id),{id:item.id,status:'frozen'});
 let creates=0;
 const result=await runGiftBatch(fx.env,{
  create:async()=>{creates++;throw Error('No new task allowed')},rate:async()=>{throw Error('No create rate slot allowed')},
  poll:async()=>{await fx.put(fx.taskKey,fx.task);return Response.json({ok:true,status:'completed',images:fx.task.images});},
  freeze:async(env,item,state)=>freezeSmallGift(env,item,state,fx)
 });
 assert.equal(creates,0);assert.equal(result.polled,1);assert.equal(result.prepared,1);assert.equal(result.published,0);
 const prepared=await (await fx.env.ARTWORK.get(smallGiftKey(fx.item.id))).json();
 assert.equal(prepared.status,'ready_for_review');assert.equal(prepared.offer.designId,giftMaster(fx.item).id);
 assert.deepEqual(await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).json(),catalog);
});
