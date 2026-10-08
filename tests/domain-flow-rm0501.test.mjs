import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRecastLink,privateRecastLink} from '../public/recast-history.js';

test('legacy private link is accepted on canonical domain',()=>{const v=readRecastLink('https://recast-me.sergz24.workers.dev/#recast=RC-ABCDEFGH&key=secret-token','https://recastmeai.com');assert.equal(v.requestId,'RC-ABCDEFGH');assert.equal(v.accessToken,'secret-token');});
test('new private links stay on canonical domain',()=>{assert.ok(privateRecastLink('https://recastmeai.com',{requestId:'RC-ABCDEFGH',accessToken:'secret-token'}).startsWith('https://recastmeai.com/#'));});
test('production config and audit use canonical domain',()=>{const w=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'),a=readFileSync(new URL('../scripts/launch-audit.cjs',import.meta.url),'utf8');assert.ok(w.includes('https://recastmeai.com'));assert.ok(a.includes("const base='https://recastmeai.com'"));});
test('product flow hides redundant recommended row and keeps edit control',()=>{const c=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');assert.ok(!c.includes('Recommended layout applied</span></div>'));assert.ok(c.includes('Preview my product'));assert.ok(c.includes('compact-product-edit'));assert.ok(c.includes('Reset to best setup'));});
test('static mug cards use matching lifestyle art',()=>{for(const p of ['../public/app.js','../public/checkout.js']){const s=readFileSync(new URL(p,import.meta.url),'utf8');assert.ok(s.includes('recast-lifestyle-mug-rm059.png'));assert.ok(!s.includes('recast-neon-mug-cutout-v48.png'));}});
