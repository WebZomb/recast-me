import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const checkout=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('RM055 supersedes the withdrawn global raw-art example and restores product-specific illustrations',()=>{
 assert.doesNotMatch(checkout,/STORE_EXAMPLE_ART|world-comic-v18/);
 for(const asset of ['poster','hoodie','tshirt','canvas','mug','blanket'])assert.ok(checkout.includes(`product-${asset}-v16.webp`));
 assert.match(checkout,/Style illustration · not a size proof/);
});
test('unverified roadmap remains available as a concise coming-soon list, not fake buyable products',()=>{
 const start=checkout.indexOf('function roadmapMarkup'),end=checkout.indexOf('let catalogExamplesPromise',start),block=checkout.slice(start,end);
 for(const item of ['Sticker Pack','Phone Case','Pillow','Notebook','Pet Bandana','Puzzle','Tote Bag'])assert.ok(block.includes(item));
 assert.doesNotMatch(block,/<img|recast-buy|Preview my product|from \$/);
});
test('cache-safe RM055 release loads the revised checkout and styling',()=>{
 assert.match(html,/product-polish-v53\.css\?v=4/);assert.match(html,/checkout\.js\?v=2551/);assert.match(html,/data-launch-build="RM-055"/);
});
