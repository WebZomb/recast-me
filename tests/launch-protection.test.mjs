import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyTurnstile} from '../src/highquality.js';
import {moderateContent,checkStoredArtwork} from '../src/content-safety.js';
import {setup,CLEAN} from './security-helpers.mjs';
import {visualVerdict,moderationVerdict} from './safety-fixtures.mjs';
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
test('Visual policy rejects nudity, vulgar pixels, uncertainty, refusal and incomplete results',async t=>{
  const env=await setup(safety);let result=visualVerdict();
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    if(url.endsWith('/moderations'))return Response.json(moderationVerdict());
    const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,200);assert.match(body.input[0].content[0].image_url,/^data:image/);
    return Response.json(result);
  });
  assert.equal((await moderateContent(env,{images:[photo()]})).status,'passed');
  for(const flag of ['nudity','vulgar','hate','sexual','graphic_violence']){
    result=visualVerdict({[flag]:true});await assert.rejects(moderateContent(env,{images:[photo()]}),{reason:'content_policy'});
  }
  for(const invalid of [visualVerdict({uncertain:true}),{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'refused'}]}]},visualVerdict({nudity:null})]){
    result=invalid;await assert.rejects(moderateContent(env,{images:[photo()]}),{reason:'content_screening_unavailable'});
  }
});
test('Visual screening reserves a bounded daily call budget before billable requests',async t=>{
  const env=await setup({...safety,CONTENT_SCREENING_DAILY_LIMIT:'1'});let calls=0;
  t.mock.method(globalThis,'fetch',async url=>{
    if(url.endsWith('/moderations'))return Response.json(moderationVerdict());
    calls++;throw new Error('ambiguous provider timeout');
  });
  for(let i=0;i<2;i++)await assert.rejects(moderateContent(env,{images:[photo()]}),{reason:'content_screening_unavailable'});
  assert.equal(calls,1);
});
test('Saved-artwork approval is cached by exact pixels and current policy; changed art is rechecked',async t=>{
  const env=await setup(safety);let checks=0,deny=false;
  t.mock.method(globalThis,'fetch',async url=>{
    if(url.endsWith('/moderations'))return Response.json(moderationVerdict());
    checks++;return Response.json(visualVerdict({vulgar:deny}));
  });
  const meta={requestId:'RC-SAFETY',previewMime:'image/jpeg'};
  await env.ARTWORK.put('requests/RC-SAFETY/preview.b64',CLEAN.toString('base64'));
  await checkStoredArtwork(env,meta);await checkStoredArtwork(env,meta);assert.equal(checks,1);
  deny=true;await env.ARTWORK.put('requests/RC-SAFETY/preview.b64',Buffer.from('changed').toString('base64'));
  await assert.rejects(checkStoredArtwork(env,meta),{reason:'content_policy'});assert.equal(checks,2);
});
