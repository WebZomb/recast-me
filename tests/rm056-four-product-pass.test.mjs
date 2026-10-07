import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeProductDesign} from '../src/commerce-store.js';

const checkout=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');

test('blanket default preserves the whole image over an ambient full-product background',()=>{
 const d=normalizeProductDesign({product:'Blanket'},{});
 assert.equal(d.layout,'fit');assert.equal(d.fill,'ambient');assert.equal(d.scale,92);
 assert.match(checkout,/Best setup · full image on blanket/);
});

test('poster and canvas show a proportional physical-size guide',()=>{
 assert.match(checkout,/Actual selected size:/);
 assert.match(checkout,/24×36 reference/);
 assert.match(checkout,/Custom Recast Poster/);
 assert.match(checkout,/Custom Recast Canvas/);
});

test('mug chooses a side view before Front when the supplier returns one',()=>{
 assert.match(checkout,/Custom Recast Mug/);
 assert.match(checkout,/Handle left\|Handle right\|Left\|Right\|3D\|Product/);
});
