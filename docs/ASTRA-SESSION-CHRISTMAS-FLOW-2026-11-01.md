# Christmas flow repair November 1 2026

Baseline 0bfc5cd5fc6c54586efad4fb10bb810890acba19. Isolated branch fix/christmas-shopping-flow; unrelated staged shop work preserved.

Implemented initial phone header cart layout correction in public/basket.js and public/basket.css; hide redundant header Create CTA on small screens while preserving hero CTA. public/app.js adds a Christmas return link and repositions initial Christmas #start arrivals after load, addressing native initial scroll resets as a hypothesis, not a verified device fix.

Validation: JavaScript syntax and git diff checks passed. Focused seasonal/Christmas/basket tests 161 passed after linking existing dependencies. First run had 138 passing tests and one module-load failure because this new worktree lacked fast-png. No browser or iPhone acceptance, deployment or paid action. These changes do not yet address product merchandising images; current repeated hero with unrelated inset needs varied Christmas product artwork, truthful illustrative labels and supplier geometry review. No real print approval or production order made. Next: browser-test header and native navigation; replace mismatched seasonal image cards and verify full photo-to-product path. Rollback: revert this isolated change; production unchanged.

## Product-first follow-up

Replaced repeated hero/inset construction with one product image per card. Four lead products now have distinct fictional Christmas designs: golden retriever mug, silver tabby pillow, family/Labrador puzzle and French bulldog/Chihuahua fleece blanket. These are labeled illustrative designs, not supplier proofs or premade products for sale. Remaining products retain catalog examples with truthful alt labels; no fabricated supplier verification. Responsive grid, asset cache refresh and native creator return path included. Product SKU session handoff already existed and remains intact.

798 Node tests passed; Worker dry-run passed. Three initial full-suite failures were stale cache-version and removed-inset assertions, updated to current requirements. Added browser image decoding assertions for all four lead products. Hosted Chromium/WebKit verification and actual iPhone navigation remain pending. No purchase, AI engine call, Printful submission or spending-limit change. Built-in image generation produced four merchandising illustrations. Git-backed assets preserved in this change. Roll back the feature commits if needed; no backend schema changes.


### Owner-authorized complete image release
Owner authorized all remaining images and uploading the website fixes. Added 16 distinct illustrative Christmas product images encoded as WebP. Images are illustrative, not supplier proofs or premade inventory. No customer photos or production orders used. Mobile header uses brand and cart with 44px target. All 798 offline tests and Worker dry-run pass. Managed preview unavailable (wrangler not found by preview daemon); Chromium/WebKit CI required before merge. Git push lacks credentials; connected GitHub API used instead. One zero-byte converted asset was caught by image validation and regenerated. Baseline 0bfc5cd5fc6c54586efad4fb10bb810890acba19; local implementation b656c0b plus corrected asset. Rollback: revert focused PR. Deployment unverified at checkpoint.

### Product fidelity review requested during release
Held PR121 in draft after owner asked to check every illustration against delivered merchandise. Read current Shopify catalog and source FULFILLMENT, recommendedCheckoutDesign and apparel-finish.js. Identified actual mismatches rather than claiming generated images were supplier proofs.

| Product | Verified mapping / visual decision |
|---|---|
| Hoodie | Cotton Heritage M2580 black, Printful380; revise hard rectangle to soft-edged centered front print, flat drawcord/pouch construction. |
| T-shirt | Bella+Canvas3001 black, Printful71; revise hard rectangle to soft-edged front print. |
| Tote | Printful84/4533, 15x15 polyester body/black handles; replace beige canvas inset-print illustration. |
| Tumbler | Printful909/23470, tapered20oz; replace skinny cylinder with 6.77in height, 3.39in top/2.83in bottom, clear press-in lid. |
| Framed poster | Printful2 black frame, available8x10/12x16/18x24; revise square example to portrait8x10. |
| Canvas | Printful3, 12x16/18x24/24x36; revise square example to portrait12x16. |
| Journal | Printful867/22658 matte hardcover5.75x8; reduce glossy appearance. |
| Poster | Printful1, rectangular paper print; existing tall portrait illustration compatible with24x36 option. |
| Mug | Printful19 white glossy11/15oz; white handle/interior and printed exterior broadly consistent. |
| Pillow | Printful83 square pillow; image broadly consistent, production code prints same art front/back. |
| Blanket | Printful395 polyester throw50x60/60x80; retained fleece illustration, not a knit/embroidered product. |
| Puzzle | Rectangular252/520piece puzzle; retained illustrative tabletop view. |
| Tough case | Printful601 supported iPhone models; glossy protective case with camera opening; variant remains chosen during preview. |
| Sticker sheet | Printful505/12917; six full-picture stickers in2x3 layout; matching-count example only, not an exact provider proof. |
| Magnet pack | Printful656/16366 quantity3; retained three square illustrated magnets. |
| Coaster pack | Printful611/15662 quantity4; retained four square cork-backed examples. |

Primary supplier sources checked:
- https://www.printful.com/custom/mens/hoodies/unisex-premium-hoodie-cotton-heritage-m2580
- https://www.printful.com/custom/mens/t-shirts/unisex-staple-t-shirt-bella-canvas-3001
- https://www.printful.com/custom/accessories/all/all-over-print-tote
- https://www.printful.com/custom/drinkware/personalized/tapered-stainless-steel-tumbler-20oz
- https://www.printful.com/custom/stationery/notebooks/hardcover-journal-matte
- https://www.printful.com/custom/blankets/personalized/throw
- https://www.printful.com/custom/drinkware/personalized/cork-back-coaster

Limit: this is catalog/construction/placement consistency, not physical sample inspection or a provider-generated proof of the fictional artwork. Card copy labels every example illustrative. Never substitute these product photographs as print files or ready-made inventory.

CI41326035607 passed security, offline, app-channel, basket and seasonal checks but Christmas image test had an incorrect selector (frame versus framed-poster). Corrected the test to locate the actual image source, preserving all16 image-decode checks. Added enabled-cart header geometry checks. No merge/deployment at this checkpoint.
