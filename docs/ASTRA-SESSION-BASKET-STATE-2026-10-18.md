# Basket state foundation — October 18 UTC / October 17 Eastern, 2026

## Scope and baseline

Owner-authorized Christmas revenue-continuity work. Baseline main commit
`849282875b4eba428bd5f3f6b7a05974f5c230c7`, tree
`6b81f1a75a7965b051cbb5a7b869c9ce6e44fd12`.
Branch: `codex/basket-state-20261018`. Separate worktree; existing capacity,
order-line recovery and native-app branches were not modified.

This is an **inert, tested foundation**, not an integrated basket. No route,
browser script or existing checkout imports it. There is no new customer UI,
storage, authentication, Shopify cart request or fulfillment behavior.

## Implemented

`src/basket-state.js` implements immutable add / quantity / remove transitions:

- Each line retains a distinct opaque ID and exact artwork, SKU, numeric variant,
  preapproval token and proof hash. Different artwork or placement is never
  merged just because a variant matches. Approval contents remain in the existing
  private immutable approval record, not an arbitrary browser-supplied URL.
- Expected revisions reject stale commands against a newer committed snapshot.
  Action receipts make identical retries return current state; replaying an old
  add after removal cannot resurrect an item. Changed payloads under the same
  action ID fail. Removed line identities cannot be reused for another design.
- Reject malformed commands, quantities, approval reference shapes, duplicate
  line IDs and invalid state. Do not coerce strings to quantities or accept price,
  image URL or approval objects in the command.
- Candidate safeguards are 20 lines, 10 units per line and 128 recorded actions.
  These are **prototype bounds**, not live shop limits or supplier promises.
  Receipt capacity fails closed rather than evicting replay protection. A usable
  authenticated renewal/expiry flow must be designed before public integration.

The `validatedApproval` context is a trusted server input contract. Shape checks
are NOT evidence of ownership, freshness, screening or an approved design.
Owner equality here is defense in depth, not authentication. Never expose this
function directly to browser-controlled context or arbitrary persisted JSON.

## Tests actually executed

- Initial 20 targeted Node tests passed. Review added a retired-line-ID regression;
  the final repository suite passed **616/616**, 0 failures, skips or cancellations.
- Cases include two artworks on the same variant, different proof placements,
  double-submit replay, changed-payload conflict, stale revision, quantity/removal,
  late retries after removal, JSON reload, cross-owner rejection, malformed data,
  bounds, exhausted receipt capacity and immutable input/output references.
- Node syntax and `git diff --check` passed. Hosted CI/bundle receipts are recorded
  in the PR when available; do not infer production acceptance from unit tests.
- No visual UI changed. Existing customer mobile/browser fixture gates should
  remain required; this work does not close real-device/mobile-checkout acceptance.

## Mandatory integration gates / next bounded work

1. Extract or reuse `src/entry.js:checkoutLink` approval validation without losing
   `validateRecast`, screening, active catalog mapping, source/proof comparison,
   normalized placement, frozen preview and frozen source. Resolve basket approval
   references privately on the server, with authenticated ownership, on add and
   again before checkout. Digital products need their own explicit contract;
   this initial physical-product record cannot silently stand in for them.
2. Add authenticated persistence with atomic revision compare-and-swap (or a
   serializing transaction). **Two reducers running on the same revision can both
   calculate a successor; only storage can choose the committed winner.** Reread
   after conflict/unknown writes; never use a blind overwrite. Persist state and
   action receipt atomically, scope keys to authenticated owner, and keep tokens
   out of analytics/logs/public links. Verify cross-tab and reload behavior.
3. Design a separate checkout-attempt state with an immutable basket revision,
   durable remote reference and an unresolved-operation lock. Do not clear that
   lock after a timeout or retry an ambiguous remote cart mutation blindly.
4. Verify the selected Shopify transport and line-attribute propagation. Current
   `workflow.js:validatedPreapproval` requires Artwork ID / SKU, `_Recast Design`,
   `_Recast Proof`, `_Recast Mockup`, `_Recast Preview Token`, `_Recast Preapproval`
   to agree with the private approval snapshot. Build attributes from that stored
   record, not browser values. One shared properties bundle is insufficient.
5. Build phone-friendly Add to cart / Continue shopping / quantity / remove with
   saved-design preservation. Preserve existing one-item checkout until end-to-end
   acceptance. Integrate reviewed PR92 order-line identity safeguards before any
   multi-line release; it remains a separate draft, not a deployed dependency.
6. Complete paid-order/line reconciliation and duplicate webhook/uncertain supplier
   drills under a separately approved test budget. No production orders here.

## Changes, release and rollback

Files: `src/basket-state.js`, `tests/basket-state.test.mjs`, this session record and
the cumulative handoff index. Exact resulting commit and review URL are attached
to the PR and Christmas plan after upload. Not merged or deployed. No quotas,
provider choices, public copy, discounts, paid ads, customer messages, orders,
production submissions or spending changed. No checkout availability claim.

Rollback: remove/revert this unreferenced module, tests and documentation entry.
There is no migration or live basket data to delete. Preserve all existing saved
artwork, immutable approvals, order records and supplier locks.

## October 18, 03:50 Eastern — conditional persistence follow-up

Prior head `f92eec3bd092d23d62eef9b696301aa5a2d44067` passed hosted security
39094989026 and customer-policy39094989006. Main remains at the original baseline;
PR93 remains draft. This follow-up extends that same review, not a new release.

Added `src/basket-storage.js`: private-binding-only persistence adapter with
owner/basket-scoped SHA-256 keys, state and action receipt in one JSON object,
conditional create (`If-None-Match:*`) and read-ETag conditional update. Each call
makes at most one PUT; a conflict or uncertain result triggers one readback, never
a blind retry. A matching receipt confirms the already-applied operation and
returns current state. If a timed-out operation has no confirmed receipt, return
`basket_commit_unknown`, even after a negative read: the original write might
still complete. Retry must preserve the same action ID, payload and revision.
There is no delete operation or deletion of replay receipts.

Exported the existing basket-state validator for stored-state reads. Reject bad
JSON, unsupported shape, oversized data, missing ETag and mismatched owner/basket
identity without overwriting. Snapshot inputs before awaiting storage. Hashing
keys avoids embedding raw identifiers in paths; it is not authorization or a
replacement for private bucket access. Metadata is private/no-store. The
authentication and approval-resolution contracts are STILL unimplemented.

Authoritative storage semantics checked October18:
[Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
specifies conditional PUT rejection as null and supports ETag/Headers conditions.
[R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/)
documents atomic conditional writes and the important negative-read/in-flight-write
caveat. Implementation uses the private binding, not a cached public bucket URL.

Validation executed:

- 16 new persistence tests plus21state tests: **37/37** passed. Includes forced
  simultaneous readers, create/update collisions, same-action replay, changed
  payload conflict, committed-but-lost response, negative read before late commit,
  read failure, invalid record, scope isolation and caller mutation during await.
- Full repository: **632/632** Node tests passed, zero failures/skips/cancellations.
- `scripts/basket-r2-smoke.mjs` tested **four cases against local Miniflare R2**:
  distinct concurrent creates, identical concurrent creates, ETag quantity-update
  race and committed-write/lost-response recovery. All passed, exit0. No remote
  bucket or credentials, no production request. The first invocation failed before
  emulation because installed Miniflare5 rejects v4 constructor options; corrected
  using its exported `convertV4MiniflareOptions` adapter, retaining v4 compatibility.
  Local installed version was5.20260921.1-alpha; hosted locked dependency results
  must be checked separately. `cf:false` disables automatic remote CF metadata.
- Added the local R2 smoke to existing read-only security CI and its path trigger.
  Node syntax/diff checks passed. Follow-up bundle/hosted results go in PR receipts.

These tests verify offline persistence semantics, NOT authenticated public basket
access, remote R2 acceptance, supplier/payment behavior or a mobile shopping UI.
No UI changed; original navigation/print geometry stay intact. Next: resolve and
revalidate exact per-line immutable approval records under authenticated identity,
then checkout-attempt locks/transport and customer controls. Preserve digital
product and receipt-renewal gates. Production basket remains absent.

Additional changed files: `src/basket-storage.js`, `tests/basket-storage.test.mjs`,
`scripts/basket-r2-smoke.mjs`, `.github/workflows/recast-security.yml`, plus small
validator export, this record and handoff. No live writes, renders, orders,
discounts, limits or spending. Rollback this follow-up only; no production data
exists for it to migrate/delete. Resulting commit and final CI are recorded in PR93.
