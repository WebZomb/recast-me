import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeProductDesign} from '../src/commerce-store.js';

const checkout=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');

test('home photo defaults keep the whole image over dark borders',()=>{
 for(const product of ['Blanket','Pillow','Tote Bag']){
 const d=normalizeProductDesign({product},{});
 assert.equal(d.layout,'fit');assert.equal(d.fill,'dark');assert.equal(d.scale,100);
 const old=normalizeProductDesign({product},{version:6,layout:'fit',fill:'ambient',scale:110});
 assert.equal(old.fill,'ambient');assert.equal(old.scale,110);
 }
 assert.match(checkout,/Fill entire product · crop to fit/);
});

test('wall art uses the selected-size supplier caption without the withdrawn scale panel',()=>{
 assert.doesNotMatch(checkout,/Actual selected size:|24×36 reference/);
 assert.match(checkout,/Your artwork · \$\{card\.querySelector/);
 assert.match(checkout,/selected size.*supplier mockup/);
 assert.match(checkout,/Custom Recast Poster/);
 assert.match(checkout,/Custom Recast Canvas/);
});

test('mug chooses a side view before Front when the supplier returns one',()=>{
 assert.match(checkout,/Custom Recast Mug/);
 assert.match(checkout,/Handle left\|Handle right\|Left\|Right\|3D\|Product/);
});
