# Recast Me AI — All 35 Christmas mug Printful preview staging (November 3, 2026)

The first four source-pinned Christmas Village designs — Golden Retriever, Labrador Retriever, German Shepherd and French Bulldog — have **eight** individually reviewed and signed Printful supplier proofs, two sizes (11/15 oz) per design. All eight offers appear in the custom Recast Me Shop catalog alongside the original Golden Retriever Winter Lights 11/15 oz pair. This release expands bounded *preparation* to the other 31 designs, while retaining human proof review before sale.

## Safety contract
- This change increases the *preview staging* design limit from 4 to **35**, and per-cron supplier preview task creation cap from 4 to **2**. Provider calls remain idempotent: each draft task is persisted before its mockup provider request and cannot be blindly recreated after an uncertain outcome.
- Every artwork source SHA-256 is pinned to the exact approved Shopify CDN bytes. Format sniffing matches actual PNG/JPEG MIME, dimensions are checked, and required content moderation remains active before storing frozen print masters.
- The source artwork never comes from a user's private custom Recast or from unrelated product imagery.
- The immutable `REVIEWED_EXPANSION_PROOFS` allowlist is **not** enlarged here. All **eight** previously reviewed Christmas Village size variants remain signed; **62** more size variants can move to `ready_for_review` (or a fail-closed review/error state) but **not** purchase until their actual Printful preview angles and locked placement are individually checked and signed in a separate review commit.
- All 35 dedicated Shopify mug listings remain DRAFT until a complete buyability and correct fulfillment-path audit; no new marketplace sales, Shopify payments or Printful production orders are initiated by this staging change.
- Printful generates the mockup once per original artwork + size; stored watermarked preview is kept for customer proof, and immutable clean production files are kept privately. No generation is required per sale.

## Release gates
- Security + full browser tests pass.
- The first four source designs have previously passed signed Printful-proof checks; confirm no new 429s or fatal provider errors during this expansion.
- Guarded production deployment returns `queue=v3`, `canaryDesigns=35`, `maxNewTasksPerRun=2`.
- Count status by each provider task before approving; never reset failed/unknown states or infer provider payment outcomes.
- Produce a contact sheet of original artwork and true 11/15 oz saved Printful 3D views, ensuring correct breed, no cropping, correct handle view and no empty product area.
- Only then authorize exact signature hashes and publish new buyable offers through the immutable backend review flow.

## Rollback
Set `PREMADE_EXPANSION_ENABLED=false` or restore canary count 4 and batch size 4, redeploy. Preserve original R2 statuses, saved approved artwork, product drafts, checkout claims and provider tasks; never delete or re-run an uncertain job.

## Conservative Printful rate cap
Official Printful API documentation states 2 mockup generator task creation requests per minute for new stores and up to 10 for established stores. This deployment uses a hard cap of **2** per cron **and a 2-per-65-seconds rolling window**; the provider's actual response headers/rate limit take precedence. No blind retry or duplicate task creation on a 429. Reference: https://developers.printful.com/docs/ 

**Rate-window safeguard:** A private R2 record at `shop/preparation/v3/mockup-create-rate.json` enforces no more than 2 supplier mockup task creations per rolling 65 seconds, even across cron executions. A missing/invalid record or failed compare-and-swap fails closed rather than sending duplicate requests. This conservative 65-second window is stricter than Printful's 2-per-60-seconds new-store limit; it may slow preparation but protects against permanent needs-review failures caused by 429 responses. Unit tests cover rollover and corrupted history.

## Review and corrected preparation scope — continuation
- Source baseline: main `910eb52917e3291ff8a57d52a41908843945be76`. PR #145 initially passed GitHub security, customer-policy and Cloudflare preview checks before its small follow-up correction.
- Prepared hardening: claim a conservative Printful rate slot **before** importing/moderating a new artwork. When the two-slot rolling bucket is exhausted, skip all further not-yet-started sources during that cron invocation while still polling any previously submitted provider tasks and processing their signed publication checks. This avoids unnecessary billable content-screening or wasted work while rate-limited.
- Tests updated to assert bounded source fetching and a fail-closed corrupted supplier-rate record. Exact signed product/price/placement invariants remain untouched.
- No paid customer checkout, Printful production job, AI artwork generation or change to the 35 DRAFT Shopify listings was authorized or undertaken by this code-only continuation.
- CI, merge, Cloudflare deployment and live readiness are **pending fresh checks** after the continuation commits; record exact receipts only once observed. Rollback: disable expansion or restore canary=4 and batch=4 in a guarded Worker deployment without clearing R2 claims, offers or paid order state.
