# Recast Me AI — provider preview source-rate hardening (November 3–4, 2026)

## Starting state
- Main baseline: `6dfc8a98d762e3587df7c97de145c3fd74ebb6fd` (merged PR #145).
- Guarded Cloudflare deployment `41774107146` and read-only launch audit `41774107133` succeeded for the 35-design, 70-variant Christmas mug preview queue.
- Connected Recast desktop independently read the production `/api/shop/expansion` endpoint: enabled, queue v3, 35 designs, two new tasks per scheduled batch. At first read: 8 published, 12 ready-for-review, 2 pending, 2 needs-review and 46 not started. `/api/shop/catalog` returned ten size-specific buyable offers including the original Golden Retriever Winter Lights.
- All 35 dedicated Shopify products intentionally remain DRAFT because Recast uses separate signed frozen Custom Recast Mug offers for checkout.

## Focused correction
- Original 2-per-65-second rate slot was reserved **after** `source(env,design)` imported/screened new artwork; after provider capacity was exhausted in a cron pass, this could still waste content moderation and source imports on dozens of not-yet-started designs.
- Reserve capacity **before** calling `source` for a new SKU, set `previewRateExhausted` once no slot is available, and skip any later not-yet-started SKU in that pass. Existing pending task polling and individually signed publication continue. Retain immutable reviewed proofs, all source hashes, Printful task idempotency and fail-closed uncertain outcomes.
- Update bounded-source tests: invalid source/redirect stops after the permitted initial source request, not across the full 35; corrupt rate history causes zero source imports and zero new mockup orders.

## Verification, rollback, and remaining work
- These exact source/test changes were independently tested on a clean authorized local checkout of head `3f176fc8c372ac1b0fc53b703ee43d1928c202bd`: **12/12** focused tests, **823/823** total Node tests, Wrangler dry-run success. This hotfix branch reapplies only these same changes to already-merged main; fresh pull-request CI/guarded production release still must be checked.
- No paid production order, customer checkout, paid generative artwork, customer data deletion, or credential change. The background scheduled Printful mockup **previews** are supplier tasks, not physical production.
- Two Siamese failures from the current source import are held for manual review: first `images_info_error_images_binding_connection_error` (code 9502), second `seed_source_pending`. Do not clear the source claim or blindly resubmit; verify provider/storage state.
- Another independently authored PR #146 is reviewing Beagle/Poodle signed proofs. Do not replace or roll back its source-approved signatures. Initial four new Christmas Village designs and the original Golden Retriever remain protected.
- Rollback: revert only this focused source/test change; retain all R2 claims, published offers, carts and task records. If provider issues continue, pause expansion via guarded deployment rather than retry ambiguous tasks.
