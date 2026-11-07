import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {EXPANSION_DESIGNS} from '../src/shop-expansion.js';
import {SMALL_GIFTS,ALL_SMALL_GIFTS,GIFT_BATCH_ITEMS,giftDefinition,giftMaster,giftsForArtwork,giftBatchKey,SINGLE_STICKER_PILOT} from '../src/shop-gift-definitions.js';
import {runGiftBatch,giftBatchStatus,verifyBatchSource} from '../src/shop-gift-batch.js';
import {smallGiftKey,freezeSmallGift,publishSmallGift,REVIEWED_SMALL_GIFT_SIGNATURES} from '../src/shop-small-gift-release.js';
import {nativeGiftFixture} from './gift-batch-fixtures.mjs';
import {verifiedPremadePrint} from '../src/premade-print.js';
import {shopRoutes} from '../src/shop-routes.js';
const json=(env,key,value)=>env.ARTWORK.put(key,JSON.stringify(value));
async function queueFixture(){
 const env={PREMADE_GIFT_BATCH_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};
 const offers=[];
 for(const source of EXPANSION_DESIGNS){
  await json(env,`requests/${source.requestId}/request.json`,{requestId:source.requestId,source:'premade-catalog',catalogDesignId:source.id,catalogMasterHash:source.sha256,catalogRightsConfirmedAt:'2026-11-03T00:00:00Z',contentSafety:{status:'approved'},accessToken:'private-fixture-'+source.id,width:1254,height:1254});
  offers.push({id:source.id+'-mug',designId:source.id,requestId:source.requestId,artworkRevision:source.sha256,status:'verified',proof:{provider:'printful',approved:true}});
 }
 await json(env,'shop/catalog/v1.json',{version:1,offers});
 for(const item of [...SMALL_GIFTS,SINGLE_STICKER_PILOT])await json(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`,{status:'complete',productId:item.catalogId,variants:[{sku:item.sku,area:{width:item.width,height:item.height,dpi:300}}]});
 return env;
}
const completed=async()=>Response.json({ok:true,status:'completed',images:[{url:'https://recastmeai.com/fixture-product-view'}]});
const frozen=async(_env,item)=>({id:item.id,status:'ready_for_review',offer:{id:item.id,designId:giftMaster(item).id}});
test('105 existing gifts plus one single-sticker trial retain the original three IDs and all 35 distinct source identities',()=>{
 assert.equal(SMALL_GIFTS.length,3);assert.equal(GIFT_BATCH_ITEMS.length,103);assert.equal(ALL_SMALL_GIFTS.length,106);
 assert.equal(new Set(ALL_SMALL_GIFTS.map(i=>i.id)).size,106);assert.equal(new Set(ALL_SMALL_GIFTS.map(i=>giftMaster(i).id)).size,35);
 assert.equal(GIFT_BATCH_ITEMS[0].id,'christmas-village-labrador-retriever-coaster-4pack');
 assert.equal(giftsForArtwork(EXPANSION_DESIGNS[1].id).length,3);
 assert.equal(giftsForArtwork('unknown'),null);assert.equal(giftDefinition('../private'),null);
 assert.throws(()=>giftMaster({...GIFT_BATCH_ITEMS[0],sku:'RECAST-BLANKET-50X60'}));
 assert.deepEqual(REVIEWED_SMALL_GIFT_SIGNATURES,{});
});
test('all 103 source-specific drafts freeze native masters against their own source, never Golden Retriever by accident',async()=>{
 const seen=new Set();
 for(const item of GIFT_BATCH_ITEMS){
  const fx=await nativeGiftFixture(item),state=await freezeSmallGift(fx.env,item,fx.pilot,fx);
  assert.equal(state.offer.designId,fx.source.id);assert.equal(state.offer.requestId,fx.source.requestId);assert.equal(state.offer.artworkRevision,fx.source.sha256);
  assert.equal(state.offer.sku,item.sku);assert.equal(state.status,'ready_for_review');
  const record=await (await fx.env.ARTWORK.get(`commerce/preapprovals/${fx.record.token}.json`)).json();
  assert.equal((await verifiedPremadePrint(fx.env,record)).finalHash,state.offer.proof.printFileHash);
  assert.equal((await verifiedPremadePrint(fx.env,record)).finalMime,item.mime);
  assert.equal(await publishSmallGift(fx.env,item,state),false);assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
  seen.add(state.offer.artworkRevision);
 }
 assert.equal(seen.size,35);
});
test('disabled batch performs no writes or provider operations',async()=>{
 const env={PREMADE_GIFT_BATCH_ENABLED:'false',ARTWORK:new Bucket(),IMAGES:{}};
 assert.deepEqual(await runGiftBatch(env,{create:()=>{throw Error('unexpected')}}),{enabled:false});assert.equal(env.ARTWORK.objects.size,0);
});
test('one tick creates at most two tasks; later ticks poll and freeze source-specific files without any publication',async()=>{
 const env=await queueFixture(),catalogBefore=await (await env.ARTWORK.get('shop/catalog/v1.json')).text(),calls=[];
 for(const item of SMALL_GIFTS)await json(env,smallGiftKey(item.id),{id:item.id,status:'published',marker:'preserve-live-original'});
 const create=async request=>{const data=await request.json();calls.push(data);return Response.json({ok:true,mockupId:'fixture-'+data.sku});};
 const dependencies={create,poll:completed,freeze:frozen,rate:async()=>true};
 let result=await runGiftBatch(env,dependencies);assert.equal(result.created,2);assert.equal(result.published,0);
 assert.ok(calls.every(c=>c.requestId===EXPANSION_DESIGNS[1].requestId));
 result=await runGiftBatch(env,dependencies);assert.equal(result.polled,2);assert.equal(result.prepared,2);assert.equal(result.created,2);assert.equal(result.published,0);
 assert.equal(await (await env.ARTWORK.get('shop/catalog/v1.json')).text(),catalogBefore);
 for(const item of SMALL_GIFTS)assert.equal((await (await env.ARTWORK.get(smallGiftKey(item.id))).json()).marker,'preserve-live-original');
 const progress=await giftBatchStatus(env);assert.equal(progress.totalProducts,106);assert.equal(progress.published,3);assert.equal(progress.readyForReview,2);assert.equal(progress.automaticPublication,false);
 assert.doesNotMatch(JSON.stringify(progress),/accessToken|approvalToken|private-fixture|mockupId|taskKey|supplierPictures/);
 const get=await shopRoutes(new Request('https://recast.test/api/shop/gift-batch'),env);assert.equal(get.status,200);assert.equal(get.headers.get('x-robots-tag'),'noindex, nofollow');
 assert.equal((await shopRoutes(new Request('https://recast.test/api/shop/gift-batch',{method:'POST'}),env)).status,405);
});
test('overlapping cron invocations share a lease and cannot double-create a design',async()=>{
 const env=await queueFixture(),calls=[];
 const deps={rate:async()=>true,create:async request=>{const data=await request.json();calls.push(data.requestId+'|'+data.sku);await Promise.resolve();return Response.json({ok:true,mockupId:'fixture'});}};
 const results=await Promise.all([runGiftBatch(env,deps),runGiftBatch(env,deps)]);
 assert.ok(results.some(r=>r.busy));assert.equal(calls.length,2);assert.equal(new Set(calls).size,2);
});
test('ambiguous provider acceptance is held and never automatically submitted again',async()=>{
 const env=await queueFixture();let calls=0;
 for(const item of GIFT_BATCH_ITEMS.slice(1))await json(env,giftBatchKey(item.id),{id:item.id,status:'frozen'});
 const deps={rate:async()=>true,create:async()=>{calls++;throw Error('private provider details must not leak');}};
 await runGiftBatch(env,deps);await runGiftBatch(env,deps);
 assert.equal(calls,1);const status=await giftBatchStatus(env);
 assert.equal(status.designs[1].items[0].status,'needs_review');assert.equal(status.designs[1].items[0].checkoutEnabled,false);
 assert.doesNotMatch(JSON.stringify(status),/private provider details/);
});
test('wrong source rights, revision, approved catalog or native print dimensions reject before mockup creation',async()=>{
 const fx=await queueFixture(),item=GIFT_BATCH_ITEMS[0],source=giftMaster(item);
 const meta=await (await fx.ARTWORK.get(`requests/${source.requestId}/request.json`)).json();
 const catalog=await (await fx.ARTWORK.get('shop/catalog/v1.json')).json();
 const report=await (await fx.ARTWORK.get(`shop/preparation/printfile-audit/v1/${item.catalogId}.json`)).json();
 assert.equal(verifyBatchSource(item,meta,catalog,report).id,source.id);
 for(const changes of [{catalogRightsConfirmedAt:null},{catalogMasterHash:EXPANSION_DESIGNS[0].sha256},{requestId:EXPANSION_DESIGNS[0].requestId},{contentSafety:null}])assert.throws(()=>verifyBatchSource(item,{...meta,...changes},catalog,report));
 assert.throws(()=>verifyBatchSource(item,meta,{offers:[]},report));
 assert.throws(()=>verifyBatchSource(item,meta,catalog,{...report,productId:999}));
});
test('shared provider rate denial produces no supplier claim or task',async()=>{
 const env=await queueFixture();let called=0;
 const result=await runGiftBatch(env,{rate:async()=>false,create:async()=>{called++;}});
 assert.equal(result.created,0);assert.equal(called,0);
 assert.equal(await env.ARTWORK.get(giftBatchKey(GIFT_BATCH_ITEMS[0].id)),null);
});

test('recovered Siamese pre-provider source holds resume once under the existing rate limit and preserve their audit records',async()=>{
 const env=await queueFixture();
 const targets=GIFT_BATCH_ITEMS.filter(i=>giftMaster(i).id==='christmas-village-siamese-cat');
 for(const item of GIFT_BATCH_ITEMS)await json(env,giftBatchKey(item.id),targets.includes(item)?{id:item.id,status:'needs_review',code:'gift_batch_source'}:{id:item.id,status:'frozen'});
 const before=await (await env.ARTWORK.get('shop/catalog/v1.json')).text();
 const calls=[];const deps={rate:async()=>true,poll:completed,freeze:frozen,create:async request=>{calls.push(await request.json());return Response.json({ok:true,mockupId:'siamese-first'});}};
 assert.equal((await runGiftBatch(env,deps)).created,2);
 assert.equal((await runGiftBatch(env,deps)).created,1);
 await runGiftBatch(env,deps);
 assert.equal(calls.length,3);assert.equal(new Set(calls.map(c=>c.sku)).size,3);
 for(const item of targets){
  assert.equal((await (await env.ARTWORK.get(`shop/recovery/siamese-gifts-20261106/${item.id}/original-hold.json`)).json()).code,'gift_batch_source');
  assert.equal((await (await env.ARTWORK.get(giftBatchKey(item.id))).json()).status,'frozen');
 }
 assert.equal(await (await env.ARTWORK.get('shop/catalog/v1.json')).text(),before);
});
test('Siamese source recovery never resumes an unreviewed source, prior task, uncertain creation, or changed hold',async()=>{
 for(const scenario of ['unreviewed','task','started','design','rate','lost-response','changed']){
  const env=await queueFixture(),item=GIFT_BATCH_ITEMS.find(i=>giftMaster(i).id==='christmas-village-siamese-cat'),source=giftMaster(item);
  for(const row of GIFT_BATCH_ITEMS)await json(env,giftBatchKey(row.id),{id:row.id,status:'frozen'});
  const hold={id:item.id,status:'needs_review',code:'gift_batch_source',...(scenario==='started'?{startedAt:'old'}:{}),...(scenario==='design'?{design:{}}:{})};
  await json(env,giftBatchKey(item.id),hold);
  if(scenario==='unreviewed')await json(env,'shop/catalog/v1.json',{offers:[]});
  if(scenario==='task')await json(env,`mockups/${source.requestId}/${item.sku}/old/task.json`,{});
  let calls=0;
  const deps={rate:async()=>{if(scenario==='changed')await json(env,giftBatchKey(item.id),{...hold,status:'owner_hold'});return scenario!=='rate';},create:async()=>{calls++;throw Error('unknown acceptance');}};
  await runGiftBatch(env,deps);await runGiftBatch(env,deps);
  assert.equal(calls,scenario==='lost-response'?1:0,scenario);
  if(scenario==='changed')assert.equal((await (await env.ARTWORK.get(giftBatchKey(item.id))).json()).status,'owner_hold');
 }
});

 test('single-sticker trial prepares only one exact Golden source and cannot publish itself',async()=>{
 const env=await queueFixture(),item=SINGLE_STICKER_PILOT,calls=[];
 for(const other of GIFT_BATCH_ITEMS.filter(x=>x.id!==item.id))await json(env,giftBatchKey(other.id),{id:other.id,status:'frozen'});
 const deps={rate:async()=>true,create:async request=>{calls.push(await request.json());return Response.json({ok:true,mockupId:'single-sticker-trial'});},poll:completed,freeze:frozen};
 const before=await (await env.ARTWORK.get('shop/catalog/v1.json')).text();
 await runGiftBatch(env,deps);await runGiftBatch(env,deps);await runGiftBatch(env,deps);
 assert.equal(calls.length,1);assert.equal(calls[0].sku,'RECAST-STICKER-3X3');assert.equal(calls[0].requestId,EXPANSION_DESIGNS[0].requestId);
 assert.equal(calls[0].design.product,'Sticker');assert.equal(calls[0].design.layout,'cover');
 assert.equal((await (await env.ARTWORK.get(smallGiftKey(item.id))).json()).status,'ready_for_review');
 assert.equal(await (await env.ARTWORK.get('shop/catalog/v1.json')).text(),before);
 assert.equal((await giftBatchStatus(env)).designs[0].items.length,4);
 });
