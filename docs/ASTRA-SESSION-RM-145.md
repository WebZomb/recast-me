# RM145 — Larger case placement, meeting mug pictures, styled case catalog

2026-10-12. Owner clarifies: case photo must reach bottom and closer below cameras; mug has one copy per side meeting at front centre; replace bland case image in site and Shopify. Baseline main3f89ae075986203ef0c7b27c5ae74ddea8b6c287; runtime0ab94f134e3e010f3fb151a7931cb2f53de369b6.

New explicit version10: Tough Case keeps source proportions, fits within96% print width/65% height, bottom anchored. Typical4:5 image now35%–100% height instead of40%–87%; upper matching color fill lighter/stronger. Wide images stay whole and bottom aligned, so do not promise all proportions fill both dimensions. Exact v9, v7 and v6 approvals preserved. Template ratio guard retained. Camera clearance on actual new supplier preview remains to verify.

Mug v10 close/two-sided computes actual image width, placing adjacent inner edges exactly at printfile midpoint. Both copies full height; no overlap or gap at centre. Existing v6 close remains unchanged for frozen approvals; other spacing/layouts and Tumbler unchanged. All UI/server/social recommendations agree. New regression tests cover photo ratios, geometric bounds, v9/v6 retention and preview/production consistency.

Shopify product15419162460404 image replaced with built-in imagegen royal Jack Russell Tough Case lifestyle illustration, with supplier blank case used as shape reference. No private/customer photo used. Clearly labeled styled example; actual buyer supplier previews retained. Shopify readback confirms new featured image and all9variants29.99 unchanged. Description matches camera-aware default and distinguishes optional full crop. Same art URL in public/app.js and checkout.js. Generated source /workspace/scratch/350e4a4438e5/generated_images/exec-4b6a5aee-adce-43dd-92d0-1c90d3bdfec2.png; durable CDN https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-tough-case-royal-lifestyle-rm145.png?v=1791819635. Imagegen prompt: premium warm living-room photo of reference glossy Tough Case on walnut/leather journal, royal Jack Russell/palace portrait immediately below camera through bottom, matching edge colors, no text/logos. Image is merchandising illustration, NOT supplier-placement evidence.

524 Node tests PASS; Worker dry-run PASS. Hosted browser/security and deployment pending. New browser session has no prior saved artwork, so real new supplier preview not yet tested. No AI customer render/order/payment/fulfillment/alert action. One built-in image generation and Shopify media upload/update; provider cost not measured.

Rollback recommendations/defaults/UI to prior version while retaining v10 compositor for any newly approved purchases. Shopify previous blank image available at https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-tough-case-glossy-rm143.jpg?v=1791788050; variant/SKU/price mappings unchanged.

Final test pass initially caught stale app-v293 assertion after cache bump; updated it to intended v294. No runtime issue in that failure.


## RM145 live receipt

PR64 https://github.com/WebZomb/recast-me/pull/64 merged with final head f14a88b2b6e5261b1f21594066d2d8b12bec973f, tree0f40f906ba8f722d41643bb1455f11f35ca1b8a3, main/runtime ed74e670d9b722cba2d36f69697c1b47d43e67d9. Security38272255712 and customer WebKit/Chromium38272255865 PASS. Guarded deploy38272663477 including production smoke PASS; Worker7cd3808e-c92d-480f-81c7-879594070ce9. Post-merge read-only launch audit38272663536 still in progress at receipt.

Actual live site now shows styled royal-dog case alongside other products; screenshot /workspace/scratch/recast-rm145-catalog.jpg. Shopify get-product readback confirms featured royal-dog art and all9previous model/SKU/price identities unchanged.

Fresh browser has no prior saved artwork. Public hero file selected through normal no-AI upload, consent checked; submission stopped at human-verification requirement. No challenge click or bypass, no upload success, no supplier mockup submitted this turn. After deployment page reloaded to current scripts and prepared at visible checkbox; action-time CAPTCHA permission needed for remaining real mockup verification. Do not claim new v10 supplier preview verified. Owner may also test fresh mug/case previews normally.
