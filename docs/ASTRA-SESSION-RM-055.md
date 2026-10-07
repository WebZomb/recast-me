# RM055 — product accuracy implementation, 2026-10-07

Baseline main `881135139323e6ec5504cd81b03921ff35957972`; isolated source snapshot `95d962dd054b2a657b7b42ad65e19991521de05b` differs only by the temporary source/check workflow.

## Owner direction
Implement the repeatedly approved fixes, not another checklist. Keep the scene on black hoodie/T-shirt, a larger chest treatment and soft disappearing edges inspired by the owner's banner. Examples must depict each actual selected product/size, not the global rooftop image. Reuse the existing public superhero-man-with-dog art. Keep seven simple subjects, all existing products, credits, owner controls, clean private print files and paid approval gates. New approved gift products remain pending exact mapping; no paid sticker test yet. Minimize deployment/notification noise.

## Implemented
- Removed the global raw-world PRODUCT_ART assignment. Product illustrations are again product-specific and explicitly labeled as styling illustrations, not size proofs.
- Added an exact-SKU example manifest and strict eligibility checks: provider identity, geometry, revision, default design settings, trusted image URL and recorded visual review. A sample cannot enable checkout or overwrite a completed personalized preview; variant/settings changes clear stale proofs.
- Added v6 apparel composition. The slider and default are both 100% of usable print area, not a misleading 108/112 value above a max=100 slider. All tested aspect ratios and positions fit inside the supplied template. The sharp scene occupies more of the print and the perimeter uses a rounded/irregular transparent binary dissolve.
- Left v4/v5 rendering functions unchanged from the baseline. v6 has distinct normalization/cache IDs so old approvals do not silently get this new fade or placement.
- V6 wall art rotates only a supplier-declared rotatable print template for portrait defaults. Both preview source and final clean file use the stored oriented area.
- V6 live previews check the exact catalog variant/product identity. Mismatched identities fail closed rather than guessing a new supplier product.
- Product close-ups are preferred over tiny-room views; lifestyle alternatives remain available. A generic Default view is no longer called 3D.
- Consolidated the seven unverified gifts into a compact coming-soon section instead of fake product photos, tentative public prices and dead buy buttons. Existing twelve offerings preserved.
- Added a bounded one-time public merchandising sample script using only public/assets/hero-your-world-v08.webp. It may upload that existing public image once and request up to ten existing-SKU Printful mockups. It cannot create checkout links, paid orders, Printful drafts, or production. No AI inference; existing Cloudflare image-processing charges may apply. Turnstile blocks rather than being bypassed. Tokens are not retained in the report or published manifest. Output remains pending visual inspection before publication.

## Actually tested locally before CI
- 300 dependency-free Node tests passed, zero failures. The one workerd/miniflare file needs the locked npm install and is reserved for full CI, not counted as locally passed.
- Seven new behavioral tests cover bounded geometry, revision isolation, transparent/binary fade, orientation, slider/default agreement, sample SKU/settings isolation and honest view labels.
- Sharp reference compositor tests passed for soft, rectangle and cutout fixtures; soft alpha is binary, transparent margins persist, watermark does not fill the alpha canvas. Segmentation is fixture-only, not a model quality claim.
- Visual inspection of the first raster caught a two-pixel dot-cell threshold artifact that made the fade abrupt. Replaced only the v6 threshold with an 8x8 ordered dither and reran pixel tests.
- JavaScript syntax checks passed. No live supplier generation or physical print quality is claimed from these tests.

## Pending / acceptance
Run full locked suite, Worker dry-run, WebKit/Chromium fixtures before promotion. Then check exact deployed checkout source and obtain real sample mockups. Inspect and publish only successful exact variants into catalog-examples.json. Tumbler may remain held if the existing supplier mapping is wrong or incompatible. No arbitrary retail/variant change is authorized by a mockup failure. Additional size variants need their own examples, otherwise use the labeled illustration plus a fresh personalized proof.
New Sticker Pack, Phone Case, Pillow, Notebook, Pet Bandana, Puzzle, Tote remain drafts and outside live fulfillment until verified. Turnstile configuration and paid sticker end-to-end test still pending. Personal GitHub notification preferences are unchanged.

## Rollback
Revert only RM055 code/public samples on then-current main. Do not reset or overwrite user orders, signed approvals, source artwork or Shopify products. v6 approved orders must retain their renderer if reverting after any v6 sale.


## Observed full isolated CI validation
Run 37584691386 validated exact source delta 3a07d968c81c0829caa44b1979312a0ad64320a6f82c689b233ac84ea6b5bcdf. All 301 full Node tests passed with zero failures. Wrangler dry-run, actual PNG pixel checks, WebKit/Chromium product fixtures and existing owner/credit policy fixtures passed. These checks mocked providers and did not create orders or live mockups. The application commit is recorded in the rm055-validated artifact. Production promotion and real public-sample generation remain separate.
