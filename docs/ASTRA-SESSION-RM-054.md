# RM-054 — recovered approved roadmap build

Baseline: main 52f9e3dcbb78a1a288ca4685a60ae8e917ce5a90 (RM-053 handoff-only follow-up).
Date: 2026-10-07 UTC.

## Locked owner direction recovered from prior Recast chat
Keep the subject step simple: My pet, Just me, Me + my pet, Couple, Family, My car, Other. Do not overwhelm customers with a taxonomy of babies, horses, memorials, places, etc.; unusual subjects remain possible through Other/custom.

Creative variety belongs in the organized Worlds/Ideas system. Preserve the expanded animation/art, sports, decades, movies/adventures, fantasy/sci-fi, seasonal and custom paths plus the later generic discovery groups. Do not present protected franchises, celebrity likenesses or real team marks as official licensed presets.

Approved merchandise roadmap from the recovered chat:
- Main lineup additions: Sticker Pack, Phone Case, Pillow, Notebook.
- More Gifts additions: Pet Bandana, Puzzle, Tote Bag.
- Pet Bowl remains excluded for now.
Existing live products remain unchanged.

## Work completed on this branch
- Removed the RM-053 customer-facing subject overload and Browse-all-subjects UI.
- Restored the seven approved quick choices and their deliberate photo-reference labeling.
- Kept backend generalization harmlessly available for custom descriptions; it is not surfaced as extra subject buttons.
- Created seven Shopify products as DRAFTS only. They are not published and cannot enter the Recast fulfillment map yet:
  - Sticker Pack gid://shopify/Product/15419551777012 — draft $14.99
  - Phone Case gid://shopify/Product/15419551940852 — draft $29.99
  - Pillow gid://shopify/Product/15419552137460 — draft $39.99
  - Notebook gid://shopify/Product/15419552366836 — draft $24.99
  - Pet Bandana gid://shopify/Product/15419552530676 — draft $34.99
  - Puzzle gid://shopify/Product/15419552694516 — draft $34.99
  - Tote Bag gid://shopify/Product/15419552858356 — draft $39.99
  These prices are working launch recommendations, not a claim of previously approved exact prices.
- Added src/rm054-product-candidates.js with researched supplier variant IDs. It is intentionally not imported by checkout/fulfillment.
- Added regression tests proving candidates remain outside FULFILLMENT until verified.

## Supplier observations used for the draft roadmap
Current Printful public catalog observations on 2026-10-07:
- Kiss-Cut Sticker 4×4: variant 10164 from Printful-generated store SKU evidence; current public catalog from $2.34.
- Clear iPhone case: current public catalog from $9.57. Verified generated-store suffixes include iPhone 15 17616, 15 Pro 17618, 15 Pro Max 17619, iPhone 16 20290 and 16 Pro 20292.
- All-Over Print Basic Pillow 18×18: variant 4532; current public catalog from $13.57.
- Spiral Notebook: variant 12141; current public page $12.43.
- Pet Bandana Collar: S 23142, M 23141, L 23140, XL 23143; current public page $17.93.
- Jigsaw Puzzle: 252 pieces 13431, 520 pieces 13432; current public page from $15.25 and explicitly US-only.
- All-Over Print Tote 15×15 black handles: variant 4533; current public page $17.60.

## Required before any new item becomes ACTIVE
For every candidate, use the connected Printful token to verify catalog_product_id, exact variant identity, availability, placement, print area dimensions/DPI, mockup styles, and order file type. Generate a real provider mockup through the Recast proof path. Add exact SKU mapping to FULFILLMENT only after that succeeds. Then verify Shopify variant(s), checkout metadata, frozen approval snapshot, clean print output and a Printful DRAFT order. Never confirm a physical production order merely to test.

Phone Case needs a deliberate supported-device set rather than one generic Shopify variant. Puzzle must be labeled US-only if retained.

No current live SKU, order, fulfillment mapping, render-credit rule, owner control, approved artwork, or paid production submission is changed by this branch.

- Added an admin-only GET catalog-candidate verifier. It uses the existing Printful token to read exact V2 variant identity/product IDs without creating mockups, orders, drafts, or production submissions. This is the next safe bridge from public research to exact provider mapping.

## Sticker Pack final-flow test decision
Owner recalled that the final inexpensive physical checkout test was intended to use a sticker pack. Printful currently offers a 5.83×8.27 Kiss-Cut Sticker Sheet (catalog product 505) at about $5.15 base before shipping/tax. The Shopify draft was therefore corrected from a single 4×4 sticker to Custom Recast Sticker Pack, SKU RECAST-STICKER-PACK, working retail $14.99. The exact Printful V2 catalog variant ID is intentionally left null until the connected-provider verifier confirms it. Do not activate checkout with a guessed variant. Once verified, this product is the preferred final paid end-to-end test because it keeps the physical test inexpensive while exercising Shopify payment → paid-order sync → Recast proof → clean print file → Printful draft → automatic production handoff/tracking. No purchase has been made by the assistant.
