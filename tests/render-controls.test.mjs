import test from 'node:test';import assert from 'node:assert/strict';
import {guardedEnvironment,reserveAiCall,renderControlStatus,submissionFingerprint} from '../src/render-controls.js';
import {Bucket,submission} from './security-helpers.mjs';

test('no owner-selected call limit is invented',async()=>{
 const env={ARTWORK:new Bucket()};assert.equal(renderControlStatus(env).configured,false);assert.deepEqual(await reserveAiCall(env),{enforced:false});assert.equal(env.ARTWORK.objects.size,0);
});
test('zero cap blocks every new AI submission',async()=>{await assert.rejects(reserveAiCall({ARTWORK:new Bucket(),AI_DAILY_CALL_LIMIT:'0'}),e=>e.code==='daily_ai_call_limit')});
test('malformed configuration fails closed',async()=>{for(const n of ['-1','NaN','2.5','Infinity','99999999','02'])await assert.rejects(reserveAiCall({ARTWORK:new Bucket(),AI_DAILY_CALL_LIMIT:n}),e=>e.code==='render_limit_config')});
test('simultaneous reservations cannot exceed the shared cap',async()=>{
 const env={ARTWORK:new Bucket(),AI_DAILY_CALL_LIMIT:'3'};
 const outcomes=await Promise.allSettled(Array.from({length:20},()=>reserveAiCall(env)));
 assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,3);
 const ledger=[...env.ARTWORK.objects.values()][0];assert.equal(JSON.parse(ledger.bytes).used,3);
});
test('UTC next day gets an independent ledger',async()=>{
 const env={ARTWORK:new Bucket(),AI_DAILY_CALL_LIMIT:'1'};await reserveAiCall(env,Date.parse('2026-09-29T23:59:59Z'));
 await assert.rejects(reserveAiCall(env,Date.parse('2026-09-29T23:59:59Z')),e=>e.retryAt==='2026-09-30T00:00:00.000Z');
 await reserveAiCall(env,Date.parse('2026-09-30T00:00:00Z'));assert.equal(env.ARTWORK.objects.size,2);
});
test('provider errors and timeouts still consume their reserved slot',async()=>{
 let calls=0;const env={ARTWORK:new Bucket(),AI_DAILY_CALL_LIMIT:'1',AI:{async run(){calls++;throw Error('timeout')}}};
 const g=guardedEnvironment(env);await assert.rejects(g.env.AI.run('dev'));await assert.rejects(g.env.AI.run('dev'),e=>e.code==='daily_ai_call_limit');assert.equal(calls,1);
});
test('each permitted same-model retry is separately counted',async()=>{
 let calls=0;const g=guardedEnvironment({ARTWORK:new Bucket(),AI_DAILY_CALL_LIMIT:'2',AI:{async run(){return ++calls}}},'same-client');
 assert.equal(await g.env.AI.run('dev'),1);assert.equal(await g.env.AI.run('dev'),2);await assert.rejects(g.env.AI.run('dev'));assert.equal(calls,2);
});
test('durable identical-submission claim works across distinct invocations',async()=>{
 let calls=0;const env={ARTWORK:new Bucket(),AI:{async run(){return ++calls}}};
 const outcomes=await Promise.allSettled(Array.from({length:10},()=>guardedEnvironment(env,'same-client').env.AI.run('dev')));
 assert.equal(calls,1);assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);
});
test('counter storage failure prevents the provider call',async()=>{
 let calls=0;const env={ARTWORK:{async get(){throw Error('offline')}},AI_DAILY_CALL_LIMIT:'5',AI:{async run(){calls++}}};
 const g=guardedEnvironment(env);await assert.rejects(g.env.AI.run('dev'));assert.equal(calls,0);assert.equal(g.state.blocked.code,'render_control_unavailable');
});
test('corrupt ledger does not reset the allowance',async()=>{
 const bucket=new Bucket();await bucket.put('security/ai-calls/2026-09-29.json',JSON.stringify({day:'2026-09-29',used:-4}));
 await assert.rejects(reserveAiCall({ARTWORK:bucket,AI_DAILY_CALL_LIMIT:'5'},Date.parse('2026-09-29')),e=>e.code==='render_limit_storage');
});
test('multipart boundaries and refreshed bot challenges do not defeat deduplication',async()=>{
 const a=await submission().formData(),b=await submission().formData();a.set('turnstileToken','first');b.set('turnstileToken','second');
 assert.equal(await submissionFingerprint(a,'/api/transform-v2'),await submissionFingerprint(b,'/api/transform-v2'));
 b.set('notes','A different deliberate request');assert.notEqual(await submissionFingerprint(a,'/api/transform-v2'),await submissionFingerprint(b,'/api/transform-v2'));
});
test('legacy requests without client ID are explicitly not claimed',async()=>{assert.equal(await submissionFingerprint(await submission({id:null}).formData(),'/api/transform-v2'),null)});
