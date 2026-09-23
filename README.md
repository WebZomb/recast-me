# Recast Me

Recast Me is a Cloudflare Workers MVP for AI photo transformations and personalized merchandise.

## Current MVP
- Cloudflare Workers AI binding (`AI`)
- FLUX.2 Klein 4B image editing/generation
- Mobile-first Recast Me storefront
- Private photo upload flow
- Client-side resizing before AI processing
- Watermarked 512px preview
- Good-will request guardrails
- Printful connection health check through `PRINTFUL_API_TOKEN`
- Shopify catalog prepared separately

## Cloudflare
This repository deploys to the existing Cloudflare Worker named `recast-me`.

`wrangler.jsonc` configures:
- Worker name: `recast-me`
- Workers AI binding: `AI`
- Static assets from `/public`
- API routes under `/api/*`

Keep the existing Cloudflare secret `PRINTFUL_API_TOKEN` configured in the Worker dashboard.

## Important MVP limitation
Checkout is intentionally disabled until secure request/photo persistence is connected. The live AI preview can be tested first without risking paid orders that cannot be fulfilled.

## Next build phase
1. Verify live Workers AI transformations.
2. Add secure request/photo storage.
3. Turn on Shopify cart permalinks carrying Artwork ID metadata.
4. Map exact Printful catalog variants.
5. Add X mention ingestion/reply workflow.
6. Finalize policies and run a test order.
