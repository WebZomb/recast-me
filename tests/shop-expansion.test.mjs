import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bucket} from './security-helpers.mjs';
import {runShopExpansion,shopExpansionStatus,EXPANSION_DESIGNS,EXPANSION_ITEMS,REVIEWED_EXPANSION_PROOFS} from '../src/shop-expansion.js';
import {shopRoutes} from '../src/shop-routes.js';

const manifest=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8'));

test('server-side Christmas mug designs match the exact pinned public art and both existing sizes',()=>{
 assert.equal(EXPANSION_DESIGNS.length,35);
 assert.equal(EXPANSION_ITEMS.length,70);
 assert.equal(new Set(EXPANSION_ITEMS.map(x=>x.id)).size,70);
 for(const design of EXPANSION_DESIGNS){
  const visual=manifest.designs.find(d=>d.designId===design.id);
  assert.ok(visual,'Every server-design must have a preview');
  assert.equal(design.asset,visual.artworkImage);
  assert.equal(design.sha256,visual.artworkRevision);
  assert.deepEqual([design.width,design.height],[1254,1254]);
  assert.match(design.requestId,/^RC-[A-Z0-9-]{8,60}$/);
  const variants=EXPANSION_ITEMS.filter(x=>x.designId===design.id);
  assert.deepEqual(variants.map(x=>x.sku),['RECAST-MUG-11OZ','RECAST-MUG-15OZ']);
 }
 assert.deepEqual(REVIEWED_EXPANSION_PROOFS,{});
});

test('new supplier preparation is disabled by default and cannot be started by a public POST',async()=>{
 const env={ARTWORK:new Bucket()};
 assert.deepEqual(await runShopExpansion(env),{enabled:false});
 assert.equal(env.ARTWORK.objects.size,0);
 const status=await shopExpansionStatus(env);
 assert.equal(status.enabled,false);
 assert.ok(status.items.every(x=>x.status==='not_started'));
 assert.equal((await shopRoutes(new Request('https://recast.test/api/shop/expansion',{method:'POST'}),env)).status,405);
 assert.equal(env.ARTWORK.objects.size,0);
});

test('tampered remote artwork never creates a supplier preview or a purchasable offer',async t=>{
 let external=0;t.mock.method(globalThis,'fetch',async(_url,options)=>{assert.equal(options.redirect,'manual');external++;return new Response('not the pinned artwork');});
 const env={PREMADE_EXPANSION_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};
 const response=await runShopExpansion(env);
 assert.deepEqual(response,{enabled:true,created:0,polled:0,ready:0});
 const report=await shopExpansionStatus(env);
 assert.ok(report.items.every(item=>item.status==='needs_review'));
 assert.equal(external,35,'Each distinct source is tried once, never replaced by another image');
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
 assert.doesNotMatch(JSON.stringify(report),/accessToken|approvalToken|snapshotKey|PRINTFUL_API_TOKEN/);
});

import {safeExpansionFailureClass} from '../src/shop-expansion.js';
test('source error classification exposes only fixed safe words, never URLs, tokens or provider responses',()=>{
 assert.equal(safeExpansionFailureClass('TypeError: fetch failed to https://cdn.example/?token=sk-project-secret12345'), 'typeerror_fetch_failed');
 assert.equal(safeExpansionFailureClass('Cannot read properties of undefined (reading info)'), 'cannot_read_properties_of_undefined_reading_info');
 assert.equal(safeExpansionFailureClass('someuniqueusersecrettoken'), 'unclassified');
});

test('source redirect is explicitly rejected without a mockup or storefront publication',async t=>{
 let redirects=0;
 t.mock.method(globalThis,'fetch',async(_url,opts)=>{
  assert.equal(opts.redirect,'manual');redirects++;
  return new Response(null,{status:302,headers:{location:'https://untrusted.invalid/surprise.png'}});
 });
 const env={PREMADE_EXPANSION_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};
 const result=await runShopExpansion(env);
 assert.deepEqual(result,{enabled:true,created:0,polled:0,ready:0});
 const status=await shopExpansionStatus(env);
 assert.equal(redirects,35);
 assert.ok(status.items.every(x=>x.status==='needs_review'));
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
});
