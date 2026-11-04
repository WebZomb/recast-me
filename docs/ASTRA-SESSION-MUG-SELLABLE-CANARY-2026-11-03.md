# Recast Me AI — safe v3 Printful premade mug canary, November 3, 2026

Production state before this branch: 35 distinct Christmas pet mug designs, 35 Shopify DRAFT products, 70 size variants and correct marketing/original art attached. The original Golden Retriever Winter Lights is the sole already-approved live product (11 oz and 15 oz) with working frozen approval, under the existing cart. No new image concepts need generation.

Root cause fixed in [PR #136](https://github.com/WebZomb/recast-me/pull/136): Cloudflare Worker Request rejects redirect:'error' before dispatch. Replace with manual redirect and explicit 3xx denial in both source and checkout, without relaxing token/security rules.

## Scope of this canary
- Separate versioned R2 staging keys `shop/preparation/v3` leave the failed v2 claims, errors and provider evidence untouched.
- Permit `PREMADE_EXPANSION_ENABLED=true` but set `PREMADE_EXPANSION_CANARY_COUNT=1`; only 11 oz and 15 oz sizes for the **first** Golden Retriever Christmas Village illustration are eligible for one-time source import and mockup preview. All other 34 designs and 68 size variants remain untouched.
- Shopify Files' .png URLs can contain JPEG bytes after optimization. Always check expected SHA-256 of delivered bytes, sniff true PNG/JPEG magic, use true MIME for Cloudflare Images and required image moderation, and save master with the matching extension/content-type. Never skip the original artwork rights check, moderation, source pin or dimensions.
- Existing Printful mockup task persisted before polling. Do not recreate a supplier task when the response or task state is uncertain.
- The explicit `REVIEWED_EXPANSION_PROOFS` allowlist is deliberately **empty**. No newly staged proof is automatically approved, no checkout activated, no Printful orders submitted. Inspect exact 11/15 oz print placement and proof signatures before any release. Existing approved Golden Winter Lights stays intact.
- Any canary error marks that SKU as `needs_review`. Do **not** blindly delete retry locks or restart all 70 tasks.

## Test/deploy
- Source MIME and canary limits have targeted offline tests. Full Node/Cloudflare browser validations must pass. Guarded deployment and public `/api/shop/expansion` read-only audit must show v3, canaryDesigns 1, and at most two newly affected variants.
- If canary is blocked, pause PREMADE_EXPANSION_ENABLED and inspect only sanitized category; preserve claims and do not publish incomplete products.
- If canary reaches real `ready_for_review`, assess the actual saved Printful 11/15 oz proofs, then separately authorize signatures and expand in small batches.
- Rollback: disable canary flag, redeploy; no new marketplace/products/tokens modified and no old v2 records erased.
