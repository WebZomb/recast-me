// Not routed or enabled. Requires an authenticated, server-selected ownerId and
// server-validated approval context. This adapter is not an auth/checkout API.
import { createBasket, applyBasketCommand, validateBasketState, BasketError } from './basket-state.js';

const MAX_BYTES = 384 * 1024;
const fail = code => { throw new BasketError(code); };
const bytes = text => new TextEncoder().encode(text).byteLength;
async function scope(identity) {
  const initial = createBasket(identity); // Validate before deriving any storage key.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(
    JSON.stringify(['recast-private-basket-v1', initial.ownerId, initial.basketId])
  ));
  const key = [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
  return { initial, key: `commerce/baskets/v1/${key}.json` };
}
function binding(bucket) {
  if (!bucket || typeof bucket.get !== 'function' || typeof bucket.put !== 'function') fail('basket_storage_unavailable');
}
async function readRecord(bucket, key, initial) {
  let object;
  try { object = await bucket.get(key); } catch { fail('basket_storage_unavailable'); }
  if (object === null) return { state: structuredClone(initial), etag: null, exists: false };
  if (!object || typeof object.etag !== 'string' || !object.etag ||
      typeof object.text !== 'function' || object.size > MAX_BYTES) fail('basket_storage_invalid');
  let raw;
  try { raw = await object.text(); } catch { fail('basket_storage_unavailable'); }
  if (typeof raw !== 'string' || bytes(raw) > MAX_BYTES) fail('basket_storage_invalid');
  let state;
  try { state = JSON.parse(raw); validateBasketState(state); } catch { fail('basket_storage_invalid'); }
  if (state.ownerId !== initial.ownerId || state.basketId !== initial.basketId) fail('basket_storage_scope');
  return { state, etag: object.etag, exists: true };
}

// Read from private R2 binding only, never a public/CDN-cached object URL.
export async function readStoredBasket(bucket, identity) {
  binding(bucket);
  const { initial, key } = await scope(identity);
  const record = await readRecord(bucket, key, initial);
  return { state: record.state, exists: record.exists };
}

/** At most one conditional PUT per call. Never blind-overwrite or auto-retry.
 * State and replay receipt share ONE object/write. CAS checks its read ETag;
 * new objects use If-None-Match:*. Unknown outcomes are read back once. A missing
 * receipt after a timeout is NOT proof of failure: the write may still commit.
 * Caller must retain the same action ID/payload/revision for subsequent retries.
 */
export async function mutateStoredBasket(bucket, identity, command, validatedApproval) {
  binding(bucket);
  // Snapshot caller inputs before yielding so an in-flight mutation cannot change
  // the operation whose receipt is persisted or checked during reconciliation.
  const fixedIdentity = structuredClone(identity);
  const fixedCommand = structuredClone(command);
  const fixedApproval = structuredClone(validatedApproval);
  const { initial, key } = await scope(fixedIdentity);
  const context = { ownerId: initial.ownerId, validatedApproval: fixedApproval };
  const old = await readRecord(bucket, key, initial);
  const next = applyBasketCommand(old.state, fixedCommand, context);
  if (next.replayed) return { ...next, recovered: false };
  const payload = JSON.stringify(next.state);
  if (bytes(payload) > MAX_BYTES) fail('basket_storage_limit');
  let written, uncertain = false;
  try {
    written = await bucket.put(key, payload, {
      onlyIf: old.exists ? { etagMatches: old.etag } : new Headers({ 'If-None-Match': '*' }),
      httpMetadata: { contentType: 'application/json', cacheControl: 'private, no-store' }
    });
  } catch { uncertain = true; }
  if (written && typeof written.etag === 'string' && written.etag) return { ...next, recovered: false };
  // null is a definitive conditional conflict. Other malformed receipts are
  // treated as uncertain, never as proof that it is safe to issue another PUT.
  if (written !== null) uncertain = true;
  try {
    const current = await readRecord(bucket, key, initial);
    const checked = applyBasketCommand(current.state, fixedCommand, context);
    if (checked.replayed) return { ...checked, recovered: true };
  } catch (error) {
    if (!uncertain) throw error;
  }
  fail(uncertain ? 'basket_commit_unknown' : 'basket_storage_conflict');
}
