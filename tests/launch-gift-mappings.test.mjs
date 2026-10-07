import test from 'node:test';
import assert from 'node:assert/strict';
import {FULFILLMENT} from '../src/entry.js';
import {productPlacements,productionFiles,productPrintfile} from '../src/commerce-store.js';
// Exact identities observed in the authenticated Printful catalog, 2026-10-07.
test('new gift SKUs match actual supplier products, sizes and phone models',()=>{
 const cases={IP14:16240,IP14PLUS:16242,IP14PRO:16241,IP14PM:16243,IP15:17616,IP15PRO:17618,IP15PM:17619,IP16:20290,IP16PRO:20292};
 for(const [name,id] of Object.entries(cases)){const m=FULFILLMENT['RECAST-CASE-'+name];assert.equal(m.printfulProductId,181);assert.equal(m.printfulVariantId,id);}
 for(const [size,id] of Object.entries({14:49853,16:49854,18:4532,22:11075})){const m=FULFILLMENT['RECAST-PILLOW-'+size];assert.equal(m.printfulProductId,83);assert.equal(m.printfulVariantId,id);}
 for(const [sku,p,v] of [['RECAST-STICKER-3X3',358,10163],['RECAST-JOURNAL-HC',867,22658],['RECAST-TOTE-BLACK',84,4533],['RECAST-PUZZLE-252',534,13431],['RECAST-PUZZLE-520',534,13432]]){assert.equal(FULFILLMENT[sku].printfulProductId,p);assert.equal(FULFILLMENT[sku].printfulVariantId,v);}
 assert.equal(FULFILLMENT['RECAST-TOTE-BLACK'].preferredPlacement,'default');assert.equal(FULFILLMENT['RECAST-TOTE-BLACK'].orderFileType,'default');
});
test('pillow preview and production use identical art on both verified print areas',()=>{
 const map=FULFILLMENT['RECAST-PILLOW-14'],design={version:6,product:'Pillow'};
 const catalog={printfiles:[{printfile_id:1701,width:2250,height:2250}],variant_printfiles:[{variant_id:49853,placements:{front:1701,back:1701}}]};
 assert.deepEqual(productPlacements(map,design),['front','back']);assert.deepEqual(productPrintfile(catalog,49853,'front'),productPrintfile(catalog,49853,'back'));
 const position={area_width:2250,area_height:2250,width:2250,height:2250,left:0,top:0};
 assert.deepEqual(productionFiles(map,design,'https://recast.test/approved-clean',position),['front','back'].map(type=>({type,url:'https://recast.test/approved-clean',position})));
 assert.deepEqual(productPlacements(map,{version:4}),['front']);
 assert.equal(productionFiles(FULFILLMENT['RECAST-MUG-11OZ'],{version:6},'url',position).length,1);
});

test('journal keeps whole portrait on separate covers without changing old approvals',async()=>{
 const {normalizeProductDesign,composeProductLayout}=await import('../src/commerce-store.js');
 const map=FULFILLMENT['RECAST-JOURNAL-HC'];
 assert.equal(normalizeProductDesign(map,{version:6,layout:'cover'}).layout,'cover');
 const env={IMAGES:{input(){const chain={transform(){return chain},draw(){return chain},async output(){return {response:()=>new Response(new Uint8Array([255,216,255,...Array(100).fill(0)]))}}};return chain}}};
 for(const [width,height] of [[900,1600],[1600,900],[1000,1000]]){
  const out=await composeProductLayout(env,new Uint8Array([1]),{width,height},{width:4065,height:2850},map,{version:7,scale:140},2400);
  assert.equal(out.design.version,7);assert.equal(out.design.scale,100);assert.equal(out.artworkBoxes.length,2);
  const [back,front]=out.artworkBoxes;
  for(const b of [back,front]){assert.ok(b.top>0&&b.top+b.height<out.outputSize.height);assert.ok(Math.abs(b.width/b.height-width/height)<.002)}
  assert.ok(back.left>0&&back.left+back.width<1200);assert.ok(front.left>1200&&front.left+front.width<2400);
 }
});

test('phone layout reserves the camera area and keeps the complete image within the case',async()=>{
 const {normalizeProductDesign,composeProductLayout}=await import('../src/commerce-store.js');
 const map=FULFILLMENT['RECAST-CASE-IP14PM'];
 assert.equal(normalizeProductDesign(map,{version:6,layout:'cover'}).version,6);
 const env={IMAGES:{input(){const chain={transform(){return chain},draw(){return chain},async output(){return {response:()=>new Response(new Uint8Array([255,216,255,...Array(100).fill(0)]))}}};return chain}}};
 for(const [width,height] of [[900,1600],[1600,900],[1000,1000]]){
  const out=await composeProductLayout(env,new Uint8Array([1]),{width,height},{width:900,height:1800},map,{version:7,scale:140},1200);
  const b=out.artworkBox;assert.equal(out.design.version,7);assert.equal(out.design.scale,100);
  assert.ok(b.top>=out.outputSize.height*.32);assert.ok(b.left>0&&b.left+b.width<out.outputSize.width);assert.ok(b.top+b.height<out.outputSize.height);assert.ok(Math.abs(b.width/b.height-width/height)<.002);
 }
});
