# Recast Me AI — All 35 Christmas mug Printful preview staging (November 3, 2026)

After the first source-pinned Golden Retriever Christmas Village **11 oz and 15 oz** went live with approved, cached Printful mockups, the second bounded canary was configured for Labrador Retriever, German Shepherd and French Bulldog (11/15 each). This staged rollout increases to all 35 designs only when the second batch is confirmed to have no hidden provider or output defects.

## Safety contract
- This change increases the *preview staging* design limit from 4 to **35**, and per-cron supplier preview task creation cap from 4 to **2**. Provider calls remain idempotent: each draft task is persisted before its mockup provider request and cannot be blindly recreated after an uncertain outcome.
- Every artwork source SHA-256 is pinned to the exact approved Shopify CDN bytes. Format sniffing matches actual PNG/JPEG MIME, dimensions are checked, and required content moderation remains active before storing frozen print masters.
- The source artwork never comes from a user's private custom Recast or from unrelated product imagery.
- The immutable `REVIEWED_EXPANSION_PROOFS` allowlist is **not** enlarged here. Only previously visually reviewed first Golden Retriever 11/15 oz proofs are signed. The 68 other size variants will remain **ready_for_review** (or a fail-closed review/error state), not purchasable until their actual Printful preview angles and locked print placement are individually verified and signed in a separate review commit.
- All 35 dedicated Shopify mug listings remain DRAFT until a complete buyability and correct fulfillment-path audit; no new marketplace sales, Shopify payments or Printful production orders are initiated by this staging change.
- Printful generates the mockup once per original artwork + size; stored watermarked preview is kept for customer proof, and immutable clean production files are kept privately. No generation is required per sale.

## Release gates
- Security + full browser tests pass.
- Stage has verified no 429s or fatal provider errors across the first four source designs.
- Guarded production deployment returns `queue=v3`, `canaryDesigns=35`, `maxNewTasksPerRun=2`.
- Count status by each provider task before approving; never reset failed/unknown states or infer provider payment outcomes.
- Produce a contact sheet of original artwork and true 11/15 oz saved Printful 3D views, ensuring correct breed, no cropping, correct handle view and no empty product area.
- Only then authorize exact signature hashes and publish new buyable offers through the immutable backend review flow.

## Rollback
Set `PREMADE_EXPANSION_ENABLED=false` or restore canary count 4 and batch size 4, redeploy. Preserve original R2 statuses, saved approved artwork, product drafts, checkout claims and provider tasks; never delete or re-run an uncertain job.

## Conservative Printful rate cap
Official Printful API documentation states 2 mockup generator task creation requests per minute for new stores and up to 10 for established stores. This deployment uses a hard cap of **2** per cron; the provider's actual response headers/rate limit take precedence. No blind retry or duplicate task creation on a 429. Reference: https://developers.printful.com/docs/ 

**Rate-window safeguard:** A private R2 record at `shop/preparation/v3/mockup-create-rate.json` enforces no more than 2 supplier mockup task creations per rolling 65 seconds, even across cron executions. A missing/invalid record or failed compare-and-swap fails closed rather than sending duplicate requests. This conservative 65-second window is stricter than Printful's 2-per-60-seconds new-store limit; it may slow preparation but protects against permanent needs-review failures caused by 429 responses. Unit tests cover rollover and corrupted history.
