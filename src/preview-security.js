import { WATERMARK_TILE_BASE64, WATERMARK_FOOTER_BASE64 } from './watermark-tile.js';
import { digest, guardedEnvironment, renderControlStatus, submissionFingerprint } from './render-controls.js';

export const SECURITY_VERSION = 'rm-preview-4';
export const WATERMARK_LABEL = '@RecastMeAi • PREVIEW';
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PRIVATE_HEADERS = { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };
const META_FIELDS = ['requestId', 'styleId', 'styleName', 'subjectType', 'notes', 'customWorld', 'parentRequestId', 'qualityMode', 'status', 'createdAt', 'updatedAt', 'inputCount', 'paid', 'fulfillment', 'orderName', 'digitalEntitlement', 'modelUsed', 'attemptKind', 'promptVersion'];
const GENERATED_FIELDS = ['ok', 'requestId', 'accessToken', 'style', 'persisted', 'qualityMode', 'qualityLabel', 'modelUsed', 'usedSafeRetry', 'usedFastFallback', 'promptVersion', 'clientAttemptId'];
const REVOKED = new Set(['REFUNDED', 'PARTIALLY_REFUNDED', 'VOIDED', 'CANCELED', 'CANCELLED']);
const error = (code, message, status = 503) => Object.assign(new Error(message), { code, status });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...PRIVATE_HEADERS, 'content-type': 'application/json; charset=utf-8' } });
const imageResponse = (bytes, mime = 'image/jpeg') => new Response(bytes, { headers: { ...PRIVATE_HEADERS, 'content-type': mime } });
const pick = (data, keys) => Object.fromEntries(keys.filter(k => Object.hasOwn(data, k)).map(k => [k, data[k]]));
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
function owner(request, env) {
  const token = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1] || request.headers.get('x-recast-admin');
  return equal(token, env.ADMIN_TOKEN);
}
function requireOwner(request, env) {
  if (!owner(request, env)) throw error('admin_required', 'Owner authorization required.', 401);
}
function artworkId(raw) {
  let id;
  try { id = decodeURIComponent(raw); } catch { throw error('bad_id', 'Invalid artwork ID.', 400); }
  if (!/^RC-[A-Z0-9-]{8,60}$/.test(id)) throw error('bad_id', 'Invalid artwork ID.', 400);
  return id;
}
function from64(value) {
  const text = String(value).replace(/^data:image\/[\w.+-]+;base64,/, '').replace(/\s+/g, '');
  if (!text || text.length > 16000000) throw error('bad_image', 'The saved image could not be prepared.');
  try { return Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
  catch { throw error('bad_image', 'The saved image could not be prepared.'); }
}
function to64(bytes) {
  let text = '';
  for (let start = 0; start < bytes.length; start += 16384) text += String.fromCharCode(...bytes.subarray(start, start + 16384));
  return btoa(text);
}
async function readMeta(env, id) {
  const object = await env.ARTWORK?.get(`requests/${id}/request.json`);
  if (!object) throw error('not_found', 'Artwork not found.', 404);
  return object.json();
}
async function customerMeta(env, id, token) {
  const meta = await readMeta(env, id);
  if (!equal(meta.accessToken, token)) throw error('not_authorized', 'Invalid artwork access token.', 403);
  return meta;
}
function paid(meta) {
  return meta.paid === true && !meta.refundedAt && !meta.revokedAt && !meta.canceledAt && !REVOKED.has(String(meta.financialStatus || '').toUpperCase());
}
function requireImaging(env) {
  if (typeof env.IMAGES?.input !== 'function' || typeof env.IMAGES?.info !== 'function') {
    throw error('preview_protection_unavailable', 'Secure previews need image processing to be configured. Your previous previews are still saved. No new AI render was started.');
  }
}

export async function watermarkBytes(env, source, {maxWidth=768,maxHeight=960} = {}) {
  requireImaging(env);
  if (!(source instanceof Uint8Array) || !source.length || source.length > 12000000) throw error('bad_image', 'The preview image is unavailable.');
  const info = await env.IMAGES.info(new Blob([source]).stream());
  if (!(info.width > 0 && info.height > 0 && info.width <= 20000 && info.height <= 20000)) throw error('bad_image', 'The preview dimensions are invalid.');
  const scale = Math.min(1, maxWidth / info.width, maxHeight / info.height);
  const width = Math.max(1, Math.round(info.width * scale));
  const height = Math.max(1, Math.round(info.height * scale));
  // Cloudflare Images does not reliably accept an SVG Blob as a draw source
  // in Worker Preview (real error 9412). Use the already-rasterized PNG brand
  // assets instead. The PNGs contain @RecastMeAi • PREVIEW and are flattened
  // into the JPEG returned to every unpaid preview surface.
  const tile=env.IMAGES.input(new Blob([from64(WATERMARK_TILE_BASE64)],{type:'image/png'}).stream());
  const footer=env.IMAGES.input(new Blob([from64(WATERMARK_FOOTER_BASE64)],{type:'image/png'}).stream()).transform({width,fit:'scale-down'});
  const output = await env.IMAGES.input(new Blob([source],{type:'image/jpeg'}).stream())
    .transform({ width, height, fit: 'scale-down' })
    .draw(tile, { repeat: true, opacity: 0.27, top: 0, left: 0 })
    .draw(footer, { bottom: 0, left: 0 })
    .output({ format: 'image/jpeg', quality: 85 });
  const response = output.response();
  if (!response.ok || !response.headers.get('content-type')?.startsWith('image/jpeg')) throw error('watermark_failed', 'A protected preview could not be prepared.');
  const result = new Uint8Array(await response.arrayBuffer());
  if (result.length < 100 || result[0] !== 255 || result[1] !== 216 || result[2] !== 255 || await digest(result) === await digest(source)) {
    throw error('watermark_failed', 'A protected preview could not be verified.');
  }
  return result;
}

// Clean pixels stay in private storage. The cache contains only flattened JPEGs.
// Source hashing also invalidates derivatives if a stored source is ever replaced.
async function derivative(env, key, bytes) {
  const sourceHash = await digest(bytes);
  const old = await env.ARTWORK?.get(key);
  if (old?.customMetadata?.watermarkVersion === SECURITY_VERSION && old.customMetadata.sourceHash === sourceHash) {
    return new Uint8Array(await old.arrayBuffer());
  }
  const result = await watermarkBytes(env, bytes);
  if (env.ARTWORK) await env.ARTWORK.put(key, result, {
    customMetadata: { watermarkVersion: SECURITY_VERSION, sourceHash },
    httpMetadata: { contentType: 'image/jpeg', cacheControl: 'private, no-store' }
  });
  return result;
}
async function protectedArtwork(env, id) {
  const object = await env.ARTWORK?.get(`requests/${id}/preview.b64`);
  if (!object) throw error('not_found', 'Saved artwork is unavailable.', 404);
  return derivative(env, `requests/${id}/protected-${SECURITY_VERSION}.jpg`, from64(await object.text()));
}
async function prepareRefinement(request, env, form) {
  if (!form.get('branchRequestId')) return request;
  const id = artworkId(String(form.get('branchRequestId')));
  await customerMeta(env, id, String(form.get('branchAccessToken') || ''));
  const object = await env.ARTWORK.get(`requests/${id}/preview.b64`);
  if (!object) throw error('not_found', 'The saved version is unavailable.', 404);
  // Refinement uses the exact private original; never feed the public watermark
  // back into the model, and never trust a client-supplied replacement image.
  const prepared = (await env.IMAGES.input(new Blob([from64(await object.text())]).stream())
    .transform({ width: 500, height: 500, fit: 'scale-down' }).output({ format: 'image/jpeg', quality: 90 })).response();
  if (!prepared.ok || !prepared.headers.get('content-type')?.startsWith('image/jpeg')) throw error('refinement_unavailable', 'The saved version could not be prepared for refinement.');
  form.set('branchPreview', new File([await prepared.arrayBuffer()], 'private-refinement.jpg', { type: 'image/jpeg' }));
  const headers = new Headers(request.headers);
  headers.delete('content-type'); headers.delete('content-length');
  return new Request(request.url, { method: request.method, headers, body: form });
}

function stripPrivateFields(value) {
  if (Array.isArray(value)) return value.map(stripPrivateFields);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !/^(printAccessToken|printSourceUrl|sourceUrl|sourceImageUrl|cleanImageUrl|finalImageUrl|providerResponse)$/i.test(key))
    .map(([key, item]) => [key, stripPrivateFields(item)]));
  return value;
}
function hardened(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(PRIVATE_HEADERS)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function failure(cause) {
  const code = cause.code || 'secure_preview_unavailable';
  const known = Boolean(cause.code);
  return json({ ok: false, error: code, reason: code, userMessage: known ? cause.message : 'The protected preview could not be prepared. Your saved versions have not been replaced.', retryable: false, ...(cause.retryAt ? { retryAt: cause.retryAt } : {}) }, cause.status || 503);
}

export function secureApplication(application) {
  return {
    async fetch(originalRequest, env, ctx) {
      let request = originalRequest;
      const url = new URL(request.url), path = url.pathname;
      if (!path.startsWith('/api/')) return application.fetch(request, env, ctx);
      try {
        // Public diagnostic routes previously exposed operational order data or
        // bypassed normal rendering. Internal service calls are not HTTP routes.
        if (path.startsWith('/api/admin/') || ['/api/shopify-status', '/api/printful-status', '/api/storage-test', '/api/ai-test'].includes(path)) requireOwner(request, env);
        if (path === '/api/ai-test') return json({ error: 'use_model_lab', userMessage: 'Use the authenticated model comparison page.' }, 410);
        if (path === '/api/admin/render-controls' && request.method === 'GET') {
          return json({ ok: true, securityVersion: SECURITY_VERSION, imageProcessingConfigured: Boolean(env.IMAGES?.input && env.IMAGES?.info), renderControls: renderControlStatus(env), monetaryBudgetEnforced: false });
        }
        let match = path.match(/^\/api\/request\/([^/]+)(\/preview)?$/);
        if (match && request.method === 'GET') {
          const id = artworkId(match[1]);
          const meta = await customerMeta(env, id, url.searchParams.get('token'));
          if (!match[2]) return json({ ok: true, request: pick(meta, META_FIELDS) });
          return json({ ok: true, image: `data:image/jpeg;base64,${to64(await protectedArtwork(env, id))}`, watermarked: true, securityVersion: SECURITY_VERSION });
        }
        match = path.match(/^\/api\/print-source\/([^/]+)$/);
        if (match && request.method === 'GET') {
          const id = artworkId(match[1]), meta = await readMeta(env, id);
          if (!equal(meta.printAccessToken, url.searchParams.get('token'))) return json({ error: 'not_found' }, 404);
          if (url.searchParams.get('final') !== '1') return imageResponse(await protectedArtwork(env, id));
          if (!paid(meta)) return json({ error: 'paid_fulfillment_required' }, 403);
          const object = await env.ARTWORK.get(`requests/${id}/final-print.jpg`);
          if (!object) return json({ error: 'print_not_ready' }, 404);
          return imageResponse(object.body);
        }
        match = path.match(/^\/api\/digital-download\/([^/]+)$/);
        if (match && request.method === 'GET') {
          const id = artworkId(match[1]), meta = await customerMeta(env, id, url.searchParams.get('token'));
          if (!paid(meta) || !['RECAST-DIGITAL-HD', 'RECAST-DIGITAL-PACK'].includes(meta.digitalEntitlement)) return json({ error: 'digital_purchase_required' }, 403);
          // The existing entitlement path serves the exact stored artwork.
          return hardened(await application.fetch(request, env, ctx));
        }
        const generation = request.method === 'POST' && ['/api/transform', '/api/transform-v2', '/api/admin/model-test'].includes(path);
        let fingerprint = null;
        if (generation) {
          requireImaging(env); // Fail before inference, not after paying for an unusable output.
          if (!env.ARTWORK) throw error('private_storage_required', 'Private artwork storage must be configured before rendering.');
          const form = await request.clone().formData();
          fingerprint = await submissionFingerprint(form, path + url.search);
          request = await prepareRefinement(request, env, form);
        }
        const guarded = guardedEnvironment(env, fingerprint);
        const response = await application.fetch(request, guarded.env, ctx);
        if (guarded.state.blocked) return failure(guarded.state.blocked);
        const mime = response.headers.get('content-type') || '';
        if (mime.includes('application/json')) {
          const data = await response.json();
          if (generation && response.ok && data.ok) {
            if (!data.persisted || !data.requestId || !data.accessToken) throw error('artwork_not_saved', 'This preview could not be saved securely. Keep your last successful version.');
            const id = artworkId(data.requestId);
            await customerMeta(env, id, data.accessToken);
            return json({ ...pick(data, GENERATED_FIELDS), image: `data:image/jpeg;base64,${to64(await protectedArtwork(env, id))}`, watermarked: true, securityVersion: SECURITY_VERSION });
          }
          // No other public JSON route is allowed to return raw model pixels.
          if (typeof data.image === 'string' && data.image.startsWith('data:image/')) {
            data.image = `data:image/jpeg;base64,${to64(await watermarkBytes(env, from64(data.image)))}`;
            data.watermarked = true;
          }
          if (path === '/api/admin/status' || path === '/api/model-status') {
            data.securityVersion = SECURITY_VERSION;
            data.previewProtection = { configured: Boolean(env.IMAGES?.input && env.IMAGES?.info), serverSide: true };
            data.renderControls = renderControlStatus(env);
          }
          return json(stripPrivateFields(data), response.status);
        }
        if (response.ok && IMAGE_TYPES.has(mime.split(';')[0])) {
          const bytes = new Uint8Array(await response.arrayBuffer());
          // Guard both new and pre-patch product mockups and social previews.
          // Authentication was already checked by the original route.
          const routeHash = await digest(path);
          const mock = path.match(/^\/api\/mockup\/image\/(RC-[A-Z0-9-]+)\/([^/]+)\/(\d+)$/);
          const key = mock ? `mockups/${artworkId(mock[1])}/${encodeURIComponent(decodeURIComponent(mock[2]))}/protected-${mock[3]}-${SECURITY_VERSION}.jpg` : `security/public-previews/${routeHash}.jpg`;
          return imageResponse(await derivative(env, key, bytes));
        }
        return hardened(response);
      } catch (cause) { return failure(cause); }
    },
    async scheduled(controller, env, ctx) {
      const guarded = guardedEnvironment(env);
      return application.scheduled(controller, guarded.env, ctx);
    }
  };
}
