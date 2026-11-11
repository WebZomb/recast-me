# Premium Husky Christmas first-image scenes — November 11, 2026

Owner direction: every premade Christmas gift should lead with a rich product-specific illustrated sales scene like the approved four-Husky-coaster tabletop image. The next image must remain the actual supplier photo/proof when certified. Do not conflate illustration and Printful evidence.

Baseline: main commit `bf243a5e728e68692ca43289d4c10356f529c910`. Exact identity: `christmas-village-husky`, gallery artwork revision `c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8`. No change to this art, its source integrity metadata, print files or offer approval.

Ten *marketing-only* illustrations uploaded to connected Shopify Files and mapped to (collection, designId, artworkRevision): blankets, pillows, canvas, tumblers, hoodies, t-shirts, phone cases, tote bags, sticker sheets and coasters. Nine are visually-reviewed per-product crops from the generated illustrated Christmas product-gallery image; coaster photo is from the owner's approved screenshot, cleaned of app UI. These scenes are not pixel-identical supplier proofs or guaranteed print reproductions; real manufactured placement requires independently approved previews. Shopify returned permanent CDN URLs and media IDs for ten uploads. No paid external media subscription used, no print order or transaction.

`public/shop-sales-illustrations.js` now selects the exact matching scene, category detail controls retain original art and actual verified Printful photo separately, and unapproved product families remain preview only. Cache-busted the category module import and all 15 category HTML entrypoints. Extended tests to protect wrong-breed/wrong-revision exclusion and to validate both local WebP assets and tightly scoped Shopify CDN links. The original 11 non-mug premium scenes remain unaltered; this adds 10 to reach 21 scene keys, not full assortment coverage. Mug images are maintained in the existing separate gallery.

Validation status as prepared: generated/cropped images visually inspected; Shopify upload responses verified; final GitHub CI, browser and production deployment need separate receipts. Existing category noindex and commerce restrictions unchanged. Not finished: many breed/product combinations; exact source matching still needs human visual comparison per asset. No claims of approved supplier output or faster cart from these changes.

Rollback: revert this code branch and redeploy. Existing approved product proofs, offers and source revisions survive. New Shopify Files remain unreferenced if rolled back.
