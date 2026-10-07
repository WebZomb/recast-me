# RM-051.0 — Pic 2 precision hero match — 2026-10-06

Baseline main 6748d0c129474d9f184ba926e1e78b45960ded1f (RM-050.9). Owner screenshot confirms the stray literal newline is gone and the hero is close, but asks for an even tighter match to Pic 2 and identifies a rectangular blur around the mug.

Visual corrections:
- Shorten the showcase stage (aspect 1.24; 1.20 on very narrow phones) so SAME PHOTOS / BIGGER POSSIBILITIES sits visibly in the hero like Pic 2 instead of near the browser toolbar.
- Reduce the 01/02 flow width and move it left/up slightly to match the reference card scale.
- Reduce the product layer slightly and shift it left relative to RM-050.9 by using a positive right inset.
- Narrow the 03 YOUR PRODUCT capsule from 88% to 69% of the product group, matching the reference where the label is much narrower than the pedestal.
- Remove CSS drop-shadow/filter from the mug image. Feather only the outer 5% transparent boundaries in both axes using Safari/WebKit and standards masks. This targets the visible rectangular haze without changing the mug artwork, cards, background or pedestal.
- Build marker RM-051.0, hero cache v3.

No commerce, Printful, approved artwork, order, pricing, render, credits, admin, domain or fulfillment logic changes.

Validation: full repository tests, Wrangler dry-run and browser policy checks before merge; production Cloudflare build/audit after merge. Roll back only RM-051.0 atop current main.
