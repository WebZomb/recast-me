import test from 'node:test';
import assert from 'node:assert/strict';
import {validPrintfulReference,printfulReferenceForNewDraft,printfulJobHash} from '../src/printful-reference.js';
import {printfulDiagnosticRoute} from '../src/printful-diagnostics.js';
const longId='1111111111111-22222222222222';
const old='recast-'+longId;
const auth=request=>{if(request.headers.get('authorization')!=='Bearer test-owner')throw Object.assign(Error('Denied'),{status:401});};
function fixture(id=longId,{claim={startedAt:'2026-10-06T04:00:00Z'},job={}}={}) {
  const state={reads:0,writes:0};
  const env={PRINTFUL_STORE_ID:'123',PRINTFUL_API_TOKEN:'fixture-secret',ARTWORK:{
    async get(key){state.reads++;if(key===`jobs/${id}.json`)return{json:async()=>({id,status:'owner_release_review',...job})};if(key.includes('-draft.json')&&claim)return{json:async()=>claim};return null;},
    put(){state.writes++;throw Error('No writes');},delete(){state.writes++;throw Error('No deletes');}
  }};
  const request=new Request(`https://recast.test/api/admin/job/${id}/printful-check`,{headers:{authorization:'Bearer test-owner'}});
  const run=async()=>{const response=await printfulDiagnosticRoute(request,env,{requireAdmin:auth});assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');return response.json();};
  return{env,state,request,run};
}
const provider=(code,result,paging)=>Response.json({code,result,...(paging?{paging}:{})},{status:code});
function fetchQueue(t,replies) {
  let index=0;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');assert.equal(options.headers['X-PF-Store-ID'],'123');
    assert.ok(index<replies.length,'No automatic repeated request');
    const [path,result]=replies[index++];assert.equal(url,'https://api.printful.com'+path);return typeof result==='function'?result():result;
  });return()=>index;
}
test('32-character reference hashes the entire long ID and is deterministic',async()=>{
  assert.equal(old.length,35);assert.equal(validPrintfulReference(old),false);
  const fixed=await printfulReferenceForNewDraft({id:longId});
  assert.equal(fixed.length,32);assert.equal(validPrintfulReference(fixed),true);
  assert.equal(fixed,await printfulReferenceForNewDraft({id:longId}));
  assert.notEqual(fixed,await printfulReferenceForNewDraft({id:longId+'9'}));
  const many=await Promise.all(Array.from({length:200},(_,n)=>printfulReferenceForNewDraft({id:longId+n})));
  assert.equal(new Set(many).size,200);assert.ok(many.every(validPrintfulReference));
});
test('existing valid and saved provider references are preserved, invalid saved IDs never replaced',async()=>{
  assert.equal(await printfulReferenceForNewDraft({id:'short'}),'recast-short');
  assert.equal(await printfulReferenceForNewDraft({id:longId,printfulExternalId:'original-valid'}),'original-valid');
  await assert.rejects(printfulReferenceForNewDraft({id:longId,printfulExternalId:old}),/owner review/);
  await assert.rejects(printfulReferenceForNewDraft({id:'../job'}),/Invalid/);
});
test('legacy invalid lookup uses bounded same-store read after 400 and keeps lock',async t=>{
  const f=fixture();const count=fetchQueue(t,[['/orders/@'+old,provider(400,'invalid')],['/orders?limit=100&offset=0',provider(200,[],{offset:0,limit:100,total:0})]]);
  const d=await f.run();assert.equal(d.state,'not_found_here');assert.equal(d.externalId,old);assert.equal(d.draftAttemptRecorded,true);assert.equal(d.externalIdValid,false);assert.deepEqual(d.storeScan,{checked:0,total:0,complete:true});assert.equal(count(),2);assert.equal(f.state.writes,0);
});
test('an existing legacy order is found by exact reference without attaching or auto-confirming',async t=>{
  const f=fixture();fetchQueue(t,[['/orders/@'+old,provider(404,'none')],['/orders?limit=100&offset=0',provider(200,[{id:99,external_id:old,store:123,status:'draft',recipient:{email:'private@example.test'},items:[{url:'secret-file'}]}],{offset:0,limit:100,total:1})]]);
  const d=await f.run();assert.equal(d.state,'found');assert.deepEqual(d.order,{id:'99',externalId:old,status:'draft'});assert.equal(f.state.writes,0);
  for(const secret of ['private@example.test','secret-file','fixture-secret'])assert.ok(!JSON.stringify(d).includes(secret));
});
test('incomplete list never establishes store-wide absence',async t=>{
  const f=fixture();fetchQueue(t,[['/orders/@'+old,provider(400,'invalid')],['/orders?limit=100&offset=0',provider(200,[{id:77,store:123,external_id:'other'}],{offset:0,limit:100,total:200})]]);
  const d=await f.run();assert.equal(d.state,'scan_incomplete');assert.equal(d.storeScan.complete,false);assert.equal(f.state.writes,0);
});
test('missing paging is incomplete even when a page is empty',async t=>{
  const f=fixture();fetchQueue(t,[['/orders/@'+old,provider(400,'invalid')],['/orders?limit=100&offset=0',provider(200,[])]]);assert.equal((await f.run()).state,'scan_incomplete');
});
test('wrong-store list is rejected instead of linking a match',async t=>{
  const f=fixture();fetchQueue(t,[['/orders/@'+old,provider(404,'none')],['/orders?limit=100&offset=0',provider(200,[{id:99,store:999,external_id:old,status:'draft'}],{offset:0,limit:100,total:1})]]);assert.equal((await f.run()).state,'reference_mismatch');assert.equal(f.state.writes,0);
});
test('saved new reference wins over legacy formula for subsequent diagnostics',async t=>{
  const ref=await printfulReferenceForNewDraft({id:longId});const f=fixture(longId,{claim:{externalId:ref},job:{printfulExternalId:ref,printfulOrderId:99}});
  fetchQueue(t,[['/orders/99',provider(200,{id:99,store:123,external_id:ref,status:'draft'})]]);const d=await f.run();assert.equal(d.state,'found');assert.equal(d.externalId,ref);assert.equal(f.state.writes,0);
});
test('saved job and claim references must agree before any provider call',async t=>{
  const f=fixture(longId,{claim:{externalId:'one'},job:{printfulExternalId:'two'}});
  t.mock.method(globalThis,'fetch',async()=>assert.fail('No provider request'));const r=await printfulDiagnosticRoute(f.request,f.env,{requireAdmin:auth});assert.equal(r.status,409);assert.equal(f.state.writes,0);
});
for(const code of [301,302,307,308])test(`redirect ${code} is blocked without following or leaking credentials`,async t=>{
  const f=fixture();const count=fetchQueue(t,[['/orders/@'+old,new Response(null,{status:code,headers:{location:'https://not-printful.test/?secret=do-not-echo'}})]]);
  const d=await f.run();assert.equal(d.state,'redirect_blocked');assert.equal(count(),1);assert.equal(f.state.writes,0);assert.ok(!JSON.stringify(d).includes('not-printful'));
});
for(const [code,state] of [[401,'authentication_error'],[403,'permission_error'],[429,'rate_limited'],[500,'lookup_rejected']])test(`${code} never causes blind fallback/retry`,async t=>{
  const f=fixture();const count=fetchQueue(t,[['/orders/@'+old,provider(code,'never echo raw data')]]);const d=await f.run();assert.equal(d.state,state);assert.equal(count(),1);assert.equal(f.state.writes,0);assert.ok(!JSON.stringify(d).includes('never echo'));
});
test('network failure and real timeout are distinguished without echoing exception text',async t=>{
  const f=fixture();fetchQueue(t,[['/orders/@'+old,()=>{throw Object.assign(Error('token=unsafe'),{name:'TimeoutError'});}]]);let d=await f.run();assert.equal(d.state,'unknown');assert.equal(d.lookupFailure,'timeout');assert.ok(!JSON.stringify(d).includes('unsafe'));
  fetchQueue(t,[['/orders/@'+old,()=>{throw TypeError('private url here');}]]);d=await f.run();assert.equal(d.lookupFailure,'request_error');assert.ok(!JSON.stringify(d).includes('private url'));
});
test('HTTP and JSON status disagreement is unknown, never absence',async t=>{
  const f=fixture();fetchQueue(t,[['/orders/@'+old,Response.json({code:404,result:'none'},{status:200})]]);assert.equal((await f.run()).state,'unknown');
});
test('unauthenticated request reads no storage and calls no provider',async t=>{
  const f=fixture();t.mock.method(globalThis,'fetch',async()=>assert.fail('No provider request'));
  const r=await printfulDiagnosticRoute(new Request(f.request.url),f.env,{requireAdmin:auth});assert.equal(r.status,401);assert.equal(f.state.reads,0);assert.equal(f.state.writes,0);
});
