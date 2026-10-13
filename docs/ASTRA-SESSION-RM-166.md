# RM166 — Halloween storefront and campaign schedule

Baseline: `31c9e52fe9f40d6ef37e6860512e7c8c16500050`. Source branch: `recast/rm166-seasonal-storefront`.

## Changes
- Full seasonal catalog with active mapped Shopify products and current starting prices. Public response omits internal costs and customer records.
- Sixteen Halloween lifestyle product images, including the existing approved mug unchanged; two digital categories reuse seasonal illustration. Lifestyle examples remain distinct from actual product proofs.
- Three prominent sale banners, individual product badges and discounted starting prices. The existing verified Halloween code is added to approved checkout permalinks while active, preserving design/proof properties and quantities. The offer expires November 1, 2026 at 04:00 UTC and does not recur automatically.
- Annual holiday lead days, MM-DD overrides, enable controls and overlap priorities in the authenticated Control Center. Eastern-time schedule, same-origin writes and revision conflicts. Future occasion selection and verified discount setup remain separate.
- Product preference travels into the existing creation and product-preview flow. Models, rendering prompts, credits, supplier mappings, past approvals and fulfillment are unchanged.

## Validation and release
- 585 local Node tests passed; Worker dry-run passed.
- Local Chromium checks passed at 320/393/768/1280px: 18 cards, 3 sale banners, all product images load, owner schedule save works, no horizontal overflow or JavaScript errors. Screenshots inspected. Initial Playwright browser archive was invalid; a local Chromium package enabled verification. Hosted security and WebKit/Chromium regression CI still pending.
- Initial local failures were a stale script-version assertion and missing browser globals in a test fixture; corrected without weakening checkout safeguards.
- Publication is pending automatic approval review. No deployment or live discounted checkout redemption claimed. No paid app render, supplier request, order, payment or live campaign-setting mutation occurred.
- Rollback: revert this change through the existing guarded deployment. Stored artworks, orders and credit balances are unaffected.
