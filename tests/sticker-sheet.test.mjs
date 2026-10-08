import test from 'node:test';
import assert from 'node:assert/strict';
import {stickerSheetBoxes,normalizeProductDesign,composeProductLayout,productionFiles} from '../src/commerce-store.js';
import {FULFILLMENT} from '../src/entry.js';
import {transparentCanvas} from '../src/apparel-finish.js';
import {watermarkProductSource} from '../src/preview-security.js';
import {CLEAN} from './security-helpers.mjs';
const map=FULFILLMENT['RECAST-STICKER-PACK'];
test('sheet uses one exact supplier sheet while historical single remains intact',()=>{
 assert.equal(map.printfulProductId,505);assert.equal(map.printfulVariantId,12917);assert.equal(map.quantity,1);
 assert.equal(FULFILLMENT['RECAST-STICKER-3X3'].printfulVariantId,10163);
 const d=normalizeProductDesign(map,{version:4,layout:'cover',scale:900,fill:'dark'});
 assert.equal(d.version,8);assert.equal(d.layout,'six-pictures');assert.equal(d.scale,100);assert.equal(d.fill,'transparent');
 assert.equal(productionFiles(map,d,'clean.png',{}).length,1);assert.equal(productionFiles(map,d,'clean.png',{})[0].type,'default');
});
test('six pictures preserve aspect and safe cut spacing at preview and print resolutions',()=>{
 for(const width of [1750,2400,4096])for(const source of [{width:1024,height:1024},{width:800,height:1200},{width:1200,height:800}]){
  const height=Math.round(width*2482/1750),u=width/1750,b=stickerSheetBoxes(source,width,height);
  assert.equal(b.length,6);
  for(const x of b){assert.ok(x.left>=149*u&&x.top>=149*u);assert.ok(x.left+x.width<=width-149*u);assert.ok(x.top+x.height<=height-149*u);assert.ok(Math.abs(x.width/x.height-source.width/source.height)<.003);}
  assert.ok(b[1].left-b[0].left-b[0].width>=119*u);assert.ok(b[2].top-b[0].top-b[0].height>=119*u);
 }
 assert.throws(()=>stickerSheetBoxes({width:10000,height:100},1750,2482),/panoramic/);
});
test('sheet composition and protected source keep transparent gaps and no extra printed objects',async()=>{
 const calls=[],out=await transparentCanvas(800,1135);
 const IMAGES={info:async()=>({width:800,height:1135}),input(){return {transform(o){calls.push(['transform',o]);return this},draw(o,p){calls.push(['draw',p]);return this},async output(o){calls.push(['output',o]);return {response:()=>new Response(out)}}}}};
 const composed=await composeProductLayout({IMAGES},CLEAN,{width:800,height:1000},{width:1750,height:2482},map,{},800);
 assert.equal(composed.mime,'image/png');assert.equal(composed.artworkBoxes.length,6);assert.equal(calls.filter(([k])=>k==='draw').length,6);assert.ok(calls.filter(([k])=>k==='transform').every(([,o])=>o.fit==='squeeze'&&!o.segment&&!o.blur));
 calls.length=0;await watermarkProductSource({IMAGES},CLEAN,'image/png');
 assert.equal(calls.find(([k])=>k==='draw')[1].composite,'atop');assert.equal(calls.at(-1)[1].format,'image/png');
 await assert.rejects(()=>composeProductLayout({IMAGES},CLEAN,{width:1,height:1},{width:100,height:100},map),/template/);
});
