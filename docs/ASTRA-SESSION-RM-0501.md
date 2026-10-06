# RM-050.1 — RecastMeAi.com migration and UI follow-up — 2026-10-06

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
