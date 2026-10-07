# RM-050.8 — exact mobile landing hero match — 2026-10-06

## Baseline
Started from main 674715ba2405f570eb480210841222cca2ddda47 after RM-050.7 inspected-draft release work. This change is presentation-only and must preserve all commerce, Printful, render, owner-control and recovery behavior.

## Owner visual target
Owner supplied two same-width mobile screenshots and explicitly said Pic 1 is current production while Pic 2 is the exact target. Current screenshot was materially taller: the 01/02 cards were pushed far below the mug and the bottom tagline sat much lower. Target uses larger side gutters for the copy, a shorter showcase stage, 01/02 aligned beside the mug, both arrows visible, a larger/right-centered mug/platform, and the tagline higher within the hero.

## Changes
- Add public/hero-target-v51.css as the final hero-only cascade layer.
- Narrow mobile copy column to ~7.5vw gutters, add a little top breathing room, tighten headline/paragraph/action spacing, and keep the same words/CTA semantics.
- Keep the three trust chips in one row with target-like proportions.
- Break the live showcase back to full viewport width while reducing its aspect height from RM-050.2's over-tall composition to ~1.055.
- Position 01/02 from the top of the stage (16.5%) rather than from a large bottom offset; this is the core fix that moves them beside the mug like Pic 2.
- Keep the Jack Russell source, neon-city Recast and existing mug cutout. Increase product prominence slightly, keep both arrows above product overlap, and align product label/tagline to the target.
- Preserve the newly approved Recast Me Ai orbit logo even though the older visual reference predated that header art.
- Homepage marker becomes RM-050.8; launch audit updated accordingly.

## Non-changes
No product price/SKU, Shopify order state, Printful order, artwork, AI model, customer credit, domain, admin, fulfillment, scheduled task or production logic changes.

## Validation
New regressions verify the final CSS layer is loaded, target mobile geometry is present, and the three approved hero assets plus current orbit logo remain. Full repository tests, Wrangler dry-run and mocked browser policy checks are required before merge. Production Cloudflare build and public browser audit must be checked after merge.

## Rollback
Revert only RM-050.8 on top of then-current main. Do not reset any RM-050.x commerce or fulfillment work.
