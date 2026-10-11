import test from 'node:test';
import assert from 'node:assert/strict';
import {originalReferenceCount,prepareSavedReference} from '../src/refinement-references.js';
import {imageMock,CLEAN} from './security-helpers.mjs';

test('legacy saved refinement excludes its last generated picture from original references',()=>{
  assert.equal(originalReferenceCount({inputCount:2,parentRequestId:'previous'}),1);
  assert.equal(originalReferenceCount({inputCount:4}),3);
  assert.equal(originalReferenceCount({inputCount:3,originalInputCount:2,parentRequestId:'previous'}),2);
  for(const inputCount of [0,-1,5,'bad',1.5])assert.equal(originalReferenceCount({inputCount}),0);
});

test('fal restores the full-detail saved reference while Cloudflare only resizes oversized files',async()=>{
  const file=new File([CLEAN],'original.jpg',{type:'image/jpeg'});
  assert.equal(await prepareSavedReference({},file,{qualityMode:'high',provider:'fal'}),file);
  const env={IMAGES:imageMock()};
  env.IMAGES.info=async()=>({width:375,height:500});
  assert.equal(await prepareSavedReference(env,file,{qualityMode:'quick',provider:'fal'}),file);
  assert.equal(env.IMAGES.operations.length,0);
  env.IMAGES.info=async()=>({width:768,height:1024});
  await prepareSavedReference(env,file,{qualityMode:'high',provider:'cloudflare'});
  assert.deepEqual(env.IMAGES.operations[0],['transform',{width:500,height:500,fit:'scale-down'}]);
});
