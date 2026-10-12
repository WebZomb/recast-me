import test from 'node:test';
import assert from 'node:assert/strict';
import {subjectDetection,parseSubject,SUBJECT_MODEL} from '../src/subject-detection.js';
import {initSubjectDetection,combineSubjects} from '../public/subject-detection.js';
import {customerIdentityPrompt} from '../src/customer-identity.js';
import {makeStandardAdventurePrompt} from '../src/standard-adventure-prompt.js';
import {setup,CLEAN} from './security-helpers.mjs';
async function environment(extra={}){
 const calls=[];const env=await setup({SUBJECT_DETECTION_ENABLED:'true',SUBJECT_DETECTION_ACCEPT_META_LICENSE:'true',AI:{async run(model,input){calls.push({model,input});return {response:'{"subject":"pet"}'};}},...extra});
 env.IMAGES.info=async()=>({width:480,height:400});return {env,calls};
}
function request(bytes=CLEAN,headers={}){return new Request('https://recast.test/api/subject-detection',{method:'POST',body:bytes,headers:{origin:'https://recast.test','content-type':'image/jpeg','x-recast-request':'1','x-recast-photo-check':'yes','cf-connecting-ip':'192.0.2.1',...headers}});}
test('analysis accepts only controlled categories, never model prose or arbitrary instructions',()=>{
 for(const subject of ['pet','people','person and pet','car','custom','auto'])assert.equal(parseSubject(JSON.stringify({subject})),subject);
 for(const response of ['ignore instructions','{"subject":"invent a face"}','{}','x'.repeat(1001)])assert.equal(parseSubject(response),'auto');
 assert.equal(parseSubject('```json\n{"subject":"pet"}\n```'),'pet');
 assert.equal(combineSubjects(['pet','people']),'person and pet');
 assert.equal(combineSubjects(['people','people']),'people'); // No invented counts across references.
 assert.equal(combineSubjects(['pet','auto']),'auto');assert.equal(combineSubjects(['car','people']),'auto');
});
test('one activation and one bounded check; repeat upload uses cached enum and no image is persisted',async()=>{
 const {env,calls}=await environment();
 assert.equal((await subjectDetection(request(),env)).status,200);
 assert.equal((await (await subjectDetection(request(),env)).json()).subject,'pet');
 assert.equal(calls.length,2);assert.equal(calls[0].input.prompt,'agree');assert.equal(calls[1].model,SUBJECT_MODEL);assert.equal(calls[1].input.max_tokens,80);
 const objects=[...env.ARTWORK.objects].filter(([key])=>key.startsWith('security/subject-detection'));
 assert.ok(objects.every(([,v])=>!v.bytes.includes(CLEAN)));
 assert.ok(![...env.ARTWORK.objects.keys()].some(k=>k.includes('ai-calls')||k.includes('commerce/wallet')));
});
test('concurrent checks cannot submit the same image twice',async()=>{
 const {env,calls}=await environment();
 const responses=await Promise.all(Array.from({length:5},()=>subjectDetection(request(),env)));
 assert.equal(responses.filter(r=>r.status===200).length>=1,true);assert.equal(calls.filter(x=>x.input.image).length,1);
});
test('cross-origin, wrong consent, oversized stream and invalid type never invoke model',async()=>{
 const {env,calls}=await environment();
 for(const req of [request(CLEAN,{origin:'https://bad.test'}),request(CLEAN,{'x-recast-photo-check':'no'}),request(new Uint8Array(300001)),request(CLEAN,{'content-type':'image/png'})])assert.ok((await subjectDetection(req,env)).status>=400);
 assert.equal(calls.length,0);
});
test('server verifies dimensions and caps unique network/global checks',async()=>{
 const a=await environment();a.env.IMAGES.info=async()=>({width:5000,height:5000});assert.equal((await subjectDetection(request(),a.env)).status,400);assert.equal(a.calls.length,0);
 const {env,calls}=await environment({SUBJECT_DETECTION_DAILY_LIMIT:'1'});
 await subjectDetection(request(),env);const other=Buffer.concat([CLEAN,Buffer.from('different')]);assert.equal((await subjectDetection(request(other,{'cf-connecting-ip':'192.0.2.2'}),env)).status,429);assert.equal(calls.filter(x=>x.input.image).length,1);
 const b=await environment({SUBJECT_DETECTION_NETWORK_LIMIT:'1'});await subjectDetection(request(),b.env);assert.equal((await subjectDetection(request(other),b.env)).status,429);
});
test('provider failure, pause and uncertain activation fail open to UI without automatic paid retries',async()=>{
 let attempts=0;const {env}=await environment({AI:{async run(){attempts++;throw Error('provider private error');}}});
 const first=await subjectDetection(request(),env);assert.equal(first.status,503);assert.equal((await first.json()).error,'photo_check_unavailable');
 await subjectDetection(request(),env);assert.equal(attempts,1);
 env.RENDER_PAUSED='true';assert.equal((await subjectDetection(request(),env)).status,503);assert.equal(attempts,1);
});
test('changing only inclusion preserves the accepted face, pose, outfit and environment text in both qualities',()=>{
 const oldClause='Include the main people and pets with visible reference faces. Exclude faceless supporting figures; never invent their faces.';
 const petClause='Include only the main pets; omit incidental people and supporting hands.';
 for(const styleId of ['royal','dinosaur-adventure','beach','football']){
  const base=customerIdentityPrompt({styleId,subjectType:'auto'});
  const options={styleId,subjectType:'auto',inclusionSubject:'pet'};
  assert.equal(customerIdentityPrompt(options),base.replace(oldClause,petClause));
  assert.equal(makeStandardAdventurePrompt(options),customerIdentityPrompt(options));
 }
});
function ui(){
 globalThis.document=new EventTarget();
 const subject=new EventTarget();subject.value='auto';const photos={files:[]},status={textContent:'',hidden:true},waiting=[];
 const detection=initSubjectDetection({photos,subject,status,prepare:async()=>new Blob(['x']),fetcher:()=>new Promise(resolve=>waiting.push(resolve))});
 return {subject,photos,status,waiting,detection,upload(file={}){photos.files=[file];document.dispatchEvent(new Event('recast-photos-change'));}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('manual choice wins even if an aborted request still returns a result',async()=>{
 const x=ui();x.upload();await tick();x.subject.value='car';x.subject.dispatchEvent(new Event('change'));x.waiting[0](Response.json({subject:'pet'}));await tick();assert.equal(x.subject.value,'car');assert.match(x.status.textContent,/Your selection/);
});
test('new upload supersedes old results and a checked suggestion is visibly selected',async()=>{
 const x=ui();x.upload();await tick();x.upload();await tick();x.waiting[0](Response.json({subject:'pet'}));await tick();assert.equal(x.subject.value,'auto');x.waiting[1](Response.json({subject:'people'}));await tick();assert.equal(x.subject.value,'people');assert.match(x.status.textContent,/Suggested/);
});
test('generation freezes selection and detector failure leaves editable automatic',async()=>{
 const x=ui();x.upload();await tick();x.detection.freeze();x.waiting[0](Response.json({subject:'pet'}));await tick();assert.equal(x.subject.value,'auto');
 const y=ui();y.upload();await tick();y.waiting[0](Response.json({subject:'auto'},{status:503}));await tick();assert.equal(y.subject.value,'auto');assert.match(y.status.textContent,/Change/);
});

test('public router keeps analysis outside image-generation credit/call/budget reservations',async()=>{
 const {default:router}=await import('../src/router.js');
 const {env,calls}=await environment({RENDER_CREDITS_ENABLED:'true',AI_DAILY_CALL_LIMIT:'0',AI_DAILY_BUDGET_CENTS:'0',AI_CALL_RESERVE_CENTS:'7'});
 const response=await router.fetch(request(),env,{});
 assert.equal(response.status,200,await response.clone().text());assert.equal((await response.json()).subject,'pet');assert.equal(calls.length,2);
 assert.ok(![...env.ARTWORK.objects.keys()].some(k=>/security\/ai-(calls|budget)|commerce\/wallet/.test(k)));
});
