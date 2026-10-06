// Owner-triggered diagnostics only. Never changes an order, a claim or a print file.
const PRIVATE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'private, no-store',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff'
};
const reply = (value, status = 200) => new Response(JSON.stringify(value), {status, headers: PRIVATE_HEADERS});
const safeId = value => /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,179}$/.test(String(value || ''));
const numericId = value => /^[1-9][0-9]{0,19}$/.test(String(value || ''));
const statusName = value => /^[a-z_]{1,50}$/.test(String(value || '')) ? String(value) : 'unknown';
const isoDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
  ? new Date(value).toISOString() : null;
async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function printfulDiagnosticRoute(request, env, {requireAdmin} = {}) {
  const path = new URL(request.url).pathname;
  const match = path.match(/^\/api\/admin\/job\/([^/]+)\/printful-check$/);
  if (!match) return null;
  try {
    if (typeof requireAdmin !== 'function') return reply({ok:false,error:'Owner authorization is unavailable.'}, 503);
    requireAdmin(request, env);
    if (request.method !== 'GET') return reply({ok:false,error:'This check accepts GET only; it never submits an order.'}, 405);
    const id = match[1];
    if (!safeId(id)) return reply({ok:false,error:'Invalid job reference.'}, 400);
    if (!env.ARTWORK?.get) return reply({ok:false,error:'Private order storage is unavailable.'}, 503);
    const object = await env.ARTWORK.get(`jobs/${id}.json`);
    if (!object) return reply({ok:false,error:'Stored Recast job not found.'}, 404);
    const job = await object.json();
    if (job?.id !== id) return reply({ok:false,error:'Stored job reference needs review.'}, 409);
    const claimObject = await env.ARTWORK.get(`commerce/production/${await digest(id)}-draft.json`);
    let claim = null;
    try { claim = claimObject ? await claimObject.json() : null; } catch { /* Marker exists; contents unverified. */ }
    const externalId = `recast-${id}`; // Exactly the identifier current draft creation submits.
    const report = {
      ok:true, readOnly:true, checkedAt:new Date().toISOString(),
      jobId:id, jobStatus:statusName(job.status),
      configuredStoreId:numericId(env.PRINTFUL_STORE_ID) ? String(env.PRINTFUL_STORE_ID) : null,
      draftAttemptRecorded:Boolean(claimObject), draftAttemptStartedAt:isoDate(claim?.startedAt),
      recordedPrintfulOrderId:numericId(job.printfulOrderId) ? String(job.printfulOrderId) : null,
      submittedAt:isoDate(job.sentToProductionAt),
      externalId, externalIdLength:externalId.length,
      externalIdValid:externalId.length <= 32 && /^[A-Za-z0-9_-]+$/.test(externalId),
      order:null, providerStatus:null,
      safety:'Read-only check: no draft created, no retry lock cleared, no order linked, no production submitted.'
    };
    const done = (state, message) => reply({...report, state, message});
    if (job.digital) return done('not_applicable', 'This is a digital item; it does not use Printful.');
    if (!env.PRINTFUL_API_TOKEN) return done('not_configured', 'The Printful API credential is not configured.');
    if (!report.configuredStoreId) return done('store_not_configured', 'A valid Printful store ID is required to check the intended store.');
    const selector = report.recordedPrintfulOrderId || `@${encodeURIComponent(externalId)}`;
    let response, data;
    try {
      response = await fetch(`https://api.printful.com/orders/${selector}`, {
        method:'GET', redirect:'error', cache:'no-store', signal:AbortSignal.timeout(12000),
        headers:{Authorization:`Bearer ${env.PRINTFUL_API_TOKEN}`, 'X-PF-Store-ID':report.configuredStoreId}
      });
      report.providerStatus = response.status;
      if (!(response.headers.get('content-type') || '').toLowerCase().includes('json')) {
        return done('unknown', 'Printful did not return a readable order response. Absence of an order is not established.');
      }
      data = await response.json();
    } catch {
      return done('unknown', 'The Printful order lookup did not finish. Keep the retry lock; do not create another draft.');
    }
    const code = Number(data?.code || response.status);
    if (response.status === 401 || code === 401) return done('authentication_error', 'Printful rejected the credential for this order lookup.');
    if (response.status === 403 || code === 403) return done('permission_error', 'Printful denied Orders access. Check Orders read permission and the configured store, not just mockup access.');
    if (response.status === 429 || code === 429) return done('rate_limited', 'Printful limited this lookup. Wait before checking again; no order was submitted.');
    if (response.status === 404 && code === 404) {
      return done('not_found_here', report.externalIdValid
        ? 'No order was returned for this exact reference in the configured Printful store. Do not clear the lock until the store and original attempt are reviewed.'
        : 'No order was returned for this reference. The identifier generated by Recast also exceeds or violates Printful’s external-ID rules; this does not recover the original submission error.');
    }
    if (!response.ok || code >= 400) {
      return done('lookup_rejected', report.externalIdValid
        ? 'Printful rejected the lookup. This is not proof that no draft exists.'
        : 'The generated order reference does not meet Printful’s external-ID rules. The lookup was rejected; the first submission still needs review.');
    }
    const order = data?.result;
    if (!order || !numericId(order.id) || order.external_id !== externalId ||
        (report.recordedPrintfulOrderId && String(order.id) !== report.recordedPrintfulOrderId)) {
      return done('reference_mismatch', 'The response did not match the exact Recast order reference. Nothing was linked or changed.');
    }
    report.order = {id:String(order.id), externalId:order.external_id, status:statusName(order.status)};
    return done('found', 'A matching Printful order was found. Check its artwork and status before any release. This check did not link, change or submit it.');
  } catch (error) {
    const code = Number(error?.status);
    return reply({ok:false,error:code===401?'Admin authorization required.':'The private diagnostic could not be completed. No order action was taken.'}, code===401?401:503);
  }
}
