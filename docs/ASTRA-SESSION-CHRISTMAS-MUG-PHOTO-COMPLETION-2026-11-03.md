# Complete Christmas mug marketing gallery — November 3, 2026
Owner request: finish Mugs visual catalog first, use the last approved set of six matching mug images, preserve the same existing store layout and start next product collection after mug buyability is proven.

## Asset completion
- All six previously missing decorated cat mug illustrations were selected against their specific original source art and uploaded to Recast's existing Shopify Files under `recast-christmas-archive-*-mug-scene-v2-20261103.webp`, 1024×1024 optimized WebP.
- Exact mappings: Maine Coon Winter Snowfall → snowy Maine Coon outdoors; White Persian Rosy Christmas → rose-gold Persian; Russian Blue Moonlit Christmas → blue moonlight; Maine Coon Fireside Christmas → green library/fireplace; British Shorthair Velvet Christmas → red chair; Abyssinian Evergreen Glow → elegant orange-brown Abyssinian.
- Catalog now has **35** original pet art PNG + **35** paired decorated mug WebP sales images, grouped into **22 dog** and **13 cat** designs. Visual merchandising leads with the decorated-mug image. Users can switch to artwork and request size-specific verified proofs when those exist.
- In Dog favorites, ten close-up Christmas Village designs are listed together, followed by the already-approved original Golden Retriever Winter Lights, then the full-scene archived Christmas designs. The original Golden supplier proof, 11/15 oz price, cart, checkout authorization and print master are unchanged. Same physical products and website navigation, no redesign.
- Uploaded decorated mugs remain explicitly **marketing illustrations, not Printful proofs**. No new product is buyable from a gallery source unless server-frozen Printful proof and placement have been approved for that exact design and size.
- No new orders or payments were placed.

## Remaining commerce blocker
- `/api/shop/expansion` previously returned 70 `needs_review` states with codes `expansion_failed` and `seed_source_pending`. Preparation is currently paused (`PREMADE_EXPANSION_ENABLED=false`) and remains so in this release.
- Buyability is **not finished** until source import is fixed, a *real supplier mug proof* exists for every offered design and size, and the production checkout-confirmation error reported by the owner is resolved. The existing two approved Golden Retriever offers remain unchanged.
- The mug gallery release is independent of supplier preparation, so it can be deployed without activating unsafe checkout or unreviewed fulfillment.
- Release receipts to append after CI/Cloudflare/read-only live audit.

## Rollback
Revert the gallery PR and redeploy guarded Worker. Previous 29 sales-image pairs and 35 original art sources remain intact in the earlier release; Shopify Files remain as unlinked media archive. Existing purchase data is untouched.

## Production release — verified November 3, 2026
- [PR #135](https://github.com/WebZomb/recast-me/pull/135) head `9bc0047d57f46033c2711e65aa80e7cc43c9153f` passed CI security + Chromium/WebKit customer-policy checks (workflow runs `41760415835`, `41760415787`). Squash merged as main `672b42c38fdf8e59ac94ea1fcfe6eb3bbd65bad4`.
- Guarded Cloudflare deploy run `41761344305` **success** including npm tests, dry-run and guarded deployment.
- Independently verified live site HTTP 200: `/shop.html` imports `/shop.js?v=9`; `/shop.js?v=9` contains the close-up vs classic-style grouping; `/shop-gallery.json` reports 35 entries and 35 nonempty decorated mug image URLs (22 dog, 13 cat). Existing `/api/shop/catalog` still reports 2 purchasable **original Golden Retriever** size variants; cart enabled=true. No other designs were made buyable by this release.
- Exact 35 print masters and 35 decorated sales images are now ready for *supplier proof generation* and subsequent distribution. The stored source IDs/revisions are immutable. Printful mockup and print-file authorization is still paused until safe import and checkout uncertainty are fixed. Do not advertise this visual completion as 35 finished shippable SKUs.
