import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {decode,encode} from 'fast-png';
import {runProtectedFaceEdit,restoreProtectedPixels,combineHeadMasks,checkedPng} from '../src/protected-face-edit.js';
import {OWNER_IDENTITY_MODELS} from '../src/owner-identity-comparison.js';
import {Bucket,MARKED} from './security-helpers.mjs';
import {moderationVerdict} from './safety-fixtures.mjs';
import router from '../src/router.js';
const W=320,H=384,JOB='01234567-1234-1234-1234-012345678901';
const image=(color)=>({width:W,height:H,channels:4,depth:8,data:new Uint8Array(W*H*4).map((_,i)=>color[i%4])});
const original=image([160,110,60,255]),scene=image([20,40,90,255]);
const mask=image([0,0,0,255]);for(let y=70;y<170;y++)for(let x=100;x<190;x++)mask.data.set([255,255,255,255],(y*W+x)*4);
const data=p=>'data:image/png;base64,'+Buffer.from(encode(p)).toString('base64');
function images(){return {async info(stream){const m=await sharp(Buffer.from(await new Response(stream).arrayBuffer())).metadata();return {width:m.width,height:m.height}},input(stream){let options={},draws=0;return {transform(v){options=v;return this},draw(){draws++;return this},async output(out){
 const input=Buffer.from(await new Response(stream).arrayBuffer());
 let engine=sharp(input).rotate();if(options.width||options.height)engine=engine.resize({width:options.width,height:options.height,fit:options.fit==='scale-down'?'inside':options.fit||'contain',background:options.background||'#000000',withoutEnlargement:options.fit==='scale-down'});
 const bytes=draws?MARKED:out.format==='image/png'?await engine.png({palette:false}).toBuffer():await engine.jpeg().toBuffer();
 return {response:()=>new Response(bytes,{headers:{'content-type':out.format}})};
 }}}}}
function env(choice='qwen-protected'){return {ARTWORK:new Bucket(),IMAGES:images(),RECAST_OWNER_PILOT_REQUEST:'true',RECAST_OWNER_IDENTITY_MODEL:choice,RECAST_PROVIDER_ATTEMPT_ID:'test-protected-face',FAL_API_KEY:'MOCK-KEY-NOT-REAL-123456789',CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'offline'}}
const prepared={prompt:'Add a royal cape. Palace courtyard.',image_urls:[data(original)]};
function network(t,{choice='qwen-protected',problem}={}){
 const calls=[];const endpoint=OWNER_IDENTITY_MODELS[choice].endpoint,root=OWNER_IDENTITY_MODELS[choice].queueRoot;
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  url=String(url);calls.push({url,options});
  if(url.endsWith('/moderations'))return Response.json(moderationVerdict());
  const isMask=url.includes('/sam-3'),base='https://queue.fal.run/'+(isMask?'fal-ai/sam-3':root)+'/requests/'+JOB;
  if(options.method==='POST'){
   if(problem==='submit-error')return new Response('',{status:503});
   assert.equal(url,'https://queue.fal.run/'+(isMask?'fal-ai/sam-3/image':endpoint));
   return Response.json({request_id:JOB,status_url:problem==='callback'?'https://evil.test/'+JOB:base+'/status',response_url:base});
  }
  if(url===base+'/status')return Response.json({status:'COMPLETED'});
  if(url===base){
   if(isMask)return Response.json({masks:problem==='empty'?[]:[{url:problem==='remote'?'https://evil.test/mask.png':data(problem==='all-mask'?image([255,255,255,255]):mask),width:W,height:H}],scores:[problem==='uncertain'?.2:.99]});
   return Response.json({images:[{url:data(scene),width:problem==='dimensions'?W+32:W,height:H}],has_nsfw_concepts:[problem==='unsafe']});
  }
  throw Error('Unexpected network '+url);
 });return calls;
}
test('original head pixels are byte-exact; background stays generated; seam blends only outside',()=>{
 const keep=combineHeadMasks([mask],W,H),result=restoreProtectedPixels(original,scene,keep);
 for(let i=0;i<keep.length;i++)if(keep[i])assert.deepEqual(result.data.slice(i*4,i*4+4),original.data.slice(i*4,i*4+4));
 assert.deepEqual(result.data.slice(0,4),scene.data.slice(0,4));
 const edge=(90*W+99)*4;assert.notDeepEqual(result.data.slice(edge,edge+4),original.data.slice(edge,edge+4));assert.notDeepEqual(result.data.slice(edge,edge+4),scene.data.slice(edge,edge+4));
 assert.throws(()=>restoreProtectedPixels(original,{...scene,width:W+1},keep),/aligned/);
});
for(const choice of ['qwen-protected','fill-protected'])test(choice+' one mask + one scene, private PNG restores source and keeps dimensions',async t=>{
 const e=env(choice),calls=network(t,{choice});const out=await runProtectedFaceEdit(e,prepared,OWNER_IDENTITY_MODELS[choice]);
 assert.equal(out.modelUsed,OWNER_IDENTITY_MODELS[choice].endpoint);
 const result=decode(Buffer.from(out.image,'base64'));assert.equal(result.width,W);assert.equal(result.height,H);
 const center=(100*W+130)*4;assert.deepEqual([...result.data.slice(center,center+4)],[160,110,60,255]);
 assert.deepEqual([...result.data.slice(0,4)],[20,40,90,255]);
 const posts=calls.filter(c=>c.options.method==='POST');assert.equal(posts.length,2);
 const sent=JSON.parse(posts[1].options.body);const white=decode(Buffer.from(sent.mask_url.split(',')[1],'base64'));
 assert.deepEqual([...white.data.slice(center,center+4)],[0,0,0,255]);assert.deepEqual([...white.data.slice(0,4)],[255,255,255,255]);
 assert.equal(sent.num_images,1);assert.equal(sent.sync_mode,true);
 const before=calls.length;await assert.rejects(runProtectedFaceEdit(e,prepared,OWNER_IDENTITY_MODELS[choice]),/claim/);assert.equal(calls.length,before,'duplicate attempt cannot be dispatched');
});
for(const problem of ['empty','uncertain','all-mask','remote','callback','submit-error'])test(problem+' stops before scene submission and never fetches untrusted output',async t=>{
 const e=env(),calls=network(t,{problem});await assert.rejects(runProtectedFaceEdit(e,prepared,OWNER_IDENTITY_MODELS['qwen-protected']));
 assert.equal(calls.filter(c=>c.options.method==='POST').length,1);assert.ok(!calls.some(c=>c.url.includes('evil.test')));
});
for(const problem of ['dimensions','unsafe'])test(problem+' rejects generated result without another paid request',async t=>{
 const e=env(),calls=network(t,{problem});await assert.rejects(runProtectedFaceEdit(e,prepared,OWNER_IDENTITY_MODELS['qwen-protected']));assert.equal(calls.filter(c=>c.options.method==='POST').length,2);
});
function request({admin=true,path='/api/admin/model-test',choice='qwen-protected'}={}){
 const f=new FormData();for(const [k,v] of Object.entries({ownerProvider:'fal',style:'custom',subject:'auto',notes:'Royal cape',customWorld:'Palace courtyard',qualityMode:'high',clientAttemptId:'owner-protected-test-1'}))f.set(k,v);
 f.set('image_0',new File([encode(original)],'original.png',{type:'image/png'}));
 return new Request('https://recast.test'+path+'?model='+choice,{method:'POST',headers:admin?{authorization:'Bearer test-admin'}:{},body:f});
}
function routeEnv(){return {...env(),ADMIN_TOKEN:'test-admin',RECAST_OWNER_PILOT_REQUEST:undefined,RECAST_OWNER_IDENTITY_MODEL:undefined,AI:{run:async()=>{throw Error('No Cloudflare render')}},FAL_OWNER_TEST_ENABLED:'true',FAL_PROVIDER_ENABLED:'true',RECAST_HQ_PROVIDER:'fal',FAL_CUSTOMER_MODEL:'nano-banana',IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',RENDER_CREDITS_ENABLED:'false',AI_DAILY_CALL_LIMIT:'70',AI_DAILY_BUDGET_CENTS:'500',AI_CALL_RESERVE_CENTS:'7'}}
test('real secured route screens input/output, persists protected PNG, returns only watermarked preview',async t=>{
 const e=routeEnv(),calls=network(t);const r=await router.fetch(request(),e,{}),body=await r.json();assert.equal(r.status,200,JSON.stringify(body));assert.equal(body.promptVersion,'owner-protected-head-v1');assert.equal(body.image,'data:image/jpeg;base64,'+MARKED.toString('base64'));assert.equal(body.watermarked,true);
 assert.equal(calls.filter(c=>c.url.endsWith('/moderations')).length,2);
 const stored=await(await e.ARTWORK.get('requests/'+body.requestId+'/request.json')).json();assert.equal(stored.modelUsed,'fal-ai/qwen-image-edit/inpaint');assert.equal(stored.promptVersion,body.promptVersion);
 assert.equal(await e.ARTWORK.get('system/providers/hq-fal.json'),null);
});
test('owner auth, screening, shared call/budget limits gate BOTH provider stages',async t=>{
 const calls=network(t);
 for(const extra of [{ADMIN_TOKEN:'different'},{FAL_OWNER_TEST_ENABLED:'false'},{CONTENT_MODERATION_ENABLED:'false'},{AI_DAILY_CALL_LIMIT:'0'},{AI_DAILY_BUDGET_CENTS:'0'}]){
  const r=await router.fetch(request(),{...routeEnv(),...extra},{});assert.ok(r.status>=400);
 }
 assert.equal(calls.filter(c=>c.url.includes('queue.fal.run')).length,0);
});

test('indexed PNG masks normalize correctly without treating palette indexes as brightness',async()=>{
 const png=await sharp(Buffer.from(encode(mask))).png({palette:true,colors:2}).toBuffer();
 const decoded=checkedPng(png);assert.deepEqual([...decoded.data.slice((100*W+130)*4,(100*W+130)*4+4)],[255,255,255,255]);assert.deepEqual([...decoded.data.slice(0,4)],[0,0,0,255]);
});
