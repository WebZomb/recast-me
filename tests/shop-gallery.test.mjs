import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readyOffer} from '../public/shop-model.js';
import {validateOffer} from '../src/shop-offers.js';

const manifest=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8'));
const designs=manifest.designs;

test('Christmas mug gallery contains thirteen distinct artwork and lifestyle pairs',()=>{
 assert.equal(manifest.version,1);
 assert.equal(designs.length,13);
 assert.equal(designs.filter(d=>d.pet==='dog').length,10);
 assert.equal(designs.filter(d=>d.pet==='cat').length,3);
 for(const field of ['id','designId','artworkImage','salesImage','artworkRevision'])assert.equal(new Set(designs.map(d=>d[field])).size,13,field);
 for(const design of designs){
  assert.equal(design.product,'mug');assert.equal(design.occasion,'christmas');assert.equal(design.status,'preview');
  assert.match(design.artworkRevision,/^[0-9a-f]{64}$/);
  assert.deepEqual([design.artworkWidth,design.artworkHeight],[1254,1254]);
  assert.deepEqual(design.plannedSizes,['11 oz','15 oz']);
  assert.match(design.artworkImage,/^https:\/\/cdn\.shopify\.com\//);
  assert.match(design.salesImage,/^https:\/\/cdn\.shopify\.com\//);
  assert.match(design.artworkImage,/\.png\?v=\d+$/);
  assert.match(design.salesImage,/\.webp\?v=\d+$/);
 }
});

test('unapproved gallery illustrations cannot become cart offers',()=>{
 for(const design of designs){
  assert.equal(readyOffer(design),false);
  assert.equal('priceCents' in design,false);
  assert.equal('variantId' in design,false);
  assert.equal('proof' in design,false);
  assert.equal('approvalToken' in design,false);
  assert.throws(()=>validateOffer(design,{}));
 }
});

test('published original Golden Retriever remains a separate approved design',()=>{
 const golden=designs.find(d=>d.breed==='Golden Retriever');
 assert.ok(golden);assert.notEqual(golden.designId,'christmas-golden-retriever-winter-lights');
 const page=readFileSync(new URL('../public/shop.js',import.meta.url),'utf8');
 assert.ok(page.includes('groupShopOffers(offers)'));
 assert.ok(page.includes('pending.map(previewCard)'));
 assert.ok(page.includes('showPreview(design,showingArtwork)'));
 assert.ok(page.includes("$('#detail-add').hidden=true"));
 assert.ok(page.includes("$('#detail-add').hidden=false"));
});
