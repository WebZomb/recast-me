// Server-only validation for ready-made products. Nothing from the browser
// supplies artwork URLs, prices, supplier mappings, or fulfillment attributes.
const fail = message => { throw Object.assign(new Error(message), {status:409}); };
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
export function validateOffer(offer, fulfillment) {
  if (!offer || offer.status !== 'verified' || !/^[a-z0-9-]{1,100}$/.test(offer.id || '')) fail('This gift is not available.');
  const map = fulfillment[offer.sku];
  if (!map || map.digital || !['dog','cat'].includes(offer.pet)) fail('This gift is not available.');
  if (!Number.isSafeInteger(offer.priceCents) || offer.priceCents <= 0 || offer.currency !== 'USD') fail('The price needs to be refreshed.');
  if (!/^gid:\/\/shopify\/ProductVariant\/[0-9]+$/.test(offer.variantId || '')) fail('The product variant needs review.');
  const proof = offer.proof;
  if (!sha(offer.artworkRevision) || !proof || proof.provider !== 'printful' || proof.approved !== true ||
      proof.artworkRevision !== offer.artworkRevision || proof.printfulVariantId !== map.printfulVariantId ||
      !sha(proof.printFileHash) || !sha(proof.placementHash) || !proof.taskId || !proof.checkedAt) fail('The product preview needs review.');
  try { const url = new URL(offer.mockupUrl); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); }
  catch { fail('The product preview needs review.'); }
  if (!offer.artworkKey?.startsWith('shop/masters/') || offer.artworkKey.includes('..')) fail('The artwork needs review.');
  return offer;
}
export function resolveBag(lines, catalog, fulfillment) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 40) fail('Choose between 1 and 40 gifts.');
  if (!catalog || catalog.version !== 1 || !Array.isArray(catalog.offers)) fail('The collection is unavailable.');
  const index = new Map();
  for (const offer of catalog.offers) {
    if (index.has(offer.id)) fail('The collection needs review.');
    index.set(offer.id,offer);
  }
  const resolved = new Map();
  for (const line of lines) {
    if (!line || Object.keys(line).some(k=>!['offerId','revision','quantity'].includes(k))) fail('Refresh your bag and try again.');
    const offer = validateOffer(index.get(line.offerId),fulfillment);
    if (line.revision !== offer.artworkRevision) fail('A design in your bag has changed. Please select it again.');
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) fail('Choose a quantity from 1 to 20.');
    const quantity = (resolved.get(offer.id)?.quantity || 0) + line.quantity;
    if (quantity > 20) fail('Choose no more than 20 of each gift.');
    resolved.set(offer.id,{offer,quantity});
  }
  const result = [...resolved.values()];
  const subtotalCents = result.reduce((n,{offer,quantity})=>n+offer.priceCents*quantity,0);
  if (!Number.isSafeInteger(subtotalCents)) fail('The bag total needs review.');
  return {lines:result,subtotalCents,currency:'USD'};
}
// Deliberate allow-list: never expose private master keys or fulfillment data.
export function publicOffer(offer) {
  const fields=['id','title','occasion','pet','breed','product','variantLabel','variantId','priceCents','currency','artworkRevision','mockupUrl','status'];
  return {...Object.fromEntries(fields.map(k=>[k,offer[k]])),proof:{provider:'printful',approved:true,artworkRevision:offer.artworkRevision}};
}
