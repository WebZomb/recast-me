import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';
import {makeStandardAdventurePrompt} from '../src/standard-adventure-prompt.js';
import {makeFalCompactPrompt} from '../src/fal-prompt.js';
import {compactIdentity,makeIdentityFirstAdventurePrompt} from '../src/identity-first-adventure-prompt.js';
import {highQualityTransform} from '../src/highquality.js';
import {Bucket,CLEAN,imageMock} from './security-helpers.mjs';

// Mocked image provider ONLY. No billable renders, customer orders or credit use.
const ui=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const site=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../src/highquality.js',import.meta.url),'utf8');
const ids=[...ui.matchAll(/^\["([a-z0-9-]+)",/gm)].map(x=>x[1]);

test('All 48 advertised adventures have distinct detailed world and pet/person costumes',()=>{
 assert.equal(ids.length,48);assert.equal(new Set(ids).size,48);
 assert.deepEqual(Object.keys(ADVENTURE_GUIDES).sort(),[...ids].sort());
 assert.equal(new Set(Object.values(ADVENTURE_GUIDES).map(x=>x.scene)).size,48);
 for(const id of ids){
  const guide=ADVENTURE_GUIDES[id];
  for(const k of ['scene','look','pet','person','teaser'])assert.ok(guide[k].length>=25,id+' '+k);
  assert.ok(guide.teaser.length<=160,id+' teaser too long');
 }
 assert.match(site,/id="more-adventures"/);
});

test('Accepted recipe preserves all 48 worlds and matches Standard exactly',async()=>{
 const {customerIdentityPrompt}=await import('../src/customer-identity.js');
 for(const id of ids)for(const subjectType of ['auto','pet','person','couple','family','person and pet']){
  const args={styleId:id,subjectType,notes:'Keep recognizable appearance.'};
  const prompt=makeStandardAdventurePrompt(args);
  assert.equal(prompt,customerIdentityPrompt(args));
  assert.ok(prompt.indexOf('Preserve each retained face')<prompt.indexOf('Background:'));
  for(const part of ['scene','look'])assert.ok(prompt.includes(ADVENTURE_GUIDES[id][part]));
  assert.match(prompt,/pets retain animal bodies and paws/);
  assert.match(prompt,/Include each subject once/);
  assert.ok(prompt.length<2200);
  if(subjectType==='auto'){assert.ok(prompt.includes(ADVENTURE_GUIDES[id].pet));assert.ok(prompt.includes(ADVENTURE_GUIDES[id].person));assert.match(prompt,/visible reference faces/);}
 }
 assert.doesNotMatch(site,/gender-choice|pet-gender|sex-choice/);
});

test('Adventure-specific transformation remains real, not a generic unchanged source yard',()=>{
 const cases=[
  ['christmas','snowy Christmas-market','knitted holiday scarf'],
  ['rockstar','LIVE ROCK CONCERT STAGE','rocker jacket'],
  ['dinosaur-adventure','prehistoric','explorer'],
  ['royal','palace','royal cape'],
  ['storybook','meadow','storybook'],
  ['anime','cherry-blossom','anime'],
 ];
 for(const [id,scene,attire] of cases){
  const prompt=makeFalCompactPrompt({styleId:id,subjectType:'pet'});
  assert.match(prompt,new RegExp(scene,'i'),id);
  assert.match(prompt,new RegExp(attire,'i'),id);
  assert.match(prompt,/Change outfit, background, props and lighting/);
 }
});

test('Multi-image subject labels, previous Recast, custom world and customer notes are kept',()=>{
 const args={styleId:'rockstar',subjectType:'person and pet',inputCount:3,hasBranch:true,
  notes:'Our family has blue outfits; the girl puppy has a pink collar.',
  referenceGuide:'Input image 0 (photo 1) shows person 1. Input image 1 (photo 2) shows the same pet.'};
 const prompt=makeStandardAdventurePrompt(args);
 assert.match(prompt,/last image supplies artwork continuity/);
 assert.match(prompt,/Input image 0 \(photo 1\) shows person 1/);
 assert.match(prompt,/Input image 1 \(photo 2\) shows the same pet/);
 assert.match(prompt,/girl puppy has a pink collar/);
 assert.match(prompt,/Preserve each retained face/);assert.match(prompt,/pets retain animal bodies and paws/);
 const custom=makeFalCompactPrompt({styleId:'custom',subjectType:'pet',notes:'Give my dog a cape.',customWorld:'a floating greenhouse with glowing purple vines'});
 assert.match(custom,/floating greenhouse with glowing purple vines/);
 assert.match(custom,/dog a cape/);
 assert.doesNotMatch(custom,/Christmas-market|LIVE ROCK CONCERT/);
 assert.throws(()=>makeStandardAdventurePrompt({styleId:'custom',customWorld:''}),e=>e.reason==='input');
});

test('Actual Standard and HQ Cloudflare model submissions receive the same short prompt without more model calls',async()=>{
 for(const styleId of ['christmas','rockstar','dinosaur-adventure','anime']){
  const submitted=[];
  for(const qualityMode of ['quick','high']){
   const env={ARTWORK:new Bucket(),IMAGES:imageMock(),IMAGE_MODEL_QUICK:'@cf/black-forest-labs/flux-2-klein-9b',
    IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',RECAST_HQ_SELECTED_PROVIDER:'cloudflare',
    AI:{async run(model,{multipart},options){
     const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
     submitted.push({qualityMode,model,options,prompt:String(form.get('prompt')),width:form.get('width'),height:form.get('height')});
     return {image:CLEAN.toString('base64')};
    }}};
   const form=new FormData();form.set('style',styleId);form.set('subject','pet');form.set('qualityMode',qualityMode);
   form.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));
   const response=await highQualityTransform(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env);
   assert.equal(response.status,200,qualityMode+' '+styleId);
   const result=await response.json();
   assert.equal(result.promptVersion,'nano-identity-adventures-v6');
  }
  assert.equal(submitted.length,2,styleId+' only one call per selected quality');
  assert.equal(submitted[0].prompt,submitted[1].prompt);
  assert.ok(submitted[0].prompt.length<2200);
  assert.equal(submitted[0].model,'@cf/black-forest-labs/flux-2-klein-9b');
  assert.equal(submitted[0].width,'768');assert.equal(submitted[0].height,'960');
  assert.equal(submitted[1].model,'@cf/black-forest-labs/flux-2-dev');
  assert.equal(submitted[1].width,'1024');assert.equal(submitted[1].height,'1280');
  assert.deepEqual(submitted[0].options,{rejectIfBusy:true});
 }
});

test('fal gets higher-detail source pixels, while Cloudflare and Standard keep small compatible input',async()=>{
 const small=new File([CLEAN],'small.jpg',{type:'image/jpeg'});
 const detail=new File([CLEAN,CLEAN],'detail.jpg',{type:'image/jpeg'});
 for(const [mode,provider,expected] of [
   ['high','fal',detail.size],['high','cloudflare',small.size],['quick','cloudflare',small.size]
 ]){
  const selected=[];
  const env={ARTWORK:new Bucket(),IMAGES:imageMock(),
   RECAST_HQ_SELECTED_PROVIDER:provider,
   IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',
   IMAGE_MODEL_QUICK:'@cf/black-forest-labs/flux-2-klein-9b',
   AI:{async run(model,{multipart}){
    const fields=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    selected.push({model,file:fields.get('input_image_0'),imageCount:[...fields.keys()].filter(k=>k.startsWith('input_image_')).length});
    return {image:CLEAN.toString('base64')};
   }}};
  const form=new FormData();form.set('style','dinosaur-adventure');form.set('subject','auto');form.set('qualityMode',mode);
  form.set('image_0',small);
  if(mode==='high')form.set('hq_image_0',detail);
  const result=await highQualityTransform(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env);
  assert.equal(result.status,200,mode+'/'+provider);
  assert.equal(selected.length,1,'No extra billable inference');
  assert.equal(selected[0].imageCount,1,'Only one input reference, not both resolutions');
  assert.equal(selected[0].file.size,expected,mode+'/'+provider);
 }
});

test('Incomplete or extra detail uploads fail before any AI inference',async()=>{
 for(const invalid of ['partial','standard']){
  let calls=0;
  const env={ARTWORK:new Bucket(),IMAGES:imageMock(),
   RECAST_HQ_SELECTED_PROVIDER:'fal',
   AI:{async run(){calls++;return {image:CLEAN.toString('base64')}}}};
  const form=new FormData();form.set('style','royal');form.set('subject','auto');
  form.set('qualityMode',invalid==='standard'?'quick':'high');
  form.set('image_0',new File([CLEAN],'one.jpg',{type:'image/jpeg'}));
  if(invalid==='partial')form.set('image_1',new File([CLEAN],'two.jpg',{type:'image/jpeg'}));
  form.set('hq_image_0',new File([CLEAN,CLEAN],'big.jpg',{type:'image/jpeg'}));
  const result=await highQualityTransform(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env);
  assert.equal(result.status,400,invalid);
  assert.equal(calls,0,'Invalid high detail references never start inference');
 }
});

test('Business safety, allowance and provider config stay untouched',()=>{
 assert.match(source,/IMAGE_QUICK_GUIDANCE\|\|5/);
 assert.match(source,/IMAGE_QUICK_STEPS\|\|12/);
 assert.match(source,/tryGeneration\(env,model,main,inputFiles,"quick-primary",settings\)/);
 assert.match(source,/await moderateContent\(env,\{text:/);
 const conf=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8').replace(/\/\/ Preserve the existing production Images binding during controlled testing\./,''));
 assert.equal(conf.vars.HQ_FREE_ALLOWANCE,'3');
 assert.equal(conf.vars.STANDARD_FREE_ALLOWANCE,'5');
 assert.equal(conf.vars.RECAST_HQ_PROVIDER,'fal');
 assert.equal(conf.vars.ORDER_SYNC_ENABLED,'true');
 assert.equal(conf.vars.AUTO_PRINT_PREAPPROVED_ENABLED,'true');
});

test('Automatic photo mode needs no manual subject or paid classification pass',async()=>{
 for(const qualityMode of ['high','quick']){
  const calls=[],env={ARTWORK:new Bucket(),IMAGES:imageMock(),
   RECAST_HQ_SELECTED_PROVIDER:'cloudflare',
   IMAGE_MODEL_HIGH_QUALITY:'@cf/black-forest-labs/flux-2-dev',
   IMAGE_MODEL_QUICK:'@cf/black-forest-labs/flux-2-klein-9b',
   AI:{async run(model,{multipart}){
    const body=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    calls.push({model,prompt:String(body.get('prompt'))});
    return {image:CLEAN.toString('base64')};
   }}};
  const form=new FormData();
  form.set('style','dinosaur-adventure');form.set('subject','auto');form.set('qualityMode',qualityMode);
  form.set('image_0',new File([CLEAN],'picture.jpg',{type:'image/jpeg'}));
  const result=await highQualityTransform(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env);
  assert.equal(result.status,200);
  const data=await result.json();
  assert.equal(data.promptVersion,'nano-identity-adventures-v6');
  assert.equal(calls.length,1,'Use the same model edit, no extra subject-classifier request');
  assert.match(calls[0].prompt,/main people and pets with visible reference faces/);
  assert.match(calls[0].prompt,/eye shape and spacing, nose or muzzle/);
  assert.match(calls[0].prompt,/prehistoric/);
  assert.match(calls[0].prompt,/Include each subject once/);
  assert.ok(calls[0].prompt.length<2200);
 }
});
