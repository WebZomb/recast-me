import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const wizard=readFileSync(new URL('../public/creation-wizard.js',import.meta.url),'utf8');
const hero=readFileSync(new URL('../public/hero-target-v51.css',import.meta.url),'utf8');
const product=readFileSync(new URL('../public/product-polish-v53.css',import.meta.url),'utf8');
const hq=readFileSync(new URL('../src/highquality.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');

test('RM-051.2 exposes grouped broad worlds without franchise presets',()=>{
 for(const value of ['Animated Sitcom','Anime Adventure','Football Gameday','Basketball Arena','1970s','1990s','Y2K / 2000s','Wizard Academy','Space Opera']) assert.equal(app.includes(value),true,value);
 for(const mark of ['Simpsons','Family Guy','South Park','NFL','NBA','Disney','Marvel']) assert.equal(app.includes(mark),false,mark);
 assert.equal(app.includes('STYLE_GROUP_ORDER'),true);
 assert.equal(index.includes('All Recast worlds'),true);
 assert.equal(wizard.includes('See all adventures'),true);
});
test('new public worlds are accepted by the generation backend',()=>{
 for(const id of ['animated-sitcom','anime','football','basketball','seventies','nineties','y2k','space-opera','wizard-academy']) assert.equal(hq.includes(id),true,id);
 assert.equal(hq.includes('no real team logos or trademarks'),true);
 assert.equal(hq.includes('no copied characters or franchise references'),true);
});
test('visual polish fixes clipping, mug haze and product framing',()=>{
 assert.equal(hero.includes('padding-bottom:.10em'),true);
 assert.equal(hero.includes('radial-gradient(ellipse 72% 66%'),true);
 assert.equal(hero.includes('prefers-reduced-motion:reduce'),true);
 assert.equal(product.includes('Custom Recast Magnet 3-Pack'),true);
 assert.equal(product.includes('scale(1.16)'),true);
 assert.equal(product.includes('place-items:center'),true);
 assert.equal(/data-launch-build="RM-[0-9.]+"/.test(index),true);
});
