# Original photo shopping and outage guidance

Baseline 0073d2deb84a320f7145e6cea4d737d0706004a5 (main PR87). Owner requests prominent own-photo merchandise path and clear outage guidance; also asks whether multi-product checkout exists.

Added permanent branded callout directly below hero with Use My Own Photo, Browse Products and saved-Recast links. Existing chooser switches the original form and scrolls to it; consent/Turnstile/moderation/upload remain unchanged. New pure notice helper distinguishes operational total/HQ/Standard outage from quota exhaustion, unknown state and shared local-service failure. Notices clear after readiness recovery. No promise of recovery timing or guaranteed checkout health. App/cache revision updated.

Files: public/index.html, app.js, simple-creator-v115.js, new photo-shopping.js/css; tests/photo-shopping.test.mjs and cache assertion in render-wait-ui.test.mjs.

Validation: initial 595-test run had 594 pass and one stale app-cache assertion failure. Updated that assertion; focused 5 tests passed. Worker dry-run passed. Full hosted checks and production deployment pending. No paid renders, orders, alert sends, provider/model/configuration or fulfillment changes.

Current checkout source src/entry.js creates /cart/variant:1 with one artwork/property bundle. No public add-to-cart or multi-product accumulation exists. Do not claim multi-product shopping is implemented. Christmas follow-up: build basket with independently approved designs per line, quantity/remove/continue-shopping, safe line attribution and duplicate-proof fulfillment tests before enabling. Existing original-photo route has separate 10/network/UTC-day upload limit plus shared moderation/storage/image dependencies. Add these to capacity controls; no limits altered this session.

Rollback: revert presentation change; original photo and fulfillment behavior preserved. Final commit/release evidence to be appended after CI.
