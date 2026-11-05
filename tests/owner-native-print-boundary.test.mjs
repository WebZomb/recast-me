import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {secureApplication,isOwnerNativePrintPath} from '../src/owner-native-print-boundary.js';
import {Bucket,CLEAN,MARKED,imageMock} from './security-helpers.mjs';
import {SMALL_GIFTS,smallGiftKey,smallGiftSignature} from '../src/shop-small-gift-release.js';
import {EXPANSION_DESIGNS} from '../src/shop-expansion.js';
import {hash,recommendedCheckoutDesign} from '../src/commerce-store.js';
import {digestBytes} from '../src/premade-print.js';
import {FULFILLMENT} from '../src/entry.js';
const master=EXPANSION_DESIGNS[0];
const admin='owner-native-boundary-test-only';
const origin='https://recastmeai.com';
const prefix='/api/shop/small-gift-review/';
const req=(item,{token=admin,method='GET'}={})=>new Request(origin+prefix+item.id+'/print',{method,headers:token?{authorization:'Bearer '+token}:{}});
async function fixture(item){
 const env={ADMIN_TOKEN:admin,ARTWORK:new Bucket(),LIVE_APP_URL:origin,IMAGES:imageMock()};
 const bytes=new Uint8Array(160);bytes.fill(44);bytes.set(item.mime==='image/png'?[137,80,78,71,13,10,26,10]:[255,216,255]);
 const fileHash=await digestBytes(bytes),extension=item.mime==='image/png'?'png':'jpg';
 const key=`shop/printfiles/${item.id}/${fileHash}.${extension}`;
 const token='a'.repeat(48),sourceHash='b'.repeat(64),proofHash='c'.repeat(64);
 const position={area_width:item.width,area_height:item.height,width:item.width,height:item.height,top:0,left:0};
 const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
 const placementHash=await hash(JSON.stringify(position));
 const record={requestId:master.requestId,sku:item.sku,sourceHash,proofHash,design,position,
  premadePrint:{key,sha256:fileHash,mime:item.mime,sku:item.sku,sourceHash,proofHash,placementHash,artworkRevision:master.sha256}};
 const offer={id:item.id,requestId:master.requestId,sku:item.sku,artworkRevision:master.sha256,approvalToken:token,sourceHash,proofHash,
  approvalRecordHash:await hash(JSON.stringify(record)),mockupId:'actual-task-shape',proof:{printFileHash:fileHash,placementHash,taskId:'supplier-task1'}};
 const task={status:'completed',requestId:master.requestId,sku:item.sku,mockupId:offer.mockupId,printfulVariantId:item.variantId,
  sourceHash:proofHash,taskKey:'supplier-task1',position,design,images:[]};
 const put=(k,v)=>env.ARTWORK.put(k,JSON.stringify(v));
 await env.ARTWORK.put(key,bytes);
 await put(`requests/${master.requestId}/request.json`,{source:'premade-catalog',catalogRightsConfirmedAt:'2026-11-04T00:00:00Z',catalogMasterHash:master.sha256});
 await put(`commerce/preapprovals/${token}.json`,record);
 await put(`mockups/${master.requestId}/${item.sku}/${offer.mockupId}/task.json`,task);
 await put(smallGiftKey(item.id),{status:'ready_for_review',offer,reviewSignature:await smallGiftSignature(offer),printSize:{width:item.width,height:item.height}});
 return {env,bytes,key,task,offer,put};
}
test('full production router preserves exact clean JPEG/transparent PNG after existing owner and integrity checks',async()=>{
 for(const item of SMALL_GIFTS){
  const f=await fixture(item),before=f.env.ARTWORK.objects.size;
  const response=await router.fetch(req(item),f.env,{});
  assert.equal(response.status,200,item.id);
  assert.equal(response.headers.get('content-type'),item.mime);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()),f.bytes,'Original native bytes must not be watermarked or converted');
  assert.equal(f.env.IMAGES.operations.length,0,'No renderer or public watermark on authorized native files');
  assert.equal(f.env.ARTWORK.objects.size,before,'Reading a native file must not create a public derivative');
  assert.match(response.headers.get('cache-control'),/private.*no-store.*no-transform/);
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(response.headers.get('x-content-type-options'),'nosniff');
  assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
  assert.equal(await f.env.ARTWORK.get('shop/catalog/v1.json'),null);
 }
});
test('anonymous or wrong-owner native requests are refused before ANY private storage access',async()=>{
 const env={ADMIN_TOKEN:admin,ARTWORK:{get(){throw Error('Private access before authorization');}}};
 for(const item of SMALL_GIFTS){
  assert.equal((await router.fetch(req(item,{token:null}),env,{})).status,401);
  assert.equal((await router.fetch(req(item,{token:'incorrect'}),env,{})).status,401);
 }
});
test('changed native bytes and mismatched supplier identity still refuse at the full HTTP boundary',async()=>{
 const item=SMALL_GIFTS[2],f=await fixture(item);
 await f.env.ARTWORK.put(f.key,new Uint8Array(160));
 assert.equal((await router.fetch(req(item),f.env,{})).status,409);
 const other=await fixture(item);
 await other.put(`mockups/${master.requestId}/${item.sku}/${other.offer.mockupId}/task.json`,{...other.task,taskKey:'wrong-supplier-task'});
 assert.equal((await router.fetch(req(item),other.env,{})).status,409);
 assert.equal(await other.env.ARTWORK.get('shop/catalog/v1.json'),null);
});
test('only the three exact existing GET endpoints qualify; metadata, query credentials, unknown IDs and writes do not gain access',async()=>{
 const item=SMALL_GIFTS[0];
 for(const method of ['POST','PUT','DELETE','HEAD'])assert.equal(isOwnerNativePrintPath(req(item,{method})),false);
 for(const path of [prefix+'other/print',prefix+item.id+'/print/extra',prefix+item.id+'/print/',prefix+item.id+'/PRINT','/api/mockup/image/RC-TEST0001-ABCDEF/SKU/0','/api/shop/small-gift-review']){
  assert.equal(isOwnerNativePrintPath(new Request(origin+path)),false,path);
 }
 const f=await fixture(item);
 assert.equal((await router.fetch(new Request(origin+prefix+item.id+'/print?token='+admin),f.env,{})).status,401);
 assert.equal((await router.fetch(req(item,{method:'POST'}),f.env,{})).status,405);
});
test('all public and non-native image responses still use the original server-side watermark protection',async()=>{
 for(const token of [null,admin]){
  const env={ARTWORK:new Bucket(),ADMIN_TOKEN:admin,IMAGES:imageMock()};
  const wrapped=secureApplication({fetch:async()=>new Response(CLEAN,{headers:{'content-type':'image/png'}})});
  const request=new Request(origin+'/api/unchanged-public-preview',{headers:token?{authorization:'Bearer '+token}:{}});
  const response=await wrapped.fetch(request,env,{});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/jpeg');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),MARKED);
  assert.ok(env.IMAGES.operations.some(([op])=>op==='draw'));
 }
});
