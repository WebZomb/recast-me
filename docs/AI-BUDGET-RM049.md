# Recast Me — RM-049.2 AI budget calculation

Date checked: 2026-10-06

This file explains the production safeguards in `wrangler.jsonc`. It is not a provider invoice guarantee; it is a conservative reservation model around each `AI.run` submission.

## Current Cloudflare price inputs
Official pricing checked:
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/flux-2-dev/

For `@cf/black-forest-labs/flux-2-dev` the current unit prices are:
- input: $0.00021 per 512×512 tile, per step
- output: $0.00041 per 512×512 tile, per step

Cloudflare also currently includes 10,000 Neurons/day before paid overage on Workers Paid. The Recast reservation deliberately does not subtract that free allocation.

## Recast dimensions and maximum reference count
From `src/highquality.js` and `public/app.js`:
- High Quality: 1024×1280, 18 steps
- Standard: 768×960, 12 steps
- customer reference images are reduced to max 500 px on the longest edge
- at most 4 reference images reach one provider call, including a resized prior Recast during refinements

A 500 px reference fits one 512×512 input tile.

## Conservative maximum per AI.run
High Quality, four references:
- input: 4 × 1 tile × 18 × $0.00021 = $0.01512
- output: ceil(1024/512) × ceil(1280/512) = 2 × 3 = 6 tiles
- output cost: 6 × 18 × $0.00041 = $0.04428
- maximum calculated model charge: $0.05940

Standard, four references:
- input: 4 × 12 × $0.00021 = $0.01008
- output: 2 × 2 × 12 × $0.00041 = $0.01968
- maximum calculated model charge: $0.02976

Production therefore reserves **7 cents per AI.run**, leaving margin above the maximum current High Quality calculation.

## Production controls
`wrangler.jsonc`:
- `AI_DAILY_CALL_LIMIT=70`
- `AI_DAILY_BUDGET_CENTS=500`
- `AI_CALL_RESERVE_CENTS=7`

The call limit is slightly stricter than the budget ledger: 70 × 7 cents = $4.90 reserved. A moderation-safe retry is another `AI.run` and consumes another call slot and another 7-cent reservation because the guard wraps the actual AI binding.

These controls bound Recast AI submissions; they do not include Shopify, Printful, Cloudflare Images/storage, taxes, or other services.

## Review trigger
Recalculate this reserve before changing:
- image model
- generation dimensions
- maximum reference-image dimensions/count
- generation steps
- Cloudflare unit pricing

Do not lower the reserve based only on average behavior. Keep the production cap conservative.
