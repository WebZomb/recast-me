# Recast Me AI — Printful print-area source readiness across all non-mug products (November 4, 2026)

## Goal
Owner wants the full ready-made Christmas pet gift shop finished and published, not just category placeholders. All 17 product-family pages are already published; the same 35 owner-approved Christmas dog/cat originals (each 1254×1254 px) must be reused where quality and licensing allow. Shopify physical products are ACTIVE in the custom-product workflow, but this does **not** make each of their 35 premade Christmas designs buyable.

## Previous evidence and blockers
- Before this change, Christmas mugs: 34/35 designs (68/70 size variants) published in exact, signed supplier-proof custom-shop catalog; two Siamese size variants remain held, no uncertain supplier retry.
- Coaster source-pinned pilot: Golden Retriever Christmas Village, Shopify existing `RECAST-COASTER-SET` ($39.99 custom product), Printful product 611/variant 15662. One preview-only task completed with 2 real Printful views; `/api/shop/coaster-pilot` returns `ready_for_review` and checkout disabled. Owner's existing private Control Center **Ready-Made QA** tab shows the two real supplier pictures, protected by Admin authorization.
- The 16 other gift category pages currently display clearly labeled original-art product concepts only. They cannot be released to checkout without actual print dimensions, sufficiently detailed production files, placement-safe manufacturer proofs and immutable signed approval for each exact variant. Larger 50×60 and 60×80 blankets need genuinely higher-resolution artwork, not mere resampling of the 1254px image.

## New read-only product template scan
- `src/shop-printfile-audit.js` derives distinct non-mug Printful catalog product IDs and their SKU variants from the existing `FULFILLMENT` mapping. No made-up product/variant IDs.
- When `PREMADE_PRINTFILE_AUDIT_ENABLED=true`, the existing Cloudflare scheduled Worker performs at most **one** bounded **GET** to Printful's exact `/mockup-generator/printfiles/{productId}` per execution. Credentials are sent only to `api.printful.com` using a manual redirect policy; redirects are rejected. A durable conditional R2 claim is stored first; uncertain results are held for review rather than retried repeatedly.
- The returned Printful catalog identity must match the exact mapped product ID, variant ID, and placement. Extract native pixel width, height and DPI. Compare each to the 1254×1254 approved source without creating an image or mutating supplier data.
- Classification per mapped SKU: `higher_resolution_master_needed`, `crop_or_fit_review_needed`, `needs_template_review`, or `supplier_proof_still_required`. A source whose pixels fit the native template is **never** automatically approved or purchasable; native template dimensions alone are not a full quality check.
- R2 report namespace: `shop/preparation/printfile-audit/v1/{productId}.json`. One source-safe metadata snapshot is cached per product, avoiding repeated provider GETs in later crons. Failed or inconsistent reads are `needs_review`, with a non-sensitive code only, no source token/private supplier response.
- A public read-only `GET /api/shop/printfile-audit` returns product/variant status and supplier print-area measurements but does **not** fetch Printful or expose customer data, provider tokens, private previews, source access tokens, or purchases. POST returns 405; robots noindex.
- Private Control Center's **Ready-Made QA** page gains compact grouped read-only supplier print-area cards under the existing coaster proof review. They are fetched only when the tab is opened/refreshed, display honest source pixel sufficiency and note that all variants still require real Printful proofs. No actions to approve, buy or send production are added.

## Rollout safety
- This PR does **not** create a Printful mockup, a Shopify listing, a payment, an order, a clean print master, or a consumer-facing sale. Existing 34 published mug designs and 2 held Siamese sizes remain untouched; existing ready-to-review coaster task and real manufacturer images remain untouched.
- Source gallery revision and all stored private proof/checkout authority continue to require exact hashes and existing signed approval gates.
- Local focused tests cover native area/DPI/aspect checks, SKU mappings, disabled no-op, one GET per cron, fail-closed error state, no purchase, safe public status, owner UI no payments. Full Node/Worker dry-run, hosted security + Chrome/WebKit and guarded Cloudflare deploy are required before treating this release as live.
- Rollback: set `PREMADE_PRINTFILE_AUDIT_ENABLED=false` in guarded config and redeploy, or revert the focused PR. Retain R2 catalog snapshots (do not delete customer artwork, payment records or approved proofs).

## Next actual sellability work
1. Use the observed supplier catalog dimensions to choose smaller products whose **original** art has sufficient pixels (coasters, possibly magnets/stickers where Printful confirms). Confirm the exact Shopify variant exists and is ACTIVE.
2. Create a product-specific full-resolution clean print file with the correct placement for each exact SKU, without stretching/blurring the pet; inspect all manufacturer views and check a physical sample for new products.
3. Only after signing the immutable source artwork revision, Printful task/proof, final clean print file SHA and placement SHA, publish a verified offer through the existing premade Recast cart. Never use an AI/illustrated sales concept as a manufacturer proof.
4. Gradually repeat, respecting provider call rate limits and keeping the remaining products safely preview-only until approved.
