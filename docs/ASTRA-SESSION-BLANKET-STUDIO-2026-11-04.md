# Christmas blanket sizes, print-readiness and 16 product-specific illustrations — November 4, 2026

## Owner request
Continue building Recast Me AI ready-made gift shop while Printful completes the separate mug batch. The 35 original approved Christmas pet artwork sources must remain exact, grouped as 22 dog scenes and 13 cat scenes, and each physical product needs a distinct, premium presentation. The user wants finished quick-buy pages, not a generic filter store.

## Source of truth and baseline
- Baseline main: `91604f10b49a84648b762b383d36b9cea5f9f343`; live `/shop` and the 16 product pages are already deployed and verified at this baseline.
- Source gallery: `public/shop-gallery.json`, 35 immutable `designId` + `artworkRevision` identities, source image 1254×1254, already stored under Recast's own Shopify Files. The new visual layer **never** substitutes unrelated dog breeds, client-generated media or mug-only decorated sales mockups.
- Price/checkout: `/api/shop/catalog` returns signed source-specific Printful proof offers only. Existing `readyOffer()` and `addPremade()` remain unchanged. No unverified blanket, pillow, case, shirt or other art is for sale.
- Existing Shopify blanket product: 50×60 and 60×80, with locked `RECAST-BLANKET-50X60` and `RECAST-BLANKET-60X80` mappings. These product sizes are shown accurately in concept previews but are **not premade purchase authorizations**.

## Visual and interactive implementation
- Add `public/shop-product-concepts.js` and `public/shop-product-concepts.css`: model-specific CSS silhouettes using the exact approved artwork from Shopify Files. Includes a soft fabric blanket drape, throw pillow, canvas, poster/framed print, handled tote, shirt/hoodie, tumbler, rounded phone case, hardcover journal, stickers/sticker sheets, magnet/coaster set and puzzle.
- Product concepts are labeled **Design illustration**, with a clear note that they are not manufacturer proofs. The *actual product preview* is always a separate real Printful supplier image, never a client-only generated illustration.
- Blankets now have both selected dimensions (50×60 / 60×80) with real 5:6 and 3:4 proportions. The detail view allows `Layout 50 × 60 in`, `Layout 60 × 80 in`, `Original artwork`; the real Printful tab remains disabled until a signed preview exists.
- Keep existing product gallery and cart. No new customer-style customization, AI render or change to reviewed artwork is triggered by the size preview.
- Artwork card thumbnails request a smaller Shopify CDN rendition from a strict Recast own-source URL allowlist; full original art is still available in the artwork detail view. The underlying artwork revision never changes.
- `public/shop-category.js` uses product-specific concept shapes and a truthful blanket status when its source is not full-bleed print-ready.
- All 16 `public/shop-*.html` pages now reference refreshed category JS/CSS URLs. The mug page and already-approved product fulfillment remain intact.

## Blanket production-readiness audit
- `public/shop-print-readiness.js` and `scripts/shop-blanket-readiness-report.mjs` inspect all 70 potential blanket size variants, maintaining source identity, pixel dimensions, exact mapped SKU and a **conservative 150 DPI planning target**. This is not an assertion that 150 DPI is Printful's exact template for either SKU; the genuine variant-specific official template and safe zones must still be verified before approval.
- 50×60 at this planning target: 7500×9000 px. 60×80: 9000×12000 px. Existing 1254² art cannot fill either size at the target without severe enlargement. All 70 combinations are marked **higher_resolution_master_required**; none are supplier-approved or independently ready for sale as all-over prints.
- Even a future source whose pixels meet the planning target stays **supplier_proof_still_required**. The audit never sets `READY`, `ACTIVE` or a public price/checkout line.
- Official Printful references: https://help.printful.com/hc/en-us/articles/50264019148177-How-should-I-prepare-my-print-file-for-the-best-results and https://www.printful.com/custom/blankets/personalized/throw .
- Never send a mug-size 1254px image through blanket full-bleed, and never treat interpolating a small image as creating new optical detail. Next stage is new genuinely detailed high-resolution masters retaining each exact pet identity, product-specific supplier templates, frozen print files and physical sample QA before any blanket sellability release.

## Testing and release gates
- New 5 Node tests check exact Shopify URL allowlist, 35 distinct source art identities, two exact size mappings, conservative source-resolution holds for all 70 combinations, 16 page script cache versions and no leaked purchase buttons.
- Expanded existing `scripts/shop-category-browser.cjs` checks blanket 50×60/60×80 size aspect ratios, detail/real proof separation, no unapproved Add to Cart, all 16 product silhouettes and narrow-mobile overflow in Chromium/WebKit. Local WebKit screenshots inspected before release.
- Initial isolated local tests at `C:\Users\sergz\Documents\RecastBlanketStudioNov04`: **833/833** Node tests pass and Wrangler dry-run passed. Additional visual revisions re-run and hosted CI must be recorded independently once complete. Browser fixtures make **no** customer order, supplier request or paid action.
- No print files uploaded, provider mockup task created, AI render charged, Shopify product activated, customer data altered, or Printful production order sent in this source-safe visual stage.
- Branch: `recast/blanket-studio-product-visuals-20261104`. Production publication is not implied by branch creation or local tests; confirm guarded Cloudflare deploy and exact live 35-card/2-size mockups separately.
- Rollback: revert this focused visual/preparation PR; existing approved mug offers, customer carts and supplier tasks are unaffected.

## Remaining blocker
The same original pet artwork must be prepared in **true printable quality** for the larger products. Only after those print files and real product-specific Printful proofs pass per-variant quality review can Recast add these designs as buyable premade blankets and expand the same process to the other 15 categories. The site and catalog must not claim completed fulfillment before then.
