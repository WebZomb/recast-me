import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {inflateSync} from 'node:zlib';
import {scenePrintBox,sceneEdgeMask,apparelEdgeMask} from '../src/apparel-finish.js';
import {normalizeProductDesign,composeProductLayout} from '../src/commerce-store.js';
import {mockupPosition} from '../src/workflow.js';

const checkout=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');

function maskPixels(bytes){let p=8,w,h,parts=[];while(p<bytes.length){const n=new DataView(bytes.buffer,bytes.byteOffset+p).getUint32(0),t=Buffer.from(bytes.subarray(p+4,p+8)).toString();if(t==='IHDR'){w=new DataView(bytes.buffer,bytes.byteOffset+p+8).getUint32(0);h=new DataView(bytes.buffer,bytes.byteOffset+p+12).getUint32(0)}if(t==='IDAT')parts.push(bytes.subarray(p+8,p+8+n));p+=n+12}const a=inflateSync(Buffer.concat(parts));return {w,h,a,pixel:(x,y)=>a[y*(w+1)+x+1]}}
function context(){const c={document:{querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){}},window:{},localStorage:{getItem:()=>null},location:{origin:'https://recast.test'},URL,console,setTimeout,fetch:async()=>({ok:false,json:async()=>({})})};vm.runInNewContext(readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8'),c);return c}

test('v6 print boxes fit every verified template without clipping at all offered scales',()=>{
 for(const [sw,sh] of [[1600,900],[900,1600],[1000,1000],[5000,500],[500,5000]])for(const [w,h] of [[2400,2880],[4096,5461],[1800,2400]])for(const scale of [70,85,100,118,500])for(const side of ['left','center','right']){
  const b=scenePrintBox(sw,sh,w,h,scale,side);assert.ok(b.left>=0&&b.top>=0);assert.ok(b.left+b.width<=w&&b.top+b.height<=h);assert.ok(Math.abs(b.width/b.height/(sw/sh)-1)<.01);
 }
 assert.throws(()=>scenePrintBox(0,100,300,500),/dimensions/);
});
test('new scene fade has irregular transparent corners, an opaque center and binary print alpha',async()=>{
 const bytes=await sceneEdgeMask(800,1000),m=maskPixels(bytes);
 assert.equal(m.pixel(400,500),255);assert.equal(m.pixel(30,30),0);
 for(let x=0;x<m.w;x++){assert.equal(m.pixel(x,0),0);assert.equal(m.pixel(x,m.h-1),0)}
 assert.ok(m.a.every(x=>x===0||x===255));
 assert.deepEqual(bytes,await sceneEdgeMask(800,1000));assert.notDeepEqual(bytes,await apparelEdgeMask(800,1000));
 let on=0,off=0;for(let y=10;y<160;y++)for(let x=100;x<700;x++)m.pixel(x,y)?on++:off++;assert.ok(on>1000&&off>1000);
});
test('v6 is explicit: existing version-5 and version-4 approved designs remain unchanged',()=>{
 const map={product:'Hoodie'},a=normalizeProductDesign(map,{version:5,finish:'soft',scale:112});assert.equal(a.version,5);assert.equal(a.scale,112);
 const b=normalizeProductDesign(map,{version:6,finish:'soft',scale:112});assert.equal(b.version,6);assert.equal(b.scale,100);
 assert.equal(normalizeProductDesign(map,{version:4,finish:'soft'}).version,4);
 assert.equal(normalizeProductDesign(map,{finish:'soft'}).version,5,'old unversioned callers retain v5');
});
test('portrait wall mockup uses verified rotatable Printful geometry and legacy proofs keep original orientation',()=>{
 const cat={printfiles:[{printfile_id:1,width:2400,height:1800,can_rotate:true}],variant_printfiles:[{variant_id:1349,placements:{default:1}}]};
 const p=v=>mockupPosition(cat,1349,'default',{width:1024,height:1280,product:'Poster',design:{version:v,orientation:'portrait'}});
 assert.equal(p(6).area_width,1800);assert.equal(p(6).area_height,2400);assert.equal(p(4).area_width,2400);assert.equal(p(4).area_height,1800);
});
test('apparel UI defaults cannot exceed the slider and requests carry the new revision',()=>{
 const c=context(),d=vm.runInNewContext(`productDesign({dataset:{productTitle:'Custom Recast Hoodie'},querySelector:()=>null})`,c);
 assert.equal(d.version,6);assert.equal(d.finish,'soft');assert.equal(d.scale,100);
 const markup=vm.runInNewContext(`designControlsMarkup('Custom Recast Hoodie',PRODUCT_DESIGN_PRESETS['Custom Recast Hoodie'])`,c);
 assert.match(markup,/max="100"/);assert.match(markup,/value="100"/);
});
test('a sample is accepted only for the exact SKU, exact settings and trusted static image URL',()=>{
 const c=context(),row={sku:'RECAST-HOODIE-S',status:'provider-verified',sourceHash:'a'.repeat(64),reviewedAt:'2026-10-07',variantIdentity:{id:10779},position:{area_width:4500,area_height:5400,width:4500,height:5400},image:'/assets/catalog/hoodie-s.jpg',design:{version:6,product:'Hoodie',finish:'soft',scale:100}};c.row=row;
 assert.equal(vm.runInNewContext(`trustedExample(row,'RECAST-HOODIE-S',row.design)`,c),true);
 assert.equal(vm.runInNewContext(`trustedExample(row,'RECAST-HOODIE-M',row.design)`,c),false);
 assert.equal(vm.runInNewContext(`trustedExample(row,'RECAST-HOODIE-S',{...row.design,scale:85})`,c),false);
 assert.equal(vm.runInNewContext(`trustedExample({...row,image:'https://malicious.test/image'},row.sku,row.design)`,c),false);
 assert.equal(vm.runInNewContext(`trustedExample({...row,variantIdentity:null},row.sku,row.design)`,c),false);
});
test('unknown default image titles are product views, not mislabeled 3D room scenes',()=>{
 const c=context();assert.equal(vm.runInNewContext(`viewLabel('Default',0)`,c),'Product');
 assert.equal(vm.runInNewContext(`uniqueMockupViews([{title:'Living room',group:'Default',url:'1'}])[0].label`,c),'In a room');
});

test('store cards keep curated examples instead of replacing them with supplier samples',async()=>{
  assert.match(checkout,/USE_SUPPLIER_EXAMPLES_ON_STORE_CARDS=false/);
  assert.match(checkout,/if\(!USE_SUPPLIER_EXAMPLES_ON_STORE_CARDS\|\|!card\|\|!sku\)return/);
  assert.match(checkout,/Lifestyle example · preview your selected size/);
});

test('published samples match exact mapped suppliers and only visually reviewed products',async()=>{
 const {FULFILLMENT}=await import('../src/entry.js');
 const data=JSON.parse(readFileSync(new URL('../public/catalog-examples.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(data.examples).length,7);
 const c=context();
 for(const [sku,row] of Object.entries(data.examples)){
  const map=FULFILLMENT[sku];assert.ok(map&&!map.digital);assert.equal(row.variantIdentity.id,map.printfulVariantId);assert.equal(row.variantIdentity.productId,map.printfulProductId);assert.equal(row.design.product,map.product);
  assert.match(row.imageSha256,/^[a-f0-9]{64}$/);assert.match(row.sourceHash,/^[a-f0-9]{64}$/);assert.equal(row.providerRun,'37585045651');
  c.row=row;assert.ok(vm.runInNewContext('trustedExample(row,row.sku,row.design)',c));
  if(map.quantity>1)assert.match(row.variantLabel,/one shown/);
 }
 for(const sku of ['RECAST-CANVAS-12X16','RECAST-BLANKET-50X60','RECAST-TUMBLER-20OZ']){assert.equal(data.examples[sku],undefined);assert.ok(data.pending[sku]);}
 assert.equal(data.examples['RECAST-POSTER-12X16'].viewType,'Room');
 assert.equal(data.examples['RECAST-HOODIE-S'].viewType,'Front');
});
