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

## Verified production release — November 1
PR123 merged as 6b0ac0f0d7798d582b715b7920c89879ec5ba59d, tested head298e4cc44bb0512c1f8d08f154ddb0428de94bce. Security41341183597 and customer/browser41341183634 PASS, including actual local Worker 404/known-route/API/proof/canonical/private exclusion checks and 320/393/1280 layout assertions. 393px 404 screenshot inspected: clean brand, readable heading and 48px navigation buttons without overflow. Guarded production deployment41341743945 and read-only production smoke PASS. Worker c4050500-18e6-49e2-a955-c8aa3dbbbb25. Independent live GETs confirm missing route404 with branded page; Cat Gifts sharing image; extensionless Christmas/Specials canonicals; Shop remains200 with noindex. No checkout or supplier writes in this session.

Live preparation and public catalog now show TWO published/verified Golden Retriever Winter Lights mugs (11oz/15oz), with Printful-approved matching artwork revisions. Prior unified-shop session records actual supplier-angle visual review. This supersedes the empty-catalog historical assumption; full premade buyer checkout and broad selection remain unverified. Do not remove noindex simply because two offers are published. Deferred Search Console reports, HTTPS edge enforcement, field CWV and App Store submission remain open; keep launch check active.
