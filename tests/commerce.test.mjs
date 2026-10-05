import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket,CLEAN,ID,TOKEN,setup,imageMock,fakeApplication,submission,MARKED} from './security-helpers.mjs';
import {creditRoute,walletFor,bindCustomerCredits,creditBalance,reserveCustomerRender,settleCustomerRender,reconcileOrderCredits,orderEligible} from '../src/render-credits.js';
import {reserveBudget,guardedEnvironment} from '../src/render-controls.js';
import {hash,read} from '../src/commerce-store.js';
import {customerDesignAction,designFor,approvedDesign,finishApprovedDesign,printDesignFile} from '../src/order-approval.js';
import {reconcileShopifyOrder,verifyPaidOrder,adminJobAction,routeWorkflow,customerOrderStatus} from '../src/workflow.js';
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
test('a purchase grants five once across duplicate syncs and multiple candidate wallets',async()=>{
 const a=await walletSetup(),b=await walletSetup('192.0.2.2',a.env);
 await Promise.all(Array.from({length:10},(_,i)=>reconcileOrderCredits(a.env,paid,i%2?a.wallet.id:b.wallet.id)));
 assert.equal((await creditBalance(a.env,a.wallet)).bonus+(await creditBalance(a.env,b.wallet)).bonus,5);
 const state=await read(a.env,`commerce/orders/${await hash(paid.id)}.json`);assert.ok([a.wallet.id,b.wallet.id].includes(state.walletId));
});
test('refunds revoke unspent bonus credits and late paid events cannot regrant them',async()=>{
 const {env,wallet}=await walletSetup();await reconcileOrderCredits(env,paid,wallet.id);
 for(let i=0;i<4;i++)await reserveCustomerRender({...env,RECAST_CREDIT_WALLET:wallet});
 assert.equal((await creditBalance(env,wallet)).bonus,4);
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
 assert.ok(operations.some(([name,args])=>name==='transform'&&args.blur===250));
 assert.ok(operations.some(([name,args])=>name==='draw'&&args.opacity===0.16));
 assert.ok(!operations.some(([name,args])=>name==='transform'&&args.blur===22));
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
 const design={version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:110,spacing:'close'};
 const previewToken='a'.repeat(48),proof='proof-hash',mockup='v3-two-sided-scene-fill-center-110-close';
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
 const design={version:3,layout:'two-sided',background:'scene-fill',x:'center',scale:110,spacing:'standard'};
 const proofHash=await hash(CLEAN.toString('base64')+'|'+JSON.stringify(design));
 const sourceHash=await hash(CLEAN.toString('base64'));
 const token='b'.repeat(48),mockup='v3-two-sided-scene-fill-center-110-standard';
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
 const original=globalThis.fetch;let drafts=0,confirmations=0;
 globalThis.fetch=async(url,options={})=>{
  const path=String(url);
  if(path.includes('access_token'))return Response.json({access_token:'fixture-token',expires_in:3600});
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
  const approved=await approvedDesign(env,job);assert.equal(approved.preapprovedAt,'2026-10-05T17:00:00Z');assert.equal(approved.proof.design.scale,110);
 }finally{globalThis.fetch=original}
});

test('Shopify reconciliation creates one job per line, awards once, and revokes refunded entitlements',async()=>{
 const {env,wallet}=await walletSetup('192.0.2.1',await setup());
 const meta=await read(env,`requests/${ID}/request.json`);meta.creditWalletId=wallet.id;await env.ARTWORK.put(`requests/${ID}/request.json`,JSON.stringify(meta));
 const order={...paid,lineItems:{pageInfo:{hasNextPage:false},nodes:[{id:'gid://shopify/LineItem/456',sku,quantity:1,customAttributes:[{key:'Artwork ID',value:ID}]}]}};
 await reconcileShopifyOrder(env,order);await reconcileShopifyOrder(env,order);
 assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,1);assert.equal((await creditBalance(env,wallet)).bonus,5);
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
  if(path==='https://api.printful.com/orders'){drafts++;const b=JSON.parse(options.body);assert.deepEqual(b.items[0].files[0].position,{area_width:1800,area_height:2400,width:1800,height:2250,left:0,top:75});assert.match(b.items[0].files[0].url,/\/api\/order-print\//);assert.ok(!b.items[0].files[0].url.includes('/api/print-source/'));return Response.json({result:{id:999,status:'draft'}})}
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
test('Standard has one independent shared-network slot, failure refund and 24-hour reset',async()=>{
 const {env,wallet}=await walletSetup();const bound={...env,RECAST_CREDIT_WALLET:wallet,RECAST_RENDER_MODE:'quick'},now=Date.now();
 const results=await Promise.allSettled(Array.from({length:5},()=>reserveCustomerRender(bound,now)));
 const accepted=results.filter(r=>r.status==='fulfilled');assert.equal(accepted.length,1);
 assert.equal((await creditBalance(env,wallet,now)).remaining,3);
 assert.equal((await creditBalance(env,wallet,now)).standardRemaining,0);
 await settleCustomerRender(env,accepted[0].value,false);
 assert.equal((await creditBalance(env,wallet,now)).standardRemaining,1);
 await reserveCustomerRender(bound,now);
 assert.equal((await creditBalance(env,wallet,now+86400000)).standardRemaining,1);
});
