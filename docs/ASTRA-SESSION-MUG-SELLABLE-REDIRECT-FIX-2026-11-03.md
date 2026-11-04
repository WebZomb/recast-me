# Recast Me AI — checkout and mug-source redirect fix (November 3, 2026)

## Production blocker identified
Cloudflare Workers' Request runtime supports only `redirect: "manual"` or `"follow"`. The old premade Shopify CDN import and *both* Shopify basket checkout requests passed `redirect: "error"`, which throws a TypeError **before any request leaves the Worker**. This explains 35 `expansion_failed` first-SKU states + 35 `seed_source_pending` second-SKU claims, and why the existing approved Golden Retriever cart displayed "We could not confirm checkout".

This is documented directly in Cloudflare Workers Request API. Keep no-redirect safety by using `redirect: "manual"` and explicitly rejecting 3xx, opaqueredirect and redirected responses. Do not use auto-follow with private tokens.

## Patch
- `src/shop-expansion.js`: artwork fetch no longer throws immediately; explicitly rejects redirection, preserves source URL allowlist and SHA-256 exact-byte check. Existing failed v2 records are **not** automatically discarded or retried.
- `src/basket-checkout.js`: both cartCreate and read-only cart refresh now use workerd-supported manual redirect mode with no redirect allowed; retains atomic durable claims, all identity/price/proof checks and fail-closed unknown outcomes.
- `src/social.js`: X source-image fetch uses the same safe manual redirect policy (unrelated compatibility bug).
- Tests assert manual mode, reject 302 responses, fail closed without making Printful tasks or public sale changes. No external provider calls in test suite.

## Customer cart recovery
A previous checkout attempt started under the broken `redirect: "error"` runtime can have a permanent saved `pending` claim. This patch **does not delete or assume that claim is safe to retry**. Reconcile it in a separately reviewed recovery migration, or let the customer start a separate fresh saved cart as explicitly allowed in the current UI. Do not silently create duplicate payment sessions.

## Commerce state during repair
35 unique premade Christmas mug products (each with 11 oz and 15 oz variants), names, $24.99/$29.99 prices, unique `RMCM-001..035` SKU pairs and 70 correct source media attachments have been created in Shopify. All 35 currently remain **DRAFT**, because exact Printful proofs, freeze and active checkout have not been independently verified. The visible 35-image shop gallery is unaffected; only original Golden Retriever Winter Lights 11/15oz are live.

## Release
- Fix PR / test / Cloudflare deployment and production smoke to be recorded only after completed.
- Preview queue is still paused (PREMADE_EXPANSION_ENABLED=false). Do **not** enable 70 automatic retries until the original v2 failure claims are safely reconciled and the first provider preview is examined.
