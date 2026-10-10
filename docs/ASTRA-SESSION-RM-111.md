# RM111 — Controlled owner-paid $2.99 checkout test (2026-10-10)

## Owner direction
The owner explicitly approved performing an actual $2.99 refill test directly through Recast Me's website, rather than a separate test platform. The owner will personally complete any payment. Keep all other paid packages closed and avoid submitting a payment automatically.

## Baseline
GitHub main before these edits: `f29f3580fb7511f85f3c13e3af9187cec70cca46`. Existing Worker includes credits and gifts but sets `CREDIT_SALES_ENABLED=false`, and all Shopify credit products were DRAFT. Previously verified 430 mocked Node tests, deployment and public launch audit do not prove an actual Shopify checkout.

## Narrow implementation
- `src/credit-packs.js`: `CREDIT_TEST_CHECKOUT_ENABLED=true` allows checkout only for an authenticated existing admin, only `packId=reset`, only `mode=self`, and only while public sales remain disabled. A private R2 record permits at most three checkout **starts** per UTC day bound to the same browser's credit wallet. The normal public endpoint remains closed for all untrusted visitors and all other SKU/options. The code still grants no credits until Shopify's paid order reconciliation verifies the original wallet checkout claim, SKU and variant ID.
- For the test, change the Shopify cart permalink attribute from the underscore-prefixed private-style `_Recast Credit Claim` to the documented ordinary `Recast Credit Claim`. The paid-order reconciliation supports both names for backward compatibility. Shopify documents `attributes[name]=value` in its cart permalink checkout flow; only a real order can confirm preservation end-to-end.
- `public/credits.js`: only after the admin token has been entered in the **same browser tab**, reveal the real `OWNER TEST · Pay $2.99` button for **Daily Reset / Buy for myself**. All other pack buttons stay disabled with Coming Soon text. Claim is recorded in existing local storage and checkout redirects to Shopify with a clear real-money notice.
- `public/admin.html`: new explanatory link in the existing authenticated Credits & Gifts admin section. Owner first signs into /admin.html then opens /credits.html in the same tab; the existing cookie initializes when credits page loads. `public/admin.js`, `public/credits.html` asset versions updated.
- `wrangler.jsonc`: keeps `CREDIT_SALES_ENABLED=false`, sets distinct `CREDIT_TEST_CHECKOUT_ENABLED=true`. Shopify test item must be changed from DRAFT to ACTIVE and made available to Online Store before the controlled customer action; the other 6 Shopify credit variants must remain drafts.
- `tests/credit-packs.test.mjs`: owner/wallet/origin authorization, test mode's daily checkout-start cap, correct $2.99 variant and nonprivate Shopify attribute, no premature credits, wrong-variant/pack/gift rejection.

## Launch acceptance
No customer purchase or payment is initiated by the assistant. Do not claim this code simulates a real receipt. Owner completes the payment in Shopify, comes back to Recast /credits.html, waits for scheduled order sync or clicks authenticated admin sync, and verifies 3 HQ / 5 Standard in **the same browser**. Validate exact order attribute, PAID order status, one single issuance, correct reset period. Paid order webhook/reconciliation remains subject to existing R2 and Shopify protections. If paid order is missing its claim, hold for support instead of granting arbitrary credits.
Never use a raw direct Shopify cart permalink without a wallet-bound server-issued claim, and never expose admin token, gift code or checkout claim in chat.
Normal Shopify payment fees and taxes may apply; `$2.99` is product price, not guaranteed final total.
If purchase fails, keep all paid packages gated and return the one test SKU to DRAFT if appropriate; do not delete customer's paid order.

## Rollback and state
Before merging, run GitHub security/browser suite and Wrangler dry-run. After merging, verify exact deployment and smoke. Only then activate **the reset product** in Shopify. Do not change other product statuses, published site theme, image engines, credit budgets, or Printful. Paid pack public sales remain disabled.
