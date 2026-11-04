# Recast Me AI — first non-mug ready-made gift, coaster preview canary (November 4, 2026)

## Reason and scope
All 17 physical shop category pages have been built and deployed. Existing Christmas pet originals (35 designs) are 1254×1254; they are not print-ready when enlarged to full blankets. Continue with **one small gift category** first, rather than silently stretching small art or exposing fake product offers. The Shopify store already has ACTIVE Custom Recast Coaster 4-Pack at $39.99 with exact SKU `RECAST-COASTER-SET`; its Printful mapping is product 611, variant 15662. The user authorized advancing ready-made goods while protecting existing mug orders.

This is an *actual Printful mockup-only trial*, not a blanket/cart/paid order activation. One version-pinned Golden Retriever Christmas Village source `RC-SHOP-GOLDEN-RETRIEVER-V1` is reused from the existing approved mug source. No new generative image, supplier production order, Shopify product, payment or new public offer is created. The 35-source catalog and other 16 shop pages remain unchanged.

## Safe supplier canary
- New `src/shop-coaster-pilot.js` runs only when `PREMADE_COASTER_PILOT_ENABLED=true` during the existing Cloudflare scheduled workflow.
- Initial migration checks R2 metadata source=original premade-catalog, exact `designId`, SHA-256 CDN revision, rights confirmation, prior content screening, complete source dimensions and exact active approved mug source offer. No customer or private uploaded photos can qualify.
- Coaster mockup generation uses the already-supported `createMockup` pipeline with the existing `RECAST-COASTER-SET` Printful product and a recommended **coaster** design, not a mug mockup. A single immutable R2 state is written with `creating_preview` before the provider POST. A lost response, exception or unknown provider state is **needs_review** and is never automatically retried.
- Reuses the same durable **2 per rolling 65 seconds** mockup task rate bucket as Christmas mugs, protecting the user’s Printful store from duplicate and 429 supplier requests.
- One supplier task only. Scheduled future rounds can poll that exact task at most 20 times. On completed authentic saved Printful views, the state becomes **ready_for_review**, with the number of preview images recorded, never auto-approved or published.
- Existing `/api/shop/coaster-pilot` GET returns only `status`, `providerViewCount`, `checkoutEnabled:false`, `automaticApproval:false` and safe failure code. No supplier view access tokens, original metadata access token, unsigned shopping product, or customer data is exposed. POST is refused. Robots noindex.
- Only after a human visually checks the authentic supplier proof, original artwork crop and coaster print area, verifies real DPI/safe zones, signs the exact immutable printfile+placement signature, then releases a separate reviewed production-safe backend offer can the 4-pack become purchasable in /shop-coaster-sets.

## Guardrails
- Printful’s published API has 2 mockup-generator POSTs/min for new stores and up to 10 for established ones, plus general API limits; use the stricter 2-per-65-seconds shared bucket. Source: https://developers.printful.com/docs/
- Printful requires high-quality artwork and actual print-area dimensions; the 1254×1254 artwork is *potentially* appropriate for smaller coasters but cannot be assumed sufficient without checking the provider's exact print template/DPI. Source: https://help.printful.com/hc/en-us/articles/50264019148177-How-should-I-prepare-my-print-file-for-the-best-results
- No automatic signature authorization, print master creation or purchase activation in this PR. Existing mug and blanket approval gates are unchanged.
- No deletion of old Printful task records, R2 source keys, customer carts, checkout claims or Shopify products. If the supplier responds ambiguously, stop and inspect; never reissue the task.

## Rollout / rollback
1. Run full Node mocked tests and Worker dry-run. Test disabled/no-source/wrong-rights/rate-full/no-double-provider-create/failed/finished/read-only status.
2. Require the hosted security and customer-policy browser checks to pass, then merge via reviewed GitHub PR and guarded Cloudflare deploy.
3. Read-only production `/api/shop/coaster-pilot`: `pending_preview`, `ready_for_review` or `needs_review` is a valid safe outcome. Do not claim a real proof or offer until completed and manually inspected.
4. If unexpected behavior occurs, set `PREMADE_COASTER_PILOT_ENABLED=false` in controlled Cloudflare config, redeploy; preserve R2 task evidence rather than delete or reset attempts.
5. Do not automatically roll this canary out to all 35 coasters or other products. Confirm image quality and fulfillment mapping first.

This pilot does not imply that the other 16 ready-made product pages are purchasable. The earlier verified custom Shopify products remain available to the user’s existing custom-design workflow.
