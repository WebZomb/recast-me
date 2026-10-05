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


## Live follow-up
Owner opened production `/api/health` after the diagnostic deployment. It returned `ok:true`, `printfulSecretConfigured:true`, `privateArtworkStorage:true`, `shopifyConfigured:true`, and Worker version metadata ID `27e80e63-142e-42b1-a1f6-c55fa6be7b85`. This proves the currently serving version can see the Printful secret; it falsifies the simple “secret missing from current production” hypothesis.

Because the earlier mockup UI received the exact backend message that is emitted only when `env.PRINTFUL_API_TOKEN` is falsy, the remaining leading hypothesis is version/deployment drift at the time of that request (or a different serving version/origin), not a missing dashboard token. A new read-only provider probe was added at commit `836d2c7280a0a5dc539859d6f0ad888251254219`: `/api/printful-health` uses the same scoped Printful helper and mug printfiles endpoint used before mockup creation, but returns only safe booleans/status/version metadata. It does not create a mockup or order and does not expose credentials or provider payloads.

No token rotation, Printful write, order, AI render, payment, or physical production occurred.


## Mockup-route hardening after provider health passed
Owner live screenshot of `/api/printful-health` returned `ok:true`, `secretConfigured:true`, `storeScopeConfigured:true`, `providerReachable:true` on Worker version `0387f277-64f4-4b9e-8255-0966a0cdff0f`. This verifies the same scoped Printful helper can read the mug printfiles endpoint from production. Therefore the token, store scope, and current provider connection are healthy.

Implemented:
- `283457648f542bb2d395c71f9d7f4f949b95ff0d`: classify an absent runtime binding as `printful_binding_missing`; add safe stage + Worker-version diagnostics to mockup-create failures. No credentials or customer tokens are returned.
- `195b9eb39ed38d98201485d18e2a5ea07c6b3d25`: browser retries exactly once only for the explicit 503 missing-binding failure. This is safe against duplicate Printful mockup tasks because the backend throws that error before any provider task submission. Other failures are not automatically retried; their stage/version is shown inline.
- `e0d9cf5523078cf544e8465fe89b04db0b7cfcd5`: bump checkout module cache key to 225 so mobile Safari receives the new retry/diagnostic logic.

Source review after writes confirmed the intended blocks are present. Full Node suite/Worker bundle were not independently executed in this turn because no authenticated Cloudflare/online desktop test environment was available; do not claim those tests passed. No new Printful mockup, order, payment, AI render or physical production was submitted by the assistant.
