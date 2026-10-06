# RM-050.5 — Verified-empty-store missing-draft recovery — 2026-10-06

## Baseline and live evidence
Baseline main d4ac5c5be0f34dfe6de8ed1a7956a2057029d474 (RM-050.4). Owner supplied the authenticated production admin result for legacy mug order #1001: diagnostic RM-050.4, configured Printful store 18798877, two provider requests, HTTP 200 final response, exact old reference not found, and a complete store snapshot of 0 checked / 0 total. The old reference remains 35 characters and the original draft-attempt lock remains present. This is materially stronger than the earlier inconclusive result: Orders API access works for the configured store and that store was empty at the time of the check. It does not authorize a blind retry without a fresh same-request verification.

## RM-050.5 behavior
- The admin offers **Recover missing draft safely** only after the read-only check reports the old invalid reference, legacy attempt lock present, no provider order ID, and a complete 0/0 configured-store snapshot.
- The server never trusts that earlier browser result. It performs a fresh exact old-reference lookup and a fresh configured-store list inside the recovery request. Any auth, scope, network, rate-limit, malformed, incomplete or non-empty response blocks recovery.
- Recovery is allowed only for the untouched legacy lock with no recorded externalId, no existing Printful order ID, no production timestamp, and an invalid historical external ID.
- Before any provider POST, Shopify payment/line identity and the exact approved high-resolution print file plus placement are reverified.
- The job is set to on_hold before provider creation. This blocks legacy release and auto-print paths from confirming production.
- The stale lock is not deleted. It is atomically replaced by exact R2 ETag with a version-3 recovery claim containing the corrected <=32-character reference and prior-attempt audit metadata. If the lock changes concurrently, no provider POST occurs and the job remains held.
- A successful provider response is persisted as the Printful draft ID while the job remains on_hold for inspection. The recovery endpoint never calls Printful /confirm and returns productionSubmitted:false.
- A post-save Shopify audit tag is best-effort only; tag failure cannot erase or disguise a successfully created draft.

## Preservation / non-actions
No approved artwork, product placement, quantity, pricing, render engine, customer credits, homepage, Shopify fulfillment, or global automation flag is changed. The existing legacy production-release tag is not relied on as a safety boundary; the explicit on_hold state is. CI tests intercept all provider calls and cannot create or confirm real Printful orders.

## Validation gate
Run the entire repository test suite on the PR, including the existing real-workerd redirect regression plus RM-050.5 tests for one-draft recovery, non-empty-store refusal, ETag race blocking, and UI gating. Wrangler bundle/dry-run and the repository mocked browser policy audit must pass. After production deployment, the only live/billable action is the owner's explicit click on Recover missing draft safely. Record its actual provider result separately. If the draft is created, it must remain held until visual inspection and a later explicit production-release decision.

## Rollback
Revert only RM-050.5 atop then-current main. Never delete or reset live order claims during rollback. RM-050.4 read-only diagnostics and valid-reference generation remain independently valid.
