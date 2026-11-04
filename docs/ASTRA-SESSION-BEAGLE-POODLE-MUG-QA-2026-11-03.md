# Recast Christmas Village Beagle and Poodle mug approvals — November 3, 2026

User authorized completing all 35 ready-made pet mugs so they can be purchased in the existing Shop. Production Printful provider v3 returned exact `ready_for_review` records for `village-beagle-mug-{11,15}oz` and `village-poodle-mug-{11,15}oz`.

## Supplier and artwork QA
- Beagle original source side by side with authentic Printful 11oz/15oz 3D mug previews in `RecastMugProofQA/review-4-1.jpg`: Christmas village, correct tricolor Beagle face, Santa hat and red snowflake scarf on both sizes, no blank or switched artwork.
- Poodle source side by side with actual Printful 11oz/15oz 3D previews in `RecastMugProofQA/review-5-1.jpg`: correct apricot curly Poodle face, Santa hat/scarf, snowy festive village, placement within printable area and visible on both sizes.
- Printful 11oz/15oz individual source versions are immutable, saved in R2, have passed provider completion, content moderation, source hash, clean production print file and placement hash. Saved thumbnail watermarks are for preview only, not printing.
- Reviewed exact four signatures: Beagle 11oz `f6f5094f66f6ac1122f96d8ec0d5d1b10047d4399f975a4f5739b23145304af2`, Beagle 15oz `9c97106fbd086f851a23a8a1990892c97cc54cc32991a03f20f9c6bb5b4d2dea`, Poodle 11oz `e94acc028ce9e0f9e4505530bbe3f68daf88a486f41e0e49601d99000982947a`, Poodle 15oz `dd1deb81c0d364c56b8c901ce66024fdf0773b08ebc8802caf50ad3f2d1abf6f`.
- Add only these four signatures to existing reviewed source allowlist. Publication under cron must revalidate exact signed hash and authorized Shopify Custom Recast Mug size, and preserve customer/cart approval records. No production order, charge or customer fulfillment is created by proof publication.

## Release controls
- Run full Node and Chromium/WebKit CI before deployment. Verify four new offers are visible in `/api/shop/catalog` after cron, with correct prices and no customer-produced images. Test safe isolated cart creation and handoff without placing a paid order. Other designs remain pending proof review and separate Shopify product drafts remain unpublished pending compatible standalone fulfillment.
- Roll back only the new four approvals if any proof is invalidated; do not touch existing four reviewed Christmas Village designs, original Golden Winter Lights or private saved customer carts.
