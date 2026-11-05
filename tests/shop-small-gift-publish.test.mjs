import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {SMALL_GIFTS,smallGiftKey,smallGiftSignature,REVIEWED_SMALL_GIFT_SIGNATURES} from '../src/shop-small-gift-release.js';
import {smallGiftOwnerPublish,SMALL_GIFT_PUBLISH_PATH,PUBLISH_CONFIRMATION} from '../src/shop-small-gift-publish.js';
import {EXPANSION_DESIGNS} from '../src/shop-expansion.js';
import {hash,recommendedCheckoutDesign} from '../src/commerce-store.js';
import {FULFILLMENT} from '../src/entry.js';
import {digestBytes} from '../src/premade-print.js';
import {shopRoutes} from '../src/shop-routes.js';
const origin='https://recastmeai.com',secret='owner-fixture-only',source=EXPANSION_DESIGNS[0];
const send=(body,{token=secret,site=origin,marker='1',method='POST',type='application/json'}={})=>new Request(origin+SMALL_GIFT_PUBLISH_PATH,{method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(site?{origin:site}:{}),...(marker?{'x-recast-request':marker}:{}),'content-type':type},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
async function fixture(item=SMALL_GIFTS[2]){
 const env={ADMIN_TOKEN:secret,ARTWORK:new Bucket(),LIVE_APP_URL:origin,PREMADE_SMALL_GIFT_RELEASE_ENABLED:'true'};
 const bytes=new Uint8Array(160);bytes.set(item.mime==='image/png'?[137,80,78,71,13,10,26,10]:[255,216,255]);
 const sha=await digestBytes(bytes),key=`shop/printfiles/${item.id}/${sha}.${item.mime==='image/png'?'png':'jpg'}`;
 const token='c'.repeat(48),sourceHash='a'.repeat(64),proofHash='b'.repeat(64);
 const position={area_width:item.width,area_height:item.height,width:item.width,height:item.height,top:0,left:0};
 const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]),placementHash=await hash(JSON.stringify(position));
 const record={token,requestId:source.requestId,sku:item.sku,sourceHash,proofHash,design,position,approvalMode:'product-mockup',approvedAt:'2026-11-04T00:00:00Z',premadePrint:{key,sha256:sha,mime:item.mime,sku:item.sku,sourceHash,proofHash,placementHash,artworkRevision:source.sha256}};
 const offer={id:item.id,requestId:source.requestId,sku:item.sku,product:item.product,artworkRevision:source.sha256,approvalToken:token,sourceHash,proofHash,approvalRecordHash:await hash(JSON.stringify(record)),mockupId:'real-supplier-v1',mockupUrl:origin+'/api/approved-preview/'+token,priceCents:1499,proof:{provider:'printful',approved:true,artworkRevision:source.sha256,printFileHash:sha,placementHash,taskId:'supplier-task-1'}};
 const task={status:'completed',requestId:source.requestId,sku:item.sku,mockupId:offer.mockupId,printfulVariantId:item.variantId,sourceHash:proofHash,design,position,taskKey:'supplier-task-1',images:[{title:'Actual supplier view',url:`${origin}/api/mockup/image/${source.requestId}/${item.sku}/0?token=fixture-proof`} ]};
 const put=async(k,obj)=>env.ARTWORK.put(k,JSON.stringify(obj));
 await env.ARTWORK.put(key,bytes);
 await put(`requests/${source.requestId}/request.json`,{source:'premade-catalog',catalogRightsConfirmedAt:'2026-11-04T00:00:00Z',catalogMasterHash:source.sha256});
 await put(`commerce/preapprovals/${token}.json`,record);
 await put(`mockups/${source.requestId}/${item.sku}/${offer.mockupId}/task.json`,task);
 const state={status:'ready_for_review',offer,reviewSignature:await smallGiftSignature(offer),printSize:{width:item.width,height:item.height}};
 await put(smallGiftKey(item.id),state);
 const input={id:item.id,reviewSignature:state.reviewSignature,printFileHash:sha,sourceRevision:source.sha256,confirm:PUBLISH_CONFIRMATION};
 return {env,item,bytes,key,record,offer,task,state,input,put};
}
const unusedResolver=async()=>({priceCents:1499});
test('owner publication requires existing Bearer, POST, same origin and explicit request marker',async()=>{
 const env={ADMIN_TOKEN:secret,ARTWORK:{get(){throw Error('Private storage accessed before authorization');},put(){throw Error('Must not write');}}};
 for(const token of [null,'wrong'])assert.equal((await smallGiftOwnerPublish(send({},{token}),env)).status,401);
 assert.equal((await smallGiftOwnerPublish(send({},{method:'GET'}),env)).status,405);
 for(const settings of [{site:'https://other.invalid'},{site:null},{marker:null}])assert.equal((await smallGiftOwnerPublish(send({},settings),env)).status,403);
 assert.equal((await shopRoutes(send({},{token:null}),env)).status,401);
 assert.equal(await smallGiftOwnerPublish(new Request(origin+'/api/unknown'),env),null);
});
test('unknown products, missing acknowledgement, arbitrary file paths and oversized bodies cannot publish',async()=>{
 const fx=await fixture(),before=fx.env.ARTWORK.objects.size;
 for(const bad of [{...fx.input,confirm:'yes'},{...fx.input,filePath:'secrets'},{...fx.input,reviewSignature:'x'},[]]){
  assert.equal((await smallGiftOwnerPublish(send(bad),fx.env)).status,400);
 }
 assert.equal((await smallGiftOwnerPublish(send({...fx.input,id:'blanket-not-in-pilot'}),fx.env)).status,404);
 assert.equal((await smallGiftOwnerPublish(send('x'.repeat(3000)),fx.env)).status,413);
 assert.equal((await smallGiftOwnerPublish(send(fx.input,{type:'text/plain'}),fx.env)).status,415);
 assert.equal(fx.env.ARTWORK.objects.size,before);
 assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
});
test('stale source, native file, signature, corrupt bytes and incorrect manufacturer task fail before publication',async()=>{
 for(const field of ['reviewSignature','printFileHash','sourceRevision']){
  const fx=await fixture(),before=fx.env.ARTWORK.objects.size;
  const response=await smallGiftOwnerPublish(send({...fx.input,[field]:'0'.repeat(64)}),fx.env);
  assert.equal(response.status,409);assert.equal(fx.env.ARTWORK.objects.size,before);
 }
 const fx=await fixture();await fx.env.ARTWORK.put(fx.key,new Uint8Array(160));
 assert.equal((await smallGiftOwnerPublish(send(fx.input),fx.env)).status,409);
 assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
 const other=await fixture();
 await other.put(`mockups/${source.requestId}/${other.item.sku}/${other.offer.mockupId}/task.json`,{...other.task,taskKey:'wrong'});
 assert.equal((await smallGiftOwnerPublish(send(other.input),other.env)).status,409);
});
test('all three exact reviewed gifts publish through real CAS helper and preserve existing mug offers',async()=>{
 for(const item of SMALL_GIFTS){
  const fx=await fixture(item),prior={id:'existing-approved-mug',keep:true};
  await fx.put('shop/catalog/v1.json',{version:1,revision:11,offers:[prior]});
  let resolutions=0;
  const resolve=async(_env,id,revision)=>{resolutions++;assert.equal(id,item.id);assert.equal(revision,source.sha256);return {priceCents:1499};};
  const response=await smallGiftOwnerPublish(send(fx.input),fx.env,{resolve});
  assert.equal(response.status,200);
  const result=await response.json();assert.equal(result.published,true);assert.equal(result.alreadyPublished,false);
  assert.equal(result.paymentCreated,false);assert.equal(result.productionSubmitted,false);
  assert.equal(resolutions,2);
  const cat=await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).json();
  assert.equal(cat.revision,12);assert.equal(cat.offers.length,2);assert.deepEqual(cat.offers[0],prior);assert.equal(cat.offers[1].id,item.id);
  assert.equal((await (await fx.env.ARTWORK.get(smallGiftKey(item.id))).json()).status,'published');
  const auditKey=`shop/owner-publications/v1/${item.id}/${fx.input.reviewSignature}.json`;
  const audit=await (await fx.env.ARTWORK.get(auditKey)).json();
  assert.equal(audit.status,'published');assert.equal(audit.actor,'authenticated-owner');assert.equal(audit.printFileHash,fx.input.printFileHash);
  assert.doesNotMatch(JSON.stringify(audit),/owner-fixture-only|approvalToken|accessToken/);
  assert.deepEqual(REVIEWED_SMALL_GIFT_SIGNATURES,{},'No automatic signature allowlist expansion');
  const retry=await (await smallGiftOwnerPublish(send(fx.input),fx.env,{resolve})).json();
  assert.equal(retry.alreadyPublished,true);
  assert.equal((await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).json()).offers.length,2);
 }
});
test('two identical owner confirmations do not duplicate the published product',async()=>{
 const fx=await fixture();
 const results=await Promise.all([1,2].map(()=>smallGiftOwnerPublish(send(fx.input),fx.env,{resolve:unusedResolver})));
 assert.ok(results.every(r=>r.status===200));
 const cat=await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).json();
 assert.equal(cat.offers.length,1);assert.equal(cat.revision,1);
});
test('a disconnected Shopify row never becomes advertised and a lost publication response is not called success',async()=>{
 const fx=await fixture();let tried=0;
 const failResolve=async()=>{tried++;throw Error('inactive or unavailable');};
 const response=await smallGiftOwnerPublish(send(fx.input),fx.env,{resolve:failResolve});
 assert.equal(response.status,409);assert.equal(tried,1);
 assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
 const text=await response.text();assert.match(text,/could not be confirmed/);assert.doesNotMatch(text,/inactive or unavailable/);
 const restored=await smallGiftOwnerPublish(send(fx.input),fx.env,{resolve:unusedResolver});
 assert.equal(restored.status,200);
 assert.equal((await (await fx.env.ARTWORK.get('shop/catalog/v1.json')).json()).offers.length,1);
});
