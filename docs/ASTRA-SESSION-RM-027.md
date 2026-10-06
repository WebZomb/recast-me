# RM-027 — launch polish, production browser audit, and fulfillment-state correction

Date: 2026-10-06

## Baseline
- Started from production/source baseline `55e53830d41316d0913cd6073b1408b6a963e217` (RM-048 clean neon mug hero).
- Owner supplied the approved mobile reference and asked for a professional final launch pass, simple flow review, and investigation of Shopify order #1001 remaining Unfulfilled.

## Owner decisions preserved
- Approved reference composition remains the visual target.
- All store products remain available.
- Do not send paid order #1001 to Printful merely because it is paid or tagged; real production remains billable and requires the preserved approved-design gate.
- Keep cumulative Astra handoff evidence-based; a commit is not a deployment and mocked tests are not provider-quality verification.

## Implemented
### Reference-based launch presentation
- Uploaded a decorative background crop derived from the owner-provided approved reference to Shopify CDN as `recast-reference-clean-background-v49.webp`. It contains no UI text or product image and is used only as a background.
- Added `public/launch-v49.css` as a final, isolated launch-polish layer rather than rewriting the older historical CSS overrides.
- Rebuilt responsive hero proportions to eliminate the large dead space shown in the owner screenshot.
- Preserved the live HTML headline, CTAs, trust chips, source photo, Recast photo, mug and labels.
- Reintroduced the glowing shelf/pedestal as scalable CSS beneath the clean mug-only cutout, avoiding the prior clipped rectangular asset.
- Tightened header sizing/CTA alignment, section-heading spacing, form touch targets and policy readability.
- Added an explicit static-store note: browse all products; create a Recast to preview your own design.
- Added `data-launch-build="RM-049"` and cache key `launch-v49.css?v=249` to make real deployment distinguishable from source commits.
- No customer image generation, purchase, refund, Printful draft or Printful production action occurred as part of the visual work.

### Read-only live audit
- Added `.github/workflows/recast-launch-audit.yml` and `scripts/launch-audit.cjs`.
- Audit deliberately blocks all non-GET browser traffic so it cannot submit images, buy products, or start production.
- It waits for the expected launch build marker before testing the real production hostname.
- It validates WebKit at 393×852 and Chromium at 320×740, 768×1024 and 1440×1000.
- It checks horizontal overflow, all 12 product cards, six homepage worlds, image decode failures, duplicate IDs, broken anchors, creator navigation, empty-photo blocking, privacy/order pages, model readiness and Printful reachability.
- Initial baseline audit identified the old mountain background, ~900px mobile hero height, false-positive lazy images, and an incorrect Printful health route. Those were corrected in the updated audit/presentation.
- Production audit run 37502407444 passed with no reported failures. It observed RM-049 live, zero horizontal overflow, 12/12 product cards, six worlds, zero broken images after decode, zero duplicate IDs, zero broken hash links, working browse/create navigation and safe empty-photo blocking.
- Live read-only provider checks in that run: model status 200/ready, render readiness 200/ready, Printful health 200 with token/store scope present and provider reachable.
- The audit does not perform a live AI render or checkout.

### Shopify / Printful fulfillment-state correction
- Live Shopify order #1001 was observed as PAID / UNFULFILLED with no Shopify fulfillment record. Its release tags are present, but there is still no evidence here that a Printful order was created.
- The Worker previously mirrored Printful states only with Shopify tags. That means a real shipped Printful order could still leave Shopify visually Unfulfilled.
- Updated `src/workflow.js` so a Printful shipment creates the matching Shopify `fulfillmentCreate` record with the exact remaining fulfillment-order line item and tracking information, then stores the Shopify fulfillment ID for idempotency.
- Shipment sync is line-specific and bounded by Shopify remaining quantity; it will not blindly fulfill unrelated order lines.
- If Shopify fulfillment creation fails, the Printful shipment record remains saved and the order receives `RECAST_SHOPIFY_FULFILLMENT_REVIEW` instead of retrying an unsafe duplicate.
- A legacy `RECAST_SEND_PRODUCTION` order with no preserved approved-design record is now explicitly held as `owner_release_review`, tagged `RECAST_PRINTFUL_REVIEW`, and does not contact Printful. This removes the previous silent no-op that made #1001 hard to diagnose.
- Auto-print/preapproved failures also surface `RECAST_PRINTFUL_REVIEW`.
- No production order was created or confirmed by these corrections.

## Source commits in this session
- `39c474ba` — read-only production/browser launch audit.
- `7264a36c` — reference-based hero and launch usability CSS.
- `769b8c49` — activate RM-049 layer and clarify browsing flow.
- `2284b85c` — hardened audit script.
- `1e07067f` — production audit validation trigger.
- `d5c9f26c` — mirror Printful shipment into Shopify fulfillment.
- `fcd4c6dc` — surface legacy release holds without starting production.
- `3abf0e1d` — tests for Shopify fulfillment tracking and legacy hold behavior.

## Validation actually observed
- Production audit 37502407444: SUCCESS.
- At that audit revision: 166 mocked tests passed and Wrangler dry-run bundled successfully.
- RM-049 was confirmed deployed on the real production hostname by build marker.
- WebKit 393 and Chromium 320/768/1440 returned HTTP 200 with no browser page errors.
- Printful health endpoint reported `ok:true`, secret configured, store scope configured, provider reachable.
- The new shipment→Shopify fulfillment code and added regression tests were committed after that production audit; the final full-suite run must be recorded after the validation commit below.

## Launch gates still open
- Turnstile public site key currently reports null. The code supports Turnstile when its secret/key are configured, but it is not active in the observed production configuration.
- Site-wide `AI_DAILY_CALL_LIMIT` is not configured.
- The approved $5/day AI budget is still not activated because a verified conservative per-call reserve has not been established; do not invent one.
- `RENDER_CREDITS_ENABLED` is not claimed active by this session.
- No live paid checkout, refund, new customer preapproval order, AI generation, or physical Printful production sample was run in this session.
- Order #1001 still requires diagnosis of its private legacy approved-design record before any billable production action. The new review tag should make that hold visible after order reconciliation if the preserved approval is missing.
- Shopify app fulfillment scopes/permissions must be confirmed by a real shipped-order test before relying on automatic Shopify fulfillment creation.
- Privacy page still states that dedicated order-support contact and final shipping/refund terms need verification before public launch.
- iOS remains a development project; TestFlight/App Store release work follows the production web/commerce freeze.

## Rollback / review
- Visual layer can be rolled back independently by removing the `launch-v49.css` link and reverting the index changes; older CSS remains intact.
- Fulfillment-sync changes are isolated in `src/workflow.js` and are idempotent using stored `shopifyFulfillmentId`; Astra should independently review the exact mutation and scopes.
- The audit workflow is read-only by design and can be retained as a regression gate after launch.


## RM-049.1 follow-up — final web polish and production revalidation
- Production build marker was advanced to `RM-049.1` so the fulfillment-aware Worker and the polished website can be distinguished from the earlier visual-only RM-049 deployment.
- Added a customer-facing `/support.html` page covering order tracking, made-to-order changes/cancellations, damaged/incorrect items, shipping, and safe support contact. No personal email/address was published.
- Updated the privacy page to link to Orders & Support and removed the stale internal launch-blocker sentence.
- Added Orders & Support to the homepage footer and private order page.
- Replaced raw/internal order state names on the customer order page with customer-friendly status text, including review/hold states.
- Updated mobile order/support spacing and touch targets.
- Live Shopify catalog check on 2026-10-06 found exactly 12 ACTIVE Recast products; live Shopify variant prices matched the values returned by the Recast catalog flow. No product was archived/drafted during this pass.
- Live Shopify #1001 recheck after RM-049.1: still PAID / UNFULFILLED, no Shopify fulfillment record, and no RECAST_PRINTFUL_* status tags. This remains evidence that the legacy order has not been proven submitted to Printful from the systems visible here. No billable production action was forced.
- Final security validation run `37505194708`: 168 tests passed, 0 failed; Wrangler dry-run bundled successfully.
- Final read-only production audit run `37505194755`: SUCCESS with `failures: []`; confirmed RM-049.1 live on production, support/privacy/order pages HTTP 200, model and render readiness HTTP 200, Printful health HTTP 200/reachable, all 12 product cards and six homepage worlds present, no decoded broken images, no duplicate IDs, no broken anchors, no horizontal overflow, and the empty-photo wizard gate working at WebKit 393px and Chromium 320/768/1440.
- Footer-only CSS follow-up `16072fb0` also received a successful production launch audit (`37505319694`).
- Additional commits after the initial RM-027 list: `54b97a15` validation/handoff update, `8cd4652b` RM-049.1 marker, `a0bbc13c` audit marker update, `381067c0` audit coverage expansion, `7e250ea8` support page, `efba1759` privacy/support link, `1016d7c4` homepage support footer link, `d95cb17a` private order support flow, `0c7baf8f` customer-friendly order statuses, `dbe1ebf9` mobile order/support styles, `56596768` final RM-049.1 validation audit, and `16072fb0` footer alignment.

### Corrected launch-gate status
- The prior note saying the privacy page still contained an unverified support/shipping launch blocker is superseded: a public Orders & Support page now exists and is linked from Privacy, the homepage, and the private order page.
- Turnstile is still not configured on production (`turnstileSiteKey: null`).
- The site-wide AI call limit / verified monetary reserve is still not configured. Do not invent a per-call cost or silently activate spending controls.
- No live AI generation, new paid checkout, refund, or physical Printful production order was created during RM-049/RM-049.1 validation.
- Shopify fulfillment mutation behavior is covered by mocked regression tests, but the connected app's live fulfillment write scope still needs confirmation on an actual shipment before that portion is considered provider-verified.
