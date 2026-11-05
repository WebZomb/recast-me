import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {GIFT_BATCH_ITEMS,giftMaster} from '../src/shop-gift-definitions.js';
import {freezeSmallGift,smallGiftKey} from '../src/shop-small-gift-release.js';
import {smallGiftOwnerReview} from '../src/shop-small-gift-qa.js';
import {smallGiftOwnerPublish,PUBLISH_CONFIRMATION} from '../src/shop-small-gift-publish.js';
import {isOwnerNativePrintPath} from '../src/owner-native-print-boundary.js';
import {nativeGiftFixture} from './gift-batch-fixtures.mjs';
const origin='https://recastmeai.com';
const auth={authorization:'Bearer owner-test-only','x-recast-request':'1'};
async function ready(item){const fx=await nativeGiftFixture(item);const state=await freezeSmallGift(fx.env,item,fx.pilot,fx);await fx.put(smallGiftKey(item.id),state);return {...fx,state};}
test('all 102 additional exact native paths reject anonymous access before reading private storage',async()=>{
 let reads=0;const env={ADMIN_TOKEN:'owner-test-only',ARTWORK:{get(){reads++;throw Error('Private read before auth');}}};
 for(const item of GIFT_BATCH_ITEMS){
  const request=new Request(origin+'/api/shop/small-gift-review/'+item.id+'/print');
  assert.equal(isOwnerNativePrintPath(request),true);
  assert.equal((await router.fetch(request,env,{})).status,401);
 }
 assert.equal(reads,0);
 assert.equal(isOwnerNativePrintPath(new Request(origin+'/api/shop/small-gift-review/not-an-approved-design/print')),false);
});
test('native Labrador JPEG and six-sticker PNG pass byte-exact through the real production router',async()=>{
 for(const item of [GIFT_BATCH_ITEMS[0],GIFT_BATCH_ITEMS[2],GIFT_BATCH_ITEMS[101]]){
  const fx=await ready(item),request=new Request(origin+'/api/shop/small-gift-review/'+item.id+'/print',{headers:auth});
  fx.env.IMAGES.input=()=>{throw Error('Native owner files must not be publicly watermarked');};
  const response=await router.fetch(request,fx.env,{});
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),item.mime);assert.match(response.headers.get('cache-control'),/no-transform/);
  const bytes=new Uint8Array(await response.arrayBuffer());
  assert.equal(bytes.length,160);
  assert.equal(new TextDecoder().decode(bytes.slice(12,76)),fx.source.sha256);
 }
});
test('breed selector metadata returns only that original and its three exact product slots',async()=>{
 const item=GIFT_BATCH_ITEMS[2],fx=await ready(item);
 const response=await smallGiftOwnerReview(new Request(origin+'/api/shop/small-gift-review?design='+fx.source.id,{headers:auth}),fx.env);
 assert.equal(response.status,200);const data=await response.json();
 assert.equal(data.sourceDesign,fx.source.id);assert.equal(data.sourceRequestId,fx.source.requestId);assert.equal(data.originalArtwork,fx.source.asset);assert.equal(data.items.length,3);
 assert.ok(data.items.every(i=>i.id.startsWith(fx.source.id+'-')));
 assert.ok(data.items[2].supplierPictures.every(p=>new URL(p.url).pathname.includes('/'+fx.source.requestId+'/')));
 assert.doesNotMatch(JSON.stringify(data),/fixture-private-|approvalToken|printAccessToken|commerce\/preapprovals/);
 const unknown=await smallGiftOwnerReview(new Request(origin+'/api/shop/small-gift-review?design=unknown',{headers:auth}),fx.env);assert.equal(unknown.status,404);
});
test('cross-breed source substitution and modified native bytes cannot be published',async()=>{
 const item=GIFT_BATCH_ITEMS[0],fx=await ready(item);let writes=0;
 const input={id:item.id,reviewSignature:fx.state.reviewSignature,printFileHash:fx.state.offer.proof.printFileHash,sourceRevision:giftMaster(GIFT_BATCH_ITEMS[3]).sha256,confirm:PUBLISH_CONFIRMATION};
 const request=()=>new Request(origin+'/api/admin/small-gifts/publish',{method:'POST',headers:{...auth,origin,'content-type':'application/json'},body:JSON.stringify(input)});
 assert.equal((await smallGiftOwnerPublish(request(),fx.env,{publish:async()=>{writes++;}})).status,409);assert.equal(writes,0);
 input.sourceRevision=fx.source.sha256;
 const record=await (await fx.env.ARTWORK.get('commerce/preapprovals/'+fx.record.token+'.json')).json();
 await fx.env.ARTWORK.put(record.premadePrint.key,new Uint8Array(160));
 assert.equal((await smallGiftOwnerPublish(request(),fx.env,{publish:async()=>{writes++;}})).status,409);assert.equal(writes,0);
});
test('exact new-breed reviewed confirmation publishes only its source-specific offer through the existing action',async()=>{
 const item=GIFT_BATCH_ITEMS[1],fx=await ready(item);let calls=0;
 const input={id:item.id,reviewSignature:fx.state.reviewSignature,printFileHash:fx.state.offer.proof.printFileHash,sourceRevision:fx.source.sha256,confirm:PUBLISH_CONFIRMATION};
 const request=new Request(origin+'/api/admin/small-gifts/publish',{method:'POST',headers:{...auth,origin,'content-type':'application/json'},body:JSON.stringify(input)});
 const response=await smallGiftOwnerPublish(request,fx.env,{
  resolve:async()=>({priceCents:2499}),
  publish:async(_env,actual,state,{reviewed})=>{calls++;assert.equal(actual.id,item.id);assert.equal(state.offer.designId,fx.source.id);assert.deepEqual(reviewed,{[item.id]:input.reviewSignature});return true;}
 });
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.id,item.id);assert.equal(data.storePath,'/shop-magnet-sets');assert.equal(data.paymentCreated,false);assert.equal(data.productionSubmitted,false);assert.equal(calls,1);
});
