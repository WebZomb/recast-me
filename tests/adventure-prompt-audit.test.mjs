import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADVENTURE_GUIDES,adventureMode} from '../public/adventure-guides.js';
import {makeStandardAdventurePrompt} from '../src/standard-adventure-prompt.js';
import {makeFalCompactPrompt} from '../src/fal-prompt.js';
import {highQualityTransform} from '../src/highquality.js';
import {Bucket,CLEAN,imageMock} from './security-helpers.mjs';

// Static contract tests: NO actual network/model request, no paid inference.
const ui=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const site=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const highSource=readFileSync(new URL('../src/highquality.js',import.meta.url),'utf8');
const ids=[...ui.matchAll(/^\["([a-z0-9-]+)",/gm)].map(x=>x[1]);
const UNIQUE=[...new Set(ids)];

test('ALL 48 customer-visible adventures have a unique detailed server-and-client guide',()=>{
 assert.equal(ids.length,48,'Expected all currently advertised themes');
 assert.equal(UNIQUE.length,48,'No duplicate option IDs');
 assert.deepEqual(Object.keys(ADVENTURE_GUIDES).sort(),UNIQUE.sort(),'Shared catalog must match public picker exactly');
 for(const id of ids){
  const g=ADVENTURE_GUIDES[id];
  for(const property of ['scene','pet','person','look','teaser']){
   assert.equal(typeof g[property],'string',id+' '+property);
   assert.ok(g[property].length>=28,id+' '+property+' missing specificity');
  }
  assert.ok(g.scene.length>56,'Every World needs a distinct setting: '+id);
  assert.ok(g.teaser.length<=160,'Keep frontend description legible: '+id);
 }
 assert.equal(new Set(Object.values(ADVENTURE_GUIDES).map(v=>v.scene)).size,48,'No shared generic backdrops');
 assert.ok(ui.includes("import {ADVENTURE_GUIDES} from './adventure-guides.js?v=1'"));
 assert.ok(ui.includes('entry[2]=guide.teaser'));
 assert.ok(site.includes('id="selected-world-description"'));
 assert.ok(site.includes('/app.js?v=272'));
 assert.ok(site.includes('/adventure-description-v1.css?v=1'));
});

test('Holiday Magic and Rock Star explicitly transform scenery, wardrobe and lighting',()=>{
 const holiday=ADVENTURE_GUIDES.christmas;
 assert.match(holiday.scene,/snowy Christmas-market/);
 assert.match(holiday.scene,/decorated evergreen trees/);
 assert.match(holiday.pet,/knitted holiday scarf/);
 const rock=ADVENTURE_GUIDES.rockstar;
 assert.match(rock.scene,/LIVE ROCK CONCERT STAGE/);
 assert.match(rock.scene,/drum kit/);
 assert.match(rock.scene,/NOT the source yard/);
 assert.match(rock.pet,/rocker jacket/);
 assert.match(rock.look,/PHOTOREAL/);
 for(const [id,fragment] of [['baseball','infield'],['dj','DJ booth'],['pilot','hangar'],['pirate','ship'],['royal','palace'],['storybook','meadow'],['christmas','market']]){
  assert.match(ADVENTURE_GUIDES[id].scene,new RegExp(fragment,'i'),id);
 }
});

test('Standard front-loads each unique adventure before identity while preserving original pet markings',()=>{
 for(const id of ids){
  for(const subjectType of ['pet','person','car','person and pet']){
   const guide=ADVENTURE_GUIDES[id];
   const prompt=makeStandardAdventurePrompt({styleId:id,subjectType,notes:'Keep the exact real subject.',inputCount:1});
   assert.ok(prompt.startsWith('EDIT THE UPLOADED PHOTO(S)'),id);
   assert.ok(prompt.includes('REPLACE THE WHOLE ORIGINAL BACKGROUND'),id);
   assert.ok(prompt.includes(guide.scene),id);
   assert.ok(prompt.includes(guide.look),id);
   assert.ok(prompt.indexOf(guide.scene)<prompt.indexOf('ALL-WORLD LIKENESS'),id+' theme was placed too late');
   assert.match(prompt,/same anatomical side/i,id);
   assert.match(prompt,/fur length/i,id);
   assert.match(prompt,/never human hands|no humanlike paws|no human hands/i,id);
   if(subjectType.includes('pet'))assert.ok(prompt.includes(guide.pet),id+' pet wardrobe');
   if(subjectType.includes('person'))assert.ok(prompt.includes(guide.person),id+' human wardrobe');
   if(subjectType==='car')assert.ok(prompt.includes('VEHICLE:'),id+' vehicle guide');
   assert.ok(prompt.length<3200,id+' Standard prompt is too long: '+prompt.length);
   const illustrated=adventureMode(id)==='illustration';
   if(illustrated)assert.match(prompt,/one ORIGINAL ILLUSTRATION/,id);
   else assert.match(prompt,/one PHOTOREALISTIC ADVENTURE PORTRAIT/,id);
  }
 }
});

test('fal High Quality uses those same 48 specific World scenes and pet costumes',()=>{
 for(const id of ids){
  const g=ADVENTURE_GUIDES[id];
  const prompt=makeFalCompactPrompt({styleId:id,subjectType:'pet',style:{name:id,prompt:'legacy generic mood'},inputCount:1,notes:'Preserve my real pet.'});
  assert.ok(prompt.includes(g.scene),id+' HQ scene mismatch');
  assert.ok(prompt.includes(g.pet),id+' HQ pet attire mismatch');
  assert.match(prompt,/REPLACE THE ORIGINAL BACKGROUND completely/);
  assert.match(prompt,/Preserve EXACT original dog\/animal/);
  assert.ok(prompt.length<3400,id+' HQ prompt too long: '+prompt.length);
 }
});

test('Standard customer notes and mixed family references remain in the shorter prompt',()=>{
 const prompt=makeStandardAdventurePrompt({
  styleId:'rockstar',subjectType:'person and pet',inputCount:3,hasBranch:true,
  notes:'Give our family coordinated blue outfits; our dog must stay four-legged.',
  referenceGuide:'Input image 0 (photo 1) shows person 1. Input image 1 (photo 2) shows the same pet.'
 });
 assert.match(prompt,/coordinated blue outfits/);
 assert.match(prompt,/Input image 0 \(photo 1\) shows person 1/);
 assert.match(prompt,/Input image 1 \(photo 2\) shows the same pet/);
 assert.match(prompt,/previous Recast for continuity/);
 assert.ok(prompt.includes(ADVENTURE_GUIDES.rockstar.person));
 assert.ok(prompt.includes(ADVENTURE_GUIDES.rockstar.pet));
 const custom=makeStandardAdventurePrompt({styleId:'custom',subjectType:'pet',notes:'Give my dog a tiny cape.',customWorld:'a floating greenhouse with glowing purple vines'});
 assert.match(custom,/floating greenhouse with glowing purple vines/);
 assert.match(custom,/dog a tiny cape/);
 assert.match(custom,/REPLACE THE WHOLE ORIGINAL BACKGROUND/);
 assert.doesNotMatch(custom,/rock concert|Christmas-market/i);
});

test('actual Standard generator submits one correctly themed compact prompt without changes to model or resolution',async()=>{
 for(const id of ['christmas','rockstar','storybook']){
  let request=null;
  const env={ARTWORK:new Bucket(),IMAGES:imageMock(),IMAGE_MODEL_QUICK:'@cf/black-forest-labs/flux-2-klein-9b',
   AI:{async run(model,{multipart},options){
    const body=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    request={model,prompt:body.get('prompt'),width:body.get('width'),height:body.get('height'),options};
    return {image:CLEAN.toString('base64')};
   }}};
  const form=new FormData();
  form.set('style',id);form.set('subject','pet');form.set('qualityMode','quick');
  form.set('image_0',new File([CLEAN],'dog.jpg',{type:'image/jpeg'}));
  const res=await highQualityTransform(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env);
  assert.equal(res.status,200,id+' Standard render should complete');
  assert.equal(request.model,'@cf/black-forest-labs/flux-2-klein-9b');
  assert.equal(request.width,'768');assert.equal(request.height,'960');
  assert.ok(request.prompt.includes(ADVENTURE_GUIDES[id].scene));
  assert.ok(request.prompt.includes(ADVENTURE_GUIDES[id].pet));
  assert.ok(request.prompt.length<3200);
  assert.deepEqual(request.options,{rejectIfBusy:true});
  const json=await res.clone().json();
  assert.equal(json.promptVersion,'standard-identity-scenes-v2');
 }
});

test('nonprompt safety, credit, ordering, moderation and commercial data paths remain unchanged',()=>{
 assert.match(highSource,/IMAGE_QUICK_GUIDANCE\|\|5/);
 assert.match(highSource,/IMAGE_QUICK_STEPS\|\|12/);
 assert.match(highSource,/tryGeneration\(env,model,main,inputFiles,"quick-primary",settings\)/);
 assert.match(highSource,/usedFallback:kind\.includes/);
 assert.match(highSource,/await moderateContent\(env,\{text:/);
 const policy=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8').replace(/\/\/ Preserve the existing production Images binding during controlled testing\./,''));
 assert.equal(policy.vars.HQ_FREE_ALLOWANCE,'3');
 assert.equal(policy.vars.STANDARD_FREE_ALLOWANCE,'5');
 assert.equal(policy.vars.RECAST_HQ_PROVIDER,'fal');
 assert.equal(policy.vars.ORDER_SYNC_ENABLED,'true');
 assert.equal(policy.vars.AUTO_PRINT_PREAPPROVED_ENABLED,'true');
});

test('Standard identity is anchored BEFORE the dramatic new world across all 48 themes and subject types',()=>{
 for(const id of ids){
   const scene=ADVENTURE_GUIDES[id].scene;
   for(const subjectType of ['pet','person','car','person and pet']){
     const prompt=makeStandardAdventurePrompt({styleId:id,subjectType,notes:'Match the exact real face and head angle.',inputCount:1});
     const identityPos=prompt.indexOf('IDENTITY FIRST:');
     const scenePos=prompt.indexOf(scene);
     const allWorldPos=prompt.indexOf('ALL-WORLD LIKENESS:');
     assert.ok(identityPos>=0&&identityPos<scenePos,id+' '+subjectType+' identity must precede scene');
     assert.ok(scenePos>=0&&scenePos<allWorldPos,id+' '+subjectType+' keep adventure early');
     assert.match(prompt,/REPLACE THE WHOLE ORIGINAL BACKGROUND/,id);
     assert.ok(prompt.length<2600,id+' Standard prompt stays compact');
     if(subjectType==='pet'){
       for(const detail of ['eye shape','ear length and tilt','muzzle width','coat-patch placement','head direction'])
         assert.ok(prompt.includes(detail),id+' lost identity detail '+detail);
       assert.match(prompt,/Do not redesign the skull, switch breed, enlarge the ears, or substitute a lookalike/);
       assert.match(prompt,/Fit adventure clothes around the neck\/body without covering recognizable face, eyes or ears/);
     }
     if(subjectType==='person and pet')
       assert.match(prompt,/Keep EACH person’s actual face and EACH pet’s actual head/);
     if(subjectType==='person')
       assert.match(prompt,/real facial geometry, eyes, nose, mouth, hairline/);
     if(subjectType==='car')
       assert.match(prompt,/recognizable body silhouette, grille, lights, wheels/);
   }
 }
 const holiday=makeStandardAdventurePrompt({styleId:'christmas',subjectType:'pet',inputCount:1});
 const rock=makeStandardAdventurePrompt({styleId:'rockstar',subjectType:'pet',inputCount:1});
 assert.match(holiday,/snowy Christmas-market/);
 assert.match(holiday,/knitted holiday scarf/);
 assert.match(rock,/FULL LIVE ROCK CONCERT STAGE/);
 assert.match(rock,/rocker jacket/);
 assert.doesNotMatch(rock,/MAKE ONE NEW PHOTOREALISTIC IMAGE/);
});
