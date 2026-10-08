import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyTurnstile} from '../src/highquality.js';
import {moderateContent,checkStoredArtwork} from '../src/content-safety.js';
import {setup,CLEAN} from './security-helpers.mjs';
import {moderationVerdict} from './safety-fixtures.mjs';
const turnstile={TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_SITE_KEY:'test-site'};
const context={action:'recast',hostname:'recast.test'};
const photo=()=>new File([CLEAN],'test.jpg',{type:'image/jpeg'});
const safety={CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'test'};

test('Turnstile binds a strict successful decision to the requested site and action',async t=>{
  let data={success:true,...context};
  t.mock.method(globalThis,'fetch',async(_,options)=>{assert.ok(options.signal);return Response.json(data)});
  assert.equal((await verifyTurnstile(turnstile,'token','',context)).success,true);
  for(const change of [{success:'true'},{success:false},{hostname:'evil.test'},{action:'original_photo'}]){
    data={success:true,...context,...change};assert.equal((await verifyTurnstile(turnstile,'token','',context)).success,false);
  }
});
test('Turnstile rejects missing configuration, invalid tokens and provider failures',async t=>{
  let calls=0;
  t.mock.method(globalThis,'fetch',async()=>{calls++;throw new Error('timeout')});
  for(const env of [{TURNSTILE_REQUIRED:'true'},{TURNSTILE_SITE_KEY:'site'},{TURNSTILE_SECRET_KEY:'secret'}])assert.equal((await verifyTurnstile(env,'token','',context)).success,false);
  for(const token of ['', 'x'.repeat(2049)])assert.equal((await verifyTurnstile(turnstile,token,'',context)).success,false);
  assert.equal(calls,0);
  assert.equal((await verifyTurnstile(turnstile,'token','',context)).success,false);
  assert.equal(calls,1);
});
test('Free screening calls only moderation and never falls back to paid inference',async t=>{
  const env=await setup(safety);let calls=0;
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    calls++;assert.equal(url,'https://api.openai.com/v1/moderations');
    assert.equal(JSON.parse(options.body).model,'omni-moderation-latest');
    return Response.json(moderationVerdict());
  });
  const result=await moderateContent(env,{images:[photo()]});
  assert.equal(result.status,'passed');assert.equal(result.policy,'baseline-moderation-3');assert.equal(calls,1);
});
test('Free screening caps attempts and fails closed on HTTP errors without paid fallback',async t=>{
  const env=await setup({...safety,CONTENT_SCREENING_DAILY_LIMIT:'1'});let calls=0;
  t.mock.method(globalThis,'fetch',async url=>{
    assert.equal(url,'https://api.openai.com/v1/moderations');calls++;
    return new Response('',{status:429});
  });
  for(let i=0;i<2;i++)await assert.rejects(moderateContent(env,{images:[photo()]}),{reason:'content_screening_unavailable'});
  assert.equal(calls,1);
});
test('Saved-artwork approval is cached by exact pixels and current policy; changed art is rechecked',async t=>{
  const env=await setup(safety);let checks=0,deny=false;
  t.mock.method(globalThis,'fetch',async url=>{
    assert.ok(url.endsWith('/moderations'));checks++;return Response.json(moderationVerdict({sexual:deny}));
  });
  const meta={requestId:'RC-SAFETY',previewMime:'image/jpeg'};
  await env.ARTWORK.put('requests/RC-SAFETY/preview.b64',CLEAN.toString('base64'));
  await checkStoredArtwork(env,meta);await checkStoredArtwork(env,meta);assert.equal(checks,1);
  deny=true;await env.ARTWORK.put('requests/RC-SAFETY/preview.b64',Buffer.from('changed').toString('base64'));
  await assert.rejects(checkStoredArtwork(env,meta),{reason:'content_policy'});assert.equal(checks,2);
});
