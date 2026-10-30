# Christmas launch, October 30 2026

Owner requested Christmas and ready-made gift shop live. Baseline main 3f4875cf08a258cf6c880d5420f15f7567c0b5a8.

Christmas: replace stale Halloween static content, social metadata and hero with existing approved Christmas artwork; add dedicated /christmas-gifts.html; feature Christmas on Specials from October30 through December25 Eastern. The display override never changes admin schedule, server promotion eligibility, existing prices, rendering or fulfillment. Mismatched offers are removed; current live API promotionsEnabled:false/offer:null was read. No 10% offer is advertised. Fix changing-image alt text and style-card accessible labels.

Shop: PR114 is still draft, with no offers, no production adapters and no verified print masters/supplier proofs. Shopify live search found only custom products. Opera remains disconnected; no Printful plugin found. Do not merge the empty shop as a purchasing destination or claim it is sellable.

Validation and deployment receipts to be appended after actual runs. No paid render, purchase, supplier order, discount or scheduled social content change. Rollback is revert this focused Christmas commit; PR114 remains separate.

## Validation in this session
Six new focused tests passed. Both Christmas entries passed actual Chrome at320/393/768/1280 with live-catalog read snapshots, no horizontal overflow or page errors, correct Christmas links and suppressed mismatched offers. Narrow-phone screenshot inspected. Worker dry-run passed. Initial full617-test run:614pass,3fail: old Halloween page expectations and two pre-existing Windows newline/file-URL assumptions. Expectations updated to Christmas and only the test portability bugs corrected; full rerun follows. Browser script freezes its test clock and performs no purchases.

Final local validation:617/617Node tests passed; frozen-clock Chrome checks for both pages at four widths passed. Production deployment has not yet occurred. No spending or fulfillment changes.

Premerge review found the preexisting seasonal browser fixture used the real clock despite hardcoded Halloween expectations. Freeze that fixture to October13 and preserve the complete Halloween artwork/links for future calendar rotation. Add deterministic Christmas Chromium/WebKit checks to hosted CI; keep its 18-product fixtures local-only. No extra live request or supplier operation. Hosted results pending.

## Public verification receipt — October 30, 2026

PR115 merged with source head 017cc7298aaf18abe8456c53f6eec1ade1c18e9a; main merge 54510b70835fdd48691923eb4b097e809b029e73.

Independent read-only production checks confirmed both /specials.html and /christmas-gifts.html actually serve the Christmas titles, loaded holiday hero, Christmas CTA and 18 web product cards at 393px and 1280px, with no page JavaScript exceptions or horizontal overflow. The live 393px screenshot was visually inspected. The public helper and seasonal JS bytes exactly match the release Git blobs (SHA256 4e600221f4f5ee4926e7b867a403d697cf7d566c479562f65c1f17c744dec99e and 41303ba614caf152b80de79dae0eb4bcef90b9d4d2907c917aba4c8228f27b40 respectively). Live campaign still reports promotionsEnabled:false and offer:null; no discount was activated.

A first production browser check waited for networkidle and timed out; rechecking DOM readiness plus explicit loaded-hero, rendered-product, title, CTA, overflow and error assertions passed all four page/viewport combinations. No site response was mocked in the production verification.

Important separation: the current pages are personalized-photo gifts, NOT the premade catalog. PR114 remains draft/unmerged, with no sellable approved offers and incomplete production adapters. It must not be described as live or buyable.

Hosted status at receipt: security41099848217 passed; customer browser41099848223 was still in progress; guarded deployment41100745912 was still reported queued by GitHub despite the direct public content checks above. Therefore public content is verified, but hosted WebKit completion and this release job's success are NOT claimed. Do not infer a Worker version or successful hosted run from the public content alone.

No paid render, purchase, supplier order, discount activation, ad boost or scheduled-social-content modification. Website navigation retains Specials until the premade shop can safely launch. No native binary release.
