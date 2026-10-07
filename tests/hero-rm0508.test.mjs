import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('RM0510 mobile hero uses the approved Pic 2 proportions',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');const css=readFileSync(new URL('../public/hero-target-v51.css',import.meta.url),'utf8');
 assert.match(html,/data-launch-build="RM-[0-9.]+"/);assert.match(html,/hero-target-v51\.css\?v=[34]/);assert.match(css,/padding:32px 7\.5vw 10px!important/);assert.match(css,/aspect-ratio:1\.24!important/);assert.match(css,/top:16\.0%!important/);assert.match(css,/bottom:auto!important/);assert.match(css,/width:55\.0%!important/);assert.match(css,/grid-template-columns:1fr 1\.30fr 1fr!important/);
});
test('RM0510 keeps the approved live three-step assets and current orbit brand',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/jack-russell-source-v18\.webp/);assert.match(html,/world-game-v18\.webp/);assert.match(html,/recast-neon-mug-cutout-v48\.png/);assert.match(html,/recastmeai-approved-orbit-header-v2\.png/);
});
test('RM0510 head contains a real line break, never a visible literal backslash-n',()=>{
 const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/brand-orbit-v1\.css[^\n]*\\n\s*<link rel="stylesheet" href="\/hero-target-v51\.css/);assert.match(html,/brand-orbit-v1\.css\?v=1">\n\s*<link rel="stylesheet" href="\/hero-target-v51\.css\?v=[34]">/);
});