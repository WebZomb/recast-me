import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {currentCampaign,applyHolidayDiscount,holidayOffer} from '../src/holiday-campaigns.js';
import {seasonalCheckoutReady,createSeasonalCheckout} from '../src/seasonal-checkout.js';
const now=new Date('2026-10-15T12:00:00Z');
const envFor=()=>({ARTWORK:new Bucket(),SHOPIFY_SHOP:'pause-test',SHOPIFY_CLIENT_ID:'test-only',SHOPIFY_CLIENT_SECRET:'test-only'});
test('paused or missing flag preserves gifting calendar and regular checkout without provider calls',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('No Shopify calls while paused');};
 try{for(const flag of [undefined,'false','TRUE','1',true]){
  const env={...envFor(),SEASONAL_DISCOUNTS_ENABLED:flag};
  const campaign=await currentCampaign(env,now);
  assert.equal(campaign.active.id,'halloween');assert.equal(campaign.offer,null);
  assert.equal(campaign.checkoutReady,false);assert.equal(campaign.promotionsEnabled,false);
  const url='https://shop.test/cart/42:1?properties=exact-proof&ref=recast-me';
  assert.equal(await applyHolidayDiscount(url,env,now,{artwork:{styleId:'halloween'}}),url);
  await assert.rejects(()=>createSeasonalCheckout(env,{offer:holidayOffer(campaign.active,now),now}),error=>error.code==='offer_paused'||/paused/.test(error.message));
  assert.equal(env.ARTWORK.objects.size,0);
 }assert.equal(calls,0);}finally{globalThis.fetch=original;}
});
test('pause overrides a cached successful draft-order permission check',async()=>{
 const original=globalThis.fetch,env={...envFor(),SEASONAL_DISCOUNTS_ENABLED:'true'};let calls=0;
 globalThis.fetch=async(url)=>{calls++;return String(url).includes('/oauth/')?Response.json({access_token:'mock-only',expires_in:3600}):Response.json({data:{currentAppInstallation:{accessScopes:[{handle:'write_draft_orders'}]}}});};
 try{
  assert.equal(await seasonalCheckoutReady(env),true);
  assert.equal((await currentCampaign(env,now)).offer.percent,10);
  const before=calls;env.SEASONAL_DISCOUNTS_ENABLED='false';
  assert.equal(await seasonalCheckoutReady(env),false);
  assert.equal((await currentCampaign(env,now)).offer,null);assert.equal(calls,before);
 }finally{globalThis.fetch=original;}
});
