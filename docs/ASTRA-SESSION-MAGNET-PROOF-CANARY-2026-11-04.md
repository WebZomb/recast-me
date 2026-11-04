# Christmas Magnet 3-Pack proof trial — November 4, 2026

## Why
All 17 Christmas pet shop category pages are published, and 34/35 Christmas mug designs are ready-made and purchasable. Larger products need new genuine print-quality masters. The live read-only Printful supplier audit shows the 1254×1254 original pet artwork can fit the small Coaster 4-Pack print area (1181×1181 at 300 DPI) and Magnet 3-Pack area (900×900 at 300 DPI). Pixel fit by itself never means supplier proof, correct composition, or production approval.

## Exactly scoped manufacturer preview
- One original owner-approved Golden Retriever Christmas Village source with the pinned master SHA, rights and content-screening metadata, and a previously verified mug catalog offer. Never customer-uploaded art.
- Existing ACTIVE Shopify Custom Recast Magnet 3-Pack is $24.99, SKU RECAST-MAGNET-SET, Printful catalog product 656 and variant 16366 (3 copies via existing fulfillment quantity).
- The source-gated magnet pilot checks the saved *actual* Printful print-area audit for product 656 and this SKU before attempting a provider mockup task. If native pixels or aspect ratio fail, the pilot stops for manual review, never sends a supplier create-task request.
- This canary uses the same one-task durable claim and shared 2-per-65-seconds supplier mockup rate budget as the finished Golden Retriever coaster trial. A lost response, uncertain provider result or failed task remains held; no automatic duplicate.
- On completed real Printful proof images, status becomes ready_for_review. The public status exposes only safe state/count, not a supplier image access token. The separate owner-only QA image route uses the existing admin Bearer token, exact task/variant identity and same-origin signed supplier preview links.
- The private Control Center Ready-Made QA page displays original Golden Retriever art alongside saved, authentic Printful Magnet 3-Pack images when complete. Coaster original-vs-supplier review remains intact.
- No price/checkout link for the premade magnet is released by this pilot. Signed production printfile, exact placement and physical quality verification are separate requirements before a distinct approved offer can become purchasable.

## Safety, tests and rollback
New tests cover source identity, active mapping, real print-area preflight, no double supplier tasks, bounded polling and rate limiting, no buyer checkout, locked image viewing and both phone and desktop UI. Use full Node regression tests and Cloudflare dry run plus hosted policy tests, then guarded deploy and read-only live pilot status. No Shopify product mutation, payment, Printful production job or customer data change in this preview-only release.

Rollback by setting PREMADE_MAGNET_PILOT_ENABLED=false in guarded Cloudflare configuration or reverting the focused PR. Preserve all existing mug/coaster customer orders, private R2 task claims and approved supplier previews. Never clear a stale task automatically.
