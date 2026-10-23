# Order-line recovery safety — October 17, 2026

## Scope and baseline

Bounded Christmas readiness work: isolate fulfillment reconciliation hazards before a future multi-product basket. Baseline main `849282875b4eba428bd5f3f6b7a05974f5c230c7`, tree `6b81f1a75a7965b051cbb5a7b869c9ce6e44fd12`. Branch `codex/order-line-recovery-20261017`. This is reviewable source work, not a production release or a working basket. Existing capacity PR90 and native app work are untouched.

## Reproduced issue

`reconcileShopifyOrder` previously selected an old order-name/artwork/SKU job whenever its key existed, without checking its order-line identity. Two paid lines sharing artwork and SKU could therefore select one legacy record instead of distinct jobs. A malformed/foreign record or two occupied keys for one line were also not surfaced as identity exceptions. No evidence of an affected real customer order was obtained.

Added regression fixtures first. After correcting the fixture key sanitizer to match production, the unmodified baseline passed 2 and failed 6 of the initial 8 tests. The initial fixture-sanitizer mistake is not production evidence.

## Implemented

- Read both the canonical order-ID/line-ID key and relevant legacy key before choosing a job. Verify stored job ID, order ID, artwork ID and SKU; canonical records also require exact line ID.
- Reuse a legacy job only for its recorded line, or for an unbound historical record when exactly one current line matches its artwork/SKU. Another explicitly identified line receives its own canonical job.
- Ambiguous unbound legacy rows, conflicting identity, duplicate canonical/legacy copies for the same line and malformed occupied records create a durable `job_identity_review` exception. Do not create replacement jobs, mutate uncertain refund state or start automation for those lines.
- Preserve supplier IDs, external references, existing claims, print approvals and artwork. Storage errors propagate instead of being treated as absence. No data migration or automatic repair of ambiguous history.
- Existing private owner issue cards display the actionable message and Recheck original order button. Source-level polish review found the existing textContent paragraph and responsive card layout suitable; no new UI/assets or live visual acceptance claimed.

Changed runtime file: `src/workflow.js`. Added `tests/order-line-identity.test.mjs`, this record and the cumulative handoff entry. No checkout, public copy, quota, discount, provider or fulfillment-confirmation changes.

## Tests actually executed

- 12 new offline regression cases: repeated same-artwork/SKU ingestion; exact-line legacy reuse; ambiguous unbound history; compatible single-line history; foreign order; duplicate keys; ambiguous refund; canonical mismatch/storage failure; malformed rows; concurrent conditional creates; same variant with different artwork; automation/release-tag guard with zero network calls.
- Focused existing commerce/order-issue suite plus initial 8 cases: 68 passed. Includes supplier acceptance without reconfirmation, timeout-lock preservation/recovery guards, partial shipment, duplicate credit handling and independent sync phases.
- Final entire repository suite: **607 passed, 0 failed**, no skipped tests. Node syntax and `git diff --check` passed.
- Wrangler `deploy --dry-run` succeeded. This generated a bundle only; it did not deploy or call production providers.
- Hosted CI and mobile browser results are pending at creation of this record. Fixture tests do not establish a real paid checkout, alert receipt, provider availability or physical delivery.

## Remaining work and safe recovery

Review the exact branch diff and hosted gates before any release. After a separately approved release, use authenticated read-only order/issue inspection to determine whether real ambiguous legacy jobs exist. Never resolve an issue by deleting a lock or creating a fresh supplier order. Reconcile the original Shopify line with existing supplier IDs/external references first; any data repair requires an explicit reviewed mapping.

Live capacity values, alert receipt, provider balances and basket checkout/line-attribute propagation remain unverified. The multi-product basket is not implemented by this patch. Public seasonal endpoint still reports promotionsEnabled:false, offer:null and checkoutReady:false; no offer enabled.

No production write, payment, supplier draft/confirmation, order, render, customer message, alert send or spending change. No merge/deployment performed. Exact resulting commit/PR and hosted receipts are recorded in the linked review and Christmas plan when returned.

Rollback: revert this source/test/documentation change only. Preserve all live job records, issue history, approvals and supplier locks; never delete those records or resubmit orders as part of rollback.
