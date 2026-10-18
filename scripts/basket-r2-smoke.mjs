// Local Miniflare R2 only. No remote binding, account, credentials or live orders.
import assert from 'node:assert/strict';
import * as miniflare from 'miniflare';
import { mutateStoredBasket, readStoredBasket } from '../src/basket-storage.js';

const options = { cf: false, modules: true, script: 'export default {fetch(){return new Response("offline basket fixture")}}', r2Buckets: ['BASKETS'] };
// Installed v5 exposes the documented v4-options converter; v4 uses them directly.
const mf = new miniflare.Miniflare(typeof miniflare.convertV4MiniflareOptions === 'function' ? miniflare.convertV4MiniflareOptions(options) : options);
const approved = { artworkId: 'ART-A', sku: 'RECAST-MUG-11OZ', variantId: '123', approvalToken: 'a'.repeat(48), proofHash: 'b'.repeat(64) };
const add = (id = 'a', revision = 0) => ({ type: 'add', actionId: id, expectedRevision: revision, lineId: `line-${id}`, quantity: 1 });
function racing(bucket) {
  let arrivals = 0, unlock;
  const gate = new Promise(resolve => { unlock = resolve; });
  return {
    async get(key) { const value = await bucket.get(key); if (arrivals < 2) { arrivals++; if (arrivals === 2) unlock(); await gate; } return value; },
    put: (...args) => bucket.put(...args)
  };
}
try {
  const bucket = await mf.getR2Bucket('BASKETS');
  const first = { ownerId: 'fixture-owner', basketId: 'distinct-race' };
  const adapter = racing(bucket);
  const outcomes = await Promise.allSettled(['a', 'b'].map(id => mutateStoredBasket(adapter, first, add(id), approved)));
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find(r => r.status === 'rejected').reason.code, 'revision_conflict');
  assert.equal((await readStoredBasket(bucket, first)).state.lines.length, 1);
  console.log('PASS local R2 conditional create: distinct concurrent actions retain one winner');

  const same = { ...first, basketId: 'identical-race' }, sameAdapter = racing(bucket);
  const replays = await Promise.all([1, 2].map(() => mutateStoredBasket(sameAdapter, same, add(), approved)));
  assert.equal(replays.filter(r => r.replayed).length, 1);
  assert.equal((await readStoredBasket(bucket, same)).state.revision, 1);
  console.log('PASS local R2 identical concurrent action: one line and one receipt');

  const updates = racing(bucket);
  const q = quantity => ({ type: 'quantity', actionId: `q-${quantity}`, expectedRevision: 1, lineId: 'line-a', quantity });
  const edits = await Promise.allSettled([2, 3].map(n => mutateStoredBasket(updates, same, q(n))));
  assert.equal(edits.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(edits.find(r => r.status === 'rejected').reason.code, 'revision_conflict');
  assert.equal((await readStoredBasket(bucket, same)).state.revision, 2);
  console.log('PASS local R2 ETag update: competing quantity edits do not overwrite winner');

  let puts = 0;
  const lost = { get: key => bucket.get(key), async put(...args) { puts++; await bucket.put(...args); throw new Error('simulated lost response'); } };
  const recovered = await mutateStoredBasket(lost, { ...first, basketId: 'lost-response' }, add(), approved);
  assert.equal(recovered.recovered, true); assert.equal(puts, 1);
  console.log('PASS local R2 committed write/lost response: receipt readback without duplicate PUT');
} finally { await mf.dispose(); }
