import test from 'node:test';
import assert from 'node:assert/strict';
import {stickerSheetBoxes,normalizeProductDesign,composeProductLayout,productionFiles,hash} from '../src/commerce-store.js';
import {finishApprovedDesign,printDesignFile} from '../src/order-approval.js';
import {FULFILLMENT} from '../src/entry.js';
import {transparentCanvas} from '../src/apparel-finish.js';
import {watermarkProductSource,secureApplication} from '../src/preview-security.js';
import {CLEAN,ID,PRINT,setup} from './security-helpers.mjs';
const map=FULFILLMENT['RECAST-STICKER-PACK'];
test('prepared sheet preview stays behind its artwork print token',async()=>{
 const env=await setup(),app=secureApplication({fetch(){throw new Error('unexpected fallthrough')}}),prepared='a'.repeat(64),png=await transparentCanvas(100,142);
 await env.ARTWORK.put(`requests/${ID}/sheet-preview-${prepared}.png`,png);
 const request=(token,id=ID,p=prepared)=>app.fetch(new Request(`https://recast.test/api/print-source/${id}?token=${token}&prepared=${p}`),env,{});
 const allowed=await request(PRINT);assert.equal(allowed.status,200);assert.equal(allowed.headers.get('content-type'),'image/png');assert.deepEqual(new Uint8Array(await allowed.arrayBuffer()),png);
 assert.equal((await request('wrong')).status,404);assert.equal((await request(PRINT,ID,'b'.repeat(64))).status,404);assert.equal((await request(PRINT,ID,'../../file')).status,404);
});
test('approved sheet prints six clean pictures once, with payment and token gates',async()=>{
 const env=await setup(),out=await transparentCanvas(100,142),draws=[];
 env.IMAGES={info:async()=>({width:800,height:1000}),input(){return {transform(){return this},draw(o,p){draws.push(p);return this},async output(){return {response:()=>new Response(out)}}}}};
 const job={id:'sheet-approved',product:'Sticker Sheet',requestId:ID,digital:false},b64=CLEAN.toString('base64'),sourceHash=await hash(b64),snapshotKey='commerce/sheet-approved.b64';
 const design={revision:1,approvedAt:'2026-10-08T00:00:00Z',sourceHash,snapshotKey,printToken:'fixture-sheet-print',proof:{design:normalizeProductDesign(map,{}),position:{area_width:1750,area_height:2482}}};
 await env.ARTWORK.put(snapshotKey,b64);await env.ARTWORK.put('commerce/designs/sheet-approved.json',JSON.stringify(design));
 const finished=await finishApprovedDesign(env,job);
 assert.equal(finished.finalMime,'image/png');assert.match(finished.finalKey,/\.png$/);assert.equal(finished.finishMethod,'product-layout-v8-clean');
 assert.equal(draws.length,6);assert.ok(draws.every(o=>!o.repeat&&!o.composite),'no watermark or footer in purchased print');
 await finishApprovedDesign(env,job);assert.equal(draws.length,6,'approved file is immutable and reused');
 let paidChecks=0;
 const response=await printDesignFile(new Request('https://recast.test/api/print-design/sheet-approved?token=fixture-sheet-print'),env,job,async()=>paidChecks++);
 assert.equal(response.headers.get('content-type'),'image/png');assert.equal(paidChecks,1);
 const denied=await printDesignFile(new Request('https://recast.test/api/print-design/sheet-approved?token=wrong'),env,job,async()=>paidChecks++);
 assert.equal(denied.status,404);assert.equal(paidChecks,1);
 await assert.rejects(()=>printDesignFile(new Request('https://recast.test/api/print-design/sheet-approved?token=fixture-sheet-print'),env,job,async()=>{throw new Error('unpaid')}),/unpaid/);
});
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
 assert.equal(calls.filter(([k])=>k==='transform').length,1,'resize once so six pictures stay within provider transform limit');
 calls.length=0;await watermarkProductSource({IMAGES},CLEAN,'image/png');
 assert.equal(calls.find(([k])=>k==='draw')[1].composite,'atop');assert.equal(calls.at(-1)[1].format,'image/png');
 await assert.rejects(()=>composeProductLayout({IMAGES},CLEAN,{width:1,height:1},{width:100,height:100},map),/template/);
});
