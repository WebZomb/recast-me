# Recast Me AI — Christmas pet Blankets and per-product Shop pages (November 4, 2026)

## Owner direction
While the Christmas mug provider queue continues, create a dedicated **Blankets** shop page and one browsing page for each other physical Recast product, reusing the **same 35 already approved Christmas dog/cat illustrations**. Preserve the simple black-brand quick-buy shopping experience. Never claim an illustrative scene is the real Printful product or sell an unverified blanket.

## Baseline, assets and scope
- GitHub main baseline: `8dcaf33c94982a7605f0c675545d11e4f1c2a7dd` (`WebZomb/recast-me`). Existing canonical mug shop `/shop` and `/christmas.html` retain the frozen-art approval/cart checkout and live catalog gates.
- `public/shop-gallery.json` contains 35 original 1254x1254 Christmas pet artworks, 22 dogs and 13 cats, identified by immutable `designId` and `artworkRevision`. These 35 exact Shopify CDN original-art URLs are reused, not replaced by generated/unknown images. The mug-specific `salesImage` is **not** recycled as a blanket photograph.
- Existing Shopify `Custom Recast Blanket` remains ACTIVE with `50×60` and `60×80` variants; Shopify currently lists $74.99 and $99.99 respectively. This **does not** certify any of the 35 premade blanket art variants or authorize their sales. `src/entry.js` contains the exact Printful SKU/variant bindings `RECAST-BLANKET-50X60` and `RECAST-BLANKET-60X80`; those are preserved.
- Main shop now has navigation across **17 physical product families**. Existing `/shop` remains the mug shop; added separate pages for blankets, pillows, canvas, tumblers, hoodies, T-shirts, tote bags, phone cases, sticker sheets, individual stickers, posters, framed prints, hardcover journals, coaster sets, magnet sets and puzzles. One static page per product family, all using `shop-category.js`, `shop-category.css` and `shop-collections.js`.
- The blanket card uses a **clearly labeled conceptual layout** showing source art with no cropped pet, while the other product pages show original art until genuine Printful-specific mockup/photo exists. In product detail, a real supplier view/button is enabled only from an **exactly matching verified** `/api/shop/catalog` offer. `readyOffer()` must also pass. Artwork-only design records have no price, Add to Cart or supplier proof.
- Each new page is temporarily `noindex,follow`, with a unique canonical, meta description, category navigation, dog/cat headings and gift-to-custom-Recast link. Do not put preview-only pages in the indexed sitemap or publish schema.org price/offers; add indexing and Product/Offer structured data only after actual buyability verification.

## Actual print-quality blocker
- All reused pet illustrations are **1254×1254**, intended for mugs. The existing blanket requires a much larger 50×60 or 60×80 inch print area. They are excellent online gallery art, but enlarging to full blanket size risks visible blur/low DPI. Printful specifically recommends original high resolution, product-specific dimensions/safe zones, and says merely upscaling a small source does not restore detail: https://help.printful.com/hc/en-us/articles/50264019148177-How-should-I-prepare-my-print-file-for-the-best-results .
- The next sellability phase must create properly licensed and quality-checked **blanket-specific print masters** from the same exact subject/scene, with tested placement and safe zones, real Printful provider mockup for **each size**, inspected 3D/flat proofs, immutable approval hashes and checkout/final-file mapping. Do **not** clone an approved mug SKU or re-label mug mockups as blankets; do not silently stretch 1254px art and enable checkout.
- Other large prints and AOP goods need equivalent product-size review; apparel, wrap cases, journals, stickers/cutlines and all-over-print products have their own placement requirements. Do not automatically create 560 Printful tasks or any customer orders from this page release.

## Files changed
- Added `public/shop-collections.js`, `public/shop-category.js`, `public/shop-category.css`, 16 `public/shop-*.html` item-specific pages (mugs remain at `/shop`).
- Updated `public/shop.js` navigation without removing existing illustrated-and-real mug proof UI or cart. Updated `public/shop.html` SEO and offer accuracy and `public/christmas.html` script version. Updated `public/shop.css` aisle highlight.
- Added `tests/shop-collections.test.mjs` and `scripts/shop-category-browser.cjs`; added Chromium/WebKit at 320/393/768/1280px to the existing hosted customer-policy CI workflow. Updated the old golden mug sales regression to expect the cache-busted shop script while preserving its image hashes.

## Tested and untested
- On isolated authorized desktop clone `C:\Users\sergz\Documents\RecastShopBlanketsNov4`, first focused tests **5/5 pass**, Node syntax checks pass.
- First full suite had **827/828 pass**, one outdated test demanded `shop.js?v=9` rather than v10. Fixed only that test; **fresh full-suite rerun pending** at this checkpoint.
- Browser screenshots/CI, guarded production deployment, live link/price/size read-only smoke and exact supplier blanket mockups **pending**. No new Shopify premade product records were activated. No Printful blanket task, customer order, payment, production, AI render, secret/token read, or billable provider call was initiated.
- Branch: `recast/shop-blankets-product-pages-20261104`, based on main above. Open PR only after work and tests staged. A git commit is not a deployment.

## Rollback
Revert the focused product-category PR and redeploy the guarded Worker/assets. The existing `/shop` approved mug offers and basket remain unchanged; no R2 supplier claims, Shopify product statuses, customer orders or production jobs are modified by this browse-only addition. Rollback does not require refunds or deleting images.
