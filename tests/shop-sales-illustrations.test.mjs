import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {salesIllustration,SALES_ILLUSTRATIONS} from '../public/shop-sales-illustrations.js';
const design=JSON.parse(fs.readFileSync('public/shop-gallery.json')).designs[0];
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

test('every registered sales image and thumbnail contains WebP image bytes',()=>{
 for(const entry of SALES_ILLUSTRATIONS)for(const url of [entry.url,entry.thumbnailUrl]){
  const bytes=fs.readFileSync('public'+url);assert.ok(bytes.length>10000,url);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',url);assert.equal(bytes.toString('ascii',8,12),'WEBP',url);
 }
});
