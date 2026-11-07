import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {SMALL_GIFTS,smallGiftKey,smallGiftSignature} from '../src/shop-small-gift-release.js';
import {smallGiftOwnerReview} from '../src/shop-small-gift-qa.js';
import {shopRoutes} from '../src/shop-routes.js';
import {hash,recommendedCheckoutDesign} from '../src/commerce-store.js';
import {FULFILLMENT} from '../src/entry.js';
import {digestBytes} from '../src/premade-print.js';
import {EXPANSION_DESIGNS} from '../src/shop-expansion.js';
const root='https://recastmeai.com/api/shop/small-gift-review';
const source=EXPANSION_DESIGNS[0];
const admin='fixture-owner-only';
const request=(path='',{token=admin,method='GET'}={})=>new Request(root+path,{method,headers:token?{authorization:'Bearer '+token}:{}});
async function fixture(item=SMALL_GIFTS[2]){
 const env={ADMIN_TOKEN:admin,ARTWORK:new Bucket(),LIVE_APP_URL:'https://recastmeai.com'};
 const bytes=new Uint8Array(160);bytes.set(item.mime==='image/png'?[137,80,78,71,13,10,26,10]:[255,216,255]);
 const sha=await digestBytes(bytes),ext=item.mime==='image/png'?'png':'jpg';
 const key=`shop/printfiles/${item.id}/${sha}.${ext}`;
 const token='c'.repeat(48),sourceHash='a'.repeat(64),proofHash='b'.repeat(64);
 const position={area_width:item.width,area_height:item.height,width:item.width,height:item.height,top:0,left:0};
 const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
 const placementHash=await hash(JSON.stringify(position));
 const record={requestId:source.requestId,sku:item.sku,sourceHash,proofHash,design,position,premadePrint:{key,sha256:sha,mime:item.mime,sku:item.sku,sourceHash,proofHash,placementHash,artworkRevision:source.sha256}};
 const offer={id:item.id,requestId:source.requestId,sku:item.sku,artworkRevision:source.sha256,approvalToken:token,sourceHash,proofHash,approvalRecordHash:await hash(JSON.stringify(record)),mockupId:'real-supplier-v1',priceCents:1499,proof:{printFileHash:sha,placementHash,taskId:'supplier-task-1'}};
 const task={status:'completed',requestId:source.requestId,sku:item.sku,mockupId:offer.mockupId,printfulVariantId:item.variantId,sourceHash:proofHash,design,position,taskKey:'supplier-task-1',images:[{title:'Real supplier view',url:`https://recastmeai.com/api/mockup/image/${source.requestId}/${item.sku}/0?token=supplier-fixture`},{title:'Rejected origin',url:'https://untrusted.invalid/image?token=no'}]};
 const put=async(k,obj)=>env.ARTWORK.put(k,JSON.stringify(obj));
 await env.ARTWORK.put(key,bytes);
 await put(`requests/${source.requestId}/request.json`,{source:'premade-catalog',catalogRightsConfirmedAt:'2026-11-04T00:00:00Z',catalogMasterHash:source.sha256});
 await put(`commerce/preapprovals/${token}.json`,record);
 await put(`mockups/${source.requestId}/${item.sku}/${offer.mockupId}/task.json`,task);
 await put(smallGiftKey(item.id),{status:'ready_for_review',offer,reviewSignature:await smallGiftSignature(offer),printSize:{width:item.width,height:item.height}});
 return {env,item,bytes,key,record,offer,task,put};
}
test('private metadata and native pixels require the existing owner bearer before any storage read',async()=>{
 const env={ADMIN_TOKEN:admin,ARTWORK:{get(){throw Error('Must not touch storage before auth');}}};
 for(const path of ['', '/'+SMALL_GIFTS[0].id+'/print']){
  assert.equal((await smallGiftOwnerReview(request(path,{token:null}),env)).status,401);
  assert.equal((await smallGiftOwnerReview(request(path,{token:'wrong'}),env)).status,401);
 }
 assert.equal(await smallGiftOwnerReview(new Request('https://recastmeai.com/unrelated'),env),null);
 assert.equal((await smallGiftOwnerReview(request('',{method:'POST'}),env)).status,405);
});
test('authenticated metadata exposes only reviewed commercial source, supplier pictures and safe file references',async()=>{
 const fx=await fixture();
 const response=await shopRoutes(request(),fx.env);
 assert.equal(response.status,200);
 assert.equal(response.headers.get('cache-control'),'private, no-store');
 assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
 const text=await response.text(),data=JSON.parse(text);
 assert.equal(data.readOnly,true);assert.equal(data.items.length,4);
 const item=data.items.find(x=>x.id===fx.item.id);
 assert.equal(item.checkoutEnabled,false);
 assert.equal(item.mime,'image/png');assert.equal(item.supplierPictures.length,1);
 assert.equal(item.reviewSignature,await smallGiftSignature(fx.offer));
 assert.equal(item.cleanPrintUrl,'/api/shop/small-gift-review/'+fx.item.id+'/print');
 assert.doesNotMatch(text,/approvalToken|premadePrint|shop\/printfiles|fixture-owner-only|untrusted\.invalid/);
 assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
});
test('native JPEG and transparent sticker PNG are authenticated, byte-exact and private-cache only',async()=>{
 for(const item of SMALL_GIFTS){
  const fx=await fixture(item),res=await shopRoutes(request('/'+item.id+'/print'),fx.env);
  assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),item.mime);
  assert.equal(res.headers.get('referrer-policy'),'no-referrer');
  assert.equal(res.headers.get('x-content-type-options'),'nosniff');
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()),fx.bytes);
  assert.equal((await shopRoutes(request('/'+item.id+'/print',{token:null}),fx.env)).status,401);
 }
});
test('changed final bytes or a mismatched supplier task fail closed without approval or order writes',async()=>{
 const fx=await fixture();
 await fx.env.ARTWORK.put(fx.key,new Uint8Array(160));
 assert.equal((await shopRoutes(request('/'+fx.item.id+'/print'),fx.env)).status,409);
 const other=await fixture();
 await other.put(`mockups/${source.requestId}/${other.item.sku}/${other.offer.mockupId}/task.json`,{...other.task,taskKey:'wrong-task'});
 assert.equal((await shopRoutes(request(),other.env)).status,409);
 assert.equal(await other.env.ARTWORK.get('shop/catalog/v1.json'),null);
});
test('unknown products and unprepared files cannot be downloaded',async()=>{
 const env={ADMIN_TOKEN:admin,ARTWORK:new Bucket()};
 assert.equal((await shopRoutes(request('/not-a-product/print'),env)).status,404);
 assert.equal((await shopRoutes(request('/'+SMALL_GIFTS[0].id+'/print'),env)).status,409);
 const data=await (await shopRoutes(request(),env)).json();
 assert.ok(data.items.every(x=>x.status==='not_started'));
 assert.equal(env.ARTWORK.objects.size,0);
});
