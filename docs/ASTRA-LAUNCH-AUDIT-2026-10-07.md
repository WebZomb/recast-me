# October 7 live launch audit (in progress)

Baseline: 815283e5703b0db034b72a83ce07a9495cd62843. Owner accepts the single cut-out sticker; no additional sticker pack required. Audit all products and the first mug, preserve exact artwork and existing release authorization.

## Verified evidence
Shopify returns 18 active products. Public homepage has only 12 static cards, missing the six additions. Printful health reports configured token/store and reachable provider. Security CI for baseline passed. Public WebKit/Chromium browsing audit passed; separate sample audit failed because it still requires seven supplier thumbnails despite curated illustrations being the explicit current design.

One bounded public-art pass used the existing public hero-your-world-v08.webp, uploaded once as an original-photo request. All six new-item preview requests failed BEFORE successful provider mockup creation: Sticker, Phone Case, Hardcover Journal, Puzzle: catalog_identity_changed; Pillow 14: Not Found; Tote: print_area_missing. No AI renders, checkout, purchase, draft or production submissions. Do not retry until concrete mappings/geometry are corrected. No tokens are included in this record.

Owner securely authenticated the private control center. Read-only Printful check found the exact existing mug order 179697346, matching reference, HTTP200, status pending. Recast says in_printful_production; Shopify #1001 remains paid/unfulfilled (not shipped yet). Do not duplicate/release it again.

Existing candidate diagnostics verified phone cases 17616/17618/17619/20290/20292 belong to product181, not515; puzzle13431/13432 belong to534, not541; variant12141 is a SPIRAL notebook product474, not a hardcover journal. Pillow4532 belongs to83; tote4533 belongs to84. Need actual current variant/template diagnostics before mapping edits. Preserve hardcover promise rather than silently substitute spiral.

## First implementation checkpoint
Expand the admin-only read-only product check to all current six-product mappings plus bounded supplier product/printfile detail and hardcover discovery. No caller-supplied provider URLs; no write requests or automatic remapping.
Persist successful Printful confirmation before the separate Shopify tag network call; persist automatic review errors before tagging too. Existing tag helper ALREADY catches failures: earlier suspected thrown-tag-error claim was incorrect. This change reduces the interruption window while tagging hangs. The existing automatic paid/preapproval regression now inspects durable submission state when tagging starts.

309 Node tests passed; Worker dry-run pending at time of writing. Catalog/homepage and audit-script edits are pending, not part of this diagnostic checkpoint. Supplier IDs have not been guessed or changed yet. This is not launch approval. Commit SHA is the commit containing this record; deployment must be checked separately. Rollback: revert only this checkpoint, preserving orders/artwork and subsequent fixes.

## Diagnostic deployment and further evidence
Checkpoint e7bde3320ca73a249af3f54cae1d0de0f8e5e85c deployed successfully (Cloudflare version ed3badf6-0189-4c4e-8645-1e6f5658bcec); 309 tests and dry-run passed. Live enhanced diagnostics reveal sticker10163 belongs to358; phone14 IDs17612–17615 are youth tees, not phones; pillow14/16/22 IDs4530/4531/4534 do not exist. Correct pillow variants from product83 are49853/49854/4532/11075 for14/16/18/22. Tote4533 uses default placement, not front. Pillow offers separate front/back print files; both must match the listing promise. Hardcover discovery returns682 and867; prioritize these bounded catalog reads so earlier invalid mappings do not crowd out the actual promised journal. Include all phone variants for exact model matching. Puzzle supplier confirms US-only shipping. No orders changed.
