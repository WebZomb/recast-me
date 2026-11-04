import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {SHOP_SOURCE_PIXELS,PRINTFILE_AUDIT_GROUPS,inspectPrintfile,runPrintfileAudit,printfileAuditStatus} from '../src/shop-printfile-audit.js';
import {shopRoutes} from '../src/shop-routes.js';
import {readFileSync} from 'node:fs';
const original=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8')).designs;
const environment=()=>({ARTWORK:new Bucket(),PREMADE_PRINTFILE_AUDIT_ENABLED:'true'});
const supplier=(g,{width=1122,height=1122,dpi=300,identity=g.productId,missing=false}={})=>({
 product_id:identity,
 printfiles:missing?[]:[{printfile_id:27,width,height,dpi}],
 variant_printfiles:g.variants.map(row=>({variant_id:row.variantId,placements:{[row.placement]:27}}))
});
test('audit maps every non-mug physical Printful catalog without touching the approved source art',()=>{
 assert.equal(original.length,35);
 assert.ok(original.every(d=>d.artworkWidth===1254&&d.artworkHeight===1254));
 assert.deepEqual(SHOP_SOURCE_PIXELS,{width:1254,height:1254});
 assert.ok(PRINTFILE_AUDIT_GROUPS.length>=12);
 assert.ok(PRINTFILE_AUDIT_GROUPS.some(g=>g.product==='Blanket'));
 assert.ok(PRINTFILE_AUDIT_GROUPS.some(g=>g.product==='Coaster 4-Pack'));
 assert.ok(PRINTFILE_AUDIT_GROUPS.some(g=>g.product==='Hoodie'));
 assert.ok(PRINTFILE_AUDIT_GROUPS.every(g=>g.product!=='Mug'&&g.variants.length>0));
 assert.equal(new Set(PRINTFILE_AUDIT_GROUPS.map(g=>g.productId)).size,PRINTFILE_AUDIT_GROUPS.length);
});
test('exact Printful printfile variant mapping determines pixel sufficiency but never sale readiness',()=>{
 const g=PRINTFILE_AUDIT_GROUPS.find(g=>g.product==='Coaster 4-Pack');
 let r=inspectPrintfile(g,supplier(g));
 assert.equal(r.status,'complete');
 assert.equal(r.variants.length,1);
 assert.equal(r.variants[0].fullPixelsMeetSupplierArea,true);
 assert.equal(r.variants[0].aspectCompatible,true);
 assert.equal(r.variants[0].status,'supplier_proof_still_required');
 assert.equal(r.checkoutEnabled,false);
 assert.equal(r.verifiedProof,false);
 assert.equal(r.supplierOrdersCreated,0);
 r=inspectPrintfile(g,supplier(g,{width:9000,height:12000}));
 assert.equal(r.variants[0].fullPixelsMeetSupplierArea,false);
 assert.equal(r.variants[0].status,'higher_resolution_master_needed');
 r=inspectPrintfile(g,supplier(g,{width:900,height:1200}));
 assert.equal(r.variants[0].fullPixelsMeetSupplierArea,true);
 assert.equal(r.variants[0].aspectCompatible,false);
 assert.equal(r.variants[0].status,'crop_or_fit_review_needed');
 r=inspectPrintfile(g,supplier(g,{missing:true}));
 assert.equal(r.variants[0].status,'needs_template_review');
 assert.throws(()=>inspectPrintfile(g,supplier(g,{identity:123456})),/Supplier catalog needs review/);
});
test('disabled scanner causes zero supplier reads and no R2 writes',async()=>{
 const env=environment();env.PREMADE_PRINTFILE_AUDIT_ENABLED='false';
 let reads=0;
 assert.deepEqual(await runPrintfileAudit(env,{get:async()=>{reads++;}}),{enabled:false});
 assert.equal(reads,0);
 assert.equal(env.ARTWORK.objects.size,0);
});
test('scanner performs at most one supplier GET-equivalent each tick and never creates or approves a product',async()=>{
 const env=environment();
 const calls=[];
 const get=async(_env,id)=>{calls.push(id);return supplier(PRINTFILE_AUDIT_GROUPS.find(g=>g.productId===id));};
 let response=await runPrintfileAudit(env,{get});
 assert.equal(response.checked,1);
 assert.equal(response.status,'complete');
 assert.equal(calls.length,1);
 response=await runPrintfileAudit(env,{get});
 assert.equal(response.checked,1);
 assert.equal(response.status,'complete');
 assert.equal(calls.length,2);
 assert.notEqual(calls[0],calls[1]);
 const report=await printfileAuditStatus(env);
 assert.equal(report.checkoutEnabled,false);
 assert.equal(report.supplierProofApprovalRequired,true);
 assert.equal(report.products.filter(x=>x.status==='complete').length,2);
 assert.equal(report.products.filter(x=>x.status==='not_started').length,PRINTFILE_AUDIT_GROUPS.length-2);
 assert.equal(report.products[0].variants[0].area.dpi,300);
 assert.ok([...env.ARTWORK.objects.keys()].every(k=>k.startsWith('shop/preparation/printfile-audit/v1/')));
 const readOnly=await shopRoutes(new Request('https://recast.test/api/shop/printfile-audit'),env);
 assert.equal(readOnly.status,200);
 assert.equal(readOnly.headers.get('x-robots-tag'),'noindex, nofollow');
 const obj=await readOnly.json();
 assert.equal(obj.ok,true);
 assert.equal(obj.checkoutEnabled,false);
 assert.doesNotMatch(JSON.stringify(obj),/Bearer |PRINTFUL_API_TOKEN|secret|accessToken/);
 const post=await shopRoutes(new Request('https://recast.test/api/shop/printfile-audit',{method:'POST'}),env);
 assert.equal(post.status,405);
});
test('unknown supplier response is held for review rather than silently re-requested',async()=>{
 const env=environment();let calls=0;
 const get=async(_env,id)=>{calls++;if(calls===1)throw Object.assign(Error('private source/secret inaccessible'),{code:'http_429'});return supplier(PRINTFILE_AUDIT_GROUPS.find(g=>g.productId===id));};
 const first=await runPrintfileAudit(env,{get});
 assert.equal(first.status,'needs_review');
 assert.equal(calls,1);
 const state=await printfileAuditStatus(env);
 assert.equal(state.products[0].status,'needs_review');
 assert.equal(state.products[0].code,'supplier_rate_limited');
 const second=await runPrintfileAudit(env,{get});
 assert.equal(second.status,'complete');
 assert.equal(calls,2);
 assert.equal((await printfileAuditStatus(env)).products[0].status,'needs_review');
});
