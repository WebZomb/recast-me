import test from 'node:test';
import assert from 'node:assert/strict';
import { basketIdentity } from '../src/basket-identity.js';
import { readStoredBasket, mutateStoredBasket } from '../src/basket-storage.js';
import { hash } from '../src/commerce-store.js';
import { Bucket } from './security-helpers.mjs';
const token = 'a'.repeat(64), other = 'b'.repeat(64);
const req = ({ cookie = `__Host-recast-credit=${token}`, method = 'POST', origin = 'https://recast.test', marker = '1' } = {}) =>
  new Request('https://recast.test/api/basket?ownerId=forged', { method, headers: { cookie, origin, 'x-recast-request': marker, 'x-owner-id': 'forged' } });
async function fixture() {
  const env = { ARTWORK: new Bucket() };
  for (const t of [token, other]) await env.ARTWORK.put(`commerce/wallets/${await hash(t)}.json`, JSON.stringify({ id: 'untrusted-record-id', orders: {}, createdAt: '2026-10-18T00:00:00Z' }));
  return env;
}
const rejects = (fn, code) => assert.rejects(fn, e => e.code === code);
test('identity is derived from the existing cookie, not forged IDs; read-only', async () => {
  const env = await fixture(), serial = env.ARTWORK.serial;
  const identity = await basketIdentity(req(), env, 'basket-1');
  assert.deepEqual(identity, { basketId: 'basket-1', ownerId: await hash(token) });
  assert.equal(Object.isFrozen(identity), true); assert.equal(env.ARTWORK.serial, serial);
});
test('GET requires the same guard and resolves same browser identity', async () => {
  assert.equal((await basketIdentity(req({ method: 'GET' }), await fixture(), 'b')).ownerId, await hash(token));
});
test('missing or malformed cookies fail before storage', async () => {
  const env = { ARTWORK: { get() { throw new Error('must not read'); } } };
  for (const cookie of ['', '__Host-recast-credit=short', `__Host-recast-credit=${'A'.repeat(64)}`])
    await rejects(() => basketIdentity(req({ cookie }), env, 'b'), 'basket_session_required');
});
test('duplicate cookie names are ambiguous and rejected', async () => {
  await rejects(() => basketIdentity(req({ cookie: `__Host-recast-credit=${token}; __Host-recast-credit=${other}` }), {}, 'b'), 'basket_session_required');
});
test('unknown valid token does not create a session or a basket', async () => {
  const env = { ARTWORK: new Bucket() };
  await rejects(() => basketIdentity(req(), env, 'b'), 'basket_session_required');
  assert.equal(env.ARTWORK.serial, 0);
});
test('foreign origin and missing request marker are rejected', async () => {
  const env = await fixture();
  for (const options of [{ origin: 'https://other.test' }, { marker: '' }])
    await rejects(() => basketIdentity(req(options), env, 'b'), 'origin_required');
});
test('unsupported methods and invalid basket IDs fail before storage', async () => {
  await rejects(() => basketIdentity(req({ method: 'DELETE' }), {}, 'b'), 'basket_method');
  await rejects(() => basketIdentity(req(), {}, '../foreign'), 'invalid_id');
});
test('missing binding, read errors and malformed JSON fail closed without leaking errors', async () => {
  for (const env of [{}, { ARTWORK: { get() { throw new Error('private diagnostic'); } } },
    { ARTWORK: { async get() { return { json() { throw new Error('private record'); } }; } } }]) {
    await assert.rejects(() => basketIdentity(req(), env, 'b'), e => e.code === 'basket_session_unavailable' && !e.message.includes('private'));
  }
});
test('malformed wallet records are not accepted as sessions', async () => {
  for (const row of ['bad', [], {}, { orders: [], createdAt: '2026-10-18' }, { orders: {}, createdAt: 'invalid' }]) {
    const env = await fixture();
    await env.ARTWORK.put(`commerce/wallets/${await hash(token)}.json`, JSON.stringify(row));
    await rejects(() => basketIdentity(req(), env, 'b'), 'basket_session_unavailable');
  }
});
test('different browser cookies cannot read the same basket namespace', async () => {
  const env = await fixture();
  const a = await basketIdentity(req(), env, 'same-id');
  const b = await basketIdentity(req({ cookie: `__Host-recast-credit=${other}` }), env, 'same-id');
  await mutateStoredBasket(env.ARTWORK, a, { type: 'add', actionId: 'a', lineId: 'l', expectedRevision: 0, quantity: 1 },
    { artworkId: 'ART', sku: 'RECAST-MUG', variantId: '123', approvalToken: 'c'.repeat(48), proofHash: 'd'.repeat(64) });
  assert.equal((await readStoredBasket(env.ARTWORK, b)).exists, false);
  assert.equal((await readStoredBasket(env.ARTWORK, a)).state.lines.length, 1);
});
test('revoked wallet record blocks subsequent identity resolution', async () => {
  const env = await fixture();
  await basketIdentity(req(), env, 'b');
  await env.ARTWORK.delete(`commerce/wallets/${await hash(token)}.json`);
  await rejects(() => basketIdentity(req(), env, 'b'), 'basket_session_required');
});
