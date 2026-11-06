import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bucket,CLEAN} from './security-helpers.mjs';
import {EXPANSION_DESIGNS,EXPANSION_ITEMS} from '../src/shop-expansion.js';
import {FULFILLMENT} from '../src/entry.js';
import {hash} from '../src/commerce-store.js';
import {knownSiameseImportFailure,prepareFirstSiamesePreview,siameseSourceRepairRoute} from '../src/shop-siamese-source-repair.js';
const source=EXPANSION_DESIGNS.find(s=>s.id==='christmas-village-siamese-cat');
const items=EXPANSION_ITEMS.filter(i=>i.designId===source.id);
const root='shop/recovery/owner-siamese-20261106/';
const put=(env,key,value)=>env.ARTWORK.put(key,JSON.stringify(value));
const get=async(env,key)=>(await env.ARTWORK.get(key))?.json();
async function fixture({metadata=true}={}){
 const env={ARTWORK:new Bucket(),IMAGES:{info:async()=>({width:1254,height:1254})},ADMIN_TOKEN:'owner-test-secret'};
 const states=items.map(i=>({id:i.id,status:'needs_review',code:i.id.endsWith('11oz')?9502:'seed_source_pending'}));
 for(const state of states)await put(env,'shop/preparation/v3/'+state.id+'.json',state);
 const oldClaim={startedAt:'2026-11-03T23:00:00Z'};
 await put(env,'shop/preparation/v3/source-'+source.id+'.claim',oldClaim);
 const meta={requestId:source.requestId,source:'premade-catalog',catalogDesignId:source.id,catalogMasterHash:source.sha256,catalogRightsConfirmedAt:'2026-11-06T00:00:00Z',contentSafety:{status:'passed'},accessToken:'private-source-fixture',width:1254,height:1254};
 if(metadata){await put(env,`requests/${source.requestId}/request.json`,meta);await env.ARTWORK.put(`requests/${source.requestId}/preview.b64`,CLEAN.toString('base64'));}
 return {env,states,oldClaim,meta};
}
const endpoint='https://recast.test/api/admin/shop-source-repair/siamese';
function req(body,{owner=true,origin='https://recast.test',method=body?'POST':'GET'}={}){return new Request(endpoint,{method,headers:{...(owner?{authorization:'Bearer owner-test-secret'}:{}),origin,'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});}
test('only the two exact pre-provider source errors qualify',()=>{
 const original=[{id:items[0].id,status:'needs_review',code:9502},{id:items[1].id,status:'needs_review',code:'seed_source_pending'}];
 assert.equal(knownSiameseImportFailure(original),true);
 for(const change of [{mockupId:'prior-task'},{offer:{}},{startedAt:'previous-provider-attempt'},{code:500},{status:'pending_preview'}])assert.equal(knownSiameseImportFailure([{...original[0],...change},original[1]]),false);
 assert.equal(knownSiameseImportFailure([original[0]]),false);
});
test('anonymous or cross-origin requests cannot read or mutate private source records',async()=>{
 const env={ADMIN_TOKEN:'owner-test-secret',ARTWORK:{get(){throw Error('private storage must not be accessed')}}};
 assert.equal((await siameseSourceRepairRoute(req(null,{owner:false}),env)).status,401);
 assert.equal((await siameseSourceRepairRoute(req({confirmFirstPreview:true,sourceRevision:source.sha256,sku:items[0].sku},{origin:'https://untrusted.example'}),env)).status,403);
 const fx=await fixture();
 const response=await siameseSourceRepairRoute(req(null),fx.env),body=await response.json();
 assert.equal(response.status,200);assert.equal(body.items.length,2);assert.equal(body.automaticPublication,false);
 assert.doesNotMatch(JSON.stringify(body),/private-source-fixture|accessToken|owner-test-secret/);
 assert.equal((await siameseSourceRepairRoute(req({sourceRevision:source.sha256,sku:items[0].sku}),fx.env)).status,400);
});
test('the existing approved source prepares exactly one first task and keeps checkout disabled',async()=>{
 const fx=await fixture(),item=items[0];let calls=0;
 const create=async request=>{
  calls++;const body=await request.json();assert.equal(body.sku,item.sku);assert.equal(body.requestId,source.requestId);
  const preview=await fx.env.ARTWORK.get(`requests/${source.requestId}/preview.b64`);
  await put(fx.env,`mockups/${source.requestId}/${item.sku}/first-preview/task.json`,{requestId:source.requestId,sku:item.sku,mockupId:'first-preview',taskKey:'private-provider-task',status:'pending',design:body.design,sourceHash:await hash((await preview.text())+'|'+JSON.stringify(body.design)),printfulProductId:FULFILLMENT[item.sku].printfulProductId,printfulVariantId:FULFILLMENT[item.sku].printfulVariantId});
  return Response.json({ok:true,mockupId:'first-preview',status:'pending'});
 };
 const result=await prepareFirstSiamesePreview(fx.env,item.sku,{create,rate:async()=>true});
 assert.deepEqual(result,{id:item.id,status:'pending_preview',checkoutEnabled:false,requiresVisualApproval:true});
 assert.equal(calls,1);
 assert.equal((await get(fx.env,'shop/preparation/v3/'+item.id+'.json')).status,'pending_preview');
 assert.deepEqual(await get(fx.env,root+item.id+'/original-hold.json'),fx.states[0]);
 assert.deepEqual(await get(fx.env,'shop/preparation/v3/source-'+source.id+'.claim'),fx.oldClaim);
 await assert.rejects(prepareFirstSiamesePreview(fx.env,item.sku,{create,rate:async()=>true}),/already has an attempt record/);
 assert.equal(calls,1);assert.equal(await fx.env.ARTWORK.get('shop/catalog/v1.json'),null);
});
test('saved supplier evidence or an unknown SKU cannot create a replacement task',async()=>{
 const fx=await fixture(),item=items[0];let rate=0;
 await fx.env.ARTWORK.put(`mockups/${source.requestId}/${item.sku}/existing/task.json`,'{}');
 await assert.rejects(prepareFirstSiamesePreview(fx.env,item.sku,{rate:async()=>{rate++;return true;}}),/existing supplier record/);
 assert.equal(rate,0);assert.equal(await fx.env.ARTWORK.get(root+item.id+'.json'),null);
 await assert.rejects(prepareFirstSiamesePreview(fx.env,'RECAST-BLANKET-50X60'),/two existing Siamese mug sizes/);
});
test('rate exhaustion is safe to retry because no supplier attempt or claim was created',async()=>{
 const fx=await fixture();let created=0;
 await assert.rejects(prepareFirstSiamesePreview(fx.env,items[0].sku,{rate:async()=>false,create:async()=>{created++;}}),/rate window is full/);
 assert.equal(created,0);assert.equal(await fx.env.ARTWORK.get(root+items[0].id+'.json'),null);
 assert.deepEqual(await get(fx.env,'shop/preparation/v3/'+items[0].id+'.json'),fx.states[0]);
});
test('a lost first-preview response is recorded and never submitted twice',async()=>{
 const fx=await fixture();let created=0;
 const create=async()=>{created++;throw Error('provider response interrupted')};
 await assert.rejects(prepareFirstSiamesePreview(fx.env,items[0].sku,{create,rate:async()=>true}),/interrupted/);
 await assert.rejects(prepareFirstSiamesePreview(fx.env,items[0].sku,{create,rate:async()=>true}),/already has an attempt/);
 assert.equal(created,1);assert.equal((await get(fx.env,root+items[0].id+'.json')).status,'needs_review');
});
test('changed source bytes are rejected before moderation or provider work, and old claims remain',async t=>{
 const fx=await fixture({metadata:false});let fetches=0,creates=0,info=0;
 fx.env.IMAGES.info=async()=>{info++;return {width:1254,height:1254};};
 t.mock.method(globalThis,'fetch',async(url,options)=>{fetches++;assert.equal(url,source.asset);assert.equal(options.redirect,'manual');return new Response(CLEAN,{headers:{'content-type':'image/jpeg'}});});
 await assert.rejects(prepareFirstSiamesePreview(fx.env,items[0].sku,{create:async()=>{creates++;}}),/not the exact approved original/);
 assert.equal(fetches,1);assert.equal(creates,0);assert.equal(info,0);
 assert.deepEqual(await get(fx.env,'shop/preparation/v3/source-'+source.id+'.claim'),fx.oldClaim);
 assert.equal(await fx.env.ARTWORK.get(`requests/${source.requestId}/request.json`),null);
 await assert.rejects(prepareFirstSiamesePreview(fx.env,items[0].sku),/previous source repair needs review/);
 assert.equal(fetches,1);
});
test('partial prior imports and wrong metadata are never overwritten',async()=>{
 const fx=await fixture({metadata:false});
 await fx.env.ARTWORK.put(`requests/${source.requestId}/preview.b64`,'partial-original');
 await assert.rejects(prepareFirstSiamesePreview(fx.env,items[0].sku),/pre-provider failure has not been established/);
 assert.equal(await (await fx.env.ARTWORK.get(`requests/${source.requestId}/preview.b64`)).text(),'partial-original');
 const wrong=await fixture();await put(wrong.env,`requests/${source.requestId}/request.json`,{...wrong.meta,catalogMasterHash:'f'.repeat(64)});
 await assert.rejects(prepareFirstSiamesePreview(wrong.env,items[0].sku),/source identity needs review/);
});
test('owner UI is explicit, private and never auto-creates a task on load',()=>{
 const html=readFileSync(new URL('../public/admin-siamese-repair.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/admin-siamese-repair.js',import.meta.url),'utf8');
 assert.match(html,/noindex,nofollow/);assert.match(html,/does not generate replacement artwork/);
 assert.match(ui,/confirm\(message\)/);assert.match(ui,/confirmFirstPreview:true/);
 assert.match(ui,/sourceRevision:current.source.sha256/);
 assert.match(ui,/redirect:'error'/);assert.doesNotMatch(ui,/localStorage|console\.log|\.innerHTML\s*=/);
 const code=readFileSync(new URL('../src/shop-siamese-source-repair.js',import.meta.url),'utf8');
 assert.match(code,/required:true/);assert.match(code,/hashBytes\(bytes\)!==source.sha256/);
 assert.doesNotMatch(code,/\.delete\(|publishSmallGift\(|sendToProduction|AI\.run/);
});
