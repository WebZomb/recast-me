import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import router from '../src/router.js';
import {Bucket,imageMock} from './security-helpers.mjs';
const URL_ROOT='https://recast.test';
const id='a'.repeat(64),key='system/providers/fal-jobs/'+id+'.json';
const get=(route,auth=false)=>new Request(URL_ROOT+route,{headers:auth?{authorization:'Bearer owner-test'}:{}});
test('Provider jobs require owner login and never reveal source, secret or clean artwork',async()=>{
 const bucket=new Bucket();
 await bucket.put(key,JSON.stringify({status:'accepted_unknown_outcome',requestId:'01a11f14-bd12-7083-aa72-2e494db231a0',startedAt:'2026-10-09T12:00:00Z',updatedAt:'2026-10-09T12:01:00Z',imageCount:1,prompt:'SECRET-CUSTOMER-PROMPT',customerAccessToken:'SECRET-CUSTOMER-TOKEN',apiKey:'SECRET-FAL-KEY',rawPhoto:'SECRET-IMAGE',error:'provider error'}));
 const env={ADMIN_TOKEN:'owner-test',ARTWORK:bucket,IMAGES:imageMock(),AI:{run:async()=>{throw Error('GET must not call paid provider')}},FAL_API_KEY:'SECRET-FAL-KEY'};
 const unauth=await router.fetch(get('/api/admin/provider-jobs'),env,{});assert.equal(unauth.status,401);
 const res=await router.fetch(get('/api/admin/provider-jobs',true),env,{});assert.equal(res.status,200);
 const d=await res.json();assert.equal(d.items.length,1);assert.equal(d.items[0].attemptId,id);assert.equal(d.items[0].status,'accepted_unknown_outcome');assert.equal(d.items[0].requestId,'01a11f14-bd12-7083-aa72-2e494db231a0');
 const serialized=JSON.stringify(d);for(const v of ['SECRET-CUSTOMER-PROMPT','SECRET-CUSTOMER-TOKEN','SECRET-FAL-KEY','SECRET-IMAGE'])assert.equal(serialized.includes(v),false);
 assert.equal(d.hasMore,false);
});
test('Garbage or oversized cursor is rejected before private storage read',async()=>{
 const env={ADMIN_TOKEN:'owner-test',ARTWORK:new Bucket()};
 for(const cursor of ['a'.repeat(801),'not allowed!']){const res=await router.fetch(get('/api/admin/provider-jobs?cursor='+encodeURIComponent(cursor),true),env,{});assert.equal(res.status,400);}
});
test('Unknown job statuses and invalid files fail safe without executing rendering',async()=>{
 const bucket=new Bucket();await bucket.put(key,JSON.stringify({status:'new_unknown_state',notes:'private'}));
 await bucket.put('system/providers/fal-jobs/../../secrets.json',JSON.stringify({FAL_API_KEY:'NEVER'}));
 const env={ARTWORK:bucket,ADMIN_TOKEN:'owner-test'};
 const res=await router.fetch(get('/api/admin/provider-jobs',true),env,{});assert.equal(res.status,200);
 const d=await res.json();assert.equal(d.items.length,1);assert.equal(d.items[0].status,'needs_review');assert.equal(JSON.stringify(d).includes('NEVER'),false);
});
test('Owner UI provides a private diagnostics section and escapes provider strings',()=>{
 const html=fs.readFileSync(new URL('../public/admin.html',import.meta.url),'utf8');
 const js=fs.readFileSync(new URL('../public/admin-settings.js',import.meta.url),'utf8');
 assert.match(html,/id="provider-recovery-details"/);assert.match(html,/id="refresh-provider-jobs"/);
 assert.match(js,/loadProviderRecords/);assert.match(js,/provider-jobs/);
 assert.doesNotMatch(js,/jobEl\.innerHTML|healthEl\.innerHTML/);
});
