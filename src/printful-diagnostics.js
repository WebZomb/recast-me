import {validPrintfulReference, printfulJobHash, printfulReferenceForNewDraft} from './printful-reference.js';
// Owner-triggered reads only. Never change a job, attempt lock, print file or provider order.
const PRIVATE_HEADERS = {
  'content-type':'application/json; charset=utf-8', 'cache-control':'private, no-store',
  'referrer-policy':'no-referrer', 'x-content-type-options':'nosniff'
};
const reply = (value, status=200) => new Response(JSON.stringify(value), {status, headers:PRIVATE_HEADERS});
const safeId = value => /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,179}$/.test(String(value || ''));
const numericId = value => /^[1-9][0-9]{0,19}$/.test(String(value || ''));
const statusName = value => /^[a-z_]{1,50}$/.test(String(value || '')) ? String(value) : 'unknown';
const isoDate = value => typeof value==='string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;

// redirect:error is not supported by the deployed workerd runtime. Manual + explicit
// rejection preserves the no-redirect guarantee without forwarding credentials elsewhere.
async function providerGet(env, path, report) {
  report.providerRequestCount++;
  let response;
  try {
    response = await fetch(`https://api.printful.com${path}`, {
      method:'GET', redirect:'manual', cache:'no-store', signal:AbortSignal.timeout(12000),
      headers:{Authorization:`Bearer ${env.PRINTFUL_API_TOKEN}`, 'X-PF-Store-ID':report.configuredStoreId, Accept:'application/json'}
    });
  } catch (error) {
    report.lookupFailure = /^(TimeoutError|AbortError)$/.test(error?.name || '') ? 'timeout' : 'request_error';
    return {state:'unknown', message:report.lookupFailure==='timeout'
      ? 'Printful did not answer this read-only lookup within 12 seconds. The order outcome remains unknown; keep the retry lock.'
      : 'The read-only provider request failed before a response was available. The order outcome remains unknown; keep the retry lock.'};
  }
  report.providerStatus = response.status;
  if ((response.status>=300 && response.status<400) || response.type==='opaqueredirect' || response.redirected) {
    await response.body?.cancel().catch(()=>{});
    report.lookupFailure = 'redirect_blocked';
    return {state:'redirect_blocked', message:'Printful returned a redirect. It was not followed, and no credentials were forwarded. No order outcome was established.'};
  }
  if (!(response.headers.get('content-type') || '').toLowerCase().includes('json')) {
    await response.body?.cancel().catch(()=>{});
    report.lookupFailure = 'invalid_response';
    return {state:'unknown', message:'Printful did not return a readable order response. Absence of an order is not established.'};
  }
  let data;
  try { data=await response.json(); } catch {
    report.lookupFailure='invalid_json';
    return {state:'unknown', message:'The provider response could not be read as JSON. No order outcome was established.'};
  }
  const code=Number(data?.code);
  if (!Number.isInteger(code) || code!==response.status) {
    return {state:'unknown', message:'The provider response was inconsistent. No order outcome was established.'};
  }
  if (code===401) return {state:'authentication_error',message:'Printful rejected the credential for this order lookup.'};
  if (code===403) return {state:'permission_error',message:'Printful denied Orders access. Check Orders read permission and the configured store, not just mockup access.'};
  if (code===429) return {state:'rate_limited',message:'Printful limited this lookup. Wait before checking again; no order was submitted.'};
  return {code,data};
}

export async function printfulDiagnosticRoute(request, env, {requireAdmin}={}) {
  const path=new URL(request.url).pathname;
  const match=path.match(/^\/api\/admin\/job\/([^/]+)\/printful-check$/);
  if (!match) return null;
  try {
    if (typeof requireAdmin!=='function') return reply({ok:false,error:'Owner authorization is unavailable.'},503);
    requireAdmin(request,env);
    if (request.method!=='GET') return reply({ok:false,error:'This check accepts GET only; it never submits an order.'},405);
    const id=match[1];
    if (!safeId(id)) return reply({ok:false,error:'Invalid job reference.'},400);
    if (!env.ARTWORK?.get) return reply({ok:false,error:'Private order storage is unavailable.'},503);
    const object=await env.ARTWORK.get(`jobs/${id}.json`);
    if (!object) return reply({ok:false,error:'Stored Recast job not found.'},404);
    const job=await object.json();
    if (job?.id!==id) return reply({ok:false,error:'Stored job reference needs review.'},409);
    const claimObject=await env.ARTWORK.get(`commerce/production/${await printfulJobHash(id)}-draft.json`);
    let claim=null;
    try { claim=claimObject ? await claimObject.json() : null; } catch { /* Existence still means do not retry. */ }
    const recorded=[job.printfulExternalId,claim?.externalId].filter(v=>v!==undefined && v!==null);
    if (recorded.some(v=>typeof v!=='string' || !safeId(v)) || (recorded.length===2 && recorded[0]!==recorded[1])) {
      return reply({ok:false,error:'Saved order references disagree or are invalid. Nothing was changed; keep the retry lock.'},409);
    }
    // A legacy attempt without recorded externalId used the entire old ID; never
    // silently search for a new hash instead, which could hide an existing draft.
    const externalId=recorded[0] || ((claimObject || job.printfulOrderId) ? `recast-${id}` : await printfulReferenceForNewDraft(job));
    const report={
      ok:true, readOnly:true, diagnosticVersion:'RM-050.4', checkedAt:new Date().toISOString(),
      jobId:id, jobStatus:statusName(job.status),
      configuredStoreId:numericId(env.PRINTFUL_STORE_ID) ? String(env.PRINTFUL_STORE_ID) : null,
      draftAttemptRecorded:Boolean(claimObject), draftAttemptStartedAt:isoDate(claim?.startedAt),
      recordedPrintfulOrderId:numericId(job.printfulOrderId) ? String(job.printfulOrderId) : null,
      submittedAt:isoDate(job.sentToProductionAt), externalId, externalIdLength:externalId.length,
      externalIdValid:validPrintfulReference(externalId), order:null, providerStatus:null, providerRequestCount:0,
      lookupFailure:null, storeScan:null,
      safety:'Read-only check: no draft created, no retry lock cleared, no order linked, no production submitted.'
    };
    const done=(state,message)=>reply({...report,state,message});
    if (job.digital) return done('not_applicable','This is a digital item; it does not use Printful.');
    if (!env.PRINTFUL_API_TOKEN) return done('not_configured','The Printful API credential is not configured.');
    if (!report.configuredStoreId) return done('store_not_configured','A valid Printful store ID is required to check the intended store.');
    const accept=order=>{
      if (!order || !numericId(order.id) || order.external_id!==externalId ||
          (report.recordedPrintfulOrderId && String(order.id)!==report.recordedPrintfulOrderId) ||
          (order.store!==undefined && String(order.store)!==report.configuredStoreId)) {
        return done('reference_mismatch','The response did not match the exact Recast reference and configured store. Nothing was linked or changed.');
      }
      report.order={id:String(order.id),externalId:order.external_id,status:statusName(order.status)};
      return done('found','A matching Printful order was found. Check its artwork and status before any release. This check did not link, change or submit it.');
    };
    const selector=report.recordedPrintfulOrderId || `@${encodeURIComponent(externalId)}`;
    const direct=await providerGet(env,`/orders/${selector}`,report);
    if (direct.state) return done(direct.state,direct.message);
    if (direct.code===200) return accept(direct.data.result);

    // A rejected/absent legacy ID alone is not adequate. Query one bounded page
    // of all order statuses in this same store, without guessing any replacement.
    if (!report.externalIdValid && !report.recordedPrintfulOrderId && [400,404].includes(direct.code)) {
      const page=await providerGet(env,'/orders?limit=100&offset=0',report);
      if (page.state) return done(page.state,page.message);
      if (page.code!==200 || !Array.isArray(page.data.result)) {
        return done('lookup_rejected','Printful did not return a usable store order list. Keep the retry lock; no order was submitted.');
      }
      const rows=page.data.result, paging=page.data.paging;
      const total=Number.isSafeInteger(paging?.total) && paging.total>=0 ? paging.total : null;
      const complete=total!==null && paging?.offset===0 && rows.length===total && rows.length<=100;
      report.storeScan={checked:rows.length,total,complete};
      if (rows.some(o=>o?.store!==undefined && String(o.store)!==report.configuredStoreId)) {
        return done('reference_mismatch','The list contains a different store scope. Nothing was linked or changed.');
      }
      const matches=rows.filter(o=>o?.external_id===externalId);
      if (matches.length===1) return accept(matches[0]);
      if (matches.length>1) return done('reference_mismatch','Multiple matching references were returned. Keep the lock and review Printful directly.');
      return done(complete?'not_found_here':'scan_incomplete',complete
        ? `Orders access worked. No exact matching reference was found among the ${rows.length} orders returned for this configured store. The old reference is invalid; its lock remains for reviewed recovery.`
        : `Orders access worked, but only ${rows.length} orders were checked and the store list is incomplete. No exact match was found in that page; keep the lock.`);
    }
    if (direct.code===404) return done('not_found_here','No order was returned for this exact reference in the configured Printful store. Do not clear the lock until the store and original attempt are reviewed.');
    return done('lookup_rejected','Printful rejected the lookup. This is not proof that no draft exists.');
  } catch(error) {
    return reply({ok:false,error:Number(error?.status)===401?'Admin authorization required.':'The private diagnostic could not be completed. No order action was taken.'},Number(error?.status)===401?401:503);
  }
}
