# Recast Christmas mug launch — bounded second provider batch (November 3, 2026)

The first Golden Retriever Christmas Village supplier tasks (11oz and 15oz) completed with authentic handle-left and 3D Printful previews. Both exact source/proof/printfile/placement SHA signatures were inspected and published as verified offers under PR141; the original Winter Lights 11oz/15oz remain separately buyable. The source-pinned Shopify draft catalog contains 35 designs, 70 exact variants and 70 correct media attachments.

This phase permits **only the first four source designs** (Golden Retriever, Labrador Retriever, German Shepherd, French Bulldog Christmas Village) to enter supplier mockup preparation. It adds a per-scheduled-invocation creation cap of **four** new mockup tasks and a maximum of **12** read-only status polls. Original completion states and exact approved hashes are immutable; never create duplicate tasks.

- Only the Golden Retriever proofs are on the signed review allowlist. The other 3 designs remain **preview-only**, even after provider jobs finish.
- No new Shopify draft product is set ACTIVE by this batch; no new orders or payments are initiated.
- Keep provider errors as `needs_review` and do not auto-retry ambiguous outcomes.
- Inspect real 11oz + 15oz handle-left and 3D Printful pictures for all 3 before adding their exact review signatures. Any bad/uncertain proof remains blocked.
- After this batch is verified, increase the count in another review-controlled release to reach all 35 designs. Use the same exact source SHA, moderation, MIME, frozen print file and placement requirements.
- Source preview creation in scheduled Worker is a provider mockup request, not an order. Reusing completed frozen mockups means no regeneration per customer.
- Guarded Cloudflare deploy, final live source status and release receipts must be recorded after success. Rollback: reduce `PREMADE_EXPANSION_CANARY_COUNT` back to 1 and set batch size 2, redeploy; existing reviewed proofs and shop orders remain unchanged.
