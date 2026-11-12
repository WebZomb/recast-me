import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {salesIllustration,SALES_ILLUSTRATIONS} from '../public/shop-sales-illustrations.js';
import {SHOP_COLLECTIONS,collectionDesigns} from '../public/shop-collections.js';
const designs=collectionDesigns(JSON.parse(fs.readFileSync('public/shop-gallery.json')).designs);
const collections=SHOP_COLLECTIONS.filter(c=>c.slug!=='mugs');
const readJson=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const key=e=>[e.collection,e.designId,e.artworkRevision].join('|');
const digest=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');

test('every Christmas design has a product-specific first image in every current non-mug collection',()=>{
 assert.equal(designs.length,35);assert.equal(collections.length,15);
 assert.equal(SALES_ILLUSTRATIONS.length,designs.length*collections.length);
 const keys=new Set(SALES_ILLUSTRATIONS.map(key));assert.equal(keys.size,SALES_ILLUSTRATIONS.length);
 for(const collection of collections)for(const design of designs){
  const scene=salesIllustration(collection.slug,design);
  assert.ok(scene,collection.slug+' '+design.designId);
  assert.equal(scene.collection,collection.slug);assert.equal(scene.designId,design.designId);
  assert.equal(scene.artworkRevision,design.artworkRevision);
  assert.ok(Object.isFrozen(scene));
 }
});

test('marketing image lookup cannot cross product, pet or source-revision boundaries',()=>{
 for(const design of designs)for(const collection of collections){
  assert.equal(salesIllustration(collection.slug,{...design,artworkRevision:'0'.repeat(64)}),null);
  assert.equal(salesIllustration(collection.slug,{...design,designId:'not-the-approved-pet'}),null);
 }
 assert.equal(salesIllustration('not-a-product',designs[0]),null);
 assert.equal(salesIllustration('mugs',designs[0]),null,'Mug sales images remain in their own unchanged gallery');
 assert.equal(salesIllustration('pillows',null),null);
 assert.equal(salesIllustration('pillows',{}),null);
});

test('all local first images and browsing thumbnails contain nonempty WebP data',()=>{
 for(const entry of SALES_ILLUSTRATIONS)for(const url of [entry.url,entry.thumbnailUrl]){
  if(url.startsWith('/shop-assets/')){
   assert.match(url,/^\/shop-assets\/(sales|complete-scenes)\/[a-z0-9-]+\.webp$/);
   const bytes=fs.readFileSync('public'+url);
   assert.ok(bytes.length>10000,url);
   assert.equal(bytes.toString('ascii',0,4),'RIFF',url);
   assert.equal(bytes.toString('ascii',8,12),'WEBP',url);
  }else{
   assert.equal(entry.collection,'coaster-sets');assert.equal(entry.designId,'christmas-village-husky');
   assert.match(url,/^https:\/\/cdn\.shopify\.com\/s\/files\/1\/0854\/3810\/3796\/files\/recast-christmas-husky-coaster-sets-sales-20261111\.webp\?v=1794376316$/,'Only the existing owner-approved Husky coaster photo is retained externally');
  }
 }
});

test('new scene assets match the reviewed coverage receipt and remain marketing-only',()=>{
 const report=readJson('docs/evidence/shop-first-image-coverage-20261112.json');
 assert.equal(report.sceneCount,525);assert.equal(report.retainedApprovedScenes,12);
 assert.equal(report.newExactSourceScenes,513);assert.equal(report.entries.length,513);
 const registered=new Map(SALES_ILLUSTRATIONS.map(e=>[key(e),e]));
 const sourceHashes=new Map();let fullBytes=0,thumbnailBytes=0;
 for(const receipt of report.entries){
  const entry=registered.get(key(receipt));assert.ok(entry);
  assert.equal(entry.url,receipt.url);assert.equal(entry.thumbnailUrl,receipt.thumbnailUrl);
  assert.match(receipt.sourceSha256,/^[a-f0-9]{64}$/);
  if(sourceHashes.has(receipt.designId))assert.equal(sourceHashes.get(receipt.designId),receipt.sourceSha256);
  sourceHashes.set(receipt.designId,receipt.sourceSha256);
  const full=fs.readFileSync('public'+entry.url),thumb=fs.readFileSync('public'+entry.thumbnailUrl);
  assert.equal(digest(full),receipt.fullSha256);assert.equal(digest(thumb),receipt.thumbnailSha256);
  assert.equal(receipt.width,1254);assert.equal(receipt.height,1254);
  assert.equal(receipt.thumbnailWidth,640);assert.equal(receipt.thumbnailHeight,640);
  assert.ok(thumb.length<400000);fullBytes+=full.length;thumbnailBytes+=thumb.length;
  assert.equal('priceCents' in entry,false);assert.equal('proof' in entry,false);assert.equal('variantId' in entry,false);
 }
 assert.equal(sourceHashes.size,35);assert.equal(fullBytes,report.fullBytes);assert.equal(thumbnailBytes,report.thumbnailBytes);
 assert.ok(thumbnailBytes<fullBytes,'Browsing does not download full-sized detail scenes');
});
