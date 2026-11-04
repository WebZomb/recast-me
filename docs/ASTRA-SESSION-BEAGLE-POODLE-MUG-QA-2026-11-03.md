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

## Further visually inspected pairs in the same reviewed release
The source-locked `christmas-village-husky` and `christmas-village-orange-tabby` also reached **ready_for_review** for both 11oz and 15oz. The original artworks and authentic watermarked Printful 3D handle-right images were visually compared at `RecastMugProofQA/review-6-2.jpg`. The Husky's blue eyes, black-and-white face, red scarf and Santa hat match its supplier previews; the Orange Tabby's brown tabby pattern, green eyes, red scarf and village background match. No swapped breed or cropped face.
- Husky 11oz `1dded23da0468e08365a89384e5c9485e4142cc4f36c79dc2af6097c6ff77d36`
- Husky 15oz `87f50dc89f7050a7cacd474de2d0eed846c4f4cba598077aeff1ffca61ae363a`
- Orange Tabby 11oz `35f17e2c03f47a97902db01ff97b2a5049f9c3f8d7b5d487cd6cbe88cb1f5f24`
- Orange Tabby 15oz `0b2b5caf21625b213d492b4a024d3aed4fc7a734ebfa42e8ea018944f381dda4`

The reviewed signature allowlist is now 16 variants (8 Christmas Village designs), out of 70 new mug sizes. All others stay pending exact supplier proof QA.
**Known transient blocker:** Siamese cat source import recorded Cloudflare Images binding code `9502`; its second SKU failed only because an immutable source claim already existed. No Siamese supplier mockup was created or made buyable. Preserve its prior R2 error/claim records and investigate safe *pre-provider-only* recovery; do not silently reset unknown provider tasks.
