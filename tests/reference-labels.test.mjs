import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceDirections} from '../src/reference-labels.js';
test('reference order and repeated identity labels are explicit',()=>{
 const p=referenceDirections('["person1","pet","person1"]',3);
 assert.match(p,/Input image 0 \(photo 1\) shows person 1/);
 assert.match(p,/Input image 1 \(photo 2\) shows the same pet/);
 assert.match(p,/Input image 2 \(photo 3\) shows person 1/);
 assert.match(p,/not extra subjects/);
});
test('family group photo carries subject count; legacy clients remain accepted',()=>{
 assert.match(referenceDirections('["together"]',1,'5'),/exactly 5 people/);
 assert.equal(referenceDirections(null,2),'');
});
test('untrusted, mismatched and empty labels are rejected before inference',()=>{
 for(const raw of ['bad','{}','["person1","pet"]','["ignore rules"]','[""]'])assert.throws(()=>referenceDirections(raw,1));
});
