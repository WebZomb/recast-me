# RM-050 — RecastMeAi.com migration and flow polish — 2026-10-06

## Owner feedback
Owner confirmed recastmeai.com works in Safari. Requested: move public-facing site links off the old workers.dev hostname; fix Continue a saved Recast; remove the redundant Recommended setup presentation; keep the best product setup automatic; move a smaller Edit design control below Continue to final review; replace the visually inconsistent neon mug catalog example; and bring the opening closer to the previously approved premium reference.

## Baseline
Started from main 1594e0b4ec9cc883bdd2f5efc7d152418c31c44f (RM-049.5). Do not reset older commerce/Printful/security work.

## Changes
- Production PUBLIC_APP_URL and LIVE_APP_URL -> https://recastmeai.com. Preview PUBLIC_APP_URL also follows canonical domain; existing Worker/preview host routing remains enabled externally for compatibility.
- launch audit now targets the canonical domain and expects RM-050.0.
- private-link parser explicitly trusts recastmeai.com/www plus legacy workers.dev Recast hosts, so an old saved full private link can be pasted on the new site. Access token is still required; Artwork ID alone intentionally cannot restore private art.
- Product cards silently apply existing per-product presets. Removed the Recommended setup row and Recommended wording from the preview button. Compact Edit design appears after the Continue to final review action in card markup.
- Static Mug merchandising uses /assets/product-mug-v16.webp like the other catalog examples. The hero's dominant neon product presentation remains intentionally separate.
- Hero source/process source switched from the backyard jack-russell-source-v18 image to the existing dog-original-v17 asset for a more cohesive visual sequence. RM-050 CSS tightens the mobile opening without replacing the approved cinematic background.
- No AI provider, render allowance, product price, SKU, Printful fulfillment, order sync or customer artwork changes.

## Validation
One-shot preparation workflow must run full npm test and Wrangler dry-run before merge. Production browser audit must pass on recastmeai.com after merge. No live render or purchase should be performed by automated validation.

## Limits / follow-up
www.recastmeai.com requires a separate Cloudflare route/redirect if the owner wants it reachable; repository code cannot prove that dashboard route exists. Old workers.dev should remain reachable during transition so previously issued private/order links are not stranded. Full private links include both Artwork ID and secret key; an Artwork ID alone is insufficient by design.
