import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {groupGenerationErrors,filterGenerationErrors,diagnosticSummary} from '../public/generation-dashboard.js';
import {saveRecast,savedRecasts,productLink} from '../public/recast-collection.js';
const text=p=>fs.readFileSync(p,'utf8');

test('duplicate diagnostic and attempt entries appear once with latest time',()=>{
 const ref='GEN-MV4BTEGM-9348';
 const entries=[
  {diagnosticId:ref,stage:'ai-generation',reason:'protected_edit',qualityMode:'high',createdAt:'2026-10-11T21:19:34.774Z',
   providerMessage:'Image processor changed the test dimensions.'},
  {diagnosticId:ref,attemptId:'SRV-TEST',stage:'ai-generation',reason:'protected_edit',qualityMode:'high',
   updatedAt:'2026-10-11T21:19:35.338Z',status:'failed'},
  {diagnosticId:'GEN-NEWER-2211',reason:'timeout',qualityMode:'quick',updatedAt:'2026-10-12T03:00:00Z'}
 ];
 const groups=groupGenerationErrors(entries);
 assert.equal(groups.length,2);
 assert.equal(groups[0].reference,'GEN-NEWER-2211');
 assert.equal(groups[1].reference,ref);
 assert.equal(groups[1].repeats,2);
 assert.equal(groups[1].providerNote,'Image processor changed the test dimensions.');
 assert.equal(groups[1].summary,'Protected image edit rejected');
 assert.equal(groups[1].occurredAt,'2026-10-11T21:19:35.338Z');
});
test('text filtering searches reason, quality mode and ID without exposing raw JSON first',()=>{
 const grouped=groupGenerationErrors([
  {diagnosticId:'GEN-TEST-1000',reason:'quota',qualityMode:'high',createdAt:'2026-10-13T01:00:00Z'},
  {diagnosticId:'GEN-TEST-2000',reason:'timeout',qualityMode:'quick',createdAt:'2026-10-13T02:00:00Z'}
 ]);
 assert.equal(filterGenerationErrors(grouped,'quota').length,1);
 assert.equal(filterGenerationErrors(grouped,'GEN-TEST-2000').length,1);
 assert.equal(filterGenerationErrors(grouped,'quick').length,1);
 assert.equal(filterGenerationErrors(grouped,'totally bogus').length,0);
 assert.equal(diagnosticSummary({reason:'protected_edit'}),'Protected image edit rejected');
 const ui=text('public/admin-generation-ui.js'),html=text('public/admin.html');
 assert.match(ui,/let groups=\[\],shown=5/);
 assert.match(ui,/shown\+=5/);
 assert.match(ui,/el\('details','diagnostic-technical'\)/);
 assert.match(ui,/navigator\.clipboard\.writeText\(item\.reference\)/);
 assert.match(html,/id="generation-filter"/);
 assert.match(html,/id="generation-show-more"/);
 assert.match(html,/admin\.js\?v=rm166/);
});
test('the two illustrated worlds are original standalone SVG with only local assets',()=>{
 const a=text('public/assets/recast-discover-portal-v159.svg');
 const b=text('public/assets/recast-surprise-prism-v159.svg');
 for(const art of [a,b]){
  assert.match(art,/<svg\b/);
  assert.match(art,/<\/svg>\s*$/);
  assert.match(art,/<radialGradient/);
  assert.match(art,/<filter/);
  assert.ok(art.length>4500);
  assert.doesNotMatch(art,/<script|<foreignObject|\s(?:xlink:)?href\s*=|url\(["']?https?:/i);
 }
 assert.match(a,/Grand golden multi-ring portal/);
 assert.match(b,/Central three-dimensional mystery die/);
 const page=text('public/index.html'),css=text('public/simple-flow-v117.css');
 assert.match(page,/recast-discover-cinematic-v160\.webp/);
 assert.match(page,/recast-surprise-cinematic-v160\.webp/);
 assert.match(page,/simple-flow-v117\.css\?v=7/);
 assert.match(css,/\.discovery-art-v159/);
 assert.match(text('public/discovery-glass-v160.css'),/\.discovery-art-v160/);
 for(const image of ['recast-discover-cinematic-v160.webp','recast-surprise-cinematic-v160.webp']){
  assert.ok(fs.statSync('public/assets/'+image).size>100000,image+' should be a full-quality generated illustration');
 }
});
test('mobile navigation order is Create, My Recasts, My Orders, Guide, without old floating pill',()=>{
 const nav=text('public/mobile-bottom-nav.js');
 const names=['Create','My Recasts','My Orders','Specials','Guide'];
 const positions=names.map(name=>nav.indexOf("label:'"+name+"'"));
 assert.ok(positions.every(x=>x>=0));
 assert.ok(positions.every((x,i)=>i===0||x>positions[i-1]));
 assert.doesNotMatch(nav,/document\.body\.append\(a\)/);
 assert.doesNotMatch(nav,/recast-legacy-orders-pill/);
 for(const file of ['index.html','my-recasts.html','my-orders.html','guide.html','order.html','purchase-demo.html']){
  assert.match(text('public/'+file),/mobile-bottom-nav\.js\?v=164/,file);
 }
});
test('saved Recasts show individual ID and reusable clean-image product link',()=>{
 globalThis.location={origin:'https://recastmeai.com'};
 const table=new Map();
 globalThis.localStorage={getItem:key=>table.get(key)||null,setItem:(key,value)=>table.set(key,String(value))};
 const recast={requestId:'RC-TEST-1234',accessToken:'a'.repeat(64),styleName:'DJ Night'};
 assert.equal(saveRecast(recast).ok,true);
 const saved=savedRecasts()[0];
 assert.equal(saved.requestId,recast.requestId);
 const url=new URL(productLink(saved));
 assert.equal(url.origin,'https://recastmeai.com');
 assert.equal(new URLSearchParams(url.hash.slice(1)).get('shop'),'1');
 assert.equal(new URLSearchParams(url.hash.slice(1)).get('recast'),recast.requestId);
 assert.equal(new URLSearchParams(url.hash.slice(1)).get('key'),recast.accessToken);
 const ui=text('public/my-recasts.js'),nativeBridge=text('public/app.js');
 assert.match(ui,/Use on a Product/);
 assert.match(ui,/Copy Artwork ID/);
 assert.match(ui,/item\.requestId/);
 assert.match(nativeBridge,/styleName:lastSuccessfulPreviewMeta/);
});
