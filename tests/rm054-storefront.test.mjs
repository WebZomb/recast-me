import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const checkout=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
test('RM055 supersedes the withdrawn global raw-art example and restores product-specific illustrations',()=>{
 assert.doesNotMatch(checkout,/STORE_EXAMPLE_ART|world-comic-v18/);
 for(const asset of ['poster','hoodie','tshirt','canvas','mug','blanket'])assert.ok(checkout.includes(`recast-lifestyle-${asset}-rm059.png`));
 assert.match(checkout,/Lifestyle example · preview your selected size/);
});
test('withdrawn roadmap does not duplicate active products or expose unverified buy buttons',()=>{
 const start=checkout.indexOf('function roadmapMarkup'),end=checkout.indexOf('let catalogExamplesPromise',start),block=checkout.slice(start,end);
 assert.match(block,/return ""/);
 assert.doesNotMatch(block,/<img|recast-buy|Preview my product|from \$/);
});
test('store loads versioned checkout and product styling from existing files',()=>{
 for(const pattern of [/href="(\/product-polish-v53\.css)\?v=(\d+)"/,/src="(\/checkout\.js)\?v=(\d+)"/]){
  const match=html.match(pattern);assert.ok(match);assert.ok(Number(match[2])>0);
  assert.ok(readFileSync(new URL('../public'+match[1],import.meta.url),'utf8').length>0);
 }
 assert.match(html,/data-launch-build="RM-056"/);
});
