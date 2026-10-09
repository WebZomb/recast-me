import test from 'node:test';import assert from 'node:assert/strict';
import router from '../src/router.js';import {standardOutageEligible} from '../src/render-health.js';
import {fallbackState} from '../public/quality-policy.js';
import {Bucket,CLEAN,MARKED,imageMock} from './security-helpers.mjs';
import {moderationVerdict} from './safety-fixtures.mjs';
const origin='https://recast.test',FAL='@cf/black-forest-labs/flux-2-dev',QUICK='@cf/black-forest-labs/flux-2-klein-9b';
const hdr=(cookie='')=>({'origin':origin,'x-recast-request':'1','cf-connecting-ip':'198.51.100.44',...(cookie?{'cookie':cookie}:{})});
const records=(env,action='failed')=>Promise.all(['fal','cloudflare'].map(host=>env.ARTWORK.put('system/providers/hq-'+host+'.json',JSON.stringify({host,status:action,reason:'unavailable',lastFailureAt:new Date().toISOString(),lastSuccessAt:null,checkedAt:new Date().toISOString()}))));
function env(extra={}){const calls=[];const e={ARTWORK:new Bucket(),IMAGES:imageMock(),CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'OFFLINE-TEST',RECAST_HQ_PROVIDER:'auto',FAL_PROVIDER_ENABLED:'true',FAL_API_KEY:'TEST_LOCAL_NEVER_REAL_PROVIDER_KEY',FAL_PROVIDER_VERIFIED:'true',CF_PROVIDER_VERIFIED:'true',RENDER_CREDITS_ENABLED:'true',RENDER_CREDITS_STORAGE_SALT:'true',HQ_FREE_ALLOWANCE:'3',STANDARD_FREE_ALLOWANCE:'5',AI_DAILY_CALL_LIMIT:'70',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7',IMAGE_MODEL_HIGH_QUALITY:FAL,IMAGE_MODEL_QUICK:QUICK,IMAGE_HIGH_QUALITY_STEPS:'18',IMAGE_HIGH_QUALITY_GUIDANCE:'5',IMAGE_QUICK_GUIDANCE:'5',IMAGE_QUICK_STEPS:'12',AI:{run:async(model)=>{calls.push(model);return {image:CLEAN.toString('base64')}}},...extra};return {e,calls};}
async function wallet(e){const r=await router.fetch(new Request(origin+'/api/render-credits',{method:'POST',headers:hdr()}),e,{});assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0]}
async function credits(e,cookie){const r=await router.fetch(new Request(origin+'/api/render-credits',{headers:hdr(cookie)}),e,{});return r.json()}
function submission(cookie,{consent=true,id='STANDARD-OUTAGE-0001'}={}){const f=new FormData();f.set('style','royal');f.set('subject','pet');f.set('qualityMode','quick');f.set('notes','Blue royal cape');f.set('image_0',new File([CLEAN],'reference.jpg',{type:'image/jpeg'}));f.set('clientAttemptId',id);if(consent)f.set('standardOutageConsent','yes');return new Request(origin+'/api/transform-v2',{method:'POST',headers:hdr(cookie),body:f})}
const moderate=t=>t.mock.method(globalThis,'fetch',async(url)=>{assert.equal(String(url),'https://api.openai.com/v1/moderations');return Response.json(moderationVerdict())});
test('Fal-first healthy, or verified Cloudflare backup healthy, never exposes Standard early',async()=>{
 const {e}=env(),f=new FormData();f.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));
 await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 await e.ARTWORK.put('system/providers/hq-cloudflare.json',JSON.stringify({status:'success',lastSuccessAt:new Date().toISOString()}));
 assert.equal(await standardOutageEligible(e),false);
 const ready=await(await router.fetch(new Request(origin+'/api/render-readiness'),e,{})).json();assert.equal(ready.standardOutageAvailable,false);
 await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'failed',reason:'unavailable',lastFailureAt:new Date().toISOString()}));
 assert.equal(await standardOutageEligible(e),false); // Cloudflare is still approved.
});
test('Both HQ providers failed: explicit Standard warning, opt-in, independent credit balance and existing protected flow',async t=>{
 const {e,calls}=env();moderate(t);const cookie=await wallet(e);
 await records(e);
 const ready=await(await router.fetch(new Request(origin+'/api/render-readiness'),e,{})).json();
 assert.equal(ready.modes.high.ready,false);assert.equal(ready.modes.quick.ready,true);assert.equal(ready.standardOutageAvailable,true);
 const opt=fallbackState(ready,await credits(e,cookie));
 assert.equal(opt.show,true);assert.equal(opt.outage,true);assert.equal(opt.exhausted,false);assert.equal(opt.standardReady,true);
 assert.match(opt.message,/Cloudflare model/);assert.match(opt.message,/weaker likeness/);assert.match(opt.message,/also fail/);
 const response=await router.fetch(submission(cookie),e,{}),data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data).slice(0,900));assert.equal(data.qualityMode,'quick');assert.equal(data.watermarked,true);
 assert.equal(data.image,'data:image/jpeg;base64,'+MARKED.toString('base64'));
 assert.deepEqual(calls,[QUICK]); // Never sent to two HQ hosts or billed twice.
 const balance=await credits(e,cookie);assert.equal(balance.remaining,3);assert.equal(balance.standardRemaining,4);
 const raw=await e.ARTWORK.get('requests/'+data.requestId+'/preview.b64');assert.equal(await raw.text(),CLEAN.toString('base64'));
});
test('Client consent without verified outage is rejected before any provider or credit charge',async t=>{
 const {e,calls}=env();moderate(t);const cookie=await wallet(e),r=await router.fetch(submission(cookie,{id:'FORGED-OUTAGE-001'}),e,{});
 assert.equal(r.status,409);assert.equal((await r.json()).error,'standard_outage_not_available');assert.deepEqual(calls,[]);
 const c=await credits(e,cookie);assert.equal(c.remaining,3);assert.equal(c.standardRemaining,5);
});
test('HQ outage without explicit Standard consent does not bypass normal HQ-first credit rule',async t=>{
 const {e,calls}=env();moderate(t);await records(e);const cookie=await wallet(e);
 const r=await router.fetch(submission(cookie,{consent:false,id:'NO-CONSENT-001'}),e,{});
 assert.equal(r.status,409);assert.equal((await r.json()).error,'standard_locked');assert.deepEqual(calls,[]);
 const c=await credits(e,cookie);assert.equal(c.remaining,3);assert.equal(c.standardRemaining,5);
});
test('Standard failure restores its credit; disabled or failed Quick route offers no downgrade',async t=>{
 const {e,calls}=env({AI:{run:async(model)=>{calls.push(model);throw Error('503 upstream unavailable')}}});moderate(t);await records(e);
 const cookie=await wallet(e),r=await router.fetch(submission(cookie,{id:'QUICK-FAIL-001'}),e,{});
 assert.equal(r.status,503);assert.deepEqual(calls,[QUICK]);
 const balance=await credits(e,cookie);assert.equal(balance.remaining,3);assert.equal(balance.standardRemaining,5);
 assert.equal(await standardOutageEligible(e),false); // After Quick fails its cooldown is active.
 const status=await(await router.fetch(new Request(origin+'/api/render-readiness'),e,{})).json();assert.equal(status.standardOutageAvailable,false);
});
test('Moderation-like provider failure never unlocks Standard as a way around safety',async()=>{
 const {e}=env();await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'failed',reason:'moderation',lastFailureAt:new Date().toISOString()}));
 await e.ARTWORK.put('system/providers/hq-cloudflare.json',JSON.stringify({status:'failed',reason:'moderation',lastFailureAt:new Date().toISOString()}));
 assert.equal(await standardOutageEligible(e),false);
});
test('User interface requires an explicit Standard click; unknown readiness never offers an unverified downgrade',()=>{
 const snapshot={local:{ready:true},modes:{high:{ready:false,reason:'unavailable'},quick:{ready:true}},standardOutageAvailable:true};
 const known={enabled:true,remaining:3,standardRemaining:5};
 assert.equal(fallbackState(snapshot,known).standardReady,true);
 assert.equal(fallbackState({...snapshot,standardOutageAvailable:false},known).show,false);
 assert.equal(fallbackState({...snapshot,local:{ready:false}},known).standardReady,false);
 assert.equal(fallbackState(snapshot,null).show,false);
 assert.equal(fallbackState(snapshot,known,'quick').returnToHigh,false);
});
