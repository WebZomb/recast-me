import {hash,fault} from './commerce-store.js';

export const CART_CREATE = `mutation RecastBasket($input: CartInput!) {
 cartCreate(input: $input) {
  cart { id checkoutUrl lines(first: 100) { nodes { id quantity attributes { key value } merchandise { ... on ProductVariant { id } } } } }
  userErrors { field message code }
  warnings { code message target }
 }
}`;
export const CART_REFRESH = `query RecastBasketRefresh($id: ID!) {
 cart(id: $id) {
  id checkoutUrl
  lines(first: 100) { pageInfo { hasNextPage } nodes { quantity attributes { key value } merchandise { ... on ProductVariant { id } } } }
 }
}`;
export function basketShop(env) {
 const raw=String(env.SHOPIFY_SHOP||'').trim().replace(/^https:\/\//,'').replace(/\/$/,'');
 const shop=/^[a-z0-9][a-z0-9-]*$/.test(raw)?`${raw}.myshopify.com`:raw;
 if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop))throw fault('basket_configuration','Basket checkout needs owner setup.',503);
 return shop;
}
export function basketConfigured(env){
 try{return env.BASKET_ENABLED==='true'&&(!!env.SHOPIFY_STOREFRONT_TOKEN||env.SHOPIFY_STOREFRONT_TOKENLESS==='true')&&!!basketShop(env);}catch{return false;}
}
export function storefrontHeaders(env){return {'Content-Type':'application/json',...(env.SHOPIFY_STOREFRONT_TOKEN?{'X-Shopify-Storefront-Access-Token':env.SHOPIFY_STOREFRONT_TOKEN}:{})};}
export async function checkoutAttemptKey(identity){return 'commerce/basket-checkouts/v1/'+await hash(JSON.stringify([identity.ownerId,identity.basketId]))+'.json';}
const unavailable=()=>fault('basket_checkout_unknown','Your items are saved. We could not confirm checkout. Please contact support before trying again.',503);
function checkedUrl(value,shop){
 if(typeof value!=='string'||!value||value.length>8192||/[\u0000-\u0020\u007f\\]/.test(value))throw unavailable();
 let url;try{url=new URL(value);}catch{throw unavailable();}
 if(url.origin!==`https://${shop}`||url.username||url.password||url.hash)throw unavailable();
 return url.href;
}
function checkedCartId(value){
 // Cart IDs are opaque capabilities. Preserve the complete ID (including key)
 // privately; validate the resource kind, not Shopify's undocumented token format.
 if(typeof value!=='string'||value.length>8192||!/^gid:\/\/shopify\/Cart\/[^?\s#]+\?[^\s#]+$/.test(value))throw unavailable();
 const keys=new URLSearchParams(value.slice(value.indexOf('?')+1)).getAll('key');
 if(keys.length!==1||!keys[0])throw unavailable();
 return value;
}
function canonicalLines(lines){
 if(!Array.isArray(lines)||!lines.length||lines.length>20)throw unavailable();
 return JSON.stringify(lines.map(line=>{
  if(!line||typeof line.merchandiseId!=='string'||!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(line.merchandiseId)||
   !Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>10||!Array.isArray(line.attributes)||!line.attributes.length)throw unavailable();
  const keys=new Set(),attributes=line.attributes.map(a=>{
   if(!a||typeof a.key!=='string'||!a.key||typeof a.value!=='string'||keys.has(a.key))throw unavailable();
   keys.add(a.key);return [a.key,a.value];
  }).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  return JSON.stringify([line.merchandiseId,line.quantity,attributes]);
 }).sort());
}
function checkedReady(prior,identity,revision,shop){
 if(!prior||prior.ownerId!==identity.ownerId||prior.basketId!==identity.basketId||prior.status!=='ready'||
  !Number.isSafeInteger(prior.revision)||prior.revision<0||prior.revision>revision)throw unavailable();
 const started=typeof prior.startedAt==='string'?Date.parse(prior.startedAt):NaN;
 const completed=typeof prior.completedAt==='string'?Date.parse(prior.completedAt):NaN;
 if(!Number.isFinite(started)||!Number.isFinite(completed)||completed<started)throw unavailable();
 checkedCartId(prior.cartId);
 return {checkoutUrl:checkedUrl(prior.checkoutUrl,shop),lines:canonicalLines(prior.lines)};
}
async function retainCheckoutHistory(bucket,key,prior){
 // A changed basket may start another checkout, but must not erase the old
 // private reconciliation evidence. Never overwrite an existing history slot.
 const historyKey=key.replace('commerce/basket-checkouts/v1/','commerce/basket-checkout-history/v1/').replace(/\.json$/,`/${prior.revision}.json`);
 const body=JSON.stringify(prior);
 try{
  const saved=await bucket.put(historyKey,body,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
  if(saved?.etag)return;
  // A concurrent caller or a previous lost response may already have saved it.
  const existing=await bucket.get(historyKey);
  if(existing?.etag&&JSON.stringify(await existing.json())===body)return;
 }catch{throw unavailable();}
 throw unavailable();
}
function verifiedCart(result,lines,shop){
 const cart=result?.cart;
 if(!cart?.id||typeof cart.id!=='string'||!cart.checkoutUrl||result.userErrors?.length||result.warnings?.length)throw unavailable();
 const checkoutUrl=checkedUrl(cart.checkoutUrl,shop),cartId=checkedCartId(cart.id);
 const nodes=cart.lines?.nodes;
 if(!Array.isArray(nodes)||nodes.length!==lines.length)throw unavailable();
 const remaining=[...nodes];
 for(const line of lines){
  const attrs=JSON.stringify([...line.attributes].sort((a,b)=>a.key.localeCompare(b.key)));
  const i=remaining.findIndex(n=>n.quantity===line.quantity&&n.merchandise?.id===line.merchandiseId&&
   JSON.stringify([...(n.attributes||[])].sort((a,b)=>a.key.localeCompare(b.key)))===attrs);
  if(i<0)throw unavailable();remaining.splice(i,1);
 }
 return {cartId,checkoutUrl};
}
async function refreshCheckout(env,bucket,key,etag,prior,lines,fetcher){
 // Read only: a missing cart may have expired OR already completed checkout.
 // Never infer permission to recreate it from null, a timeout, or an error.
 try{
  const response=await fetcher(`https://${basketShop(env)}/api/2026-10/graphql.json`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
   headers:storefrontHeaders(env),
   body:JSON.stringify({query:CART_REFRESH,variables:{id:prior.cartId}})});
  if(!response.ok)throw unavailable();
  const data=await response.json(),cart=data.data?.cart;
  if(data.errors?.length||!cart||cart.id!==prior.cartId||cart.lines?.pageInfo?.hasNextPage!==false)throw unavailable();
  const verified=verifiedCart({cart},lines,basketShop(env));
  // Another request may have replaced this attempt while Shopify was queried.
  const current=await bucket.get(key);
  if(!current||current.etag!==etag)throw unavailable();
  return {checkoutUrl:verified.checkoutUrl,reused:true};
 }catch{throw unavailable();}
}
// One remote create at most after an atomic durable claim. An ambiguous result
// keeps the claim forever until inspected; elapsed time is NOT permission to retry.
export async function beginBasketCheckout(env,identity,state,lines,{fetcher=fetch}={}){
 if(!basketConfigured(env))throw fault('basket_configuration','Basket checkout is being prepared. Your items are saved.',503);
 if(!state.lines.length||lines.length!==state.lines.length)throw fault('basket_empty','Add a product before checkout.',409);
 // Freeze trusted caller inputs before the first storage await. Reuse must match
 // the newly revalidated approved lines, not just a numeric revision.
 identity={...identity};const revision=state.revision;lines=structuredClone(lines);
 if(!Number.isSafeInteger(revision)||revision<0)throw unavailable();
 const expectedLines=canonicalLines(lines),shop=basketShop(env);
 const key=await checkoutAttemptKey(identity),bucket=env.ARTWORK;
 let priorObject,prior;
 try{priorObject=await bucket.get(key);prior=priorObject?await priorObject.json():null;}catch{throw unavailable();}
 if(priorObject){
  if(!priorObject.etag)throw unavailable();
  const saved=checkedReady(prior,identity,revision,shop);
  if(prior.revision===revision){
   if(saved.lines!==expectedLines)throw unavailable();
   return refreshCheckout(env,bucket,key,priorObject.etag,prior,lines,fetcher);
  }
  // Editing cannot bypass an expired, completed, or unconfirmed checkout.
  // Verify the previous remote cart against ITS frozen lines before replacing it.
  await refreshCheckout(env,bucket,key,priorObject.etag,prior,prior.lines,fetcher);
  await retainCheckoutHistory(bucket,key,prior);
 }
 const attempt={ownerId:identity.ownerId,basketId:identity.basketId,revision,
  status:'pending',startedAt:new Date().toISOString(),lines:structuredClone(lines)};
 let claim;
 try{claim=await bucket.put(key,JSON.stringify(attempt),{onlyIf:priorObject?{etagMatches:priorObject.etag}:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});}catch{throw unavailable();}
 if(!claim?.etag)throw unavailable();
 let response,data;
 try{
  response=await fetcher(`https://${basketShop(env)}/api/2026-10/graphql.json`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
   headers:storefrontHeaders(env),
   body:JSON.stringify({query:CART_CREATE,variables:{input:{lines}}})});
  if(!response.ok)throw unavailable();data=await response.json();
  if(data.errors?.length)throw unavailable();
  const verified=verifiedCart(data.data?.cartCreate,lines,basketShop(env));
  const saved=await bucket.put(key,JSON.stringify({...attempt,...verified,status:'ready',completedAt:new Date().toISOString()}),{onlyIf:{etagMatches:claim.etag},httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
  if(!saved?.etag)throw unavailable();
  return {checkoutUrl:verified.checkoutUrl,reused:false};
 }catch{throw unavailable();}
}
