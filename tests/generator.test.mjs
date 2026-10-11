import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import { highQualityTransform } from '../src/highquality.js';
import core from '../src/index.js';
import router from '../src/router.js';
import { imageMock } from './security-helpers.mjs';

// A stub carrying the JPEG signature; provider output is only passed through by these tests.
const image=Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(240,0x54),Buffer.from([0xff,0xd9])]).toString('base64');
const original=new File([Buffer.from([0xff,0xd8,0xff,0xd9])],'pet.jpg',{type:'image/jpeg'});

class ArtworkBucket {
  objects=new Map();
  async put(key,value){this.objects.set(key,typeof value==='string'?value:Buffer.from(value))}
  async get(key){
    const value=this.objects.get(key);
    if(value===undefined)return null;
    return {
      json:async()=>JSON.parse(String(value)),
      text:async()=>String(value),
      arrayBuffer:async()=>Uint8Array.from(value).buffer
    };
  }
}
function envFor(run){return {ARTWORK:new ArtworkBucket(),AI:{run},IMAGES:imageMock()}}
function submission({style='custom',world='A floating garden with glowing waterfalls',notes='Make my pet the captain',quality='high',photo=original,branch=null}={}){
  const form=new FormData();
  form.set('style',style);form.set('subject','pet');form.set('customWorld',world);
  form.set('notes',notes);form.set('qualityMode',quality);
  if(photo)form.set('image_0',photo);
  if(branch){
    form.set('branchRequestId',branch.requestId);form.set('branchAccessToken',branch.accessToken);
    form.set('branchPreview',original);
  }
  return new Request('https://recast.test/api/transform-v2',{method:'POST',body:form});
}

test('custom world reaches the actual model and saved metadata; the version is retrievable',async()=>{
  const calls=[];
  const env=envFor(async(model,{multipart})=>{
    const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    calls.push({model,prompt:form.get('prompt'),width:form.get('width'),height:form.get('height'),references:[...form.keys()].filter(key=>key.startsWith('input_image_'))});
    return {image};
  });
  const response=await highQualityTransform(submission(),env);
  assert.equal(response.status,200);
  const result=await response.json();
  assert.equal(result.persisted,true);
  assert.equal(result.style,'Custom World');
  assert.match(calls[0].prompt,/floating garden with glowing waterfalls/i);
  assert.match(calls[0].prompt,/pet.*captain/i);
  assert.equal(calls[0].model,'@cf/black-forest-labs/flux-2-dev');
  assert.deepEqual([calls[0].width,calls[0].height],['1024','1280']);
  assert.deepEqual(calls[0].references,['input_image_0']);
  const saved=JSON.parse(String(env.ARTWORK.objects.get(`requests/${result.requestId}/request.json`)));
  assert.equal(saved.customWorld,'A floating garden with glowing waterfalls');
  assert.equal(saved.previewMime,'image/jpeg');
  const preview=await core.fetch(new Request(`https://recast.test/api/request/${result.requestId}/preview?token=${result.accessToken}`),env);
  assert.equal((await preview.json()).image,result.image);
});

test('refining a saved version includes original pet image and the previous render',async()=>{
  const calls=[];
  const env=envFor(async(model,{multipart})=>{
    const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    calls.push({prompt:form.get('prompt'),refs:[...form.keys()].filter(k=>k.startsWith('input_image_'))});
    return {image};
  });
  const first=await (await highQualityTransform(submission(),env)).json();
  const second=await (await highQualityTransform(submission({photo:null,branch:first,world:'A snowy floating island'}),env)).json();
  assert.equal(second.persisted,true);
  assert.equal(calls[1].refs.length,2);
  assert.match(calls[1].prompt,/last image is a previous Recast for continuity/i);
  const saved=JSON.parse(String(env.ARTWORK.objects.get(`requests/${second.requestId}/request.json`)));
  assert.equal(saved.parentRequestId,first.requestId);
  assert.equal(saved.inputCount,2);
  const forbidden=await highQualityTransform(submission({photo:null,branch:{...first,accessToken:'wrong'}}),env);
  assert.equal(forbidden.status,403);
  assert.equal(calls.length,2);
});

test('standard mode reports provider capacity without changing away from FLUX.2 dev',async()=>{
  const models=[];
  const env=envFor(async model=>{models.push(model);throw new Error('3040 out of capacity')});
  const response=await highQualityTransform(submission({quality:'quick'}),env);
  assert.equal(response.status,503);
  assert.equal((await response.json()).reason,'capacity');
  assert.deepEqual(models,['@cf/black-forest-labs/flux-2-dev']);
});

test('generated image is not reported saved when R2 fails',async()=>{
  const env=envFor(async()=>({image}));
  env.ARTWORK.put=async()=>{throw new Error('storage unavailable')};
  const result=await (await highQualityTransform(submission(),env)).json();
  assert.equal(result.persisted,false);
  assert.match(result.storageError,/storage unavailable/);
});

test('the legacy URL uses the current high-quality generator too',async()=>{
  const models=[];
  const env=envFor(async model=>{models.push(model);return {image}});
  const form=await submission().formData();
  const response=await router.fetch(new Request('https://recast.test/api/transform',{method:'POST',body:form}),env,{});
  assert.equal((await response.json()).persisted,true);
  assert.deepEqual(models,['@cf/black-forest-labs/flux-2-dev']);
});

test('preset pet renders restyle the pet and ignore stale custom world text',async()=>{
  let prompt='';
  const env=envFor(async(_model,{multipart})=>{
    const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    prompt=String(form.get('prompt'));
    return {image};
  });
  const result=await (await highQualityTransform(submission({style:'game',world:'A floating garden with glowing waterfalls',notes:''}),env)).json();
  assert.match(prompt,/fitted adventure vest/i);
  assert.match(prompt,/IDENTITY FIRST:/);
  assert.match(prompt,/exact eyes, nose, muzzle/i);
  assert.match(prompt,/do not invent masculine\/feminine traits/i);
  assert.match(prompt,/no obvious cutout/i);
  assert.doesNotMatch(prompt,/floating garden/i);
  const saved=JSON.parse(String(env.ARTWORK.objects.get(`requests/${result.requestId}/request.json`)));
  assert.equal(saved.customWorld,'');
  assert.equal(saved.promptVersion,'identity-first-48-worlds-v1');
});

test('provider-wide free allowance is reported as shared capacity, not a visitor limit',async()=>{
  const env=envFor(async()=>{throw new Error('3036 used up your daily free allocation')});
  const response=await highQualityTransform(submission(),env);
  assert.equal(response.status,429);
  const result=await response.json();
  assert.equal(result.reason,'quota');
  assert.match(result.userMessage,/site-wide limit, not your personal render count/i);
});

test('high-quality busy rejection does not automatically spend a second provider submission',async()=>{
  const models=[];
  const env=envFor(async model=>{models.push(model);if(models.length===1)throw new Error('3040 out of capacity');return {image};});
  const response=await highQualityTransform(submission(),env);
  assert.equal(response.status,503);
  const result=await response.json();
  assert.equal(result.reason,'capacity');
  assert.deepEqual(models,['@cf/black-forest-labs/flux-2-dev']);
});

test('provider timeout is distinct from capacity and does not auto-retry',async()=>{
  let calls=0;const env=envFor(async()=>{calls++;throw new Error('upstream request timed out')});
  const response=await highQualityTransform(submission(),env);assert.equal(response.status,504);
  const result=await response.json();assert.equal(result.reason,'timeout');assert.equal(calls,1);
  assert.match(result.userMessage,/timed out/i);
});

test('generation source has no local Promise.race attempt timer',()=>{
  const source=readFileSync(new URL('../src/highquality.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/function\s+withAttemptTimeout/);
  assert.doesNotMatch(source,/new Error\(["']attempt timeout/);
  assert.doesNotMatch(source,/return\s+await\s+Promise\.race/);
});

test('a recent quota failure blocks repeat paid calls briefly, then permits a fresh attempt',async()=>{
  let calls=0;
  const env=envFor(async()=>{calls++;throw new Error('3036 daily free allocation');});
  await highQualityTransform(submission(),env);
  assert.equal((await highQualityTransform(submission(),env)).status,429);
  assert.equal(calls,1);
  env.ARTWORK.objects.set('system/render-health-high.json',JSON.stringify({mode:'high',status:'failed',reason:'quota',retryAt:'2000-01-01'}));
  env.AI.run=async()=>{calls++;return {image};};
  assert.equal((await highQualityTransform(submission(),env)).status,200);assert.equal(calls,2);
});

test('owner comparison rejects missing authorization before any inference',async()=>{
 let calls=0;const env={...envFor(async()=>{calls++;return {image}}),ADMIN_TOKEN:'private-test'};
 const res=await router.fetch(new Request('https://recast.test/api/admin/model-test?model=klein4',{method:'POST',body:new FormData()}),env,{});
 assert.equal(res.status,401);assert.equal(calls,0);
});
test('owner comparison runs allowlisted klein4 without changing public engine config',async()=>{
 const calls=[];const env={...envFor(async model=>{calls.push(model);return {image}}),ADMIN_TOKEN:'private-test',IMAGE_MODEL_QUICK:'@cf/black-forest-labs/flux-2-klein-9b'};
 const req=new Request('https://recast.test/api/admin/model-test?model=klein4',{method:'POST',headers:{Authorization:'Bearer private-test'},body:await submission().formData()});
 const res=await router.fetch(req,env,{});assert.equal(res.status,200);assert.deepEqual(calls,['@cf/black-forest-labs/flux-2-klein-4b']);assert.equal(env.IMAGE_MODEL_QUICK,'@cf/black-forest-labs/flux-2-klein-9b');
 const bad=await router.fetch(new Request('https://recast.test/api/admin/model-test?model=unapproved',{method:'POST',headers:{Authorization:'Bearer private-test'},body:new FormData()}),env,{});assert.equal(bad.status,400);assert.equal(calls.length,1);
});

test('Workers AI calls request immediate busy rejection instead of entering a capacity queue',async()=>{
  const options=[];const env=envFor(async(_model,_input,runOptions)=>{options.push(runOptions);return {image}});
  const response=await highQualityTransform(submission(),env);assert.equal(response.status,200);
  assert.deepEqual(options,[{rejectIfBusy:true}]);
});

// A moderation rejection must not trigger a rewritten retry.
test('Royal references retain anatomy; provider moderation stops after one call',async()=>{
  const prompts=[];
  const env=envFor(async(model,{multipart})=>{
    assert.equal(model,'@cf/black-forest-labs/flux-2-dev');
    const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
    prompts.push(String(form.get('prompt')));
    if(prompts.length===1)throw new Error('3030 moderation');
    return {image};
  });
  const form=await submission({style:'royal',notes:''}).formData();
  form.set('subject','person and pet');form.set('image_1',original);form.set('referenceLabels','["person1","pet"]');
  const response=await highQualityTransform(new Request('https://recast.test/api/transform-v2',{method:'POST',body:form}),env);
  assert.equal(response.status,422);assert.equal(prompts.length,1);assert.equal((await response.json()).retryable,false);
  for(const prompt of prompts){
    assert.match(prompt,/Input image 0 \(photo 1\) shows person 1/);
    assert.match(prompt,/Input image 1 \(photo 2\) shows the same pet/);
    assert.match(prompt,/never human hands/);
    assert.match(prompt,/Multiple reference photos clarify identity/);
    assert.match(prompt,/hairline, skin tone, natural age and expression/);
    assert.doesNotMatch(prompt,/Preserve all 2 reference subjects/);
  }
});


test('illustrated and realistic worlds preserve identity instructions in both quality modes and mixed groups',async()=>{
  for(const quality of ['high','quick']){
    for(const style of ['anime','comic','cutout-comedy','royal','noir','custom']){
      let prompt='';
      const env=envFor(async(model,{multipart})=>{
        const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
        prompt=String(form.get('prompt'));return {image};
      });
      const base=submission({style,quality});
      const body=await base.formData();body.set('subject','family');
      const response=await highQualityTransform(new Request(base.url,{method:'POST',body}),env);
      assert.equal(response.status,200,`${quality}/${style}`);
      assert.match(prompt,/IDENTITY FIRST:/);
      assert.match(prompt,/No generic beauty face/);
      assert.match(prompt,/Keep faces visible and original head angles/);
      assert.match(prompt,/change drawing style, NOT facial identity/);
      assert.match(prompt,/CHANGE ONLY outfit, background, props and scene lighting/);
      if(quality==='high'){
        assert.ok(prompt.indexOf('IDENTITY FIRST:') < prompt.indexOf('WORLD:'));
      }else{
        // Klein gets the scene FIRST so a shorter prompt actually changes the world.
        assert.ok(prompt.startsWith('EDIT THE UPLOADED PHOTO(S)'));
        assert.ok(prompt.indexOf('IDENTITY FIRST:') < prompt.indexOf('WORLD:'));
        assert.ok(prompt.length<3500,'Standard must not re-use the long HQ prompt');
      }
    }
  }
});


test('Cloudflare 3043 records an outage and blocks repeated submissions during cooldown',async()=>{
  for(const quality of ['high','quick']){
    let calls=0;
    const env=envFor(async()=>{calls++;throw new Error('3043: Internal server error')});
    const response=await highQualityTransform(submission({quality}),env);
    const body=await response.json();
    assert.equal(response.status,503);
    assert.equal(body.reason,'unavailable');
    assert.match(body.userMessage,/temporarily unavailable/);
    const diagnostic=await (await env.ARTWORK.get(`diagnostics/generation/${body.diagnosticId}.json`)).json();
    assert.equal(diagnostic.providerCode,3043);
    const health=await (await env.ARTWORK.get(`system/render-health-${quality}.json`)).json();
    assert.equal(health.reason,'unavailable');
    assert.ok(Date.parse(health.retryAt)>Date.now());
    const retry=await highQualityTransform(submission({quality}),env);
    assert.equal(retry.status,503);
    assert.equal((await retry.json()).reason,'unavailable');
    assert.equal(calls,1,'no automatic retry or second billed provider call during cooldown');
  }
});
