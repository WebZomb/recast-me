# Owner-reviewed gift publication — verified release receipt

Continuation of ASTRA-SESSION-OWNER-GIFT-PUBLICATION-2026-11-04.md. This records observed deployment, not completion of the entire ready-made shop.

## Source and tests
Baseline ac423527bcb361069b691fb03be0c896acbe6dbf. PR166 head2b59221a2ba7017b0f8c72600cbb61f9ce014b66 merged as5870187d01cb98fc50b4de9af47c017a7f15b742 after all hosted checks succeeded.
- Final local Node:893/893 PASS; Wrangler dry-run PASS.
- WebKit owner publication320/393/1280: consent required, cancellation no-op, exact-file confirmation, changed-file refusal, no credential leakage and private lock PASS.
- Existing mixed custom/premade cart320/393/768/1280: quantity/removal/retained checkout/responsive layout PASS.
- Narrow-phone393 screenshot inspected using fixtures. This was not actual commercial image review.
- Hosted security41940923117 SUCCESS; dedicated owner publication and mixed-cart Chromium/WebKit41940923207 SUCCESS; full customer-policy41940923127 SUCCESS; Cloudflare preview SUCCESS.
- Guarded production deployment41942028308: offline tests/bundle SUCCESS; deploy existing Worker/assets with existing secrets SUCCESS; read-only production smoke SUCCESS.

## Observed live checks
The live /admin-small-gifts page served admin-small-gifts.js?v=2. An unauthenticated POST to /api/admin/small-gifts/publish returned401, with no catalog writes. Public GET /api/shop/small-gifts still reports all three known Golden Retriever coaster/magnet/six-sticker gifts ready_for_review, checkoutEnabled=false. Therefore no new non-mug product has been approved or made buyable by this development session.

The authenticated owner may now inspect real source, supplier and clean native files, explicitly confirm a reviewed item and publish it using the existing safe catalog/Shopify verifier without another code release. This never creates a payment or submits printing. Required exact hashes, existing owner Bearer, live-origin checks, release enable switch, bounded JSON, audit receipt and CAS idempotency remain enforced. Automatic signature allowlist is unchanged. Same-tab Ready-Made QA link goes to /admin-small-gifts without credentials in the link.

## Access and scope limits
Actual private supplier/native images could not be inspected because no unlocked owner review tab was available in the connected browser. Earlier R2 permission denial remains respected: no credential scope expansion, token extraction, private export retries or public exposure. Owner login is the supported next gate. No actual authenticated publish POST, customer purchase, payment, supplier task or physical production occurred.

All35 designs/all17 product categories are NOT finished. Three initial small-gift designs have prepared native files; the larger products and remaining source/product combinations still need suitable print masters and their own verified proofs. Do not label a preview gallery as completed commerce.

## Catalog performance and rollback
Catalog verification is now request-local and bounded to four complete checks at a time; no approval/price cache or validation removal. Before-release timing failed DNS and then a30s timeout, so no numeric speedup is established by that sample.

Disable PREMADE_SMALL_GIFT_RELEASE_ENABLED to stop further manual publication or revert PR166 runtime changes. Retain private native files, supplier tasks, published offers, customer carts and audit receipts. Reverting the controls does not unpublish items that an owner might intentionally publish later; any removal needs a separate explicit action.
