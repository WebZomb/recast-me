# Legacy Checkout Preflight Recovery — Recast Me AI — November 3, 2026

## Cause and time boundary
Every production Shopify cart create/read since the original October 18 basket implementation used `redirect:'error'`, an unsupported Request option in Cloudflare workerd. The fix shipped on main merge `6fe697f1ac528c7dfb2b10da2b2dfb4b97eba56f` at **2026-11-04T03:08:37Z**.

The previous implementation saved an R2 checkout attempt `status:'pending'` **before** constructing the unsupported Shopify fetch, which threw synchronously before a request could be sent. Old saved carts thus retain a pending claim and show the owner "We could not confirm checkout" after the runtime fix, even though checkout can now work for a new cart.

## Exact, fail-closed recovery
- Only the exact six-field original historical preflight-only pending record, started between **October 18, 2026** and **November 4, 2026 03:08:37 UTC** (earlier than code-merge time), with verified matching ownerId, basketId, exact current revision, and exact immutable variant/quantity/cart-property line content, can recover.
- Any remote cart ID, checkout URL, completedAt, additional unknown properties, changed quantity, altered approval, wrong owner, bad timestamp, later pending attempt, already ready attempt, or differing revision is **NOT** eligible. These remain fail-closed and require owner review.
- Writes the entire original pending claim to its prior-revision immutable history key first. Only when archive is safely stored does a CAS (etag-match) replacement of the same checkout attempt occur; that protects against concurrent duplicate Shopify carts. No deletion, no blind release of unrelated Printful/Shopify payment locks.
- A new Shopify CartCreate is then attempted once with `redirect:'manual'` plus explicit no-redirect validation. If Shopify's outcome is ambiguous, the attempt remains pending and is **not** silently retried. A successful confirmed cart uses the existing private checkout link and retains all frozen approved artwork attributes.
- No direct payment, Shopify order, Printful production, or changed product approval. The user's old cart lines are preserved and validated.

## Regression tests
- Exact legacy predicate with all invalid date/owner/cart/quantity/extraneous-field cases.
- Simulated R2 archive, then one Shopify cart create, returning a confirmed checkout. Existence and contents of immutable original archive asserted. No UI or runtime workaround; isolated mock tests only.
- Existing saved checkout safe reuse, receipt conflict, concurrent update, and abandonment tests unchanged.

## Deployment
PR/CI/Cloudflare and live smoke receipts must be recorded after successful validation.
