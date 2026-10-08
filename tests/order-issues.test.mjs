import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,ID} from './security-helpers.mjs';
import {read} from '../src/commerce-store.js';
import {reconcileShopifyOrder,routeWorkflow,syncPaidOrders} from '../src/workflow.js';
import {listOrderIssues,orderRecoveryAdvice} from '../src/order-issues.js';
import {FULFILLMENT} from '../src/entry.js';
const sku=Object.keys(FULFILLMENT).find(k=>!FULFILLMENT[k].digital);
const line={id:'gid://shopify/LineItem/456',sku,quantity:1,customAttributes:[{key:'Artwork ID',value:ID}]};
const order={id:'gid://shopify/Order/123',name:'#1001',displayFinancialStatus:'PAID',test:false,cancelledAt:null,createdAt:'2026-10-08T00:00:00Z',updatedAt:'2026-10-08T00:00:00Z',lineItems:{nodes:[line],pageInfo:{hasNextPage:false}}};
function withLine(patch){return {...order,lineItems:{...order.lineItems,nodes:[{...line,...patch}]}}}
function request(path,auth=true,method='GET'){return new Request('https://recast.test'+path,{method,headers:{'x-recast-request':'1',...(auth?{authorization:'Bearer owner-test-secret'}:{})}})}
async function shopify(env,orders,run){
 Object.assign(env,{SHOPIFY_CLIENT_ID:'fixture',SHOPIFY_CLIENT_SECRET:'fixture',SHOPIFY_SHOP:'fixture'});
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,options)=>{
  assert.match(String(url),/myshopify\.com/);calls++;
  if(String(url).includes('access_token'))return Response.json({access_token:'fixture',expires_in:3600});
  const body=JSON.parse(options.body);assert.match(body.query,/^query /);
  return Response.json({data:body.query.includes('RecastOrderChanges')?{orders:{nodes:orders,pageInfo:{hasNextPage:false,endCursor:null}}}:{order:orders[0]}});
 };
 try{await run(()=>calls)}finally{globalThis.fetch=original}
}
test('each skipped-order reason becomes one durable issue across repeated syncs',async()=>{
 for(const [patch,code] of [[{sku:'UNKNOWN'},'product_mapping_missing'],[{customAttributes:[]},'artwork_reference_missing'],[{customAttributes:[{key:'Artwork ID',value:'invalid'}]},'artwork_reference_invalid'],[{customAttributes:[{key:'Artwork ID',value:'RC-MISSING00-ABCDEF'}]},'artwork_missing']]){
  const env=await setup();await reconcileShopifyOrder(env,withLine(patch));await reconcileShopifyOrder(env,withLine(patch));
  const {issues}=await listOrderIssues(env);assert.equal(issues.length,1);assert.equal(issues[0].code,code);assert.equal(issues[0].occurrences,2);assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,0);
  assert.equal(JSON.stringify(issues).includes('customer-test-token'),false);
 }
});
test('oversize order is visible and does not block the next paid order',async()=>{
 const env=await setup();const large={...order,lineItems:{...order.lineItems,pageInfo:{hasNextPage:true}}};
 await shopify(env,[large,{...order,id:'gid://shopify/Order/124'}],async()=>{const result=await syncPaidOrders(env);assert.equal(result.issues,1);assert.equal(result.created,1);});
 assert.equal((await listOrderIssues(env)).issues[0].code,'order_review');
});
test('fixed issue creates a held job once and preserves existing provider identity on repeated recovery',async()=>{
 const env=await setup({AUTO_PRINT_PREAPPROVED_ENABLED:'true'});await reconcileShopifyOrder(env,withLine({customAttributes:[]}));
 await reconcileShopifyOrder(env,order);let job=await read(env,'jobs/123-456.json');assert.equal(job.status,'on_hold');assert.equal((await listOrderIssues(env)).issues[0].status,'resolved');
 job.printfulOrderId=1234;await env.ARTWORK.put('jobs/123-456.json',JSON.stringify(job));
 await reconcileShopifyOrder(env,order,{allowAutomation:false,holdNewJobs:true});assert.equal((await read(env,'jobs/123-456.json')).printfulOrderId,1234);
});
test('issue list and recheck require admin; recheck reads Shopify without provider calls',async()=>{
 const env=await setup();await reconcileShopifyOrder(env,withLine({customAttributes:[]}));const issue=(await listOrderIssues(env)).issues[0];
 for(const [path,method] of [['/api/admin/order-issues','GET'],['/api/admin/audit-orders','POST'],[`/api/admin/order-issue/${issue.id}/recheck`,'POST']])assert.equal((await routeWorkflow(request(path,false,method),env)).status,401);
 await shopify(env,[order],async()=>{
  const response=await routeWorkflow(request(`/api/admin/order-issue/${issue.id}/recheck`,true,'POST'),env);assert.equal(response.status,200);const body=await response.json();assert.equal(body.productionSubmitted,false);assert.equal(body.issue.status,'resolved');assert.equal((await read(env,'jobs/123-456.json')).status,'on_hold');
 });
});
test('30-day audit uses its own cursor and holds recovered jobs even with legacy production tag',async()=>{
 const env=await setup();await env.ARTWORK.put('system/order-sync-cursor.json',JSON.stringify({since:'2026-10-08T00:00:00Z',cursor:null}));
 const before=await read(env,'system/order-sync-cursor.json');
 await shopify(env,[{...order,tags:['RECAST_SEND_PRODUCTION']}],async()=>{await syncPaidOrders(env,{audit:true});await reconcileShopifyOrder(env,{...order,tags:['RECAST_SEND_PRODUCTION']});});
 assert.deepEqual(await read(env,'system/order-sync-cursor.json'),before);assert.equal((await read(env,'jobs/123-456.json')).status,'on_hold');
});
test('issue persistence failure prevents sync from advancing past a lost order',async()=>{
 const env=await setup();const put=env.ARTWORK.put.bind(env.ARTWORK);env.ARTWORK.put=async(key,...args)=>{if(key.startsWith('commerce/order-issues/'))throw Error('storage unavailable');return put(key,...args)};
 await shopify(env,[withLine({customAttributes:[]})],async()=>{await assert.rejects(syncPaidOrders(env),/storage unavailable/)});assert.equal(await read(env,'system/order-sync-cursor.json'),null);
});
test('recovery guidance separates provider payment holds from Shopify tracking failures',()=>{
 const advice=orderRecoveryAdvice({status:'printful_failed',shopifyFulfillmentError:'denied'}).join(' ');assert.match(advice,/existing Printful order/);assert.match(advice,/Do not resubmit production/);
});

test('scheduled audit runs daily, skips a completed recent pass, and resumes unfinished pages',async()=>{
 const {auditRecentOrdersIfDue}=await import('../src/workflow.js');const env=await setup();
 await shopify(env,[order],async calls=>{await auditRecentOrdersIfDue(env);const before=calls();assert.equal((await auditRecentOrdersIfDue(env)).skipped,true);assert.equal(calls(),before);
 await env.ARTWORK.put('system/order-audit-cursor.json',JSON.stringify({since:order.createdAt,until:new Date().toISOString(),cursor:'next-page'}));await auditRecentOrdersIfDue(env);assert.ok(calls()>before);});
 assert.equal((await read(env,'jobs/123-456.json')).status,'on_hold');
});
