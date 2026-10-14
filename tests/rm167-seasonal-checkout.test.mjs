import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {holidayOffer,eligibleSeasonalArtwork,applyHolidayDiscount} from '../src/holiday-campaigns.js';
import {createSeasonalCheckout,expireSeasonalCheckouts} from '../src/seasonal-checkout.js';
import {activeHoliday,holidayDefaults} from '../public/holiday-schedule.js';
const at=s=>new Date(s),clock=at('2026-10-15T12:00:00Z');
const offer=holidayOffer({id:'halloween'},clock);
const envFor=()=>({ARTWORK:new Bucket(),SHOPIFY_SHOP:'recast-test',SHOPIFY_CLIENT_ID:'test-only',SHOPIFY_CLIENT_SECRET:'test-only'});
test('only saved matching style qualifies, no code appears in offer metadata',()=>{
 assert.equal(eligibleSeasonalArtwork({styleId:'halloween'},offer),true);
 for(const art of [{styleId:'christmas'},{styleId:'original'},{styleName:'Halloween'},{style:'halloween'},null])assert.equal(eligibleSeasonalArtwork(art,offer),false);
 assert.equal('code' in offer,false);
 assert.equal(holidayOffer({id:'halloween'},at('2026-11-01T04:00:00Z')),null);
 assert.equal(holidayOffer({id:'christmas'},at('2026-12-26T05:00:00Z')),null);
});
test('annual sequence switches on Eastern midnight and gives family days priority',()=>{
 const rows=holidayDefaults();
 for(const [date,id] of [['2026-11-01T04:00:00Z','christmas'],['2026-12-26T05:00:00Z','new-year'],['2027-01-08T05:00:00Z','valentine'],['2027-03-20T12:00:00Z','easter'],['2027-05-02T12:00:00Z','mothers-day'],['2027-06-10T12:00:00Z','fathers-day'],['2027-07-10T12:00:00Z','beach-days']])assert.equal(activeHoliday(rows,at(date)).id,id,date);
});
test('fixed discounted checkout preserves exact approval and is reused without creating another draft',async()=>{
 const original=globalThis.fetch,calls=[];const env=envFor();
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('/oauth/'))return Response.json({access_token:'mock-token',expires_in:3600});
  const req=JSON.parse(opts.body);calls.push(req);return Response.json({data:{draftOrderCreate:{draftOrder:{id:'gid://shopify/DraftOrder/123',invoiceUrl:'https://shop.test/invoices/fixed'},userErrors:[]}}});
 };
 try{const input={offer,variantId:'gid://shopify/ProductVariant/42',properties:{'Artwork ID':'RC-SAVED','_Recast Proof':'verified','_Recast Design':'exact'},requestId:'RC-SAVED',now:clock};
 assert.equal(await createSeasonalCheckout(env,input),'https://shop.test/invoices/fixed');await createSeasonalCheckout(env,input);assert.equal(calls.length,1);
 const data=calls[0].variables.input;assert.equal(data.allowDiscountCodesInCheckout,false);assert.equal(data.acceptAutomaticDiscounts,false);assert.equal(data.lineItems[0].variantId,input.variantId);assert.equal(data.lineItems[0].quantity,1);assert.equal(data.lineItems[0].appliedDiscount.value,10);assert.deepEqual(data.lineItems[0].customAttributes,input.properties&&Object.entries(input.properties).map(([key,value])=>({key,value})));
 await assert.rejects(()=>createSeasonalCheckout(env,{...input,now:at(offer.endsAt)}),/ended/);
 }finally{globalThis.fetch=original;}
});
test('wrong-style checkout never creates draft or adds a coupon even with forged client fields',async()=>{
 const original=globalThis.fetch,env=envFor();let creates=0;
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('/oauth/'))return Response.json({access_token:'mock-token',expires_in:3600});const req=JSON.parse(opts.body);if(req.query.includes('draftOrderCreate'))creates++;return Response.json({data:{currentAppInstallation:{accessScopes:[{handle:'write_draft_orders'}]}}});};
 try{const url='https://shop.test/cart/42:1?properties=proof';assert.equal(await applyHolidayDiscount(url,env,clock,{artwork:{styleId:'royal'},style:'halloween'}),url);assert.equal(creates,0);}finally{globalThis.fetch=original;}
});
test('expired invoice cleanup deletes unpaid drafts only, never paid orders',async()=>{
 const original=globalThis.fetch,env=envFor(),deleted=[];
 const rows=[{id:'gid://shopify/DraftOrder/1',key:'record1',expiresAt:offer.endsAt},{id:'gid://shopify/DraftOrder/2',key:'record2',expiresAt:offer.endsAt}];
 for(const row of rows)await env.ARTWORK.put('commerce/seasonal-expiry/'+row.id.split('/').pop(),JSON.stringify(row));
 env.ARTWORK.list=async()=>({objects:rows.map(row=>({key:'commerce/seasonal-expiry/'+row.id.split('/').pop()}))});
 globalThis.fetch=async(url,opts)=>{if(String(url).includes('/oauth/'))return Response.json({access_token:'mock-token',expires_in:3600});const req=JSON.parse(opts.body);if(req.query.includes('draftOrderDelete')){deleted.push(req.variables.input.id);return Response.json({data:{draftOrderDelete:{deletedId:req.variables.input.id,userErrors:[]}}});}return Response.json({data:{draftOrder:{id:req.variables.id,status:req.variables.id.endsWith('/1')?'OPEN':'COMPLETED'}}});};
 try{await expireSeasonalCheckouts(env,at('2026-11-01T04:00:00Z'));assert.deepEqual(deleted,['gid://shopify/DraftOrder/1']);}finally{globalThis.fetch=original;}
});
