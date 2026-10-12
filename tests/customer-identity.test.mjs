import test from 'node:test';import assert from 'node:assert/strict';import {ADVENTURE_GUIDES} from '../public/adventure-guides.js';import {AUTOMATIC_EDIT_PRESETS,customerNano,customerIdentityPrompt} from '../src/customer-identity.js';
test('all 48 Nano adventures retain their scene and identity directions',()=>{assert.equal(Object.keys(ADVENTURE_GUIDES).length,48);for(const [styleId,g] of Object.entries(ADVENTURE_GUIDES)){for(const subjectType of ['auto','pet','person','person and pet','group']){const p=customerIdentityPrompt({styleId,subjectType});assert.ok(p.includes(subjectType==='auto'&&AUTOMATIC_EDIT_PRESETS[styleId]?AUTOMATIC_EDIT_PRESETS[styleId].scene:g.scene));assert.match(p,/Preserve each retained face/);assert.ok(p.length<2500);if(subjectType==='auto')assert.doesNotMatch(p,/omit incidental people and supporting hands/);}}});
test('Nano public routing cannot leak into owner comparisons or Cloudflare Standard',()=>{assert.equal(customerNano({FAL_CUSTOMER_MODEL:'nano-banana',RECAST_HQ_SELECTED_PROVIDER:'fal'}),true);assert.equal(customerNano({FAL_CUSTOMER_MODEL:'nano-banana',RECAST_HQ_SELECTED_PROVIDER:'cloudflare'}),false);assert.equal(customerNano({FAL_CUSTOMER_MODEL:'nano-banana',RECAST_HQ_SELECTED_PROVIDER:'fal',RECAST_OWNER_PILOT_REQUEST:'true'}),false)});

test('Football costume does not reposition a held subject in either quality mode',async()=>{const {makeStandardAdventurePrompt}=await import('../src/standard-adventure-prompt.js');for(const subjectType of ['auto','pet']){const options={styleId:'football',subjectType};for(const prompt of [customerIdentityPrompt(options),makeStandardAdventurePrompt(options)]){assert.doesNotMatch(prompt,/all four paws grounded/);assert.match(prompt,/sports jersey/);}const prompt=customerIdentityPrompt(options);assert.match(prompt,/Keep original head angle, gaze, pose and framing/);assert.doesNotMatch(prompt,/Crop the lower body|frame a close head-and-upper-body/);}});

test('Automatic rules reject invented supporting faces while retaining pet and group choices',async()=>{const {makeStandardAdventurePrompt}=await import('../src/standard-adventure-prompt.js');for(const make of [customerIdentityPrompt,makeStandardAdventurePrompt]){const p=make({styleId:'football',subjectType:'auto'});assert.match(p,/Never invent a face for a cropped torso, arm or hand|never invent their faces/);assert.match(p,/visible reference face/);assert.match(p,/sports jersey/);}for(const subjectType of ['pet','person','group','person and pet']){const p=customerIdentityPrompt({styleId:'royal',subjectType});assert.doesNotMatch(p,/For people and animals, include only/);assert.match(p,/Preserve each retained face/);}});

test('One-pass removal explicitly reconstructs excluded areas without removing intended groups',async()=>{const {makeStandardAdventurePrompt}=await import('../src/standard-adventure-prompt.js');for(const make of [customerIdentityPrompt,makeStandardAdventurePrompt])for(const subjectType of ['auto','pet','person','person and pet','group','couple','family']){const p=make({styleId:'football',subjectType});assert.match(p,/remove only excluded figures completely|Remove excluded supporting figures/);assert.match(p,/Reconstruct (only )?newly exposed areas|fill their areas naturally/);assert.match(p,/Preserve included subjects|preserving included subjects/);assert.doesNotMatch(p,/change outfit and background only|CHANGE ONLY outfit/i);}});

test('concise adventure defaults retain complete scenes without arbitrary prompt truncation',()=>{
 for(const [styleId,guide] of Object.entries(ADVENTURE_GUIDES))for(const subjectType of ['auto','pet','person','group']){
  const p=customerIdentityPrompt({styleId,subjectType});
  assert.ok(p.trim().split(/\s+/).length<=230,styleId+' '+subjectType);
  assert.ok(p.includes(subjectType==='auto'&&AUTOMATIC_EDIT_PRESETS[styleId]?AUTOMATIC_EDIT_PRESETS[styleId].scene:guide.scene));
  assert.doesNotMatch(p,/Crop the lower body|frame a close head-and-upper-body/);
 }
 const notes='Keep the red scarf and the distinctive white eyebrow.';
 assert.ok(customerIdentityPrompt({styleId:'royal',notes,hasBranch:true}).includes(notes));
 assert.match(customerIdentityPrompt({styleId:'royal',hasBranch:true}),/last image supplies artwork continuity only/);
});

test('Automatic Royal and Dinosaur presets match the accepted lab prompt exactly',()=>{
 for(const styleId of ['royal','dinosaur-adventure']){
  const preset=AUTOMATIC_EDIT_PRESETS[styleId];
  assert.equal(customerIdentityPrompt({styleId,subjectType:'auto'}),customerIdentityPrompt({styleId:'custom',subjectType:'auto',notes:preset.outfit,customWorld:preset.scene}));
 }
});
test('Automatic affected presets do not introduce a separate human wardrobe or lose custom notes',()=>{
 for(const styleId of Object.keys(AUTOMATIC_EDIT_PRESETS)){
  const prompt=customerIdentityPrompt({styleId,subjectType:'auto',notes:'Keep the red trim.',hasBranch:true});
  assert.doesNotMatch(prompt,/Animals:|People:|linen vacation clothes|regal posture/);
  assert.match(prompt,/Keep the red trim/);assert.match(prompt,/last image supplies artwork continuity only/);
  assert.match(prompt,/Exclude faceless supporting figures/);
 }
 const group=customerIdentityPrompt({styleId:'dinosaur-adventure',subjectType:'person and pet'});
 assert.match(group,/Include the main people and pets together/);
});
