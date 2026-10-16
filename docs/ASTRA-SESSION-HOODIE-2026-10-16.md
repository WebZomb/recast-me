# Hoodie marketing accuracy correction — October 16, 2026

Baseline: 905b6b03e4e20588747139e68fc23507dc918285.

Owner rejected enlarging/cropping the actual print. Keep production geometry and all approved designs unchanged; match website and advertising examples to Printful.

Website changes use the existing supplier-verified black Cotton Heritage M2580 size-S image from catalog-examples.json on the homepage, product selection and seasonal hoodie card; mark the sample size and refresh entry script cache keys. Replaces generated lifestyle illustration only. No source renderer, template, variant, price, checkout approval, or fulfillment changes.

Shopify live product 10315312922868: replaced oversized lifestyle media with the verified supplier image, then read back processed featured media 46705470046452. All five variant IDs/SKUs/prices unchanged. Public preview watermarks remain; these are not production art.

Validation: three changed JS syntax checks and git diff whitespace passed; 25 focused existing Node tests passed (accuracy, recommended checkout, seasonal campaigns, product polish). Full suite initially found two stale assertions for the previous image URL and cache key; both updated to the intended new values. Final 592 Node tests and Wrangler dry-run passed. Hosted CI and deployment pending at this source checkpoint. No AI product renders, orders, payments or fulfillment actions. Marketing image editing performed separately with built-in image generation; not a physical supplier-quality test.

Advertising corrections are tracked in the private marketing notebook. Do not treat newly generated creatives as published replacements until platform readback confirms. Keep October18 hoodie draft held until reviewed replacement is attached.

Rollback: revert only these merchandising URLs/labels over current main; previous illustration URL remains in docs/rm059-lifestyle-images.json. Do not alter historical approved orders.

## Release receipt and audit correction

PR84 source fba8d13aa2474ca49f8a5c275fdc6ab30894a279 merged as d4f6cb4f41cf5c63425db4d0b366578533682075. All three PR checks passed; guarded main deployment and Workers Build succeeded. Public launch audit passed with no layout/image failures, but the subsequent published-example audit failed because it still required the old “Lifestyle example” caption for the hoodie. Updated that single assertion to require the precise Printful size-S label and supplier filename; other product checks remain. This follow-up changes audit code and documentation only. Hosted browser audit is required for the final verification; no local browser automation executed.

Shopify replacement is live. Published Facebook corgi photo was replaced in place and visually confirmed; the scheduled Fantasy Warrior hoodie now carries the corrected modest upper-chest print at the original October18 6PM Eastern slot. No actual hoodie artwork dimensions or paid-ad budget changed.

Follow-up PR85 source df11a1c44ff64407e25da075c48e6f5a1fef1f60 merged as 8047c892de9a538cd1fb2064279251bd8516c362. Its audit run caught an existing source-string regression test requiring the unchanged lifestyle assertion for other products. Kept that assertion in an explicit else branch and retained the stricter hoodie-only assertion. Full local suite rerun: 592/592 passed. This final audit-only correction does not change live customer assets.
