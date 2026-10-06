# RM-050.3 — Read-only Printful order diagnostics — 2026-10-06

## Baseline and intent
Based on main 7093af9e0872fab0a270dc8f9e731a8694471b69 (RM-050.2), tree 7d583e69ec33227090750db21642a78d2bbca5ff. Owner supplied an admin screenshot with a legacy mug job in owner release review and the message: Draft submission already started; review Printful before retrying. They also confirmed Shopify automatic fulfillment remains off. Connected Shopify read showed the test order paid/unfulfilled with no returned fulfillments. Neither statement proves whether Printful holds a draft.

## Verified code finding
src/workflow.js stores commerce/production/<hash>-draft.json before POST /orders, and refuses another submission while that marker exists. There is no reconciliation in that path for a lost response or a rejected first request; tag update can also fail after the provider accepted the draft and before saveJob. Do NOT delete the marker or retry blindly. The first provider error and actual Printful outcome remain unverified in this session.

Another candidate defect: current external_id is recast- plus the Recast job ID. Printful documents a 32-character limit with letters/digits/dashes/underscores. Some long Shopify order+line IDs or legacy artwork-based IDs exceed that. The diagnostic reports the exact current identifier and validation result, but does not rewrite it or assert that this caused the original failure.

## Implemented
- Owner-only GET /api/admin/job/<id>/printful-check, dispatched from router inside the existing security boundary.
- Reads the existing job and draft-attempt marker, and performs one GET against the configured Printful store by recorded order ID or the exact current external ID. No provider POST, retry, attach, save, claim clear, production confirm, sync, payment or print-file operation.
- Distinguishes found, not found in this scope, invalid configuration, authentication, permission, rate limiting, rejected lookup, mismatched reference and inconclusive network/HTML responses. Private no-store response; allowlisted provider fields only, no address, email, token, file URL or raw provider error body.
- Adds Check Printful status to physical-order admin cards. Results render with textContent. Existing Create draft is disabled in the UI when its stored error explicitly says the previous submission already started; a diagnostic never re-enables it. Updates admin cache key and production host label only.
- No homepage/build marker, mug geometry, approved artwork, prices, quotas, owner policy, scheduler, production flags or live order records changed.

## Important correction to previous health claims
/api/printful-health probes catalog/mockup printfiles, and storeScopeConfigured only proves a variable is present. It does not establish Orders API access, correct account/store ownership, actual draft creation or fulfillment. Check product connection currently tests Shopify catalog access, not Printful Orders access. This new diagnostic addresses that gap without claiming Orders write access from a successful GET.

## Validation and remaining work
15 standalone tests ran locally and passed, zero skipped. An initial local test harness used unavailable t.mock.property, replaced with explicit test cleanup; no provider or deployment action occurred in that failure. Additional full-router authentication/read-only regression is included for CI. One-shot preparation runs the complete current mocked suite and Wrangler dry-run; final PR must also pass existing mocked browser validation. Exact observed CI and deployment results are recorded in the PR conversation after completion; do not infer them from this plan.

The owner must run the authenticated check to inspect the actual provider result: no direct Printful connector was available, Remote Desktop reported no online device, and no ADMIN_TOKEN was requested, exposed or used here. Do not press Sync as a harmless check: existing legacy release tags and auto-print settings can advance an already authorized job. Finding a draft is deliberately NOT linked back automatically, because a cron could otherwise confirm it. Review stored print proof and fulfillment intent separately before any eventual recovery or production action.

## Costs, preservation and rollback
No render, order creation, production confirmation, refund, X post or paid comparison performed by this work. Existing public main notes and RM-050 policy/domain/visual changes are preserved. Revert only this diagnostics change on latest main if needed; never reset older releases or clear live retry markers. Public notes omit customer contact details, private source URLs, tokens and artwork contents.

References checked: https://developers.printful.com/docs/ (Orders external ID, scoped GET lookup, draft/confirm distinction). Registration/site domain configuration and Shopify fulfillment settings were left unchanged.
