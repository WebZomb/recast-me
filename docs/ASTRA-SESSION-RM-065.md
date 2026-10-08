# RM065 — persistent order exceptions and owner recovery

2026-10-08. Baseline main `7a79aa4` (full baseline recorded by git parent). Owner continued from the pinned chat screenshot identifying silently skipped missing-artwork/product-mapping orders. Repository session records RM062–RM064 and cumulative handoff were recovered; personal-context retrieval was partial, not a complete transcript. This session does not claim every prior message was retrieved.

## Implemented
- `src/order-issues.js`: private durable exception records keyed by order/line, deduplicated across syncs, preserved resolution history, bounded pagination, and recovery guidance. No customer address, capability token or source artwork URL in new records.
- `src/workflow.js`: record missing/invalid artwork reference, absent metadata, unknown SKU and oversize-order cases. One failed order is recorded without starving later orders; exception-storage failure prevents cursor advance. Incomplete Shopify order pages fail rather than silently advancing. Owner-only issue listing and exact-order recheck, plus a separate 30-day audit cursor. Audit/recheck disable production processing; newly recovered jobs remain held. Existing jobs/provider IDs and locks are retained. Fixed issues discovered during normal sync also create held jobs. A legacy production tag can no longer process a held/payment-revoked job.
- `public/admin.html`, `public/admin.js`: order-issues panel, safe recheck, 30-day audit/continuation, per-job recovery guidance, automatic-sync failure/staleness visibility and periodic dashboard alert refresh. UI explicitly identifies dashboard-only notifications; no email/SMS sender activated.
- `tests/order-issues.test.mjs`: seven functional tests covering four skip reasons, repeated syncs, oversize-order isolation, safe recovery/provider ID preservation, authorization, read-only provider boundary, independent audit cursor, legacy hold guard and storage outage cursor safety.

## Verification actually performed
- 349 tests pass, 0 failures after locked dependencies installed. Initial full-suite attempt overlapped dependency installation and failed importing miniflare; rerun after npm ci passed all tests. Focused existing commerce suite:52 pass; new suite:7 pass.
- Wrangler deploy --dry-run succeeded; no deployment performed by that command.
- Node syntax and git whitespace checks passed.
- Attempted isolated mobile admin browser smoke could not start because this runtime has no installed Chromium executable. No local visual-browser claim. Existing GitHub browser workflow can run on publish; it does not itself certify authenticated admin acceptance.
- No new AI render, purchase, supplier draft/confirmation, customer email, refund, service activation or billing change.

## Limits and remaining launch gates
New issue detection applies on subsequent syncs; use the guarded 30-day audit to find older skipped orders. Larger audits paginate (100 orders per call); earlier-than-30-day orders are outside this audit. Issues paginate100 records; summary cards still describe bounded job snapshots and exclude separate exception totals. Rechecks do not guess artwork IDs or modify mappings. Recover the authentic purchase data/configuration before rechecking. A missing line or unresolved reference remains visible. Hold release still uses existing owner controls and approval checks; this feature does not repair arbitrary order data.

Dashboard alerts only, refreshed while open. External owner alert delivery remains unconfigured. Shopify granted permissions may have been corrected by owner after RM064; screenshot/history suggests subsequent permission work, but this session did not independently inspect live scopes. Do not repeat RM064's historical blocker as a current confirmed account state. Live fulfillment/tracking/email acceptance, new unattended order acceptance and physical quality remain unverified. RM062 content screening, bot protection and support/branding gates require current audit; not silently enabled here.

## Rollback
Revert this session's source/UI/tests together, leaving R2 issue history, artwork, production locks, design snapshots and supplier IDs intact. Never erase claims or resubmit existing Printful orders to roll back. Commit/push/deployment receipt follows when observed.

## Owner-authorized automation follow-up
Owner explicitly approved building/pushing the prepared update and requested maximum practical automation. Added a scheduled daily 30-day backfill audit, resuming incomplete pages on subsequent10-minute commerce runs; failure remains isolated from supplier and normal order sync. Audit never confirms production and preserves holds. Dashboard summary now includes bounded ingestion-issue counts; order panel shows last audit time. New functional test verifies daily skip/resume and held recovery. Direct git push could not authenticate; publishing through the connected GitHub API instead. Live admin browser is signed out, so no current credentials, permissions, billing or supplier status were verified.

Follow-up validation:350 tests passed,0 failed; Worker dry-run succeeded after automatic audit addition. No live production action was taken during verification.
