# RM-022 — product catalog isolation and owner diagnostics

2026-10-05 UTC. Baseline remote f8da3c9ed47731213ec00a74b7489003240778e0, local 8df7478. Owner confirmed recovered original image in Safari but catalog unavailable. Code inspection found public product loading used full Shopify status query including recent orders, creating an unnecessary order-permission dependency. This is a verified code defect, not yet verified as the live failure cause.

Product catalog now uses a dedicated read_products-only query. Checkout links share the same catalog function. Owner-only commerce-check and control-center System button report configuration booleans, live catalog connection, product count or provider error; no credential values returned. Existing product status/variant/artwork/payment/production gates unchanged. No products activated, no credentials or paid services changed.

Changed src/index.js, entry.js, preview-security.js, public/admin.js and admin.html, tests/checkout-catalog.test.mjs, and handoff notes. 149 mocked tests passed, zero failures; diff check passed. Added regression proves catalog works when order queries are denied and diagnostics deny anonymous access. Shopify toolkit schema validation passed for 2026-07, required scope read_products. No AI/image generation, mockups, payments, orders or printing initiated.

Live diagnosis pending deployment. Browser direct API navigation was blocked by client; shell request received 403/1010. Neither established Shopify root cause. Do not claim checkout fixed until live catalog succeeds. Production remains unmerged under launch gates. Rollback application changes; no storage migration.

## Live verification and configuration follow-up

Application remote 907225ea1892ba66425a92eda4f501ccbd554479 (local 3a62994) observed live as RM-022. Security CI 37254838022 passed; iOS check still in progress at observation. Authenticated commerce diagnostic returned shop=false, clientId=false, clientSecret=false and credentials not fully configured. Thus missing Preview credentials are a verified live blocker, independent of the fixed orders-query coupling.

Added previews.vars for existing known Shopify shop/client ID and exact Preview PUBLIC_APP_URL. These are non-secret values already present in production config. SHOPIFY_CLIENT_SECRET still requires owner entry in Cloudflare Preview configuration; no secret read, copied, rotated or committed. Printful also reports unconfigured; fulfillment will require separate configuration. No successful live catalog or purchase claimed. Owner's Safari screenshot now confirms exact artwork recovery.
