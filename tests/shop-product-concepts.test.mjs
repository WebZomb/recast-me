import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewImageUrl,blanketPreviewRatio,conceptSizeOptions,conceptStyle} from '../public/shop-product-concepts.js';
import {BLANKET_SIZES,PLANNING_DPI,blanketPrintAudit,blanketDesignAudit} from '../public/shop-print-readiness.js';

const data=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8'));
const designs=data.designs;
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const sizes=Object.keys(BLANKET_SIZES);
test('supplier-linked original image identities remain immutable and thumbnails are only an image CDN transform',()=>{
 assert.equal(designs.length,35);
 const image=designs[0].artworkImage,url=new URL(previewImageUrl(image,640));
 assert.equal(url.protocol,'https:');
 assert.equal(url.hostname,'cdn.shopify.com');
 assert.equal(url.searchParams.get('v'),new URL(image).searchParams.get('v'));
 assert.equal(url.searchParams.get('width'),'640');
 assert.equal(previewImageUrl('https://evil.example/looks-like-shopify.png'),null);
 assert.equal(previewImageUrl('http://cdn.shopify.com/s/files/1/0854/3810/3796/files/pet.png'),null);
 assert.equal(previewImageUrl('https://cdn.shopify.com/s/files/1/9999/files/pet.png'),null);
 assert.equal(previewImageUrl('data:image/png;base64,secret'),null);
 assert.equal(new Set(designs.map(d=>previewImageUrl(d.artworkImage,640))).size,35);
});
test('print planning preserves the two exact Shopify/Printful blanket mappings',()=>{
 assert.deepEqual(sizes,['50 × 60 in','60 × 80 in']);
 assert.deepEqual(sizes.map(s=>BLANKET_SIZES[s].sku),['RECAST-BLANKET-50X60','RECAST-BLANKET-60X80']);
 assert.equal(PLANNING_DPI,150);
 assert.equal(blanketPreviewRatio('50 × 60 in'),5/6);
 assert.equal(blanketPreviewRatio('60 × 80 in'),3/4);
 assert.deepEqual(conceptSizeOptions('blankets',sizes),sizes);
 assert.deepEqual(conceptSizeOptions('pillows',['14 in']),[]);
 assert.equal(conceptStyle('phone-cases'),'phone-cases');
 assert.equal(conceptStyle('__unsafe'),'blankets');
});
test('full-bleed blanket print candidates are blocked if small source would require stretching',()=>{
 const source={width:1254,height:1254};
 const medium=blanketPrintAudit(source,'50 × 60 in');
 assert.equal(medium.sourceKnown,true);
 assert.equal(medium.effectiveDpi,20.9);
 assert.deepEqual(medium.requiredPixels,{width:7500,height:9000});
 assert.equal(medium.fullBleedReady,false);
 assert.equal(medium.reason,'higher_resolution_master_required');
 const large=blanketPrintAudit(source,'60 × 80 in');
 assert.deepEqual(large.requiredPixels,{width:9000,height:12000});
 assert.equal(large.effectiveDpi,15.7);
 assert.equal(large.fullBleedReady,false);
 assert.equal(blanketPrintAudit({width:9500,height:12500},'60 × 80 in').reason,'supplier_proof_still_required');
 assert.equal(blanketPrintAudit({width:9500,height:12500},'60 × 80 in').fullBleedReady,true);
 assert.equal(blanketPrintAudit({width:0,height:1254},'50 × 60 in').reason,'source_dimensions_unknown');
 assert.throws(()=>blanketPrintAudit(source,'unknown'),TypeError);
});
test('all 70 blanket-size candidates require high-resolution artwork and individual manufacturer proofs',()=>{
 const candidates=designs.flatMap(blanketDesignAudit);
 assert.equal(candidates.length,70);
 assert.equal(candidates.filter(c=>!c.fullBleedReady).length,70);
 assert.equal(new Set(candidates.map(c=>c.designId+'|'+c.sku)).size,70);
 assert.equal(new Set(candidates.map(c=>c.artworkRevision)).size,35);
 assert.ok(candidates.every(c=>c.reason==='higher_resolution_master_required'));
});
test('distinct product concepts are never manufacturer mockups or bypassed checkout',()=>{
 const code=read('public/shop-product-concepts.js');
 const ui=read('public/shop-category.js');
 const css=read('public/shop-product-concepts.css');
 assert.match(code,/dataset.previewKind='illustration'/);
 assert.match(code,/not a real Printful mockup/);
 assert.match(code,/collection-preview--blanket/);
 assert.match(css,/collection-preview--pillows/);
 assert.match(css,/collection-preview--phone-cases/);
 assert.match(css,/collection-preview--hoodies/);
 assert.match(css,/collection-preview--tote-bags/);
 assert.match(css,/collection-preview--blankets.*collection-artwork/);
 assert.match(ui,/createProductConcept\(/);
 assert.match(ui,/blanketPrintAudit\(/);
 assert.match(ui,/Real Printful pending/);
 assert.match(ui,/addPremade\(offer\)/);
 assert.doesNotMatch(ui,/\.salesImage/,'Do not recycle a mug sales illustration as a physical blanket image');
 const slugs=['blankets','pillows','canvas','tumblers','hoodies','t-shirts','tote-bags','phone-cases','sticker-sheets','stickers','posters','framed-prints','journals','coaster-sets','magnet-sets','puzzles'];
 for(const slug of slugs){
  const html=read('public/shop-'+slug+'.html');
  assert.match(html,/shop-category\.js\?v=2/);
  assert.match(html,/shop-category\.css\?v=2/);
  assert.match(html,/name="robots" content="noindex,follow"/);
 }
});
