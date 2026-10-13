import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkoutCandidates,rememberCheckoutStarted,verifiedOrders,confirmOrderBonus,orderLink} from '../public/order-experience.js';

function browser() {
  const values=new Map();
  globalThis.localStorage={
    getItem:key=>values.get(key)??null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
  return values;
}
const artwork={requestId:'RC-TEST9-AB12',accessToken:'this-is-a-private-access-token-98765'};
const reply=(body,ok=true)=>({ok,json:async()=>body});

test('checkout pointers preserve private artwork linkage, deduplicate and bound history',()=>{
  browser();
  assert.equal(rememberCheckoutStarted({requestId:'RC-TEST',accessToken:'short'}),false);
  assert.equal(rememberCheckoutStarted(artwork),true);
  assert.equal(rememberCheckoutStarted(artwork),true);
  assert.equal(checkoutCandidates().length,1);
  assert.match(orderLink(artwork),/^\/order\.html\?requestId=RC-TEST9-AB12&token=/);
  assert.ok(!orderLink(artwork).startsWith('//'));
  for(let i=0;i<40;i++)rememberCheckoutStarted({requestId:'RC-EXTRA-'+i,accessToken:artwork.accessToken});
  assert.equal(checkoutCandidates().length,20);
});

test('preexisting recent browser versions can recover a paid checkout after the app update',()=>{
  browser();
  localStorage.setItem('recast_recent_versions_v12',JSON.stringify([artwork]));
  assert.equal(checkoutCandidates()[0].requestId,artwork.requestId);
});

test('frontend never calls a purchase confirmed until the protected backend says paid',async()=>{
  browser();
  rememberCheckoutStarted(artwork);
  const hits=[];
  globalThis.fetch=async(url)=>{hits.push(url);return reply({ok:true,request:{paid:false,orderName:'#1003'},jobs:[{id:'job',orderName:'#1003',product:'Mug'}]})};
  assert.deepEqual(await verifiedOrders(),[]);
  assert.ok(hits[0].startsWith('/api/order-status?'));
  assert.equal(hits.some(url=>url.includes('/api/order-bonus/')),false);
});

test('verified orders use backend payment and preserve private order tracking',async()=>{
  browser();
  rememberCheckoutStarted(artwork);
  globalThis.fetch=async()=>reply({ok:true,creditsEnabled:true,request:{paid:true,orderName:'#1003'},jobs:[
    {id:'job-a',orderName:'#1003',product:'Mug',createdAt:'2026-10-13T00:15:00Z',trackingUrl:null,status:'design_confirmed'}
  ]});
  const orders=await verifiedOrders();
  assert.equal(orders.length,1);
  assert.equal(orders[0].orderName,'#1003');
  assert.equal(orders[0].jobs[0].status,'design_confirmed');
  assert.ok(localStorage.getItem('recast_checkout_records_v1').includes('confirmedAt'));
});

test('bonus is requested only for a paid verified job, through the existing server gate',async()=>{
  browser();
  const calls=[];
  globalThis.fetch=async(url,options={})=>{
    calls.push({url,options});
    return url==='/api/render-credits'?reply({ok:true,initialized:true}):reply({ok:true,bonus:3});
  };
  const result=await confirmOrderBonus({...artwork,creditsEnabled:true,jobs:[{id:'job-a'}]});
  assert.equal(result.bonus,3);
  assert.match(result.message,/\+3 High Quality renders added/);
  assert.equal(calls[1].url,'/api/order-bonus/job-a');
  assert.equal(calls[1].options.method,'POST');
  assert.equal(JSON.parse(calls[1].options.body).token,artwork.accessToken);
});

test('button feedback, tracking and art collage keep confirmation and a reduced-motion option',()=>{
  const markup=fs.readFileSync('public/index.html','utf8');
  const app=fs.readFileSync('public/app.js','utf8');
  const checkout=fs.readFileSync('public/checkout.js','utf8');
  const style=fs.readFileSync('public/order-experience.css','utf8');
  const orders=fs.readFileSync('public/my-orders.html','utf8');
  assert.match(markup,/recast-discover-cinematic-v160\.webp/);
  assert.match(markup,/recast-surprise-cinematic-v160\.webp/);
  assert.match(markup,/href="\/my-orders.html"/);
  assert.match(app,/Saved to My Recasts on this iPhone/);
  assert.match(app,/initCheckoutReturnExperience/);
  assert.match(checkout,/rememberCheckoutStarted\(req\)/);
  assert.equal((checkout.match(/leaveForCheckout\(req,(?:result|data).checkoutUrl\)/g)||[]).length,3);
  assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(orders,/robots" content="noindex,nofollow"/);
});

test('an already-claimed eligible order never falsely announces three new credits',async()=>{
 browser();
 globalThis.fetch=async url=>url==='/api/render-credits'?reply({ok:true,initialized:true,bonus:3}):reply({ok:true,bonus:3});
 const result=await confirmOrderBonus({...artwork,creditsEnabled:true,jobs:[{id:'job-a'}]});
 assert.equal(result.added,0);
 assert.match(result.message,/already applied/);
 assert.doesNotMatch(result.message,/\+3/);
});
