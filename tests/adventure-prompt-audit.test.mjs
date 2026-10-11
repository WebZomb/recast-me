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

test('HQ fal, Cloudflare HQ backup and Standard use identical compact face-first prompts in all 48 worlds',()=>{
 for(const id of ids){
  for(const subjectType of ['pet','person','couple','family','person and pet','car']){
   const args={styleId:id,subjectType,inputCount:1,notes:'Keep real eyes and recognizable appearance.'};
   const standard=makeStandardAdventurePrompt(args);
   const high=makeFalCompactPrompt(args);
   const explicit=makeIdentityFirstAdventurePrompt(args);
   assert.equal(standard,high,id+' '+subjectType+' mismatched engines');
   assert.equal(standard,explicit);
   assert.ok(standard.startsWith('EDIT THE UPLOADED PHOTO(S)'),id);
   assert.ok(standard.indexOf('IDENTITY FIRST:')>0&&standard.indexOf('IDENTITY FIRST:')<standard.indexOf(ADVENTURE_GUIDES[id].scene),id+' identity must come BEFORE adventure');
   assert.ok(standard.includes(ADVENTURE_GUIDES[id].scene),id+' scene');
   assert.ok(standard.includes(ADVENTURE_GUIDES[id].look),id+' look');
   assert.ok(standard.includes('REPLACE THE ORIGINAL BACKGROUND'),id+' setting must actually change');
   assert.ok(standard.length<2200,id+' '+subjectType+' prompt longer than expected: '+standard.length);
   assert.equal((standard.match(/IDENTITY FIRST:/g)||[]).length,1,'no repeated face-preserve walls of text');
   const isDrawn=adventureMode(id)==='illustration';
   assert.match(standard,isDrawn?/one ORIGINAL ILLUSTRATION/:/one PHOTOREALISTIC ADVENTURE PORTRAIT/);
   if(subjectType.includes('pet'))assert.ok(standard.includes(ADVENTURE_GUIDES[id].pet),id+' pet costume');
   if(['person','couple','family','person and pet'].includes(subjectType))assert.ok(standard.includes(ADVENTURE_GUIDES[id].person),id+' person costume');
   if(subjectType==='car')assert.match(standard,/same real vehicle|Same real vehicle/i);
  }
 }
});

test('Pet likeness and gender appearance are preserved without prompting customers for sex',()=>{
 const prompt=makeStandardAdventurePrompt({styleId:'dinosaur-adventure',subjectType:'pet'});
 assert.match(prompt,/exact eyes, nose, muzzle, ear shape\/angle, head view, expression, coat colors and marking positions/);
 assert.match(prompt,/do not invent masculine\/feminine traits/);
 assert.match(prompt,/Real pets keep animal bodies and paws, never human hands/);
 assert.match(prompt,/prehistoric/i);
 assert.match(prompt,/face|head/i);
 assert.ok(prompt.length<1700);
 assert.doesNotMatch(site,/gender-choice|pet-gender|sex-choice/);
 for(const role of ['person','person and pet','family','car'])assert.match(compactIdentity(role),/IDENTITY FIRST:/);
 assert.match(compactIdentity('person and pet'),/EACH face/);
 assert.match(compactIdentity('person and pet'),/Same actual pet/);
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
  assert.match(prompt,/CHANGE ONLY outfit, background, props and scene lighting/);
 }
});

test('Multi-image subject labels, previous Recast, custom world and customer notes are kept',()=>{
 const args={styleId:'rockstar',subjectType:'person and pet',inputCount:3,hasBranch:true,
  notes:'Our family has blue outfits; the girl puppy has a pink collar.',
  referenceGuide:'Input image 0 (photo 1) shows person 1. Input image 1 (photo 2) shows the same pet.'};
 const prompt=makeStandardAdventurePrompt(args);
 assert.match(prompt,/previous Recast for continuity/);
 assert.match(prompt,/Input image 0 \(photo 1\) shows person 1/);
 assert.match(prompt,/Input image 1 \(photo 2\) shows the same pet/);
 assert.match(prompt,/girl puppy has a pink collar/);
 assert.match(prompt,/Same actual pet/);assert.match(prompt,/EACH face/);
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
   assert.equal(result.promptVersion,'identity-first-48-worlds-v1');
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
