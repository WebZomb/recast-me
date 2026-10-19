import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,ID} from './security-helpers.mjs';
import {read} from '../src/commerce-store.js';
import {reconcileShopifyOrder} from '../src/workflow.js';
import {listOrderIssues} from '../src/order-issues.js';
import {FULFILLMENT} from '../src/entry.js';

const sku=Object.keys(FULFILLMENT).find(k=>!FULFILLMENT[k].digital);
const line=n=>({id:`gid://shopify/LineItem/${n}`,sku,quantity:1,customAttributes:[{key:'Artwork ID',value:ID}]});
const order={id:'gid://shopify/Order/123',name:'#1001',displayFinancialStatus:'PAID',test:false,cancelledAt:null,createdAt:'2026-10-17T00:00:00Z',lineItems:{nodes:[line(456),line(457)],pageInfo:{hasNextPage:false}}};
const legacyId=`${order.name}-${ID}-${sku}`.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,180);
const legacyKey=`jobs/${legacyId}.json`;
const legacy=(patch={})=>({id:legacyId,orderId:order.id,lineId:line(456).id,requestId:ID,sku,quantity:1,status:'in_printful_production',printfulOrderId:9001,printfulExternalId:'fixture-accepted',sentToProductionAt:'2026-10-17T01:00:00Z',...patch});
async function seed(env,key,value){await env.ARTWORK.put(key,JSON.stringify(value));}
const safe={allowAutomation:false,holdNewJobs:true};

test('two same-artwork/SKU lines and repeated ingestion keep distinct canonical jobs',async()=>{
 const env=await setup();
 const first=await reconcileShopifyOrder(env,order,safe);assert.equal(first.created,2);
 assert.equal((await reconcileShopifyOrder(env,order,safe)).created,0);
 for(const n of [456,457])assert.equal((await read(env,`jobs/123-${n}.json`)).lineId,line(n).id);
});

test('legacy job belongs only to its exact line; another same-artwork/SKU line gets its own held job',async()=>{
 const env=await setup();const prior=legacy();await seed(env,legacyKey,prior);
 const result=await reconcileShopifyOrder(env,order,safe);
 assert.equal(result.created,1);assert.equal(result.issues,0);
 assert.deepEqual(await read(env,legacyKey),prior);
 assert.equal(await read(env,'jobs/123-456.json'),null);
 const next=await read(env,'jobs/123-457.json');assert.equal(next.lineId,line(457).id);assert.equal(next.status,'on_hold');assert.equal(next.printfulOrderId,undefined);
 assert.equal((await reconcileShopifyOrder(env,order,safe)).created,0);
});

test('legacy job without line identity holds both ambiguous lines instead of collapsing or duplicating them',async()=>{
 const env=await setup();const prior=legacy({lineId:null});await seed(env,legacyKey,prior);
 for(let i=0;i<2;i++){
  const result=await reconcileShopifyOrder(env,order,safe);assert.equal(result.created,0);assert.equal(result.issues,2);
 }
 assert.deepEqual(await read(env,legacyKey),prior);assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,1);
 const {issues}=await listOrderIssues(env);assert.equal(issues.length,2);assert.ok(issues.every(i=>i.code==='job_identity_review'&&i.status==='open'));
});

test('unambiguous old single-line job remains compatible and retains supplier locks',async()=>{
 const env=await setup();const prior=legacy({lineId:null});await seed(env,legacyKey,prior);
 const result=await reconcileShopifyOrder(env,{...order,lineItems:{...order.lineItems,nodes:[line(456)]}},safe);
 assert.equal(result.created,0);assert.equal(result.issues,0);assert.deepEqual(await read(env,legacyKey),prior);
});

test('conflicting legacy order identity is held without creating a replacement',async()=>{
 const env=await setup();const prior=legacy({orderId:'gid://shopify/Order/999'});await seed(env,legacyKey,prior);
 const result=await reconcileShopifyOrder(env,order,safe);assert.equal(result.created,0);assert.equal(result.issues,2);assert.deepEqual(await read(env,legacyKey),prior);
});

test('canonical and legacy copies for one line require review, not automatic processing',async()=>{
 const env=await setup();await seed(env,legacyKey,legacy());const copy=legacy({id:'123-456',printfulOrderId:9002});await seed(env,'jobs/123-456.json',copy);
 const result=await reconcileShopifyOrder(env,{...order,lineItems:{...order.lineItems,nodes:[line(456)]}},safe);
 assert.equal(result.created,0);assert.equal(result.issues,1);assert.deepEqual(await read(env,'jobs/123-456.json'),copy);
});

test('refund cannot mutate a legacy job whose line binding is ambiguous',async()=>{
 const env=await setup();const prior=legacy({lineId:null});await seed(env,legacyKey,prior);
 const result=await reconcileShopifyOrder(env,{...order,displayFinancialStatus:'REFUNDED'},safe);
 assert.equal(result.issues,2);assert.deepEqual(await read(env,legacyKey),prior);
});

test('canonical identity mismatch and unreadable legacy storage fail closed',async()=>{
 const env=await setup();const prior=legacy({id:'123-456',lineId:line(999).id});await seed(env,'jobs/123-456.json',prior);
 assert.equal((await reconcileShopifyOrder(env,{...order,lineItems:{...order.lineItems,nodes:[line(456)]}},safe)).issues,1);
 assert.deepEqual(await read(env,'jobs/123-456.json'),prior);
 const broken=await setup();const get=broken.ARTWORK.get.bind(broken.ARTWORK);broken.ARTWORK.get=async key=>{if(key===legacyKey)throw Error('fixture storage failure');return get(key);};
 await assert.rejects(reconcileShopifyOrder(broken,order,safe),/fixture storage failure/);
 assert.equal((await broken.ARTWORK.list({prefix:'jobs/'})).objects.length,0);
});

test('corrupt occupied legacy record never becomes a new supplier job',async()=>{
 for(const raw of ['not-json','null','false','[]']){
  const env=await setup();await env.ARTWORK.put(legacyKey,raw);
  const result=await reconcileShopifyOrder(env,order,safe);assert.equal(result.created,0);assert.equal(result.issues,2);
  assert.equal(await (await env.ARTWORK.get(legacyKey)).text(),raw);
  assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,1);
 }
});

test('parallel ingestion claims each canonical line once without provider calls',async()=>{
 const env=await setup();const results=await Promise.all(Array.from({length:5},()=>reconcileShopifyOrder(env,order,safe)));
 assert.equal(results.reduce((n,r)=>n+r.created,0),2);
 assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,2);
});

test('same variant with different artworks preserves each line and its artwork',async()=>{
 const env=await setup(),other='RC-TEST0002-ABCDEF';
 await seed(env,`requests/${other}/request.json`,{requestId:other});
 const second={...line(457),customAttributes:[{key:'Artwork ID',value:other}]};
 await reconcileShopifyOrder(env,{...order,lineItems:{...order.lineItems,nodes:[line(456),second]}},safe);
 assert.equal((await read(env,'jobs/123-456.json')).requestId,ID);
 assert.equal((await read(env,'jobs/123-457.json')).requestId,other);
});

test('identity review with automation enabled and release tag makes no network request',async()=>{
 const env=await setup({AUTO_PRINT_PREAPPROVED_ENABLED:'true'});await seed(env,legacyKey,legacy({lineId:null,status:'design_confirmed'}));
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('unexpected provider request')};
 try{
  const result=await reconcileShopifyOrder(env,{...order,tags:['RECAST_SEND_PRODUCTION']});
  assert.equal(result.issues,2);assert.equal(calls,0);
 }finally{globalThis.fetch=original}
});
