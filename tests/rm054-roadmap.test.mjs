import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {RM054_PRODUCT_CANDIDATES} from '../src/rm054-product-candidates.js';

const entry=readFileSync(new URL('../src/entry.js',import.meta.url),'utf8');

test('approved RM054 roadmap is recorded in the recovered launch order',()=>{
 assert.deepEqual(Object.keys(RM054_PRODUCT_CANDIDATES),['sticker','phoneCase','pillow','notebook','petBandana','puzzle','tote']);
 assert.deepEqual(Object.values(RM054_PRODUCT_CANDIDATES).map(x=>x.wave),['main','main','main','main','more-gifts','more-gifts','more-gifts']);
});

test('new candidates stay outside live fulfillment until provider verification',()=>{
 for(const item of Object.values(RM054_PRODUCT_CANDIDATES)){
   assert.equal(item.state,'draft-unmapped');
   for(const variant of item.variants) if(variant.shopifySku) assert.equal(entry.includes(`"${variant.shopifySku}"`),false,variant.shopifySku);
 }
});

test('researched candidate mappings are concrete and bounded',()=>{
 for(const item of Object.values(RM054_PRODUCT_CANDIDATES)){
   assert.ok(item.supplier.startsWith('Printful '));
   assert.ok(item.draftRetail>0);
   assert.ok(item.supplierPriceObserved>0);
   for(const variant of item.variants) assert.ok(Number.isSafeInteger(variant.printfulVariantId)&&variant.printfulVariantId>0);
 }
 assert.match(RM054_PRODUCT_CANDIDATES.puzzle.regionNote,/US only/);
});

test('candidate verification is admin-only, read-only, and never submits production',()=>{
 const workflow=readFileSync(new URL('../src/workflow.js',import.meta.url),'utf8');
 const start=workflow.indexOf('export async function adminProductCandidates');
 const end=workflow.indexOf('export async function adminSyncOrders',start);
 const block=workflow.slice(start,end);
 assert.ok(block.includes('requireAdmin(request,env)'));
 assert.ok(block.includes("method:'GET'"));
 assert.equal(block.includes("method:'POST'"),false);
 assert.ok(block.includes('productionSubmitted:false'));
 assert.ok(workflow.includes('/api/admin/product-candidates'));
});
