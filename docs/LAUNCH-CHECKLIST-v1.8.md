# Recast Me — remaining work after v1.8

## Completed in this package
- Jack Russell source photo and matching Game World hero transformation.
- First two world cards: the same Jack Russell in Game World and Halloween.
- Remaining six: couple, woman with pet, family, car, individual woman, couple with pet.
- Correct source photos in the upload illustration; artwork in the preview illustration.
- One merchandise catalog using large image-above-text cards, retaining artwork-specific checkout and real product previews.
- Standalone desk-frame promotion removed; framed print remains in the catalog.
- Demo images are illustrative built-in-generator examples, not a FLUX or klein benchmark. Existing merchandise examples are retained.

## 1. Install and verify the live deployment
Merge the ZIP contents into the existing repository, keeping the folders. Confirm Cloudflare deploys that commit. Check the plain Jack Russell → city transformation, eight varied cards, one catalog, and mobile controls on the actual iPhone site. This package does not deploy itself.

## 2. Validate customer rendering and control its cost
The configured models remain FLUX.2 dev (high quality) and klein 9B (quick). User reports paid billing restored renders, but this session has no authenticated provider access to benchmark them.
- Run identical reference photos/prompts through dev, klein 9B, and candidate klein 4B; compare likeness, requested costumes, failures, elapsed time, and actual cost per usable image.
- Keep the established high-quality model until comparisons justify a change.
- Implement a server-enforced visitor allowance, concurrency limits and abuse protection before promoting heavy free use. Starting target: 20 successful previews per visitor/day, configurable, with a separate controlled allocation for owner testing and X requests. Anonymous identity alone is not a reliable spending limit.
- Set an explicit overall daily spending/capacity budget and monitor failures and latency. The $5 base plan is not unlimited inference.
- Verify a timeout/retry does not lose the previous preview or generate duplicate billable jobs.

## 3. Test the full purchase and fulfillment path
Checkout, digital entitlement, mockups and fulfillment code exist, but that is not proof of a completed live purchase.
- Verify Shopify product status, price, size/color variants and every Printful SKU mapping.
- Run a controlled test purchase tied to the correct Artwork ID; verify payment confirmation, order status, clean digital access and denied unpaid access.
- Test the real Printful mockup for poster, mug and apparel before selling them.
- Configure the Cloudflare Images binding required for print finishing/social watermark processing. Check print dimensions and source quality: resizing alone does not create missing detail. Inspect an actual printed sample before describing quality as proven.
- Verify paid-order ingestion, then enable ORDER_SYNC_ENABLED after the test. It is false in the supplied configuration.
- Keep physical production approval explicit; do not auto-submit unreviewed art.
- Confirm shipping charges, taxes, refunds, customer support and customer-facing policies match actual operations.

## 4. Connect @recastmeai on X
The reply pipeline exists but X_BOT_ENABLED and X_BOT_APPROVED are false in the supplied configuration.
- Connect the account through developer API credentials with the permissions/access needed to read mentions, upload media and reply. The account automation label alone does not connect the bot.
- Verify current X automation requirements and API access/pricing before activation.
- Configure image processing and test one controlled request with an attached photo: mention → saved artwork → watermarked reply → public purchase page for that exact artwork.
- Verify missing-photo requests receive an upload path, retries do not post duplicates, and private source/clean artwork tokens never enter public links.
- Add the separate social render budget and monitoring, then activate deliberately.

## 5. Operate and measure
- Verify authenticated Control Center access and provider/error visibility.
- Configure and test retention/deletion; RETENTION_CLEANUP_ENABLED is false in the supplied configuration. Current unpaid retention setting is 30 days.
- Measure preview completion, retries, product clicks and completed purchases to decide whether more free attempts earn enough sales.
- Optional after core launch: custom domain, trend discovery/approved campaigns. TREND_SCANNER_ENABLED is currently false.

Live secrets and dashboard settings may differ from repository defaults; confirm them in the deployed environment. No live purchases, production submissions, X posts or model benchmarks were performed for this visual update.
