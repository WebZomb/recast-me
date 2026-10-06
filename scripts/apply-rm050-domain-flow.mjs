import {readFileSync,writeFileSync,existsSync} from 'node:fs';

const replace=(path,from,to)=>{
 const s=readFileSync(path,'utf8');
 if(!s.includes(from)) throw new Error('Expected text missing in '+path+': '+from.slice(0,100));
 writeFileSync(path,s.replaceAll(from,to));
};

replace('wrangler.jsonc','https://recast-me.sergz24.workers.dev','https://recastmeai.com');
replace('scripts/launch-audit.cjs',"const base='https://recast-me.sergz24.workers.dev';","const base='https://recastmeai.com';");
replace('scripts/launch-audit.cjs','data-launch-build="RM-049.5"','data-launch-build="RM-050.0"');
replace('scripts/launch-audit.cjs',"metrics.build!=='RM-049.5'","metrics.build!=='RM-050.0'");

replace('public/index.html','data-launch-build="RM-049.5"','data-launch-build="RM-050.0"');
replace('public/index.html','/assets/jack-russell-source-v18.webp','/assets/dog-original-v17.webp');
replace('public/index.html','<link rel="stylesheet" href="/launch-v49.css?v=249" />','<link rel="stylesheet" href="/launch-v49.css?v=249" />\n  <link rel="stylesheet" href="/launch-v50.css?v=250" />');

for(const path of ['public/app.js','public/checkout.js']){
 replace(path,'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-neon-mug-cutout-v48.png?v=1791266555','/assets/product-mug-v16.webp');
}

replace('public/checkout.js',
`  return \`<details class="product-design-controls">
    <summary><span>Edit design</span><small>\${preset.label}</small></summary>
    <div class="design-edit-body">`,
`  return \`<details class="product-design-controls compact-product-edit">
    <summary><span>Edit design</span></summary>
    <div class="design-edit-body">`);
replace('public/checkout.js','      <p class="product-mockup-note">Recommended setup is already applied. Edit only if you want a different crop or composition.</p>','      <p class="product-mockup-note">Your best-fit setup is applied automatically. Change it only if you want a different crop or composition.</p>');
replace('public/checkout.js','preview.textContent=state.busy?"Waiting for current preview…":"Preview recommended design"','preview.textContent=state.busy?"Waiting for current preview…":"Preview on product"');
replace('public/checkout.js','button.disabled=false;button.textContent="Try real product preview again"','button.disabled=false;button.textContent="Try product preview again"');
replace('public/checkout.js',
`    const realPreview=digital?"":\`<div class="recommended-design-row"><span>Recommended setup applied</span><strong>\${preset.label}</strong></div>\${designControls}<button class="product-preview-action" data-product="\${index}" type="button">Preview recommended design</button><p class="mockup-error" role="alert" hidden></p>\`;`,
`    const realPreview=digital?"":\`<button class="product-preview-action" data-product="\${index}" type="button">Preview on product</button><p class="mockup-error" role="alert" hidden></p>\`;`);
replace('public/checkout.js',
`        \${realPreview}
        <button class="recast-buy" data-product="\${index}" data-buy-label="\${meta.cta}" \${active&&digital?"":"disabled"} \${active&&!digital?"hidden":""}>
          \${active?(digital?meta.cta:"Continue to final review"):"Not available to buy yet"}
        </button>
        \${active?"":'<p class="product-mockup-note">This product is still a draft. Purchasing opens after store setup and testing.</p>'}`,
`        \${realPreview}
        <button class="recast-buy" data-product="\${index}" data-buy-label="\${meta.cta}" \${active&&digital?"":"disabled"} \${active&&!digital?"hidden":""}>
          \${active?(digital?meta.cta:"Continue to final review"):"Not available to buy yet"}
        </button>
        \${designControls}
        \${active?"":'<p class="product-mockup-note">This product is still a draft. Purchasing opens after store setup and testing.</p>'}`);

replace('public/recast-history.js',
`function trustedRecastHost(host){
  return host==='recast-me.sergz24.workers.dev'||host.endsWith('-recast-me.sergz24.workers.dev');
}`,
`function trustedRecastHost(host){
  const value=String(host||'').toLowerCase();
  return value==='recastmeai.com'||value==='www.recastmeai.com'||value==='recast-me.sergz24.workers.dev'||value.endsWith('-recast-me.sergz24.workers.dev');
}`);

writeFileSync('public/launch-v50.css',`/* RM-050: owner-approved mobile polish layered over RM-049. */
@media(max-width:760px){
  .hero{padding-top:22px!important;padding-bottom:14px!important}
  .hero-live-stage{margin-top:4px!important;aspect-ratio:1.08!important}
  .hero-live-flow{width:47%!important;left:0!important;bottom:24%!important}
  .hero-live-product{width:62%!important;right:-1%!important;top:2%!important}
  .hero-live-tagline{bottom:1.5%!important}
}
.checkout-catalog .product-design-controls.compact-product-edit{margin-top:10px;padding:0;border:0;background:transparent}
.checkout-catalog .product-design-controls.compact-product-edit summary{display:inline-flex;min-height:34px;align-items:center;padding:6px 12px;border:1px solid #37384c;border-radius:10px;background:#0d0e16;font-size:11px;width:auto}
.checkout-catalog .product-design-controls.compact-product-edit .design-edit-body{margin-top:8px;padding:10px;border:1px solid #37384c;border-radius:12px;background:#0d0e16}
.checkout-catalog .recast-buy:not([hidden]) + .product-design-controls.compact-product-edit{margin-top:8px}
`);

writeFileSync('tests/domain-flow-rm050.test.mjs',`import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {readRecastLink,privateRecastLink} from '../public/recast-history.js';
const old='https://recast-me.sergz24.workers.dev/#recast=RC-ABCDEFGH&key=secret-token';
test('old private links restore on the new canonical domain without exposing a new render',()=>{const v=readRecastLink(old,'https://recastmeai.com');assert.equal(v.requestId,'RC-ABCDEFGH');assert.equal(v.accessToken,'secret-token');});
test('new private links are generated on recastmeai.com',()=>{assert.match(privateRecastLink('https://recastmeai.com',{requestId:'RC-ABCDEFGH',accessToken:'secret-token'}),/^https:\/\/recastmeai\.com\/#/);});
test('production config and public audit use canonical domain',()=>{const w=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'),a=readFileSync(new URL('../scripts/launch-audit.cjs',import.meta.url),'utf8');assert.match(w,/"PUBLIC_APP_URL": "https:\/\/recastmeai\.com"/);assert.match(w,/"LIVE_APP_URL": "https:\/\/recastmeai\.com"/);assert.match(a,/const base='https:\/\/recastmeai\.com'/);});
test('purchase UI applies defaults quietly and puts compact edit after final-review action',()=>{const c=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');assert.doesNotMatch(c,/Recommended setup applied/);assert.doesNotMatch(c,/Preview recommended design/);assert.match(c,/Preview on product/);const button=c.indexOf('class="recast-buy"'),edit=c.indexOf('\${designControls}',button);assert.ok(button>=0&&edit>button);});
test('catalog mug uses the same lifestyle asset family as the other examples',()=>{for(const p of ['../public/app.js','../public/checkout.js']){const s=readFileSync(new URL(p,import.meta.url),'utf8');assert.match(s,/product-mug-v16\.webp/);assert.doesNotMatch(s,/recast-neon-mug-cutout-v48\.png/);}});
`);

const handoff='docs/ASTRA-HANDOFF.md';
if(existsSync(handoff)){
 let s=readFileSync(handoff,'utf8');
 const line='\nLatest domain/flow polish: [RM-050 — RecastMeAi.com migration, restore compatibility, merch simplification](ASTRA-SESSION-RM-050.md).\n';
 if(!s.includes('ASTRA-SESSION-RM-050.md'))writeFileSync(handoff,s+line);
}
writeFileSync('docs/ASTRA-SESSION-RM-050.md',`# RM-050 — RecastMeAi.com migration and flow polish — 2026-10-06

## Owner feedback
Owner confirmed recastmeai.com works in Safari. Requested: move public-facing site links off the old workers.dev hostname; fix Continue a saved Recast; remove the redundant Recommended setup presentation; keep the best product setup automatic; move a smaller Edit design control below Continue to final review; replace the visually inconsistent neon mug catalog example; and bring the opening closer to the previously approved premium reference.

## Baseline
Started from main 1594e0b4ec9cc883bdd2f5efc7d152418c31c44f (RM-049.5). Do not reset older commerce/Printful/security work.

## Changes
- Production PUBLIC_APP_URL and LIVE_APP_URL -> https://recastmeai.com. Preview PUBLIC_APP_URL also follows canonical domain; existing Worker/preview host routing remains enabled externally for compatibility.
- launch audit now targets the canonical domain and expects RM-050.0.
- private-link parser explicitly trusts recastmeai.com/www plus legacy workers.dev Recast hosts, so an old saved full private link can be pasted on the new site. Access token is still required; Artwork ID alone intentionally cannot restore private art.
- Product cards silently apply existing per-product presets. Removed the Recommended setup row and Recommended wording from the preview button. Compact Edit design appears after the Continue to final review action in card markup.
- Static Mug merchandising uses /assets/product-mug-v16.webp like the other catalog examples. The hero's dominant neon product presentation remains intentionally separate.
- Hero source/process source switched from the backyard jack-russell-source-v18 image to the existing dog-original-v17 asset for a more cohesive visual sequence. RM-050 CSS tightens the mobile opening without replacing the approved cinematic background.
- No AI provider, render allowance, product price, SKU, Printful fulfillment, order sync or customer artwork changes.

## Validation
One-shot preparation workflow must run full npm test and Wrangler dry-run before merge. Production browser audit must pass on recastmeai.com after merge. No live render or purchase should be performed by automated validation.

## Limits / follow-up
www.recastmeai.com requires a separate Cloudflare route/redirect if the owner wants it reachable; repository code cannot prove that dashboard route exists. Old workers.dev should remain reachable during transition so previously issued private/order links are not stranded. Full private links include both Artwork ID and secret key; an Artwork ID alone is insufficient by design.
`);
