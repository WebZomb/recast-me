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
test('HQ and Standard balances show explicit daily allowance, used counts, and distinct refresh times',()=>{
 assert.equal(creditSummary({enabled:false}), '');
 assert.equal(creditSummary({enabled:true,initialized:false}),'Preparing your preview allowances…');
 const credits={enabled:true,initialized:true,free:2,freeAllowance:3,bonus:3,remaining:5,standardAllowance:5,standardRemaining:4,resetAt:'2026-10-10T16:00:00Z',standardResetAt:'2026-10-11T16:00:00Z'};
 const locked=creditSummary(credits);
 assert.match(locked,/High Quality: 2 of 3 daily previews left \\(1 used\\) \\+ 3 purchase credits/);
 assert.doesNotMatch(locked,/Standard:/,'Standard should stay hidden until available');
 const unlocked=creditSummary({...credits,free:0,bonus:0,remaining:0});
 assert.match(unlocked,/High Quality: 0 of 3 daily previews left \\(3 used\\)/);
 assert.match(unlocked,/\\nStandard: 4 of 5 daily previews left \\(1 used\\)/);
 assert.match(unlocked,/Standard: .*Refreshes/,'Standard has its own 24-hour reset time');
});
test('confirmed HQ outage shows Standard count without consuming remaining HQ previews',()=>{
 const credits={enabled:true,free:3,freeAllowance:3,remaining:3,bonus:0,standardRemaining:1,standardAllowance:7,standardResetAt:'2026-10-11T12:00:00Z'};
 const shown=creditSummary(credits,true);
 assert.match(shown,/High Quality: 3 of 3 daily previews left \\(0 used\\)/);
 assert.match(shown,/Standard: 1 of 7 daily previews left \\(6 used\\)/);
 assert.match(shown,/Offered only while High Quality is unavailable/);
 assert.doesNotMatch(creditSummary(credits),/Standard:/,'Do not advertise a locked quality mode prematurely');
 const empty=creditSummary({...credits,free:0,remaining:0,standardRemaining:0});
 assert.match(empty,/Standard: 0 of 7 daily previews left \\(7 used\\)/);
 assert.doesNotMatch(empty,/Offered only while High Quality is unavailable/);
});
