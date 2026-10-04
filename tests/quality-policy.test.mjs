import test from 'node:test';
import assert from 'node:assert/strict';
import {fallbackState} from '../public/quality-policy.js';
const ready={local:{ready:true},modes:{high:{ready:true},quick:{ready:true}}};
test('HQ hides fallback while available; exhaustion reveals explicit Standard option',()=>{
 assert.equal(fallbackState(ready,{enabled:true,remaining:2,standardRemaining:1}).show,false);
 const result=fallbackState(ready,{enabled:true,remaining:0,standardRemaining:1,purchaseBonus:5,resetAt:'2026-10-05T12:00:00Z'});
 assert.equal(result.standardReady,true);assert.match(result.message,/adds 5/);assert.match(result.message,/Free renders return/);
});
test('outages, unknown readiness and exhausted Standard never advertise usable fallback',()=>{
 assert.equal(fallbackState(null,null).standardReady,false);
 assert.equal(fallbackState({...ready,local:{ready:false}},{enabled:true,remaining:0,standardRemaining:1}).standardReady,false);
 assert.equal(fallbackState(ready,{enabled:true,remaining:0,standardRemaining:0}).standardReady,false);
 const busy={...ready,modes:{high:{ready:false,reason:'capacity'},quick:{ready:true}}};
 assert.match(fallbackState(busy,null).message,/busy/);assert.equal(fallbackState(busy,null).standardReady,true);
});
