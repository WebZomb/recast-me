import test from 'node:test';
import assert from 'node:assert/strict';
import {photoShoppingNotice} from '../public/photo-shopping.js';
const ready={ready:true},down={ready:false,reason:'unavailable'};
const state=(high,quick,local=true)=>({local:{ready:local},modes:{high,quick}});
test('outage guidance distinguishes total and partial engine failure',()=>{
 assert.match(photoShoppingNotice(state(down,down)),/AI picture creation is temporarily unavailable/);
 assert.match(photoShoppingNotice(state(down,ready)),/High Quality AI/);
 assert.match(photoShoppingNotice(state(ready,down)),/Standard AI/);
 assert.equal(photoShoppingNotice(state(ready,ready)),'');
});
test('unknown status, shared infrastructure failure and quotas do not claim engine outage or photo availability',()=>{
 assert.equal(photoShoppingNotice(null),'');
 assert.equal(photoShoppingNotice(state(down,down,false)),'');
 assert.equal(photoShoppingNotice(state({ready:false,reason:'quota'},ready)),'');
});
