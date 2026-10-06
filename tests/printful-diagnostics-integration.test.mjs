import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {setup} from './security-helpers.mjs';

test('live router wires owner-only Printful check without storing or submitting anything', async t=>{
  const env=await setup({ADMIN_TOKEN:'owner-only',PRINTFUL_API_TOKEN:'provider-only',PRINTFUL_STORE_ID:'123'});
  await env.ARTWORK.put('jobs/test-job.json',JSON.stringify({id:'test-job',status:'owner_release_review'}));
  let writes=0,calls=0;
  env.ARTWORK.put=()=>{writes++;throw Error('Unexpected diagnostic write');};
  env.ARTWORK.delete=()=>{writes++;throw Error('Unexpected diagnostic deletion');};
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;assert.equal(url,'https://api.printful.com/orders/@recast-test-job');assert.equal(options.method,'GET');return Response.json({code:200,result:{id:999,external_id:'recast-test-job',status:'draft'}});});
  const url='https://recastmeai.com/api/admin/job/test-job/printful-check';
  const denied=await router.fetch(new Request(url),env,{});assert.equal(denied.status,401);assert.equal(calls,0);
  const response=await router.fetch(new Request(url,{headers:{authorization:'Bearer owner-only'}}),env,{});
  const data=await response.json();assert.equal(response.status,200);assert.equal(data.state,'found');assert.equal(data.readOnly,true);assert.equal(writes,0);assert.equal(calls,1);
});
