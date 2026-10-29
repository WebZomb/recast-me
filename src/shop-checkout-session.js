import {prepareShopBag} from './shop-checkout-preflight.js';
import {hash} from './commerce-store.js';
const fail=(code,message,status=409)=>{throw Object.assign(new Error(message),{code,status});};
const attributes=values=>Object.entries(values).map(([key,value])=>({key,value:String(value)}));
// Consume a previously frozen approval. Never substitute a newly rendered image.
export function approvedShopLine(line, approval) {
  if(!approval || !/^[a-f0-9]{48}$/.test(approval.token||'') || !/^RC-[A-Z0-9-]{8,60}$/.test(approval.requestId||'') ||
    approval.offerId!==line.offerId || approval.artworkRevision!==line.revision || approval.sku!==line.sku ||
    approval.printFileHash!==line.printFileHash || approval.placementHash!==line.placementHash ||
    approval.proofTaskId!==line.proofTaskId || !/^[a-f0-9]{64}$/.test(approval.proofHash||'') ||
    !approval.mockupId || !approval.design || typeof approval.design!=='object' || Array.isArray(approval.design) ||
    approval.previewToken!==approval.token || approval.snapshotVerified!==true) {
    fail('approval_unavailable','A design needs review before checkout. Your bag is saved.');
  }
  return {merchandiseId:line.variantId,quantity:line.quantity,attributes:attributes({
    'Artwork ID':approval.requestId,
    'Recast Design':'Finished design · confirmed before checkout',
    '_Recast Offer':line.offerId,
    '_Recast Revision':line.revision,
    '_Recast Design':JSON.stringify(approval.design),
    '_Recast Proof':approval.proofHash,
    '_Recast Mockup':approval.mockupId,
    '_Recast Preview Token':approval.previewToken,
    '_Recast Preapproval':approval.token
  })};
}
function signature(line){return JSON.stringify([line.merchandiseId,line.quantity,[...line.attributes].sort((a,b)=>a.key.localeCompare(b.key))]);}
export function verifyCreatedCart(cart,expected,{subtotalCents,allowedCheckoutHosts}){
  if(!cart?.id || cart.hasNextPage!==false || !Array.isArray(cart.lines) || cart.lines.length!==expected.length ||
    cart.currency!=='USD' || cart.subtotalCents!==subtotalCents)fail('cart_mismatch','We could not confirm your bag. Please try again later.',503);
  const pending=expected.map(signature).sort(),actual=cart.lines.map(signature).sort();
  if(JSON.stringify(pending)!==JSON.stringify(actual))fail('cart_mismatch','The checkout did not match your selected designs. Your bag is saved.',503);
  let url;try{url=new URL(cart.checkoutUrl);}catch{fail('checkout_unavailable','Checkout is temporarily unavailable.',503);}
  if(url.protocol!=='https:' || url.username || url.password || !allowedCheckoutHosts.includes(url.hostname))fail('checkout_unavailable','Checkout is temporarily unavailable.',503);
  return {checkoutUrl:url.href,cartId:cart.id};
}
// store is an R2 bucket (conditional put is required). createCart/readApproval
// are server adapters, not caller input. A pending/uncertain attempt is never
// automatically reissued: that prevents double checkout creation on retry.
export async function checkoutShopBag(input,dependencies){
  const {store,createCart,readApproval,allowedCheckoutHosts,now=()=>Date.now(),...preflight}=dependencies;
  if(!input || Object.keys(input).some(k=>!['lines','attemptId'].includes(k)) || !/^[a-f0-9]{32}$/.test(input.attemptId||''))fail('invalid_bag','Refresh your bag and try again.',400);
  const bag=await prepareShopBag({...preflight,lines:input.lines});
  const ordered=[...bag.lines].sort((a,b)=>a.offerId.localeCompare(b.offerId));
  const fingerprint=await hash(JSON.stringify(ordered));
  const key=`shop/checkout-attempts/${input.attemptId}.json`;
  const old=await store.get(key);
  if(old){
    const previous=await old.json();
    if(previous.fingerprint!==fingerprint)fail('bag_changed','Your bag changed. Start a new checkout attempt.');
    if(previous.status==='ready' && previous.expiresAt>now())return previous.result;
    fail('checkout_pending','This checkout attempt needs to be checked before retrying. Your bag is saved.');
  }
  const lines=[];
  for(const line of ordered)lines.push(approvedShopLine(line,await readApproval(line)));
  const reserved=await store.put(key,JSON.stringify({status:'pending',fingerprint,createdAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})});
  if(!reserved)fail('checkout_pending','Checkout is already being prepared. Please wait.');
  try{
    const cart=await createCart(lines);
    const result=verifyCreatedCart(cart,lines,{subtotalCents:bag.subtotalCents,allowedCheckoutHosts});
    await store.put(key,JSON.stringify({status:'ready',fingerprint,result,expiresAt:now()+30*60*1000}));
    return result;
  }catch{
    // Keep pending after any uncertain provider or persistence response. Never
    // delete the lock and silently create a second cart.
    fail('checkout_pending','We could not confirm checkout yet. Your bag is saved; please try again later.',503);
  }
}
