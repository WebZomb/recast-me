import test from 'node:test';
import assert from 'node:assert/strict';
import {collectVerifiedShopOffers,SHOP_CATALOG_READ_CONCURRENCY} from '../src/shop-catalog-verification.js';
import {readFileSync} from 'node:fs';
test('large storefront catalog uses at most four verification chains and preserves source order',async()=>{
 const input=Array.from({length:73},(_,i)=>({id:'gift-'+i}));
 let active=0,peak=0;const visited=[];
 const result=await collectVerifiedShopOffers(input,async (offer,index)=>{
  active++;peak=Math.max(peak,active);visited.push(index);
  await new Promise(resolve=>setTimeout(resolve,index%3));active--;
  if(index%11===0)throw Error('proof unavailable');
  return {...offer,checked:true};
 });
 assert.equal(SHOP_CATALOG_READ_CONCURRENCY,4);assert.equal(peak,4);assert.equal(active,0);
 assert.equal(visited.length,input.length);assert.equal(new Set(visited).size,input.length);
 assert.deepEqual(result.map(x=>x.id),input.filter((_,i)=>i%11!==0).map(x=>x.id));
 assert.ok(result.every(x=>x.checked));
});
test('no availability cache and every request independently reruns all verification',async()=>{
 let calls=0,available=true;
 const verify=async item=>{calls++;if(!available)throw Error('retired');return item;};
 assert.deepEqual(await collectVerifiedShopOffers([{id:'test'}],verify),[{id:'test'}]);
 available=false;
 assert.deepEqual(await collectVerifiedShopOffers([{id:'test'}],verify),[]);
 assert.equal(calls,2);
 assert.deepEqual(await collectVerifiedShopOffers([],verify),[]);
 await assert.rejects(()=>collectVerifiedShopOffers(Array(501),verify),TypeError);
});
test('public catalog still invokes existing proof and active Shopify validation with current prices',()=>{
 const code=readFileSync(new URL('../src/shop-catalog-store.js',import.meta.url),'utf8');
 assert.match(code,/collectVerifiedShopOffers\(catalog.offers/);
 assert.match(code,/resolveShopOffer\(env,offer.id,offer.artworkRevision,\{catalog,products,integrity:false\}\)/);
 assert.match(code,/priceCents:checked.priceCents/);
 assert.match(code,/row=rows.find\(r=>r.variantId===offer.variantId&&r.sku===offer.sku&&r.status==='ACTIVE'/);
});
