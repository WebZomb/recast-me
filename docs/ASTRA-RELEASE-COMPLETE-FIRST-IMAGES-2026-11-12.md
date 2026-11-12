# Verified release: complete Christmas first images — November 12, 2026

The complete existing first-image assortment is live on recastmeai.com: **35 Christmas dog/cat designs across 15 non-mug collections, 525 product/design first images**. Existing mug gallery imagery remains unchanged. This completes the image rollout, not manufacturing approval of preview-only product categories.

## Source and deployment

Baseline: d99c0e51bb29ae9e2a3b74ddb97027c3b47e294c. Tested PR193 head: 31f1e17b0cc842a18a4521114ce566dbf8f6289b. Production squash commit: **8f53237a63274b76c6eb4787e81f817d4a4fa73b**.

PR193 merged only after security workflow43286931750 and complete customer-policy workflow43286931917 succeeded. The latter includes Chromium/WebKit product galleries, verified-only checkout, mixed carts, recovery, owner proof controls and loading/retry checks. Final local regression also passed956/956 tests; Worker dry-run and local category fixtures at320/393/768/1280px passed.

Cloudflare deployment workflow **43288642816** succeeded: offline tests/dry-run job131428673704 and deploy/production-smoke job131428936669 both passed. These are actual production deployment receipts, not just a commit or preview build.

## Independent public-site verification

Read-only checks against **https://recastmeai.com** verified:

- Live sales-registry and category-module bytes exactly match the tested committed Git blobs.
- All15 collection pages serve the new category v11 entrypoint, which imports sales registry v4.
- **525/525 first-image thumbnail URLs return HTTP200 with an image content type, zero failures.**
- One full-resolution Siamese image in each of15 categories was fetched from production, decoded at1254x1254, and matched the corresponding committed image bytes.
- All525 images also decoded successfully in an actual393px Chromium page audit, rather than merely existing on disk.

Actual live393px browser checks separately visited Coaster Sets, Magnet Sets and Sticker Sheets. Each had35 verified designs and35 visible Add to Cart controls. For the Siamese listing in each, the product illustration opened first; the separately selected actual Printful supplier preview also decoded successfully. No Add to Cart button was clicked. All non-read requests were blocked in this isolated live browser check; no customer cart, order or payment was created.

Read-only public availability was unchanged before and after release: **72 mug options across36 mug designs,35 coaster designs,35 magnet designs and35 sticker-sheet designs**. The separate legacy Golden mug explains why buyable mug designs total36 while the reused Christmas artwork gallery has35 designs.

## Preserved safeguards and limits

There are513 newly composited product scenes plus513 smaller browsing thumbnails, with12 reviewed older scenes retained. The original source artworks, production print files, mug gallery, API commerce code, prices, provider configuration, proofs and fulfillment rules are unchanged. The illustrations use the existing original pet artwork, not newly regenerated pets. Real supplier previews remain separate. No unapproved category was made buyable by a marketing image.

No paid renders, AI credits, new subscriptions, ads, printing, purchases or customer-data access occurred. Native app publication and large-format supplier proof work are not claimed complete.

Preparation, visual corrections, source/output hashes and rebuild recipe: [complete first-image session](ASTRA-SESSION-COMPLETE-FIRST-IMAGES-2026-11-12.md) and [coverage receipt](evidence/shop-first-image-coverage-20261112.json). This record supersedes the preparation-only validation status in that session.

Rollback: revert production source commit8f53237a63274b76c6eb4787e81f817d4a4fa73b and redeploy. No supplier/source/order data migration is involved. This documentation-only receipt does not trigger another public-code deployment.
