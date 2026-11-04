# Christmas Village Golden Retriever 11 oz / 15 oz — Printful proof review

Owner authorized making the finished Christmas pet mug catalog buyable and visually approved the selected Christmas village artwork. The production supplier preview rollout first ran with bounded v3 canary count 1 in commit `0bf5360aeba7f403f0f3e163fb37c773e8310bd8`.

## Live provider evidence
- `GET /api/shop/expansion` on November 3 (US Eastern) returned both `village-golden-retriever-mug-11oz` and `village-golden-retriever-mug-15oz` in **ready_for_review**, not an invented local placeholder. The Printful API produced three saved watermark-labeled approval views for each: handle-left, center front, and 3D handle-right.
- The 11 oz proof was visually inspected through the live `/proof/{token}` supplier-approved preview route. Handle-left and 3D views show the Golden Retriever Santa hat, red snowflake scarf, snowy village scene and the correct print on the glossy ceramic mug. The straight-on/front view spans two images, appropriate to this two-sided layout; it is intentionally **not** chosen as the primary storefront view.
- The 15 oz supplier proof was separately inspected through the exact live 15 oz approval route. Both handle-left and 3D angles show the same requested scene on the taller size, without face cropping or blank media.
- Both reference `RC-SHOP-GOLDEN-RETRIEVER-V1`, design version 13, two-sided layout, center position, scale 110%, close spacing, and the expected Printful 11/15 oz SKUs. The provider preview watermark is visible **only in preview images**. The production print files are generated from the separately stored frozen source.
- Provider signature for 11oz: `b114d98c685bd48caa8d0cedd9a890714fc4936273b1a4d85d75e9c36cc5669b`.
- Provider signature for 15oz: `ef15ee055e30aeb1f121cec08a1e7200aed283f6d7e17985f51b56b32661049d`.

## Publication
- Add **only** these two source-verified signatures to `REVIEWED_EXPANSION_PROOFS`. Leave all 68 other size variants unapproved and Shopify dedicated premade products in DRAFT until individually reviewed.
- On the next scheduled supplier review pass, `publishReviewed` checks the exact immutable source/proof/printfile/placement signature, resolves approved product identity against the live Shopify mug sizes, and appends verified offers to `shop/catalog/v1.json`. No order/charge is created by publication.
- The customer sees the new Christmas Village Golden Retriever with real Add to Cart and 11/15 oz size choices in the same unified Recast shop after a successful backend publish. The older Golden Retriever Winter Lights design remains separate and unchanged.
- Keep `PREMADE_EXPANSION_CANARY_COUNT=1` until this verified publication is observed. The other 34 designs require their first Printful approval cycle.
- If the publication check fails, preserve the original proof and stop; never fabricate an offer or bypass the source/approval records.

## Release
Automated checks, guarded Cloudflare deployment, actual public shop catalog count and live cart smoke must be confirmed before declaring it purchasable.
