import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('RM0510 final hero geometry follows Pic 2 proportions',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../public/hero-target-v51.css',import.meta.url),'utf8');
  assert.match(html,/data-launch-build="RM-051\.1"/);
  assert.match(html,/hero-target-v51\.css\?v=3/);
  assert.match(css,/aspect-ratio:1\.24!important/);
  assert.match(css,/left:4\.0%!important/);
  assert.match(css,/width:43\.0%!important/);
  assert.match(css,/right:1\.0%!important/);
  assert.match(css,/width:55\.0%!important/);
  assert.match(css,/width:69%!important/);
  assert.match(css,/bottom:2\.8%!important/);
});

test('RM0510 feathers only the mug asset edges and removes boxy image filter haze',()=>{
  const css=readFileSync(new URL('../public/hero-target-v51.css',import.meta.url),'utf8');
  const product=css.slice(css.indexOf('.hero-live-product img{'),css.indexOf('.hero-live-product::before'));
  assert.match(product,/filter:none!important/);
  assert.match(product,/-webkit-mask-image:/);
  assert.match(product,/mask-composite:intersect!important/);
  assert.match(product,/transparent 0%,#000 5%,#000 95%,transparent 100%/);
});

test('RM0510 preserves approved hero assets and orbit branding',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  for(const asset of ['jack-russell-source-v18.webp','world-game-v18.webp','recast-neon-mug-cutout-v48.png','recastmeai-approved-orbit-header-v2.png'])assert.ok(html.includes(asset));
});
