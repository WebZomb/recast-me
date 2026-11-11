import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {salesIllustration,SALES_ILLUSTRATIONS} from '../public/shop-sales-illustrations.js';
const design=JSON.parse(fs.readFileSync('public/shop-gallery.json')).designs[0];
const designs=JSON.parse(fs.readFileSync('public/shop-gallery.json')).designs;
const husky=designs.find(d=>d.designId==='christmas-village-husky');
const huskyFamilies=['blankets','pillows','canvas','tumblers','hoodies','t-shirts','tote-bags','phone-cases','sticker-sheets','coaster-sets'];
const approvedCdn='https://cdn.shopify.com/s/files/1/0854/3810/3796/files/';
test('sales illustrations match only the reviewed product and artwork revision',()=>{
 for(const collection of ['pillows','canvas','coaster-sets','magnet-sets','sticker-sheets']){
  const entry=salesIllustration(collection,design);
  assert.ok(entry);assert.ok(fs.existsSync('public'+entry.url));assert.ok(fs.existsSync('public'+entry.thumbnailUrl));
  assert.equal(salesIllustration(collection,{...design,artworkRevision:'0'.repeat(64)}),null);
  assert.equal(salesIllustration(collection,{...design,designId:'another-pet'}),null);
 }
 assert.equal(salesIllustration('blankets',design),null);
 assert.equal(salesIllustration('pillows',null),null);
});


test('ten Husky scenes match only the pinned pet and product family',()=>{
 assert.ok(husky);
 for(const collection of huskyFamilies){
  const scene=salesIllustration(collection,husky);
  assert.ok(scene,collection);
  assert.equal(scene.artworkRevision,husky.artworkRevision);
  assert.ok(scene.url.startsWith(approvedCdn),collection);
  assert.equal(scene.thumbnailUrl,scene.url);
  assert.equal(salesIllustration(collection,{...husky,artworkRevision:'0'.repeat(64)}),null);
  assert.equal(salesIllustration(collection,{...husky,designId:design.designId}),null);
 }
 assert.equal(salesIllustration('magnet-sets',husky),null);
 const keys=SALES_ILLUSTRATIONS.map(e=>e.collection+'|'+e.designId+'|'+e.artworkRevision);
 assert.equal(new Set(keys).size,keys.length);
});

test('marketing images use decoded local WebP bytes or this shop’s pinned Shopify CDN',()=>{
 for(const entry of SALES_ILLUSTRATIONS)for(const url of [entry.url,entry.thumbnailUrl]){
  if(url.startsWith('/shop-assets/sales/')){
   const bytes=fs.readFileSync('public'+url);
   assert.ok(bytes.length>10000,url);
   assert.equal(bytes.toString('ascii',0,4),'RIFF',url);
   assert.equal(bytes.toString('ascii',8,12),'WEBP',url);
  }else{
   assert.ok(url.startsWith(approvedCdn),url);
   const parsed=new URL(url);
   assert.match(parsed.pathname,/\/recast-christmas-husky-[a-z-]+-sales-20261111\.webp$/);
   assert.match(parsed.searchParams.get('v')||'',/^\d+$/);
   assert.equal(parsed.searchParams.has('width'),false);
  }
 }
});
