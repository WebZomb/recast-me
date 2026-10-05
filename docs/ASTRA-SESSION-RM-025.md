# RM-025 — activate the mug for owner testing

2026-10-05 UTC (Oct 4 Eastern). Owner explicitly approved the Shopify connection and making only the mug available for test purchase, and asked whether final products contain watermarks. Baseline remote main 2b12efa8659b2d4ecb82692f67e27dfdab6fa7be, local e606981.

Official CLI global installation attempted as authorized; failed EACCES creating the runtime bin symlink. No CLI authentication or scope request occurred. Shopify direct connector became available this turn and was used instead; store identity verified as b2wnfu-7g.myshopify.com. No credentials read or copied.

Connector found Custom Recast Mug product 10315217469684 with variants 50521687654644 (11 oz / RECAST-MUG-11OZ / $24.99) and 50521687687412 (15 oz / RECAST-MUG-15OZ / $29.99). Changed only this product from DRAFT to ACTIVE using update_product, verified response and production Shop Mug button. No prices or other products changed. PublishedAt returned 2026-10-05T03:42:17Z, onlineStoreUrl null. Both variants inventory tracking false; zero reported quantity is not tracked stock and was not changed.

Live production Shop Mug click opened Shopify but stopped at Opening soon/password page. Store connector reports trial plan. Payment-page acceptance not verified. Shopify official free-trial guidance says choose a paid plan to activate checkout; subscription selection/payment and private-mode change were not authorized or performed. Next owner step is plan selection/store access setup; keep broader catalog draft and automated printing off. Do not claim checkout is fully ready.

Watermark answer verified from source: finishApprovedDesign uses the private original snapshot, checks sourceHash, interpolates to JPEG without watermark draw, and paid approved order sends this clean finalKey through protected order-print route. Unpaid mockups remain watermarked. This is code verification, not a real paid order or physical sample result. Existing RM024 tests cover clean/protected separation; no new code tests run this configuration-only turn.

No AI, new mockup, physical Printful order, payment, subscription, email or social action submitted. Rollback: set mug product 10315217469684 back to DRAFT. Preserve artwork and private recovery links; never commit customer tokens.
