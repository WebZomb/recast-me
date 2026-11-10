import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {salesIllustration} from '../public/shop-sales-illustrations.js';
const design=JSON.parse(fs.readFileSync('public/shop-gallery.json')).designs[0];
test('sales illustrations match only the reviewed product and artwork revision',()=>{
 for(const collection of ['pillows','canvas']){
  const entry=salesIllustration(collection,design);
  assert.ok(entry);assert.ok(fs.existsSync('public'+entry.url));
  assert.equal(salesIllustration(collection,{...design,artworkRevision:'0'.repeat(64)}),null);
  assert.equal(salesIllustration(collection,{...design,designId:'another-pet'}),null);
 }
 assert.equal(salesIllustration('blankets',design),null);
 assert.equal(salesIllustration('pillows',null),null);
});
