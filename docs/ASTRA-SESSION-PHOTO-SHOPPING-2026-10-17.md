# Original photo shopping and outage guidance

Baseline 0073d2deb84a320f7145e6cea4d737d0706004a5 (main PR87). Owner requests prominent own-photo merchandise path and clear outage guidance; also asks whether multi-product checkout exists.

Added permanent branded callout directly below hero with Use My Own Photo, Browse Products and saved-Recast links. Existing chooser switches the original form and scrolls to it; consent/Turnstile/moderation/upload remain unchanged. New pure notice helper distinguishes operational total/HQ/Standard outage from quota exhaustion, unknown state and shared local-service failure. Notices clear after readiness recovery. No promise of recovery timing or guaranteed checkout health. App/cache revision updated.

Files: public/index.html, app.js, simple-creator-v115.js, new photo-shopping.js/css; tests/photo-shopping.test.mjs and cache assertion in render-wait-ui.test.mjs.

Validation: initial 595-test run had 594 pass and one stale app-cache assertion failure. Updated that assertion; focused 5 tests passed. Worker dry-run passed. Full hosted checks and production deployment pending. No paid renders, orders, alert sends, provider/model/configuration or fulfillment changes.

Current checkout source src/entry.js creates /cart/variant:1 with one artwork/property bundle. No public add-to-cart or multi-product accumulation exists. Do not claim multi-product shopping is implemented. Christmas follow-up: build basket with independently approved designs per line, quantity/remove/continue-shopping, safe line attribution and duplicate-proof fulfillment tests before enabling. Existing original-photo route has separate 10/network/UTC-day upload limit plus shared moderation/storage/image dependencies. Add these to capacity controls; no limits altered this session.

Rollback: revert presentation change; original photo and fulfillment behavior preserved. Final commit/release evidence to be appended after CI.


## Release receipt

PR88 merged as d10eedd83acd22ac71d2b2512e9914926a32ab78; final reviewed head ac4044ac8e821c5c9c588d00af4e40f8a597acf5. Owner requested calm, reassuring neutral wording while work was active: removed apology in total-outage banner; no speculative provider blame or restoration promise. Recurring marketing manager now records this preference and original-upload/network limit plus multi-product basket backlog.

595 tests and bundle passed in hosted validation. Security39006944162 and customer WebKit/Chromium/mobile/seasonal checks39006944161 succeeded. Added browser assertions for the new original-photo shortcut, partial-outage copy and recovery clearing. Guarded deployment39007204700 succeeded, including actual Cloudflare deployment and read-only production smoke. This supersedes pending-release statements above. Independent public launch audit39007204719 still running at receipt; not claimed passed. No physical purchase, AI generation, live outage simulation or actual new original-photo upload performed. Direct scratch curl readiness lookup returned502; deployment-host production smoke subsequently passed, so do not infer provider outage from that isolated lookup.

Production UI live at https://recastmeai.com/. Multi-item basket remains absent. Rollback runtime by reverting PR88 if needed; no supplier or data migration involved.
