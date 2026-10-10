# RM109 — Make exhausted Standard credits obvious

Date: 2026-10-10 EDT.

## Baseline and customer evidence

Branch baseline: GitHub `main` commit `f40ddb59274da7a49092e071f041afd63319932d` (RM108 Standard usage visibility). The owner's phone showed the real Recast Holiday Magic preview followed by a customer creation screen displaying High Quality 0 of 3 and Standard 0 left. Standard's exhausted message was buried in a long fallback paragraph and the "Use Standard instead" button remained visible but disabled, so it appeared broken. The HQ and Standard reset timestamps differed; they represent independent 24-hour windows. RM108 added explicit Standard used/total text but placed it below the fallback warning and did not replace the disabled call to action.

## Narrow fix implemented on review branch

- `public/quality-policy.js`: show **both** read-only allowance summaries all the time, including Standard while Standard creation is still locked by existing backend rules. Continue showing separate remaining/used counts and local reset times. Mark the Standard fallback as explicitly exhausted when it has zero credits, and never tell a customer with zero Standard to "try Standard." Preserves optional approved outage behavior.
- `public/index.html`: move the existing two-line credit balance **above** the long fallback message so people see it before making a quality decision. Add a dedicated exhausted Standard status and refresh the JS/CSS asset versions.
- `public/app.js`: replace the unusable Standard fallback button with an explicit "Standard used up — 0 of N left. Resets ..." status. Restore the real button when Standard allowance is available again; no entitlement change.
- `public/launch-v50.css`: clear, mobile-readable spent-Standard status. Existing two-line balance layout is preserved.
- `tests/quality-policy.test.mjs`, `scripts/rm050-browser-tests.cjs`, `tests/adventure-prompt-audit.test.mjs`: validate both counters while locked, separate reset logic, no misleading exhausted offer, hidden Standard button and visible spent/reset status in mocked mobile/desktop tests, and fresh asset version.

## Important boundaries

No backend credit counters, window timestamps, network/IP rules, allowed render totals (3 HQ/5 Standard), credit refunds, render engines, model prompts, site budget, customer artwork, protected previews, moderation, Shopify/Printful payments/fulfillment, or X bot settings have been modified. No paid AI render, customer credit consumption, purchase, fulfillment action, or external billing was initiated. The owner's latest Holiday Magic image is visual reference only; actual RM107 face preservation still requires explicit image comparison.

## Verification / release checklist

Code has been committed to a review branch; full GitHub CI, browser suite, Wrangler dry-run, merge and automatic Cloudflare deployment require independent success receipts. Do **not** confuse a PR or source change with the live website.

## Proposed paid render packs — NOT IMPLEMENTED OR ACTIVATED

The owner is considering Standard and HQ packs of 10/20/50 plus a small 3 HQ + 5 Standard refill. This has not been priced, created in Shopify or sold. Recommend a **purchased two-mode credit bundle**, not modifying/resetting the existing free 24-hour network limits. Before activation: owner approval of SKUs/prices; verified Shopify paid-order webhook grants tied to a recoverable account or transaction; separate purchased Standard and HQ balances; durable idempotent grants, safe refund/reversal/failed-render settlement; purchase-gated access across browsers; cost reserves and paid-capacity protections that avoid selling credits customers cannot redeem. No additional modes or bypasses should go live as a text-only storefront CTA.

## Rollback

Revert only the RM109 UI PR if it regresses. Keep original RM108 counter and the production `src/render-credits.js` unchanged; no R2, customer credit wallet, orders or key rotation is needed. If manually rolling back Cloudflare, first disable auto-deploy readiness to avoid immediate re-publication.
## Verified release (2026-10-10 04:59 UTC)

- Review PR #27 was squash-merged into GitHub `main` as **`af877f77114084d909c7d49fafe0bdc81398866c`**. Final reviewed head was `5a47393707045c0030022d7fce08bce40334ac16`. The repository comparison changed only the stated frontend files, policy/browser tests and RM109 documentation. No credit/backend/checkout changes.
- **417/417** mocked Node tests passed, Wrangler deploy dry-run passed, security workflow passed, and customer-policy browser workflow passed on mobile WebKit (393 px), mobile Chromium (320 px), and desktop Chromium (1440 px). Browser tests intercepted APIs and did not make a billable request. Initial intermediate CI runs failed on an outdated app.js asset assertion, a fixture that did not refresh its recovered Standard count before simulating an HQ outage, and a WebKit Playwright stability timeout clicking an existing unrelated Model Lab demo button. Each was corrected in the review branch and **the final complete workflows passed**; those failures should not be silently erased from history.
- Automatically deployed from main with GitHub Actions run **`38025941411`**, both test/dry-run and deployment/smoke jobs **SUCCESS**. Actual Cloudflare Worker `recast-me` deployed version **`234ec50e-0f70-4506-b1bd-df3f1c1279b3`**. Read-only production smoke recorded homepage HTTP 200, render-readiness HTTP 200 (`localReady=true`, `highReady=true`, `standardReady=true`), model-status HTTP 200, and unauthenticated owner route HTTP 401. No paid render or order was placed.
- The separate public launch-audit workflow `38025941460` was still in progress when this receipt was written, and live visual inspection of this exact credit-state UI from an exhausted customer wallet was not performed. The user's old Holiday Magic visual result predates this UI change and remains an image-quality reference only.
- Rollback the narrow UI change by reverting squash commit `af877f77114084d909c7d49fafe0bdc81398866c` using an approved GitHub change and rerunning guarded deployment; avoid altering existing credits, orders or private artwork. Inspect latest main/deployment history first.
