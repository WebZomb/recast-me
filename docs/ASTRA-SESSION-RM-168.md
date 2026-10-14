# RM168 — Explicit seasonal discount pause

Baseline: `64c3a9984c0a697322c38b57a19138a139acefe7`.

## Owner decision and implementation
The owner has deferred the 10% promotion. This supersedes RM167 instructions to enable discounts by granting draft-order permission. Seasonal gifting pages and their annual rotation remain active at regular prices.

- `src/seasonal-checkout.js`: require exact server setting `SEASONAL_DISCOUNTS_ENABLED=true` before permission readiness or invoice creation/reuse. Default/missing/false stays off; the pause also overrides cached permission success.
- `src/holiday-campaigns.js`: public campaign reports `promotionsEnabled` separately from permission readiness; paused offers remain null and ordinary checkout URLs retain their exact proof/product properties.
- `wrangler.jsonc`: explicitly sets the production flag false. Preview configuration missing the flag also defaults off.
- Tests: retained opt-in invoice tests and added pause regression coverage, including valid matching artwork, malformed flags, no provider/storage mutations and cached readiness.
- Expiry cleanup remains enabled for previously issued invoices; this change does not revoke unexpired existing invoices. No live invoice was created in the preceding session.

## Verification
592 Node tests passed; Worker dry-run passed; git diff whitespace check passed. No live rendering, purchases, fulfillment, notifications or provider billing actions. Hosted CI, deployment and live readback pending at this source checkpoint. No visual markup change; hosted seasonal mobile/browser regression will verify the existing layout.

## Branding continuation
Shopify store name and branded receipt logo were observed in the signed-in browser. Receipt code has conditional pickup/shipping branches. The Shop tracking button is still present; email template edits, sender verification and Printful packing-slip branding remain pending. Browser connector provides read/navigation only, not typing or saving. Do not report these pending edits as complete.

## Rollback and activation
Revert this runtime/config change only if required for a defect; preserve discounts off. Any future promotion activation requires an explicit owner decision, exact enabled flag, provider permissions and unpaid-invoice validation. Never reactivate the expired broad coupon as a shortcut. Release commit and workflow receipts will be appended after deployment.

## Live release receipt — 2026-10-13 Eastern
PR83 head `1bf0cc10a27040583cc2e50de73b520b2f7368e9`, tree `95410208a881a10c3098f820784943336f59d751`; merged runtime `f628a7577529d4df74f0e35c10a7737fedb0a0cd`. Security run38500537940 and customer-policy/browser run38500537954 both passed. Guarded deployment38500834279 passed, including production smoke; Cloudflare Worker `a69584b9-b36a-4565-b4db-13b3de158104`.

Independent public GET /api/seasonal-campaign HTTP200 confirms active Halloween, offer:null, checkoutReady:false, promotionsEnabled:false. Initial urllib requests received HTTP errors; a normal browser-user-agent curl request succeeded. No credentials or private browser sessions were used for that request. Public launch audit38500834221 has passed the public production browser step; remaining product/social checks were still running at receipt time. No paid operation or customer notification.
