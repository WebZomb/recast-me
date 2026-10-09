# RM098 — fal-first fixed routing, confirmed HQ-outage Standard option, and remote-runtime proof

Date: 2026-10-09 (America/New_York). Baseline: draft PR #16 head `bd3ed536aafb469095e54c6580a16c1d5c7c9b8c`, branched from original main `93488b18b96137ebcf2fa8fb37602df2f6351cb5`. Work performed in the owner's isolated `rm094-provider-build` workspace via Desktop Commander, not on the production Worker. Previous RM096–RM097 records and AGENTS instructions consulted. Do not confuse isolated tests, GitHub CI, preview or remote canary with a deployed customer service.

## Owner decision and actual design
- Owner chose **fal FLUX.2 [dev] as the fixed preferred HQ host**, with Cloudflare's same FLUX.2 dev as an owner-verified backup. Do not sort host choice by a fluctuating price calculation on every job. Single-small-reference 1024×1280/18-step cost estimate favors fal (~$0.036) versus Cloudflare (~$0.048); some multi-photo cases favor Cloudflare, but the owner prioritizes consistent fal-first selection. Estimates are NOT invoices and do not include retries, storage, currency/taxes or other services.
- The host selection requires no paid readiness probe. It reads prior R2 provider-health records. **Both** owner verification and an observed successful render record are now required before enabling a provider in public auto mode. A provider marked failed/pending remains ineligible until an owner-controlled actual recovery canary proves success. Legacy public Cloudflare mode remains unchanged until deliberate activation.
- If **no approved HQ host is working**, Recast offers an **optional Standard quality choice with a prominent warning**. Standard is Cloudflare FLUX.2 Klein 9B, a different model on the SAME provider platform, so it may also be unavailable. Its output may have less detail or weaker likeness. There is NO silent downgrade or automatic third billable inference. Clicking Standard and pressing Generate supplies explicit client acknowledgement; the server independently checks confirmed HQ operational failures and separate Quick-model readiness before allowing Standard while HQ credits remain. A successful Standard preview uses a Standard credit only and retains HQ credit; a failed Standard preview restores its credit. Safety screening, watermarking and private storage remain on both routes. Content-policy refusals, quota exhaustion, unverified health and ambiguous accepted HQ jobs do NOT authorize a downgrade.
- Error handling distinguishes **accepted-but-unresolved fal jobs** from confirmed service failures. Unresolved jobs are recorded with the acknowledged provider request ID, mark Fal as pending (not available), show a non-retryable message to the customer, and hide retry/switch controls even if a background readiness refresh occurs. No speculative paid retry or fallback occurs for accepted ambiguous work. This prevents automatic duplicates, but **does not yet automatically attach late results to customer artwork**; see launch gate below.
- Owner Model Lab now explicitly honors the requested Cloudflare or fal host for HQ, regardless of public automatic preference, and keeps all owner authentication/call limits. Only confirmed operational errors mark a provider unhealthy; moderation and malformed input do not bypass protections.

## Actual live provider proof (bounded public-demo canary)
The owner approved an earlier $1 total testing allowance against the one-time $10 fal credit wallet, with automatic top-ups off. Direct fal tests in RM088–RM096 had already proven fal output from Windows. On 2026-10-09 15:24–15:25 UTC:
- Created a temporary, isolated **Cloudflare Workers Remote Preview** Worker using a private fal API key from the owner's PC, a separate random diagnostic token, and the pre-approved **public Jack Russell** 400×500 JPEG. No customer image, order, Shopify/Printful or X action.
- At first, the remote preview returned 404 to the authenticated health check even though it was ready. Read-only comparison of digest prefixes identified a stale remote preview diagnostic token. Restarted with a UNIQUE temporary Worker name; the token then matched. The failed health checks prevented any paid model submission.
- Confirmed temporary Worker and fal key health, then dispatched **exactly one** accepted FLUX.2 dev edit, 1024×1280, 18 steps, one reference. Cloudflare remote execution successfully returned a private inline JPEG in **28.963 seconds**, **1,340,645 bytes**, SHA256 `718ac74e09cebcaf6211d31efe8280e1f4759369abd7eb5212165227b74c7264`, fal request ID `01a12144-4584-77e3-9a1a-71127fe21011`. No raw media sent to chat or GitHub.
- Estimated one-call cost under the previously approved sub-$1 budget about $0.04. Actual billing not reconciled at time of this note; do not claim it is exactly that amount.
- Explicitly TERMINATED temporary preview, removed temporary `.dev.vars` and the diagnostic-token file, verified cleanup. The owner's original private `fal-key.txt` remains only on their authorized PC. No secret logged or committed.
- This demonstrates actual Cloudflare Workers remote runtime -> fal queue -> generated JPEG works using our adapter. It does NOT test the actual production R2/Images/Shopify or live account moderation; those are separate gates.

## Modified files
`src/provider-routing.js` fixed fal-first health-priority and fail-closed observed-success verification; cost estimates retained for owner monitoring.
`src/render-health.js` provider-specific state and audited Standard-outage eligibility signal, distinguishing stale cooldown, policy refusal, active backup and pending jobs.
`src/preview-security.js` explicit Standard-outage consent validated server-side before AI/credit reservations; owner HQ host selection.
`src/render-credits.js` Standard uses its own credits during verified HQ outage only with server-approved opt-in; no debit to remaining HQ balance.
`src/fal-service.js` only operational faults alter provider health; accepted unknown jobs are tracked as pending and fail closed without duplicate inference.
`src/highquality.js` preserves pending error classification and returns non-retryable owner-review status.
`public/quality-policy.js` customer warning and fallback state for confirmed outages.
`public/app.js` customer opt-in, Standard budget/pre-submit logic and non-retryable error controls; preserve last successful previews.
`public/index.html` bumped app asset URL version to avoid cached old JS.
`public/model-lab.js` owner-selected host respected.
`public/admin-settings.js` displays fixed route priority, separate Standard warnings, and cost-estimate limits.
`scripts/rm050-browser-tests.cjs` expanded mocked customer checks for HQ outage/Standard selection/recovery with no live provider call.
`tests/fal-provider-integration.test.mjs`, `tests/fal-gates.test.mjs`, `tests/fal-owner-pilot.test.mjs` adjusted for verified-success requirement and host preference.
New `tests/standard-outage.test.mjs` and `tests/fal-pending.test.mjs` cover no-consent, offline, failed/returned jobs, independent credits and policy safety.

## Tests and status
- Targeted router tests: 18/18 for provider priority, credential/health verification, approved Standard fallback, credit handling and accepted-pending safety. Follow-up owner-host test also passed.
- **402 full local Node tests PASSED, 0 failed, 0 skipped** on the isolated updated code.
- Wrangler `deploy --dry-run`: SUCCESS, **no actual deployment**.
- Browser CI for the updated branch is not yet recorded here; upload/commit/recheck separately. Mocked tests are not real image quality acceptance.
- Real provider HQ client UX, moderation and Cloudflare Images/R2 under the actual Recast Worker remain pending. Current Cloudflare dev 3043 support case #02368234 remains unresolved.

## Unresolved / rollback
Do NOT turn on public fal auto-routes simply because this temporary canary worked. Complete an authenticated, owner-only test under the Recast Worker with real private storage, content moderation, watermark, credits and order-safe preview. Confirm cloudflare HQ recovery separately before approving it as a backup. Async provider jobs with accepted-but-not-finished status still require durable customer recovery/settlement before heavy traffic. Separate Printful physical fulfillment acceptance remains. No launch-ready or production deployment claim.
Rollback: keep all new Fal flags off or revert draft PR #16. No database migration, changes to existing customer saved versions, purchase credits, verified orders, Printful behavior or production routes were made here.
