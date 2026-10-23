import test from 'node:test';
import assert from 'node:assert/strict';
import { Bucket } from './security-helpers.mjs';
import { readStoredBasket, mutateStoredBasket } from '../src/basket-storage.js';

const identity = { ownerId: 'owner-1', basketId: 'basket-1' };
const approval = { artworkId: 'ART-A', sku: 'RECAST-MUG-11OZ', variantId: '123', approvalToken: 'a'.repeat(48), proofHash: 'b'.repeat(64) };
const add = (overrides = {}) => ({ type: 'add', actionId: 'add-1', expectedRevision: 0, lineId: 'line-1', quantity: 1, ...overrides });
const mutate = (bucket, command = add(), owner = identity) => mutateStoredBasket(bucket, owner, command, approval);
const rejected = (call, code) => assert.rejects(call, error => error.code === code);

class ObservedBucket extends Bucket {
  writes = 0; reads = 0; options = [];
  async get(key) { this.reads++; return super.get(key); }
  async put(key, value, options) { this.writes++; this.options.push(options); return super.put(key, value, options); }
}
// Force two readers to take the same committed snapshot before either writes.
function rendezvousReads(bucket) {
  const get = bucket.get.bind(bucket);
  let count = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  bucket.get = async key => {
    const snapshot = await get(key);
    if (count < 2) { count++; if (count === 2) release(); await gate; }
    return snapshot;
  };
}

test('read of missing basket is read-only; first mutation conditionally creates one private object', async () => {
  const bucket = new ObservedBucket();
  assert.equal((await readStoredBasket(bucket, identity)).exists, false);
  assert.equal(bucket.writes, 0);
  const result = await mutate(bucket);
  assert.equal(result.state.revision, 1); assert.equal(bucket.objects.size, 1);
  const [key, record] = [...bucket.objects.entries()][0];
  assert.match(key, /^commerce\/baskets\/v1\/[a-f0-9]{64}\.json$/);
  assert.equal(bucket.options[0].onlyIf.get('If-None-Match'), '*');
  assert.equal(record.options.httpMetadata.cacheControl, 'private, no-store');
  assert.equal(JSON.parse(record.bytes).actions.length, 1);
});
test('two simultaneous different first adds commit at most one', async () => {
  const bucket = new ObservedBucket(); rendezvousReads(bucket);
  const results = await Promise.allSettled([mutate(bucket), mutate(bucket, add({ actionId: 'add-2', lineId: 'line-2' }))]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'revision_conflict');
  const saved = await readStoredBasket(bucket, identity);
  assert.equal(saved.state.lines.length, 1); assert.equal(saved.state.actions.length, 1);
  assert.equal(bucket.writes, 2); // One successful conditional write, one rejected.
});
test('two simultaneous identical actions resolve to one saved line and receipt', async () => {
  const bucket = new ObservedBucket(); rendezvousReads(bucket);
  const results = await Promise.all([mutate(bucket), mutate(bucket)]);
  assert.equal(results.filter(r => r.replayed).length, 1);
  assert.equal((await readStoredBasket(bucket, identity)).state.revision, 1);
});
test('same action ID with conflicting payload is not accepted as a replay', async () => {
  const bucket = new ObservedBucket(); rendezvousReads(bucket);
  const results = await Promise.allSettled([mutate(bucket), mutate(bucket, add({ quantity: 2 }))]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'action_conflict');
});
test('two existing-basket edits use read ETag and cannot lose the winning change', async () => {
  const bucket = new ObservedBucket(); await mutate(bucket); rendezvousReads(bucket);
  const q = { type: 'quantity', actionId: 'q-1', expectedRevision: 1, lineId: 'line-1', quantity: 3 };
  const r = { type: 'remove', actionId: 'r-1', expectedRevision: 1, lineId: 'line-1' };
  const results = await Promise.allSettled([mutate(bucket, q), mutate(bucket, r)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'revision_conflict');
  assert.deepEqual(bucket.options.slice(1).map(o => o.onlyIf), [{ etagMatches: '1' }, { etagMatches: '1' }]);
  assert.deepEqual((await readStoredBasket(bucket, identity)).state, results.find(r => r.status === 'fulfilled').value.state);
});
test('write committed but response lost is recovered by reading the receipt, not rewriting', async () => {
  const bucket = new ObservedBucket(), put = bucket.put.bind(bucket);
  bucket.put = async (...args) => { await put(...args); throw new Error('lost response'); };
  const result = await mutate(bucket);
  assert.equal(result.recovered, true); assert.equal(result.replayed, true);
  assert.equal(bucket.writes, 1);
});
test('negative read after a write timeout remains unknown and never causes blind retry', async () => {
  const bucket = new ObservedBucket(); let attempts = 0;
  bucket.put = async () => { attempts++; throw new Error('timeout'); };
  await rejected(() => mutate(bucket), 'basket_commit_unknown');
  assert.equal(attempts, 1); assert.equal(bucket.objects.size, 0);
});
test('a timed-out in-flight write can commit after negative read; same-action retry remains idempotent', async () => {
  const bucket = new ObservedBucket(), put = bucket.put.bind(bucket); let pending;
  bucket.put = async (...args) => { pending = args; throw new Error('in flight'); };
  await rejected(() => mutate(bucket), 'basket_commit_unknown');
  await put(...pending); bucket.put = put;
  assert.equal((await mutate(bucket)).replayed, true);
  assert.equal(bucket.writes, 1);
});
test('readback failure after uncertain write remains unknown', async () => {
  const bucket = new ObservedBucket(), get = bucket.get.bind(bucket);
  let uncertain = false;
  bucket.get = async key => { if (uncertain) throw new Error('read down'); return get(key); };
  bucket.put = async () => { uncertain = true; throw new Error('write unknown'); };
  await rejected(() => mutate(bucket), 'basket_commit_unknown');
});
test('initial storage failure is not treated as missing state', async () => {
  const bucket = new ObservedBucket(); bucket.get = async () => { throw new Error('unavailable'); };
  await rejected(() => mutate(bucket), 'basket_storage_unavailable'); assert.equal(bucket.writes, 0);
});
test('corrupt stored JSON, missing ETag and oversized records are never overwritten', async () => {
  for (const object of [
    { etag: 'x', text: async () => '{broken' },
    { text: async () => '{}' },
    { etag: 'x', size: 400000, text: async () => '{}' }
  ]) {
    const bucket = new ObservedBucket(); bucket.get = async () => object;
    await rejected(() => mutate(bucket), 'basket_storage_invalid'); assert.equal(bucket.writes, 0);
  }
});
test('owner scopes never share a storage object even with the same basket ID', async () => {
  const bucket = new ObservedBucket(); await mutate(bucket);
  const other = { ...identity, ownerId: 'owner-2' };
  assert.equal((await readStoredBasket(bucket, other)).exists, false);
  await mutate(bucket, add(), other); assert.equal(bucket.objects.size, 2);
});
test('wrong-scope record fails closed', async () => {
  const bucket = new ObservedBucket(); await mutate(bucket);
  const record = [...bucket.objects.values()][0], state = JSON.parse(record.bytes);
  state.ownerId = 'owner-2'; record.bytes = Buffer.from(JSON.stringify(state));
  await rejected(() => mutate(bucket), 'basket_storage_scope'); assert.equal(bucket.writes, 1);
});
test('remove and late add replay preserve empty current state after reload', async () => {
  const bucket = new ObservedBucket(); await mutate(bucket);
  await mutate(bucket, { type: 'remove', actionId: 'r-1', expectedRevision: 1, lineId: 'line-1' });
  assert.equal((await mutate(bucket)).state.lines.length, 0); assert.equal(bucket.writes, 2);
});
test('caller mutation during an await cannot change committed payload or identity', async () => {
  const bucket = new ObservedBucket(), owner = { ...identity }, command = add(), verified = { ...approval };
  const pending = mutateStoredBasket(bucket, owner, command, verified);
  owner.ownerId = 'owner-2'; command.quantity = 9; verified.artworkId = 'ART-B';
  const result = await pending;
  assert.equal(result.state.ownerId, 'owner-1'); assert.equal(result.state.lines[0].quantity, 1);
  assert.equal(result.state.lines[0].approval.artworkId, 'ART-A');
});
test('malformed successful write receipt requires readback confirmation', async () => {
  const bucket = new ObservedBucket(), put = bucket.put.bind(bucket);
  bucket.put = async (...args) => { await put(...args); return {}; };
  assert.equal((await mutate(bucket)).recovered, true); assert.equal(bucket.writes, 1);
});
