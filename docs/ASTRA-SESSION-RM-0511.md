# RM-051.1 — Product gallery and Printful preview polish — 2026-10-06

## Baseline
Based on current main after RM-051.0 hero work. Owner supplied a full mobile pass of current merchandise previews: Hoodie, T-Shirt, Framed Poster, Blanket, Canvas, Poster, Tumbler, Magnet 3-Pack and Coaster 4-Pack.

## Owner-observed issues
- Apparel mockup controls render as giant stacked buttons and repeat labels (Front twice, Back twice).
- Several product previews waste a large amount of white space and the success state is a full-width disabled gradient block.
- Hoodie/T-Shirt artwork reads like a large square pasted onto black fabric.
- Tumbler preview exposes a technical Printful catalog error and Worker version to the customer: print dimensions unavailable.
- Flat products are functional but the overall catalog needs a more premium, consistent retail presentation.

## Changes
- public/checkout.js
  - Add apparel-specific best-fit defaults: Hoodie fit/dark/center/85%; T-Shirt fit/dark/center/82%. This preserves the full customer image while blending the unused print area into the black garment instead of a large ambient rectangle.
  - Normalize mockup labels to compact Front/Back/Left/Right/3D/Detail names.
  - Deduplicate repeated Printful view labels and cap the storefront selector to four useful views.
  - Replace giant view buttons with mockup-view-chip hooks.
  - Real mockup ready state becomes 'Preview ready ✓'.
  - Public errors no longer expose internal Stage or Worker version IDs; technical detail is console-only and customer copy confirms the Recast is saved.
- public/product-polish-v53.css
  - One consistent premium product-card system: tighter card spacing, controlled media heights, smaller flat-product preview panels, compact swipeable view chips, compact ready badge, clearer body spacing and CTA hierarchy.
  - Continue to final review remains the main action; Edit design remains secondary.
- src/commerce-store.js + src/workflow.js
  - Coerce Printful printfile width/height and source dimensions through Number() before validation. Printful catalog payloads that encode numeric dimensions as strings no longer falsely trigger print_area_missing. This specifically addresses the owner-observed Tumbler failure without hardcoding a new placement or bypassing Printful validation.
- Build marker RM-051.1; product CSS cache v1.

## Safety / non-changes
No product SKU, Printful product/variant ID, retail price, quantity, Shopify product, production order, approved artwork, fulfillment state, render model, customer credit, domain, or admin policy is changed. The tumbler mapping remains the currently mapped Tapered Stainless Steel Tumbler 20 oz; only numeric catalog parsing is made tolerant.

## Current Printful catalog research for future additions
Current Printful pages were checked. Strong Recast candidates:
1. Kiss-cut sticker — low-cost, no minimum; best next clean end-to-end test product.
2. Phone case — broad current iPhone/Samsung support and a natural full-art canvas.
3. Pillow — especially pets/couples; all-over and custom-shaped options.
4. Notebook/journal — strong gift product with full-cover artwork.
5. Pet Bandana Collar — especially aligned with Recast's pet-first funnel.
Secondary later additions: puzzle and tote bag.
Do not publish new Shopify/Printful products until exact current variant IDs, print placements, US availability, shipping, margins and mockup behavior are mapped/tested.

## Validation
Require complete mocked Node suite, Wrangler dry-run and mocked browser policy checks before merge. After production deployment, re-test one existing artwork on Hoodie/T-Shirt and Tumbler. Tumbler success is not claimed until a live Printful mockup completes; this code fixes a concrete numeric-type bug but does not speculate about provider catalog state.

## Rollback
Revert only RM-051.1 on then-current main. Preserve all RM-050.x/RM-051.0 commerce, recovery, hero and fulfillment work.
