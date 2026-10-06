import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Miniflare,Response as MFResponse} from 'miniflare';
// Real workerd Request/fetch; all outbound requests terminate in this fixture.
// The locked SDK uses workers[].config.manifest and dev.outboundService.
// Never forward unmatched requests. cf:false disables external CF metadata fetch.
test('workerd reproduces unsupported redirect:error, then performs authenticated manual GET and rejects redirects',async()=>{
  const reference=readFileSync(new URL('../src/printful-reference.js',import.meta.url),'utf8');
  const diagnostic=readFileSync(new URL('../src/printful-diagnostics.js',import.meta.url),'utf8').replace(/^import [^\n]+\n/,'');
  const script=reference+'\n'+diagnostic+`
export default {async fetch(request){
  if(new URL(request.url).pathname==='/baseline'){
    try{new Request('https://api.printful.com/orders/@recast-edge-job',{redirect:'error'});return Response.json({rejected:false});}
    catch(error){return Response.json({rejected:true,message:error.message});}
  }
  let writes=0;
  const env={PRINTFUL_API_TOKEN:'edge-fixture-only',PRINTFUL_STORE_ID:'123',ARTWORK:{
    async get(key){if(key==='jobs/edge-job.json')return{json:async()=>({id:'edge-job',status:'owner_release_review'})};return null;},
    put(){writes++;throw Error('Diagnostic cannot write');},delete(){writes++;throw Error('Diagnostic cannot delete');}
  }};
  const response=await printfulDiagnosticRoute(request,env,{requireAdmin(r){if(r.headers.get('authorization')!=='Bearer owner-fixture-only')throw Object.assign(Error('denied'),{status:401});}});
  const value=await response.json();return Response.json({...value,observedWrites:writes},{status:response.status});
}};`;
  const pending=[];let calls=0;
  const outboundService=async request=>{
    calls++;
    assert.equal(request.url,'https://api.printful.com/orders/@recast-edge-job');
    assert.equal(request.method,'GET');
    assert.equal(request.headers.get('authorization'),'Bearer edge-fixture-only');
    assert.equal(request.headers.get('x-pf-store-id'),'123');
    const response=pending.shift();
    assert.ok(response,'Unexpected outbound request is blocked, never forwarded');
    return response;
  };
  const mf=new Miniflare({
    cf:false,
    workers:[{
      config:{
        name:'printful-diagnostic',
        compatibilityDate:'2026-09-23',
        manifest:{mainModule:'index.js',modules:{'index.js':{type:'esm',contents:script}}}
      },
      dev:{outboundService:{type:'fetcher',handler:outboundService}}
    }]
  });
  try{
    const baseline=await(await mf.dispatchFetch('http://localhost/baseline')).json();
    assert.equal(baseline.rejected,true);assert.match(baseline.message,/redirect/i);
    assert.equal(calls,0);
    const url='http://localhost/api/admin/job/edge-job/printful-check';
    assert.equal((await mf.dispatchFetch(url)).status,401);assert.equal(calls,0);
    pending.push(new MFResponse(JSON.stringify({code:200,result:{id:55,external_id:'recast-edge-job',store:123,status:'draft'}}),{status:200,headers:{'content-type':'application/json'}}));
    let d=await(await mf.dispatchFetch(url,{headers:{authorization:'Bearer owner-fixture-only'}})).json();
    assert.equal(d.state,'found');assert.equal(d.observedWrites,0);assert.equal(d.providerRequestCount,1);assert.equal(calls,1);
    pending.push(new MFResponse(null,{status:302,headers:{location:'https://not-printful.invalid/never-follow'}}));
    d=await(await mf.dispatchFetch(url,{headers:{authorization:'Bearer owner-fixture-only'}})).json();
    assert.equal(d.state,'redirect_blocked');assert.equal(d.observedWrites,0);assert.equal(d.providerRequestCount,1);assert.equal(calls,2);
    assert.equal(pending.length,0);
  }finally{await mf.dispose();}
});
