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


## RM-029 — remove unintended third stretched mug image
Owner live-tested the two-sided mug and showed that the previous scene-fill implementation visibly contained the intended left/right portraits plus a recognizable stretched/blurred full-size copy in the center. A browser refresh did not fix it because the completed provider mockup was valid for the same v1 design settings and was reused server-side. This was not the stale-response bug fixed in RM-028; it was the compositor itself plus an insufficient compositor-version cache key.

Fixes:
- 5594b026: non-wrap mug layouts now start from a neutral dark canvas. A maximum-blur, low-opacity artwork wash (blur 250, opacity 0.16) supplies ambient color only, then the intended portrait placement(s) are drawn. The recognizable full-size/stretch copy is removed. Two-sided now has exactly two intentional portrait placements; single has one; wrap remains one full-bleed source.
- 94ea4bb9: product design schema/compositor version bumped from v1 to v2. This changes the mockup ID and source proof hash, forcing a new Printful task instead of reusing the previously completed stretched v1 mockup.
- e8ecb57b: customer helper copy now accurately explains color-wash vs two-sided/full-wrap behavior.
- tests updated to v2; 27efda76 adds regression assertions requiring blur=250/opacity=0.16 and forbidding the old blur=22 recognizable background path.
- 6627eb17 bumps live checkout asset to checkout.js?v=229.

Validation: GitHub Actions run 37341511515 for head 6627eb1713ae27fa243cd923944fee4f002b67da completed successfully. Full mocked test suite passed and Wrangler bundle dry-run passed. No AI generation, payment, paid order, or Printful production submission was performed.


## RM-030 — two-sided spacing + approved product preview saved with the order
2026-10-05 UTC. Owner asked for closer/standard/wider spacing on two-sided mugs and for the exact rendered product mockup to stay with the order so buyers have more confidence about what they approved.

Implemented:
- product design schema bumped to v3 with spacing = close | standard | wide. Two-sided mug composition centers are now close [0.31, 0.69], standard [0.24, 0.76], and wide [0.18, 0.82]. Mockup IDs include spacing, so changing spacing always creates/reuses only the exact matching task (cb80b5cb, 50fad8b5, 58084938).
- Checkout UI adds a Two-sided spacing selector that appears only when Same image on both sides is selected. Spacing participates in the client proof signature and server proof hash (1658f6b8, 1eb23f3a).
- At checkout, the exact completed provider mockup is frozen to private R2 under an unguessable 48-hex token derived from the artwork access capability and proof. The preferred Front view is copied when available. Shopify line properties now carry customer-readable Layout / Position / Size / Spacing plus a visible Approved Preview URL; hidden properties carry the normalized design, proof hash, mockup ID, and preview token (656995da, 46c156ca).
- Added /proof/{token} and /api/approved-preview/{token}. The proof page is noindex/no-referrer, shows the exact watermarked product preview saved when checkout opened, lists its settings, explains that production uses clean private artwork, and lets the customer save the preview image (3eb42fb6, 4f87c10f, c2d04cd8).
- Fulfillment reconciliation stores approvedPreviewToken and re-verifies it against Shopify before production. New physical orders without the exact reviewed layout/proof/mockup/preview token fail closed for owner review. Customer order status now returns the frozen preview URL/image and the purchased productDesign (28b2902a, 64b515e8).
- public/order.js now shows a prominent “Saved with your order” product mockup block with the exact checkout snapshot and selected layout summary; order assets bumped to v3 (e0abe077, 391088a7, a1baf8aa, e5ebd884).
- Clean mug production compositor label advanced to mug-layout-v3-clean. The frozen customer preview remains watermarked; production still composes from clean private artwork and never from the preview image (dbbf08d2).
- Regression tests added/updated for spacing-isolated tasks, proof freezing and delivery, Shopify approved-preview metadata, customer order preview persistence, and v3 clean production. Run 37344049028 at head 8ab8795b completed successfully: full mocked test suite passed and Wrangler dry-run bundle passed.
- Customer-facing checkout asset bumped to checkout.js?v=230 (ca45d759). No payment, order, email, AI generation, or Printful production submission was made by this session.

Important limitation: the standard Shopify checkout thumbnail is still the static product/variant image. This build adds the exact approved mockup as an order line property link and as the Recast order-status product preview. Replacing Shopify’s per-line checkout thumbnail with a unique customer-generated image would require checkout/app-extension behavior beyond the current cart permalink flow and was not attempted.


## RM-031 — approved preview link routing fix
Owner live-tested Shopify checkout and confirmed the new layout/spacing metadata was present, but tapping the visible Approved Preview URL returned to the Recast main SPA/product catalog instead of the frozen product-preview page.

Root cause: Cloudflare static asset configuration used not_found_handling = single-page-application and run_worker_first only for /api/*. Therefore /proof/{token} never reached the Worker route in src/entry.js; Cloudflare Assets handled the unknown /proof path as SPA fallback and returned index.html. The proof record/image itself was valid.

Fix:
- b1771204 updates wrangler.jsonc assets.run_worker_first to ["/api/*", "/proof/*"], so approved preview pages are routed through the Worker before SPA fallback.
- b6c1c551 adds a regression test that requires /proof/* to remain in run_worker_first.
- GitHub Actions run 37348684350 for head b6c1c5510c557c68e25c18590c7c96fa2d27971e completed successfully: full mocked suite passed and Wrangler dry-run bundle passed.

No checkout settings, preview token, payment, order, AI render, or Printful production submission was changed by this routing fix.


## RM-032 — always preserve/show all product preview angles
Owner asked that the saved Approved Product Preview always show the same three product-render angles that are available on the live mug card, rather than only the single preferred/front image.

Implemented:
- b58b1ced freezes up to the first three completed provider mockup images at checkout under the approved-preview token, stores per-view metadata, and keeps a preferred primary image for backward compatibility.
- aa701c32 + d5c9abd3 add indexed approved-preview image delivery and self-healing/backfill for older approved-preview tokens by rehydrating the exact saved mockup task/images when available.
- d0e0119d + e85d3e76 change /proof/{token} to display a responsive three-angle gallery, label common views as 3D view / Handle left / Front view, and provide a save link for each angle.
- 0e7d7947 + 58007f7b + aec9cef8 expose all saved approved angles in customer order status and display them in the Recast order page “Saved with your order” section.
- c8d20ec6 adds regression coverage that the approved preview page exposes all three angles and each indexed image endpoint returns protected/watermarked bytes.
- order assets bumped to v4 at 01fecf03.
Validation: GitHub Actions run 37349794575 for head 01fecf030ef890347a2843ab1c00c9483b488b1e completed successfully. Full mocked test suite passed and Wrangler dry-run bundle passed.
No payment, order submission, AI generation, email, or Printful production submission was performed.


## RM-033 — reduce GitHub Actions email noise
Owner reported the rapid sequence of GitHub Actions failure emails was too much and not useful during active iterative edits. Cause: every connector file update creates a separate commit on main, and the CI workflow was running the full suite on every intermediate commit; temporarily broken in-between states could finish and trigger failure emails before the batch was complete.

CI policy changed:
- normal push commits still create a GitHub workflow event, but the validation job is skipped unless the commit message starts with `validate:`.
- pull-request and manual workflow_dispatch runs still execute the full validation job.
- after a build batch, use one final `validate:` commit to run the complete mocked test suite + Wrangler dry-run once.
This keeps validation available while preventing a cascade of failure notifications from half-finished connector commits.

The first workflow edit had a duplicate pull_request YAML key and produced one final transitional failure; commit 5b4e7f38 immediately corrected the workflow. Its push was correctly marked skipped, confirming intermediate pushes are now suppressed.


## RM-034 — first real paid order captured; live order sync enabled
2026-10-05 UTC. Owner completed the first real Recast purchase.

Shopify live verification:
- Order #1001 (gid://shopify/Order/7208701624564) is PAID, not a test order, UNFULFILLED, quantity 1, SKU RECAST-MUG-11OZ.
- The line item carries Artwork ID RC-MUUCF7QH-E2E541, Space Explorer / pet, Same image on both sides, Center, 110%, Standard spacing.
- Hidden proof metadata is present and coherent: normalized v3 two-sided design, proof hash, mockup ID v3-two-sided-scene-fill-center-110-standard, and approved-preview token/link.
- Shopify total is $32.99 with $24.99 merchandise subtotal; no Printful production action was performed by this verification.

Launch readiness change:
- wrangler ORDER_SYNC_ENABLED changed from false to true so the existing */10-minute scheduled workflow can reconcile paid Shopify orders into Recast automatically. Order sync only creates/updates internal jobs and Printful status; it does not confirm production.
- public /api/health now exposes only the boolean orderSyncEnabled so deployment readiness can be checked safely without admin credentials.

Production remains gated: after Recast sync, the customer/order design must be approved and the clean print file finalized before a Printful draft can be created; sending the draft to production still requires explicit SEND_TO_PRODUCTION confirmation.


## RM-035 — clarify Shopify confirmation vs. print production
Owner showed Shopify's default Thank-you page and noted it looks like the custom mug is already finished/sending. Shopify's confirmation is payment/order confirmation only; Recast still requires design approval and explicit production confirmation.

UX changes:
- future physical checkouts add visible Shopify line properties:
  - Recast Print Safeguard: Not sent to production until your Recast design is approved
  - Recast Next Step: Return to Recast Me and open Track this Recast / downloads
- the existing Approved Preview page now leads with ORDER CONFIRMED · PRINT SAFEGUARD ACTIVE and explicitly says the paid order is not sent to production yet.
- the page explains the approval step and adds a Return to Recast Me button.
- this change also improves the current #1001 Approved Preview page because the page is rendered dynamically from the saved token; no new purchase is needed.

No Printful draft or production submission was performed.


## RM-036 — one-tap post-purchase approval + immediate paid-order sync
Owner asked where to approve the paid mug and noted Shopify/Shop still makes the order look like it is already preparing/shipping.

Changes:
- Approved Preview page now has a prominent “Complete design approval →” CTA.
- The CTA routes back through the live Recast site with the exact Artwork ID. In the browser that created the Recast, client history finds the matching private access token and opens the existing private order page automatically.
- Future Shopify orders now include a visible “Complete Design Approval” URL in addition to the Approved Preview URL and print-safeguard copy.
- Approved Preview copy explicitly warns that Shopify/Shop may show an estimated arrival date before Recast approval; production remains paused until customer approval.
- Customer order-status now performs an immediate paid-order sync when no internal job exists and live order sync is enabled, so buyers do not need to wait for the 10-minute scheduled sync before the approval page appears.
- app.js cache bumped from v223 to v224.
- Regression coverage updated for the post-purchase CTA and redirect.

Security note: the one-tap CTA does not expose the private artwork access token from server storage. It relies on the private token already stored in the customer’s original Recast browser. If the approval link is opened in a different browser, Recast explains that the original browser/private Recast link is required.

No Printful draft or production submission was performed.


## RM-037 — simplified customer flow: confirm before payment, then automatic fulfillment
Owner rejected the post-purchase approval workflow as too confusing for normal customers and asked for the simple flow: choose artwork → preview product → final confirmation → pay → print, with no extra approval after purchase.

Implemented on main:
- Physical product cards now unlock to “Continue to final review” only after the exact current mockup/settings are complete.
- Added a full-screen Final Review dialog showing up to three actual product-render angles, Artwork ID, product/variant, and print settings. Customer can Change image, Edit placement, or Confirm design & checkout.
- Physical checkout-link now rejects requests unless confirmDesign=true and the exact completed mockup still matches SKU, normalized design, source proof hash, and verified Printful position.
- On confirmation, Recast freezes a clean private artwork snapshot plus exact mockup position/design/proof under an unguessable preapproval token before opening Shopify.
- Shopify line properties for new orders say “Recast Design: Confirmed before checkout” and “Payment completes your order — no extra design approval needed”; hidden metadata includes the preapproval token.
- Order reconciliation validates the preapproval token against the Shopify line item and frozen snapshot. Valid paid orders get an already-approved design record immediately rather than entering awaiting_customer_approval.
- AUTO_PRINT_PREAPPROVED_ENABLED is now true. Only orders carrying a valid pre-checkout approval are eligible for this zero-touch path. After fresh Shopify payment verification, Recast builds the clean production file, creates the Printful draft, re-verifies payment/design, and confirms production automatically. Existing legacy orders without preapproval remain on the manual approval path.
- Automatic Printful work is idempotency-claimed. If finalization/draft/confirmation fails or becomes ambiguous, the job is put into auto_print_review instead of blindly retrying billable actions.
- New approved-preview pages detect preapproved checkouts and say “You’re done. No extra design approval is needed.” Legacy orders still show their approval CTA.
- Customer order page shows “Design confirmed at checkout” for preapproved orders and no approval controls.
- Health endpoint now exposes autoPrintPreapprovedEnabled as a safe boolean.
- Regression tests updated/added for final-review gating, frozen preapproval metadata, exact print position, and a paid preapproved mug automatically reaching one Printful draft + one production confirmation.
- Checkout assets bumped to checkout.js?v=231 and merch-v07.css?v=132; order assets bumped to v5.

Safety/commerce boundary:
- This automation applies only to future physical orders that were explicitly confirmed on the Final Review screen before checkout.
- Existing order #1001 has no preapproval token and is therefore NOT automatically sent by this new path.
- Production uses the clean private snapshot and approved layout; customer-facing proof images remain watermarked.
