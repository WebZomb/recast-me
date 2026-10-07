import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {apparelEdgeMask,transparentCanvas,prepareApparelArtwork,isPng} from '../src/apparel-finish.js';
import {normalizeProductDesign,composeProductLayout,hash} from '../src/commerce-store.js';
import {finishApprovedDesign,printDesignFile} from '../src/order-approval.js';
import {watermarkProductSource} from '../src/preview-security.js';
import {Bucket,CLEAN,ID,TOKEN,setup} from './security-helpers.mjs';
function decodeGray(bytes){
  assert.ok(isPng(bytes));let p=8,width,height,transparency;const idats=[];
  while(p<bytes.length){const length=new DataView(bytes.buffer,bytes.byteOffset+p).getUint32(0),type=Buffer.from(bytes.subarray(p+4,p+8)).toString();const chunk=bytes.subarray(p+8,p+8+length);
    if(type==='IHDR'){const view=new DataView(chunk.buffer,chunk.byteOffset);width=view.getUint32(0);height=view.getUint32(4);assert.equal(chunk[8],8);assert.equal(chunk[9],0)}
    if(type==='tRNS')transparency=[...chunk];if(type==='IDAT')idats.push(chunk);p+=length+12;
  }
  const raw=inflateSync(Buffer.concat(idats));assert.equal(raw.length,(width+1)*height);return {width,height,transparency,pixel:(x,y)=>raw[y*(width+1)+x+1],raw};
}
function pngImages(output,{segmentFailure=false}={}){
  const calls=[];
  return {
    calls,
    info:async()=>({width:640,height:400}),
    input(stream){
      return {
        transform(options){calls.push(['transform',options]);return this},
        draw(overlay,options){calls.push(['draw',options]);return this},
        async output(options){
          calls.push(['output',options]);
          if(segmentFailure&&calls.some(([op,x])=>op==='transform'&&x.segment))throw new Error('fixture failure');
          return {response:()=>new Response(output,{headers:{'content-type':options.format}})};
        }
      };
    }
  };
}
test('soft-edge mask has a transparent rim, opaque center and binary print-safe halftone',async()=>{
 const {width,height,transparency,pixel}=decodeGray(await apparelEdgeMask(800,500));
 assert.deepEqual(transparency,[0,0]);assert.equal(width,800);assert.equal(height,500);
 for(let x=0;x<width;x++){assert.equal(pixel(x,0),0);assert.equal(pixel(x,height-1),0)}
 for(let y=0;y<height;y++){assert.equal(pixel(0,y),0);assert.equal(pixel(width-1,y),0)}
 assert.equal(pixel(400,250),255);
 let on=0,off=0;for(let y=1;y<45;y++)for(let x=100;x<700;x++){const n=pixel(x,y);assert.ok(n===0||n===255);if(n)on++;else off++}
 assert.ok(on>100&&off>100,'a real patterned edge, not a gray transparent rectangle');
 assert.deepEqual(await apparelEdgeMask(800,500),await apparelEdgeMask(800,500),'deterministic');
});
test('transparent canvas is entirely transparent and dimensions are bounded',async()=>{
 const d=decodeGray(await transparentCanvas(320,500));assert.deepEqual(d.transparency,[0,0]);assert.ok(d.raw.every(n=>n===0));
 await assert.rejects(()=>transparentCanvas(10000,10000),/dimensions/);await assert.rejects(()=>apparelEdgeMask(NaN,100),/dimensions/);
});
test('new garment finishes normalize to v5 transparent; existing approved v4 never changes',()=>{
 const map={product:'Hoodie'};
 for(const finish of ['cutout','soft','rectangle']){const d=normalizeProductDesign(map,{finish,scale:500});assert.equal(d.version,5);assert.equal(d.fill,'transparent');assert.equal(d.scale,100);assert.equal(d.finish,finish)}
 const old=normalizeProductDesign(map,{version:4,layout:'fit',fill:'dark',scale:85,finish:'cutout'});assert.equal(old.version,4);assert.equal(old.fill,'dark');assert.equal(old.finish,undefined);
 assert.equal(normalizeProductDesign({product:'Poster'},{finish:'cutout'}).version,4);
 assert.equal(normalizeProductDesign(map,{finish:'unknown'}).version,4);
});
test('one immutable cutout attempt is reused for both apparel products and fulfillment',async()=>{
 const output=await transparentCanvas(640,400),IMAGES=pngImages(output),env={ARTWORK:new Bucket(),IMAGES};
 await assert.rejects(()=>prepareApparelArtwork(env,CLEAN,'cutout'),/review/);
 const first=await prepareApparelArtwork(env,CLEAN,'cutout',{allowCreate:true});assert.deepEqual(first,output);
 const transforms=IMAGES.calls.filter(([op,o])=>op==='transform'&&o.segment==='foreground').length;assert.equal(transforms,1);
 await prepareApparelArtwork(env,CLEAN,'cutout');await prepareApparelArtwork(env,CLEAN,'cutout',{allowCreate:true});assert.equal(IMAGES.calls.filter(([op,o])=>op==='transform'&&o.segment).length,1);
 const key=[...env.ARTWORK.objects.keys()].find(k=>k.endsWith('.png'));const obj=env.ARTWORK.objects.get(key);obj.options.customMetadata.sha256='wrong';await assert.rejects(()=>prepareApparelArtwork(env,CLEAN,'cutout'),/review/);
});
test('failed cutout is never silently retried on print-source reads or payment',async()=>{
 const IMAGES=pngImages(await transparentCanvas(10,10),{segmentFailure:true}),env={ARTWORK:new Bucket(),IMAGES};
 await assert.rejects(()=>prepareApparelArtwork(env,CLEAN,'cutout',{allowCreate:true}),/Soft-edge photo/);
 await assert.rejects(()=>prepareApparelArtwork(env,CLEAN,'cutout',{allowCreate:true}),/Soft-edge photo/);
 assert.equal(IMAGES.calls.filter(([op,o])=>op==='transform'&&o.segment).length,1);
 assert.equal(await prepareApparelArtwork(env,CLEAN,'soft'),CLEAN,'soft-edge does not segment');
});
test('apparel composition uses a full transparent base, masks only soft photo and emits PNG',async()=>{
 for(const finish of ['soft','rectangle']){
  const IMAGES=pngImages(await transparentCanvas(800,1000)),env={ARTWORK:new Bucket(),IMAGES};
  const out=await composeProductLayout(env,CLEAN,{width:640,height:400},{width:4500,height:5400},{product:'T-Shirt'},{finish,scale:82},1000);
  assert.equal(out.mime,'image/png');assert.deepEqual(out.outputSize,{width:1000,height:1200});
  assert.equal(IMAGES.calls.some(([op,o])=>op==='transform'&&(o.segment||o.blur)),false);
  assert.equal(IMAGES.calls.some(([op,o])=>op==='draw'&&o.composite==='in'),finish==='soft');
  assert.equal(IMAGES.calls.at(-1)[1].format,'image/png');
  assert.ok(IMAGES.calls.find(([op,o])=>op==='draw'&&!o.composite)[1].left>0);
 }
});
test('supplier PNG watermark keeps alpha, exact dimensions and excludes the promotional footer',async()=>{
 const output=await apparelEdgeMask(320,200),IMAGES=pngImages(output),env={IMAGES};
 const result=await watermarkProductSource(env,CLEAN,'image/png');assert.ok(isPng(result));
 const draws=IMAGES.calls.filter(([op])=>op==='draw');assert.equal(draws.length,1);assert.equal(draws[0][1].composite,'atop');assert.equal(draws[0][1].repeat,true);
 assert.equal(IMAGES.calls.some(([op])=>op==='transform'),false,'no resize changes geometry');
 assert.equal(IMAGES.calls.at(-1)[1].quality,undefined,'truecolor alpha PNG, not PNG8');
});
test('approved v5 finish stores and serves clean PNG; token/payment gates remain',async()=>{
 const env=await setup(),png=await transparentCanvas(100,120);env.IMAGES=pngImages(png);
 const job={id:'garment-test',product:'Hoodie',requestId:ID,digital:false},b64=CLEAN.toString('base64'),sourceHash=await hash(b64),snapshotKey='commerce/test-approved.b64';
 const design={revision:1,approvedAt:'2026-10-07T00:00:00Z',sourceHash,snapshotKey,printToken:'private-fixture-print',proof:{design:normalizeProductDesign({product:'Hoodie'},{finish:'soft',scale:85}),position:{area_width:4500,area_height:5400}}};
 await env.ARTWORK.put(snapshotKey,b64);await env.ARTWORK.put('commerce/designs/garment-test.json',JSON.stringify(design));
 const result=await finishApprovedDesign(env,job);assert.equal(result.finalMime,'image/png');assert.match(result.finalKey,/\.png$/);assert.equal(result.finishMethod,'apparel-v5-clean-soft');
 assert.deepEqual(new Uint8Array(await(await env.ARTWORK.get(result.finalKey)).arrayBuffer()),png);
 const before=env.IMAGES.calls.length;await finishApprovedDesign(env,job);assert.equal(before,env.IMAGES.calls.length,'no rerender after finishing');
 let paidChecks=0;const verify=async()=>{paidChecks++};
 const file=await printDesignFile(new Request('https://recast.test/api/print-design/garment-test?token=private-fixture-print'),env,job,verify);assert.equal(file.headers.get('content-type'),'image/png');assert.equal(paidChecks,1);
 const denied=await printDesignFile(new Request('https://recast.test/api/print-design/garment-test?token=wrong'),env,job,verify);assert.equal(denied.status,404);assert.equal(paidChecks,1);
 await assert.rejects(()=>printDesignFile(new Request('https://recast.test/api/print-design/garment-test?token=private-fixture-print'),env,job,async()=>{throw new Error('unpaid')}),/unpaid/);
});
