# Christmas launch, October 30 2026

Owner requested Christmas and ready-made gift shop live. Baseline main 3f4875cf08a258cf6c880d5420f15f7567c0b5a8.

Christmas: replace stale Halloween static content, social metadata and hero with existing approved Christmas artwork; add dedicated /christmas-gifts.html; feature Christmas on Specials from October30 through December25 Eastern. The display override never changes admin schedule, server promotion eligibility, existing prices, rendering or fulfillment. Mismatched offers are removed; current live API promotionsEnabled:false/offer:null was read. No 10% offer is advertised. Fix changing-image alt text and style-card accessible labels.

Shop: PR114 is still draft, with no offers, no production adapters and no verified print masters/supplier proofs. Shopify live search found only custom products. Opera remains disconnected; no Printful plugin found. Do not merge the empty shop as a purchasing destination or claim it is sellable.

Validation and deployment receipts to be appended after actual runs. No paid render, purchase, supplier order, discount or scheduled social content change. Rollback is revert this focused Christmas commit; PR114 remains separate.

## Validation in this session
Six new focused tests passed. Both Christmas entries passed actual Chrome at320/393/768/1280 with live-catalog read snapshots, no horizontal overflow or page errors, correct Christmas links and suppressed mismatched offers. Narrow-phone screenshot inspected. Worker dry-run passed. Initial full617-test run:614pass,3fail: old Halloween page expectations and two pre-existing Windows newline/file-URL assumptions. Expectations updated to Christmas and only the test portability bugs corrected; full rerun follows. Browser script freezes its test clock and performs no purchases.

Final local validation:617/617Node tests passed; frozen-clock Chrome checks for both pages at four widths passed. Production deployment has not yet occurred. No spending or fulfillment changes.

Premerge review found the preexisting seasonal browser fixture used the real clock despite hardcoded Halloween expectations. Freeze that fixture to October13 and preserve the complete Halloween artwork/links for future calendar rotation. Add deterministic Christmas Chromium/WebKit checks to hosted CI; keep its 18-product fixtures local-only. No extra live request or supplier operation. Hosted results pending.
