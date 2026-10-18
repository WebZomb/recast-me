// Inert basket foundation: not imported by a route or browser entry point.
// This is NOT an authorization, approval-validation, storage or checkout adapter.
// The caller must authenticate ownerId, resolve approvals server-side, and commit
// the returned state with atomic compare-and-swap on the stored revision.
export const BASKET_LIMITS = Object.freeze({ lines: 20, quantity: 10, actions: 128 });

export class BasketError extends Error {
  constructor(code) { super(code); this.name = 'BasketError'; this.code = code; }
}
const fail = code => { throw new BasketError(code); };
const plain = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
function exact(value, fields, code) {
  if (!plain(value) || Object.keys(value).length !== fields.length ||
      fields.some(key => !Object.hasOwn(value, key))) fail(code);
}
function id(value, code = 'invalid_id') {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) fail(code);
}
function quantity(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > BASKET_LIMITS.quantity) fail('invalid_quantity');
}
function revision(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value >= Number.MAX_SAFE_INTEGER) fail('invalid_revision');
}
const APPROVAL_FIELDS = ['artworkId', 'sku', 'variantId', 'approvalToken', 'proofHash'];
function approval(value) {
  exact(value, APPROVAL_FIELDS, 'invalid_approval');
  id(value.artworkId, 'invalid_approval'); id(value.sku, 'invalid_approval');
  if (typeof value.variantId !== 'string' || !/^[1-9][0-9]{0,29}$/.test(value.variantId) ||
      typeof value.approvalToken !== 'string' || !/^[a-f0-9]{48}$/.test(value.approvalToken) ||
      typeof value.proofHash !== 'string' || !/^[a-f0-9]{64}$/.test(value.proofHash)) fail('invalid_approval');
  // Fixed ordering makes replays insensitive to JSON property insertion order.
  return Object.fromEntries(APPROVAL_FIELDS.map(key => [key, value[key]]));
}

export function createBasket({ basketId, ownerId }) {
  id(basketId); id(ownerId);
  return { schemaVersion: 1, basketId, ownerId, revision: 0, lines: [], actions: [] };
}

export function validateBasketState(state) {
  exact(state, ['schemaVersion', 'basketId', 'ownerId', 'revision', 'lines', 'actions'], 'invalid_state');
  if (state.schemaVersion !== 1) fail('invalid_state');
  id(state.basketId); id(state.ownerId); revision(state.revision);
  if (!Array.isArray(state.lines) || state.lines.length > BASKET_LIMITS.lines ||
      !Array.isArray(state.actions) || state.actions.length > BASKET_LIMITS.actions ||
      state.revision !== state.actions.length) fail('invalid_state');
  const lineIds = new Set(), actionIds = new Set();
  for (const line of state.lines) {
    exact(line, ['lineId', 'quantity', 'approval'], 'invalid_state');
    id(line.lineId); quantity(line.quantity); approval(line.approval);
    if (lineIds.has(line.lineId)) fail('invalid_state');
    lineIds.add(line.lineId);
  }
  for (const [index, action] of state.actions.entries()) {
    exact(action, ['actionId', 'fingerprint', 'revision'], 'invalid_state');
    id(action.actionId);
    if (actionIds.has(action.actionId) || action.revision !== index + 1 ||
        typeof action.fingerprint !== 'string' || action.fingerprint.length > 2048) fail('invalid_state');
    actionIds.add(action.actionId);
  }
}

/**
 * Immutable state transition over a trusted server-owned snapshot.
 * context.validatedApproval MUST come from existing server approval validation,
 * not the browser. Shape validation here does not establish access or freshness.
 * Caller-supplied IDs must be random/opaque. lineId is fixed for an add retry.
 * Duplicate responses return CURRENT state, never resurrecting a removed line.
 */
export function applyBasketCommand(state, command, context) {
  validateBasketState(state);
  if (!plain(context) || context.ownerId !== state.ownerId) fail('owner_mismatch');
  if (!plain(command)) fail('invalid_command');
  const fields = ['type', 'actionId', 'expectedRevision', 'lineId'];
  if (command.type === 'add' || command.type === 'quantity') fields.push('quantity');
  else if (command.type !== 'remove') fail('invalid_command');
  exact(command, fields, 'invalid_command');
  id(command.actionId); id(command.lineId); revision(command.expectedRevision);
  if (command.type !== 'remove') quantity(command.quantity);
  const verified = command.type === 'add' ? approval(context.validatedApproval) : null;
  const fingerprint = JSON.stringify([command.type, command.lineId, command.quantity ?? null, verified]);
  const previous = state.actions.find(a => a.actionId === command.actionId);
  if (previous) {
    if (previous.fingerprint !== fingerprint) fail('action_conflict');
    return { state: structuredClone(state), replayed: true, appliedRevision: previous.revision };
  }
  if (command.expectedRevision !== state.revision) fail('revision_conflict');
  // Never evict action receipts: an old replay must not become a new addition.
  if (state.actions.length >= BASKET_LIMITS.actions) fail('action_limit');
  const next = structuredClone(state);
  const index = next.lines.findIndex(line => line.lineId === command.lineId);
  if (command.type === 'add') {
    if (index !== -1) fail('line_exists');
    // A removed line's identity is never recycled for a different design.
    const priorAddPrefix = JSON.stringify(['add', command.lineId]).slice(0, -1) + ',';
    if (state.actions.some(a => a.fingerprint.startsWith(priorAddPrefix))) fail('line_retired');
    if (next.lines.length >= BASKET_LIMITS.lines) fail('line_limit');
    next.lines.push({ lineId: command.lineId, quantity: command.quantity, approval: verified });
  } else {
    if (index === -1) fail('line_missing');
    if (command.type === 'remove') next.lines.splice(index, 1);
    else next.lines[index].quantity = command.quantity;
  }
  next.revision += 1;
  next.actions.push({ actionId: command.actionId, fingerprint, revision: next.revision });
  return { state: next, replayed: false, appliedRevision: next.revision };
}
