import test from 'node:test';
import assert from 'node:assert/strict';
import { highQualityTransform } from '../src/highquality.js';
import core from '../src/index.js';
import router from '../src/router.js';

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
function envFor(run){return {ARTWORK:new ArtworkBucket(),AI:{run}}}
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
  assert.match(calls[1].prompt,/last reference image is the previous successful Recast/i);
  const saved=JSON.parse(String(env.ARTWORK.objects.get(`requests/${second.requestId}/request.json`)));
  assert.equal(saved.parentRequestId,first.requestId);
  assert.equal(saved.inputCount,2);
  const forbidden=await highQualityTransform(submission({photo:null,branch:{...first,accessToken:'wrong'}}),env);
  assert.equal(forbidden.status,403);
  assert.equal(calls.length,2);
});

test('quick mode reports provider capacity instead of downgrading to a weaker model',async()=>{
  const models=[];
  const env=envFor(async model=>{models.push(model);throw new Error('3040 out of capacity')});
  const response=await highQualityTransform(submission({quality:'quick'}),env);
  assert.equal(response.status,503);
  assert.equal((await response.json()).reason,'capacity');
  assert.deepEqual(models,['@cf/black-forest-labs/flux-2-klein-9b']);
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
  assert.match(prompt,/heroic pet harness/i);
  assert.match(prompt,/never appear as an unchanged photo cutout/i);
  assert.doesNotMatch(prompt,/floating garden/i);
  const saved=JSON.parse(String(env.ARTWORK.objects.get(`requests/${result.requestId}/request.json`)));
  assert.equal(saved.customWorld,'');
  assert.equal(saved.promptVersion,'v1.4');
});

test('provider-wide free allowance is reported as shared capacity, not a visitor limit',async()=>{
  const env=envFor(async()=>{throw new Error('3036 used up your daily free allocation')});
  const response=await highQualityTransform(submission(),env);
  assert.equal(response.status,429);
  const result=await response.json();
  assert.equal(result.reason,'quota');
  assert.match(result.userMessage,/site-wide limit, not your personal render count/i);
});

test('high-quality busy rejection retries once on the same model and preserves quality',async()=>{
  const models=[];
  const env=envFor(async model=>{models.push(model);if(models.length===1)throw new Error('3040 out of capacity');return {image};});
  const response=await highQualityTransform(submission(),env);
  assert.equal(response.status,200);
  assert.deepEqual(models,['@cf/black-forest-labs/flux-2-dev','@cf/black-forest-labs/flux-2-dev']);
});

test('a recent quota failure blocks repeat paid calls briefly, then permits a fresh attempt',async()=>{
  let calls=0;
  const env=envFor(async()=>{calls++;throw new Error('3036 daily free allocation');});
  await highQualityTransform(submission(),env);
  assert.equal((await highQualityTransform(submission(),env)).status,429);
  assert.equal(calls,1);
  env.ARTWORK.objects.set('system/render-health.json',JSON.stringify({status:'failed',reason:'quota',retryAt:'2000-01-01'}));
  env.AI.run=async()=>{calls++;return {image};};
  assert.equal((await highQualityTransform(submission(),env)).status,200);assert.equal(calls,2);
});
