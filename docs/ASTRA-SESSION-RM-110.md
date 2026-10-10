# RM110 — Native Credits & Gifts (October 10, 2026)

## Owner decision and existing services
Use only existing Shopify Basic payment/catalog, Cloudflare Worker + private R2 wallet data, and GitHub source/CI; NO new provider/account or subscription. Pricing authorized:
- Refill $2.99: fresh purchaser-specific 24 hours of 3 HQ and 5 Standard, starting when activated; does not stack and never resets shared network credits.
- HQ 10 $4.99, HQ 20 $8.99, HQ 50 $19.99; no expiry.
- Standard 10 $2.99, Standard 20 $5.49, Standard 50 $11.99; no expiry.
- Self or gift mode. Admin creates support/promotional codes, optional expiration, masked audit and revocation.

## Baseline and Shopify draft catalog
GitHub baseline main 6db9aed8bce28f3b0a23c98f912027ce1597ace2. Development branch recast/rm110-credit-packs-gifts-20261010, PR #28.
Three Shopify products CREATED AS DRAFT (NOT FOR SALE) and all seven variant inventory items changed to requiresShipping=false / tracked=false with successful mutation receipts:
- Digital Reset product 15426652471540: RECAST-CREDIT-RESET-24H variant 67762889818356.
- HQ product 15426652569844: RECAST-CREDIT-HQ-10 67762890277108, HQ-20 67762890309876, HQ-50 67762890342644.
- Standard product 15426652700916: RECAST-CREDIT-STD-10 67762892144884, STD-20 67762892177652, STD-50 67762892210420.
No live checkout or charge was initiated; no new account/subscription.

## Code and safeguards
src/credit-ledger.js: private idempotent R2 grants, separately purchased HQ/Standard, personal 24-hour refill, failed-render credit restoration, hashed one-use gift codes, refund/revoke, owner audit. Codes do not appear in public repository or admin history in plaintext. 
src/credit-packs.js: Shopify native cart permalink with opaque order attribute; order sync checks PAID status, exact matching SKU, variant, qty and original wallet-bound checkout claim; refuses ambiguous unpaid/refunded/duplicate claims. Gift buyer sees code only after confirmed payment, from the same browser as checkout; self-purchases automatically apply to that wallet. Admin routes require existing admin bearer token and same-origin writes.
src/render-credits.js: integration of paid and free entitlements without resetting other customers or bypassing global AI budgets. Bought Standard can be used before exhausting free HQ. Existing order bonus, free allowances, Printful and all render engines remain unchanged.
src/workflow.js and src/order-queries.js: reconcile digital credit lines independently of physical fulfillment. Exact edited Admin GraphQL Shopify sync and verify queries were schema-validated successfully.
src/router.js: new gated customer/admin API.
public/credits.html, credits.js, credits.css: no-account gift and redemption page, balance and status, Shopify native checkout. Admin credits tab added via public/admin-credits.js, admin.js and admin.html. Main app counters and link updated.
wrangler.jsonc: CREDIT_PACKS_ENABLED=true for owner gift-code redemption, CREDIT_SALES_ENABLED=false to make checkout impossible until acceptance. Three new Shopify products remain DRAFT.

## Launch gate and limitations
Final PR security Node/browser tests, Wrangler dry-run and deployment receipts remain to be recorded. No AI inference or paid tests were performed.
NEVER publish Shopify drafts or enable CREDIT_SALES_ENABLED until the owner approves a controlled $2.99 Shopify test and the team verifies the paid order contains its cart attribute, the scheduled order sync activates the correct credit code once, self/gift retrieval works, and refunds revoke unspent credits. Fake Node/Playwright tests alone cannot establish those live behaviors.
The wallet is tied to an HttpOnly browser cookie; no new user login required. Cross-device recovery after a redeemed self-purchase remains owner-assisted using verified Shopify order details; do NOT claim invisible automatic portability. Gift codes are transferable before redemption.
Current global site-wide reserve budget $5/day and 70 calls/day still cap paid uses; larger packs may be redeemed over multiple days. Before public sales, owner should approve a revenue-aware higher cap or accurate warning. Shopify's normal transaction fees and AI/provider charges still apply even with no new subscription.
Rollback: suspend credit sales (already off), retain credit records and codes, keep DRAFT products, revert narrow code changes if necessary. Never destroy earned wallets or paid receipts.
