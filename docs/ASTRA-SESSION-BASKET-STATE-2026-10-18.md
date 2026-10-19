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

## October18, late morning Eastern — owner-requested cart and quick recovery

Baseline PR93 ef58948aa3ec25d3e65759738abf666c3db87a74, tree
a84ec3ca2b12f0ef26741f7c39089885374ce8b4; main remains849282875b4eba428bd5f3f6b7a05974f5c230c7.
Both baseline hosted checks39125093367/39125093302 passed. Owner explicitly asks
to finish the cart and provide quick fixes in the command center. Work extends
this existing draft; no other branch, production configuration or order changed.

Implemented a default-off integration: shared existing checkout preparation,
private owner-bound immutable approval checks, active variant revalidation and
frozen-source integrity check; per-line Shopify attributes; same-origin routes;
separate HttpOnly basket sessions initialized only with a valid artwork capability,
independent of render credits. The earlier wallet identity adapter remains inert.
Same-browser basket UI adds approved physical products, quantity/remove, continue
shopping, save reconciliation and retained pending action IDs. Digital/shared-link
shopping keeps individual checkout. This is not account-based/cross-device recovery.

Storefront cart creation uses a durable conditional claim before the remote call,
one request maximum per attempt, exact returned line/quantity/attribute verification,
and saved checkout reuse. Pending/ambiguous results block further checkout even
after edits; there is deliberately no blind reset/retry. The basket is retained on
failure/navigation. No discount code is enabled or sent. Requires BASKET_ENABLED=true
and a privately configured SHOPIFY_STOREFRONT_TOKEN; neither is enabled/configured by
this work. Current production credentials/publication permissions are unverified.

Command-center System panel adds quick read-only checks, public navigation-response
checks, direct links to actual order/artwork/alert/limit controls and an explicitly
confirmed pause-new-AI action preserving caps. Owner-only saved-checkout diagnostics
redact capabilities and expose uncertain-attempt references. Capacity detail depends
on separate PR90; absent endpoint is shown unavailable. No guaranteed automated fix
for provider outages, billing, uncertain remote carts or broken deployment is claimed.

Tests: 9 new routed integration tests PASS; full652/652 Node suite PASS; all4local
R2 concurrency checks PASS; bundle dry-run PASS. First integration run exposed that
the security boundary stripped the new session cookie; fixed with route-specific
cookie preservation while retaining JSON redaction. Next run exposed fixture parsing
OAuth form bodies as JSON; corrected fixture, reran all tests. Storefront2026-10
cartCreate schema validation PASS through installed Shopify validator. Connector's
earlier validation call explicitly skipped validation and is not evidence.

Added hosted 320/393/1280 browser checks for lost-response add recovery, quantity,
remove, checkout failure persistence and width fit. Local execution could not launch
because Chromium runtime is absent; no local browser/visual pass claimed. New hosted
results and exact uploaded commit belong in PR93 receipts.

Release blockers: actual Storefront token/channel/product access, real unpaid cart
handoff/line propagation and paid fulfillment acceptance; PR92 reconciliation review;
hosted browser checks; session loss and expired checkout support; bounded receipt
renewal after128actions; actual mobile acceptance; private capacity and delivered
alerts. Feature must remain disabled until these pass. Customer prices are confirmed
by Shopify; current basket UI does not quote totals. Unknown carts have read-only
diagnostics, not an implemented remote reconciliation/reset tool. No live provider,
cart, production order, payment, alert, discount, spending or cap mutation performed.

Rollback: keep flag off; revert integration files and shared-preparation extraction
as one unit. Preserve immutable approvals, all orders and any future attempt locks.
Changed files: entry/router/preview-security; basket-routes/session/checkout/admin;
public basket/checkout/admin/admin-recovery; integration/browser tests and policy CI;
this handoff and cumulative index. Reviewed source record confirms prior TestFlight
Build10 exists; earlier chat statement implying no mobile build was corrected.

## October18, late evening Eastern / October19 UTC — saved checkout validation

Baseline: PR93 `06cab310420c44a20918dfa9284000c6f3cdf115`, tree
`a9749f73249af4e8fe4a9283f2fb2c147f2952ce`; main8492828 unchanged.
Fresh remote byte comparison confirmed the edited source and both documentation
files matched this exact head before changes. Other dirty worktree files are
existing branch work and remain untouched. Resulting review-commit SHA will be
recorded in the project Pages; PR93 head is intentionally not advanced here.

The earlier audit reproduced missing/off-shop saved URLs accepted by the same-
revision fast path. Added regression tests first: 22/29 initial cases failed on
the baseline (including unsafe reuse and an unnormalized JSON read failure).
Implemented shared HTTPS exact-shop-origin URL validation for fresh and reused
checkouts, rejects credentials/nondefault ports/control characters/backslashes/
fragments, validates the complete private Cart GID/key without parsing its opaque
token, and validates stored owner/basket/revision/timestamps/line schema. Same-
revision reuse must match current server-approved variant, quantity and every
attribute, independent of attribute/line ordering. Snapshot trusted inputs before
storage awaits; parse/read failures return the safe unknown-checkout error.
No public cart IDs/keys or new logging. Malformed earlier revisions cannot be
overwritten. Pending/unknown attempts still cannot trigger another remote create.

Tests actually executed: final36new checkout cases plus existing suite =
**688/688 Node tests PASS**, zero skips/failures; four actual local Miniflare R2
concurrency/recovery smoke cases PASS. Node syntax and git whitespace checks PASS.
The first focused post-fix run had38/38 including9routed integration cases; final
suite adds fragment/type/old-revision/null/key-absence/duplicate-key cases.
No GraphQL operation changed. Shopify's official cart guide was rechecked:
https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage
Full Cart IDs include private keys; never expose them. The guide also requires
fresh checkout URL retrieval when appropriate; this patch does NOT implement
remote cart revalidation, URL refresh or expiry recovery. These remain release gates.
The cloud Shopify skill's local search/validator/feedback scripts were not present;
used the connected documentation search plus official page instead. No fresh
GraphQL-schema-validation claim is made for this JavaScript-only patch.

Blocked/unverified: local browser check failed before launch because the Chromium
executable is absent. No new visual pass; customer UI is unchanged. The combined
deployment-bundle dry-run command was blocked by an execution approval safeguard
because it may transmit source/metadata to Cloudflare. Do not retry it or trigger
the same check indirectly via CI without approval. Independent local R2 checks
were rerun alone and passed. No deployment, remote cart, provider call, order,
payment, alert send, live limit, discount or ad mutation occurred.

Delivery boundary: save the four-file delta as a review commit in the explicitly
authorized repository, without advancing a ref (therefore no new PR CI trigger).
No new hosted success is claimed; prior06cab310 CI only covers the baseline.
Next: obtain approval for the blocked bundle/CI workflow, then attach the reviewed
commit to PR93 after a fresh head check. Keep basket default-off. Versioned attempt
history for changed revisions, remote stale/expired cart checks, receipt renewal,
session recovery, PR92 fulfillment integration and live acceptance remain open.

Changed files: src/basket-checkout.js, tests/basket-checkout.test.mjs, this session,
docs/ASTRA-HANDOFF.md. Rollback this four-file review delta only; never delete saved
approvals, basket records, orders or uncertain attempt locks. This is a local-
tested validation repair, not proof that the complete cart is launch-ready.

## October19, 02:07 Eastern — owner authorizes cart deployment

Owner explicitly requested deployment and approved the previously blocked Cloudflare
bundle check. PR93 advanced with a lease from06cab310 to reviewed b9a6b264.
Wrangler dry-run now passes (metrics disabled); hosted security39207430004 passed,
customer-policy39207430045 was still running at the check. These results apply to
b9a6b264. Main and production have not changed.

Release inspection found a concrete configuration incompatibility: wrangler.jsonc
stores SHOPIFY_SHOP as b2wnfu-7g, while basketShop previously accepted only a full
myshopify.com domain. Match the existing application's short-name normalization
without weakening the domain allowlist. Added one regression covering the actual
configured shop and hostile/invalid values;37 checkout tests and46 combined
checkout/routed integration tests pass. No GraphQL operation changed.

Access: current local environment has no Cloudflare deployment credentials or
Storefront token configured. This does not prove production secrets are absent.
Opera connector reports disconnected; authorized online PC exposes no active
browser debugging session on9222/9223. Cloud browser reaches Cloudflare login,
not an authenticated dashboard. Need authenticated access to verify/configure
Storefront checkout and enable the feature; do not ask owner to pay for a test.
Existing PR92 fulfillment integration and cart recovery gates still apply.
No merge, live enablement, order, payment, limit or discount change performed.
Rollback this follow-up only: restore basketShop and its regression test; retain
the saved-checkout repair and all private attempt records.

## October19, early morning Eastern — immutable checkout history

Baseline PR93 head `6aad1d2259dea6742a7abde880668312f284873d`; main last
observed `849282875b4eba428bd5f3f6b7a05974f5c230c7`. All five touched files
were compared with this exact branch baseline before saving the delta. Prior
6aad1d2 hosted security39207662154 and customer-policy39207662177 passed.
The owner has authorized deployment and the bundle/CI checks. Cloudflare Google
sign-in failed in the previous interactive session; manual handoff is pending.
No authentication retry was attempted during this scheduled work session.

Changed-revision checkout now saves the entire validated earlier ready record
under private `commerce/basket-checkout-history/v1/<identity-hash>/<revision>.json`
before it may replace the current attempt. History uses conditional create only;
an existing slot must match the exact serialized record. Missing acknowledgement,
conflicting/corrupt history and unreadable history stop before current-record
replacement or Shopify creation. An explicit retry may recognize an already
saved identical archive. Current-attempt ETag claims still select one winner.
Same-revision reuse and ambiguous pending locks retain their existing behavior.
History includes private cart capabilities and approved line evidence; it is
never projected to the customer or logged, and uses private/no-store metadata.

Validation: 7 new regression cases; 44 checkout cases and 9 routed cases pass.
Full repository Node suite: **696/696 PASS**, no skips/failures. Five local
Miniflare R2 cases PASS, including the new changed-revision checkout race with
one mocked remote create and exact retained history. Initial new concurrency
test incorrectly expected one rejection without forcing overlapping reads;
the second caller could validly reuse the completed checkout. Added an explicit
read barrier; the forced race passes. No production Shopify request occurred.
No GraphQL or UI change; no new visual acceptance claim. Existing short-name
configuration fix remains present. Hosted checks for the resulting commit are
tracked separately; local evidence is not a production deployment.

Files: src/basket-checkout.js, tests/basket-checkout.test.mjs,
scripts/basket-r2-smoke.mjs, this session and docs/ASTRA-HANDOFF.md.
Save as a leased follow-up on the existing draft PR93; do not create a second
cart PR. Still default-off/not merged/not enabled. Remaining release gates:
fresh remote cart validation/expired URL recovery, approval receipt renewal,
browser-session recovery, PR92 fulfillment integration and authenticated live
configuration/checkout/mobile acceptance. History preserves evidence; it does
not itself implement reconciliation or prohibit separate payment of an old cart.
No orders, payments, renders, live limits, discounts or ad mutations.
Rollback only this five-file delta; retain every history record, saved approval,
order and uncertain attempt lock. Resulting commit is recorded in the Page log.

## October19, 07:42 Eastern session — revalidate returning checkouts

Exact baseline PR93 `fa1408e98aca78b7d1467ae24e9e26108fb16758`, main
`849282875b4eba428bd5f3f6b7a05974f5c230c7`. Compared all five touched files
byte-for-byte with the remote baseline before editing. That baseline has a
successful Workers Builds check117960944305; its GitHub Actions query returned
no runs, so no new security/customer-policy pass is inferred from it.

Implemented read-only Storefront cart refresh before returning a same-revision
saved checkout. The server sends the complete private cart ID, checks the returned
identity, exact approved variants/quantities/artwork attributes and complete line
pagination, validates the refreshed URL against the exact shop origin, then
rechecks the current durable attempt ETag. A concurrently replaced attempt is
not handed to the buyer. Refreshed URLs are returned only after these checks;
original attempt/history records are not rewritten by refresh requests.

Null/missing carts, network/HTTP/GraphQL errors, mismatched lines or an unsafe URL
stop safely without creating a replacement cart or resetting the existing lock.
A later explicit request may retry the read-only query. A missing cart is not
proof of expiry or nonpayment, so automatic expired-cart recreation remains
unimplemented pending payment reconciliation. Existing fresh-cart mutation and
changed-revision history behavior are preserved. No real Shopify request/order.

Shopify skill documentation search and validator scripts were available in this
session. Search and GraphQL validation targeted the configured **2026-10** version;
the new RecastBasketRefresh query passed schema validation. Telemetry opted out.
Sources: https://shopify.dev/docs/api/storefront/2026-10/queries/cart and
https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage .

Tests executed: 14 additional regression cases;67 focused checkout/routed cases
PASS; **710/710 full Node tests PASS**, no skips/failures;5 existing local
Miniflare R2 concurrency/recovery cases PASS; Wrangler bundle dry-run PASS.
Local browser verification failed before launch because the Chromium executable
is missing; no new visual acceptance claimed. Customer UI is unchanged. Syntax
and whitespace checked before saving. No failed code test in this session.

Five changed files: src/basket-checkout.js, tests/basket-checkout.test.mjs,
tests/basket-integration.test.mjs, this session and docs/ASTRA-HANDOFF.md.
Save to the existing draft PR93 with an expected-head lease; resulting commit
and check receipts recorded in the Christmas/Marketing Pages. No merge, live
enablement, deployment, render, payment, order, alert send, limit increase,
discount activation or advertising action. Owner Cloudflare login still pending.
Next: receipt renewal/session recovery, conservative expired/completed-cart
reconciliation, PR92 fulfillment integration and authenticated mobile/live
acceptance. Rollback this five-file delta only; never delete private histories,
approvals, orders or uncertain locks. Cart remains default-off until release gates.
