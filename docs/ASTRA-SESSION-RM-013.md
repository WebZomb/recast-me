# RM-013 — bounded previews and customer-approved print artwork

Date: 2026-10-03.
Baseline: `287507b1427ab29fa5c0e98f9b528bdcd20aab04` on `recast/secure-previews-2026-09-29`, draft PR #1.
Production baseline remains `209ac10fd4a7ec3b156417a08e2df86ad77b766a`.
Resulting application SHA and deployment evidence will be recorded after upload; do not treat this note as proof of deployment.

## Owner decisions and new evidence

The owner ran RM-012's saved comparison successfully: the supplied screenshots show Preserve 1536×1920 / 3.3s and Enhanced 1536×1920 / 3.1s, both visibly watermarked. This establishes that the owner's preview comparison returned images, not physical print quality or a measured invoice. The owner continues to prefer FLUX.2 dev High Quality. They accepted three free renders, five additional renders per paid purchase, a global spending control and artwork swaps until explicit customer print approval. No daily dollar amount was selected.

## Implementation

- High Quality becomes the default in the form and model-status response. Existing FLUX models, settings and four-version history remain.
- Added private guest credit wallets, salted-network starter allowance, conditional R2 reservations, exactly-once purchase bonus association and permanent revocation of unspent bonus after a refunded/canceled purchase. No browser-supplied payment claim grants credits. Failure restores customer credit; provider call/budget reservations remain conservative.
- Added an owner-configured daily reservation budget and per-call reserved cents, shared across guarded inference calls including owner/social paths. Credits cannot activate without valid budget configuration and network secret. This is **not an account-wide provider billing ceiling**, and no dollar amount was invented. The new allowance feature remains off unless explicitly configured.
- Shopify incremental updated-order sync now includes refunds/cancellations, keeps pagination across bounded batches and uses stable line IDs. Per-artwork job index avoids the old first-100-jobs customer lookup for new orders. Fresh payment, cancellation, line SKU/quantity and artwork checks precede customer changes and print production. Test orders cannot be sent to paid Printful production.
- Added customer selection, protected order-art preview, Printful product proof and explicit approval on the private order page. Optimistic revisions prevent stale-tab approvals and swap/approval races. Approval locks an immutable source snapshot; no automatic print timer.
- Owner approval cannot replace customer approval. Print finishing interpolates the selected snapshot instead of inventing new AI details. A dedicated per-job print token serves its approved clean final file after a fresh payment check. Ordinary order previews still pass the server watermark boundary. Existing digital entitlement behavior remains separate.
- Durable claims prevent automatic duplicate proof starts, upscales, Printful drafts and production confirmations; interrupted operations need reconciliation. Owner still explicitly sends production.

Files: `src/commerce-store.js`, `src/render-credits.js`, `src/render-controls.js`, `src/render-health.js`, `src/order-queries.js`, `src/order-approval.js`, `src/workflow.js`, `src/highquality.js`, `src/preview-security.js`, `public/app.js`, `public/index.html`, `public/order.html`, `public/order.js`, `public/order.css`, `tests/commerce.test.mjs`, activation guide and cumulative notes.

## Validation and failures observed

- Node v24.19.0: `node --test --test-isolation=none tests/*.test.mjs`: **124 tests passed, zero failed**. All providers/storage are mocked. New cases cover concurrent starter/budget exhaustion, restored failed credits, cookie-reset restriction, duplicate grants, refund replay, payment/test-order gates, proof-before-approval, stale revisions, swap races, clean-print token protection, exact saved source, non-generative finishing, and duplicate production submissions.
- Existing 100 tests passed before adding the new commerce cases. JS syntax checks and `git diff --check` passed.
- Shopify Admin 2026-07 operations validated successfully with the bundled schema validator, artifact `85a9c06a-6d46-4a0d-880b-6d819736d784`, revision 1. Toolkit documentation search failed with `fetch failed` (normal, escalated and proxy-free retries). Official Shopify docs were read via web retrieval instead. No live Shopify request was made.
- Wrangler 4.138.0 dry-run passed with /tmp config/log paths; initial application bundle 192.41 KiB. Final run recorded in upload verification.
- Visual browser check remains **unverified**. The local server first hit sandbox EPERM, then the approved retry found no installed Chromium. Temporary Playwright Chromium download repeatedly returned a truncated/non-ZIP archive. No screenshot or successful mobile browser run is claimed.
- No live AI render, Images upscale, purchase, Printful submission or social reply was initiated by the agent. The only network writes requested in this session are source/PR updates to the authorized GitHub branch.

## Gates, limitations and rollback

Read [COMMERCE-ACTIVATION.md](COMMERCE-ACTIVATION.md) before enabling or merging. Budget values, network secret, deployment URL, Turnstile, paid-order sync and live proof/print checks are still required. Guest/network quotas are not verified-person accounts; shared Wi-Fi may share starter credits. Refund bonus revocation is sync-dependent; production performs a fresh check. The reserve ceiling excludes Images and other service costs. No 24-hour reminder, background render queue or verified-account recovery is implemented.

Production remains unmerged. Preview and production share the configured R2 bucket; isolate test commerce data/configuration before activation. Large-format DPI, Printful default placement equivalence and delivered sample quality remain unverified. Legacy Printful drafts require deliberate migration/review. New private approved snapshots require an order-retention policy.

Rollback: stop new credits/production actions, retain all private commerce records and approved snapshots, and revert application files to the baseline through a reviewed commit. Do **not** allow the old owner-only approval path to print orders created under the new policy. Pause fulfillment until affected jobs are reconciled. Do not delete private artwork, ledgers or idempotency claims to roll back UI changes.
