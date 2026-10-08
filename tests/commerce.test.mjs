import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket,CLEAN,ID,TOKEN,setup,imageMock,fakeApplication,submission,MARKED} from './security-helpers.mjs';
import {creditRoute,walletFor,bindCustomerCredits,creditBalance,reserveCustomerRender,settleCustomerRender,reconcileOrderCredits,orderEligible} from '../src/render-credits.js';
import {reserveBudget,guardedEnvironment} from '../src/render-controls.js';
import {hash,read,normalizeProductDesign} from '../src/commerce-store.js';
import {customerDesignAction,designFor,approvedDesign,finishApprovedDesign,printDesignFile} from '../src/order-approval.js';
import {reconcileShopifyOrder,verifyPaidOrder,adminJobAction,routeWorkflow,customerOrderStatus,syncPrintfulJobs,retryLegacyOwnerReleaseCandidates,scheduledWorkflow} from '../src/workflow.js';
import {secureApplication} from '../src/preview-security.js';
import {FULFILLMENT} from '../src/entry.js';
const salt='test-only-ip-salt-with-at-least-32-characters';
const paid={id:'gid://shopify/Order/123',name:'#1001',createdAt:'2026-10-03T01:00:00Z',updatedAt:'2026-10-03T01:00:00Z',displayFinancialStatus:'PAID',cancelledAt:null,test:false};
async function walletSetup(ip='192.0.2.1',base={}){
 const env={ARTWORK:new Bucket(),RENDER_CREDITS_ENABLED:'true',CREDIT_IP_SALT:salt,...base};
 const request=new Request('https://recast.test/api/render-credits',{method:'POST',headers:{'x-recast-request':'1','cf-connecting-ip':ip}});
 const response=await creditRoute(request,env),cookie=response.headers.get('set-cookie').split(';')[0];
 const browser=new Request('https://recast.test/',{headers:{cookie}}),wallet=await walletFor(browser,env);
 return {env,wallet,cookie,browser};
}
test('wallet cookie is secure, HttpOnly and retained by the response boundary',async()=>{
 const env={ARTWORK:new Bucket(),RENDER_CREDITS_ENABLED:'true',CREDIT_IP_SALT:salt};
 const app=secureApplication({fetch(){throw Error('must be intercepted')}});
 const r=await app.fetch(new Request('https://recast.test/api/render-credits',{method:'POST',headers:{'x-recast-request':'1','cf-connecting-ip':'192.0.2.8'}}),env);
 assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);assert.equal((await r.json()).remaining,3);
 const bad=await app.fetch(new Request('https://recast.test/api/render-credits',{method:'POST',headers:{origin:'https://bad.test','x-recast-request':'1'}}),env);assert.equal(bad.status,403);
});
test('new cookies do not replenish the shared-network starter allowance',async()=>{
 const a=await walletSetup(),b=await walletSetup('192.0.2.1',a.env);
 await Promise.all(Array.from({length:3},()=>reserveCustomerRender({...a.env,RECAST_CREDIT_WALLET:a.wallet})));
 assert.equal((await creditBalance(b.env,b.wallet)).remaining,0);
 await assert.rejects(reserveCustomerRender({...b.env,RECAST_CREDIT_WALLET:b.wallet}),e=>e.code==='render_credits_used');
});
test('parallel renders cannot overspend starter credits; failed previews restore exactly once',async()=>{
 const {env,wallet}=await walletSetup();
 const results=await Promise.allSettled(Array.from({length:10},()=>reserveCustomerRender({...env,RECAST_CREDIT_WALLET:wallet})));
 const accepted=results.filter(r=>r.status==='fulfilled');assert.equal(accepted.length,3);
 await Promise.all([settleCustomerRender(env,accepted[0].value,false),settleCustomerRender(env,accepted[0].value,false)]);
 assert.equal((await creditBalance(env,wallet)).remaining,1);
 await settleCustomerRender(env,accepted[1].value,true);assert.equal((await creditBalance(env,wallet)).remaining,1);
});
test('a purchase grants three once across duplicate syncs and multiple candidate wallets',async()=>{
 const a=await walletSetup(),b=await walletSetup('192.0.2.2',a.env);
 await Promise.all(Array.from({length:10},(_,i)=>reconcileOrderCredits(a.env,paid,i%2?a.wallet.id:b.wallet.id)));
 assert.equal((await creditBalance(a.env,a.wallet)).bonus+(await creditBalance(a.env,b.wallet)).bonus,3);
 const state=await read(a.env,`commerce/orders/${await hash(paid.id)}.json`);assert.ok([a.wallet.id,b.wallet.id].includes(state.walletId));
});
test('refunds revoke unspent bonus credits and late paid events cannot regrant them',async()=>{
 const {env,wallet}=await walletSetup();await reconcileOrderCredits(env,paid,wallet.id);
 for(let i=0;i<4;i++)await reserveCustomerRender({...env,RECAST_CREDIT_WALLET:wallet});
 assert.equal((await creditBalance(env,wallet)).bonus,2);
 await reconcileOrderCredits(env,{...paid,displayFinancialStatus:'PARTIALLY_REFUNDED',updatedAt:'2026-10-03T02:00:00Z'});
 await reconcileOrderCredits(env,paid,wallet.id);
 assert.equal((await creditBalance(env,wallet)).bonus,0);
 await assert.rejects(reserveCustomerRender({...env,RECAST_CREDIT_WALLET:wallet}),e=>e.code==='render_credits_used');
});
test('unpaid, canceled and test orders do not unlock normal credits',()=>{
 for(const order of [{...paid,displayFinancialStatus:'PENDING'},{...paid,cancelledAt:paid.updatedAt},{...paid,test:true}])assert.equal(orderEligible(order,{}),false);
 assert.equal(orderEligible({...paid,test:true},{ALLOW_TEST_ORDER_CREDITS:'true'}),true);
});
test('budget is unset by default; enabling public credits requires an explicit budget',async()=>{
 assert.deepEqual(await reserveBudget({}),{enforced:false});
 await assert.rejects(reserveBudget({RENDER_CREDITS_ENABLED:'true'}),e=>e.code==='budget_config');
 for(const value of ['-1','0.5','NaN'])await assert.rejects(reserveBudget({AI_DAILY_BUDGET_CENTS:value,AI_CALL_RESERVE_CENTS:'10'}));
});
test('parallel reservations respect the owner budget, including failed provider calls',async()=>{
 const env={ARTWORK:new Bucket(),AI_DAILY_BUDGET_CENTS:'25',AI_CALL_RESERVE_CENTS:'10'};
 const result=await Promise.allSettled(Array.from({length:10},()=>reserveBudget(env)));
 assert.equal(result.filter(r=>r.status==='fulfilled').length,2);
 let calls=0;const g=guardedEnvironment({...env,AI:{async run(){calls++;throw Error('timeout')}}});await assert.rejects(g.env.AI.run('model'));assert.equal(calls,0);
});
test('the security boundary restores failed customer credit but retains inference reservations',async()=>{
 const base=await setup({AI:{async run(){throw Error('provider failed')}}});
 const w=await walletSetup('192.0.2.1',{...base,AI_DAILY_BUDGET_CENTS:'100',AI_CALL_RESERVE_CENTS:'10'});
 const req=submission();req.headers.set('cookie',w.cookie);req.headers.set('x-recast-request','1');
 const response=await secureApplication(fakeApplication()).fetch(req,w.env);assert.equal(response.status,503);
 assert.equal((await creditBalance(w.env,w.wallet)).remaining,3);
 const day=new Date().toISOString().slice(0,10);assert.equal((await read(w.env,`security/ai-budget/${day}.json`)).reservedCents,10);
});
test('protected success consumes one customer credit while a same-request provider retry still reserves money',async()=>{
 const base=await setup({AI:{async run(){return {image:CLEAN.toString('base64')}}}});
 const w=await walletSetup('192.0.2.1',{...base,AI_DAILY_BUDGET_CENTS:'100',AI_CALL_RESERVE_CENTS:'10'});
 const req=submission();req.headers.set('cookie',w.cookie);req.headers.set('x-recast-request','1');
 const response=await secureApplication(fakeApplication({capture:async(_r,e)=>{await e.AI.run('model',{})}})).fetch(req,w.env);
 assert.equal(response.status,200);assert.equal((await response.json()).image,`data:image/jpeg;base64,${MARKED.toString('base64')}`);
 assert.equal((await creditBalance(w.env,w.wallet)).remaining,2);
 const day=new Date().toISOString().slice(0,10);assert.equal((await read(w.env,`security/ai-budget/${day}.json`)).reservedCents,20);
});
const sku=Object.keys(FULFILLMENT).find(k=>!FULFILLMENT[k].digital);
async function orderSetup(){
 const env=await setup();const job={id:'123-456',orderId:paid.id,lineId:'gid://shopify/LineItem/456',orderName:paid.name,requestId:ID,sku,quantity:1,product:'Poster',digital:false,status:'awaiting_customer_approval'};
 await env.ARTWORK.put(`jobs/${job.id}.json`,JSON.stringify(job));
 const services={async verifyPaid(){return paid},async proof(){return {status:'completed',position:{area_width:1800,area_height:2400,width:1800,height:2250,left:0,top:75},images:[{title:'Product preview',url:'https://recast.test/api/mockup/image/test?token=private-mock'}]}}};
 const action=(name,body={})=>customerDesignAction(new Request(`https://recast.test/api/order-design/${job.id}/${name}`,{method:'POST',headers:{'x-recast-request':'1'},body:JSON.stringify({token:TOKEN,revision:0,...body})}),env,job.id,name,services);
 return {env,job,services,action};
}
test('order actions require the original private order token and a fresh paid status',async()=>{
 const o=await orderSetup();await assert.rejects(o.action('proof',{token:'wrong'}),e=>e.status===403);
 o.services.verifyPaid=async()=>{throw Object.assign(Error('refunded'),{status:409})};await assert.rejects(o.action('proof'),/refunded/);
 assert.equal((await designFor(o.env,o.job)).revision,0);
});
test('a customer must review a product proof, approve its exact revision and cannot swap afterward',async()=>{
 const o=await orderSetup();await assert.rejects(o.action('approve',{confirm:'APPROVE_FOR_PRINT'}),e=>e.code==='proof_required');
 await o.action('proof');await assert.rejects(o.action('approve',{confirm:'APPROVE_FOR_PRINT'}),e=>e.code==='stale_design');
 await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});
 const d=await approvedDesign(o.env,o.job);assert.ok(d.approvedAt);assert.equal(d.selectedRequestId,ID);
 await assert.rejects(o.action('swap',{revision:2,selectedRequestId:ID,selectedAccessToken:TOKEN}),e=>e.code==='design_locked');
});
test('parallel swaps and approvals cannot both change the same design revision',async()=>{
 const o=await orderSetup();await o.action('proof');
 const outcomes=await Promise.allSettled([o.action('swap',{revision:1,selectedRequestId:ID,selectedAccessToken:TOKEN}),o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'})]);
 assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);
 const d=await designFor(o.env,o.job);assert.equal(d.revision,2);assert.ok(d.approvedAt||d.proof===null);
});
test('swapping requires candidate ownership and invalidates the old product proof',async()=>{
 const o=await orderSetup();await o.action('proof');
 await assert.rejects(o.action('swap',{revision:1,selectedRequestId:ID,selectedAccessToken:'wrong'}),e=>e.status===403);
 await o.action('swap',{revision:1,selectedRequestId:ID,selectedAccessToken:TOKEN});
 const d=await designFor(o.env,o.job);assert.equal(d.proof,null);assert.ok(d.snapshotKey);
 await assert.rejects(o.action('approve',{revision:2,confirm:'APPROVE_FOR_PRINT'}),e=>e.code==='proof_required');
});
test('print finishing preserves the snapshotted image and never runs an AI detail enhancement',async()=>{
 const o=await orderSetup();await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});
 await o.env.ARTWORK.delete(`requests/${ID}/preview.b64`);
 const d=await finishApprovedDesign(o.env,o.job);assert.ok(d.finalKey);
 assert.ok(o.env.IMAGES.operations.some(([name,args])=>name==='transform'&&args.upscale==='interpolate'));
 assert.ok(!o.env.IMAGES.operations.some(([name,args])=>name==='transform'&&args.upscale==='generate'));
 const count=o.env.IMAGES.operations.length;await finishApprovedDesign(o.env,o.job);assert.equal(o.env.IMAGES.operations.length,count);
});
test('approved mug layout produces a clean composed production file without preview watermarking',async()=>{
 const COMPOSED=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(240,0x43),Buffer.from([255,217])]);
 const operations=[];const IMAGES={operations,info:async()=>({width:1024,height:1280}),input(){
  const chain={draws:0,transform(o){operations.push(['transform',o]);return this},draw(_overlay,o){this.draws++;operations.push(['draw',o]);return this},async output(o){operations.push(['output',o]);const bytes=this.draws?COMPOSED:CLEAN;return{response:()=>new Response(bytes,{headers:{'content-type':'image/jpeg'}})}}};return chain;
 }};
 const env=await setup({IMAGES}),job={id:'mug-clean-layout',requestId:ID,sku:'RECAST-MUG-11OZ',quantity:1,product:'Mug',digital:false,productDesignRequired:true,productDesign:{version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:115,spacing:'close'},productProofHash:'proof',productMockupId:'v3-two-sided-scene-fill-center-115-close'};
 const sourceHash=await hash(CLEAN.toString('base64')),snapshotKey='commerce/artwork/mug-clean-layout/source.b64';
 await env.ARTWORK.put(snapshotKey,CLEAN.toString('base64'));
 await env.ARTWORK.put('commerce/designs/mug-clean-layout.json',JSON.stringify({revision:2,selectedRequestId:ID,approvedAt:'2026-10-05T00:00:00Z',snapshotKey,sourceHash,printToken:'print-clean',proof:{images:[{url:'preview'}],position:{area_width:2700,area_height:1050,width:2700,height:1050,left:0,top:0},design:job.productDesign,sku:job.sku,quantity:1,sourceHash}}));
 const d=await finishApprovedDesign(env,job);assert.equal(d.finishMethod,'mug-layout-v3-clean');
 const saved=await env.ARTWORK.get(d.finalKey);assert.deepEqual(Buffer.from(await saved.arrayBuffer()),COMPOSED);assert.notDeepEqual(Buffer.from(await saved.arrayBuffer()),MARKED);
 assert.ok(operations.filter(([name])=>name==='draw').length>=2);
 assert.ok(operations.some(([name,args])=>name==='transform'&&args.blur===280));
 assert.ok(operations.some(([name,args])=>name==='draw'&&args.opacity===0.12));
 assert.ok(operations.some(([name,args])=>name==='draw'&&args.top===0));
 assert.ok(!operations.some(([name,args])=>name==='transform'&&args.blur===22));
});

test('v4 blanket production uses the same full-bleed composition approved in preview',async()=>{
 const COMPOSED=Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(220,0x44),Buffer.from([255,217])]);
 const ops=[];const IMAGES={operations:ops,info:async()=>({width:1024,height:1280}),input(){
  return {transform(o){ops.push(['transform',o]);return this},draw(_overlay,o){ops.push(['draw',o]);return this},async output(o){ops.push(['output',o]);return{response:()=>new Response(COMPOSED,{headers:{'content-type':'image/jpeg'}})}}};
 }};
 const env=await setup({IMAGES});
 const design=normalizeProductDesign({product:'Blanket'},{layout:'cover',fill:'full-bleed',x:'center',scale:100});
 const job={id:'blanket-v4',requestId:ID,sku:'RECAST-BLANKET-50X60',quantity:1,product:'Blanket',digital:false,productDesignRequired:true,productDesign:design,productProofHash:'proof',productMockupId:'v4-Blanket-cover-full-bleed-center-100-standard'};
 const sourceHash=await hash(CLEAN.toString('base64')),snapshotKey='commerce/artwork/blanket-v4/source.b64';
 await env.ARTWORK.put(snapshotKey,CLEAN.toString('base64'));
 await env.ARTWORK.put('commerce/designs/blanket-v4.json',JSON.stringify({revision:1,selectedRequestId:ID,approvedAt:'2026-10-05T00:00:00Z',snapshotKey,sourceHash,printToken:'print-blanket',proof:{images:[{url:'preview'}],position:{area_width:7500,area_height:9000,width:7500,height:9000,left:0,top:0},design,sku:job.sku,quantity:1,sourceHash}}));
 const d=await finishApprovedDesign(env,job);assert.equal(d.finishMethod,'product-layout-v4-clean');
 assert.ok(ops.some(([name,args])=>name==='transform'&&args.fit==='cover'));
 const saved=await env.ARTWORK.get(d.finalKey);assert.deepEqual(Buffer.from(await saved.arrayBuffer()),COMPOSED);
});

test('only the dedicated print token plus a fresh eligible payment can receive clean print bytes',async()=>{
 const o=await orderSetup();await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});const d=await finishApprovedDesign(o.env,o.job);
 const get=t=>new Request(`https://recast.test/api/order-print/${o.job.id}?token=${t}`);
 assert.equal((await printDesignFile(get(TOKEN),o.env,o.job,o.services.verifyPaid)).status,404);
 const r=await printDesignFile(get(d.printToken),o.env,o.job,o.services.verifyPaid);assert.equal(r.status,200);assert.deepEqual(Buffer.from(await r.arrayBuffer()),CLEAN);
 await assert.rejects(printDesignFile(get(d.printToken),o.env,o.job,async()=>{throw Error('refunded')}),/refunded/);
});
test('order-design customer previews are still watermarked, even after purchase approval',async()=>{
 const o=await orderSetup();await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});
 const app=secureApplication({fetch:routeWorkflow});
 const r=await app.fetch(new Request(`https://recast.test/api/order-design/${o.job.id}/preview?token=${TOKEN}`),o.env);
 assert.deepEqual(Buffer.from(await r.arrayBuffer()),MARKED);
});
test('Shopify reconciliation preserves approved preview snapshot and spacing for the customer order page',async()=>{
 const env=await setup({PUBLIC_APP_URL:'https://recast.test'});
 const design=normalizeProductDesign({product:'Mug'},{layout:'two-sided',fill:'ambient',x:'center',scale:110,spacing:'close'});
 const previewToken='a'.repeat(48),proof='proof-hash',mockup='v4-Mug-two-sided-ambient-center-110-close';
 const order={...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:'gid://shopify/LineItem/789',sku:'RECAST-MUG-11OZ',quantity:1,customAttributes:[
  {key:'Artwork ID',value:ID},{key:'_Recast Design',value:JSON.stringify(design)},{key:'_Recast Proof',value:proof},{key:'_Recast Mockup',value:mockup},{key:'_Recast Preview Token',value:previewToken}
 ]}]}};
 await reconcileShopifyOrder(env,order);
 const listed=await env.ARTWORK.list({prefix:'jobs/'});assert.equal(listed.objects.length,1);
 const job=await (await env.ARTWORK.get(listed.objects[0].key)).json();
 assert.deepEqual(job.productDesign,design);assert.equal(job.approvedPreviewToken,previewToken);assert.equal(job.status,'awaiting_customer_approval');
 const response=await customerOrderStatus(new Request(`https://recast.test/api/order-status?requestId=${ID}&token=${TOKEN}`),env);
 const data=await response.json();assert.equal(response.status,200);assert.equal(data.jobs[0].approvedPreviewUrl,`https://recast.test/proof/${previewToken}`);assert.equal(data.jobs[0].productDesign.spacing,'close');
});

test('pre-checkout confirmation becomes the approved design and auto-sends only after paid verification',async()=>{
 const env=await setup({
  PUBLIC_APP_URL:'https://recast.test',
  SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',
  PRINTFUL_API_TOKEN:'fixture-printful',AUTO_PRINT_PREAPPROVED_ENABLED:'true'
 });
 const design=normalizeProductDesign({product:'Mug'},{layout:'two-sided',fill:'ambient',x:'center',scale:110,spacing:'standard'});
 const proofHash=await hash(CLEAN.toString('base64')+'|'+JSON.stringify(design));
 const sourceHash=await hash(CLEAN.toString('base64'));
 const token='b'.repeat(48),mockup='v4-Mug-two-sided-ambient-center-110-standard';
 const snapshotKey=`commerce/preapprovals/${token}/source.b64`;
 await env.ARTWORK.put(snapshotKey,CLEAN.toString('base64'));
 await env.ARTWORK.put(`commerce/preapprovals/${token}.json`,JSON.stringify({
  token,requestId:ID,sku:'RECAST-MUG-11OZ',mockupId:mockup,proofHash,previewToken:token,design,snapshotKey,sourceHash,
  position:{area_width:2700,area_height:1050,width:2700,height:1050,left:0,top:0},
  images:[{title:'Front view',url:'https://recast.test/preview'}],approvedAt:'2026-10-05T17:00:00Z',schemaVersion:1
 }));
 const attrs=[
  {key:'Artwork ID',value:ID},{key:'_Recast Design',value:JSON.stringify(design)},{key:'_Recast Proof',value:proofHash},
  {key:'_Recast Mockup',value:mockup},{key:'_Recast Preview Token',value:token},{key:'_Recast Preapproval',value:token}
 ];
 const order={...paid,email:'buyer@example.com',shippingAddress:{name:'Buyer',address1:'1 Test St',city:'Testville',province:'Pennsylvania',provinceCode:'PA',countryCodeV2:'US',zip:'19000'},lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:'gid://shopify/LineItem/990',sku:'RECAST-MUG-11OZ',quantity:1,customAttributes:attrs}]}};
 const original=globalThis.fetch;let drafts=0,confirmations=0,persistedAtTag=null;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json')&&JSON.parse(options.body).query.includes('RecastOrderTags')){
   if(JSON.parse(options.body).variables.tags.includes('RECAST_PRINTFUL_SUBMITTED')){
    const keys=await env.ARTWORK.list({prefix:'jobs/'});persistedAtTag=await read(env,keys.objects[0].key);
   }
   return Response.json({data:{tagsAdd:{userErrors:[]}}});
  }
  if(path.includes('graphql.json'))return Response.json({data:{order}});
  if(path==='https://api.printful.com/orders'){drafts++;const body=JSON.parse(options.body);assert.match(body.items[0].files[0].url,/\/api\/order-print\//);return Response.json({result:{id:4455,status:'draft'}})}
  if(path.endsWith('/orders/4455/confirm')){confirmations++;return Response.json({result:{id:4455,status:'pending'}})}
  throw Error('Unexpected external call: '+path);
 };
 try{
  const result=await reconcileShopifyOrder(env,order);assert.equal(result.created,1);
  const jobs=await env.ARTWORK.list({prefix:'jobs/'});assert.equal(jobs.objects.length,1);
  const job=await (await env.ARTWORK.get(jobs.objects[0].key)).json();
  assert.equal(job.preapprovedCheckout,true);assert.equal(job.preapprovalToken,token);assert.ok(job.sentToProductionAt);assert.equal(job.status,'submitted_to_printful');
  assert.equal(drafts,1);assert.equal(confirmations,1);
  assert.equal(persistedAtTag?.status,"submitted_to_printful");assert.ok(persistedAtTag?.sentToProductionAt);
  const approved=await approvedDesign(env,job);assert.equal(approved.preapprovedAt,'2026-10-05T17:00:00Z');assert.equal(approved.proof.design.scale,110);
 }finally{globalThis.fetch=original}
});

test('legacy checkout preview can be cryptographically recovered and released to Printful once',async()=>{
 const env=await setup({
  PUBLIC_APP_URL:'https://recast.test',
  SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',
  PRINTFUL_API_TOKEN:'fixture-printful'
 });
 const sku='RECAST-MUG-11OZ';
 const design=normalizeProductDesign(FULFILLMENT[sku],{version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:110,spacing:'standard'});
 const sourceBase64=CLEAN.toString('base64');
 const proofHash=await hash(sourceBase64+'|'+JSON.stringify(design));
 const token='e'.repeat(48),mockupId='v3-two-sided-scene-fill-center-110-standard';
 const position={area_width:2700,area_height:1050,width:2700,height:1050,left:0,top:0};
 await env.ARTWORK.put(`mockups/${ID}/${sku}/${mockupId}/task.json`,JSON.stringify({status:'completed',sourceHash:proofHash,design,position,images:[{title:'Front'}]}));
 await env.ARTWORK.put(`commerce/checkout-previews/${token}.json`,JSON.stringify({token,requestId:ID,sku,mockupId,proofHash,design,views:[{index:0,title:'Front'}],createdAt:'2026-10-05T18:25:00Z'}));
 await env.ARTWORK.put(`commerce/checkout-previews/${token}.jpg`,CLEAN,{httpMetadata:{contentType:'image/jpeg'}});
 const line={id:'gid://shopify/LineItem/legacy-recover',sku,quantity:1,customAttributes:[
  {key:'Artwork ID',value:ID},{key:'_Recast Design',value:JSON.stringify(design)},{key:'_Recast Proof',value:proofHash},
  {key:'_Recast Mockup',value:mockupId},{key:'_Recast Preview Token',value:token}
 ]};
 const order={...paid,name:'#1001',tags:['RECAST_SEND_PRODUCTION'],email:'buyer@example.com',shippingAddress:{name:'Buyer',address1:'1 Test St',city:'Testville',province:'Pennsylvania',provinceCode:'PA',countryCodeV2:'US',zip:'19000'},lineItems:{pageInfo:{hasNextPage:false},nodes:[line]}};
 const original=globalThis.fetch;let drafts=0,confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json')){
   const body=JSON.parse(options.body);
   if(body.query.includes('RecastOrderTags'))return Response.json({data:{tagsAdd:{node:{id:order.id},userErrors:[]}}});
   return Response.json({data:{order}});
  }
  if(path==='https://api.printful.com/orders'){
   drafts++;
   const payload=JSON.parse(options.body);
   assert.equal(payload.items[0].variant_id,1320);
   assert.equal(payload.items[0].quantity,1);
   assert.deepEqual(payload.items[0].files[0].position,position);
   return Response.json({result:{id:8801,status:'draft'}});
  }
  if(path.endsWith('/orders/8801/confirm')){confirms++;return Response.json({result:{id:8801,status:'pending'}})}
  throw Error('Unexpected external call: '+path);
 };
 try{
  const result=await reconcileShopifyOrder(env,order);assert.equal(result.created,1);
  const listed=await env.ARTWORK.list({prefix:'jobs/'});assert.equal(listed.objects.length,1);
  const saved=await (await env.ARTWORK.get(listed.objects[0].key)).json();
  assert.equal(saved.status,'submitted_to_printful');assert.equal(saved.printfulOrderId,8801);assert.ok(saved.sentToProductionAt);assert.ok(saved.legacyApprovalRecoveredAt);
  const approved=await approvedDesign(env,saved);
  assert.ok(approved.approvedAt);assert.equal(approved.legacyPreviewCreatedAt,'2026-10-05T18:25:00Z');assert.equal(approved.proof.sourceHash,await hash(sourceBase64));
  assert.equal(drafts,1);assert.equal(confirms,1);
 }finally{globalThis.fetch=original}
});

test('existing legacy job is retried after deployment only when Shopify still carries explicit production release',async()=>{
 const env=await setup({
  PUBLIC_APP_URL:'https://recast.test',
  SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',
  PRINTFUL_API_TOKEN:'fixture-printful'
 });
 const sku='RECAST-MUG-11OZ';
 const design=normalizeProductDesign(FULFILLMENT[sku],{version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:110,spacing:'standard'});
 const sourceBase64=CLEAN.toString('base64'),sourceHash=await hash(sourceBase64);
 const proofHash=await hash(sourceBase64+'|'+JSON.stringify(design));
 const token='f'.repeat(48),mockupId='v3-two-sided-scene-fill-center-110-standard';
 const position={area_width:2700,area_height:1050,width:2700,height:1050,left:0,top:0};
 await env.ARTWORK.put(`mockups/${ID}/${sku}/${mockupId}/task.json`,JSON.stringify({status:'completed',sourceHash:proofHash,design,position,images:[{title:'Front'}]}));
 await env.ARTWORK.put(`commerce/checkout-previews/${token}.json`,JSON.stringify({token,requestId:ID,sku,mockupId,proofHash,design,views:[{index:0,title:'Front'}],createdAt:'2026-10-05T18:25:00Z'}));
 await env.ARTWORK.put(`commerce/checkout-previews/${token}.jpg`,CLEAN,{httpMetadata:{contentType:'image/jpeg'}});
 const lineId='gid://shopify/LineItem/existing-legacy';
 const job={id:'existing-legacy-job',lineId,orderId:paid.id,orderName:'#1001',orderCreatedAt:paid.createdAt,financialStatus:'PAID',requestId:ID,sku,quantity:1,product:'Mug',digital:false,productDesignRequired:true,productDesign:design,productProofHash:proofHash,productMockupId:mockupId,approvedPreviewToken:token,preapprovedCheckout:false,recipient:{name:'Buyer',address1:'1 Test St',city:'Testville',state_code:'PA',country_code:'US',zip:'19000'},status:'product_layout_review',createdAt:paid.createdAt,updatedAt:paid.updatedAt,printfulVariantId:1320,printfulProductId:19};
 await env.ARTWORK.put('jobs/existing-legacy-job.json',JSON.stringify(job));
 const order={...paid,tags:['RECAST_SEND_PRODUCTION'],email:'buyer@example.com',shippingAddress:{name:'Buyer',address1:'1 Test St',city:'Testville',province:'Pennsylvania',provinceCode:'PA',countryCodeV2:'US',zip:'19000'},lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:lineId,sku,quantity:1,customAttributes:[{key:'Artwork ID',value:ID},{key:'_Recast Design',value:JSON.stringify(design)},{key:'_Recast Proof',value:proofHash},{key:'_Recast Mockup',value:mockupId},{key:'_Recast Preview Token',value:token}]}]}};
 const original=globalThis.fetch;let drafts=0,confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json')){
   const body=JSON.parse(options.body);
   if(body.query.includes('RecastOrderTags'))return Response.json({data:{tagsAdd:{node:{id:order.id},userErrors:[]}}});
   return Response.json({data:{order}});
  }
  if(path==='https://api.printful.com/orders'){drafts++;return Response.json({result:{id:9901,status:'draft'}})}
  if(path.endsWith('/orders/9901/confirm')){confirms++;return Response.json({result:{id:9901,status:'pending'}})}
  throw Error('Unexpected external call: '+path);
 };
 try{
  const result=await retryLegacyOwnerReleaseCandidates(env);assert.equal(result.checked,1);assert.equal(result.released,1);
  const saved=await (await env.ARTWORK.get('jobs/existing-legacy-job.json')).json();
  assert.equal(saved.status,'submitted_to_printful');assert.equal(saved.printfulOrderId,9901);assert.ok(saved.legacyReleaseRecoveryV1At);assert.ok(saved.legacyApprovalRecoveredAt);
  assert.equal(drafts,1);assert.equal(confirms,1);
  const again=await retryLegacyOwnerReleaseCandidates(env);assert.equal(again.checked,0);assert.equal(again.released,0);assert.equal(drafts,1);assert.equal(confirms,1);
  assert.equal((await approvedDesign(env,saved)).sourceHash,sourceHash);
 }finally{globalThis.fetch=original}
});

test('explicit Shopify owner release sends an already-approved legacy order without reopening customer approval',async()=>{
 const env=await setup({
  PUBLIC_APP_URL:'https://recast.test',
  SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',
  PRINTFUL_API_TOKEN:'fixture-printful'
 });
 const design={version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:110,spacing:'standard'};
 const line={id:'gid://shopify/LineItem/17002516447476',sku:'RECAST-MUG-11OZ',quantity:1,customAttributes:[
  {key:'Artwork ID',value:ID},{key:'_Recast Design',value:JSON.stringify(design)},{key:'_Recast Proof',value:'legacy-proof'},
  {key:'_Recast Mockup',value:'v3-two-sided-scene-fill-center-110-standard'},{key:'_Recast Preview Token',value:'c'.repeat(48)}
 ]};
 const order={...paid,name:'#1001',tags:['RECAST_SEND_PRODUCTION'],email:'buyer@example.com',shippingAddress:{name:'Buyer',address1:'1 Test St',city:'Testville',province:'Pennsylvania',provinceCode:'PA',countryCodeV2:'US',zip:'19000'},lineItems:{pageInfo:{hasNextPage:false},nodes:[line]}};
 const id='-1001-'+ID+'-RECAST-MUG-11OZ',snapshotKey='commerce/artwork/legacy-release/source.b64',sourceHash=await hash(CLEAN.toString('base64'));
 await env.ARTWORK.put(snapshotKey,CLEAN.toString('base64'));
 const job={id,lineId:line.id,orderId:paid.id,orderName:'#1001',orderCreatedAt:paid.createdAt,financialStatus:'PAID',requestId:ID,sku:line.sku,quantity:1,product:'Mug',digital:false,productDesignRequired:true,productDesign:design,productProofHash:'legacy-proof',productMockupId:'v3-two-sided-scene-fill-center-110-standard',approvedPreviewToken:'c'.repeat(48),recipient:{name:'Buyer',address1:'1 Test St',city:'Testville',state_code:'PA',country_code:'US',zip:'19000'},status:'art_approved_needs_high_res',createdAt:paid.createdAt,updatedAt:paid.updatedAt,printfulVariantId:1320,printfulProductId:19};
 await env.ARTWORK.put(`jobs/${id}.json`,JSON.stringify(job));
 await env.ARTWORK.put(`commerce/designs/${id}.json`,JSON.stringify({revision:2,selectedRequestId:ID,approvedAt:'2026-10-05T20:00:00Z',snapshotKey,sourceHash,printToken:'legacy-print',proof:{images:[{url:'preview'}],position:{area_width:2700,area_height:1050,width:2700,height:1050,left:0,top:0},design,sku:line.sku,quantity:1,sourceHash}}));
 const original=globalThis.fetch;let drafts=0,confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json'))return Response.json({data:{order}});
  if(path==='https://api.printful.com/orders'){drafts++;return Response.json({result:{id:777,status:'draft'}})}
  if(path.endsWith('/orders/777/confirm')){confirms++;return Response.json({result:{id:777,status:'pending'}})}
  throw Error('Unexpected external call: '+path);
 };
 try{
  await reconcileShopifyOrder(env,order);
  const saved=await (await env.ARTWORK.get(`jobs/${id}.json`)).json();
  assert.equal(saved.status,'submitted_to_printful');assert.ok(saved.sentToProductionAt);assert.equal(drafts,1);assert.equal(confirms,1);
 }finally{globalThis.fetch=original}
});


test('legacy owner release with no preserved approval is surfaced for review and never contacts Printful',async()=>{
 const env=await setup({SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful'});
 const design={version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:110,spacing:'standard'};
 const order={...paid,tags:['RECAST_SEND_PRODUCTION'],lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:'gid://shopify/LineItem/legacy-hold',sku:'RECAST-MUG-11OZ',quantity:1,customAttributes:[
  {key:'Artwork ID',value:ID},{key:'_Recast Design',value:JSON.stringify(design)},{key:'_Recast Proof',value:'legacy-proof'},
  {key:'_Recast Mockup',value:'v3-two-sided-scene-fill-center-110-standard'},{key:'_Recast Preview Token',value:'d'.repeat(48)}
 ]}]}};
 const original=globalThis.fetch;let printfulCalls=0,reviewTagged=false;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json')){
   const body=JSON.parse(options.body);
   if(body.query.includes('RecastOrderTags')){reviewTagged=body.variables.tags.includes('RECAST_PRINTFUL_REVIEW');return Response.json({data:{tagsAdd:{node:{id:order.id},userErrors:[]}}});}
   throw Error('Unexpected Shopify operation');
  }
  if(path.startsWith('https://api.printful.com/')){printfulCalls++;throw Error('Printful must not be contacted');}
  throw Error('Unexpected external call: '+path);
 };
 try{
  await reconcileShopifyOrder(env,order);
  const listed=await env.ARTWORK.list({prefix:'jobs/'}),job=await (await env.ARTWORK.get(listed.objects[0].key)).json();
  assert.equal(job.status,'owner_release_review');assert.match(job.ownerReleaseError,/could not be matched to its exact saved product preview/i);
  assert.equal(reviewTagged,true);assert.equal(printfulCalls,0);
 }finally{globalThis.fetch=original}
});

test('Printful shipment creates one Shopify fulfillment with tracking and stays idempotent',async()=>{
 const env=await setup({SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful'});
 const job={id:'shipment-job',lineId:'gid://shopify/LineItem/ship-1',orderId:paid.id,orderName:'#1001',requestId:ID,sku:'RECAST-MUG-11OZ',quantity:1,product:'Mug',digital:false,status:'submitted_to_printful',sentToProductionAt:'2026-10-05T21:00:00Z',printfulOrderId:555,createdAt:paid.createdAt,updatedAt:paid.updatedAt};
 await env.ARTWORK.put('jobs/shipment-job.json',JSON.stringify(job));
 const original=globalThis.fetch;let fulfillmentCreates=0;const tagSets=[];
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path==='https://api.printful.com/orders/555')return Response.json({result:{id:555,status:'fulfilled',shipments:[{tracking_number:'TRACK123',tracking_url:'https://tracking.example/TRACK123',carrier:'USPS',shipped_at:'2026-10-06T10:00:00Z'}]}});
  if(path.includes('graphql.json')){
   const body=JSON.parse(options.body);
   if(body.query.includes('RecastFulfillmentOrders'))return Response.json({data:{order:{fulfillmentOrders:{nodes:[{id:'gid://shopify/FulfillmentOrder/fo1',status:'OPEN',lineItems:{nodes:[{id:'gid://shopify/FulfillmentOrderLineItem/fol1',remainingQuantity:1,lineItem:{id:job.lineId}}]}}]}}}});
   if(body.query.includes('RecastCreateFulfillment')){
    fulfillmentCreates++;
    assert.equal(body.variables.fulfillment.notifyCustomer,true);
    assert.deepEqual(body.variables.fulfillment.trackingInfo,{company:'USPS',number:'TRACK123',url:'https://tracking.example/TRACK123'});
    assert.deepEqual(body.variables.fulfillment.lineItemsByFulfillmentOrder,[{fulfillmentOrderId:'gid://shopify/FulfillmentOrder/fo1',fulfillmentOrderLineItems:[{id:'gid://shopify/FulfillmentOrderLineItem/fol1',quantity:1}]}]);
    return Response.json({data:{fulfillmentCreate:{fulfillment:{id:'gid://shopify/Fulfillment/f1',status:'SUCCESS',trackingInfo:[{company:'USPS',number:'TRACK123',url:'https://tracking.example/TRACK123'}]},userErrors:[]}}});
   }
   if(body.query.includes('RecastOrderTags')){tagSets.push(body.variables.tags);return Response.json({data:{tagsAdd:{node:{id:job.orderId},userErrors:[]}}});}
   throw Error('Unexpected Shopify operation');
  }
  throw Error('Unexpected external call: '+path);
 };
 try{
  assert.equal((await syncPrintfulJobs(env)).updated,1);
  let saved=await (await env.ARTWORK.get('jobs/shipment-job.json')).json();
  assert.equal(saved.status,'shipped');assert.equal(saved.trackingNumber,'TRACK123');assert.equal(saved.shopifyFulfillmentId,'gid://shopify/Fulfillment/f1');
  assert.ok(tagSets.at(-1).includes('RECAST_SHIPPED'));
  assert.equal((await syncPrintfulJobs(env)).updated,1);
  saved=await (await env.ARTWORK.get('jobs/shipment-job.json')).json();
  assert.equal(saved.shopifyFulfillmentId,'gid://shopify/Fulfillment/f1');assert.equal(fulfillmentCreates,1);
 }finally{globalThis.fetch=original}
});

test('Shopify reconciliation creates one job per line, awards once, and revokes refunded entitlements',async()=>{
 const {env,wallet}=await walletSetup('192.0.2.1',await setup());
 const meta=await read(env,`requests/${ID}/request.json`);meta.creditWalletId=wallet.id;await env.ARTWORK.put(`requests/${ID}/request.json`,JSON.stringify(meta));
 const order={...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:'gid://shopify/LineItem/456',sku,quantity:1,customAttributes:[{key:'Artwork ID',value:ID}]}]}};
 await reconcileShopifyOrder(env,order);await reconcileShopifyOrder(env,order);
 assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,1);assert.equal((await creditBalance(env,wallet)).bonus,3);
 await reconcileShopifyOrder(env,{...order,displayFinancialStatus:'REFUNDED',updatedAt:'2026-10-03T03:00:00Z'});
 assert.equal((await creditBalance(env,wallet)).bonus,0);assert.equal((await read(env,`requests/${ID}/request.json`)).paid,false);assert.equal((await read(env,'jobs/123-456.json')).status,'payment_hold');
});
async function shopifyMock(o,run,{testOrder=false,payment='PAID'}={}){
 const original=globalThis.fetch;let drafts=0,confirmations=0;
 Object.assign(o.env,{SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful',PUBLIC_APP_URL:'https://recast.test'});
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.endsWith('/admin/oauth/access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json'))return Response.json({data:{order:{...paid,test:testOrder,displayFinancialStatus:payment,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:o.job.lineId,sku:o.job.sku,quantity:o.job.quantity,customAttributes:[{key:'Artwork ID',value:ID}]}]}}}});
  if(path==='https://api.printful.com/orders'){drafts++;const b=JSON.parse(options.body);assert.match(b.external_id,/^[A-Za-z0-9_-]{1,32}$/);assert.deepEqual(b.items[0].files[0].position,{area_width:1800,area_height:2400,width:1800,height:2250,left:0,top:75});assert.match(b.items[0].files[0].url,/\/api\/order-print\//);assert.ok(!b.items[0].files[0].url.includes('/api/print-source/'));return Response.json({result:{id:999,status:'draft'}})}
  if(path.endsWith('/orders/999/confirm')){confirmations++;return Response.json({result:{id:999,status:'pending'}})}
  throw Error('Unexpected external call: '+path);
 };
 try{await run(()=>({drafts,confirmations}))}finally{globalThis.fetch=original}
}
const adminRequest=body=>new Request('https://recast.test/api/admin/job/action',{method:'POST',headers:{authorization:'Bearer owner-test-secret','content-type':'application/json'},body:JSON.stringify(body||{})});
test('owner approval cannot bypass the customer design approval gate',async()=>{
 const o=await orderSetup();await shopifyMock(o,async()=>{
  const r=await adminJobAction(adminRequest(),o.env,o.job.id,'approve-art');assert.equal(r.status,409);assert.match((await r.json()).error,/customer must review/i);
 });
});
test('Printful draft and production submission are claimed once and use the approved order file',async()=>{
 const o=await orderSetup();await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
 Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 await shopifyMock(o,async counts=>{
  const drafts=await Promise.all([adminJobAction(adminRequest(),o.env,o.job.id,'create-draft'),adminJobAction(adminRequest(),o.env,o.job.id,'create-draft')]);
  assert.equal(counts().drafts,1);assert.ok(drafts.some(r=>r.status===200));
  const denied=await adminJobAction(adminRequest(),o.env,o.job.id,'send-production');assert.equal(denied.status,409);assert.equal(counts().confirmations,0);
  await Promise.all([adminJobAction(adminRequest({confirm:'SEND_TO_PRODUCTION'}),o.env,o.job.id,'send-production'),adminJobAction(adminRequest({confirm:'SEND_TO_PRODUCTION'}),o.env,o.job.id,'send-production')]);
  assert.equal(counts().confirmations,1);
 });
});
test('fresh refund or test payment blocks production before contacting Printful',async()=>{
 for(const options of [{payment:'REFUNDED'},{testOrder:true}]){
  const o=await orderSetup();o.env.ALLOW_TEST_ORDER_CREDITS='true';await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
  Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
  await shopifyMock(o,async counts=>{const r=await adminJobAction(adminRequest(),o.env,o.job.id,'create-draft');assert.equal(r.status,409);assert.equal(counts().drafts,0)},options);
 }
});
test('changed purchased quantity blocks approval and production',async()=>{
 const o=await orderSetup();await shopifyMock(o,async()=>{await assert.rejects(verifyPaidOrder(o.env,{...o.job,quantity:9}),e=>e.code==='order_changed')});
});
test('enabled allowances fail readiness until the budget and network-abuse secret are configured',async()=>{
 const {localReadiness}=await import('../src/render-health.js');
 const env=await setup({AI:{run(){}},RENDER_CREDITS_ENABLED:'true'});
 assert.deepEqual(localReadiness(env).missing,['AI_BUDGET','CREDIT_IP_SALT']);
 Object.assign(env,{AI_DAILY_BUDGET_CENTS:'100',AI_CALL_RESERVE_CENTS:'10',CREDIT_IP_SALT:salt});assert.equal(localReadiness(env).ready,true);
});
test('order sync paginates updated orders and retains its cursor rather than dropping older paid orders',async()=>{
 const {syncPaidOrders}=await import('../src/workflow.js');const original=globalThis.fetch;
 const env={ARTWORK:new Bucket(),SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store'};let count=0;
 globalThis.fetch=async(url,options={})=>{
  if(String(url).includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  const body=JSON.parse(options.body);assert.match(body.variables.query,/updated_at/);assert.ok(!body.variables.query.includes('financial_status:paid'));
  if(count>0)assert.equal(body.variables.after,'cursor-'+count);count++;
  return Response.json({data:{orders:{nodes:[],pageInfo:{hasNextPage:count<5,endCursor:'cursor-'+count}}}});
 };
 try{
  assert.equal((await syncPaidOrders(env)).more,true);assert.equal((await read(env,'system/order-sync-cursor.json')).cursor,'cursor-4');
  assert.equal((await syncPaidOrders(env)).more,false);assert.equal((await read(env,'system/order-sync-cursor.json')).cursor,null);assert.equal(count,5);
 }finally{globalThis.fetch=original}
});

test('24-hour HQ reset preserves bonus and ignores delayed previous-window refunds',async()=>{
 const {env,wallet}=await walletSetup();const bound={...env,RECAST_CREDIT_WALLET:wallet},now=Date.now();
 const old=await reserveCustomerRender(bound,now);
 await reserveCustomerRender(bound,now);await reserveCustomerRender(bound,now);
 assert.equal((await creditBalance(env,wallet,now+86399999)).remaining,0);
 assert.equal((await creditBalance(env,wallet,now+86400000)).remaining,3);
 await reserveCustomerRender(bound,now+86400000);
 await settleCustomerRender(env,old,false);
 assert.equal((await creditBalance(env,wallet,now+86400000)).remaining,2);
});
test('Standard has five slots only after HQ is exhausted, with failure refund and 24-hour reset',async()=>{
 const {env,wallet}=await walletSetup();const high={...env,RECAST_CREDIT_WALLET:wallet},bound={...high,RECAST_RENDER_MODE:'quick'},now=Date.now();
 await assert.rejects(reserveCustomerRender(bound,now),e=>e.code==='standard_locked');
 for(let i=0;i<3;i++)await settleCustomerRender(env,await reserveCustomerRender(high,now),true);
 const results=await Promise.allSettled(Array.from({length:10},()=>reserveCustomerRender(bound,now)));
 const accepted=results.filter(r=>r.status==='fulfilled');assert.equal(accepted.length,5);
 assert.equal((await creditBalance(env,wallet,now)).remaining,0);
 assert.equal((await creditBalance(env,wallet,now)).standardRemaining,0);
 await settleCustomerRender(env,accepted[0].value,false);
 assert.equal((await creditBalance(env,wallet,now)).standardRemaining,1);
 await reserveCustomerRender(bound,now);
 assert.equal((await creditBalance(env,wallet,now+86400000)).standardRemaining,5);
 await assert.rejects(reserveCustomerRender(bound,now+86400000),e=>e.code==='standard_locked');
});

test('RM0504 long new draft IDs satisfy Printful and retain exact approved file with no confirmation',async()=>{
 const o=await orderSetup();await o.env.ARTWORK.delete(`jobs/${o.job.id}.json`);
 o.job.id='1111111111111-22222222222222';o.job.lineId='gid://shopify/LineItem/22222222222222';
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
 Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const before=await (await o.env.ARTWORK.get(`commerce/designs/${o.job.id}.json`)).text();
 await shopifyMock(o,async counts=>{
  const r=await adminJobAction(adminRequest(),o.env,o.job.id,'create-draft');assert.equal(r.status,200);
  const saved=await read(o.env,`jobs/${o.job.id}.json`),claim=await read(o.env,`commerce/production/${await hash(o.job.id)}-draft.json`);
  assert.match(saved.printfulExternalId,/^rm-[a-f0-9]{29}$/);assert.equal(claim.externalId,saved.printfulExternalId);
  assert.equal(counts().drafts,1);assert.equal(counts().confirmations,0);
  assert.equal(await (await o.env.ARTWORK.get(`commerce/designs/${o.job.id}.json`)).text(),before);
 });
});
test('RM0504 existing invalid-ID attempt remains locked byte-for-byte and never retries',async()=>{
 const o=await orderSetup();await o.env.ARTWORK.delete(`jobs/${o.job.id}.json`);
 o.job.id='1111111111111-22222222222222';o.job.lineId='gid://shopify/LineItem/22222222222222';
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
 Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const key=`commerce/production/${await hash(o.job.id)}-draft.json`,original='{"startedAt":"2026-10-06T04:00:00Z"}';
 await o.env.ARTWORK.put(key,original);
 await shopifyMock(o,async counts=>{
  for(let i=0;i<2;i++){const r=await adminJobAction(adminRequest(),o.env,o.job.id,'create-draft');assert.equal(r.status,409);assert.match((await r.json()).error,/already started/);}
  assert.equal(counts().drafts,0);assert.equal(counts().confirmations,0);assert.equal(await(await o.env.ARTWORK.get(key)).text(),original);
 });
});

test('RM0505 verified empty-store recovery replaces one stale legacy lock, creates one draft, and holds production',async()=>{
 const o=await orderSetup();await o.env.ARTWORK.delete(`jobs/${o.job.id}.json`);
 o.job.id='1111111111111-22222222222222';o.job.lineId='gid://shopify/LineItem/22222222222222';
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
 Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt,status:'owner_release_review',ownerReleaseError:'Draft submission already started; review Printful before retrying.'});
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const claimKey=`commerce/production/${await hash(o.job.id)}-draft.json`,legacy='{"startedAt":"2026-10-06T04:10:22.701Z"}';
 await o.env.ARTWORK.put(claimKey,legacy);
 const designBefore=await (await o.env.ARTWORK.get(`commerce/designs/${o.job.id}.json`)).text();
 Object.assign(o.env,{SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful',PRINTFUL_STORE_ID:'123',PUBLIC_APP_URL:'https://recast.test'});
 const original=globalThis.fetch;let providerReads=0,drafts=0,confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.endsWith('/admin/oauth/access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json')){
   const body=JSON.parse(options.body);
   if(body.query.includes('RecastOrderTags'))return Response.json({data:{tagsAdd:{node:{id:paid.id},userErrors:[]}}});
   return Response.json({data:{order:{...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:o.job.lineId,sku:o.job.sku,quantity:o.job.quantity,customAttributes:[{key:'Artwork ID',value:ID}]}]}}}});
  }
  if(path===`https://api.printful.com/orders/@recast-${o.job.id}`){providerReads++;assert.equal(options.redirect,'manual');return Response.json({code:400,result:'invalid reference'},{status:400});}
  if(path==='https://api.printful.com/orders?limit=100&offset=0'){providerReads++;return Response.json({code:200,result:[],paging:{total:0,offset:0,limit:100}},{status:200});}
  if(path==='https://api.printful.com/orders'&&options.method==='POST'){
   drafts++;const body=JSON.parse(options.body);assert.match(body.external_id,/^rm-[a-f0-9]{29}$/);assert.ok(body.external_id.length<=32);
   return Response.json({result:{id:4242,status:'draft'}});
  }
  if(path.includes('/confirm')){confirms++;throw Error('Production confirmation must never occur during recovery');}
  throw Error('Unexpected external call: '+path);
 };
 try{
  const r=await adminJobAction(adminRequest({confirm:'RECOVER_MISSING_DRAFT'}),o.env,o.job.id,'recover-missing-draft');
  assert.equal(r.status,200);const body=await r.json();assert.equal(body.recovered,true);assert.equal(body.productionSubmitted,false);assert.equal(body.printfulOrderId,'4242');
  const saved=await read(o.env,`jobs/${o.job.id}.json`),claim=await read(o.env,claimKey);
  assert.equal(saved.status,'on_hold');assert.equal(saved.printfulOrderId,4242);assert.match(saved.holdReason,/inspect the draft/i);
  assert.equal(saved.printfulExternalId,claim.externalId);assert.equal(claim.referenceVersion,3);assert.equal(claim.recovery,true);assert.equal(claim.recoveredFrom.externalId,`recast-${o.job.id}`);
  assert.equal(providerReads,2);assert.equal(drafts,1);assert.equal(confirms,0);
  assert.equal(await (await o.env.ARTWORK.get(`commerce/designs/${o.job.id}.json`)).text(),designBefore);
 }finally{globalThis.fetch=original}
});

test('RM0505 recovery refuses a non-empty Printful store and preserves the legacy lock byte-for-byte',async()=>{
 const o=await orderSetup();await o.env.ARTWORK.delete(`jobs/${o.job.id}.json`);
 o.job.id='1111111111111-22222222222222';o.job.lineId='gid://shopify/LineItem/22222222222222';
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify({...o.job,artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt,status:'owner_release_review'}));
 const claimKey=`commerce/production/${await hash(o.job.id)}-draft.json`,legacy='{"startedAt":"2026-10-06T04:10:22.701Z"}';await o.env.ARTWORK.put(claimKey,legacy);
 Object.assign(o.env,{PRINTFUL_API_TOKEN:'fixture-printful',PRINTFUL_STORE_ID:'123'});
 const original=globalThis.fetch;let posts=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('/orders/@'))return Response.json({code:400,result:'invalid reference'},{status:400});
  if(path.includes('/orders?'))return Response.json({code:200,result:[{id:9,store:123,external_id:'unrelated',status:'draft'}],paging:{total:1,offset:0,limit:100}},{status:200});
  if(options.method==='POST'){posts++;throw Error('No provider write allowed');}
  throw Error('Unexpected call '+path);
 };
 try{
  const r=await adminJobAction(adminRequest({confirm:'RECOVER_MISSING_DRAFT'}),o.env,o.job.id,'recover-missing-draft');assert.equal(r.status,409);
  assert.match((await r.json()).error,/zero-order snapshot/i);assert.equal(posts,0);
  assert.equal(await(await o.env.ARTWORK.get(claimKey)).text(),legacy);
  assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).status,'owner_release_review');
 }finally{globalThis.fetch=original}
});

test('RM0505 lock compare-and-swap blocks recovery if the stale claim changes after provider verification',async()=>{
 const o=await orderSetup();await o.env.ARTWORK.delete(`jobs/${o.job.id}.json`);
 o.job.id='1111111111111-22222222222222';o.job.lineId='gid://shopify/LineItem/22222222222222';
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
 Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt,status:'owner_release_review'});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const claimKey=`commerce/production/${await hash(o.job.id)}-draft.json`;await o.env.ARTWORK.put(claimKey,'{"startedAt":"2026-10-06T04:10:22.701Z"}');
 Object.assign(o.env,{SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful',PRINTFUL_STORE_ID:'123',PUBLIC_APP_URL:'https://recast.test'});
 const original=globalThis.fetch;let posts=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.endsWith('/admin/oauth/access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json'))return Response.json({data:{order:{...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:o.job.lineId,sku:o.job.sku,quantity:o.job.quantity,customAttributes:[{key:'Artwork ID',value:ID}]}]}}}});
  if(path.includes('/orders/@'))return Response.json({code:400,result:'invalid reference'},{status:400});
  if(path.includes('/orders?')){await o.env.ARTWORK.put(claimKey,'{"startedAt":"someone-else-changed-this"}');return Response.json({code:200,result:[],paging:{total:0,offset:0,limit:100}},{status:200});}
  if(path==='https://api.printful.com/orders'){posts++;throw Error('No POST after a changed lock');}
  throw Error('Unexpected call '+path);
 };
 try{
  const r=await adminJobAction(adminRequest({confirm:'RECOVER_MISSING_DRAFT'}),o.env,o.job.id,'recover-missing-draft');assert.equal(r.status,409);
  assert.match((await r.json()).error,/saved attempt changed/i);assert.equal(posts,0);
  assert.equal(await(await o.env.ARTWORK.get(claimKey)).text(),'{"startedAt":"someone-else-changed-this"}');
  assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).status,'on_hold');
 }finally{globalThis.fetch=original}
});


test('RM0507 owner release of an inspected recovered draft revalidates it and submits production exactly once',async()=>{
 const o=await orderSetup();
 await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});
 await finishApprovedDesign(o.env,o.job);
 const externalId='rm-1234567890abcdef1234567890abc';
 Object.assign(o.job,{
  artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt,status:'on_hold',
  recoveredPrintfulDraftAt:'2026-10-06T23:27:48.274Z',
  printfulOrderId:4242,printfulExternalId:externalId,printfulStatus:'draft',
  holdReason:'Recovered Printful draft #4242 — inspect the draft before paid production.'
 });
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 Object.assign(o.env,{SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful',PRINTFUL_STORE_ID:'123'});
 const line={id:o.job.lineId,sku:o.job.sku,quantity:o.job.quantity,customAttributes:[{key:'Artwork ID',value:ID}]};
 const order={...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[line]}};
 const original=globalThis.fetch;let checks=0,confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json')){
   const body=JSON.parse(options.body);
   if(body.query.includes('RecastOrderTags'))return Response.json({data:{tagsAdd:{node:{id:order.id},userErrors:[]}}});
   return Response.json({data:{order}});
  }
  if(path==='https://api.printful.com/orders/4242'&&options.method==='GET'){checks++;return Response.json({result:{id:4242,external_id:externalId,store:123,status:'draft'}});}
  if(path==='https://api.printful.com/orders/4242/confirm'&&options.method==='POST'){confirms++;return Response.json({result:{id:4242,status:'pending'}});}
  throw Error('Unexpected external call: '+path);
 };
 try{
  let r=await adminJobAction(adminRequest({confirm:'WRONG'}),o.env,o.job.id,'release-recovered-draft');assert.equal(r.status,409);assert.equal(checks,0);assert.equal(confirms,0);
  r=await adminJobAction(adminRequest({confirm:'SEND_INSPECTED_RECOVERED_DRAFT'}),o.env,o.job.id,'release-recovered-draft');assert.equal(r.status,200);
  const body=await r.json();assert.equal(body.productionSubmitted,true);assert.equal(body.printfulOrderId,'4242');
  let saved=await read(o.env,`jobs/${o.job.id}.json`);assert.equal(saved.status,'submitted_to_printful');assert.ok(saved.sentToProductionAt);assert.ok(saved.recoveredDraftReleasedAt);assert.equal(saved.holdReason,undefined);
  assert.equal(checks,1);assert.equal(confirms,1);
  r=await adminJobAction(adminRequest({confirm:'SEND_INSPECTED_RECOVERED_DRAFT'}),o.env,o.job.id,'release-recovered-draft');assert.equal(r.status,200);
  assert.equal((await r.json()).alreadySent,true);assert.equal(checks,1);assert.equal(confirms,1);
 }finally{globalThis.fetch=original}
});

test('RM0507 recovered release blocks a changed Printful draft before paid production',async()=>{
 const o=await orderSetup();
 await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});await finishApprovedDesign(o.env,o.job);
 Object.assign(o.job,{artApprovedAt:paid.updatedAt,printReadyAt:paid.updatedAt,status:'on_hold',recoveredPrintfulDraftAt:paid.updatedAt,printfulOrderId:4242,printfulExternalId:'rm-1234567890abcdef1234567890abc'});
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 Object.assign(o.env,{SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful',PRINTFUL_STORE_ID:'123'});
 const order={...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:o.job.lineId,sku:o.job.sku,quantity:o.job.quantity,customAttributes:[{key:'Artwork ID',value:ID}]}]}};
 const original=globalThis.fetch;let confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json'))return Response.json({data:{order}});
  if(path==='https://api.printful.com/orders/4242')return Response.json({result:{id:4242,external_id:'some-other-order',store:123,status:'draft'}});
  if(path.includes('/confirm')){confirms++;throw Error('must not confirm mismatched draft');}
  throw Error('Unexpected external call: '+path);
 };
 try{
  const r=await adminJobAction(adminRequest({confirm:'SEND_INSPECTED_RECOVERED_DRAFT'}),o.env,o.job.id,'release-recovered-draft');assert.equal(r.status,409);
  assert.match((await r.json()).error,/no longer matches/i);assert.equal(confirms,0);
  const saved=await read(o.env,`jobs/${o.job.id}.json`);assert.equal(saved.status,'on_hold');assert.equal(saved.sentToProductionAt,undefined);
 }finally{globalThis.fetch=original}
});

test('RM063 one owner recovery preserves approved pixels and creates only a held draft',async()=>{
 const o=await orderSetup();await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});
 o.env.IMAGES=imageMock({fail:true});await assert.rejects(finishApprovedDesign(o.env,o.job),/TEST_IMAGE_SERVICE_FAILURE/);
 const d=await approvedDesign(o.env,o.job),originalClaim=`commerce/finishes/${await hash(o.job.id)}/${d.sourceHash}.claim`;
 const claimBytes=await(await o.env.ARTWORK.get(originalClaim)).text();
 Object.assign(o.job,{preapprovedCheckout:true,autoPrintFailedAt:new Date(Date.now()-600000).toISOString(),autoPrintError:'Network connection lost.',status:'auto_print_review'});
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));o.env.IMAGES=imageMock();
 Object.assign(o.env,{SHOPIFY_CLIENT_ID:'fixture-client',SHOPIFY_CLIENT_SECRET:'fixture-secret',SHOPIFY_SHOP:'fixture-store',PRINTFUL_API_TOKEN:'fixture-printful',PRINTFUL_STORE_ID:'123',PUBLIC_APP_URL:'https://recast.test'});
 const original=globalThis.fetch;let drafts=0,confirms=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
  if(path.includes('graphql.json'))return Response.json({data:{order:{...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:o.job.lineId,sku:o.job.sku,quantity:1,customAttributes:[{key:'Artwork ID',value:ID}]}]}},tagsAdd:{userErrors:[]}}});
  if(path.endsWith('/confirm')){confirms++;throw Error('must not confirm');}
  if(path==='https://api.printful.com/orders'){drafts++;assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).status,'on_hold');return Response.json({result:{id:9876,status:'draft'}});}
  throw Error('Unexpected '+path);
 };
 try{
  let r=await adminJobAction(adminRequest({confirm:'WRONG'}),o.env,o.job.id,'recover-print-file');assert.equal(r.status,409);assert.equal(drafts,0);
  r=await adminJobAction(adminRequest({confirm:'RECOVER_PRINT_FILE'}),o.env,o.job.id,'recover-print-file');assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
  const saved=await read(o.env,`jobs/${o.job.id}.json`);assert.equal(saved.status,'on_hold');assert.equal(saved.printfulOrderId,9876);assert.ok(saved.recoveredPrintfulDraftAt);assert.equal(saved.sentToProductionAt,undefined);
  const finished=await approvedDesign(o.env,saved);assert.equal(finished.sourceHash,d.sourceHash);assert.equal(finished.snapshotKey,d.snapshotKey);assert.deepEqual(Buffer.from(await(await o.env.ARTWORK.get(finished.finalKey)).arrayBuffer()),CLEAN);
  assert.equal(await(await o.env.ARTWORK.get(originalClaim)).text(),claimBytes);
  r=await adminJobAction(adminRequest({confirm:'RECOVER_PRINT_FILE'}),o.env,o.job.id,'recover-print-file');assert.equal(r.status,409);assert.equal(drafts,1);assert.equal(confirms,0);
 }finally{globalThis.fetch=original}
});

test('RM063 finishing recovery cannot silently retry normal or already-retried image attempts',async()=>{
 const o=await orderSetup();await o.action('proof');await o.action('approve',{revision:1,confirm:'APPROVE_FOR_PRINT'});
 o.env.IMAGES=imageMock({fail:true});await assert.rejects(finishApprovedDesign(o.env,o.job));
 await assert.rejects(finishApprovedDesign(o.env,o.job),e=>e.code==='finish_in_progress');
 await assert.rejects(finishApprovedDesign(o.env,o.job,{ownerRecovery:true}),e=>e.code==='finish_recovery_blocked');
 Object.assign(o.job,{status:'on_hold',printFileRecoveryStartedAt:new Date().toISOString()});
 await assert.rejects(finishApprovedDesign(o.env,o.job,{ownerRecovery:true}),/TEST_IMAGE_SERVICE_FAILURE/);
 await assert.rejects(finishApprovedDesign(o.env,o.job,{ownerRecovery:true}),e=>e.code==='finish_in_progress');
});

test('supplier acceptance reconciles a held draft without another confirmation, even if Shopify tags fail',async()=>{
 const o=await orderSetup();Object.assign(o.env,{PRINTFUL_API_TOKEN:'fixture',PRINTFUL_STORE_ID:'7',SHOPIFY_CLIENT_ID:'fixture',SHOPIFY_CLIENT_SECRET:'fixture',SHOPIFY_SHOP:'fixture'});
 Object.assign(o.job,{status:'on_hold',printfulOrderId:1234,printfulExternalId:'rm-existing',holdReason:'Inspect recovered draft',recoveredPrintfulDraftAt:new Date().toISOString()});
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const original=globalThis.fetch;let confirms=0;
 globalThis.fetch=async(url,opts={})=>{
  if(String(url).startsWith('https://api.printful.com/')){if(opts.method!=='GET')confirms++;return Response.json({result:{id:1234,external_id:'rm-existing',store:7,status:'pending'}});}
  throw Error('Shopify temporarily unavailable');
 };
 try{
  assert.equal((await syncPrintfulJobs(o.env)).updated,1);
  const saved=await read(o.env,`jobs/${o.job.id}.json`);
  assert.equal(saved.status,'in_printful_production');assert.ok(saved.sentToProductionAt);assert.ok(saved.productionObservedAt);
  assert.equal(saved.holdReason,undefined);assert.match(saved.shopifyTagError,/could not be updated/);assert.equal(confirms,0);
  const timestamp=saved.sentToProductionAt;await syncPrintfulJobs(o.env);
  assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).sentToProductionAt,timestamp);assert.equal(confirms,0);
 }finally{globalThis.fetch=original}
});

test('supplier identity mismatches never release held jobs',async()=>{
 const o=await orderSetup();o.env.PRINTFUL_API_TOKEN='fixture';
 Object.assign(o.job,{status:'on_hold',printfulOrderId:1234,printfulExternalId:'expected'});
 await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({result:{id:1234,external_id:'wrong',status:'pending'}});
 try{assert.equal((await syncPrintfulJobs(o.env)).updated,0);const j=await read(o.env,`jobs/${o.job.id}.json`);assert.equal(j.status,'on_hold');assert.equal(j.sentToProductionAt,undefined);assert.match(j.lastPrintfulSyncError,/identity mismatch/);}finally{globalThis.fetch=original}
});

test('supplier hold is shown as review, never healthy production',async()=>{
 const o=await orderSetup();o.env.PRINTFUL_API_TOKEN='fixture';Object.assign(o.job,{status:'in_printful_production',printfulOrderId:1234,sentToProductionAt:new Date().toISOString()});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const original=globalThis.fetch;globalThis.fetch=async(url)=>{if(String(url).startsWith('https://api.printful.com/'))return Response.json({result:{id:1234,status:'onhold'}});throw Error('Shopify unavailable')};
 try{await syncPrintfulJobs(o.env);assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).status,'printful_failed')}finally{globalThis.fetch=original}
});

test('Printful-only admin sync requires owner authorization',async()=>{
 const env=await setup({ADMIN_TOKEN:'fixture-admin'});
 const r=await routeWorkflow(new Request('https://recast.test/api/admin/sync-printful',{method:'POST'}),env,{});
 assert.equal(r.status,401);
});


test('scheduled provider reconciliation still runs when Shopify is unavailable',async()=>{
 const o=await orderSetup();Object.assign(o.env,{ORDER_SYNC_ENABLED:'true',PRINTFUL_API_TOKEN:'fixture'});
 Object.assign(o.job,{printfulOrderId:88,status:'on_hold'});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const original=globalThis.fetch;let providerReads=0;
 globalThis.fetch=async(url,opts={})=>{if(String(url)==='https://api.printful.com/orders/88'){assert.equal(opts.method,'GET');providerReads++;return Response.json({result:{id:88,status:'pending'}})}throw Error('Shopify offline')};
 try{await scheduledWorkflow({cron:'*/10 * * * *'},o.env,{});assert.equal(providerReads,1);assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).status,'in_printful_production');const run=await read(o.env,'system/commerce-sync.json');assert.equal(run.orders.ok,false);assert.equal(run.printful.updated,1)}finally{globalThis.fetch=original}
});

test('partial supplier shipments do not fulfill the entire Shopify line',async()=>{
 const o=await orderSetup();o.env.PRINTFUL_API_TOKEN='fixture';Object.assign(o.job,{printfulOrderId:88,sentToProductionAt:new Date().toISOString()});await o.env.ARTWORK.put(`jobs/${o.job.id}.json`,JSON.stringify(o.job));
 const original=globalThis.fetch;let fulfillmentWrites=0;
 globalThis.fetch=async(url,opts={})=>{if(String(url)==='https://api.printful.com/orders/88')return Response.json({result:{id:88,status:'partial',shipments:[{shipped_at:'2026-10-08',tracking_url:'https://tracking.example/1'}]}});if(String(opts.body).includes('RecastCreateFulfillment'))fulfillmentWrites++;throw Error('Shopify offline')};
 try{await syncPrintfulJobs(o.env);assert.equal((await read(o.env,`jobs/${o.job.id}.json`)).status,'partially_shipped');assert.equal(fulfillmentWrites,0)}finally{globalThis.fetch=original}
});

test('supplier sync advances its bounded storage cursor instead of starving later jobs',async()=>{
 const env=await setup({PRINTFUL_API_TOKEN:'fixture'}),cursors=[];
 env.ARTWORK.list=async({cursor})=>{cursors.push(cursor||null);return {objects:[],truncated:!cursor,cursor:cursor?undefined:'next-page'}};
 await syncPrintfulJobs(env);await syncPrintfulJobs(env);await syncPrintfulJobs(env);
 assert.deepEqual(cursors,[null,'next-page',null]);
});
