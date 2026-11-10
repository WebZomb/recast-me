import test from 'node:test';
import assert from 'node:assert/strict';
import {forEachBounded} from '../src/commerce-concurrency.js';
test('private work is bounded and started operations finish before an error escapes',async()=>{
 let active=0,peak=0,settled=0;const visited=[];
 await assert.rejects(forEachBounded([0,1,2,3,4],async n=>{
  visited.push(n);active++;peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,n===0?1:10));active--;settled++;
  if(n===0)throw Error('missing supplier image');
 },2),/missing supplier image/);
 assert.equal(active,0);assert.equal(peak,2);assert.equal(settled,2);assert.deepEqual(visited,[0,1]);
});
test('parallel cart enrichment preserves input order without shared counters or retries',async()=>{
 const lines=Array.from({length:12},(_,i)=>({id:i}));let active=0,peak=0;
 await forEachBounded(lines,async line=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,line.id%3));line.price=line.id*10;active--;});
 assert.equal(peak,4);assert.deepEqual(lines.map(l=>l.id),Array.from({length:12},(_,i)=>i));assert.ok(lines.every(l=>l.price===l.id*10));
 await assert.rejects(forEachBounded([],()=>{},5),TypeError);
});
