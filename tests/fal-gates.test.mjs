import test from 'node:test';import assert from 'node:assert/strict';
import router from '../src/router.js';import {renderHealth} from '../src/render-health.js';
import {selectHighQualityProvider} from '../src/provider-routing.js';
import {Bucket,imageMock,CLEAN} from './security-helpers.mjs';
const MODEL='@cf/black-forest-labs/flux-2-dev';
const form=()=>{const f=new FormData();f.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));return f};
function env(extra={}){return {ARTWORK:new Bucket(),IMAGES:imageMock(),AI:{run:async()=>({image:CLEAN.toString('base64')})},ADMIN_TOKEN:'fake-admin',RECAST_HQ_PROVIDER:'fal',FAL_PROVIDER_ENABLED:'true',FAL_API_KEY:'offline-fal-mock-key-length-over-20',FAL_PROVIDER_VERIFIED:'false',...extra}}
test('public Fal is blocked until verified, owner pilot remains available',async()=>{
 const e=env();
 await assert.rejects(selectHighQualityProvider(e,form()),{code:'render_provider_unverified'});
 const pilot=await selectHighQualityProvider({...e,RECAST_OWNER_PILOT_REQUEST:'true'},form());assert.equal(pilot.host,'fal');
 const publicReady=await renderHealth(e,'high');assert.equal(publicReady.ready,false);
 const ownerReady=await renderHealth({...e,RECAST_OWNER_PILOT_REQUEST:'true'},'high');assert.equal(ownerReady.ready,true);
});
test('fal jobs cannot submit if private durable receipt cannot be written',async t=>{
 const e=env({FAL_PROVIDER_VERIFIED:'true',ARTWORK:{async get(){return null},async put(){throw Error('storage down')}}});
 let submits=0;t.mock.method(globalThis,'fetch',async()=>{submits++;throw Error('Forbidden external network')});
 const {runFalEdit}=await import('../src/fal-service.js');
 const actualForm=new FormData();actualForm.set('prompt','Test dog');actualForm.set('width','1024');actualForm.set('height','1280');actualForm.set('steps','18');actualForm.set('guidance','5');actualForm.set('input_image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));
 const body=new Response(actualForm);await assert.rejects(runFalEdit(e,MODEL,{multipart:{body:body.body,contentType:body.headers.get('content-type')}}),{reason:'configuration'});
 assert.equal(submits,0);
});
test('Auto health shows not ready if fal and Cloudflare are both unverified or failed',async()=>{
 const e=env({RECAST_HQ_PROVIDER:'auto'});assert.equal((await renderHealth(e,'high')).ready,false);
 e.FAL_PROVIDER_VERIFIED='true';assert.equal((await renderHealth(e,'high')).ready,true);
 await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'failed',reason:'unavailable'}));assert.equal((await renderHealth(e,'high')).ready,false);
});

test('only authenticated owner pilot can attempt a recovery of a marked-failed fal host',async()=>{const e=env();await e.ARTWORK.put('system/providers/hq-fal.json',JSON.stringify({status:'failed',reason:'unavailable'}));await assert.rejects(selectHighQualityProvider({...e,FAL_PROVIDER_VERIFIED:'true'},form()),{code:'render_provider_unavailable'});assert.equal((await selectHighQualityProvider({...e,RECAST_OWNER_PILOT_REQUEST:'true'},form())).host,'fal');});
