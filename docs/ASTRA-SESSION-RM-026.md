# RM-026 — Printful runtime binding regression diagnostics

2026-10-05 UTC. Owner reported production product-preview retry showing “Printful is not connected” even though the Printful token remains configured and a real 11 oz Printful mug mockup had succeeded earlier in RM-024.

Evidence review:
- Current source throws that exact message only when `env.PRINTFUL_API_TOKEN` is falsy in the request runtime.
- No application/config code changed after the verified successful mug mockup except documentation.
- Cloudflare documentation confirms Worker versions capture bindings and deployments may serve one or two versions; secrets are preserved across normal Wrangler deploys. This makes deployment/version binding drift or a split deployment materially more plausible than a suddenly invalid token for this exact error.
- The existing public `/api/health` route already reports only safe booleans, including `printfulSecretConfigured`, but did not identify the serving Worker version.

Changes on main:
- d6f3b7e16d6c0b73e648c289db113885018a8425: `wrangler.jsonc` now declares `PRINTFUL_API_TOKEN` as a required secret and adds Cloudflare version metadata binding `CF_VERSION_METADATA`. Future Wrangler deploys must fail rather than silently publish a version without that required Printful secret.
- d0fea159c98889530f15ff5bfe4ac5d504cf13cf: safe `/api/health` response now includes Worker version ID/timestamp alongside existing binding booleans. It does not expose token values, store credentials, customer data or admin secrets.

No Printful token was read, replaced or rotated. No mockup, order, payment, AI render, physical production, email, social action, or automation was submitted. No Cloudflare deployment was performed from this chat because no authenticated Cloudflare/online Desktop Commander session is currently available. GitHub workflow evidence for the final commit was empty at the time checked, so do not claim deployment.

Next verification: once the new main build is deployed, compare repeated `/api/health` responses while retrying the mug preview. If `printfulSecretConfigured` is false, the active Worker version lacks the secret binding. If it alternates or version IDs vary across failures/successes, investigate a split deployment. If true and stable while the mockup route still reports missing token, capture the serving version and inspect the runtime path before changing credentials.

Rollback: revert the two diagnostic/config commits if needed. No storage migration or secret mutation occurred.
