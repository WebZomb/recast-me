# Christmas Six-Picture Sticker Sheet — one actual Printful proof canary (November 4, 2026)

## Owner goal
Finish the ready-made Christmas pet gift shop and make products purchasable only after actual manufacturer-quality checks. 17 categories are already displayed; mug shop 34/35 designs buyable and Siamese held. Golden Retriever four-pack Coaster and three-pack Magnet trials each reached ready_for_review with two authentic Printful views, still without sale authority. Third small gift category: existing ACTIVE Shopify Custom Recast Sticker Sheet ($14.99), exact SKU RECAST-STICKER-PACK, Printful 505 / variant 12917, format 5.83×8.27 inches, six distinct cut stickers.

## Why source pixels can work for a sheet
The original approved 1254×1254 Golden Retriever Christmas Village source cannot span Printful's whole 1750×2482 @300DPI sheet at full bleed. But Recast has an existing version-8 Sticker Sheet composer (src/commerce-store.js) that places SIX independently downscaled *complete* original square pictures on this sheet in a 2×3 layout with at least 120px transparent cut gaps (supplier minimum 75px). The 6 print tiles are well below 1254×1254, so each tile can be made from native art detail without interpolating the small original. The final sheet still needs exact supplier proof, cutline inspection and a frozen clean production file before sale.

## Guarded canary
- src/shop-sticker-sheet-pilot.js reuses exact catalog source metadata, SHA, rights, content safety and previously verified Golden Retriever mug proof.
- Checks the *real cached Printful* product-505/SKU-RECAST-STICKER-PACK template is exactly 1750×2482 @300 DPI. Recalculates six tile boxes using exact source 1254×1254 and rejects any tile enlargement or incorrect count. This is product-specific; intentionally does not require the full-bleed source to be 1750×2482.
- Uses existing createMockup for Sticker Sheet: it composes a real six-picture PNG, stores an approved-preview-only provider source (existing watermark safeguards), then creates **one** Printful supplier mockup task using exact SKU and source.
- Shares global Printful 2-per-65-second rate bucket; writes R2 state claim before provider POST. Lost/uncertain response => needs_review with NO automatic duplicate; polls one task bounded 20 times; success => ready_for_review with authentic supplier image count but no approval.
- Only read-only public /api/shop/sticker-sheet-pilot (no credentials), and owner Bearer-protected /api/shop/sticker-sheet-pilot/qa with exact saved completed task and same-origin signed supplier image URLs. POST 405, noindex.
- Add private Ready-Made QA card in existing /admin.html with the original artwork and actual Printful sticker sheet photo views, source-verified images only, clears protected images when admin session locks.
- Everything is preview-only. No paid order, Printful production job, final clean print master, Shopify ready-made offer or automatic approval.

## Test and release
- Local source- and task-gate tests cover exact template and tile sizes, rights, source hash, 1 task, no retries, rate throttle, owner authorization/URL filtering and absence of purchase controls.
- Run full npm test and Wrangler dry-run, plus Chromium and WebKit browser fixtures at mobile and desktop widths; require hosted policy tests where available. Deploy through guarded Cloudflare main workflow and independently verify the actual public status before claiming real supplier task completion.
- After authentic supplier images, inspect all SIX individual stickers, transparent white-backed picture regions and spacing; verify final print file, placement and physical sample before separately signing a ready-made catalog offer.
- Rollback: disable PREMADE_STICKER_SHEET_PILOT_ENABLED or revert only this focused PR; preserve any R2 task claim and image bytes. Never delete/recreate a task after ambiguous supplier response.

## Other products
Large blanket, apparel, poster, canvas, tumbler, stickers-sheet full-bleed and phone case require individually sized masters or product-specific layouts; no extrapolation from these smaller goods. Siena/Siamese original source import hold still needs careful review.
