# RM097 — owner provider-job diagnostics and preview gate review

Date: 2026-10-09 (America/New_York). This continues Recast-Me's isolated integration branch, based on main `93488b18b96137ebcf2fa8fb37602df2f6351cb5`. Existing PR #16 branch head at session start `c64036ab5a36ab1a7d59bc65586c17fe9362115b`. The owner reconnected Desktop Commander; DESKTOP-GFOHB7M was confirmed ONLINE and responded to CMD and Node.

## Work verified
- GitHub PR #16's Recast security workflow passed. Customer-policy workflow originally failed only at mocked iPhone/WebKit 393px click stability on the owner-settings Save button, after passing Chromium 320px/1440px checks. Re-ran the failed workflow with unchanged code; on the second attempt **all jobs passed**. This is a flaky browser automation result, not a confirmed user-facing fix, and should be monitored rather than concealed.
- Rechecked local Docker-less Wrangler preview viability. An isolated local `wrangler dev` worker could fetch fal's API with intentionally invalid credentials (HTTP401). Repeated invalid-key JSON submissions also intermittently raised opaque local workerd `internal error` references, with no inference/billing. It is not evidence that fal itself failed or that real Cloudflare production runtime cannot reach fal.
- Started a **temporary authenticated** `wrangler dev --remote` preview isolated from Recast production using the public demo input and an unpredictable diagnostics header. Wrangler reported a temporary remote preview READY, with private Fal key and diagnostic token hidden. A later authenticated health-call tool request was blocked by tool safety checks. No successful authenticated canary, provider result or credit charge is claimed. The temporary preview process was terminated and temporary `.dev.vars` and diagnostic-token files were deleted. Original local fal-key.txt remains on the authorized owner's PC only. No secrets or customer photos are committed.
- The direct fal pilot results from prior sessions remain valid: actual owner-approved FLUX.2 [dev] edit requests produced 1024×1280 JPEGs, with the concise original-dog Royal prompt yielding a photographic palace scene and closer facial likeness. This session performed **zero** further live paid inference, purchases, order actions, moderation-provider calls or deployments.

## New functionality (isolated branch; not live)
1. `src/provider-jobs.js`: bounded, read-only private R2 index for fal provider attempts. Filters and validates keys, limits cursor input, includes only safe job statuses/time/request IDs, and never returns raw photo pixels, customer access tokens, full prompts or fal API secrets. Does NOT resubmit inference or reconcile pending customer credit/job attachment automatically.
2. `src/preview-security.js`: `GET /api/admin/provider-jobs` wired behind existing owner-authentication boundary. Unauthorized requests return401; method and input checks stay intact.
3. `public/admin.html` and `public/admin-settings.js`: expandable, owner-only provider-health/job status section in Limits & usage. It reads existing authenticated status and job APIs, renders text via `textContent`/DOM nodes (not untrusted HTML), exposes an explicit Refresh button, and indicates cost estimates are not invoices. User-visible controls do not run a provider job or switch public mode.
4. `tests/provider-jobs.test.mjs`: read-only route remains authenticated, does not leak secret/customer payload fields, rejects malformed cursor, safely handles unknown ledger records, and verifies UI text-safe wiring. **4 targeted tests passed**.

## Tests actually executed
- New targeted provider-job suite: **4 passed, 0 failed**.
- Full isolated Node unit test suite on Windows: **391 passed, 0 failed, 0 skipped** (7.16 seconds).
- Wrangler production bundle/deploy dry-run: **SUCCESS, no deployment**.
- Owner UI script had an initial syntax failure caused by an incorrectly constructed multiline string. Fixed via building separate lines joined with a newline. The final Node syntax check and full suite both passed. Do not hide this initial failure.
- GitHub CI after previous commit: both security and customer-policy workflows passed on rerun; no updated CI receipt should be claimed for this session's new source until the new commit runs.

## Remaining gates (do not mark launch-ready)
- Complete controlled owner-only provider test **from actual Cloudflare runtime**, with accepted privacy and billing settings, without bypassing input/output moderation, R2 protected previews or account budget protection.
- Current PR remains a DRAFT and live customer routes remain Cloudflare/FLUX.2 dev; fal keys and public auto switching have NOT been enabled in production. Cloudflare case #02368234 remains unresolved.
- Async accepted-but-not-completed fal jobs are ledgered and visible for owner review, but recovery to a customer preview without duplicate billing is not yet implemented.
- Need final customer preview acceptance (watermark, identity, last-four versions, credits), storefront usability, and separate supplier paid physical-order checks before declaring the entire website launch-ready.
- Source rollback: revert this isolated PR or keep `FAL_PROVIDER_ENABLED`/owner fal flags disabled. The private job index has no schema migration. No production rollback currently necessary.
