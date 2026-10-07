import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('RM0508 mobile hero uses the approved Pic 2 proportions',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../public/hero-target-v51.css',import.meta.url),'utf8');
  assert.match(html,/data-launch-build="RM-050\.8"/);
  assert.match(html,/hero-target-v51\.css\?v=1/);
  assert.match(css,/padding:32px 7\.5vw 10px!important/);
  assert.match(css,/aspect-ratio:1\.055!important/);
  assert.match(css,/top:16\.5%!important/);
  assert.match(css,/bottom:auto!important/);
  assert.match(css,/width:65\.5%!important/);
  assert.match(css,/grid-template-columns:1fr 1\.30fr 1fr!important/);
});

test('RM0508 keeps the approved live three-step assets and current orbit brand',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/jack-russell-source-v18\.webp/);
  assert.match(html,/world-game-v18\.webp/);
  assert.match(html,/recast-neon-mug-cutout-v48\.png/);
  assert.match(html,/recastmeai-approved-orbit-header-v2\.png/);
});
