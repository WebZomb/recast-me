# Christmas mug artwork gallery — November 3, 2026

Baseline: main `9ce511fefe33b06b147d8e07d8a89e2f2bdbb905`. User explicitly requested retaining the current compact Recast Me AI Shop, recovering older golden artwork and adding the new ten pet mug illustration / original-art pairs.

## Work
- Recovered earlier Golden Retriever Winter Lights source and its prior decorated-mug illustration from personal Library. The original design's **already supplier-approved 11 oz and 15 oz offerings remain untouched and buyable**, using the server's frozen proof. Earlier generic multi-product marketing boards are design concepts, not print source or supplier proof.
- Uploaded ten **original pet artworks** (PNG 1254²) to Recast Me's existing Shopify Files, pinning each exact local SHA-256 in `public/shop-gallery.json`. Uploaded ten optimized product-setting illustrations (WebP) to the same Files store. Source assets are in the user's current conversation; no customer photos, secrets or PII. There are seven dog and three cat subjects in this available batch.
- Existing shop and Christmas pages now **append the ten previews to the existing Mugs section** under dog/cat groups. A new card displays the decorated mug illustration first, toggles to original close-up artwork, and permits a larger view. Existing ready-to-buy product, prices, variant selector, cart, checkout and Printful pipeline are not changed.
- No Add to Cart or price is shown on new designs until a verified Printful mockup and frozen print file are issued. Marked "Print preview pending". Never use image-generated decorated mug as the supplier proof. An approved artwork is not equivalent to an approved print product.
- Existing November3 Golden Retriever Winter Lights has **two verified variants**; newer Christmas Village golden illustration is staged as a **different design** and must not overwrite it.
- Asset names: `recast-christmas-village-[breed]-art-20261103.png` and `recast-christmas-village-[breed]-mug-sales-20261103.webp`. Exact CDN links and SHA-256 are in the public manifest. Original art kept in high-quality PNG. Remote storage writes were Shopify Files only, no Shopify product creation/price/order changes.

## Gates
- Static gallery and viewed images are not ready-to-buy stock. Each new design requires source import, content screening, proper 11/15oz Printful placements and final supplier mockup, immutable approval/print hash, and controlled catalog publication. Do not use client-only offers, checkout shortcuts, or image placeholders.
- Originally proposed top ten dogs and ten cats plus other merchandise are **not fully present** in this recovered batch; nine different *dogs/cats* plus new Golden are staged, original Golden remains buyable. The previously mentioned 23-design collection could not be recovered as complete image files from the repository or connected PCs in this session. Do not invent proof status.
- Browser fixture tests, Worker dry-run, deployment and actual live audits must be recorded as completed only upon verified receipts below. No supplier order, AI generation, payment or Printful production submission is performed by this release.

## Release status
Pending hosted CI + deployment and read-only smoke. Branch `recast/christmas-mug-gallery-20261103`.

## Rollback
Revert the gallery PR and redeploy the Worker. The prior live Golden Retriever offers and all saved carts/orders remain intact. Shopify Files can remain as an asset archive; no order rollback needed.
