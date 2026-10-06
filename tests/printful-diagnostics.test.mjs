import test from 'node:test';
import assert from 'node:assert/strict';
import {printfulDiagnosticRoute} from '../src/printful-diagnostics.js';
import {attachPrintfulDiagnostic} from '../public/printful-diagnostics.js';
const jobId='test-job';
const requireAdmin=(request)=>{if(request.headers.get('authorization')!=='Bearer owner-only')throw Object.assign(new Error('Denied'),{status:401});};
const request=(id=jobId, method='GET', auth=true)=>new Request(`https://recastmeai.com/api/admin/job/${id}/printful-check`,{method,headers:auth?{authorization:'Bearer owner-only'}:{}});
function setup(extra={}){
  const counters={reads:0,writes:0};
  const job={id:jobId,status:'owner_release_review',sku:'RECAST-MUG-11OZ',...extra.job};
  const env={PRINTFUL_API_TOKEN:'provider-secret',PRINTFUL_STORE_ID:'123',ARTWORK:{
    async get(key){counters.reads++;if(key===`jobs/${job.id}.json`)return {json:async()=>job};if(key.startsWith('commerce/production/'))return{json:async()=>({startedAt:'2026-10-06T17:00:00Z',secret:'never disclose'})};return null;},
    put(){counters.writes++;throw new Error('No writes permitted');},delete(){counters.writes++;throw new Error('No deletes permitted');}
  },...extra.env};
  return{env,job,counters};
}
const json=(code,result)=>Response.json({code,result},{status:code});
async function check(o,req=request()){return(await printfulDiagnosticRoute(req,o.env,{requireAdmin})).json();}
test('diagnostic denies unauthenticated requests before storage/provider reads',async t=>{
  const o=setup();t.mock.method(globalThis,'fetch',async()=>{throw new Error('Provider must not be contacted');});
  const r=await printfulDiagnosticRoute(request(jobId,'GET',false),o.env,{requireAdmin});assert.equal(r.status,401);assert.equal(o.counters.reads,0);
});
test('diagnostic rejects POST and path injection without reads',async()=>{
  const o=setup();assert.equal((await printfulDiagnosticRoute(request(jobId,'POST'),o.env,{requireAdmin})).status,405);
  assert.equal((await printfulDiagnosticRoute(request('%2e%2e%2fsecret'),o.env,{requireAdmin})).status,400);assert.equal(o.counters.reads,0);
});
test('matching order uses scoped GET and returns only allowlisted non-secret fields',async t=>{
  const o=setup();let calls=0;t.mock.method(globalThis,'fetch',async(url,options)=>{
    calls++;assert.equal(url,'https://api.printful.com/orders/@recast-test-job');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.headers['X-PF-Store-ID'],'123');
    return json(200,{id:999,external_id:'recast-test-job',status:'draft',recipient:{email:'private@example.test'},items:[{files:[{url:'https://private.test?token=print-secret'}]}]});
  });
  const d=await check(o);assert.equal(d.state,'found');assert.equal(d.order.id,'999');assert.equal(d.draftAttemptRecorded,true);assert.equal(d.readOnly,true);assert.equal(calls,1);assert.equal(o.counters.writes,0);
  for(const secret of ['provider-secret','print-secret','private@example.test','never disclose'])assert.ok(!JSON.stringify(d).includes(secret));
});
test('saved Printful ID lookup still verifies exact external reference',async t=>{
  const o=setup({job:{printfulOrderId:555}});t.mock.method(globalThis,'fetch',async url=>{assert.equal(url,'https://api.printful.com/orders/555');return json(200,{id:555,external_id:'somebody-else',status:'pending'});});
  assert.equal((await check(o)).state,'reference_mismatch');assert.equal(o.counters.writes,0);
});
for(const [code,state] of [[401,'authentication_error'],[403,'permission_error'],[404,'not_found_here'],[429,'rate_limited'],[400,'lookup_rejected'],[500,'lookup_rejected']]){
  test(`provider ${code} is distinguished without modifying the lock`,async t=>{
    const o=setup();t.mock.method(globalThis,'fetch',async()=>json(code,'private failure detail must not be echoed'));
    const d=await check(o);assert.equal(d.state,state);assert.equal(d.providerStatus,code);assert.equal(o.counters.writes,0);assert.ok(!JSON.stringify(d).includes('private failure detail'));
  });
}
test('an HTML 404 or interrupted lookup never proves the order absent',async t=>{
  const o=setup();t.mock.method(globalThis,'fetch',async()=>new Response('Not found',{status:404}));assert.equal((await check(o)).state,'unknown');
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('network secret')});assert.equal((await check(o)).state,'unknown');assert.equal(o.counters.writes,0);
});
test('too-long external IDs are explicitly flagged without changing or truncating the reference',async t=>{
  const id='1234567890123-12345678901234',o=setup({job:{id}});
  t.mock.method(globalThis,'fetch',async url=>{assert.ok(url.endsWith('@recast-'+id));return json(400,'Invalid external ID');});
  const d=await check(o,request(id));assert.equal(d.externalId,'recast-'+id);assert.equal(d.externalIdLength,35);assert.equal(d.externalIdValid,false);assert.equal(d.state,'lookup_rejected');assert.equal(o.counters.writes,0);
});
test('missing or invalid provider configuration never sends a cross-store lookup',async t=>{
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('No provider call expected');});
  assert.equal((await check(setup({env:{PRINTFUL_API_TOKEN:''}}))).state,'not_configured');
  assert.equal((await check(setup({env:{PRINTFUL_STORE_ID:''}}))).state,'store_not_configured');
  assert.equal((await check(setup({env:{PRINTFUL_STORE_ID:'wrong'}}))).state,'store_not_configured');
});
test('response is private and missing jobs stay absent without writes',async()=>{
  const o=setup();const r=await printfulDiagnosticRoute(request('absent-job'),o.env,{requireAdmin});assert.equal(r.status,404);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(o.counters.writes,0);
});
test('UI check passes no mutation options, renders text, and never enables blocked create',async t=>{
  const make=()=>({children:[],dataset:{},style:{},textContent:'',append(...x){this.children.push(...x)},setAttribute(){},addEventListener(event,fn){this[event]=fn;}});
  const previousDocument=globalThis.document;globalThis.document={createElement:make};t.after(()=>{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;});
  const create=make();create.textContent='Create Printful draft';const article=make();article.querySelectorAll=()=>[create];let calls=0;
  attachPrintfulDiagnostic(article,{id:'test-job',ownerReleaseError:'Draft submission already started; review Printful before retrying.'},async(path,options)=>{
    assert.equal(path,'/api/admin/job/test-job/printful-check');assert.equal(options,undefined);calls++;return{message:'Read-only result <b>not HTML</b>',configuredStoreId:'123',externalId:'recast-test-job',externalIdLength:15,externalIdValid:true,safety:'No writes'};
  });
  const [button,result]=article.children[0].children;assert.equal(create.disabled,true);await button.click();assert.equal(calls,1);assert.equal(create.disabled,true);assert.equal(button.disabled,false);assert.ok(result.textContent.includes('<b>not HTML</b>'));assert.equal(result.innerHTML,undefined);
});
