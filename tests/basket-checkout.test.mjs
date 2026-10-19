import test from 'node:test';
import assert from 'node:assert/strict';
import {beginBasketCheckout,basketShop,checkoutAttemptKey,CART_REFRESH} from '../src/basket-checkout.js';

test('shop configuration accepts the production short name and exact Shopify domain',()=>{
 for(const shop of ['b2wnfu-7g','b2wnfu-7g.myshopify.com','https://b2wnfu-7g.myshopify.com/'])
  assert.equal(basketShop({SHOPIFY_SHOP:shop}),'b2wnfu-7g.myshopify.com');
 for(const shop of ['','evil.example','https://evil.example','b2wnfu-7g@evil.example','b2wnfu-7g/checkout'])
  assert.throws(()=>basketShop({SHOPIFY_SHOP:shop}),e=>e.code==='basket_configuration');
});

const identity={ownerId:'fixture-owner',basketId:'fixture-basket'};
const lines=[{merchandiseId:'gid://shopify/ProductVariant/1',quantity:2,attributes:[
 {key:'Artwork ID',value:'fixture-art'},{key:'_Recast Basket Line',value:'line-one'}]}];
const state={revision:2,lines:[{id:'line-one'}]};
const ready=()=>({...identity,status:'ready',revision:2,lines:structuredClone(lines),
 startedAt:'2026-10-18T22:00:00.000Z',completedAt:'2026-10-18T22:00:01.000Z',
 cartId:'gid://shopify/Cart/fixture?key=private-fixture',checkoutUrl:'https://fixture.myshopify.com/checkouts/fixture'});
function fixture(prior){
 const calls={reads:0,writes:0,remote:0};
 const remoteCart={id:ready().cartId,checkoutUrl:'https://fixture.myshopify.com/checkouts/fresh',lines:{pageInfo:{hasNextPage:false},nodes:lines.map(l=>({quantity:l.quantity,attributes:structuredClone(l.attributes),merchandise:{id:l.merchandiseId}}))}};
 const control={data:{data:{cart:remoteCart}},status:200,fail:false,beforeResponse:null};
 const env={BASKET_ENABLED:'true',SHOPIFY_SHOP:'fixture.myshopify.com',SHOPIFY_STOREFRONT_TOKEN:'fixture-only',ARTWORK:{
  get:async()=>{calls.reads++;return {etag:'fixture-etag',json:async()=>structuredClone(prior)};},
  put:async()=>{calls.writes++;throw Error('Unexpected write');}
 }};
 const run=(input=lines)=>beginBasketCheckout(env,identity,state,input,{fetcher:async(url,options)=>{
  calls.remote++;assert.equal(url,'https://fixture.myshopify.com/api/2026-10/graphql.json');assert.equal(options.redirect,'error');
  assert.deepEqual(JSON.parse(options.body),{query:CART_REFRESH,variables:{id:ready().cartId}});
  if(control.fail)throw Error('private provider error');
  await control.beforeResponse?.();
  return Response.json(control.data,{status:control.status});
 }});
 return {env,calls,run,remoteCart,control};
}
test('valid saved checkout fetches a fresh checked URL without writes or cart creation',async()=>{
 const f=fixture(ready());assert.deepEqual(await f.run(),{checkoutUrl:f.remoteCart.checkoutUrl,reused:true});
 assert.deepEqual(f.calls,{reads:2,writes:0,remote:1});
});
test('attribute order does not invalidate the same approved saved lines',async()=>{
 const p=ready();p.lines[0].attributes.reverse();const f=fixture(p);assert.equal((await f.run()).reused,true);
 assert.equal(f.calls.remote,1);assert.equal(f.calls.writes,0);
});
const invalid=[
 ['missing URL',p=>{delete p.checkoutUrl;}],
 ['invalid URL',p=>{p.checkoutUrl='not a URL';}],
 ['off-shop URL',p=>{p.checkoutUrl='https://example.invalid/checkout';}],
 ['HTTP URL',p=>{p.checkoutUrl='http://fixture.myshopify.com/checkouts/fixture';}],
 ['userinfo URL',p=>{p.checkoutUrl='https://user@fixture.myshopify.com/checkouts/fixture';}],
 ['alternate port',p=>{p.checkoutUrl='https://fixture.myshopify.com:444/checkouts/fixture';}],
 ['URL control character',p=>{p.checkoutUrl='https://fixture.myshopify.com/\ncheckouts/fixture';}],
 ['URL backslash',p=>{p.checkoutUrl='https://fixture.myshopify.com\\checkouts/fixture';}],
 ['URL fragment',p=>{p.checkoutUrl+='\u0023unexpected';}],
 ['missing cart ID',p=>{delete p.cartId;}],
 ['wrong cart ID kind',p=>{p.cartId='gid://shopify/Product/1';}],
 ['empty cart ID',p=>{p.cartId='gid://shopify/Cart/';}],
 ['missing private cart key',p=>{p.cartId='gid://shopify/Cart/fixture';}],
 ['empty private cart key',p=>{p.cartId='gid://shopify/Cart/fixture?key=';}],
 ['duplicate private cart key',p=>{p.cartId='gid://shopify/Cart/fixture?key=a&key=b';}],
 ['negative revision',p=>{p.revision=-1;}],
 ['future revision',p=>{p.revision=3;}],
 ['missing lines',p=>{delete p.lines;}],
 ['changed quantity',p=>{p.lines[0].quantity=1;}],
 ['changed variant',p=>{p.lines[0].merchandiseId='gid://shopify/ProductVariant/2';}],
 ['non-string variant',p=>{p.lines[0].merchandiseId=['gid://shopify/ProductVariant/1'];}],
 ['changed approval attribute',p=>{p.lines[0].attributes[0].value='other-art';}],
 ['duplicate attribute key',p=>{p.lines[0].attributes.push(p.lines[0].attributes[0]);}],
 ['invalid attribute',p=>{p.lines[0].attributes[0].value=null;}],
 ['missing timestamp',p=>{delete p.completedAt;}],
 ['reversed timestamps',p=>{p.completedAt='2026-10-18T21:59:59.000Z';}],
 ['foreign owner',p=>{p.ownerId='different';}],
 ['foreign basket',p=>{p.basketId='different';}],
 ['pending',p=>{p.status='pending';}],
 ['unknown',p=>{p.status='unknown';}],
];
for(const [name,change] of invalid)test('saved checkout fails closed: '+name,async()=>{
 const p=ready();change(p);const f=fixture(p);
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
 assert.equal(f.calls.writes,0);assert.equal(f.calls.remote,0);
});
test('invalid JSON is a safe unknown outcome with no mutation',async()=>{
 const f=fixture(ready());f.env.ARTWORK.get=async()=>({etag:'x',json:async()=>{throw Error('private parse detail');}});
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown'&&!e.message.includes('private parse'));
 assert.equal(f.calls.writes,0);assert.equal(f.calls.remote,0);
});
test('corrupt earlier revision is not overwritten by a new checkout attempt',async()=>{
 const p=ready();p.revision=1;delete p.checkoutUrl;const f=fixture(p);
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
 assert.equal(f.calls.writes,0);assert.equal(f.calls.remote,0);
});
test('stored null is not interpreted as an absent attempt',async()=>{
 const f=fixture(null);await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
 assert.equal(f.calls.writes,0);assert.equal(f.calls.remote,0);
});
test('valid snapshot is unchanged by caller edits during storage read',async()=>{
 const f=fixture(ready()),input=structuredClone(lines),get=f.env.ARTWORK.get;
 f.env.ARTWORK.get=async()=>{input[0].quantity=9;return get();};
 assert.equal((await f.run(input)).reused,true);
 assert.equal(f.calls.writes,0);assert.equal(f.calls.remote,1);
});

const changedRemote=[
 ['missing or completed cart',f=>{f.control.data.data.cart=null;}],
 ['wrong cart',f=>{f.remoteCart.id='gid://shopify/Cart/other?key=other';}],
 ['off-shop URL',f=>{f.remoteCart.checkoutUrl='https://other.example/checkout';}],
 ['changed quantity',f=>{f.remoteCart.lines.nodes[0].quantity=9;}],
 ['changed variant',f=>{f.remoteCart.lines.nodes[0].merchandise.id='gid://shopify/ProductVariant/2';}],
 ['changed artwork',f=>{f.remoteCart.lines.nodes[0].attributes[0].value='other-art';}],
 ['extra line',f=>{f.remoteCart.lines.nodes.push(structuredClone(f.remoteCart.lines.nodes[0]));}],
 ['truncated lines',f=>{f.remoteCart.lines.pageInfo.hasNextPage=true;}],
 ['missing pagination evidence',f=>{delete f.remoteCart.lines.pageInfo;}],
 ['GraphQL error',f=>{f.control.data.errors=[{message:'private error'}];}],
 ['HTTP failure',f=>{f.control.status=503;}],
 ['network failure',f=>{f.control.fail=true;}]
];
for(const [name,change] of changedRemote)test('remote checkout fails closed without replacement: '+name,async()=>{
 const f=fixture(ready());change(f);
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown'&&!e.message.includes('private'));
 assert.equal(f.calls.remote,1);assert.equal(f.calls.writes,0);
});
test('checkout changed during remote refresh is not returned',async()=>{
 const f=fixture(ready());f.control.beforeResponse=()=>{f.env.ARTWORK.get=async()=>({etag:'new-attempt'});};
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');assert.equal(f.calls.writes,0);
});
test('failed read-only refresh permits explicit retry of the same cart without creating one',async()=>{
 const f=fixture(ready());f.control.fail=true;
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');f.control.fail=false;
 assert.equal((await f.run()).checkoutUrl,f.remoteCart.checkoutUrl);assert.equal(f.calls.remote,2);assert.equal(f.calls.writes,0);
});

async function historyFixture(){
 const key=await checkoutAttemptKey(identity),prior=ready();prior.revision=1;
 const objects=new Map([[key,{body:JSON.stringify(prior),etag:'prior'}]]),events=[];
 let serial=0,remote=0;
 const control={archiveFailure:false,loseArchiveResponse:false};
 const bucket={
  async get(k){const o=objects.get(k);return o?{etag:o.etag,json:async()=>JSON.parse(o.body)}:null;},
  async put(k,body,options){
   const history=k.includes('/basket-checkout-history/');
   events.push(history?'archive':'current');
   if(history&&control.archiveFailure)throw Error('unavailable');
   const old=objects.get(k),condition=options.onlyIf;
   if(condition instanceof Headers){assert.equal(condition.get('If-None-Match'),'*');if(old)return null;}
   else if(old?.etag!==condition.etagMatches)return null;
   assert.equal(options.httpMetadata.cacheControl,'private, no-store');
   const o={body,etag:'version-'+(++serial)};objects.set(k,o);
   if(history&&control.loseArchiveResponse){control.loseArchiveResponse=false;throw Error('lost acknowledgement');}
   return {etag:o.etag};
  }
 };
 const env={BASKET_ENABLED:'true',SHOPIFY_SHOP:'fixture',SHOPIFY_STOREFRONT_TOKEN:'fixture-only',ARTWORK:bucket};
 const run=()=>beginBasketCheckout(env,identity,state,lines,{fetcher:async()=>{
  remote++;events.push('remote');
  return Response.json({data:{cartCreate:{cart:{id:'gid://shopify/Cart/new?key=private-new',checkoutUrl:'https://fixture.myshopify.com/checkouts/new',lines:{nodes:lines.map(l=>({quantity:l.quantity,attributes:l.attributes,merchandise:{id:l.merchandiseId}}))}},userErrors:[],warnings:[]}}});
 }});
 const historyKey=key.replace('/basket-checkouts/','/basket-checkout-history/').replace(/\.json$/,'/1.json');
 return {key,historyKey,prior,objects,events,control,bucket,run,get remote(){return remote;}};
}
test('changed revision archives the full prior checkout before claiming or contacting Shopify',async()=>{
 const f=await historyFixture();assert.equal((await f.run()).reused,false);
 assert.deepEqual(JSON.parse(f.objects.get(f.historyKey).body),f.prior);
 assert.deepEqual(f.events,['archive','current','remote','current']);
 assert.equal(JSON.parse(f.objects.get(f.key).body).revision,2);
});
test('archive outage leaves current checkout untouched with no remote create',async()=>{
 const f=await historyFixture();f.control.archiveFailure=true;
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
 assert.deepEqual(JSON.parse(f.objects.get(f.key).body),f.prior);
 assert.equal(f.remote,0);assert.deepEqual(f.events,['archive']);
});
test('lost archive acknowledgement stops safely; explicit retry confirms immutable history',async()=>{
 const f=await historyFixture();f.control.loseArchiveResponse=true;
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
 assert.equal(f.remote,0);assert.equal(f.objects.get(f.key).etag,'prior');
 const archived=f.objects.get(f.historyKey);
 assert.equal((await f.run()).reused,false);assert.equal(f.remote,1);
 assert.deepEqual(f.objects.get(f.historyKey),archived);
});
for(const [name,body] of [['conflicting',JSON.stringify({...ready(),cartId:'gid://shopify/Cart/other?key=other'})],['corrupt','not json']]){
 test(name+' history cannot be overwritten or followed by another checkout',async()=>{
  const f=await historyFixture();const archived={body,etag:'existing'};f.objects.set(f.historyKey,archived);
  await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
  assert.deepEqual(f.objects.get(f.historyKey),archived);assert.equal(f.objects.get(f.key).etag,'prior');assert.equal(f.remote,0);
 });
}
test('unreadable existing archive prevents a changed-revision claim',async()=>{
 const f=await historyFixture();f.objects.set(f.historyKey,{body:JSON.stringify(f.prior),etag:'existing'});
 const get=f.bucket.get;f.bucket.get=async k=>{if(k===f.historyKey)throw Error('read failed');return get(k);};
 await assert.rejects(f.run(),e=>e.code==='basket_checkout_unknown');
 assert.equal(f.objects.get(f.key).etag,'prior');assert.equal(f.remote,0);
});
test('concurrent changed-revision attempts retain history and make at most one remote create',async()=>{
 const f=await historyFixture(),get=f.bucket.get;let reads=0,release;
 const bothRead=new Promise(resolve=>{release=resolve;});
 f.bucket.get=async k=>{const snapshot=await get(k);if(k===f.key){if(++reads===2)release();await bothRead;}return snapshot;};
 const results=await Promise.allSettled([f.run(),f.run()]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(f.remote,1);
 assert.deepEqual(JSON.parse(f.objects.get(f.historyKey).body),f.prior);
 assert.equal(results.find(r=>r.status==='rejected').reason.code,'basket_checkout_unknown');
});
