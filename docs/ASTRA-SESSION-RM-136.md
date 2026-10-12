# RM136 — Accepted Nano recipe across customer modes and FLUX HQ backup

2026-10-12 UTC / Oct 11 evening New York. Baseline `3c3c7683e803eb5b3d32fd389e59354905e39f02`, runtime RM135 `4dc83bf3f09c11dc3b0c37eea2d7b5f758cbd9ad`.

## Owner evidence and decision

Owner screenshots show concise Nano Royal puppy (20s), Dinosaur puppy (23s), and adult Dinosaur (23s). Visually close original facial features, appropriate scene/clothes, supporting person removed in puppy samples. Harness remains; scene placement and body pose are not exact. FLUX concise Royal invented a second dog and changed likeness. These are three promising examples with two original subjects, not broad quality validation. Owner explicitly accepts Nano recipe, requests same descriptions/prompts in HQ and Standard, and explicitly chooses FLUX as HQ backup despite comparative quality limitations. No private images committed.

## Implemented

- `highquality.js`, `standard-adventure-prompt.js`: customer HQ (Nano and FLUX) and Standard invoke the same existing v6 identity builder and 48 adventure guides. Nano recipe text unchanged. Consistent note normalization, reference labels/branch continuity retained. Owner legacy comparison control remains separate. Shared metadata version remains `nano-identity-adventures-v6` to identify exact accepted text.
- `provider-routing.js`, `customer-identity.js`, `fal-service.js`, `render-health.js`, `preview-security.js`, `wrangler.jsonc`: Nano preferred; explicit `FAL_HQ_BACKUP_MODEL=flux-2-dev` authorizes fal FLUX edit on a NEW request after a definite operational rejection (capacity / unavailable). No automatic second submission within a render. Billing, credentials, moderation, pending/ambiguous completion, lost acknowledgment and 5xx submissions do not authorize failover. Existing fal/Cloudflare host policies remain separate.
- Track Nano and FLUX availability separately. An explicitly approved FLUX model with no per-model record may receive its first real request; this is NOT proof of live availability. Known failed/pending backup stays closed. A successful deliberate owner Nano/dev comparison can restore its corresponding model availability without a separate paid health check. No automatic recovery probes or timers.
- Preserve rejection receipts (previous catch overwrote them with uncertain status). All uncertain submissions now mark provider pending. One acknowledged queue job only; no unknown-job replay. Backup selection changes reserve estimate before dispatch. Output reports actual fal model, backup quality label; model status follows selected route. Existing moderation, private storage, watermark, budgets, last-four history and purchase behavior preserved.
- `public/admin-settings.js`: remove obsolete hardcoded provider priority; display server policy.
- Tests updated for intentional prompt changes; new tests exercise actual backup route through secured endpoint, one queue POST/one credit/screening/watermark, pending/billing/refusal exclusion, 429 vs 503/lost acknowledgment, recovery and per-model isolation.

## Verification and limits

First local pass hit a syntax typo in readiness ternary; fixed. Next 499-test run had 11 stale old-prompt/model-name assertions; updated to actual accepted recipe and kept scene/reference/security expectations. Consolidated two redundant old-recipe assertions into an all-48-world shared-recipe check. Then 504/504 tests PASS; Wrangler dry-run PASS. Final rerun/hosted CI/deploy receipts appended below. No billable assistant generations, purchases or fulfillment actions. Mocked tests establish routing/contracts only, not likeness or provider billing. Standard and backup using this common prompt still need owner visual testing; FLUX has a known duplicate-subject quality failure.

## Rollback

Remove `FAL_HQ_BACKUP_MODEL` to disable the new model backup; Nano remains lead. Revert this runtime patch to restore RM135 Standard text/routing while retaining Nano v6. Do not erase job ledger, overwrite approved artwork or replay accepted/uncertain jobs. Runtime deployment pending at this entry.
