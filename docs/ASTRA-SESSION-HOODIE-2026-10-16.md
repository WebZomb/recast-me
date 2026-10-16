# Hoodie marketing accuracy correction — October 16, 2026

Baseline: 905b6b03e4e20588747139e68fc23507dc918285.

Owner rejected enlarging/cropping the actual print. Keep production geometry and all approved designs unchanged; match website and advertising examples to Printful.

Website changes use the existing supplier-verified black Cotton Heritage M2580 size-S image from catalog-examples.json on the homepage, product selection and seasonal hoodie card; mark the sample size and refresh entry script cache keys. Replaces generated lifestyle illustration only. No source renderer, template, variant, price, checkout approval, or fulfillment changes.

Shopify live product 10315312922868: replaced oversized lifestyle media with the verified supplier image, then read back processed featured media 46705470046452. All five variant IDs/SKUs/prices unchanged. Public preview watermarks remain; these are not production art.

Validation: three changed JS syntax checks and git diff whitespace passed; 25 focused existing Node tests passed (accuracy, recommended checkout, seasonal campaigns, product polish). Full suite initially found two stale assertions for the previous image URL and cache key; both updated to the intended new values. Final 592 Node tests and Wrangler dry-run passed. Hosted CI and deployment pending at this source checkpoint. No AI product renders, orders, payments or fulfillment actions. Marketing image editing performed separately with built-in image generation; not a physical supplier-quality test.

Advertising corrections are tracked in the private marketing notebook. Do not treat newly generated creatives as published replacements until platform readback confirms. Keep October18 hoodie draft held until reviewed replacement is attached.

Rollback: revert only these merchandising URLs/labels over current main; previous illustration URL remains in docs/rm059-lifestyle-images.json. Do not alter historical approved orders.
