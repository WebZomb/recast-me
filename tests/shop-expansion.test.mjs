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
 assert.deepEqual(REVIEWED_EXPANSION_PROOFS,{
  'village-golden-retriever-mug-11oz':'b114d98c685bd48caa8d0cedd9a890714fc4936273b1a4d85d75e9c36cc5669b',
  'village-golden-retriever-mug-15oz':'ef15ee055e30aeb1f121cec08a1e7200aed283f6d7e17985f51b56b32661049d',
 'village-labrador-retriever-mug-11oz':'859163145a6650e7e9e092047ada6d25077cf90a76837ac2ee1927e170ec5f33',
 'village-labrador-retriever-mug-15oz':'d571679afef663d389116bc51abbaf441eefc12981f74a0cd4e78e7e439de941',
 'village-german-shepherd-mug-11oz':'bcb075fd4fe0d8fdbe5b509b974013f3e931b8c064104676d614cc087ccdde85',
 'village-german-shepherd-mug-15oz':'a487bde8c62f69f0a942705f256d49e2a957663c3ddab82d019eac847a7f5c8d',
 'village-french-bulldog-mug-11oz':'a61b3871c29c252af5a485bde2e7b4b204232fd9ce6ce7f2268cadd5a5d131be',
 'village-french-bulldog-mug-15oz':'427f93b08b399626afd2db2c599960c200867b0bc3e6b9d051ff7502e20e119f',
 'village-beagle-mug-11oz':'f6f5094f66f6ac1122f96d8ec0d5d1b10047d4399f975a4f5739b23145304af2',
 'village-beagle-mug-15oz':'9c97106fbd086f851a23a8a1990892c97cc54cc32991a03f20f9c6bb5b4d2dea',
 'village-poodle-mug-11oz':'e94acc028ce9e0f9e4505530bbe3f68daf88a486f41e0e49601d99000982947a',
 'village-poodle-mug-15oz':'dd1deb81c0d364c56b8c901ce66024fdf0773b08ebc8802caf50ad3f2d1abf6f',
 'village-husky-mug-11oz':'1dded23da0468e08365a89384e5c9485e4142cc4f36c79dc2af6097c6ff77d36',
 'village-husky-mug-15oz':'87f50dc89f7050a7cacd474de2d0eed846c4f4cba598077aeff1ffca61ae363a',
 'village-orange-tabby-mug-11oz':'35f17e2c03f47a97902db01ff97b2a5049f9c3f8d7b5d487cd6cbe88cb1f5f24',
 'village-orange-tabby-mug-15oz':'0b2b5caf21625b213d492b4a024d3aed4fc7a734ebfa42e8ea018944f381dda4',
 'village-tuxedo-cat-mug-11oz':'c820ad43f05a6cd6b1e30325d9a58bae69fae04a17fc356d05374d90df314ca2',
 'village-tuxedo-cat-mug-15oz':'4a0d52ad627abf9d963bed195bba3187384c717c5a897921b1a44f800f724d78',
 'village-jack-russell-mug-11oz':'82e96b6a9248a835b43a35eb3d9b6b5d9dac74cd55c81e4aca4c0f46f9a4a256',
 'village-jack-russell-mug-15oz':'3b566030164e8bdcbef873507a831f503b3d6708f6b1bd97f8f3c2944aff200c'
 });
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
 assert.equal(report.items.filter(item=>item.status==='needs_review').length,2);
 assert.equal(report.items.filter(item=>item.status==='not_started').length,68);
 assert.equal(external,1,'Rate-limited source screening does not fan out across the catalog');
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
 assert.equal(redirects,1);
 assert.equal(status.items.filter(x=>x.status==='needs_review').length,2);
 assert.equal(status.items.filter(x=>x.status==='not_started').length,68);
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
});

import {approvedMugSourceMime,canaryDesignCount} from '../src/shop-expansion.js';
test('v3 canary limits number of mug designs and source types match bytes',()=>{
 assert.equal(approvedMugSourceMime(new Uint8Array([0xff,0xd8,0xff,0xe0])),'image/jpeg');
 assert.equal(approvedMugSourceMime(new Uint8Array([137,80,78,71,13,10,26,10])),'image/png');
 assert.throws(()=>approvedMugSourceMime(new Uint8Array([71,73,70,56])),e=>e.code==='seed_asset_format');
 assert.equal(canaryDesignCount({PREMADE_EXPANSION_CANARY_COUNT:'1'}),1);
 assert.equal(canaryDesignCount({PREMADE_EXPANSION_CANARY_COUNT:'35'}),35);
 assert.equal(canaryDesignCount({PREMADE_EXPANSION_CANARY_COUNT:'500'}),0);
});
test('one canary allows only its 2 SKUs, never creates supplier mockups on bad source',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async(_url,options)=>{
  assert.equal(options.redirect,'manual');calls++;return new Response('invalid asset');
 });
 const env={PREMADE_EXPANSION_ENABLED:'true',PREMADE_EXPANSION_CANARY_COUNT:'1',ARTWORK:new Bucket(),IMAGES:{}};
 await runShopExpansion(env);
 const status=await shopExpansionStatus(env);
 assert.equal(status.canaryDesigns,1);
 assert.equal(status.items.filter(x=>x.status==='needs_review').length,2);
 assert.equal(status.items.filter(x=>x.status==='not_started').length,68);
 assert.equal(calls,1);
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
});

import {sourcePreviewBatchSize} from '../src/shop-expansion.js';
test('source preview batch bounds remain safe and explicit',()=>{
 assert.equal(sourcePreviewBatchSize({}),2);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'4'}),4);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'8'}),8);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'9'}),2);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'0'}),2);
});
test('35-design preview staging remains bounded and does not imply automatic sale approval',()=>{
 const settings=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');
 assert.match(settings,/"PREMADE_EXPANSION_CANARY_COUNT":\s*"35"/);
 assert.match(settings,/"PREMADE_EXPANSION_PREVIEW_BATCH_SIZE":\s*"2"/);
 assert.match(settings,/"PREMADE_EXPANSION_ENABLED":\s*"true"/);
 assert.equal(Object.keys(REVIEWED_EXPANSION_PROOFS).length,20);
 assert.equal(EXPANSION_ITEMS.length,70);
});

import {claimMugPreviewRateSlot} from '../src/shop-expansion.js';
test('two mocked Printful create tasks per rolling 65 seconds, stored across cron rounds',async()=>{
 const env={ARTWORK:new Bucket()};
 assert.equal(await claimMugPreviewRateSlot(env,1793740000000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740001000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740061000),false);
 assert.equal(await claimMugPreviewRateSlot(env,1793740066000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740067000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740068000),false);
 const o=await env.ARTWORK.get('shop/preparation/v3/mockup-create-rate.json');
 assert.equal((await o.json()).timestamps.length,2);
});
test('corrupt rate history stays fail closed and submits no new preview task',async()=>{
 const env={ARTWORK:new Bucket()};
 await env.ARTWORK.put('shop/preparation/v3/mockup-create-rate.json','{"timestamps":"corrupted"}');
 assert.equal(await claimMugPreviewRateSlot(env,1793740000000),false);
});

test('corrupted supplier rate state prevents unbounded new source imports',async t=>{
 let external=0;
 t.mock.method(globalThis,'fetch',async()=>{external++;throw Error('Unexpected provider request');});
 const store=new Bucket();
 await store.put('shop/preparation/v3/mockup-create-rate.json','{"timestamps":"invalid"}');
 const env={PREMADE_EXPANSION_ENABLED:'true',PREMADE_EXPANSION_CANARY_COUNT:'35',ARTWORK:store,IMAGES:{}};
 const result=await runShopExpansion(env);
 assert.deepEqual(result,{enabled:true,created:0,polled:0,ready:0});
 assert.equal(external,0,'Do not import or screen art without available provider capacity');
 const report=await shopExpansionStatus(env);
 assert.equal(report.items.filter(x=>x.status==='not_started').length,70);
 assert.equal(await store.get('shop/catalog/v1.json'),null);
});
