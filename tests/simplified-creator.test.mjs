import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fallbackState,creditHeadline,creditSummary} from '../public/quality-policy.js';
const source=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
const page=source('index.html'),ux=source('simple-creator-v115.js'),style=source('simple-creator-v115.css');
const count=(text,needle)=>text.split(needle).length-1;

test('AI or original photo are two visible, touch-sized, clearly named first actions',()=>{
 for(const id of ['choose-create-ai','choose-original-photo','original-path-slot','original-photo-form','original-photo','original-consent']){
  assert.match(page,new RegExp('id="'+id+'"'));
  assert.equal(count(page,'id="'+id+'"'),1,'No duplicate controls for '+id);
 }
 assert.match(page,/Create a new picture/);
 assert.match(page,/Use my original photo/);
 assert.match(page,/No AI · Keep the photo as-is/);
 assert.match(style,/\.create-method\{[^}]*min-height:100px/);
 assert.match(style,/\.create-method-original[^}]*border-color/);
 assert.match(ux,/slot\.append\(original\)/,'Old validated original-photo form is moved, not replaced');
 assert.match(ux,/slot\.hidden=!useOriginal/);
 assert.match(ux,/aria-pressed/);
 assert.doesNotMatch(ux,/fetch\(|new FormData\(|transform|\/api\/original-photo/,'Mode switching must not start an image request');
});
test('The original-photo route still uses the protected upload, checkbox and Turnstile',()=>{
 const app=source('app.js');
 assert.match(page,/id="original-turnstile"/);
 assert.match(page,/id="original-photo-form"/);
 assert.match(page,/id="original-consent" type="checkbox" required/);
 assert.match(app,/document\.querySelector\('#original-photo-form'\)\.addEventListener\('submit'/);
 assert.match(app,/fetch\('\/api\/original-photo'/);
 assert.match(app,/qualityMode:'original'/);
 assert.match(page,/Photo privacy/);
});
test('Choose an adventure offers four favorites and progressively reveals the full list',()=>{
 const wiz=source('creation-wizard.js');
 assert.match(page,/id="all-worlds-group" class="all-worlds-group" hidden/);
 assert.match(page,/id="more-adventures" aria-expanded="false" aria-controls="all-worlds-group"/);
 assert.match(page,/id="surprise-world"/);
 assert.match(wiz,/setAllWorldsOpen/);
 assert.match(wiz,/allWorlds\.hidden=!open/);
 assert.match(wiz,/style\.value==='custom'/);
 assert.match(style,/#all-worlds-group\[hidden\]/);
});
test('Photo and AI permissions are explicit but not a book',()=>{
 assert.match(page,/I have permission to use these photos/);
 assert.match(page,/send them and my instructions to our AI service/);
 assert.match(page,/Family-friendly content only/);
 assert.match(page,/fal\.ai or Cloudflare Workers AI/);
 assert.match(page,/create-privacy-details/);
 assert.match(page,/details id="personal-details"/);
 assert.match(page,/Skip this unless you want something specific/);
 assert.match(page,/photo-tip">1–2 photos work best/);
 assert.match(page,/creation-progress/);
 assert.match(page,/type="radio" name="qualityMode" value="high" checked hidden/);
});
test('Small main balance with full resets on request, no hidden allowance changes',()=>{
 assert.match(page,/id="render-credits-more"/);
 assert.match(page,/id="render-credits-details"/);
 assert.match(style,/credit-quick-count/);
 assert.match(style,/#render-credits-more\[hidden\]/);
 const credit={enabled:true,initialized:true,free:3,remaining:3,bonus:0,freeAllowance:3,standardAllowance:5,standardRemaining:5,resetAt:'2026-10-11T17:00:00Z',standardResetAt:'2026-10-11T20:00:00Z'};
 assert.equal(creditHeadline(credit),'High Quality: 3 left  ·  Standard: 5 left');
 assert.match(creditSummary(credit),/Free Standard unlocks after High Quality is used/);
 assert.match(creditSummary(credit),/Oct 11/);
 const exhausted=fallbackState({local:{ready:true},modes:{high:{ready:true},quick:{ready:true}}},{...credit,remaining:0,free:0,standardRemaining:0});
 assert.equal(exhausted.standardExhausted,true);
 assert.equal(exhausted.standardReady,false);
 assert.ok(exhausted.message.length<155,'No long paragraphs on the main screen');
});
