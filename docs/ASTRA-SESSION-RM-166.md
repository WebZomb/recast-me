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
- Local Chromium checks passed at 320/393/768/1280px: 18 cards, 3 sale banners, all product images load, owner schedule save works, no horizontal overflow or JavaScript errors. Screenshots inspected. Initial Playwright browser archive was invalid; a local Chromium package enabled verification. Hosted security and WebKit/Chromium regression CI passed on source `9305b47e6b18a7a7576982cd08b04035104c74d5` (runs 38480825491 and 38480825625). The existing customer-flow suite also passed locally in Chromium.
- Initial local failures were a stale script-version assertion and missing browser globals in a test fixture; corrected without weakening checkout safeguards.
- PR #81 merged as `e9e803451f0ae227e8ec84498d33cd76cab5f7f0`. Guarded deployment 38481249106 passed, including all 585 Node tests, bundle and read-only production smoke. Cloudflare Worker version: `a842c97f-fd11-4330-aadf-14c36624a3ed`. Independent public browser audit 38481249032 passed.
- Live Chromium visual checks at 393px and 1280px passed: 18 cards, 3 offer banners, 18 sale badges, all images decoded, no overflow or page errors; screenshots inspected. The scratch browser required the environment proxy and local proxy certificate handling; hosted production audit passed independently.
- Live public endpoints returned the active Halloween campaign, verified 10% code and all 18 product categories with current prices. Shopify discount configuration was read and verified; actual checkout redemption remains untested. No paid app render, supplier request, order, payment or live campaign-setting mutation occurred.
- Initial publication review required a public-data audit; the notes were reduced to technical release information and the reviewed change was allowed. The shell then lacked Git credentials, so the connected GitHub integration published the matching reviewed tree `48f6c76b03ed0075981cb2f91f8cc7b03ab2e98a`.
- Rollback: revert this change through the existing guarded deployment. Stored artworks, orders and credit balances are unaffected.
