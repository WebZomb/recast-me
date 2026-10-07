import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('mug composition fills the printable band vertically and derives ambient band color from artwork',()=>{
  const code=readFileSync(new URL('../src/commerce-store.js',import.meta.url),'utf8');
  const fn=code.slice(code.indexOf('export async function composeMugLayout'));
  assert.match(fn,/blur:280/);
  assert.match(fn,/saturation:0\.88/);
  assert.match(fn,/height:outHeight,fit:'cover'/);
  assert.match(fn,/draw\(overlay,\{left,top:0\}\)/);
  assert.match(fn,/\[0\.25,0\.75\]/);
  assert.doesNotMatch(fn,/maxHeight/);
});

test('mobile landing preserves approved Jack Russell sequence under the final Pic 2 hero layer',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../public/hero-target-v51.css',import.meta.url),'utf8');
  assert.match(html,/data-launch-build="RM-050\.9"/);
  assert.equal((html.match(/jack-russell-source-v18\.webp/g)||[]).length,2);
  assert.doesNotMatch(html,/dog-original-v17\.webp/);
  assert.match(css,/aspect-ratio:1\.055!important/);
  assert.match(css,/hero-live-product\{[\s\S]*width:56\\.5%!important/);
  assert.match(css,/max-width:34ch!important/);
});
