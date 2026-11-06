# Cart mug side previews — November 6, 2026

Baseline main: 66ba43cf43fe4adc10963048a4d4b0b0e0d2b7a9.

Owner reports Golden Retriever and Chihuahua ready-made mugs show the wrap seam in cart. Shop already chooses a saved Handle on Left/Right image, but basketDetails returned the default approved-preview URL, whose frozen primary image prefers Front.

Change: basketDetails now selects a valid saved side-angle index from that buyer's frozen checkout-preview metadata for Mug lines. Selection happens on every cart read, so existing baskets benefit without migration. Other products, original-only approvals and missing/malformed metadata retain the default preview. No new supplier mockups, print composition, approval writes, prices, checkout or fulfillment changes. Private buyer tokens remain scoped; public catalog tokens are not substituted.

Validation: 914 Node tests pass, including existing basket read without state changes, premade buyer-scoped side image, and fallback for absent/malformed/out-of-range views. Initial run caught product-name case mismatch (Mug versus mug); corrected and full suite passed. Worker dry-run completed. Local browser suite could not launch because Chromium executable is not installed; hosted browser verification remains required. Direct live catalog read timed out, so no authenticated owner-cart verification claimed.

Separate owner request: More Styles / Surprise Me artwork concepts generated for approval only; no live image replacements included. Facebook analysis used Metricool observations, not inferred sales or an asserted algorithm penalty. No paid ads, orders or fulfillment calls.

Release state: review change prepared; append GitHub and deployment receipts after verification. Rollback: revert the focused basket selection change; no stored records require rollback.

## Verified release receipt

PR171 tested head 669e8f53cde4d0a43e83c368086e67e819c3e07d: hosted security42255844379 and full customer-policy42255844389 passed, including basket recovery and Shop/Christmas mixed-cart Chromium/WebKit checks. Merged as c81938758d3f1aad9e692baba5d59a7e8cbe383c. Guarded deployment42257126154 completed successfully, including offline tests, bundle, Cloudflare deployment and read-only production smoke. Source correction is live; no inspection of the owner's private cart or new order is claimed. Existing cart open action refreshes basket details, so closing/reopening the cart requests the corrected side URL.

Facebook analysis correction: the October20 how-to outlier had 336 paid of 352 total impressions; it is not evidence of strong organic how-to performance. Latest completed November5 follower count reported by Metricool was4. Original demonstrations remain a proposed content test; no new ad purchase or account eligibility result is asserted.
