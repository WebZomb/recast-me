import {readFileSync,writeFileSync} from 'node:fs';
function rep(path,oldText,newText){const s=readFileSync(path,'utf8');if(s.split(oldText).length!==2)throw Error('Expected one exact integration point: '+path+' '+oldText.slice(0,65));writeFileSync(path,s.replace(oldText,()=>newText));}
const w='src/workflow.js';
let s=readFileSync(w,'utf8');s="import {printfulReferenceForNewDraft} from './printful-reference.js';\n"+s;writeFileSync(w,s);
rep(w,
 "  const claim=`commerce/production/${await hash(job.id)}-draft.json`;\n  if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('draft_started','Draft submission already started; review Printful before retrying.');\n  const payload={external_id:`recast-${job.id}`",
 "  const claim=`commerce/production/${await hash(job.id)}-draft.json`;\n  // Never migrate a reference after a possibly accepted attempt. Keep the old lock.\n  if(await env.ARTWORK.head(claim))throw fault('draft_started','Draft submission already started; review Printful before retrying.');\n  const externalId=await printfulReferenceForNewDraft(job);\n  if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now(),externalId,referenceVersion:2}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('draft_started','Draft submission already started; review Printful before retrying.');\n  const payload={external_id:externalId");
rep(w,'  job.printfulOrderId=result.id;job.printfulStatus=result.status||"draft";',
 '  job.printfulExternalId=externalId;job.printfulOrderId=result.id;job.printfulStatus=result.status||"draft";');
rep(w,'  await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_DRAFT"]);',
 '  // Persist the provider result before a separate Shopify tagging call can fail.\n  await saveJob(env,job);\n  await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_DRAFT"]);');
rep('public/admin.js','./printful-diagnostics.js?v=rm0503','./printful-diagnostics.js?v=rm0504');
rep('public/admin.js','RM-050.3 diagnostics','RM-050.4 diagnostics');
rep('public/admin.html','/admin.js?v=rm0503','/admin.js?v=rm0504');
rep('public/printful-diagnostics.js',"      if (data.order) lines.push(`Printful order #${data.order.id} · ${data.order.status}`);",
 "      if (data.order) lines.push(`Printful order #${data.order.id} · ${data.order.status}`);\n      if (data.storeScan) lines.push(`Orders checked in this store: ${data.storeScan.checked}${data.storeScan.total !== null ? ' of '+data.storeScan.total : ''} · ${data.storeScan.complete ? 'complete snapshot' : 'incomplete snapshot'}`);\n      lines.push(`Diagnostic: ${data.diagnosticVersion || 'unknown'} · Provider requests: ${data.providerRequestCount ?? 'unknown'}${data.providerStatus ? ' · HTTP '+data.providerStatus : ''}${data.lookupFailure ? ' · '+data.lookupFailure : ''}`);");
rep('tests/printful-diagnostics.test.mjs',"assert.equal(options.redirect,'error')","assert.equal(options.redirect,'manual')");
let t=readFileSync('tests/printful-diagnostics.test.mjs','utf8');
const start=t.indexOf("test('too-long external IDs"),end=t.indexOf("test('missing or invalid provider",start);
if(start<0||end<0)throw Error('Legacy regression not found');
t=t.slice(0,start)+`test('too-long historical references stay unchanged through the bounded order-list check',async t=>{
 const id='1234567890123-12345678901234',o=setup({job:{id}});let calls=0;
 t.mock.method(globalThis,'fetch',async url=>{calls++;if(url.includes('/orders?'))return Response.json({code:200,result:[],paging:{total:0,offset:0,limit:100}});assert.ok(url.endsWith('@recast-'+id));return json(400,'Invalid external ID');});
 const d=await check(o,request(id));assert.equal(d.externalId,'recast-'+id);assert.equal(d.externalIdLength,35);assert.equal(d.externalIdValid,false);assert.equal(d.state,'not_found_here');assert.equal(calls,2);assert.equal(o.counters.writes,0);
});
`+t.slice(end);writeFileSync('tests/printful-diagnostics.test.mjs',t);
rep('tests/commerce.test.mjs',"const b=JSON.parse(options.body);assert.deepEqual(b.items[0].files[0].position", "const b=JSON.parse(options.body);assert.match(b.external_id,/^[A-Za-z0-9_-]{1,32}$/);assert.deepEqual(b.items[0].files[0].position");
writeFileSync('tests/commerce.test.mjs',readFileSync('tests/commerce.test.mjs','utf8')+readFileSync('scripts/append-commerce-rm0504.txt','utf8'));
writeFileSync('docs/ASTRA-HANDOFF.md',readFileSync('docs/ASTRA-HANDOFF.md','utf8')+'\nLatest: [RM-050.4 — Workers-compatible order lookup and bounded Printful references](ASTRA-SESSION-RM-0504.md).\n');
console.log('RM-050.4 applied: invalid new references corrected, existing locks retained; no order submission or live credentials.');
