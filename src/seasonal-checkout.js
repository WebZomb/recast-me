// Fixed Shopify invoice lines: no reusable coupon or editable cart discount.
import {shopifyGraphQL} from './index.js';
import {read,hash,fault} from './commerce-store.js';
const cache=new WeakMap();
// Owner paused promotions. Missing configuration must never enable a discount.
export function seasonalDiscountsEnabled(env){return env.SEASONAL_DISCOUNTS_ENABLED==='true';}
export async function seasonalCheckoutReady(env){
 if(!seasonalDiscountsEnabled(env))return false;
 if(!env.SHOPIFY_CLIENT_ID||!env.SHOPIFY_CLIENT_SECRET)return false;
 const prior=cache.get(env);if(prior&&prior.until>Date.now())return prior.ready;
 try{const data=await shopifyGraphQL(env,'query RecastPromotionScopes { currentAppInstallation { accessScopes { handle } } }');
 const ready=data.currentAppInstallation?.accessScopes?.some(x=>x.handle==='write_draft_orders')===true;
 cache.set(env,{ready,until:Date.now()+60000});return ready;
 }catch{return false}
}
export async function createSeasonalCheckout(env,{offer,variantId,properties,requestId,now=new Date()}){
 if(!seasonalDiscountsEnabled(env))throw fault('offer_paused','Seasonal discounts are paused. Refresh to continue at the regular price.',409);
 if(!offer||+now>=Date.parse(offer.endsAt))throw fault('offer_expired','This seasonal offer has ended. Refresh before checkout.',409);
 const key='commerce/seasonal-checkouts/'+await hash(JSON.stringify([requestId,variantId,properties,offer.id,offer.endsAt]))+'.json';
 const prior=await read(env,key);if(prior?.url&&Date.parse(prior.expiresAt)>+now)return prior.url;
 // Once creation may have reached Shopify, never silently retry an ambiguous result.
 if(prior?.pending)throw fault('checkout_pending','Your checkout is being prepared. Please try again shortly or contact support.',409);
 await env.ARTWORK.put(key,JSON.stringify({pending:true,createdAt:now.toISOString()}));
 let data;
 try{data=await shopifyGraphQL(env,`mutation RecastSeasonalCheckout($input: DraftOrderInput!) { draftOrderCreate(input:$input) { draftOrder { id invoiceUrl } userErrors { field message } } }`,{input:{
  lineItems:[{variantId,quantity:1,customAttributes:Object.entries(properties).map(([key,value])=>({key,value:String(value)})),appliedDiscount:{title:offer.name+' photo gift · 10% off',description:'Matching seasonal artwork offer',value:10,valueType:'PERCENTAGE'}}],
  allowDiscountCodesInCheckout:false,acceptAutomaticDiscounts:false,tags:['recast-seasonal-checkout',offer.id]
 }});}catch{throw fault('checkout_unavailable','We could not confirm your discounted checkout. Your artwork is saved; please contact support before retrying.',503)}
 const result=data.draftOrderCreate;
 if(result?.userErrors?.length||!result?.draftOrder?.invoiceUrl){await env.ARTWORK.delete(key);throw fault('checkout_unavailable','Your discounted checkout could not be prepared. Please try again shortly.',503)}
 const draft=result.draftOrder,url=new URL(draft.invoiceUrl);
 if(url.protocol!=='https:')throw fault('checkout_unavailable','Checkout is unavailable.',503);
 const row={id:draft.id,url:url.href,expiresAt:offer.endsAt,createdAt:now.toISOString()};
 await env.ARTWORK.put(key,JSON.stringify(row));
 await env.ARTWORK.put('commerce/seasonal-expiry/'+offer.endsAt.slice(0,10)+'/'+draft.id.split('/').pop()+'.json',JSON.stringify({...row,key}));
 return row.url;
}
// Existing minute scheduled worker revokes outstanding unpaid seasonal invoices.
// Completed purchases are never deleted or repriced.
export async function expireSeasonalCheckouts(env,now=new Date()){
 const list=await env.ARTWORK.list({prefix:'commerce/seasonal-expiry/',limit:1000});
 for(const obj of list.objects||[]){
  const date=obj.key.slice('commerce/seasonal-expiry/'.length, 'commerce/seasonal-expiry/'.length+10);
  if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&date>now.toISOString().slice(0,10))break;
  const row=await read(env,obj.key);if(!row||Date.parse(row.expiresAt)>+now)continue;
  const data=await shopifyGraphQL(env,'query RecastSeasonalDraft($id: ID!) { draftOrder(id:$id) { id status } }',{id:row.id});
  if(data.draftOrder&&data.draftOrder.status!=='COMPLETED'){
   const removed=await shopifyGraphQL(env,'mutation RecastExpireSeasonalDraft($input: DraftOrderDeleteInput!) { draftOrderDelete(input:$input) { deletedId userErrors { field message } } }',{input:{id:row.id}});
   if(removed.draftOrderDelete?.userErrors?.length||!removed.draftOrderDelete?.deletedId)continue;
  }
  await env.ARTWORK.delete(row.key);await env.ARTWORK.delete(obj.key);
 }
}
