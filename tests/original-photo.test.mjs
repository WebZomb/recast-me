import test from 'node:test';import assert from 'node:assert/strict';
import router from '../src/router.js';
import {setup,CLEAN,MARKED} from './security-helpers.mjs';
import {mergeHistory,privateRecastLink,readRecastLink} from '../public/recast-history.js';
function upload({type='image/jpeg',consent='yes',origin='https://recast.test'}={}){const fd=new FormData();fd.set('photo',new File([CLEAN],'photo.jpg',{type}));fd.set('consent',consent);return new Request('https://recast.test/api/original-photo',{method:'POST',headers:{'x-recast-request':'1',origin},body:fd});}
test('original photo stores print source, returns only protected preview and never calls AI',async()=>{
  let calls=0;const env=await setup({AI:{run(){calls++;throw new Error('AI forbidden')}}});
  const r=await router.fetch(upload(),env,{}),d=await r.json();assert.equal(r.status,200);assert.equal(d.watermarked,true);assert.equal(d.qualityMode,'original');assert.equal(d.image,`data:image/jpeg;base64,${MARKED.toString('base64')}`);assert.equal(calls,0);
  const meta=await (await env.ARTWORK.get(`requests/${d.requestId}/request.json`)).json();assert.equal(meta.paid,false);assert.equal(meta.modelUsed,null);assert.equal(await (await env.ARTWORK.get(`requests/${d.requestId}/preview.b64`)).text(),CLEAN.toString('base64'));
  const denied=await router.fetch(new Request(`https://recast.test/api/request/${d.requestId}/preview?token=wrong`),env,{});assert.equal(denied.status,403);
});
test('original photo requires consent, supported image, same origin and any configured human check',async()=>{
  for(const [options,status] of [[{consent:'no'},400],[{type:'image/svg+xml'},400],[{origin:'https://evil.test'},403]]){const env=await setup();const r=await router.fetch(upload(options),env,{});assert.equal(r.status,status);}
  const env=await setup({TURNSTILE_SECRET_KEY:'test'});assert.equal((await router.fetch(upload(),env,{})).status,403);
});
test('original photo has independent bounded upload allowance and fails closed without watermark processing',async()=>{
  const env=await setup();for(let i=0;i<10;i++)assert.equal((await router.fetch(upload(),env,{})).status,200);assert.equal((await router.fetch(upload(),env,{})).status,429);
  const noImages=await setup({IMAGES:null});assert.equal((await router.fetch(upload(),noImages,{})).status,503);
});
test('history recovers last saved credential without duplicating or dropping four-version bound',()=>{
  const rows=[1,2,3,4].map(n=>({requestId:`RC-TEST000${n}-ABCDEF`,accessToken:`token${n}`}));
  assert.deepEqual(mergeHistory(rows,rows[2]),rows);
  const last={requestId:'RC-LATEST00-ABCDEF',accessToken:'last',style:'Space Explorer'};const restored=mergeHistory(rows,last);assert.equal(restored.length,4);assert.equal(restored[0].styleName,'Space Explorer');
});
test('recovery link keeps credentials in fragment and refuses a different site',()=>{
  const v={requestId:'RC-TEST0001-ABCDEF',accessToken:'private-token'};const link=privateRecastLink('https://recast.test',v);assert.equal(new URL(link).search,'');assert.deepEqual(readRecastLink(link,'https://recast.test'),v);assert.throws(()=>readRecastLink(link,'https://other.test'));assert.throws(()=>readRecastLink('https://recast.test/#recast=bad','https://recast.test'));
});
