import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');

test('two cinematic fantasy illustrations are real optimized binary WebP assets',()=>{
  for(const asset of ['recast-discover-cinematic-v160.webp','recast-surprise-cinematic-v160.webp']){
    const f=fs.readFileSync('public/assets/'+asset);
    assert.ok(f.length>100000 && f.length<800000,asset+' must be sharp but fast enough for mobile');
    assert.equal(f.subarray(0,4).toString(),'RIFF');
    assert.equal(f.subarray(8,12).toString(),'WEBP');
  }
  const html=read('public/index.html');
  assert.match(html,/src="\/assets\/recast-discover-cinematic-v160\.webp"/);
  assert.match(html,/src="\/assets\/recast-surprise-cinematic-v160\.webp"/);
  assert.match(html,/discovery-glass-v160\.css/);
  assert.equal((html.match(/glass-discovery-card/g)||[]).length,2);
  assert.match(html,/data-style-count/);
  assert.match(html,/data-surprise-count/);
  assert.match(html,/id="more-adventures" aria-expanded="false" aria-controls="all-worlds-group"/);
  assert.match(html,/id="surprise-world"/);
});
test('glass style cards keep cinematic art visible with readable count chips and touch feedback',()=>{
  const css=read('public/discovery-glass-v160.css');
  assert.match(css,/aspect-ratio:\s*4\s*\/\s*3/);
  assert.match(css,/backdrop-filter:\s*blur/);
  assert.match(css,/box-shadow:/);
  assert.match(css,/\.discovery-count/);
  assert.match(css,/\.glass-discovery-card/);
  assert.match(css,/max-width:\s*calc\(100% - 18px\)/);
  assert.match(css,/@media \(min-width: 1060px\)/);
  assert.match(css,/margin:\s*25px auto 17px/);
  assert.match(css,/@media \(max-width: 540px\)/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/:active/);
  assert.match(css,/prefers-reduced-motion:\s*reduce/);
});
test('native-style black website dock still overrides the old hidden-link rule',()=>{
  const js=read('public/mobile-bottom-nav.js'),css=read('public/mobile-bottom-nav.css');
  assert.match(js,/if \(window\.webkit\?\.messageHandlers\?\.recastPreview\) return/);
  assert.match(js,/dock\.children\.length !== 4/);
  assert.match(js,/setProperty\('display', 'flex', 'important'\)/);
  const labels=['Create','My Recasts','My Orders','Guide'];
  const positions=labels.map(name=>js.indexOf("label:'"+name+"'"));
  assert.ok(positions.every(x=>x!==-1));
  assert.ok(positions.every((x,i)=>i===0||x>positions[i-1]));
  assert.match(css,/nav\.recast-mobile-nav > a:not\(\.nav-cta\)/);
  assert.match(css,/display:\s*flex !important/);
  assert.match(css,/visibility:\s*visible !important/);
  assert.match(css,/body\.recast-desktop-header-nav/);
  assert.match(css,/display:\s*grid\s*!important/);
  assert.match(css,/backdrop-filter:none/);
  assert.match(css,/background:linear-gradient\(180deg,#171719/);
  assert.match(css,/background:linear-gradient\(180deg,#39393d/);
  assert.doesNotMatch(css,/blur\(24px\)|rgba\(135, 255, 249|rgba\(182, 86, 249/);
  assert.match(css,/prefers-reduced-motion: reduce/);
  assert.doesNotMatch(js,/recast-legacy-orders-pill/);
});
test('web glass navigation is shared across phone and desktop pages, including help and gifts',()=>{
  for(const page of ['index.html','my-recasts.html','my-orders.html','order.html','purchase-demo.html',
                     'guide.html','privacy.html','support.html','gift-ideas.html']){
    assert.match(read('public/'+page),/mobile-bottom-nav\.js\?v=161/,page);
  }
  assert.match(read('public/index.html'),/id="more-adventures"/);
  assert.match(read('public/index.html'),/id="surprise-world"/);
});
test('cards and navigation are presentation-only, no new rendering or payments',()=>{
  const nav=read('public/mobile-bottom-nav.js'),css=read('public/discovery-glass-v160.css');
  assert.doesNotMatch(nav,/fetch\s*\(|\/api\/render|\/api\/checkout-link|\/api\/order-bonus/);
  assert.doesNotMatch(css,/\/api\/|@import/i);
});
