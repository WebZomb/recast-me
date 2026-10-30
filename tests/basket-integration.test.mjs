import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {setup,ID,TOKEN} from './security-helpers.mjs';
import {recommendedCheckoutDesign} from '../src/commerce-store.js';
import {FULFILLMENT} from '../src/entry.js';
import {reconcileShopifyOrder} from '../src/workflow.js';
import {read} from '../src/commerce-store.js';
import {listOrderIssues} from '../src/order-issues.js';
const sku='RECAST-MUG-11OZ';
async function fixture(t){
 const calls=[],control={failCart:false,wrongQuantity:false,variant:'1',savedCart:null,extraProducts:[]};
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  url=String(url);let body={};try{body=JSON.parse(options.body);}catch{}calls.push({url,body});
  if(url.includes('/oauth/'))return Response.json({access_token:'fixture',expires_in:3600});
  if(body.query?.includes('query RecastBasketRefresh'))return Response.json({data:{cart:control.savedCart}});
  if(body.query?.includes('mutation RecastBasket(')){
   if(control.failCart)throw Error('remote timeout');
   control.savedCart={id:'gid://shopify/Cart/test?key=PRIVATE',checkoutUrl:'https://test.myshopify.com/checkouts/test',lines:{pageInfo:{hasNextPage:false},nodes:body.variables.input.lines.map((l,i)=>({id:'line'+i,quantity:control.wrongQuantity?99:l.quantity,attributes:l.attributes,merchandise:{id:l.merchandiseId}}))}};
   return Response.json({data:{cartCreate:{cart:control.savedCart,userErrors:[],warnings:[]}}});
  }
  if(url.includes('/graphql'))return Response.json({data:{products:{nodes:[{id:'p',title:'Custom Recast Mug',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/'+control.variant,title:'11 oz',sku,price:'24.99'}]}},...control.extraProducts]}}});
  if(url.includes('/v2/catalog-variants/4533'))return Response.json({data:{id:4533,catalog_product_id:84}});
  if(url.endsWith('/printfiles/84'))return Response.json({result:{printfiles:[{printfile_id:90,width:1500,height:1500}],variant_printfiles:[{variant_id:4533,placements:{default:90}}]}});
  if(url.includes('/v2/catalog-variants/1320'))return Response.json({data:{id:1320,catalog_product_id:19}});
  if(url.endsWith('/printfiles/19'))return Response.json({result:{printfiles:[{printfile_id:43,width:2700,height:1050}],variant_printfiles:[{variant_id:1320,placements:{default:43}},{variant_id:4830,placements:{default:43}}]}});
  throw Error('Unexpected operation '+url);
 });
 const env=await setup({BASKET_ENABLED:'true',SHOPIFY_STOREFRONT_TOKEN:'fixture',SHOPIFY_SHOP:'test.myshopify.com',SHOPIFY_CLIENT_ID:'fixture',SHOPIFY_CLIENT_SECRET:'fixture',PRINTFUL_API_TOKEN:'fixture'});
 let cookie='';
 async function call(path,body,extra={}){
  const response=await router.fetch(new Request('https://recast.test'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-recast-request':'1',cookie,...extra},body:body?JSON.stringify(body):undefined}),env,{});
  return {response,data:await response.json()};
 }
 const session=await call('/api/basket/session',{requestId:ID,accessToken:TOKEN});
 assert.equal(session.response.status,200,JSON.stringify(session.data));cookie=session.response.headers.get('set-cookie').split(';')[0];
 const designApproval={requestId:ID,accessToken:TOKEN,sku,design:recommendedCheckoutDesign(FULFILLMENT[sku]),skipMockup:true,confirmDesign:true,confirmArtwork:true};
 const approval=()=>call('/api/basket/approve',{basketId:'basket',designApproval});
 async function add(lineId='one',revision=0){const a=await approval();assert.equal(a.response.status,200,JSON.stringify(a.data));return call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'add-'+lineId,lineId,expectedRevision:revision,quantity:1}});}
 return {env,call,add,approval,calls,control,cookie,designApproval};
}
test('original-photo capable session, two separate approved lines, quantity/remove and checkout exact attributes',async t=>{
 const f=await fixture(t);assert.equal((await f.add()).response.status,200);assert.equal((await f.add('two',1)).response.status,200);
 let r=await f.call('/api/basket/action',{basketId:'basket',command:{type:'quantity',lineId:'one',actionId:'q',expectedRevision:2,quantity:2}});assert.equal(r.data.basket.lines[0].quantity,2);
 r=await f.call('/api/basket/checkout',{basketId:'basket',revision:3});assert.equal(r.response.status,200,JSON.stringify(r.data));
 const cart=f.calls.find(c=>c.body.query?.includes('mutation RecastBasket(')).body.variables.input;
 assert.equal(cart.lines.length,2);assert.equal(cart.lines[0].quantity,2);
 for(const line of cart.lines)for(const key of ['Artwork ID','_Recast Design','_Recast Proof','_Recast Mockup','_Recast Preview Token','_Recast Preapproval','_Recast Basket Line'])assert.ok(line.attributes.find(a=>a.key===key));
 assert.notEqual(cart.lines[0].attributes.at(-1).value,cart.lines[1].attributes.at(-1).value);
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:3})).data.reused,true);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('mutation RecastBasket(')).length,1);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('query RecastBasketRefresh')).length,1);
 const projection=(await f.call('/api/basket?id=basket')).data;assert.equal(projection.basket.lines.length,2);assert.doesNotMatch(JSON.stringify(projection),/approvalToken|proofHash|ownerId|PRIVATE|accessToken/);
 assert.equal((await f.call('/api/basket/action',{basketId:'basket',command:{type:'remove',lineId:'two',actionId:'r',expectedRevision:3}})).data.basket.lines.length,1);
 assert.equal([...f.env.ARTWORK.objects.keys()].some(k=>k.includes('/wallets/')),false);
});
test('ambiguous remote response locks all subsequent checkout attempts, even after a basket edit',async t=>{
 const f=await fixture(t);await f.add();f.control.failCart=true;
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).response.status,503);
 await f.add('two',1);
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:2})).response.status,503);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('RecastBasket')).length,1);
 assert.equal((await f.call('/api/basket?id=basket')).data.basket.lines.length,2);
});
test('supplier cart line mismatch is never handed to the buyer',async t=>{
 const f=await fixture(t);await f.add();f.control.wrongQuantity=true;
 const r=await f.call('/api/basket/checkout',{basketId:'basket',revision:1});assert.equal(r.response.status,503);assert.equal(r.data.checkoutUrl,undefined);
});
test('catalog variant changes block checkout instead of silently changing products',async t=>{
 const f=await fixture(t);await f.add();f.control.variant='2';
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).data.code,'basket_product_changed');
 assert.equal(f.calls.filter(c=>c.body.query?.includes('RecastBasket')).length,0);
});
test('foreign-origin and missing session cannot read or change a basket',async t=>{
 const f=await fixture(t);await f.add();
 assert.ok((await f.call('/api/basket?id=basket',null,{origin:'https://evil.test'})).response.status>=400);
 assert.equal((await f.call('/api/basket?id=basket',null,{cookie:''})).response.status,401);
 assert.equal((await f.call('/api/basket/session',{requestId:ID,accessToken:'wrong'},{cookie:''})).response.status,403);
});
test('another legitimate browser session cannot reuse the first browser approval',async t=>{
 const f=await fixture(t),a=await f.approval();
 const second=await f.call('/api/basket/session',{requestId:ID,accessToken:TOKEN},{cookie:''});
 const cookie=second.response.headers.get('set-cookie').split(';')[0];
 const r=await f.call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'x',lineId:'x',expectedRevision:0,quantity:1}},{cookie});
 assert.equal(r.data.code,'basket_approval');
});
test('modified frozen artwork fails integrity verification before checkout',async t=>{
 const f=await fixture(t);await f.add();const key=[...f.env.ARTWORK.objects.keys()].find(k=>k.startsWith('commerce/preapprovals/')&&k.endsWith('/source.b64'));
 await f.env.ARTWORK.put(key,'changed');
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).data.code,'basket_artwork_changed');
});
test('disabled basket retains single-item checkout and does not show basket enabled',async t=>{
 const f=await fixture(t);f.env.BASKET_ENABLED='false';
 assert.equal((await f.call('/api/basket/status')).data.enabled,false);
 assert.equal((await f.call('/api/basket?id=basket')).response.status,503);
 assert.equal((await f.call('/api/checkout-link',f.designApproval)).response.status,200);
});
test('owner recovery view redacts all capabilities and never resubmits checkout',async t=>{
 const f=await fixture(t);await f.add();f.control.failCart=true;await f.call('/api/basket/checkout',{basketId:'basket',revision:1});
 assert.equal((await f.call('/api/admin/basket-attempts')).response.status,401);
 const r=await f.call('/api/admin/basket-attempts',null,{authorization:'Bearer owner-test-secret'});
 assert.equal(r.data.items[0].status,'needs_review');assert.doesNotMatch(JSON.stringify(r.data),/ownerId|approvalToken|PRIVATE|accessToken|attributes|cartId/);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('RecastBasket')).length,1);
});

async function checkoutOrder(f){
 await f.add();await f.add('two',1);
 await f.call('/api/basket/action',{basketId:'basket',command:{type:'quantity',lineId:'one',actionId:'q',expectedRevision:2,quantity:2}});
 const checkout=await f.call('/api/basket/checkout',{basketId:'basket',revision:3});
 assert.equal(checkout.response.status,200,JSON.stringify(checkout.data));
 const lines=f.calls.find(c=>c.body.query?.includes('mutation RecastBasket(')).body.variables.input.lines;
 return {id:'gid://shopify/Order/123',name:'#1001',displayFinancialStatus:'PAID',test:false,cancelledAt:null,createdAt:'2026-10-19T00:00:00Z',lineItems:{pageInfo:{hasNextPage:false},nodes:lines.map((line,i)=>({id:'gid://shopify/LineItem/'+(456+i),sku,quantity:line.quantity,customAttributes:line.attributes}))}};
}
const heldReconciliation={allowAutomation:false,holdNewJobs:true};
test('routed basket checkout attributes preserve separate approved jobs and frozen designs on duplicate reconciliation',async t=>{
 const f=await fixture(t),order=await checkoutOrder(f),before=f.calls.length;
 assert.deepEqual(await reconcileShopifyOrder(f.env,order,heldReconciliation),{created:2,seen:2,issues:0});
 const first=await read(f.env,'jobs/123-456.json'),second=await read(f.env,'jobs/123-457.json');
 assert.equal(first.quantity,2);assert.equal(second.quantity,1);
 for(const job of [first,second]){
  assert.equal(job.preapprovedCheckout,true);assert.equal(job.status,'on_hold');assert.equal(job.requestId,ID);
  const design=await read(f.env,`commerce/designs/${job.id}.json`);
  const approval=await read(f.env,`commerce/preapprovals/${job.preapprovalToken}.json`);
  assert.equal(design.snapshotKey,approval.snapshotKey);assert.equal(design.sourceHash,approval.sourceHash);
  assert.equal(design.proof.quantity,job.quantity);assert.deepEqual(design.proof.design,approval.design);
 }
 const snapshot=[...f.env.ARTWORK.objects.entries()].filter(([key])=>key.startsWith('jobs/')||key.startsWith('commerce/designs/')).map(([key,value])=>[key,value.bytes.toString()]);
 assert.equal((await reconcileShopifyOrder(f.env,order,heldReconciliation)).created,0);
 for(const [key,value] of snapshot)assert.equal(await (await f.env.ARTWORK.get(key)).text(),value);
 assert.equal(f.calls.length,before,'no supplier or payment calls during held reconciliation');
});
test('routed basket checkout preserves an accepted legacy line while creating only the other held line',async t=>{
 const f=await fixture(t),order=await checkoutOrder(f),before=f.calls.length;
 const id=`${order.name}-${ID}-${sku}`.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,180);
 const accepted={id,orderId:order.id,lineId:order.lineItems.nodes[0].id,requestId:ID,sku,quantity:2,status:'in_printful_production',printfulOrderId:9001,printfulExternalId:'fixture-accepted',sentToProductionAt:'2026-10-19T01:00:00Z'};
 await f.env.ARTWORK.put(`jobs/${id}.json`,JSON.stringify(accepted));
 assert.deepEqual(await reconcileShopifyOrder(f.env,order,heldReconciliation),{created:1,seen:2,issues:0});
 assert.deepEqual(await read(f.env,`jobs/${id}.json`),accepted);
 assert.equal(await read(f.env,'jobs/123-456.json'),null);
 assert.equal((await read(f.env,'jobs/123-457.json')).preapprovedCheckout,true);
 assert.equal((await reconcileShopifyOrder(f.env,order,heldReconciliation)).created,0);
 assert.equal(f.calls.length,before);
});
test('routed basket order with unbound legacy supplier state holds both lines with durable issues and no new job',async t=>{
 const f=await fixture(t),order=await checkoutOrder(f),before=f.calls.length;
 const id=`${order.name}-${ID}-${sku}`.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,180);
 const uncertain={id,orderId:order.id,requestId:ID,sku,quantity:1,status:'production_submission_unknown',printfulExternalId:'fixture-unknown'};
 await f.env.ARTWORK.put(`jobs/${id}.json`,JSON.stringify(uncertain));
 for(let n=0;n<2;n++)assert.deepEqual(await reconcileShopifyOrder(f.env,order,heldReconciliation),{created:0,seen:2,issues:2});
 assert.deepEqual(await read(f.env,`jobs/${id}.json`),uncertain);
 assert.equal((await f.env.ARTWORK.list({prefix:'jobs/'})).objects.length,1);
 const {issues}=await listOrderIssues(f.env);assert.equal(issues.length,2);
 assert.ok(issues.every(issue=>issue.code==='job_identity_review'&&issue.status==='open'));
 assert.equal(f.calls.length,before);
});

test('edit-limit rejection preserves saved items, replay receipts and checkout without extending capacity',async t=>{
 const f=await fixture(t);await f.add();
 for(let i=1;i<128;i++){
  const result=await f.call('/api/basket/action',{basketId:'basket',command:{type:'quantity',actionId:'q-'+i,expectedRevision:i,lineId:'one',quantity:2}});
  assert.equal(result.response.status,200);
 }
 const before=(await f.call('/api/basket?id=basket')).data.basket;
 assert.equal(before.canEdit,false);assert.equal(before.revision,128);assert.equal(before.lines[0].quantity,2);
 const rejected=await f.call('/api/basket/action',{basketId:'basket',command:{type:'remove',actionId:'overflow',expectedRevision:128,lineId:'one'}});
 assert.equal(rejected.response.status,409);assert.equal(rejected.data.code,'action_limit');
 assert.match(rejected.data.error,/check out as shown/);
 assert.deepEqual((await f.call('/api/basket?id=basket')).data.basket,before);
 const replay=await f.call('/api/basket/action',{basketId:'basket',command:{type:'quantity',actionId:'q-127',expectedRevision:127,lineId:'one',quantity:2}});
 assert.equal(replay.data.replayed,true);assert.deepEqual(replay.data.basket,before);
 const checkout=await f.call('/api/basket/checkout',{basketId:'basket',revision:128});
 assert.equal(checkout.response.status,200,JSON.stringify(checkout.data));
 const cart=f.calls.find(c=>c.body.query?.includes('mutation RecastBasket(')).body.variables.input;
 assert.equal(cart.lines.length,1);assert.equal(cart.lines[0].quantity,2);
});
test('line-limit rejection preserves twenty approved items and permits removal',async t=>{
 const f=await fixture(t);
 for(let i=0;i<20;i++)assert.equal((await f.add('line-'+i,i)).response.status,200);
 const before=(await f.call('/api/basket?id=basket')).data.basket;
 assert.equal(before.canEdit,true);
 const rejected=await f.add('overflow',20);
 assert.equal(rejected.data.code,'line_limit');assert.match(rejected.data.error,/Remove an item/);
 assert.deepEqual((await f.call('/api/basket?id=basket')).data.basket,before);
 const remove=await f.call('/api/basket/action',{basketId:'basket',command:{type:'remove',lineId:'line-0',actionId:'remove-one',expectedRevision:20}});
 assert.equal(remove.response.status,200);assert.equal(remove.data.basket.lines.length,19);
});

// User acceptance matrix: quantities, one artwork on multiple variants, and
// multiple artworks on the same variant must remain distinct through fulfillment.
test('mixed gift basket preserves every artwork, product and copy count through order reconciliation and rollback',async t=>{
 const f=await fixture(t),secondId='RC-TEST0002-ABCDEF',large='RECAST-TOTE-BLACK';
 const original=await (await f.env.ARTWORK.get(`requests/${ID}/request.json`)).json();
 await f.env.ARTWORK.put(`requests/${secondId}/request.json`,JSON.stringify({...original,requestId:secondId}));
 const bytes=await (await f.env.ARTWORK.get(`requests/${ID}/preview.b64`)).text();
 await f.env.ARTWORK.put(`requests/${secondId}/preview.b64`,bytes);
 f.control.extraProducts=[{id:'p2',title:'Tote Bag',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/2',title:'Black',sku:large,price:'29.99'}]}}];
 const expected=[{art:ID,sku,qty:3,variant:'1'},{art:ID,sku:large,qty:2,variant:'2'},{art:secondId,sku,qty:4,variant:'1'}];
 for(const [i,line] of expected.entries()){
  const a=await f.call('/api/basket/approve',{basketId:'basket',designApproval:{...f.designApproval,requestId:line.art,sku:line.sku,design:recommendedCheckoutDesign(FULFILLMENT[line.sku])}});
  assert.equal(a.response.status,200,JSON.stringify(a.data));
  const added=await f.call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'matrix-'+i,lineId:'matrix-'+i,expectedRevision:i,quantity:line.qty}});
  assert.equal(added.response.status,200,JSON.stringify(added.data));
 }
 const checkout=await f.call('/api/basket/checkout',{basketId:'basket',revision:3});
 assert.equal(checkout.response.status,200,JSON.stringify(checkout.data));
 const lines=f.calls.find(c=>c.body.query?.includes('mutation RecastBasket(')).body.variables.input.lines;
 for(const [i,line] of lines.entries()){
  assert.equal(line.quantity,expected[i].qty);assert.equal(line.merchandiseId,'gid://shopify/ProductVariant/'+expected[i].variant);
  assert.equal(line.attributes.find(a=>a.key==='Artwork ID').value,expected[i].art);
 }
 // Rollback disables cart entry, but must preserve paid multiline reconciliation.
 f.env.BASKET_ENABLED='false';
 assert.equal((await f.call('/api/basket/status')).data.enabled,false);
 assert.equal((await f.call('/api/checkout-link',f.designApproval)).response.status,200);
 const order={id:'gid://shopify/Order/987',name:'#1987',displayFinancialStatus:'PAID',test:false,cancelledAt:null,createdAt:'2026-10-20T00:00:00Z',lineItems:{pageInfo:{hasNextPage:false},nodes:lines.map((line,i)=>({id:'gid://shopify/LineItem/'+(800+i),sku:expected[i].sku,quantity:line.quantity,customAttributes:line.attributes}))}};
 assert.deepEqual(await reconcileShopifyOrder(f.env,order,heldReconciliation),{created:3,seen:3,issues:0});
 for(const [i,line] of expected.entries()){
  const job=await read(f.env,`jobs/987-${800+i}.json`);
  assert.equal(job.quantity,line.qty);assert.equal(job.requestId,line.art);assert.equal(job.sku,line.sku);assert.equal(job.status,'on_hold');
 }
 const before=[...f.env.ARTWORK.objects.entries()].filter(([k])=>k.startsWith('jobs/')||k.startsWith('commerce/designs/')).map(([k,v])=>[k,v.bytes.toString()]);
 await reconcileShopifyOrder(f.env,order,heldReconciliation);
 for(const [k,v] of before)assert.equal(await (await f.env.ARTWORK.get(k)).text(),v);
 f.env.BASKET_ENABLED='true';
 assert.equal((await f.call('/api/basket?id=basket')).data.basket.lines.length,3);
});

// Unified-shop fixtures below are private in-memory test records, never live inventory.
async function premadeFixture(f){
 const {hash}=await import('../src/commerce-store.js');
 const {hashBytes,SHOP_CATALOG_KEY}=await import('../src/shop-catalog-store.js');
 const art='RC-PREMADE-TEST0001',id='golden-winter-mug-11oz',designId='golden-winter';
 const source=await(await f.env.ARTWORK.get(`requests/${ID}/preview.b64`)).text();
 const original=await(await f.env.ARTWORK.get(`requests/${ID}/request.json`)).json();
 const design=f.designApproval.design,proofHash=await hash(source+'|'+JSON.stringify(design));
 const mockupId='shop-fixture-mug',folder=`mockups/${art}/${sku}/${mockupId}`;
 const bytes=Uint8Array.from(atob(source),c=>c.charCodeAt(0)),artworkRevision=await hashBytes(bytes),sourceHash=await hash(source);
 await f.env.ARTWORK.put(`requests/${art}/request.json`,JSON.stringify({...original,requestId:art,source:'premade-catalog',catalogDesignId:designId,catalogMasterHash:artworkRevision,catalogRightsConfirmedAt:'2026-10-30T17:00:00Z'}));
 await f.env.ARTWORK.put(`requests/${art}/preview.b64`,source);
 const position={area_width:2700,area_height:1050,width:2700,height:1050,top:0,left:0};
 const task={status:'completed',requestId:art,sku,mockupId,sourceHash:proofHash,design,position,taskKey:'real-fixture-task',printfulVariantId:1320,images:[{title:'Front',url:'https://recast.test/fixture.jpg'}]};
 await f.env.ARTWORK.put(folder+'/task.json',JSON.stringify(task));await f.env.ARTWORK.put(folder+'/image-0.jpg',bytes);
 const a=await f.call('/api/basket/approve',{basketId:'basket',designApproval:{...f.designApproval,requestId:art,skipMockup:false,mockupId,design}});
 assert.equal(a.response.status,200,JSON.stringify(a.data));
 const record=await read(f.env,`commerce/preapprovals/${a.data.approvalToken}.json`);
 const artworkKey=`shop/masters/${designId}/${artworkRevision}.png`;
 await f.env.ARTWORK.put(artworkKey,bytes);
 const printFileHash=await hashBytes(bytes),placementHash=await hash(JSON.stringify(position));
 const finalKey=`shop/printfiles/${id}/${printFileHash}.jpg`;await f.env.ARTWORK.put(finalKey,bytes);
 record.premadePrint={key:finalKey,sha256:printFileHash,mime:'image/jpeg',sku,sourceHash,proofHash,placementHash,artworkRevision};await f.env.ARTWORK.put(`commerce/preapprovals/${record.token}.json`,JSON.stringify(record));
 const offer={id,designId,title:'Golden Retriever — Winter Lights Mug',occasion:'christmas',pet:'dog',breed:'Golden Retriever',product:'mug',variantLabel:'White · 11 oz',variantId:'gid://shopify/ProductVariant/1',sku,priceCents:2499,currency:'USD',status:'verified',artworkRevision,artworkKey,requestId:art,sourceHash,proofHash,mockupId,approvalToken:record.token,approvalRecordHash:await hash(JSON.stringify(record)),mockupUrl:'https://recast.test/api/approved-preview/'+record.token,proof:{provider:'printful',approved:true,artworkRevision,printfulVariantId:1320,printFileHash,placementHash,taskId:task.taskKey,checkedAt:'2026-10-30T17:01:00Z'}};
 await f.env.ARTWORK.put(`shop/proofs/${id}.json`,JSON.stringify({...offer.proof,mockupUrl:offer.mockupUrl}));
 await f.env.ARTWORK.put(SHOP_CATALOG_KEY,JSON.stringify({version:1,revision:1,offers:[offer]}));
 return {offer,record,art,bytes,SHOP_CATALOG_KEY,source};
}
test('mixed premade and custom basket uses one checkout and preserves same-variant designs through fulfillment',async t=>{
 const f=await fixture(t),p=await premadeFixture(f);
 await f.add('custom',0);
 const a=await f.call('/api/basket/premade',{basketId:'basket',offerId:p.offer.id,revision:p.offer.artworkRevision});assert.equal(a.response.status,200,JSON.stringify(a.data));
 const added=await f.call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'premade-add',lineId:'premade',expectedRevision:1,quantity:2}});assert.equal(added.response.status,200,JSON.stringify(added.data));
 const view=(await f.call('/api/basket?id=basket')).data.basket;assert.equal(view.lines.length,2);assert.equal(view.subtotalCents,7497);assert.equal(view.lines[0].sourceKind,'custom');assert.equal(view.lines[1].sourceKind,'premade');assert.equal(view.lines[1].lineTotalCents,4998);
 const result=await f.call('/api/basket/checkout',{basketId:'basket',revision:2});assert.equal(result.response.status,200,JSON.stringify(result.data));
 const lines=f.calls.find(x=>x.body.query?.includes('mutation RecastBasket(')).body.variables.input.lines;assert.equal(lines.length,2);assert.equal(lines[0].merchandiseId,lines[1].merchandiseId);assert.notEqual(lines[0].attributes.find(x=>x.key==='Artwork ID').value,lines[1].attributes.find(x=>x.key==='Artwork ID').value);
 assert.equal(lines[1].attributes.find(x=>x.key==='_Recast Offer').value,p.offer.id);
 const order={id:'gid://shopify/Order/246',name:'#1246',displayFinancialStatus:'PAID',test:false,cancelledAt:null,createdAt:'2026-10-30T17:00:00Z',lineItems:{pageInfo:{hasNextPage:false},nodes:lines.map((l,i)=>({id:'gid://shopify/LineItem/'+(900+i),sku,quantity:l.quantity,customAttributes:l.attributes}))}};
 assert.deepEqual(await reconcileShopifyOrder(f.env,order,heldReconciliation),{created:2,seen:2,issues:0});
 assert.equal((await read(f.env,'jobs/246-900.json')).requestId,ID);assert.equal((await read(f.env,'jobs/246-901.json')).requestId,p.art);assert.equal((await read(f.env,'jobs/246-901.json')).quantity,2);
 assert.equal((await reconcileShopifyOrder(f.env,order,heldReconciliation)).created,0);
});
test('guest can start from a verified premade design without an AI render or private artwork token',async t=>{
 const f=await fixture(t),p=await premadeFixture(f);
 const result=await f.call('/api/basket/session',{offerId:p.offer.id,revision:p.offer.artworkRevision},{cookie:''});assert.equal(result.response.status,200,JSON.stringify(result.data));assert.match(result.response.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);
 const cookie=result.response.headers.get('set-cookie').split(';')[0];
 assert.equal((await f.call('/api/basket/premade',{basketId:'new',offerId:p.offer.id,revision:p.offer.artworkRevision},{cookie})).response.status,200);
 assert.equal((await f.call('/api/basket/session',{offerId:'unknown',revision:p.offer.artworkRevision},{cookie:''})).response.status,409);
 assert.equal(f.calls.some(x=>/transform|inference|fal\.run/.test(x.url)),false);
});
test('public catalog excludes private source credentials and customer photos cannot become stock',async t=>{
 const f=await fixture(t),p=await premadeFixture(f);
 const publicData=await f.call('/api/shop/catalog');assert.equal(publicData.response.status,200);assert.equal(publicData.data.offers.length,1);
 assert.doesNotMatch(JSON.stringify(publicData.data),/approvalToken|accessToken|snapshotKey|artworkKey|catalogRightsConfirmedAt/);
 const meta=await read(f.env,`requests/${p.art}/request.json`);meta.source='original-photo';await f.env.ARTWORK.put(`requests/${p.art}/request.json`,JSON.stringify(meta));
 assert.equal((await f.call('/api/shop/catalog')).data.offers.length,0);
 assert.equal((await f.call('/api/basket/premade',{basketId:'basket',offerId:p.offer.id,revision:p.offer.artworkRevision})).response.status,409);
});
test('premade add rejects caller-controlled price, source URL and substitute approval',async t=>{
 const f=await fixture(t),p=await premadeFixture(f);
 for(const extra of [{priceCents:1},{artworkUrl:'https://evil.test/private.jpg'},{approvalToken:'a'.repeat(48)}]){
  const r=await f.call('/api/basket/premade',{basketId:'basket',offerId:p.offer.id,revision:p.offer.artworkRevision,...extra});assert.equal(r.response.status,400);assert.equal(r.data.code,'shop_request');
 }
});
test('master bytes, frozen proof, offer revision and retirement are checked again before checkout',async t=>{
 const f=await fixture(t),p=await premadeFixture(f),a=await f.call('/api/basket/premade',{basketId:'basket',offerId:p.offer.id,revision:p.offer.artworkRevision});
 await f.call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'p',lineId:'p',expectedRevision:0,quantity:1}});
 await f.env.ARTWORK.put(p.offer.artworkKey,Uint8Array.of(1,2,3));assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).response.status,409);
 await f.env.ARTWORK.put(p.offer.artworkKey,p.bytes);
 assert.equal((await f.call('/api/basket/premade',{basketId:'basket',offerId:p.offer.id,revision:'0'.repeat(64)})).response.status,409);
 await f.env.ARTWORK.put(p.SHOP_CATALOG_KEY,JSON.stringify({version:1,revision:2,offers:[]}));assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).response.status,409);
 const removed=await f.call('/api/basket/action',{basketId:'basket',command:{type:'remove',actionId:'retired-remove',lineId:'p',expectedRevision:1}});assert.equal(removed.response.status,200);assert.equal(removed.data.basket.lines.length,0);
 assert.equal(f.calls.some(x=>x.body.query?.includes('mutation RecastBasket(')),false);
});
test('tokenless cart access is explicitly enabled and never sends an undefined token',async t=>{
 const {basketConfigured,storefrontHeaders}=await import('../src/basket-checkout.js');
 const base={BASKET_ENABLED:'true',SHOPIFY_SHOP:'test.myshopify.com'};
 assert.equal(basketConfigured(base),false);assert.equal(basketConfigured({...base,SHOPIFY_STOREFRONT_TOKENLESS:'true'}),true);assert.equal(basketConfigured({...base,BASKET_ENABLED:'false',SHOPIFY_STOREFRONT_TOKENLESS:'true'}),false);
 assert.deepEqual(storefrontHeaders(base),{'Content-Type':'application/json'});
 const f=await fixture(t);delete f.env.SHOPIFY_STOREFRONT_TOKEN;f.env.SHOPIFY_STOREFRONT_TOKENLESS='true';await f.add();assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).response.status,200);
});

test('two shoppers buying the same premade gift receive distinct private order capabilities',async t=>{
 const f=await fixture(t),p=await premadeFixture(f);
 const first=await f.call('/api/basket/premade',{basketId:'one',offerId:p.offer.id,revision:p.offer.artworkRevision});assert.equal(first.response.status,200,JSON.stringify(first.data));
 const session=await f.call('/api/basket/session',{offerId:p.offer.id,revision:p.offer.artworkRevision},{cookie:''});const cookie=session.response.headers.get('set-cookie').split(';')[0];
 const second=await f.call('/api/basket/premade',{basketId:'two',offerId:p.offer.id,revision:p.offer.artworkRevision},{cookie});assert.equal(second.response.status,200,JSON.stringify(second.data));
 assert.notEqual(first.data.approvalToken,second.data.approvalToken);assert.notEqual(first.data.approvalToken,p.record.token);assert.notEqual(second.data.approvalToken,p.record.token);
 const r1=await read(f.env,`commerce/preapprovals/${first.data.approvalToken}.json`),r2=await read(f.env,`commerce/preapprovals/${second.data.approvalToken}.json`);
 assert.notEqual(r1.buyerScope,r2.buyerScope);assert.equal(r1.sourceHash,r2.sourceHash);assert.equal(r1.premadePrint.key,r2.premadePrint.key);
 assert.ok(await f.env.ARTWORK.head(`commerce/checkout-previews/${r1.token}.jpg`));
 const {customerDesignAction}=await import('../src/order-approval.js');
 await f.env.ARTWORK.put('jobs/private-order.json',JSON.stringify({id:'private-order',requestId:p.art,approvedPreviewToken:r1.token}));
 for(const token of [r2.token,p.record.token])await assert.rejects(()=>customerDesignAction(new Request('https://recast.test/api/customer/design/private-order/approve',{method:'POST',headers:{'x-recast-request':'1',origin:'https://recast.test','content-type':'application/json'},body:JSON.stringify({proofToken:token})}),f.env,'private-order','approve',{verifyPaid:()=>{throw Error('Must not reach payment lookup');}}),e=>e.code==='order_access');
});
test('approved premade print files are reused unchanged and tampering blocks finishing',async t=>{
 const f=await fixture(t),p=await premadeFixture(f),a=await f.call('/api/basket/premade',{basketId:'basket',offerId:p.offer.id,revision:p.offer.artworkRevision});
 await f.call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'p',lineId:'p',expectedRevision:0,quantity:1}});
 await f.call('/api/basket/checkout',{basketId:'basket',revision:1});const lines=f.calls.find(x=>x.body.query?.includes('mutation RecastBasket(')).body.variables.input.lines;
 const order={id:'gid://shopify/Order/247',name:'#1247',displayFinancialStatus:'PAID',test:false,cancelledAt:null,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:'gid://shopify/LineItem/901',sku,quantity:1,customAttributes:lines[0].attributes}]}};
 await reconcileShopifyOrder(f.env,order,heldReconciliation);const job=await read(f.env,'jobs/247-901.json');
 const {finishApprovedDesign}=await import('../src/order-approval.js');const design=await finishApprovedDesign(f.env,job);assert.equal(design.finalKey,p.record.premadePrint.key);assert.equal(design.finishMethod,'premade-locked-v1');
 await f.env.ARTWORK.put(design.finalKey,Uint8Array.of(1,2,3));await assert.rejects(()=>finishApprovedDesign(f.env,job),e=>e.code==='premade_print_changed');
});
