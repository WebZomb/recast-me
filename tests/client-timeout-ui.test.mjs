import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('client labels timeout separately from confirmed busy',()=>{assert.match(source,/reason==='timeout'/);assert.match(source,/confirmed busy response/i);assert.match(source,/timed out — checking readiness/i)});
test('readiness dot exposes ready waiting and error states',()=>{assert.match(source,/dot\.dataset\.state/);const css=readFileSync(new URL('../public/site-v10.css',import.meta.url),'utf8');for(const state of ['ready','waiting','error'])assert.match(css,new RegExp(`data-state=\"${state}\"`))});

test('image generation has no browser abort timer that can orphan a provider render',()=>{assert.doesNotMatch(source,/qualityMode==='quick'\?135000:270000/);assert.doesNotMatch(source,/fetch\('\/api\/transform-v2'[\s\S]{0,160}signal:controller\.signal/)});
