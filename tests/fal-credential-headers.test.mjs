import test from 'node:test';
import assert from 'node:assert/strict';
import {runFalEdit} from '../src/fal-service.js';
import {Bucket,CLEAN} from './security-helpers.mjs';

const MODEL='@cf/black-forest-labs/flux-2-dev';
const JOB='01a12144-4584-77e3-9a1a-71127fe21011';
const ROOT='https://queue.fal.run/fal-ai/flux-2/requests/'+JOB;
function args(){
 const form=new FormData();
 form.set('prompt','Same dog, royal blue cape and palace courtyard');
 form.set('width','1024');form.set('height','1280');
 form.set('steps','18');form.set('guidance','5');
 form.set('input_image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));
 const b=new Response(form);
 return {multipart:{body:b.body,contentType:b.headers.get('content-type')}};
}
const secret='MOCK-FAL-OWNER-TEST-NOT-A-REAL-KEY';
const configured=key=>({FAL_API_KEY:key,FAL_PROVIDER_ENABLED:'true',ARTWORK:new Bucket(),RECAST_PROVIDER_ATTEMPT_ID:'HEADER-NORMALIZE-TEST-001'});
test('Live-like redirected key with trailing CRLF/whitespace is normalized before every fal request header',async t=>{
 const env=configured(secret+'  \r\n \r\n');
 const requests=[];
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  const h=new Headers(options.headers);
  assert.equal(h.get('Authorization'),'Key '+secret);
  assert.equal(h.get('X-Fal-No-Retry'),options.method==='POST'?'1':null);
  requests.push({url:String(url),authHeaderChecked:true});
  if(String(url)==='https://queue.fal.run/fal-ai/flux-2/edit')return Response.json({request_id:JOB,status_url:ROOT+'/status',response_url:ROOT});
  if(String(url)===ROOT+'/status')return Response.json({status:'COMPLETED'});
  if(String(url)===ROOT)return Response.json({images:[{url:'data:image/jpeg;base64,'+CLEAN.toString('base64'),width:1024,height:1280}],has_nsfw_concepts:[false]});
  throw Error('Unexpected network call '+url);
 });
 const generated=await runFalEdit(env,MODEL,args());
 assert.equal(generated.providerUsed,'fal');
 assert.equal(generated.providerRequestId,JOB);
 assert.deepEqual(requests.map(x=>x.url),[
 'https://queue.fal.run/fal-ai/flux-2/edit',ROOT+'/status',ROOT]);
 const saved=await env.ARTWORK.get('system/providers/fal-jobs/HEADER-NORMALIZE-TEST-001.json');
 assert.equal((await saved.json()).status,'completed');
});
test('Key with internal newline or control characters fails closed without provider submission or job claim',async t=>{
 const env=configured(secret.slice(0,10)+'\n'+secret.slice(10));
 let called=0;t.mock.method(globalThis,'fetch',async()=>{called++;throw Error('must not reach network')});
 await assert.rejects(runFalEdit(env,MODEL,args()),{reason:'configuration'});
 assert.equal(called,0);
 const ledger=await env.ARTWORK.list({prefix:'system/providers/fal-jobs/'});
 assert.equal(ledger.objects.length,0);
});
