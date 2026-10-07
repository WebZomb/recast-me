# RM-051.2 — expanded worlds and final mobile visual polish — 2026-10-06

Baseline main: `307ed5e528f7993d8cdefea92cd9e323d5d018fc` (RM-051.1).

Owner supplied `recast pics.zip` with 13 current mobile screenshots and asked to continue the launch polish. Observed screenshots cover Poster, Canvas, Blanket, Mug, Hoodie views, Framed Poster, T-Shirt views, Tumbler, Magnet 3-Pack and Coaster 4-Pack.

## Owner decisions
- Expand the creator far beyond the original small world list, but keep the page easy to use with a categorized dropdown rather than dozens of cards.
- Desired discovery areas include animation/cartoon looks, anime, sports, decades and movie/TV-like adventures.
- Keep real franchises/teams/characters from being presented as official presets. Use original descriptive categories and unbranded sports styling instead.
- Fix the clipped descender in “Recast your world,” remaining box-like mug haze, inconsistent product centering/white space, and add tasteful motion.
- Keep the site premium and alive without slowing mobile or ignoring reduced-motion preferences.
- Owner asked to stop update emails for now. This source change does not add, send or trigger application email. Personal GitHub notification preferences are outside repository source and are not claimed changed.

## Changes
- `public/app.js`: categorized world library with Featured, Animation & Art, Sports, Decades, Movies & Adventures and Seasonal groups; custom world remains available. Presets are generic/original rather than named franchises or real teams.
- `public/creation-wizard.js`: retain four visual quick picks; “Browse all worlds” moves directly to the grouped selector instead of rendering a giant wall of cards.
- `src/highquality.js`: backend allowlist/prompt definitions for the new generic worlds, with explicit no-logo/no-franchise wording where relevant. Existing IP-marker sanitization remains.
- `public/hero-target-v51.css`: preserve descenders, replace rectangular mobile mug edge feather with a radial feather, and add slow ambient glow/streak/pedestal motion with prefers-reduced-motion opt-out.
- `public/product-polish-v53.css`: tighter mobile media heights, centered premium light stage, controlled zoom for flat products with excessive provider whitespace, and subtle hover motion. Real Printful mockups remain the source of truth; no fake room mockup replaces them.
- `public/index.html`: RM-051.2 marker, cache bumps, and “All worlds” copy.
- `tests/rm0512-polish.test.mjs`: regression coverage for grouped worlds, backend allowlist, franchise-free preset names, clipping/mug/product polish.

## Scope / safety
No SKU, price, Shopify product, Printful variant mapping, order, fulfillment state, approved artwork, render-credit policy, owner limits, payment, watermark, model selection or automatic posting setting is changed. The tumbler remains the mapped Printful product. A successful live tumbler mockup still requires provider verification; code/test success alone does not prove that provider path.

## Validation plan
Run the full Node suite and Wrangler dry-run on the exact resulting commit. The existing read-only production browser audit may run after main advances; it must not purchase, generate, fulfill or post. No paid render is authorized for validation.

## Rollback
Revert only RM-051.2 on top of then-current main.

## Validation correction
First main audit run 37566173141 reached the full Node suite but failed one RM-051.1 regression because that older test hard-coded the prior CSS cache key `product-polish-v53.css?v=1`. The application behavior assertion itself was not the failure. Updated that compatibility assertion to accept v1/v2, then use a `validate:` commit so the security workflow runs the complete suite once. No application behavior changed in this correction.
