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

## November 3 additional mug image recovery and completion

- Added **three more original artwork/decorated mug pairs** from this conversation: Jack Russell Terrier, Chihuahua and Dachshund. They join the 10 already staged, giving **13 preview designs** (10 dogs, 3 cats) plus the existing approved Golden Retriever Winter Lights mug in 11/15 oz. The existing page layout and basket are preserved.
- The six additional images were uploaded to Recast Me's Shopify Files; public `shop-gallery.json` contains exact permanent URLs, optimized CDN SHA-256 hashes, and original generated-file hashes. All artwork PNGs measure 1254x1254 and show a face/scene; sales images are separate 960x960 WebP mug scenes.
- Newly downloaded CDN sources and dimensions were independently checked from a connected computer: Jack Russell `6f416806d0fb34a4190cced090da3cc494e15a5e00a64e01f9ebf49c5149c70a`, Chihuahua `e9720b0aea70a46756d75d12789ccf9cf02b1b434da3496af440d8160aade8e2`, Dachshund `4299b3b3020d74cb7e48a835a7a8252a70a86e1ad75eca0229032f302789b2a8`.
- The user's screenshot includes an older **Rottweiler mug with a fireplace** and small thumbnails of additional previous designs. That screenshot is visual evidence, **not** possession of their full-resolution artwork or Printful proofs; those exact earlier assets remain unverified. The earlier Golden Retriever artwork *is* already recovered and live.
- `src/shop-expansion.js` defines both existing Shopify mug sizes per new source, with server-bound checks and explicit `REVIEWED_EXPANSION_PROOFS` allowlist, still empty. `PREMADE_EXPANSION_ENABLED=false`: no supplier jobs/orders/pricing/fulfillment were initiated by this gallery release. Do not claim these new illustrations are purchasable.
- CI and deployment receipts to be appended only after they succeed; baseline and rollback are unchanged.


## Verified live release (November 3, 2026)

- Source PR130 head `a1c133a1d19672db1de2849dec29f2c5ad34a0e6` passed Recast security validation run `41733694956` and customer-policy Chromium/WebKit run `41733695201`. Merged into main via squash `63738f53e1fe034c43d7c2a4ea37e9034335f11d`.
- Cloudflare production deploy `41734842179` **success**, including offline tests/dry run and read-only smoke, Worker version `9357de01-3122-42c5-a9fb-6a5877f10a6b`.
- Read-only public browser audit `41734842374` **success**. Independently queried `https://recastmeai.com/shop-gallery.json` after deployment: **13** preview records, **10** dogs and **3** cats (ending Jack Russell Terrier, Chihuahua, Dachshund). `/shop.html` imports `/shop.js?v=6`; published module includes `concept-product` gallery; `/api/shop/catalog` still returns exactly **2** approved buyable Golden Retriever offers; `/api/basket/status` enabled=true.
- Connected Opera live accessibility tree confirms new mug designs appear in the existing Mugs section, each labeled **Print preview pending / Not yet available to buy**, with **See artwork** and **View larger** controls; the prior verified Golden Retriever product retains its size selector, supplier preview, and Add to Cart.
- Shopify Files search for Rottweiler found **no** separate high-resolution file. User-provided screenshot shows the older fireplace scene but is not an authoritative master or verified supplier mockup. Do not include that older asset as present or ready to sell.
- No live cart mutation, payment, production order, Printful mockup task or new supplier-approved print file was created during release. `PREMADE_EXPANSION_ENABLED=false` until the 26 variant mockups/print placements are prepared and inspected; `REVIEWED_EXPANSION_PROOFS` remains empty. Hence new illustrated products are preview-only.
- Reversion: revert squash `63738f53e1fe034c43d7c2a4ea37e9034335f11d` and rerun guarded deployment; existing approved two-offer Golden Retriever catalog and saved baskets need no data rollback.

