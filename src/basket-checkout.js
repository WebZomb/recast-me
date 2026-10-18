import {hash,fault} from './commerce-store.js';

export const CART_CREATE = `mutation RecastBasket($input: CartInput!) {
 cartCreate(input: $input) {
  cart { id checkoutUrl lines(first: 100) { nodes { id quantity attributes { key value } merchandise { ... on ProductVariant { id } } } } }
  userErrors { field message code }
  warnings { code message target }
 }
}`;
export function basketShop(env) {
 const shop=String(env.SHOPIFY_SHOP||'').replace(/^https:\/\//,'').replace(/\/$/,'');
 if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop))throw fault('basket_configuration','Basket checkout needs owner setup.',503);
 return shop;
}
export function basketConfigured(env){
 try{return env.BASKET_ENABLED==='true'&&!!env.SHOPIFY_STOREFRONT_TOKEN&&!!basketShop(env);}catch{return false;}
}
export async function checkoutAttemptKey(identity){return 'commerce/basket-checkouts/v1/'+await hash(JSON.stringify([identity.ownerId,identity.basketId]))+'.json';}
const unavailable=()=>fault('basket_checkout_unknown','Your items are saved. We could not confirm checkout. Please contact support before trying again.',503);
function verifiedCart(result,lines,shop){
 const cart=result?.cart;
 if(!cart?.id||typeof cart.id!=='string'||!cart.checkoutUrl||result.userErrors?.length||result.warnings?.length)throw unavailable();
 const url=new URL(cart.checkoutUrl);
 if(url.protocol!=='https:'||url.hostname!==shop||url.username||url.password)throw unavailable();
 const nodes=cart.lines?.nodes;
 if(!Array.isArray(nodes)||nodes.length!==lines.length)throw unavailable();
 const remaining=[...nodes];
 for(const line of lines){
  const attrs=JSON.stringify([...line.attributes].sort((a,b)=>a.key.localeCompare(b.key)));
  const i=remaining.findIndex(n=>n.quantity===line.quantity&&n.merchandise?.id===line.merchandiseId&&
   JSON.stringify([...(n.attributes||[])].sort((a,b)=>a.key.localeCompare(b.key)))===attrs);
  if(i<0)throw unavailable();remaining.splice(i,1);
 }
 return {cartId:cart.id,checkoutUrl:url.href};
}
// One remote create at most after an atomic durable claim. An ambiguous result
// keeps the claim forever until inspected; elapsed time is NOT permission to retry.
export async function beginBasketCheckout(env,identity,state,lines,{fetcher=fetch}={}){
 if(!basketConfigured(env))throw fault('basket_configuration','Basket checkout is being prepared. Your items are saved.',503);
 if(!state.lines.length||lines.length!==state.lines.length)throw fault('basket_empty','Add a product before checkout.',409);
 const key=await checkoutAttemptKey(identity),bucket=env.ARTWORK;
 const priorObject=await bucket.get(key),prior=priorObject?await priorObject.json():null;
 if(priorObject&&(!priorObject.etag||prior?.ownerId!==identity.ownerId||prior?.basketId!==identity.basketId))throw unavailable();
 if(prior){
  if(prior.status!=='ready')throw unavailable();
  if(prior.revision===state.revision)return {checkoutUrl:prior.checkoutUrl,reused:true};
 }
 const attempt={ownerId:identity.ownerId,basketId:identity.basketId,revision:state.revision,
  status:'pending',startedAt:new Date().toISOString(),lines:structuredClone(lines)};
 let claim;
 try{claim=await bucket.put(key,JSON.stringify(attempt),{onlyIf:priorObject?{etagMatches:priorObject.etag}:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});}catch{throw unavailable();}
 if(!claim?.etag)throw unavailable();
 let response,data;
 try{
  response=await fetcher(`https://${basketShop(env)}/api/2026-10/graphql.json`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
   headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':env.SHOPIFY_STOREFRONT_TOKEN},
   body:JSON.stringify({query:CART_CREATE,variables:{input:{lines}}})});
  if(!response.ok)throw unavailable();data=await response.json();
  if(data.errors?.length)throw unavailable();
  const verified=verifiedCart(data.data?.cartCreate,lines,basketShop(env));
  const saved=await bucket.put(key,JSON.stringify({...attempt,...verified,status:'ready',completedAt:new Date().toISOString()}),{onlyIf:{etagMatches:claim.etag},httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
  if(!saved?.etag)throw unavailable();
  return {checkoutUrl:verified.checkoutUrl,reused:false};
 }catch{throw unavailable();}
}
