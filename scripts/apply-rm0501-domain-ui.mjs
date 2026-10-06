import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const rep=(p,a,b)=>{const s=readFileSync(p,'utf8');if(!s.includes(a))throw new Error('Expected text missing in '+p+': '+a.slice(0,90));writeFileSync(p,s.replaceAll(a,b));};

rep('wrangler.jsonc','https://recast-me.sergz24.workers.dev','https://recastmeai.com');
rep('scripts/launch-audit.cjs',"const base='https://recast-me.sergz24.workers.dev';","const base='https://recastmeai.com';");
rep('scripts/launch-audit.cjs','data-launch-build="RM-050"','data-launch-build="RM-050.1"');
rep('scripts/launch-audit.cjs',"metrics.build!=='RM-050'","metrics.build!=='RM-050.1'");
rep('scripts/launch-audit.cjs','Expected RM-050 is not deployed','Expected RM-050.1 is not deployed');
rep('public/index.html','data-launch-build="RM-050"','data-launch-build="RM-050.1"');
rep('public/index.html','/assets/jack-russell-source-v18.webp','/assets/dog-original-v17.webp');
rep('public/index.html','<link rel="stylesheet" href="/launch-v49.css?v=249" />','<link rel="stylesheet" href="/launch-v49.css?v=249" />\n  <link rel="stylesheet" href="/launch-v50.css?v=251" />');

for(const p of ['public/app.js','public/checkout.js'])rep(p,'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-neon-mug-cutout-v48.png?v=1791266555','/assets/product-mug-v16.webp');

rep('public/recast-history.js',
`function trustedRecastHost(host){
  return host==='recast-me.sergz24.workers.dev'||host.endsWith('-recast-me.sergz24.workers.dev');
}`,
`function trustedRecastHost(host){
  const value=String(host||'').toLowerCase();
  return value==='recastmeai.com'||value==='www.recastmeai.com'||value==='recast-me.sergz24.workers.dev'||value.endsWith('-recast-me.sergz24.workers.dev');
}`);

rep('public/checkout.js','<details class="product-design-controls">','<details class="product-design-controls compact-product-edit">');
rep('public/checkout.js','Reset to recommended','Reset to best setup');
rep('public/checkout.js',
`    const realPreview=digital?"":\`<div class="recommended-design-row"><span data-design-summary>Recommended layout applied</span></div>\${designControls}<button class="product-preview-action" data-product="\${index}" type="button">Preview my product</button><p class="mockup-error" role="alert" hidden></p>\`;`,
`    const realPreview=digital?"":\`<button class="product-preview-action" data-product="\${index}" type="button">Preview my product</button><p class="mockup-error" role="alert" hidden></p>\`;`);
rep('public/checkout.js',
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

writeFileSync('public/launch-v50.css',`/* RM-050.1: owner-requested landing and product-flow polish layered over RM-049. */
@media(max-width:760px){
  .hero{padding-top:22px!important;padding-bottom:14px!important}
  .hero-live-stage{margin-top:4px!important;aspect-ratio:1.08!important}
  .hero-live-flow{width:47%!important;left:0!important;bottom:24%!important}
  .hero-live-product{width:62%!important;right:-1%!important;top:2%!important}
  .hero-live-tagline{bottom:1.5%!important}
}
.checkout-catalog .product-design-controls.compact-product-edit{margin-top:9px;padding:0;border:0;background:transparent}
.checkout-catalog .product-design-controls.compact-product-edit summary{display:inline-flex;min-height:34px;align-items:center;padding:6px 12px;border:1px solid #37384c;border-radius:10px;background:#0d0e16;font-size:11px;width:auto}
.checkout-catalog .product-design-controls.compact-product-edit .design-edit-body{margin-top:8px;padding:10px;border:1px solid #37384c;border-radius:12px;background:#0d0e16}
`);

let t=readFileSync('tests/checkout-ui.test.mjs','utf8').split('\n');
t=t.map(line=>{
 if(line.includes('jack-russell-source-v18'))return line.replace('jack-russell-source-v18','dog-original-v17');
 if(line.includes('assert.match(app,')&&line.includes('recast-neon-mug-cutout-v48'))return '  assert.ok(app.includes(\'image:"/assets/product-mug-v16.webp"\'));';
 if(line.includes('assert.match(checkout,')&&line.includes('recast-neon-mug-cutout-v48'))return '  assert.ok(checkout.includes(\'"Custom Recast Mug":"/assets/product-mug-v16.webp"\'));';
 return line;
});
writeFileSync('tests/checkout-ui.test.mjs',t.join('\n'));

rep('tests/owner-settings.test.mjs','Reset to recommended','Reset to best setup');

const domainTests=[
"import test from 'node:test';",
"import assert from 'node:assert/strict';",
"import {readFileSync} from 'node:fs';",
"import {readRecastLink,privateRecastLink} from '../public/recast-history.js';",
"",
"test('legacy private link is accepted on canonical domain',()=>{const v=readRecastLink('https://recast-me.sergz24.workers.dev/#recast=RC-ABCDEFGH&key=secret-token','https://recastmeai.com');assert.equal(v.requestId,'RC-ABCDEFGH');assert.equal(v.accessToken,'secret-token');});",
"test('new private links stay on canonical domain',()=>{assert.ok(privateRecastLink('https://recastmeai.com',{requestId:'RC-ABCDEFGH',accessToken:'secret-token'}).startsWith('https://recastmeai.com/#'));});",
"test('production config and audit use canonical domain',()=>{const w=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'),a=readFileSync(new URL('../scripts/launch-audit.cjs',import.meta.url),'utf8');assert.ok(w.includes('https://recastmeai.com'));assert.ok(a.includes(\"const base='https://recastmeai.com'\"));});",
"test('product flow hides redundant recommended row and keeps edit control',()=>{const c=readFileSync(new URL('../public/checkout.js',import.meta.url),'utf8');assert.ok(!c.includes('Recommended layout applied</span></div>'));assert.ok(c.includes('Preview my product'));assert.ok(c.includes('compact-product-edit'));assert.ok(c.includes('Reset to best setup'));});",
"test('static mug cards use matching lifestyle art',()=>{for(const p of ['../public/app.js','../public/checkout.js']){const s=readFileSync(new URL(p,import.meta.url),'utf8');assert.ok(s.includes('product-mug-v16.webp'));assert.ok(!s.includes('recast-neon-mug-cutout-v48.png'));}});"
];
writeFileSync('tests/domain-flow-rm0501.test.mjs',domainTests.join('\n')+'\n');

const handoff='docs/ASTRA-HANDOFF.md';if(existsSync(handoff)){let s=readFileSync(handoff,'utf8');const line='\nLatest domain/UI follow-up: [RM-050.1 — RecastMeAi.com migration and owner-requested UI fixes](ASTRA-SESSION-RM-0501.md).\n';if(!s.includes('ASTRA-SESSION-RM-0501.md'))writeFileSync(handoff,s+line);}
writeFileSync('docs/ASTRA-SESSION-RM-0501.md',`# RM-050.1 — RecastMeAi.com migration and UI follow-up — 2026-10-06

Baseline: main c436f696f0c56087536e7f60936cd283e0bec84d, which already contains the separately merged RM-050 High Quality-first flow, three purchase credits and owner controls. This follow-up intentionally preserves those changes.

Owner feedback: custom domain works; opening still needs closer visual cohesion; redundant Recommended product row should disappear; best product preset should remain automatic; Edit design should be smaller and below Continue to final review; saved-Recast restore failed on the new hostname; static mug catalog art clashes with other examples; public links should use recastmeai.com.

Changes:
- canonical production PUBLIC_APP_URL/LIVE_APP_URL and preview public/live URL -> https://recastmeai.com; launch audit targets canonical hostname.
- trusted private-link hosts now include recastmeai.com/www and legacy Recast workers.dev hosts. This preserves old full private links after domain migration. Artwork ID alone still cannot restore private art because the secret key is required.
- removed the visible Recommended layout row while retaining presets and proof invalidation. Product preview remains explicit. Compact Edit design is emitted after the final-review button in card markup; reset copy is Reset to best setup.
- catalog Mug example now uses /assets/product-mug-v16.webp, matching the lifestyle family. Hero's large neon mug remains the transformation focal point.
- hero/process source uses existing dog-original-v17 instead of the backyard source; small mobile spacing/scale refinements preserve the approved cinematic background and photo -> Recast -> product sequence.
- build marker RM-050.1.
- no model/provider, allowance, owner-control, product price/SKU, Shopify, Printful, order sync, X activation or customer artwork mutation.

Validation must include the full current test suite and Wrangler dry-run before merge. Production browser audit is read-only and must not render, buy, or fulfill. Earlier abandoned branch/PR #4 was based on pre-RM-050 main and was closed rather than overwriting the newer owner-control work.
`);
