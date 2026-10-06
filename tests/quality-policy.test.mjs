import test from 'node:test';import assert from 'node:assert/strict';
import {fallbackState,creditSummary} from '../public/quality-policy.js';
const ready={local:{ready:true},modes:{high:{ready:true},quick:{ready:true}}};
test('HQ hides Standard while daily or purchased High Quality remains',()=>{
 for(const remaining of [1,3,6])assert.equal(fallbackState(ready,{enabled:true,remaining,standardRemaining:5}).show,false);
 const stale=fallbackState(ready,{enabled:true,remaining:3,standardRemaining:5},'quick');assert.equal(stale.returnToHigh,true);assert.equal(stale.show,false);
});
test('exhaustion reveals explicit lower-quality warning, reset and three-credit next-Recast offer',()=>{
 const result=fallbackState(ready,{enabled:true,remaining:0,standardRemaining:5,purchaseBonus:3,resetAt:'2026-10-05T12:00:00Z'});
 assert.equal(result.standardReady,true);assert.match(result.message,/3 bonus High Quality/);assert.match(result.message,/refreshes/);assert.match(result.message,/weaker likeness/);assert.match(result.message,/next Recast/);assert.match(result.message,/do not change an order/);
});
test('outages and unknown credit state do not expose Standard',()=>{
 const busy={...ready,modes:{high:{ready:false,reason:'capacity'},quick:{ready:true}}};
 for(const credits of [null,{enabled:false},{enabled:true},{enabled:true,remaining:2}]){
  const result=fallbackState(busy,credits);assert.equal(result.show,false);assert.equal(result.standardReady,false);
 }
});
test('exhausted Standard and local outage never advertise an available render',()=>{
 assert.equal(fallbackState(null,{enabled:true,remaining:0,standardRemaining:5}).standardReady,false);
 assert.equal(fallbackState({...ready,local:{ready:false}},{enabled:true,remaining:0,standardRemaining:5}).standardReady,false);
 const noStandard=fallbackState(ready,{enabled:true,remaining:0,standardRemaining:0});assert.equal(noStandard.standardReady,false);assert.match(noStandard.message,/also used/);
});
test('daily and purchase balances remain distinct; Standard counter appears only when needed',()=>{
 assert.equal(creditSummary({enabled:false}), '');
 assert.match(creditSummary({enabled:true,free:2,freeAllowance:3,bonus:3,remaining:5}),/2 of 3 daily previews left \+ 3 purchase credits/);
 assert.doesNotMatch(creditSummary({enabled:true,free:2,remaining:2}),/Standard/);
 assert.match(creditSummary({enabled:true,free:0,remaining:0,standardRemaining:4}),/Standard: 4 left/);
});
