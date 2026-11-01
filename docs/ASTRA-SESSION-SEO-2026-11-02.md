# SEO launch checks — November 1, 2026

Filename retained as the stable reference used by the launch-check task. Baseline main c8b05414d44cbb4635ff72a6dc28c45be67bdada.

## Audit and bounded implementation
Live sitemap's 13 pages returned 200, with titles, descriptions, canonicals and one H1 each. No missing img alt attributes in initial HTML. Sitemap and robots available. Homepage links to gift guides. Specials and Christmas .html URLs redirect to extensionless URLs but canonicals/sitemap used .html: corrected metadata and sitemap. Added approved orbital logo social previews to Cat Gifts, Guide, Support and Privacy. Private artwork/order/admin noindex is preserved. Premade Shop remains explicitly a preview and noindex; do not enable indexing before supplier proofs, sellable catalog and checkout acceptance.

Unknown URL returned 200 homepage. Prepared Cloudflare 404-page asset handling and branded accessible 404 with home/Christmas/support destinations. Existing API/proof worker-first routing retained. Official Cloudflare documentation confirms this setting; real route regression is required before merging. App uses static HTML and hash-based creator/private links, not a history-based client router.

## Evidence and release state
799 Node tests PASS; Worker bundle dry-run PASS; git diff --check PASS. Added hosted local-Worker routing checks for real 404 responses, known pages, API/proof behavior, canonical redirects, shop noindex and 320/393/1280 phone/desktop 404 layouts. Hosted execution pending. Local Wrangler dev could not start: uv_interface_addresses Unknown system error 1. This is not live routing verification. No deployment claimed. Hosted browser/route checks must pass before merge, especially missing route 404, existing extensionless and .html pages, API/proof paths and hash-based creator links. No paid actions, provider renders, orders or legal agreements.

## Deferred gates
- Shop: verified Printful mockups and exact production files, available products, mixed cart/checkout/fulfillment acceptance before removing noindex and adding canonical/sitemap.
- HTTPS: HTTPS live works; HTTP probe did not establish redirect; verify at edge with authenticated configuration access, preserve webhook semantics.
- Search Console: historical Oct19 evidence confirms verified property and processed sitemap; current indexing, latest sitemap processing and CWV unverified. Public verification tag is not current report access.
- Mobile: responsive source exists; measure actual layout/performance and field CWV, not just source inspection. Do not call image WebP usage a passing performance score.
- Backlinks: permission-based relevant outreach remains unverified; no paid links or unsolicited bulk messages.
- App Store: 1.1 draft has approved name Recast Me: AI Photo Gifts, subtitle Personalized Pet & Family Art and keywords. New build/review and updated account-holder legal agreement remain; never claim live or accept agreement without owner confirmation.

Rollback: revert this focused SEO PR; no storage/commerce schema changes. Daily condition check established separately; notify meaningful changes and disable only when all deferred checks are complete.
