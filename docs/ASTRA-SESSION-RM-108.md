# RM108 — Standard preview balance visibility

Date: 2026-10-10 EDT. Owner reports that Standard renders do not clearly show how many are available and how many have already been used. Owner is testing RM107 image likeness in parallel; do not initiate a paid model render on their behalf.

## Baseline and intended scope

- Baseline GitHub main: `b94642c1ced7e178468d37e22394616f336fc0ce`; RM107 source release `8856b4eaff0734aeeaab5c35c7d0e3f210d7386c` had successful automatic deployment run `38024173157` (415 tests). This is a source/control-plane receipt, not visual identity verification.
- Existing `/api/render-credits` already returns `standardRemaining`, `standardAllowance` and `standardResetAt`; only its presentation was incomplete. High Quality daily, purchased bonus and Standard are separately counted; a Standard credit is never silently substituted for High Quality.
- `public/quality-policy.js` formats High Quality and Standard with *remaining of allowance*, *used in the active 24-hour window*, and their own local reset timestamps. Bonus High Quality purchase credits remain a separate amount. Standard counts remain hidden while HQ is available, except when the server authorizes a High Quality outage fallback.
- `public/app.js` refreshes the read-only allowance text whenever the server-authorized fallback state changes. `public/launch-v50.css` makes both counter lines readable on mobile. `public/index.html` bumps the cache keys for modified site JS/CSS. No new storage, tracking, registration or credit writes are introduced.
- `tests/quality-policy.test.mjs` validates locked mode, exhausted mode, owner-configured allowance totals, used count and reset, purchased bonus and approved outage exception. `scripts/rm050-browser-tests.cjs` checks the displayed Standard count for eligible and approved-outage states on phone and desktop fixtures without accessing real providers.
- Explicitly unchanged: backend `src/render-credits.js` wallet and credit accounting, 3 HQ / 5 Standard configured defaults, $5/day cost guard, fal and Klein models, 48 world prompts, private R2, watermark, moderation, account and purchase flows, Shopify/Printful orders and X.

## Verification / release

Await GitHub PR CI and, if approved for merge, actual GitHub-to-Cloudflare deploy receipt. Until a production release and smoke test are recorded, this document describes staged source only. No paid images or other billable actions should be run by the assistant for this UI correction.

## Open items and rollback

The latest RM107 face-likeness prompt still needs the owner's dog photo visual QA; do not infer quality improvement from the 415 mocked tests. Credit display is a network/window-based allowance, not necessarily a distinct registered-person history. If the counters cause a UI regression, revert the RM108 frontend-only PR; ensure `CLOUDFLARE_DEPLOY_READY` is disabled before a manual Cloudflare Worker rollback to avoid the deployment workflow immediately restoring the changed source. Existing credit and order records must remain untouched.
