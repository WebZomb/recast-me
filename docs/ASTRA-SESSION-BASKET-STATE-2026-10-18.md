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

## October 18, 07:55 Eastern — browser identity boundary

Baseline for this extension is PR93 head `c8af7719c276096e7930b4bbab68a72e1bb0f200`
(tree `b43a880bafc02a81b25a9386d467d19c3a205989`). Main remains
`849282875b4eba428bd5f3f6b7a05974f5c230c7`. Both baseline hosted gates are now
verified successful: security39109230504 and customer-policy39109230479.
Customer job117621557377 includes successful customer/owner browser, mobile Model
Lab and seasonal checks. These are fixture gates, not live checkout acceptance.

Added an unreferenced `src/basket-identity.js` adapter. It resolves the existing
HttpOnly wallet cookie through `walletFor`, derives owner ID server-side, requires
the established same-origin/custom-header guard for reads and writes, rejects
ambiguous duplicate cookies, missing/revoked sessions and corrupt storage, and
returns only an immutable server context. It never creates a wallet, writes R2,
uses a network hash as ownership, or accepts a caller-supplied owner ID. Errors
do not expose storage details. This identifies a browser session, NOT a verified
person/account, ownership of an image, or a cross-device recovery identity.

11 new identity tests passed, including cookie separation through the real basket
storage adapter, revocation, malformed records, cross-origin requests and no-write
failure paths. Full Node suite **643/643 PASS**, no skipped/failed tests. All four
local Miniflare R2 smoke cases passed again. Bundle-only dry-run exit0; diff check
passed. Initial test file did not parse because a fixture await was inside a
non-async callback; moved fixture creation before the callback and reran all tests.
No UI changed or new visual acceptance claimed. New-head hosted results must be
checked separately from the successful baseline.

### Approval and checkout source audit — next bounded implementation

- `entry.js:validateRecast` verifies private artwork capability independently of
  wallet identity. Never treat the basket cookie or a preapproval token alone as
  permission to read/add arbitrary artwork. Reuse the existing access path, which
  also supports shared artwork; do not invent an account-only restriction.
- `checkoutLink` performs stored-artwork screening, active catalog SKU lookup,
  normalized design/proof matching and frozen preview/source creation. Extract a
  shared server approval service without bypassing any of those gates. Do not
  blindly call this checkout endpoint for cart add: it also creates checkout data.
- Existing preapproval schema contains request/SKU/proof/mockup/preview/source and
  design, but no wallet ID or variant ID. Resolve current active SKU/variant mapping
  server-side and compare with the basket's stored variant at checkout. A variant
  change needs explicit re-review; never silently switch the purchased item.
- Retain every required per-line attribute: Artwork ID, `_Recast Design`,
  `_Recast Proof`, `_Recast Mockup`, `_Recast Preview Token`, `_Recast Preapproval`.
  Build from the checked private record; include an opaque basket-line identity to
  preserve separate same-variant designs. Validate compatibility with
  `workflow.js:validatedPreapproval` and paid-order verification.
- Session initialization/recovery, artwork authorization, token-safe customer
  projection, route wiring, checkout-attempt locks and immutable checkout snapshots
  are still absent. Existing credits-disabled/original-photo paths must not become
  dependent on purchasing render credits. No new cookie is issued in this patch.
- Proposed transport only: Shopify Storefront Cart API supports individual line
  attributes and returns a checkout URL. Official docs checked October18:
  https://shopify.dev/docs/api/storefront/latest/input-objects/CartLineInput and
  https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate . Store access,
  selected API version, propagation to paid-order custom attributes, error/warning
  handling and unknown-result recovery are NOT verified here. No GraphQL code,
  remote cart or order was generated/executed. Do not assume remote idempotency.

Files changed in this extension: new identity module/test plus this session and
handoff. Resulting commit is recorded in PR93 and the Christmas notebook. No live
routes, limits, credits, discounts, photos, orders, providers, ads or spending
changed; PR93 remains draft/not deployed. Rollback: revert just this extension;
there is no new production data or migration. Keep all existing customer data.
