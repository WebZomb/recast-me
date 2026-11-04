import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FULFILLMENT} from '../src/entry.js';
const drafts=JSON.parse(readFileSync(new URL('../catalog/shopify-premade-mugs.json',import.meta.url),'utf8'));
const gallery=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8'));
test('35 draft Shopify products and 70 unique exact size mappings match all catalog artwork',()=>{
 assert.equal(drafts.version,1);
 assert.equal(drafts.designs.length,35);
 assert.equal(new Set(drafts.designs.map(x=>x.designId)).size,35);
 assert.equal(new Set(drafts.designs.map(x=>x.shopifyProductId)).size,35);
 assert.equal(new Set(drafts.designs.map(x=>x.handle)).size,35);
 const skus=[],variants=[];
 for(let i=0;i<drafts.designs.length;i++){
  const p=drafts.designs[i],g=gallery.designs[i],serial=String(i+1).padStart(3,'0');
  assert.equal(p.designId,g.designId);
  assert.equal(p.artworkRevision,g.artworkRevision);
  assert.equal(p.pet,g.pet);
  assert.equal(p.breed,g.breed);
  assert.equal(p.status,'DRAFT');
  assert.match(p.shopifyProductId,/^gid:\/\/shopify\/Product\/\d+$/);
  assert.equal(p.variants.length,2);
  for(const variant of p.variants){
   assert.ok([11,15].includes(variant.sizeOz));
   assert.equal(variant.sku,`RMCM-${serial}-${variant.sizeOz}`);
   assert.match(variant.shopifyVariantId,/^gid:\/\/shopify\/ProductVariant\/\d+$/);
   assert.equal(variant.printfulCatalogProductId,19);
   const base=FULFILLMENT[variant.sizeOz===11?'RECAST-MUG-11OZ':'RECAST-MUG-15OZ'];
   assert.equal(variant.printfulCatalogVariantId,base.printfulVariantId);
   assert.equal(variant.priceCents,variant.sizeOz===11?2499:2999);
   skus.push(variant.sku);variants.push(variant.shopifyVariantId);
  }
 }
 assert.equal(skus.length,70);
 assert.equal(new Set(skus).size,70);
 assert.equal(new Set(variants).size,70);
});
test('draft mapping has no active/approved Printful credentials or checkout assertions',()=>{
 assert.match(drafts.status,/draft-awaiting/);
 for(const p of drafts.designs){
  assert.equal(p.status,'DRAFT');
  assert.equal('approvalToken' in p,false);
  assert.equal('printFileUrl' in p,false);
  assert.equal('proofHash' in p,false);
  assert.equal('checkoutUrl' in p,false);
 }
});
