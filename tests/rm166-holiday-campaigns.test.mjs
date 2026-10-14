import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {holidayDefaults,activeHoliday} from '../public/holiday-schedule.js';
import {holidayOffer,applyHolidayDiscount,holidayRoutes,HOLIDAY_KEY,validateHolidays} from '../src/holiday-campaigns.js';
const at=s=>new Date(s),rows=holidayDefaults();
const envFor=()=>({ARTWORK:new Bucket(),ADMIN_TOKEN:'owner-only'});
const request=(method='GET',body,headers={})=>new Request('https://recast.test/api/admin/holiday-schedule',{method,headers:{authorization:'Bearer owner-only','x-recast-request':'1',...headers},...(body?{body:JSON.stringify(body)}:{})});
test('campaign uses Eastern boundaries and recurs with a 21-day lead',()=>{
 assert.equal(activeHoliday(rows,at('2026-10-10T03:59:59Z')),null);
 assert.equal(activeHoliday(rows,at('2026-10-10T04:00:00Z')).id,'halloween');
 assert.equal(activeHoliday(rows,at('2026-11-01T03:59:59Z')).id,'halloween');
 assert.equal(activeHoliday(rows,at('2026-11-01T04:00:00Z')).id,'christmas');
 assert.equal(activeHoliday(rows,at('2027-10-15T12:00:00Z')).id,'halloween');
});
test('style-qualified invoice offers recur annually and enforce campaign cutoffs',()=>{
 const active={id:'halloween'};
 assert.equal(holidayOffer(active,at('2026-10-13T20:00:00Z')).percent,10);
 assert.equal(holidayOffer(active,at('2026-11-01T04:00:00Z')),null);
 assert.equal(holidayOffer(active,at('2027-10-15T12:00:00Z')).percent,10);
 assert.equal(holidayOffer(null,at('2026-10-15T12:00:00Z')),null);
});
test('annual overrides cross New Year and deterministic priority resolves overlaps',()=>{
 const edited=structuredClone(rows).map(x=>({...x,enabled:false}));
 Object.assign(edited.find(x=>x.id==='christmas'),{enabled:true,start:'10-01',end:'12-25',priority:101});
 assert.equal(activeHoliday(edited,at('2026-10-15T12:00:00Z')).id,'christmas');
 Object.assign(edited.find(x=>x.id==='new-year'),{enabled:true,start:'12-10',end:'01-03',priority:200});
 assert.equal(activeHoliday(edited,at('2026-12-30T12:00:00Z')).id,'new-year');
 assert.equal(activeHoliday(edited,at('2027-01-03T12:00:00Z')).id,'new-year');
 assert.equal(activeHoliday(edited,at('2027-01-04T12:00:00Z')),null);
});
test('checkout discount preserves product, quantity, private proof and attribution',async()=>{
 const original='https://shop.test/cart/123:1?properties=private-proof&ref=recast-me';
 const url=new URL(await applyHolidayDiscount(original,envFor(),at('2026-10-15T12:00:00Z')));
 assert.equal(url.pathname,'/cart/123:1');assert.equal(url.searchParams.get('properties'),'private-proof');assert.equal(url.searchParams.get('ref'),'recast-me');assert.equal(url.searchParams.get('discount'),null);
 assert.equal(await applyHolidayDiscount(original,envFor(),at('2026-11-01T04:00:00Z')),original);
 const unavailable={ARTWORK:{get(){throw Error('unavailable')}}};assert.equal(await applyHolidayDiscount(original,unavailable),original);
});
test('owner schedule is authenticated, same-origin, revision-protected and validated',async()=>{
 const env=envFor();
 assert.equal((await holidayRoutes(request('GET',null,{authorization:'Bearer nope'}),env)).status,401);
 assert.equal((await holidayRoutes(request('POST',{revision:0,rows},{origin:'https://evil.test'}),env)).status,403);
 const good=await holidayRoutes(request('POST',{revision:0,rows}),env);assert.equal(good.status,200);assert.match(good.headers.get('cache-control'),/no-store/);
 assert.equal((await holidayRoutes(request('POST',{revision:0,rows}),env)).status,409);
 const invalid=structuredClone(rows);invalid[0].start='02-30';assert.throws(()=>validateHolidays(invalid));
 invalid[0].start='01-01';invalid[0].priority=-1;assert.throws(()=>validateHolidays(invalid));
 const stored=await env.ARTWORK.get(HOLIDAY_KEY);assert.equal((await stored.json()).revision,1);
});
test('public campaign does not expose owner schedule, token or storage metadata',async()=>{
 const response=await holidayRoutes(new Request('https://recast.test/api/seasonal-campaign'),envFor());
 assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/owner-only|revision|rows|updatedAt/);
});

test('public catalog returns only active mapped products and excludes internal costs',async()=>{
 const {default:router}=await import('../src/router.js');
 const {setup}=await import('./security-helpers.mjs');const original=globalThis.fetch;
 globalThis.fetch=async(url)=>String(url).includes('/oauth/')?Response.json({access_token:'test-only',expires_in:3600}):Response.json({data:{products:{nodes:[
  {title:'Custom Recast Mug',status:'ACTIVE',variants:{nodes:[{sku:'RECAST-MUG-11OZ',price:'24.99'},{sku:'RECAST-MUG-15OZ',price:'29.99'}]}},
  {title:'Draft Hoodie',status:'DRAFT',variants:{nodes:[{sku:'RECAST-HOODIE-S',price:'59.99'}]}},
  {title:'Unmapped',status:'ACTIVE',variants:{nodes:[{sku:'UNMAPPED',price:'10.00'}]}}
 ]}}});
 try{
  const env=await setup({SHOPIFY_SHOP:'test',SHOPIFY_CLIENT_ID:'test',SHOPIFY_CLIENT_SECRET:'test'});
  const response=await router.fetch(new Request('https://recast.test/api/seasonal-products'),env,{});
  const result=await response.json();assert.deepEqual(result.products,[{name:'Mug',price:24.99,sku:'RECAST-MUG-11OZ'}]);assert.doesNotMatch(JSON.stringify(result),/baseCost|margin|token|test-only/);
 }finally{globalThis.fetch=original;}
});
