import test from 'node:test';
import assert from 'node:assert/strict';
import {browsingImage,readShopCatalog} from '../public/shop-loading.js';
test('browse sizes preserve source identity and never rewrite actual Recast supplier proofs',()=>{
 const source='https://cdn.shopify.com/s/files/1/99/files/dog.png?v=123';
 const small=new URL(browsingImage(source));assert.equal(small.searchParams.get('v'),'123');assert.equal(small.searchParams.get('width'),'640');
 for(const url of ['/shop-assets/design.webp','https://recastmeai.com/shop/proof/private/0','https://other.test/image.png'])assert.equal(browsingImage(url),url);
});
test('catalog read refuses invalid responses and does not mutate or cache availability',async t=>{
 let active=true,calls=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push(options);return Response.json(active?{ok:true,version:1,offers:[{id:'gift'}]}:{ok:false,error:'Unavailable'},{status:active?200:503});});
 assert.equal((await readShopCatalog('/catalog')).offers[0].id,'gift');active=false;
 await assert.rejects(readShopCatalog('/catalog'));
 assert.equal(calls.length,2);assert.ok(calls.every(c=>c.cache==='no-store'&&c.signal instanceof AbortSignal&&c.method===undefined));
});
test('a stalled availability GET ends after 25 seconds and can be retried without a commerce action',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 t.mock.method(globalThis,'fetch',async(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Stopped','AbortError')))));
 const pending=readShopCatalog('/catalog');const rejected=assert.rejects(pending,{name:'AbortError'});
 t.mock.timers.tick(25000);await rejected;
});
