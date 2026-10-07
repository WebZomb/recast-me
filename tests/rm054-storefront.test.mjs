import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const checkout=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/product-polish-v53.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('RM054 store uses one temporary superhero-and-dog example story across the lineup',()=>{
 assert.match(checkout,/STORE_EXAMPLE_ART="\/assets\/world-comic-v18\.webp"/);
 for(const title of ['Custom Recast Poster','Custom Recast Hoodie','Custom Recast Sticker Pack','Custom Recast Phone Case','Custom Recast Pillow','Custom Recast Notebook','Custom Recast Pet Bandana','Custom Recast Puzzle','Custom Recast Tote Bag']) assert.ok(checkout.includes(title),title);
 assert.match(checkout,/Matching superhero-and-dog example design/);
 assert.match(css,/one consistent temporary superhero \+ dog storefront story/);
});

test('approved additions are visible but locked until fulfillment verification',()=>{
 assert.match(checkout,/const ROADMAP_PRODUCTS=/);
 assert.match(checkout,/Finishing product setup/);
 assert.match(checkout,/Purchasing unlocks after its real Printful preview and automatic fulfillment path pass verification/);
 const start=checkout.indexOf('function roadmapMarkup');
 const end=checkout.indexOf('function lastRequest',start);
 const roadmapBlock=checkout.slice(start,end);
 assert.doesNotMatch(roadmapBlock,/Preview my product/);
 assert.match(roadmapBlock,/disabled>Finishing product setup/);
});

test('storefront cache keys advance for RM054 presentation',()=>{
 assert.match(html,/product-polish-v53\.css\?v=3/);
 assert.match(html,/checkout\.js\?v=254/);
});
