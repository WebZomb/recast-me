# Recast owner Control Center — coaster supplier proof review (November 4, 2026)

## Scope and source
- Previous live release: one source-pinned Christmas Golden Retriever Coaster 4-Pack pilot using Recast's Shopify ACTIVE coaster SKU and Printful supplier mockup generator, but **not a purchase or production approval**. Cloudflare deployed PR #156 successfully.
- Production read-only `GET /api/shop/coaster-pilot` returned `ready_for_review`, with **two authentic manufacturer product views** saved privately in R2 after a completed Printful task.
- Real pictures are deliberately protected by `GET /api/shop/coaster-pilot/qa`, requiring the existing Cloudflare owner Bearer admin secret. This API returns only saved Recast-hosted proof image URLs and source identity, no new supplier calls. Public status does not expose proof access tokens.

## Implementation
- Add a **Ready-Made QA** tab to existing `public/admin.html`, preserving Orders, Community, model/credit work and all existing admin controls.
- A separate module `public/admin-coaster-qa.js` uses the current Admin auth `api()` helper (the existing short-lived sessionStorage token stays in the current tab and is never logged), checks the public progress, and only after `ready_for_review` requests the owner-only saved supplier images.
- Display the exact pinned Golden Retriever Christmas Village *original art* from our Shopify Files next to the actual Printful source-specific views for visual comparison. Whitelist the exact Recast CDN original and same-origin `/api/mockup/image/` supplier proofs; never insert raw HTML or external image URLs.
- Include mobile responsive grid CSS (`admin-coaster-qa.css`) for a clear one-column view on phones, plus labels clarifying that these are supplier previews and **not** product approval.
- On owner lock, clear all supplier proof images from the DOM immediately. The panel cannot click "Approve", cannot start payment/production, and never writes Shopify product status.
- New Node and hosted Chromium/WebKit tests cover image source allowlist, no external proof origin, no checkout/approval buttons, refresh behavior, owner authorization errors and clearing on lock.

## Release gates / next action
After successful full tests, security, customer-policy and guarded Worker deploy, owner can open `https://recastmeai.com/admin.html`, unlock the Control Center with existing Admin credentials, and choose Ready-Made QA to inspect the saved manufacturer photos. Do **not** judge a product print-approved until the real Printful print area, file dimensions, bleed, original pet identity, supplier view and actual sample are checked. Separate immutable signed proof and one-time checkout mapping are needed to sell it.

Rollback: revert this admin-only change and redeploy. All saved Printful coaster proof tasks, existing mug sales, user carts and provider secrets remain untouched.


## Verified November 4 production release
- PR #157 merged as `cd530018313533d01b05350a6911f4c7eddeed84` after 842/842 local Node tests, successful Wrangler dry run, successful Cloudflare Workers preview build, and isolated WebKit owner-gallery tests at 393 and 1280 pixels. Hosted customer-policy browser CI remained in the browser-install step at merge time, so no hosted browser success is claimed for that PR.
- Guarded Cloudflare production deployment: GitHub Actions run `41855415002` **SUCCESS**, including offline tests/dry-run and read-only deploy smoke.
- Independent HTTP production check from authorized Recast desktop: `GET /admin.html` HTTP 200 with `data-tab="ready-made-qa"` and `/admin.js?v=coaster1`; `GET /admin-coaster-qa.js` and `/admin-coaster-qa.css` both HTTP 200; existing `/shop.html` HTTP 200. No unauthenticated owner view is available.
- Supplier status `GET /api/shop/coaster-pilot` remains **ready_for_review**, **2 real Printful supplier views**, `checkoutEnabled=false`, `automaticApproval=false`. Anonymous `GET /api/shop/coaster-pilot/qa` returns HTTP **401**. Private owner image rendering has not been checked in an authenticated production browser; owner must unlock Control Center and visually confirm the real views.
- No print file approved, no new coaster product offer, no Shopify charge/order or Printful paid production. Admin review is a read-only inspection aid.
- Rollback: revert PR #157 release commit and redeploy the Worker/assets; preserve the completed supplier task and all saved historic customer/carts.
