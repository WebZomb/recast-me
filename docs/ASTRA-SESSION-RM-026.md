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


## RM-027 continuation — exact artwork recovery + product layout controls
Owner clarified Astra is unavailable until Saturday and asked this session to continue building, recover the exact saved Space Explorer dog image, fix preview-to-live transfer, and improve product composition rather than waiting.

Recovered prior evidence: the main Control Center already has owner-only saved-artwork recovery behind ADMIN_TOKEN. Earlier production work recorded that the exact Oct 4 ~17:38 Eastern seated Space Explorer dog was restored from private storage unchanged, without AI regeneration. Current file-history screenshots visually match the desired seated astronaut dog. The separate close-up Space Explorer ID RC-MUUHHS7P-CC02B2 is NOT the same pixels, so it must not be substituted.

Recovery changes:
- 79f8dce7 / 8532ece3: recovery-detail returns live host metadata and the admin card exposes “Use this exact artwork on LIVE shop” while keeping the token browser-private.
- 16567959: private Recast links can be read across only the trusted preview/live Recast workers.dev hosts; unrelated origins remain rejected.
- 3b4b8db3 + admin cache bumps b7bb1384 / 7620f60d: owner recovery accepts recoverDate in the admin URL and current admin assets are refreshed.
No ADMIN_TOKEN or artwork access token was read, copied, or committed.

Product-preview controls implemented:
- commerce-store helpers normalize layout settings and can compose a mug print surface using the saved artwork: scene-fill background, single portrait, same portrait on two sides, or full-wrap/full-bleed (265138dd, 89a92af1, 3958a477).
- workflow accepts scale/X placement settings, includes layout settings in mockup cache identity, and for scene-fill mugs sends a composed full-area protected source to Printful (37a48459, f6345699, 2272d6ad, e281dbfa, 317ee72d, 9abc81fc, 169392c4, 67d58ece, 949db419, 947ea9f8, 608ee449, 3da61483).
- preview-security composes from the exact clean private saved artwork, then flattens the unpaid watermark before Printful sees the mockup source; clean pixels remain private (7b219755, 67a9779d).
- checkout UI sends design settings, adds mug layout choices One image / Same image on both sides / Full wrap, left-center-right placement, and size slider; other physical products get bounded placement/size controls. The old real-product preview is invalidated when settings change (a3f67bd4, 68cbb931, f0fc6e40, f2b88cfd, 70aaf6cb). Styling added at 68633a6b. Current live cache keys are checkout.js?v=227, app.js?v=222, merch-v07.css?v=131 (67f2c532).
- syntax-only V8 parse checks were run on checkout.js, admin.js, recast-history.js, commerce-store.js, workflow.js and preview-security.js after the changes; all parsed successfully. This is not a full Node test suite or live Printful verification of every new layout.

Important remaining risk: these new controls are verified at the product-mockup request layer, but the selected custom layout is not yet proven end-to-end through Shopify payment into the later production-draft payload. Keep explicit customer/owner print approval and production confirmation gates in place. Do not claim custom layout is production-final until one paid/controlled order path is verified. No order, payment, AI render, Printful production order, email, or social action was submitted by this session.


## RM-028 — customer-safe product preview and checkout locking
2026-10-05 UTC. Owner reported two customer-facing failures while changing mug settings: old product previews remained visible/mixed with new settings, and Printful returned a short rate-limit error after repeated preview requests. Owner explicitly asked to fix the flow for real customer concurrency rather than rely on refresh/wait workarounds.

Implemented on main:
- product mockup tasks are now isolated by normalized design ID, so different size/layout/position requests cannot overwrite or poll the same task record;
- product mockup images and protected derivative caches are isolated by design as well;
- browser uses a per-card run nonce, clears old mockup/view state immediately, ignores stale responses, and auto-retries short Printful 429 throttles with bounded delay;
- changing variant/layout/position/size invalidates the prior proof and disables checkout until that exact configuration has a completed preview;
- physical checkout is server-verified against the exact completed mockup record and stores hidden proof/layout metadata plus customer-friendly layout labels in Shopify line properties;
- new fulfillment jobs persist the purchased layout/proof/mockup ID and fail closed if a new physical order lacks the reviewed layout;
- paid customer proof regeneration is tied to the purchased layout;
- final mug production uses the clean private artwork to rebuild the approved scene-fill/two-sided/wrap composition. It does not use the watermarked unpaid mockup source. Preview watermark/footer remains preview-only.
- live checkout asset cache bumped to checkout.js?v=228.

Validation:
- GitHub Actions run 37335507818 completed successfully at head 15e54124370d6e90f58aa0600bbb69f6744ecbf3: mocked tests passed and Wrangler bundle dry-run passed.
- New regression coverage includes design-isolated Printful mockup tasks, fresh-proof-required checkout, server proof verification, and clean composed mug production output.
- The final cache-only commit 281c120927c55c36b6be08f1526d59d7a4d35cf6 does not change application logic.

No AI render, Shopify payment, paid order, Printful production submission, email, or social post was executed by this customer-safety work. Live provider behavior for the new multi-layout flow still needs owner browser verification after deployment.
