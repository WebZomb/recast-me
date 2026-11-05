# First three ready-made small gifts — actual live commerce verified, November 5, 2026

This supersedes the earlier ready-for-review/no-checkout status for ONLY the three initial Golden Retriever Christmas Village small gifts. It does not mean all35 illustrations across all17 shop categories are finished.

## Authenticated review unblocked
Owner explicitly turned on the connected PC and opened the signed-in Recast Control Center. Existing Opera owner session on DESKTOP-GFOHB7M was used; no admin token was read, copied or exported, and no R2 permission was expanded. The prior native-file review was failing even when logged in: the full response security wrapper re-watermarked all native files and converted the transparent sticker PNG into JPEG. Live Network response confirmed the wrong JPEG content type.

Focused PR167 fixes only three exact existing authenticated native-file GET paths. All other customer/public previews still use the original watermark boundary. Existing authorization and native-file/source/preapproval/supplier-task/SKU/variant/placement/hash checks remain enforced. Runtime merge2e0ec7748da5b9ff7a85ca77e63a352ed3abe625; baseline30483ae10d634a71a6c252dc35dbb280915f313b.

Verification: 5 new full-router tests and all898 local Node tests PASS; Wrangler dry-run PASS; hosted security42083427022 SUCCESS; full Chromium/WebKit customer-policy42083426776 SUCCESS; Cloudflare preview SUCCESS. Guarded production deployment42085685480 completed offline tests, deploy and read-only production smoke successfully. The live owner page then displayed all three native files with successful exact hash/image-load checks.

## Real digital image inspection and owner-session publication
The original approved Golden Retriever Christmas Village artwork was inspected alongside both saved actual Printful views and each exact clean production file. The dog, Santa hat/red scarf, village scene, complete face and printable crop matched. Coaster and magnet native JPEGs were clean without the public proof watermark. Sticker native PNG showed six separated complete picture tiles in two columns and three rows, with transparent cut gaps and no watermark; both actual supplier sheet views showed the six stickers correctly placed. Digital proof review is not a physical sample test and does not establish physical color/material quality.

Publication proceeded through the existing visible authenticated owner review/confirmation UI. User interaction occurred in the same open review session; no claim is made that every confirmation was sent by automation. No hidden publication endpoint, automatic signature injection or bypass was used. Independent public status and catalog checks confirmed all three published and checkoutEnabled=true:

| Exact product | SKU | Clean file | Live price |
| --- | --- | --- | --- |
| Golden Retriever Christmas Village Coaster Set — four matching coasters | RECAST-COASTER-SET | 1181×1181 JPEG | USD39.99 |
| Golden Retriever Christmas Village Magnet Set — three matching magnets | RECAST-MAGNET-SET | 900×900 JPEG | USD24.99 |
| Golden Retriever Christmas Village Sticker Sheet — six pictures, 5.83×8.27in | RECAST-STICKER-PACK | 1750×2482 transparent PNG | USD14.99 |

Collection paths: /shop-coaster-sets, /shop-magnet-sets, /shop-sticker-sheets. Only the Golden Retriever Christmas Village card became verified/buyable in each category. Other gallery cards were not released.

The independently fetched public catalog returned73 verified offers:70 existing mug offers,1 coaster,1 magnet,1 sticker-sheet. The existing mug assortment was preserved;70 mug offers includes the earlier original mug pair and is NOT proof that all35 new Christmas designs are published.

## Actual customer-cart and checkout verification
Used a separate headless Edge customer context, not the owner's Opera cart/session. Live UI assertions verified all three exact category cards were verified, showed prices39.99/24.99/14.99, and their actual Add to Cart buttons created three distinct lines. Quantity1→2→1 updated and restored subtotal; removing and re-adding the magnet preserved the correct distinct designs. Subtotal for one of each:USD79.97, excluding shipping/tax calculated later.

The first checkout test reached navigation before its test harness could read the response body; Playwright reported Network.getResponseBody unavailable after navigation. This was recorded as a test-observation failure, not evidence of a rejected order. No blind duplicate on that checkout was attempted. A separate isolated persistent QA customer context repeated only the cart and handoff checks, observing response status and destination rather than racing a response-body read.

Second live verification PASS: all three cart images loaded (natural width768 each, none hidden), subtotalUSD79.97; POST /api/basket/checkout HTTP200; navigation reached b2wnfu-7g.myshopify.com with title Checkout - Recast Me Ai. Actual mobile checkout screenshot showed the correct79.97 order summary and empty email/delivery fields. No customer contact/address/payment information was entered, no Pay action was submitted, and no Printful physical production was initiated. Unpaid test checkouts may remain; no paid order is claimed. Customer cart screenshots and test details are in the isolated local QA folder, not committed to this public repository.

## Remaining catalog work and rollback
These are the FIRST three non-mug ready-made products that are genuinely published and cart/checkout-verified. The other34 pet artworks in each small-gift category and the larger products (blankets, apparel, canvas, etc.) remain unfinished, requiring appropriate product-specific files, genuine supplier proofs and review. Do not advertise those preview galleries as purchasable collections.

The transport fix can be reverted independently, but that does not automatically unpublish these three intentionally released products. Any removal must be a separate explicit catalog action preserving historical orders and frozen approval files. Do not delete source files, supplier task records, signed native masters, customer baskets or owner publication audit receipts.
