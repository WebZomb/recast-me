import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import { Bucket, CLEAN, MARKED, imageMock, submission, setup, ID, TOKEN, PRINT } from './security-helpers.mjs';

function runtime(t, extras={}) {
  const calls=[];
  t.mock.method(globalThis, 'fetch', async()=>{throw new Error('Unexpected live network call in mocked integration test');});
  const env={ARTWORK:new Bucket(),IMAGES:imageMock(),ADMIN_TOKEN:'owner-test-secret',AI:{async run(model,input){calls.push({model,input});return {image:CLEAN.toString('base64')};}},...extras};
  return {env,calls};
}
const get=(path)=>new Request(`https://recast.test${path}`);
async function render(env, options) {
  const response=await router.fetch(submission(options),env,{});
  const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data;
}

test('real router: create and restore never deliver stored clean output or service credentials',async t=>{
  const {env,calls}=runtime(t);const result=await render(env);
  assert.equal(result.image,`data:image/jpeg;base64,${MARKED.toString('base64')}`);assert.equal(calls.length,1);
  const raw=await env.ARTWORK.get(`requests/${result.requestId}/preview.b64`);assert.equal(await raw.text(),CLEAN.toString('base64'));
  const key=`requests/${result.requestId}/request.json`,meta=await (await env.ARTWORK.get(key)).json();
  meta.printAccessToken='never-expose-this';await env.ARTWORK.put(key,JSON.stringify(meta));
  const restored=await router.fetch(get(`/api/request/${result.requestId}/preview?token=${result.accessToken}`),env,{});
  assert.equal((await restored.json()).image,result.image);
  const metadata=await router.fetch(get(`/api/request/${result.requestId}?token=${result.accessToken}`),env,{});
  const text=await metadata.text();assert.ok(!text.includes('never-expose-this'));assert.ok(!text.includes(result.accessToken));
});

test('real router: replay cannot invoke another AI call',async t=>{
  const {env,calls}=runtime(t);await render(env);
  const replay=await router.fetch(submission(),env,{});
  assert.equal(replay.status,409);assert.equal(calls.length,1);
});

test('real router: missing Images fails before either generation alias invokes inference',async t=>{
  const {env,calls}=runtime(t,{IMAGES:undefined});
  for(const path of ['/api/transform','/api/transform-v2']) {
    const response=await router.fetch(submission({path}),env,{});assert.equal(response.status,503);
  }
  assert.equal(calls.length,0);
});

test('real router: authenticated owner tests share the configured AI call ceiling',async t=>{
  const {env,calls}=runtime(t,{AI_DAILY_CALL_LIMIT:'1'});
  await render(env,{path:'/api/admin/model-test?model=klein4',admin:true,id:'OWNER-ONE'});
  const response=await router.fetch(submission({id:'PUBLIC-TWO'}),env,{});
  assert.equal(response.status,429);assert.equal(calls.length,1);assert.equal(calls[0].model,'@cf/black-forest-labs/flux-2-klein-4b');
});

test('real router: refinement receives private previous art, not the delivered watermark',async t=>{
  const {env,calls}=runtime(t);const first=await render(env);
  const form=await submission({id:'REFINE-TWO'}).formData();
  form.set('branchRequestId',first.requestId);form.set('branchAccessToken',first.accessToken);
  form.set('branchPreview',new File([MARKED],'browser.jpg',{type:'image/jpeg'}));
  const response=await router.fetch(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env,{});
  assert.equal(response.status,200);assert.equal(calls.length,2);
  const multipart=calls[1].input.multipart;
  const providerForm=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
  const refs=[...providerForm.keys()].filter(k=>k.startsWith('input_image_'));
  assert.deepEqual(Buffer.from(await providerForm.get(refs.at(-1)).arrayBuffer()),CLEAN);
});

test('real router: paid digital entitlement releases only that exact saved original',async t=>{
  const {env}=runtime(t);const first=await render(env);
  const url=`/api/digital-download/${first.requestId}?token=${first.accessToken}`;
  assert.equal((await router.fetch(get(url),env,{})).status,403);
  const key=`requests/${first.requestId}/request.json`,meta=await (await env.ARTWORK.get(key)).json();
  meta.paid=true;meta.digitalEntitlement='RECAST-DIGITAL-HD';await env.ARTWORK.put(key,JSON.stringify(meta));
  const paid=await router.fetch(get(url),env,{});assert.equal(paid.status,200);
  assert.deepEqual(Buffer.from(await paid.arrayBuffer()),CLEAN);assert.match(paid.headers.get('cache-control'),/no-store/);
  assert.equal((await router.fetch(get(`/api/digital-download/${first.requestId}?token=wrong`),env,{})).status,403);
});

test('real router: legacy product mockups and social images are reprotected',async t=>{
  runtime(t);const env=await setup();const share='a'.repeat(40),sku='RECAST-MUG-11OZ';
  await env.ARTWORK.put(`social/shares/${share}.json`,JSON.stringify({requestId:ID}));
  await env.ARTWORK.put(`social/previews/${share}.jpg`,CLEAN);
  await env.ARTWORK.put(`mockups/${ID}/${sku}/task.json`,JSON.stringify({mockupAccessToken:'mock-token'}));
  await env.ARTWORK.put(`mockups/${ID}/${sku}/image-0.jpg`,CLEAN);
  for(const path of [`/api/social/${share}/image`,`/api/mockup/image/${ID}/${sku}/0?token=mock-token`]) {
    const response=await router.fetch(get(path),env,{});assert.equal(response.status,200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),MARKED);
  }
  const response=await router.fetch(get(`/api/print-source/${ID}?token=${PRINT}`),env,{});
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),MARKED);
  assert.equal((await router.fetch(get(`/api/print-source/${ID}?token=${PRINT}&final=1`),env,{})).status,403);
});

test('real router: operational diagnostics no longer accept anonymous visitors',async t=>{
  const {env,calls}=runtime(t);
  for(const path of ['/api/shopify-status','/api/printful-status','/api/storage-test','/api/ai-test']) {
    const response=await router.fetch(get(path),env,{});assert.equal(response.status,401);
  }
  const response=await router.fetch(new Request('https://recast.test/api/ai-test',{method:'POST',headers:{authorization:'Bearer owner-test-secret'}}),env,{});
  assert.equal(response.status,410);assert.equal(calls.length,0);
});

test('real router: readiness costs zero AI calls',async t=>{const {env,calls}=runtime(t);const response=await router.fetch(get('/api/render-readiness'),env,{});const data=await response.json();assert.equal(response.status,200);assert.equal(data.costsAiCall,false);assert.equal(data.local.ready,true);assert.equal(data.modes.high.ready,true);assert.equal(calls.length,0)});
test('real router: readiness fails closed without Images',async t=>{const {env,calls}=runtime(t,{IMAGES:undefined});const response=await router.fetch(get('/api/render-readiness'),env,{});const data=await response.json();assert.equal(response.status,503);assert.ok(data.local.missing.includes('IMAGES'));assert.equal(calls.length,0)});
test('real router: HQ circuit blocks direct POST while Quick stays ready',async t=>{const {env,calls}=runtime(t);await env.ARTWORK.put('system/render-health-high.json',JSON.stringify({mode:'high',status:'failed',reason:'capacity',retryAt:new Date(Date.now()+60000).toISOString()}));const ready=await (await router.fetch(get('/api/render-readiness'),env,{})).json();assert.equal(ready.modes.high.ready,false);assert.equal(ready.modes.quick.ready,true);const response=await router.fetch(submission({id:'BLOCKED-HQ'}),env,{});assert.equal(response.status,503);assert.equal(calls.length,0)});
test('real router: expired cooldown reopens without probe inference',async t=>{const {env,calls}=runtime(t);await env.ARTWORK.put('system/render-health-high.json',JSON.stringify({mode:'high',status:'failed',reason:'capacity',retryAt:new Date(Date.now()-1000).toISOString()}));const ready=await (await router.fetch(get('/api/render-readiness'),env,{})).json();assert.equal(ready.modes.high.ready,true);assert.equal(calls.length,0)});
