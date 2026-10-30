import {resolveBag} from './shop-offers.js';
const reject = (code,message) => {throw Object.assign(new Error(message),{status:409,code});};
// Preparation only: never creates a payment session or submits a supplier order.
// Adapters must read authoritative server records, never values from the browser.
export async function prepareShopBag({lines,catalog,fulfillment,readVariant,readMaster,readProof}) {
  const bag=resolveBag(lines,catalog,fulfillment);
  const prepared=[];
  const demand=new Map();
  for(const {offer,quantity} of bag.lines)demand.set(offer.variantId,(demand.get(offer.variantId)||0)+quantity);
  const variants=new Map();
  for(const [id,quantity] of demand){
    const variant=await readVariant(id);
    if(!variant || variant.id!==id || variant.status!=='ACTIVE' || variant.availableForSale!==true)reject('unavailable','A gift in your bag is unavailable. Please refresh your bag.');
    if(variant.currency!=='USD' || !Number.isSafeInteger(variant.priceCents) || variant.priceCents<=0)reject('price_unavailable','We could not confirm the price. Please try again.');
    if(variant.quantityAvailable!==null && (!Number.isSafeInteger(variant.quantityAvailable)||variant.quantityAvailable<quantity))reject('quantity_unavailable','The requested quantity is unavailable. Please reduce it and try again.');
    variants.set(id,variant);
  }
  for(const {offer,quantity} of bag.lines){
    const variant=variants.get(offer.variantId);
    if(variant.sku!==offer.sku)reject('variant_changed','This product needs review before it can be purchased.');
    if(variant.priceCents!==offer.priceCents)reject('price_changed','A price has changed. Please refresh your bag before checkout.');
    const master=await readMaster(offer.artworkKey);
    if(!master || master.sha256!==offer.artworkRevision || master.printReady!==true || master.safetyApproved!==true)reject('artwork_unavailable','This design is not available for checkout yet.');
    const proof=await readProof(offer.id);
    if(!proof || proof.approved!==true || proof.provider!=='printful' || proof.artworkRevision!==master.sha256 ||
      proof.printfulVariantId!==fulfillment[offer.sku].printfulVariantId || proof.printFileHash!==offer.proof.printFileHash ||
      proof.placementHash!==offer.proof.placementHash || proof.taskId!==offer.proof.taskId || proof.mockupUrl!==offer.mockupUrl)reject('proof_changed','The product preview needs to be refreshed before checkout.');
    prepared.push({offerId:offer.id,revision:offer.artworkRevision,variantId:variant.id,sku:offer.sku,quantity,unitPriceCents:variant.priceCents,
      artworkKey:offer.artworkKey,printFileHash:proof.printFileHash,placementHash:proof.placementHash,proofTaskId:proof.taskId});
  }
  return {lines:prepared,subtotalCents:bag.subtotalCents,currency:'USD'};
}
