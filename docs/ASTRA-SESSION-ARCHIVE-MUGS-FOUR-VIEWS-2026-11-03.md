# Christmas pet mugs: recovered ZIP archive and four-view gallery — November 3, 2026

Base main `f266a1c1442a6f35509f0dceb03f58c290477622`. Owner uploaded `dog n cat .zip` with 29 PNGs and requested the same existing Recast Me AI Shop to contain all older designs alongside the new mug collection. Do not replace the Shop layout or discard previous Golden Retriever products.

## Exact recovered source and assets
- ZIP contained **22 separate original Christmas pet scenes** (12 dog / 10 cat), plus **7 matching decorated-mug pictures**. Examples: Rottweiler Fireside, French Bulldog Christmas Toy Shop, Poodle Lavender Christmas, Maine Coon (two unique scenes), Russian Blue, Silver Tabby, Jack Russell Snowy Sleigh, Chocolate Labrador and Pointer.
- Previously generated ten decorated mug images provided matching pictures for nine additional scenes (one overlapped Chocolate Labrador); total **16 archive scenes have a decorated-mug illustration**. Six archive portraits do not yet have matching studio/styled mug images: Maine Coon Winter Snowfall, White Persian Rosy Christmas, Russian Blue Moonlit Christmas, Maine Coon Fireside Christmas, British Shorthair Velvet Christmas, Abyssinian Evergreen Glow. These retain the original portrait as the lead image until their real Printful proof or matched scene is available; do not substitute a random breed.
- Uploaded all 22 original PNGs and 16 optimized WebP sales images to Shopify Files with stable named URLs. The original customer-uploaded ZIP stays separate from the live catalog. All 22 original CDN outputs were independently downloaded from the connected authorized PC, checked 1254×1254, and SHA-256 pinned in `public/shop-gallery.json`. No art was inferred from a small screenshot and no customer-generated private photo is listed.
- Existing **13** Christmas Village previews remain intact. New total **35 distinct original designs**, organized as **22 dogs and 13 cats**. 29 have a decorated mug sales image; six have an artwork-only lead image pending their matched mug image. All remain preview-only until exact approval.
- Distinct styles for the same breed remain separate design IDs, rather than overwriting or pretending they are different sizes.

## Four-view product experience
Each mug uses the compact existing card and enlarges to four clearly labeled views:
1. **Mug scene** — original decorated-mug sales illustration, or disabled/pending if no matching one exists.
2. **Artwork** — full original illustration (what is proposed for printing).
3. **Actual 11 oz** — enabled only if the **server-side** catalog returns a validated Printful supplier preview for that exact artwork revision and 11 oz SKU.
4. **Actual 15 oz** — similarly, only an authoritative validated 15 oz supplier mockup.

Both actual tabs are disabled and labeled pending until supplier proofs exist; illustration never masquerades as a Printful image. Ready-to-buy offers continue to use the original server-side authorization and frozen print files; no client gallery entry has price, SKU, proof or Add to Cart capability. The original supplier-approved Golden Retriever Winter Lights 11/15 oz remains live in the combined cart.

## Supplier preparation and remaining gates
- `src/shop-expansion.js` now contains the expanded **35 immutable source-pinned designs** and both mug SKUs (70 potential preapproval variants). The `PREMADE_EXPANSION_ENABLED` switch is **true** for bounded Cloudflare-scheduled **supplier mockup-only preparation** (maximum two new preview tasks per run). The reviewed proof allowlist remains empty: no new product can be purchased and no Printful production order is submitted. The enabled flag may be set back to false if a provider error occurs.
- The separate `REVIEWED_EXPANSION_PROOFS` signature allowlist remains empty. Supplier generation, print layout inspection, frozen approval, and exact SHA/product/variant matching are still needed before any new design becomes purchasable.
- Even when mockup creation is enabled, it produces print previews for review, **not** orders or checkout. Never infer that a styled illustration proves actual manufacture.
- Continue matching six remaining styled sales images using the original source and source-specific supplier proof, not an invented lookalike.

## Validation and release
- Branch: `recast/archive-mugs-four-views-20261103`. Release receipts (PR number, CI checks, deployment version, production read-only smoke) to be appended only after success.
- Tests must verify all 35 unique artworks, 22 dogs / 13 cats, 29 distinct styled scene images, six correctly marked missing, 70 unique potential SKU design combinations, and no unapproved commerce.
- Browser tests must cover 320/393/768/1280px, original vs mug scene toggle, four-view modal with provider buttons pending for unapproved designs and enabled for the approved Golden variants, no duplicate saved cart, and original mixed-cart/checkout-recovery flow.

## Rollback
Revert the PR and redeploy guarded Worker. No production SKU, print file, customer cart, payment or order data was modified by the gallery itself. Shopify Files uploaded for these designs remain as an unlinked media archive.
