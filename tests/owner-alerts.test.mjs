import test from 'node:test';
import assert from 'node:assert/strict';
import {setup} from './security-helpers.mjs';
import {read} from '../src/commerce-store.js';
import {requireAdmin} from '../src/workflow.js';
import {ownerAlertRoute,alertSettings,validateAlertSettings,sendOwnerAlerts,deliverOwnerAlert} from '../src/owner-alerts.js';
const key='system/owner-alert-settings.json';
function req(path='/api/admin/alert-settings',body,auth=true){return new Request('https://recast.test'+path,{method:body?'POST':'GET',headers:{'x-recast-request':'1',...(auth?{authorization:'Bearer owner-test-secret'}:{})},...(body?{body:JSON.stringify(body)}:{})})}
async function configure(env,extra={}){const s=await alertSettings(env);const values={...s.values,email:'owner@example.com',emailEnabled:true,consent:true,...extra};const r=await ownerAlertRoute(req(undefined,{revision:s.revision,values}),env,requireAdmin);assert.equal(r.status,200);return alertSettings(env)}
async function mock(run,handler=()=>Response.json({id:'email-fixture'})){const old=globalThis.fetch;let calls=[];globalThis.fetch=async(url,opts)=>{calls.push({url:String(url),...opts});return handler(url,opts)};try{await run(calls)}finally{globalThis.fetch=old}}
async function base(){return setup({ALERT_RESEND_API_KEY:'fixture-secret',ALERT_EMAIL_FROM:'Recast <alerts@example.com>'})}
test('settings are private, revision guarded and validate destinations/permission',async()=>{
 const env=await setup();assert.equal((await ownerAlertRoute(req(undefined,undefined,false),env,requireAdmin)).status,401);
 const s=await alertSettings(env);assert.equal(s.values.emailEnabled,false);assert.equal(s.values.smsEnabled,false);
 for(const v of [{email:'a@example.com,b@example.com'},{phone:'2125551234'},{dailyLimit:0},{emailEnabled:true,email:'a@example.com',consent:false}])assert.throws(()=>validateAlertSettings({...s.values,...v}));
 const result=await configure(env,{phone:'+1 (212) 555-1234'});assert.equal(result.values.phone,'+12125551234');
 assert.equal((await ownerAlertRoute(req(undefined,{revision:0,values:result.values}),env,requireAdmin)).status,409);
 const response=await ownerAlertRoute(req(),env,requireAdmin);assert.match(response.headers.get('cache-control'),/private/);assert.deepEqual((await response.json()).readiness,{email:false,sms:false});
});
test('saving destinations does not send; provider secrets are not returned',async()=>{
 const env=await base();await mock(async calls=>{await configure(env);assert.equal(calls.length,0)});
 const response=await ownerAlertRoute(req(),env,requireAdmin);assert.doesNotMatch(await response.text(),/fixture-secret/);
});
test('repeated and changing batches notify once per problem without private order details',async()=>{
 const env=await base();await configure(env);await env.ARTWORK.put('jobs/1.json',JSON.stringify({id:'one',status:'auto_print_review',autoPrintError:'secret-token',recipient:{email:'customer@example.com'}}));
 await mock(async calls=>{await sendOwnerAlerts(env);await sendOwnerAlerts(env);assert.equal(calls.length,1);await env.ARTWORK.put('jobs/2.json',JSON.stringify({id:'two',status:'payment_hold'}));await sendOwnerAlerts(env);assert.equal(calls.length,2);assert.match(JSON.parse(calls[1].body).text,/1 alert/);assert.doesNotMatch(JSON.stringify(calls),/secret-token|customer@example.com/);assert.ok(calls[0].headers['Idempotency-Key']);});
});
test('concurrent same-incident dispatch cannot send twice',async()=>{
 const env=await base();await configure(env);await env.ARTWORK.put('jobs/1.json',JSON.stringify({id:'one',status:'payment_hold'}));
 await mock(async calls=>{await Promise.all([sendOwnerAlerts(env),sendOwnerAlerts(env)]);assert.equal(calls.length,1)});
});
test('SMS timeout stays unknown and is not blindly retried',async()=>{
 const env=await setup({ALERT_TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),ALERT_TWILIO_AUTH_TOKEN:'fixture',ALERT_SMS_FROM:'+12125550111'});await configure(env,{emailEnabled:false,smsEnabled:true,phone:'+12125550123'});await env.ARTWORK.put('jobs/1.json',JSON.stringify({id:'one',status:'payment_hold'}));
 await mock(async calls=>{await sendOwnerAlerts(env);await sendOwnerAlerts(env);assert.equal(calls.length,1);assert.match(calls[0].url,/api.twilio.com/);assert.equal(new URLSearchParams(calls[0].body).get('To'),'+12125550123');assert.equal((await read(env,'system/alert-last-sms.json')).status,'unknown')},()=>{throw Error('timeout')});
});
test('daily cap blocks new sends and disabling or editing settings invalidates stale sends',async()=>{
 const env=await base();const state=await configure(env,{dailyLimit:1});
 await mock(async calls=>{assert.equal((await deliverOwnerAlert(env,state,'email',['one'])).status,'accepted');assert.equal((await deliverOwnerAlert(env,state,'email',['two'])).status,'blocked');assert.equal(calls.length,1)});
 const env2=await base(),old=await configure(env2);await configure(env2,{emailEnabled:false});
 await mock(async calls=>{assert.equal((await deliverOwnerAlert(env2,old,'email',['one'])).status,'blocked');assert.equal(calls.length,0)});
});
test('test messages require explicit confirmation and enabled configured channel',async()=>{
 const env=await base();await configure(env);
 assert.equal((await ownerAlertRoute(req('/api/admin/alert-test',{channel:'email'}),env,requireAdmin)).status,409);
 await mock(async calls=>{const r=await ownerAlertRoute(req('/api/admin/alert-test',{channel:'email',confirm:'SEND_TEST_ALERT'}),env,requireAdmin);assert.equal((await r.json()).result.status,'accepted');assert.equal(calls.length,1)});
});
test('provider rejection is visible and missing services do not send',async()=>{
 const env=await base(),state=await configure(env);
 await mock(async()=>{assert.equal((await deliverOwnerAlert(env,state,'email',['one'])).status,'rejected')},()=>Response.json({message:'bad sender'},{status:403}));
 const env2=await setup();await configure(env2);await env2.ARTWORK.put('jobs/1.json',JSON.stringify({id:'one',status:'payment_hold'}));
 await mock(async calls=>{const r=await sendOwnerAlerts(env2);assert.equal(r.outcomes[0].status,'not_configured');assert.equal(calls.length,0)});
});
