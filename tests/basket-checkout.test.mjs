import test from 'node:test';
import assert from 'node:assert/strict';
import {beginBasketCheckout} from '../src/basket-checkout.js';

const identity={ownerId:'fixture-owner',basketId:'fixture-basket'};
const lines=[{merchandiseId:'gid://shopify/ProductVariant/1',quantity:2,attributes:[
 {key:'Artwork ID',value:'fixture-art'},{key:'_Recast Basket Line',value:'line-one'}]}];
const state={revision:2,lines:[{id:'line-one'}]};
const ready=()=>({...identity,status:'ready',revision:2,lines:structuredClone(lines),
 startedAt:'2026-10-18T22:00:00.000Z',completedAt:'2026-10-18T22:00:01.000Z',
 cartId:'gid://shopify/Cart/fixture?key=private-fixture',checkoutUrl:'https://fixture.myshopify.com/checkouts/fixture'});
function fixture(prior){
 const calls={reads:0,writes:0,remote:0};
 const env={BASKET_ENABLED:'true',SHOPIFY_SHOP:'fixture.myshopify.com',SHOPIFY_STOREFRONT_TOKEN:'fixture-only',ARTWORK:{
  get:async()=>{calls.reads++;return {etag:'fixture-etag',json:async()=>structuredClone(prior)};},
  put:async()=>{calls.writes++;throw Error('Unexpected write');}
 }};
 const run=(input=lines)=>beginBasketCheckout(env,identity,state,input,{fetcher:async()=>{calls.remote++;throw Error('Unexpected network');}});
 return {env,calls,run};
}
test('valid saved checkout reuses only its checked URL, without writes or requests',async()=>{
 const f=fixture(ready());assert.deepEqual(await f.run(),{checkoutUrl:ready().checkoutUrl,reused:true});
 assert.deepEqual(f.calls,{reads:1,writes:0,remote:0});
});
test('attribute order does not invalidate the same approved saved lines',async()=>{
 const p=ready();p.lines[0].attributes.reverse();const f=fixture(p);assert.equal((await f.run()).reused,true);
 assert.equal(f.calls.remote,0);assert.equal(f.calls.writes,0);
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
 assert.equal(f.calls.writes,0);assert.equal(f.calls.remote,0);
});
