# RM-050.2 — Mug band composition, landing reference match, Printful connection evidence — 2026-10-06

## Baseline
Started from production main f48193635df71444416b499452ac011dfbafb061 (RM-050.1). This already includes the RecastMeAi.com canonical domain, RM-050 High Quality-first policy, purchase credits, owner controls, legacy private-link compatibility and simplified product setup. Do not roll those back.

## Owner feedback
- Mug two-sided positions are fundamentally correct, but each artwork panel should touch the top and bottom of the printable color band.
- Exposed mug-band color should continue the artwork's edge/background colors rather than read as a flat black rectangle.
- Current mobile landing (owner screenshot Pic 4) should be tuned to the previously approved reference (Pic 5). Preserve the newly approved Recast Me Ai orbit logo even though the older visual reference used a prior header mark.
- Owner still does not see the test order in Printful and showed Shopify General > Order processing set to “Don’t fulfill any of the order’s line items automatically.”

## Changes
- src/commerce-store.js: two-sided/single mug/tumbler panels now use full-height cover slots (top=0, height=entire print band). The exposed band is a heavily blurred/saturated/gamma-adjusted cover of the artwork with a small dark shade, so color follows the artwork instead of a flat black background. The same composeProductLayout path is used for protected mockup source and clean final-print preparation, so preview and print use the same layout logic.
- public/index.html / launch-v50.css: restore the Jack Russell source used in the approved reference (the prior RM-050.1 dog-original change was a misread of “mug photo”). Taller mobile stage, slightly larger product, narrower lede and spacing shifts move the actual Safari layout toward the approved reference while preserving the current orbit logo. Build marker RM-050.2.
- scripts/launch-audit.cjs: production audit expects RM-050.2.
- tests: focused regressions for full-height mug slots, ambient artwork-derived band, Jack Russell sequence and mobile stage proportions.

## Printful / Shopify evidence
Current production read-only launch audit job 112502143267 on RecastMeAi.com reported /api/printful-health with secretConfigured=true, storeScopeConfigured=true and providerReachable=true. This verifies the Recast Worker can authenticate to and reach Printful at the configured store scope; it does not prove an individual Shopify order was imported or produced.

Recast's fulfillment path is custom: paid Shopify orders are read by Recast, Recast prepares the approved print file, creates a Printful draft through the Printful Orders API, and only then confirms it for production when authorized. Because of that architecture, do NOT switch Shopify's global order-processing option to automatic fulfillment merely to make an order appear in Printful; doing so can create a separate native Shopify→Printful fulfillment path and risks bypassing/duplicating Recast's design-proof flow. The current manual Shopify setting is intentionally safer for Recast.

For connection checking, /api/printful-health is safe/read-only. In owner admin, “Check product connection” is also safe. “Sync paid Shopify orders” can advance authorized jobs, and AUTO_PRINT_PREAPPROVED_ENABLED is currently active, so do not use Sync as a harmless connection test while print layout is being changed.

## Validation / safety
No live render, purchase, refund, Printful order confirmation, production submission or X post is authorized by this change. PR validation must run mocked Node tests, Wrangler dry-run and mocked browser checks. Main launch audit after merge remains read-only.

## Rollback
Revert only the RM-050.2 commit on top of the then-current main. Do not reset to RM-050.1 or earlier because that would also remove later policy/domain/owner-control work.
