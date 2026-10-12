# RM150 — public discovery and X support

Owner confirms Apple Developer membership and chooses X support for now. Baseline main e12b1619f3ac84a45530753ca707ed68d1d7f5e8; deployed runtime6507f57045fbe918cb8787932b0e87b1a09d3203. Desktop Commander/signing not connected by this session; no Apple account action.

Adds a crawlable gift guide, visible homepage introduction/link, focused homepage search title/description, Organization/WebSite identity data, canonical/description for support/privacy, four-public-URL sitemap and robots discovery. Private workflow pages retain noindex; API/proof paths excluded from crawling. This is discovery guidance, not access control. No private URLs in sitemap. X support asks for a general public description and an order number only in private when requested; no unverified response-time or DM availability promise.

Search-intent review covers custom pet portraits, AI dog/cat portraits, gifts for dog/cat lovers, pet memorial photo keepsakes, personalized photo mugs/blankets/pillows/totes/shirts/hoodies/cases/wall art, family/couple gifts, birthdays, Christmas, Halloween, Mother’s/Father’s Day, Valentine’s Day and anniversaries. Uses actual supported products/styles, not competitor copy, invented volume or rankings. Christmas is a gifting occasion, not a claim of an available named Christmas style. Original-photo option is clear. No promised holiday delivery. Google Search Central SEO Starter Guide and sitemap documentation informed implementation (https://developers.google.com/search/docs/fundamentals/seo-starter-guide and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

525 Node tests PASS; diff whitespace check PASS. Added isolated WebKit/Chromium gift-guide overflow/canonical checks to existing hosted customer gate. Hosted checks and deployment pending. No render, paid mockup, order, message send, indexing submission or automation activation. No generation/print/checkout/fulfillment source changed.

Remaining: Search Console property verification and sitemap submission need owner account connection; rankings and index inclusion not guaranteed. Existing SPA fallback may return homepage for unknown paths; left unchanged to avoid breaking legacy links, homepage canonical consolidates these but a future routing inventory should precede stricter404 behavior. Native app signing, privacy/storefront decisions and physical purchase acceptance remain separate.

Rollback: revert this small static-content release. No data migration or production-settings change.
