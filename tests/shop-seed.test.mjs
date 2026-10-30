import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Bucket,imageMock} from './security-helpers.mjs';
import {runShopSeed,shopPreparationStatus,SEED_DESIGN,SEED_ITEMS,REVIEWED_SEED_PROOFS} from '../src/shop-seed.js';
import {shopRoutes} from '../src/shop-routes.js';
import {hashBytes} from '../src/shop-catalog-store.js';
test('catalog preparation is explicitly off unless enabled and cannot be started through HTTP',async()=>{
 const env={ARTWORK:new Bucket(),ASSETS:{fetch:()=>{throw Error('must not fetch');}}};assert.deepEqual(await runShopSeed(env),{enabled:false});assert.equal(env.ARTWORK.objects.size,0);
 for(const path of ['/api/shop/preparation','/api/shop/catalog'])assert.equal((await shopRoutes(new Request('https://recast.test'+path,{method:'POST'}),env)).status,405);
 assert.equal(env.ARTWORK.objects.size,0);
});
test('only the exact fictional-pet source file can enter the starter assortment',async()=>{
 const bytes=await readFile(new URL('../catalog/shop/artwork/golden-winter-lights-v1.png',import.meta.url));
 assert.equal(await hashBytes(bytes),SEED_DESIGN.sha256);assert.equal(bytes.readUInt32BE(16),1254);assert.equal(bytes.readUInt32BE(20),1254);assert.equal(SEED_DESIGN.pet,'dog');
 assert.equal(SEED_ITEMS.length,2);assert.ok(SEED_ITEMS.every(item=>item.sku.startsWith('RECAST-MUG-')));
 assert.deepEqual(REVIEWED_SEED_PROOFS,{});
});
test('a changed source stops preparation without external calls, publication or automatic recreation',async t=>{
 let external=0,assetReads=0;t.mock.method(globalThis,'fetch',async()=>{external++;throw Error('No external calls expected');});
 const env={PREMADE_SEED_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:imageMock(),ASSETS:{fetch:async()=>{assetReads++;return new Response('wrong artwork');}}};
 await runShopSeed(env);await runShopSeed(env);
 assert.equal(external,0);assert.equal(assetReads,1);assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
 const report=await shopPreparationStatus(env);assert.ok(report.items.every(item=>item.status==='needs_review'));
 assert.doesNotMatch(JSON.stringify(report),/accessToken|printAccessToken|ADMIN_TOKEN|snapshotKey|approvalToken/);
});
test('an uncertain supplier creation is held, never silently retried',async t=>{
 let external=0;t.mock.method(globalThis,'fetch',async()=>{external++;throw Error('Must not recreate supplier task');});
 const env={PREMADE_SEED_ENABLED:'true',ARTWORK:new Bucket(),ASSETS:{}};
 await env.ARTWORK.put(`requests/${SEED_DESIGN.requestId}/request.json`,JSON.stringify({source:'premade-catalog',catalogDesignId:SEED_DESIGN.id,catalogMasterHash:SEED_DESIGN.sha256}));
 for(const item of SEED_ITEMS)await env.ARTWORK.put(`shop/preparation/v1/${item.id}.json`,JSON.stringify({id:item.id,status:'creating_preview'}));
 await runShopSeed(env);assert.equal(external,0);assert.ok((await shopPreparationStatus(env)).items.every(item=>item.status==='needs_review'));
});
test('uninspected ready proofs remain unpublished and no inference/order code is included',async()=>{
 const env={PREMADE_SEED_ENABLED:'true',ARTWORK:new Bucket(),ASSETS:{}};
 for(const item of SEED_ITEMS)await env.ARTWORK.put(`shop/preparation/v1/${item.id}.json`,JSON.stringify({id:item.id,status:'ready_for_review'}));
 await runShopSeed(env);assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
 const source=await readFile(new URL('../src/shop-seed.js',import.meta.url),'utf8');assert.doesNotMatch(source,/highQualityTransform|AI\.run|sendToProduction|createPrintfulDraft|\/orders\b|checkoutLink\(/);
});
