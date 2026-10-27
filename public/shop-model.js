// A cart line is an immutable catalog offer, never a customer-supplied artwork URL.
export const PETS = Object.freeze({
  dog: ['French Bulldog','Labrador Retriever','Golden Retriever','German Shepherd','Dachshund','Poodle','Beagle','Rottweiler','German Shorthaired Pointer','Bulldog','Chihuahua','Corgi'],
  cat: ['Orange tabby','Gray tabby','Black cat','Tuxedo','Calico','Maine Coon']
});
export function currentOccasion(now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = type => Number(date.find(p => p.type === type).value);
  const md = part('month') * 100 + part('day');
  if (md >= 1027 && md <= 1225) return 'christmas';
  if (md >= 101 && md <= 214) return 'valentine';
  if (md >= 301 && md <= 430) return 'spring';
  return 'everyday';
}
export function matches(offer, filters = {}) {
  return ['occasion','pet','breed','product'].every(key => !filters[key] || filters[key] === 'all' || offer[key] === filters[key]) &&
    (!filters.search || `${offer.title} ${offer.breed} ${offer.product}`.toLowerCase().includes(filters.search.trim().toLowerCase()));
}
export function readyOffer(offer) {
  return offer?.status === 'verified' && typeof offer.id === 'string' &&
    Number.isSafeInteger(offer.priceCents) && offer.priceCents > 0 && offer.currency === 'USD' &&
    typeof offer.artworkRevision === 'string' && offer.artworkRevision.length > 0 &&
    offer.proof?.provider === 'printful' && offer.proof?.approved === true &&
    offer.proof?.artworkRevision === offer.artworkRevision &&
    typeof offer.mockupUrl === 'string' && /^https:\/\//.test(offer.mockupUrl) &&
    typeof offer.variantId === 'string' && offer.variantId.length > 0;
}
export function restoreCart(value, offers) {
  if (!Array.isArray(value)) return [];
  const valid = new Map(offers.filter(readyOffer).map(o => [o.id, o]));
  const lines = new Map();
  for (const line of value.slice(0,100)) {
    const offer = valid.get(line?.offerId);
    if (!offer || line.revision !== offer.artworkRevision || !Number.isInteger(line.quantity) || line.quantity < 1) continue;
    lines.set(offer.id, {offerId:offer.id,revision:offer.artworkRevision,quantity:Math.min(20,(lines.get(offer.id)?.quantity || 0) + line.quantity)});
  }
  return [...lines.values()];
}
export function changeQuantity(cart, offer, delta) {
  if (!readyOffer(offer) || !Number.isInteger(delta)) throw new Error('Product is not ready to purchase.');
  const remaining = cart.filter(l => l.offerId !== offer.id);
  const previous = cart.find(l => l.offerId === offer.id && l.revision === offer.artworkRevision)?.quantity || 0;
  const quantity = Math.max(0,Math.min(20,previous + delta));
  return quantity ? [...remaining,{offerId:offer.id,revision:offer.artworkRevision,quantity}] : remaining;
}
export function subtotal(cart, offers) {
  const valid = restoreCart(cart,offers);
  return valid.reduce((sum,l) => sum + offers.find(o => o.id === l.offerId).priceCents * l.quantity,0);
}
