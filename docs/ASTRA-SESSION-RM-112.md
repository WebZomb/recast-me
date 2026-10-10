# RM112–RM113 — Live Credits & Gifts site test and safe gate closure (2026-10-10)

## User request
Owner said there are not yet visitors and authorized assistant to test the existing live Recast Me site instead of requiring the owner to perform a $2.99 purchase; marketing strategy follows testing. Do not claim a real card payment occurred.

## Exact baseline and current tests
Baseline GitHub main: `0cd7366dcd96c4f37fef523e3fedebe05f9dc44c` (includes RM111 owner-only payment test, public sales off). The standalone RM112 read-only live browser-audit PR #30 merged as `5180f5c99ba4068d8d277d0b9fcde584d79dad9e`. PR Actions `38060482516` success; after merge on-main Actions `38060641380` success. Earlier intermediate audit `38060323669` failed due a TEST BUG (the checkout text was truncated to 2500 characters before looking for the order summary; Shopify's country list appeared before the summary). Corrected to inspect the full body; this was not a Shopify checkout failure.

### Checks actually run against REAL production (no mocked site)
- GET live `/credits.html`, `credits.js`, `credits.css`, and `/api/credit-packs/catalog`: all HTTP 200.
- Verified seven packages and each exact approved price from the LIVE credit API.
- Verified current `CREDIT_SALES_ENABLED=false`, owner-only test flag true at time of audit. POST anonymous checkout was rejected HTTP 503 before creating an intent. GET unauthenticated admin code history was HTTP 401.
- Browser-rendered LIVE `/credits.html` with iPhone-size WebKit 393px and desktop Chromium 1440px: seven populated packages and prices, responsive without horizontal overflow, all anonymous buy/gift buttons disabled, no unhandled JS errors, proper initial free HQ/Standard counts and reset dates, redemption form visible.
- Shopify `/products/recast-me-daily-reset-3-hq-5-standard.js` was available (HTTP 200), product variant `67762889818356` price 299 cents.
- Opened REAL Shopify `/cart/67762889818356:1` with a SYNTHETIC nonpaying cart attribute, followed actual checkout redirect, HTTP 200, real checkout displayed the Daily Reset item and $2.99, card/payment form appeared. **Did not enter card details, authorize funds, submit an order or create a credit code.** Shopify order list remained two older orders (#1001 and #1002), with no new $2.99 order.
- IMPORTANT FINDING: Shopify checkout displayed the **generic store name "My Store"**, title `Checkout - My Store`, rather than Recast Me Ai. Shopify's connected Basic plan shop name is also "My Store." This hurts credibility and should be corrected using Shopify Admin **Settings > General > Store contact details > Store name**, and customize checkout logo/colors via Settings > Checkout. The connected Shopify API does not expose a writable Shop name mutation; user interface action is needed. Do not claim it has already been fixed.
- Scope: the audit DID NOT verify a completed paid transaction, fulfillment of 3HQ+5Standard after PAID Shopify order sync, paid refund reversal, or authenticated admin test button, because no payment credentials or Recast owner key was available in this session. The prior 433 unit/mock tests cover backend rules but not Shopify payment acceptance.

### Risk noticed and handled after test
Even when Recast's own owner-only endpoint was protected, the Shopify reset product being **UNLISTED** left its *direct Shopify cart permalink publicly usable* for someone who knew the variant ID. An order placed without a server-generated checkout claim would not receive credits. This is unsafe to leave open without full real payment acceptance. Accordingly, the reset Shopify product (ID `15426652471540`) was actually changed back to **DRAFT** via connected Shopify product update; confirmation returned DRAFT at $2.99. The separate HQ and Standard credit products remain DRAFT.

## RM113 source changes to finish safely
Review branch `recast/rm113-close-paid-test-gate-20261010`, created from main `5180f5c99ba4068d8d277d0b9fcde584d79dad9e`.
- `wrangler.jsonc`: `CREDIT_TEST_CHECKOUT_ENABLED=false`, `CREDIT_SALES_ENABLED=false` remains unchanged. The owner-only backend test will not create further Shopify paid intents.
- `public/credits.js`, `public/credits.html`, `public/admin.html`: customer and owner UI clearly state paid tests are PAUSED and do not encourage someone to click an unusable or unwanted checkout button. All gift/support code redemption remains available. Refresh asset version.
- `scripts/rm112-live-credit-audit.cjs`: safe permanent recurring public audit tolerates a draft Shopify reset product (404), records the public gates, and skips nonpaying cart navigation while the owner test is off. Source audit behavior is not proof of future paid acceptance.

## Next gates
For full customer checkout activation, someone with a legitimate payment method and/or Shopify's authorized payment test mode must submit an actual Shopify checkout to verify paid Order.customAttributes, wallet reconciliation, safe refund, confirmation display and receipt. This assistant did not perform a payment or claim it was proven. **Do not enable public credit packs or spend on marketing for them until Shopify title and paid-order delivery are verified.** Business/customer expenses: no new provider/subscription; no paid AI inference or checkout charges performed in this session, and the public web checks may have caused fresh zero-balance wallets for synthetic browser visitors.

## Rollback
If a new paid test is explicitly requested later, reopen only the reset Shopify SKU and owner-only test feature under supervision; keep public packs gated. For production source rollback, prefer new PR through CI and guarded GitHub→Cloudflare deploy. Never delete customer wallets, existing order entitlements or gift codes. The intended safe end state is all seven credit SKUs DRAFT and both paid-sale flags false.
