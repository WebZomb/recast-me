import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {Bucket,setup,submission,fakeApplication} from './security-helpers.mjs';
import {ownerSettingsRoute,settingsSnapshot,withOwnerSettings,SETTINGS_KEY} from '../src/owner-settings.js';
import {creditRoute,walletFor,creditBalance,reserveCustomerRender,settleCustomerRender,reconcileOrderCredits} from '../src/render-credits.js';
import {read,hash} from '../src/commerce-store.js';
import {guardedEnvironment,guardedSocialEnvironment} from '../src/render-controls.js';
import {secureApplication} from '../src/preview-security.js';
const envFor=()=>({ARTWORK:new Bucket(),ADMIN_TOKEN:'test-owner-key',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7'});
const request=(method='GET',body=null,headers={})=>new Request('https://recast.test/api/admin/owner-settings',{method,headers:{authorization:'Bearer test-owner-key','x-recast-request':'1',...headers},...(body?{body:JSON.stringify(body)}:{})});
const values={highDaily:3,standardDaily:5,purchaseBonus:3,websiteCalls:70,socialCalls:100,budgetCents:500,paused:false};
async function wallet(env){const response=await creditRoute(new Request('https://recast.test/api/render-credits',{method:'POST',headers:{'x-recast-request':'1','cf-connecting-ip':'192.0.2.15'}}),env);const cookie=response.headers.get('set-cookie').split(';')[0];return {cookie,wallet:await walletFor(new Request('https://recast.test/',{headers:{cookie}}),env)};}
test('owner settings are authenticated and private, including direct route calls',async()=>{
 const env=envFor();assert.equal((await ownerSettingsRoute(request('GET',null,{authorization:'Bearer wrong'}),env)).status,401);
 const good=await ownerSettingsRoute(request(),env);assert.equal(good.status,200);assert.match(good.headers.get('cache-control'),/no-store/);const text=await good.text();assert.doesNotMatch(text,/test-owner-key/);assert.deepEqual(JSON.parse(text).values,values);
});
test('settings require same-origin write and reject unknown bindings',async()=>{
 const env=envFor();const body={revision:0,values};assert.equal((await ownerSettingsRoute(request('POST',body,{origin:'https://evil.test'}),env)).status,403);
 assert.equal((await ownerSettingsRoute(request('POST',{...body,values:{...values,ADMIN_TOKEN:'steal'}}),env)).status,400);
 assert.equal(await read(env,SETTINGS_KEY),null);
});
test('invalid values fail closed rather than disabling a guard',async()=>{
 for(const bad of [-1,1.5,'NaN',null,'99999999']){const env=envFor();assert.equal((await ownerSettingsRoute(request('POST',{revision:0,values:{...values,websiteCalls:bad}}),env)).status,400);}
});
test('a higher budget needs explicit confirmation; lowering never resets its ledger',async()=>{
 const env=envFor(),body={revision:0,values:{...values,budgetCents:600}};
 assert.equal((await ownerSettingsRoute(request('POST',body),env)).status,409);
 assert.equal((await ownerSettingsRoute(request('POST',{...body,confirm:'INCREASE_LIMITS'}),env)).status,200);
 const day=new Date().toISOString().slice(0,10);await env.ARTWORK.put(`security/ai-budget/${day}.json`,JSON.stringify({day,reservedCents:490}));
 assert.equal((await ownerSettingsRoute(request('POST',{revision:1,values:{...values,budgetCents:400}}),env)).status,200);
 assert.equal((await read(env,`security/ai-budget/${day}.json`)).reservedCents,490);
 assert.equal((await settingsSnapshot(env)).history.length,2);
});
test('concurrent owner tabs cannot overwrite each other',async()=>{
 const env=envFor();const results=await Promise.all([ownerSettingsRoute(request('POST',{revision:0,values}),env),ownerSettingsRoute(request('POST',{revision:0,values:{...values,highDaily:2}}),env)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
});
test('runtime overrides preserve secrets and bindings and can pause inference',async()=>{
 const env=envFor();let calls=0;env.AI={run:async()=>++calls};
 await ownerSettingsRoute(request('POST',{revision:0,values:{...values,paused:true,highDaily:2}}),env);
 const active=await withOwnerSettings(env);assert.equal(active.ARTWORK,env.ARTWORK);assert.equal(active.ADMIN_TOKEN,env.ADMIN_TOKEN);assert.equal(active.HQ_FREE_ALLOWANCE,'2');
 await assert.rejects(guardedEnvironment(active).env.AI.run('model'),e=>e.code==='owner_paused');assert.equal(calls,0);
});
test('private storage can initialize a salt without exposing salt or IP',async()=>{
 const env={...envFor(),RENDER_CREDITS_ENABLED:'true',RENDER_CREDITS_STORAGE_SALT:'true'};
 const a=await wallet(env),b=await wallet(env);assert.equal(a.wallet.network,b.wallet.network);
 const salt=await read(env,'commerce/private/network-salt.json');assert.match(salt.salt,/^[a-f0-9]{64}$/);
 const response=await ownerSettingsRoute(request(),env);const text=await response.text();assert.doesNotMatch(text,new RegExp(salt.salt));assert.doesNotMatch(text,/192\.0\.2\.15/);
});
test('three purchase credits are persistent, deduplicated and relock Standard',async()=>{
 const env={...envFor(),RENDER_CREDITS_ENABLED:'true',RENDER_CREDITS_STORAGE_SALT:'true'},a=await wallet(env),bound={...env,RECAST_CREDIT_WALLET:a.wallet};
 const now=Date.now();for(let i=0;i<3;i++)await settleCustomerRender(env,await reserveCustomerRender(bound,now),true);
 await reserveCustomerRender({...bound,RECAST_RENDER_MODE:'quick'},now);
 const order={id:'gid://shopify/Order/rm050',displayFinancialStatus:'PAID',updatedAt:'2026-10-06T20:00:00Z'};
 await reconcileOrderCredits(env,order,a.wallet.id);await reconcileOrderCredits(env,order,a.wallet.id);
 assert.equal((await creditBalance(env,a.wallet,now)).bonus,3);
 await assert.rejects(reserveCustomerRender({...bound,RECAST_RENDER_MODE:'quick'},now),e=>e.code==='standard_locked');
 assert.equal((await creditBalance(env,a.wallet,now+86400000)).bonus,3);
});
test('admin changes only affect newly granted orders, and legacy five-credit grants survive',async()=>{
 const env={...envFor(),RENDER_CREDITS_ENABLED:'true',RENDER_CREDITS_STORAGE_SALT:'true'},a=await wallet(env);
 const old={id:'gid://shopify/Order/old',displayFinancialStatus:'PAID',updatedAt:'2026-10-01T01:00:00Z'},key=await hash(old.id);
 await env.ARTWORK.put(`commerce/wallets/${a.wallet.id}.json`,JSON.stringify({...a.wallet,orders:{[key]:{used:2,revoked:false}}}));
 await env.ARTWORK.put(`commerce/orders/${key}.json`,JSON.stringify({walletId:a.wallet.id,revoked:false,updatedAt:old.updatedAt}));
 await reconcileOrderCredits({...env,PURCHASE_BONUS:'1'},old,a.wallet.id);
 assert.equal((await creditBalance(env,a.wallet)).bonus,3);
 const next={...old,id:'gid://shopify/Order/new'};await reconcileOrderCredits({...env,PURCHASE_BONUS:'3'},next,a.wallet.id);
 await reconcileOrderCredits({...env,PURCHASE_BONUS:'7'},next,a.wallet.id);
 assert.equal((await creditBalance(env,a.wallet)).bonus,6);
});
test('Standard rejection happens before AI or spending reservations',async()=>{
 let calls=0;const base=await setup({AI:{run:async()=>{calls++}}});
 const env={...base,RENDER_CREDITS_ENABLED:'true',RENDER_CREDITS_STORAGE_SALT:'true',AI_DAILY_CALL_LIMIT:'70',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7'},a=await wallet(env);
 const f=await submission().formData();f.set('qualityMode','quick');
 const req=new Request('https://recast.test/api/transform-v2',{method:'POST',headers:{cookie:a.cookie,'x-recast-request':'1'},body:f});
 const response=await secureApplication(fakeApplication()).fetch(req,env);assert.equal(response.status,409);assert.equal((await response.json()).error,'standard_locked');assert.equal(calls,0);
 assert.equal((await env.ARTWORK.list({prefix:'security/ai-budget/'})).objects.length,0);
});
test('website and X use separate call pools and share a conservative budget',async()=>{
 let calls=0;const env={...envFor(),AI_DAILY_CALL_LIMIT:'1',AI_DAILY_SOCIAL_CALL_LIMIT:'2',AI:{run:async()=>++calls}};
 await guardedEnvironment(env).env.AI.run('dev');await assert.rejects(guardedEnvironment(env).env.AI.run('dev'));
 await guardedSocialEnvironment(env).AI.run('klein');await guardedSocialEnvironment(env).AI.run('klein');await assert.rejects(guardedSocialEnvironment(env).AI.run('klein'));
 assert.equal(calls,3);const day=new Date().toISOString().slice(0,10);assert.equal((await read(env,`security/ai-budget/${day}.json`)).reservedCents,21);
});
test('engine-specific reserves are applied to the actual model without loosening the shared guard',async()=>{
 const env={...envFor(),IMAGE_MODEL_QUICK:'klein9',IMAGE_MODEL_SOCIAL:'klein4',AI_STANDARD_RESERVE_CENTS:'3',AI_SOCIAL_RESERVE_CENTS:'1',AI:{run:async()=>true}};
 const g=guardedEnvironment(env).env;await g.AI.run('dev');await g.AI.run('klein9');await g.AI.run('klein4');
 const day=new Date().toISOString().slice(0,10);assert.equal((await read(env,`security/ai-budget/${day}.json`)).reservedCents,11);
});
test('product settings stay collapsed with only Edit design and a reset action',()=>{
 const code=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');
 assert.match(code,/<summary><span>Edit design<\/span><\/summary>/);assert.doesNotMatch(code,/<summary>[^\n]*preset.label/);
 assert.match(code,/details.open=false/);assert.match(code,/Reset to recommended/);assert.match(code,/Preview my product/);assert.match(code,/requireFreshPreview\(card\)/);
});

test('a model alias cannot accidentally reduce the High Quality reserve',async()=>{
 const env={...envFor(),IMAGE_MODEL_HIGH_QUALITY:'dev',IMAGE_MODEL_QUICK:'dev',AI_STANDARD_RESERVE_CENTS:'1',AI:{run:async()=>true}};
 await guardedEnvironment(env).env.AI.run('dev');const day=new Date().toISOString().slice(0,10);assert.equal((await read(env,`security/ai-budget/${day}.json`)).reservedCents,7);
});
test('invalid persisted revision fails closed for runtime overrides',async()=>{
 const env=envFor();await env.ARTWORK.put(SETTINGS_KEY,JSON.stringify({revision:-1,values}));
 await assert.rejects(withOwnerSettings(env),e=>e.code==='settings_storage');
});
