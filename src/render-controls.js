// Counts actual AI.run submissions, including retries and ambiguous failures.
// This is an optional REQUEST cap, not a monetary cap or a per-customer allowance.
const DAY_MS = 86400000;
const CONTROL = Symbol('recastRenderControl');

function blocked(code, message, status = 503) {
  return Object.assign(new Error(message), { code, status, renderControl: true });
}
export function renderControlStatus(env) {
  const raw = env.AI_DAILY_CALL_LIMIT;
  if (raw === undefined || raw === null || raw === '') {
    return { configured: false, dailyCallLimit: null, unit: 'AI.run submissions', timezone: 'UTC' };
  }
  const valid = /^(0|[1-9]\d*)$/.test(String(raw)) && Number.isSafeInteger(Number(raw)) && Number(raw) <= 100000;
  return { configured: true, valid, dailyCallLimit: valid ? Number(raw) : null, unit: 'AI.run submissions', timezone: 'UTC' };
}
export async function digest(value) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
}

export async function reserveAiCall(env, time = Date.now()) {
  const config = renderControlStatus(env);
  if (!config.configured) return { enforced: false };
  if (!config.valid) throw blocked('render_limit_config', 'The owner needs to correct the AI call limit.');
  if (!env.ARTWORK) throw blocked('render_limit_storage', 'The AI call counter is unavailable.');
  const day = new Date(time).toISOString().slice(0, 10);
  const key = `security/ai-calls/${day}.json`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const old = await env.ARTWORK.get(key);
    let used = 0;
    if (old) {
      const ledger = await old.json();
      if (ledger.day !== day || !Number.isSafeInteger(ledger.used) || ledger.used < 0 || !old.etag) {
        throw blocked('render_limit_storage', 'The AI call counter needs review.');
      }
      used = ledger.used;
    }
    if (used >= config.dailyCallLimit) {
      const error = blocked('daily_ai_call_limit', 'Image creation has reached the site-wide daily AI call limit. Your saved previews are still available.', 429);
      error.retryAt = new Date(Math.floor(time / DAY_MS) * DAY_MS + DAY_MS).toISOString();
      throw error;
    }
    // A conditional write, not read-then-unconditional-put: simultaneous Workers
    // cannot all reserve the final slot. Never refund failures/timeouts blindly.
    const written = await env.ARTWORK.put(key, JSON.stringify({ day, used: used + 1 }), {
      onlyIf: old ? { etagMatches: old.etag } : new Headers({ 'If-None-Match': '*' }),
      httpMetadata: { contentType: 'application/json' }
    });
    if (written) return { enforced: true, day, used: used + 1, limit: config.dailyCallLimit };
  }
  throw blocked('render_limit_busy', 'The AI call counter is busy. Please try again shortly.');
}

// Canonicalize fields and file hashes; multipart boundary strings are irrelevant.
// The client ID is never used to grant access to an image or return another result.
export async function submissionFingerprint(form, path) {
  const id = String(form.get('clientAttemptId') || '');
  if (!id) return null; // Legacy clients are still bounded by the shared call cap.
  if (id.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(id)) {
    throw blocked('invalid_attempt_id', 'Please reload the form before submitting.', 400);
  }
  const fields = [];
  for (const [key, value] of form.entries()) {
    if (key === 'turnstileToken') continue; // A refreshed challenge is not a new image request.
    fields.push([key, typeof value === 'string' ? value : {
      type: value.type, size: value.size, hash: await digest(await value.arrayBuffer())
    }]);
  }
  fields.sort((a, b) => a[0].localeCompare(b[0]) || JSON.stringify(a[1]).localeCompare(JSON.stringify(b[1])));
  return digest(JSON.stringify([path, fields]));
}

export function guardedEnvironment(env, fingerprint = null) {
  if (env[CONTROL]) return { env, state: env[CONTROL] };
  const state = { blocked: null, claimPromise: null };
  const guarded = { ...env, [CONTROL]: state };
  if (!env.AI) return { env: guarded, state };
  async function claim() {
    if (!fingerprint) return;
    if (!env.ARTWORK) throw blocked('render_claim_storage', 'Private storage is required before rendering.');
    const key = `security/submissions/${fingerprint}.json`;
    const created = await env.ARTWORK.put(key, JSON.stringify({ claimedAt: new Date().toISOString() }), {
      onlyIf: new Headers({ 'If-None-Match': '*' }), httpMetadata: { contentType: 'application/json' }
    });
    if (!created) throw blocked('duplicate_submission', 'This exact submission was already started. It was not sent to the image engine again. Check your saved versions before starting a new attempt.', 409);
  }
  guarded.AI = new Proxy(env.AI, {
    get(target, property) {
      if (property === 'run') return async (...args) => {
        try {
          // A promise, not a Boolean, also serializes two simultaneous calls in one invocation.
          state.claimPromise ||= claim();
          await state.claimPromise;
          await reserveAiCall(env);
        } catch (error) {
          state.blocked = error.renderControl ? error : blocked('render_control_unavailable', 'Image creation is paused because its usage safeguards could not be checked.');
          throw state.blocked;
        }
        return target.run(...args);
      };
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
  return { env: guarded, state };
}
