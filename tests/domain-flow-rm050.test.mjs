import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRecastLink,privateRecastLink} from '../public/recast-history.js';

test('old private links restore on the new canonical domain without a new render',()=>{const v=readRecastLink('https://recast-me.sergz24.workers.dev/#recast=RC-ABCDEFGH&key=secret-token','https://recastmeai.com');assert.equal(v.requestId,'RC-ABCDEFGH');assert.equal(v.accessToken,'secret-token');});
test('new private links are generated on recastmeai.com',()=>{const link=privateRecastLink('https://recastmeai.com',{requestId:'RC-ABCDEFGH',accessToken:'secret-token'});assert.ok(link.startsWith('https://recastmeai.com/#'));});
test('production config and public audit use canonical domain',()=>{const w=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'),a=readFileSync(new URL('../scripts/launch-audit.cjs',import.meta.url),'utf8');assert.ok(w.includes('PUBLIC_APP_URL'));assert.ok(w.includes('https://recastmeai.com'));assert.ok(a.includes('https://recastmeai.com'));});
test('purchase UI applies defaults quietly and keeps edit controls in card markup',()=>{const c=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');assert.ok(!c.includes('Recommended setup applied'));assert.ok(!c.includes('Preview recommended design'));assert.ok(c.includes('Preview on product'));assert.ok(c.includes('compact-product-edit'));});
test('catalog mug uses the same lifestyle asset family as the other examples',()=>{for(const p of ['../public/app.js','../public/checkout.js']){const src=readFileSync(new URL(p,import.meta.url),'utf8');assert.ok(src.includes('product-mug-v16.webp'));assert.ok(!src.includes('recast-neon-mug-cutout-v48.png'));}});
