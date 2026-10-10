import test from 'node:test';import assert from 'node:assert/strict';
import {fallbackState,creditSummary,creditHeadline} from '../public/quality-policy.js';
const ready={local:{ready:true},modes:{high:{ready:true},quick:{ready:true}}};
test('HQ hides Standard while daily or purchased High Quality remains',()=>{
 for(const remaining of [1,3,6])assert.equal(fallbackState(ready,{enabled:true,remaining,standardRemaining:5}).show,false);
 const stale=fallbackState(ready,{enabled:true,remaining:3,standardRemaining:5},'quick');assert.equal(stale.returnToHigh,true);assert.equal(stale.show,false);
});
test('exhaustion reveals explicit lower-quality warning, reset and three-credit next-Recast offer',()=>{
 const result=fallbackState(ready,{enabled:true,remaining:0,standardRemaining:5,purchaseBonus:3,resetAt:'2026-10-05T12:00:00Z'});
 assert.equal(result.standardReady,true);assert.match(result.message,/High Quality is used up/);assert.match(result.message,/Resets/);assert.match(result.message,/lower detail/);assert.ok(result.message.length<160,'A simple choice should not be a book');
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
 const noStandard=fallbackState(ready,{enabled:true,remaining:0,standardRemaining:0,standardAllowance:5});assert.equal(noStandard.standardReady,false);assert.equal(noStandard.standardExhausted,true);assert.match(noStandard.message,/All free previews are used up/);
});
test('HQ and Standard balances show explicit daily allowance, used counts, and distinct refresh times',()=>{
 assert.equal(creditSummary({enabled:false}), '');
 assert.equal(creditSummary({enabled:true,initialized:false}),'Preparing your preview allowances…');
 const credits={enabled:true,initialized:true,free:2,freeAllowance:3,bonus:3,remaining:5,standardAllowance:5,standardRemaining:4,resetAt:'2026-10-10T16:00:00Z',standardResetAt:'2026-10-11T16:00:00Z'};
 const locked=creditSummary(credits);
 assert.match(locked,/High Quality: 2 of 3 daily previews left \(1 used\) \+ 3 merchandise bonus/);
 assert.match(locked,/Standard: 4 of 5 daily previews left \(1 used\)/);
 assert.match(locked,/Free Standard unlocks after High Quality is used/,'Standard balance can be visible while its render button is locked');
 const unlocked=creditSummary({...credits,free:0,bonus:0,remaining:0});
 assert.match(unlocked,/High Quality: 0 of 3 daily previews left \(3 used\)/);
 assert.match(unlocked,/\nStandard: 4 of 5 daily previews left \(1 used\)/);
 assert.match(unlocked,/Standard: .*Refreshes/,'Standard has its own 24-hour reset time');
});
test('confirmed HQ outage shows Standard count without consuming remaining HQ previews',()=>{
 const credits={enabled:true,free:3,freeAllowance:3,remaining:3,bonus:0,standardRemaining:1,standardAllowance:7,standardResetAt:'2026-10-11T12:00:00Z'};
 const shown=creditSummary(credits,true);
 assert.match(shown,/High Quality: 3 of 3 daily previews left \(0 used\)/);
 assert.match(shown,/Standard: 1 of 7 daily previews left \(6 used\)/);
 assert.match(shown,/Offered while High Quality is unavailable/);
 assert.match(creditSummary(credits),/Standard: 1 of 7 daily previews left \(6 used\)/,'Show both counts without unlocking Standard');
 assert.match(creditSummary(credits),/Free Standard unlocks after High Quality is used/);
 const empty=creditSummary({...credits,free:0,remaining:0,standardRemaining:0});
 assert.match(empty,/Standard: 0 of 7 daily previews left \(7 used\)/);
 assert.doesNotMatch(empty,/Offered while High Quality is unavailable/);
});

test('Spent Standard has an unmistakable separate reset; no unusable Standard invitation',()=>{
 const credits={enabled:true,remaining:0,standardRemaining:0,standardAllowance:5,purchaseBonus:3,resetAt:'2026-10-10T17:59:00Z',standardResetAt:'2026-10-11T02:28:00Z'};
 const result=fallbackState(ready,credits);
 assert.equal(result.show,true);
 assert.equal(result.standardReady,false);
 assert.equal(result.standardExhausted,true);
 assert.match(result.message,/All free previews are used up/);
 assert.match(result.message,/High Quality resets/);
 assert.match(creditSummary(credits),/Standard: .*Refreshes/,'Exact Standard reset remains one tap away');
 assert.doesNotMatch(result.message,/You can try Standard/);
 const outage=fallbackState({...ready,standardOutageAvailable:true},{...credits,remaining:1});
 assert.equal(outage.standardExhausted,true);
 assert.match(outage.message,/High Quality is unavailable, and Standard is used up/);
});

test('purchased Standard unlocks its own mode while High Quality is still available',()=>{
 const credits={enabled:true,remaining:3,free:3,freeAllowance:3,bonus:0,standardRemaining:5,standardAllowance:5,purchasedStandard:20,standardEffectiveRemaining:25};
 const result=fallbackState(ready,credits,'quick');
 assert.equal(result.show,true);assert.equal(result.standardReady,true);assert.equal(result.returnToHigh,false);
 assert.match(result.message,/Your Standard credits are ready/);
 const counter=creditSummary(credits);
 assert.match(counter,/20 purchased Standard/);
});
test('purchased HQ and merchandise bonuses have distinct read-only balance labels',()=>{
 const credits={enabled:true,remaining:26,free:3,freeAllowance:3,bonus:3,purchasedHigh:20,standardAllowance:5,standardRemaining:5};
 assert.match(creditSummary(credits),/3 merchandise bonus/);
 assert.match(creditSummary(credits),/20 purchased HQ/);
});

test('Compact credit summary is clear, while exact reset times remain behind details',()=>{
 const credits={enabled:true,initialized:true,remaining:5,free:2,freeAllowance:3,bonus:3,standardAllowance:5,standardRemaining:4,standardResetAt:'2026-10-11T12:00:00Z',resetAt:'2026-10-10T12:00:00Z'};
 assert.equal(creditHeadline(credits),'High Quality: 5 left  ·  Standard: 4 left');
 assert.match(creditSummary(credits),/High Quality: 2 of 3 daily previews left/);
 assert.match(creditSummary(credits),/Standard: 4 of 5 daily previews left/);
 assert.match(creditSummary(credits),/Refreshes/);
 assert.equal(creditHeadline({...credits,remaining:0,standardRemaining:0}),'High Quality: 0 left  ·  Standard: 0 left');
 assert.equal(creditHeadline({...credits,remaining:25,purchasedStandard:20,standardEffectiveRemaining:24}),'High Quality: 25 left  ·  Standard: 24 left');
});
test('Unavailable or fully used engines never expose unusable Standard button',()=>{
 const credits={enabled:true,remaining:0,standardRemaining:0,resetAt:'2026-10-10T16:00:00Z',standardResetAt:'2026-10-11T16:00:00Z'};
 const state=fallbackState(ready,credits);
 assert.equal(state.standardReady,false);
 assert.equal(state.standardExhausted,true);
 assert.ok(state.message.length<160);
 assert.doesNotMatch(state.message,/You can try Standard/);
 assert.match(creditSummary({...credits,initialized:true,free:0,freeAllowance:3,standardAllowance:5}),/Standard: 0 of 5/);
});
