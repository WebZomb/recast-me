import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {SMALL_GIFTS,REVIEWED_SMALL_GIFT_SIGNATURES,verifySmallGiftArea,freezeSmallGift,smallGiftSignature,publishSmallGift,runSmallGiftRelease,smallGiftKey,smallGiftReleaseStatus} from '../src/shop-small-gift-release.js';
import {EXPANSION_DESIGNS} from '../src/shop-expansion.js';
import {FULFILLMENT} from '../src/entry.js';
import {hash,recommendedCheckoutDesign,stickerSheetBoxes} from '../src/commerce-store.js';
import {hashBytes,SHOP_CATALOG_KEY} from '../src/shop-catalog-store.js';
import {verifiedPremadePrint} from '../src/premade-print.js';
import {shopRoutes} from '../src/shop-routes.js';
const master=EXPANSION_DESIGNS[0];
const json=async(env,key,value)=>env.ARTWORK.put(key,JSON.stringify(value));
async function fixture(item){
 const env={PREMADE_SMALL_GIFT_RELEASE_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{info:async()=>({width:1254,height:1254})}};
 const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
 const source=new Uint8Array(128);source.set([137,80,78,71,13,10,26,10]);
 const encoded=btoa(String.fromCharCode(...source));
 const sourceHash=await hash(encoded),proofHash=await hash(encoded+'|'+JSON.stringify(design));
 const token='a'.repeat(48),snapshotKey='commerce/snapshots/test-source.b64';
 const position={area_width:item.width,area_height:item.height,width:item.width,height:item.height,top:0,left:0};
 const record={token,requestId:master.requestId,sku:item.sku,mockupId:'saved-proof-v1',approvalMode:'product-mockup',sourceHash,proofHash,position,design,snapshotKey,previewToken:token,approvedAt:'2026-11-04T18:00:00Z'};
 await json(env,`requests/${master.requestId}/request.json`,{requestId:master.requestId,source:'premade-catalog',catalogDesignId:master.id,catalogMasterHash:master.sha256,catalogRightsConfirmedAt:'2026-11-03T00:00:00Z',accessToken:'not-exported',width:1254,height:1254,previewMime:'image/png'});
 const report={status:'complete',productId:item.catalogId,variants:[{sku:item.sku,area:{width:item.width,height:item.height,dpi:300}}]};
 await json(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`,report);
 const pilot={status:'ready_for_review',mockupId:record.mockupId,design};
 await json(env,item.pilot,pilot);
 await json(env,`mockups/${master.requestId}/${item.sku}/${record.mockupId}/task.json`,{status:'completed',requestId:master.requestId,sku:item.sku,taskKey:'Printful-task-123',printfulVariantId:item.variantId,sourceHash:proofHash,position,design});
 await env.ARTWORK.put(snapshotKey,encoded);
 await json(env,`commerce/preapprovals/${token}.json`,record);
 const prepare=async(request)=>{
  const input=await request.json();assert.equal(input.sku,item.sku);assert.equal(input.mockupId,pilot.mockupId);assert.equal(input.skipMockup,undefined);
  return {checkoutApproval:record,row:{variantId:'gid://shopify/ProductVariant/123456',price:'24.99'},approvedPreview:{imageUrl:'https://recast.test/api/approved-preview/'+token,images:[]}};
 };
 const compose=async(_e,_b,_i,area,map,choice,width)=>{
  assert.equal(width,item.width);assert.equal(area.width,item.width);assert.equal(map.printfulVariantId,item.variantId);assert.deepEqual(choice,design);
  const bytes=new Uint8Array(160);bytes.set(item.mime==='image/png'?[137,80,78,71,13,10,26,10]:[255,216,255]);
  return {bytes,mime:item.mime,outputSize:{width:item.width,height:item.height},...(item.mime==='image/png'?{artworkBoxes:stickerSheetBoxes({width:1254,height:1254},item.width,item.height)}:{})};
 };
 return {env,report,pilot,record,prepare,compose};
}
test('only three exact source-pinned small gifts are eligible; no uninspected signatures exist',()=>{
 assert.equal(SMALL_GIFTS.length,3);
 assert.deepEqual(REVIEWED_SMALL_GIFT_SIGNATURES,{});
 assert.equal(SMALL_GIFTS.find(x=>x.product==='sticker-sheet').mime,'image/png');
 for(const item of SMALL_GIFTS)assert.equal(FULFILLMENT[item.sku].printfulVariantId,item.variantId);
});
test('native supplier dimensions and source pixel sizes cannot be silently enlarged or substituted',()=>{
 for(const item of SMALL_GIFTS){
  const report={status:'complete',productId:item.catalogId,variants:[{sku:item.sku,area:{width:item.width,height:item.height,dpi:300}}]};
  assert.deepEqual(verifySmallGiftArea(item,report,{width:1254,height:1254}),{width:item.width,height:item.height});
  assert.throws(()=>verifySmallGiftArea(item,report,{width:800,height:800}));
  assert.throws(()=>verifySmallGiftArea(item,{...report,productId:999},{width:1254,height:1254}));
  report.variants[0].area.dpi=150;
  assert.throws(()=>verifySmallGiftArea(item,report,{width:1254,height:1254}));
 }
});
test('all three completed previews freeze a clean source-checked native master, not a catalog sale',async()=>{
 for(const item of SMALL_GIFTS){
  const {env,pilot,record,prepare,compose}=await fixture(item);
  const state=await freezeSmallGift(env,item,pilot,{prepare,compose});
  assert.equal(state.status,'ready_for_review');assert.equal(state.offer.sku,item.sku);assert.equal(state.offer.product,item.product);
  assert.equal(state.reviewSignature,await smallGiftSignature(state.offer));
  const approval=await (await env.ARTWORK.get(`commerce/preapprovals/${record.token}.json`)).json();
  const locked=await verifiedPremadePrint(env,approval);
  assert.equal(locked.finalHash,state.offer.proof.printFileHash);assert.equal(locked.finalMime,item.mime);
  assert.deepEqual(state.printSize,{width:item.width,height:item.height});
  assert.equal(await env.ARTWORK.get(SHOP_CATALOG_KEY),null);
  assert.equal(await env.ARTWORK.get(`shop/proofs/${item.id}.json`),null);
  assert.equal(await publishSmallGift(env,item,state),false);
 }
});
test('changed source bytes or a JPEG-flattened sticker sheet never produce a purchasable gift',async()=>{
 const item=SMALL_GIFTS[2],fx=await fixture(item);
 await fx.env.ARTWORK.put(fx.record.snapshotKey,'wrong-source');
 await assert.rejects(()=>freezeSmallGift(fx.env,item,fx.pilot,fx),e=>e.code==='gift_source_changed');
 const other=await fixture(item);
 await assert.rejects(()=>freezeSmallGift(other.env,item,other.pilot,{prepare:other.prepare,compose:async()=>({mime:'image/jpeg',bytes:new Uint8Array(160),outputSize:{width:1750,height:2482}})}),e=>e.code==='gift_printfile_invalid');
});
test('transparent PNG accepted only for version-8 six-picture sticker sheets, and bytes remain hash locked',async()=>{
 const item=SMALL_GIFTS[2],fx=await fixture(item);
 await freezeSmallGift(fx.env,item,fx.pilot,fx);
 const record=await (await fx.env.ARTWORK.get(`commerce/preapprovals/${fx.record.token}.json`)).json();
 assert.equal((await verifiedPremadePrint(fx.env,record)).finalMime,'image/png');
 for(const design of [{...record.design,version:6},{...record.design,layout:'cover'}]){
  await assert.rejects(()=>verifiedPremadePrint(fx.env,{...record,design}));
 }
 await assert.rejects(()=>verifiedPremadePrint(fx.env,{...record,sku:'RECAST-COASTER-SET'}));
 await fx.env.ARTWORK.put(record.premadePrint.key,new Uint8Array(160));
 await assert.rejects(()=>verifiedPremadePrint(fx.env,record),e=>e.code==='premade_print_changed');
});
test('exact reviewed four-hash signature is required for publication, existing offers preserved, repeat is idempotent',async()=>{
 const item=SMALL_GIFTS[0],fx=await fixture(item);
 const state=await freezeSmallGift(fx.env,item,fx.pilot,fx);
 const prior={id:'existing-mug',note:'keep unchanged'};
 await json(fx.env,SHOP_CATALOG_KEY,{version:1,revision:7,offers:[prior]});
 await assert.rejects(()=>publishSmallGift(fx.env,item,state,{reviewed:{[item.id]:'0'.repeat(64)}}),e=>e.code==='gift_review_signature_changed');
 const reviewed={[item.id]:state.reviewSignature};let checked=0;
 const resolve=async(_env,id,revision,{catalog})=>{checked++;assert.equal(id,item.id);assert.equal(revision,master.sha256);assert.equal(catalog.offers.length,1);};
 assert.equal(await publishSmallGift(fx.env,item,state,{reviewed,resolve}),true);
 assert.equal(await publishSmallGift(fx.env,item,state,{reviewed,resolve}),true);
 const catalog=await (await fx.env.ARTWORK.get(SHOP_CATALOG_KEY)).json();
 assert.equal(catalog.revision,8);assert.equal(catalog.offers.length,2);assert.deepEqual(catalog.offers[0],prior);assert.equal(checked,2);
 assert.equal((await smallGiftReleaseStatus(fx.env)).items[0].checkoutEnabled,true);
});
test('preparation is bounded, never creates supplier tasks, and uncertain attempt claims are not retried',async()=>{
 const env={PREMADE_SMALL_GIFT_RELEASE_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};
 let count=0;
 for(const item of SMALL_GIFTS)await json(env,item.pilot,{status:'ready_for_review'});
 const freeze=async(_env,item)=>{count++;return {id:item.id,status:'ready_for_review',offer:{id:item.id}};};
 const publish=async()=>false;
 assert.equal((await runSmallGiftRelease(env,{freeze,publish})).prepared,1);
 assert.equal(count,1);
 assert.equal((await runSmallGiftRelease(env,{freeze,publish})).prepared,1);
 assert.equal(count,2);
 await json(env,smallGiftKey(SMALL_GIFTS[2].id),{status:'preparing'});
 assert.equal((await runSmallGiftRelease(env,{freeze,publish})).prepared,0);
 assert.equal(count,2);
 const response=await shopRoutes(new Request('https://recast.test/api/shop/small-gifts'),env);
 assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/approvalToken|accessToken|reviewSignature|premadePrint/);
 assert.equal((await shopRoutes(new Request('https://recast.test/api/shop/small-gifts',{method:'POST'}),env)).status,405);
});
