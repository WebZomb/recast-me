import test from 'node:test';
import assert from 'node:assert/strict';
import { createBasket, applyBasketCommand, BASKET_LIMITS } from '../src/basket-state.js';

const proof = (artworkId = 'ART-A', token = 'a', hash = 'b') => ({
  artworkId, sku: 'RECAST-MUG-11OZ', variantId: '1234567890',
  approvalToken: token.repeat(48), proofHash: hash.repeat(64)
});
const fresh = () => createBasket({ basketId: 'basket-1', ownerId: 'owner-1' });
const add = (overrides = {}) => ({ type: 'add', actionId: 'add-1', expectedRevision: 0, lineId: 'line-1', quantity: 1, ...overrides });
const context = (validatedApproval = proof()) => ({ ownerId: 'owner-1', validatedApproval });
const run = (state, command, approved = proof()) => applyBasketCommand(state, command, context(approved));
const added = () => run(fresh(), add()).state;
const rejects = (fn, code) => assert.throws(fn, e => e.code === code);

test('add retains exact per-line approval without mutating inputs', () => {
  const state = fresh(), input = proof(), original = structuredClone(input);
  const result = run(state, add(), input);
  assert.equal(state.lines.length, 0); assert.deepEqual(input, original);
  assert.deepEqual(result.state.lines[0].approval, original);
  input.artworkId = 'changed'; assert.equal(result.state.lines[0].approval.artworkId, 'ART-A');
});
test('same variant with different artwork stays separate', () => {
  const result = run(added(), add({ actionId: 'add-2', expectedRevision: 1, lineId: 'line-2' }), proof('ART-B', 'c'));
  assert.deepEqual(result.state.lines.map(l => l.approval.artworkId), ['ART-A', 'ART-B']);
});
test('same artwork with a different proof stays separate', () => {
  const result = run(added(), add({ actionId: 'add-2', expectedRevision: 1, lineId: 'line-2' }), proof('ART-A', 'c', 'd'));
  assert.equal(result.state.lines.length, 2);
  assert.notEqual(result.state.lines[0].approval.proofHash, result.state.lines[1].approval.proofHash);
});
test('exact add replay is idempotent even with stale revision', () => {
  const result = run(added(), add());
  assert.equal(result.replayed, true); assert.equal(result.state.revision, 1);
  assert.equal(result.state.lines.length, 1);
});
test('reordered approval object keys do not break replay', () => {
  const reordered = Object.fromEntries(Object.entries(proof()).reverse());
  assert.equal(run(added(), add(), reordered).replayed, true);
});
test('action ID reused for different artwork or quantity is rejected', () => {
  rejects(() => run(added(), add(), proof('ART-B')), 'action_conflict');
  rejects(() => run(added(), add({ quantity: 2 })), 'action_conflict');
});
test('second-tab stale edit is rejected against a newer committed snapshot', () => {
  rejects(() => run(added(), add({ actionId: 'add-2', lineId: 'line-2' })), 'revision_conflict');
});
test('quantity edit retains approval and other lines', () => {
  const state = run(added(), add({ actionId: 'add-2', expectedRevision: 1, lineId: 'line-2' }), proof('ART-B')).state;
  const result = run(state, { type: 'quantity', actionId: 'qty-1', expectedRevision: 2, lineId: 'line-1', quantity: 3 });
  assert.equal(result.state.lines[0].quantity, 3);
  assert.deepEqual(result.state.lines[0].approval, state.lines[0].approval);
  assert.deepEqual(result.state.lines[1], state.lines[1]);
});
test('remove followed by original add replay never resurrects the line', () => {
  const state = run(added(), { type: 'remove', actionId: 'remove-1', expectedRevision: 1, lineId: 'line-1' }).state;
  const result = run(state, add());
  assert.equal(result.replayed, true); assert.equal(result.state.lines.length, 0);
  assert.equal(result.state.revision, 2); assert.equal(result.appliedRevision, 1);
});
test('quantity replay after removal also preserves current state', () => {
  const command = { type: 'quantity', actionId: 'qty-1', expectedRevision: 1, lineId: 'line-1', quantity: 2 };
  const state = run(run(added(), command).state, { type: 'remove', actionId: 'remove-1', expectedRevision: 2, lineId: 'line-1' }).state;
  assert.equal(run(state, command).state.lines.length, 0);
});
test('owner mismatch is rejected before replay', () => {
  rejects(() => applyBasketCommand(added(), add(), { ...context(), ownerId: 'other' }), 'owner_mismatch');
});
test('missing or malformed server approval fails closed', () => {
  rejects(() => applyBasketCommand(fresh(), add(), { ownerId: 'owner-1' }), 'invalid_approval');
  for (const key of ['approvalToken', 'proofHash', 'variantId']) {
    rejects(() => run(fresh(), add(), { ...proof(), [key]: '' }), 'invalid_approval');
  }
});
test('browser price, URL and approval fields are not accepted as commands', () => {
  for (const key of ['price', 'artworkUrl', 'approval']) {
    rejects(() => run(fresh(), { ...add(), [key]: 'untrusted' }), 'invalid_command');
  }
  rejects(() => run(fresh(), add(), { ...proof(), url: 'https://example.invalid/photo' }), 'invalid_approval');
});
test('quantity and revision types/bounds are strict', () => {
  for (const quantity of [0, -1, 1.5, '2', 11, NaN, Infinity]) rejects(() => run(fresh(), add({ quantity })), 'invalid_quantity');
  for (const expectedRevision of [-1, '0', 0.5, Number.MAX_SAFE_INTEGER]) rejects(() => run(fresh(), add({ expectedRevision })), 'invalid_revision');
});
test('occupied and missing line IDs fail without state mutation', () => {
  const state = added(), before = structuredClone(state);
  rejects(() => run(state, add({ actionId: 'add-2', expectedRevision: 1 })), 'line_exists');
  rejects(() => run(state, { type: 'remove', actionId: 'remove', lineId: 'absent', expectedRevision: 1 }), 'line_missing');
  assert.deepEqual(state, before);
});
test('line capacity is bounded and removable without losing receipts', () => {
  let state = fresh();
  for (let i = 0; i < BASKET_LIMITS.lines; i++) state = run(state, add({ actionId: `a-${i}`, lineId: `l-${i}`, expectedRevision: i })).state;
  rejects(() => run(state, add({ actionId: 'overflow', lineId: 'overflow', expectedRevision: state.revision })), 'line_limit');
  state = run(state, { type: 'remove', actionId: 'remove', lineId: 'l-0', expectedRevision: state.revision }).state;
  assert.equal(state.lines.length, BASKET_LIMITS.lines - 1);
  assert.equal(state.actions.length, BASKET_LIMITS.lines + 1);
});
test('action capacity never evicts old replay protection', () => {
  let state = added();
  for (let i = 1; i < BASKET_LIMITS.actions; i++) state = run(state, { type: 'quantity', actionId: `q-${i}`, expectedRevision: i, lineId: 'line-1', quantity: 1 }).state;
  rejects(() => run(state, { type: 'remove', actionId: 'overflow', expectedRevision: state.revision, lineId: 'line-1' }), 'action_limit');
  assert.equal(run(state, add()).replayed, true);
});
test('JSON reload retains designs and replay receipts', () => {
  const state = JSON.parse(JSON.stringify(added()));
  assert.deepEqual(run(state, add()).state, state);
});
test('corrupt or future-version state fails closed', () => {
  for (const state of [{ ...fresh(), schemaVersion: 2 }, { ...added(), revision: 0 }, { ...added(), lines: [...added().lines, ...added().lines] }]) {
    rejects(() => run(state, add()), 'invalid_state');
  }
});
test('removed line IDs cannot be recycled for a different approval', () => {
  const state = run(added(), { type: 'remove', actionId: 'remove-1', expectedRevision: 1, lineId: 'line-1' }).state;
  rejects(() => run(state, add({ actionId: 'add-2', expectedRevision: 2 }), proof('ART-B')), 'line_retired');
});
test('replay returns detached current state', () => {
  const state = added(), result = run(state, add());
  result.state.lines[0].quantity = 9;
  assert.equal(state.lines[0].quantity, 1);
});
