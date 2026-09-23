# Recast Me

Recast Me is a Cloudflare Workers MVP for AI photo transformations and personalized merchandise.

## Live MVP capabilities
- Cloudflare Workers AI binding (`AI`)
- FLUX.2 Klein 4B image editing/generation
- Mobile-first Recast Me storefront
- Private photo upload flow
- Client-side image preparation before AI processing
- Watermarked preview
- Stronger identity-preservation prompting
- Good-will request guardrails
- Printful connection health check through `PRINTFUL_API_TOKEN`
- Private R2 request/artwork persistence through `ARTWORK`

## Cloudflare resources
The project expects these Worker resources:
- Workers AI binding: `AI`
- Secret: `PRINTFUL_API_TOKEN`
- R2 bucket binding: `ARTWORK` -> bucket `recast-me-artwork`

## Privacy model
Prepared source photos, preview artwork, and request metadata are stored in a private R2 bucket. They are not publicly addressable. Request retrieval requires a long random access token that is returned only to the customer's browser.

Configure an R2 lifecycle/deletion policy before public launch so customer uploads are not retained indefinitely.

## Checkout status
Checkout remains intentionally disabled until Shopify order sync and high-resolution final-generation/fulfillment automation are connected. This prevents paid orders from being accepted before the workflow can reliably fulfill them.

## Next build phase
1. Verify private R2 persistence.
2. Create/install a Shopify Dev Dashboard app for order synchronization.
3. Enable Shopify cart permalinks with Artwork ID line-item properties.
4. Generate paid high-resolution finals after confirmed payment.
5. Map exact Printful catalog variants and submit fulfillment automatically.
6. Add X mention ingestion/reply workflow.
7. Finalize policies and run a complete test order.
