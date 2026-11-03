# Quick-shop cart responsiveness — November 3, 2026
Baseline: main `1988aaf870fefaace032ce606cb94deefbfae290`.
Owner goal: make Adding to Cart quicker on the published Christmas quick-gift shop without changing approved designs, supplier proofs, catalog availability or checkout guards.

Changes:
- `public/basket.js` performs initial basket read only once per page. Adding an approved premade or custom line still opens/validates session, retrieves the authoritative basket revision, binds frozen approval and persists an idempotent command. The successful action response already contains current basket state; its dialog opens directly without a redundant post-add read. Manual cart opens, quantity edits, explicit refresh and checkout continue to refresh.
- Shop/Christmas pages cache-bust shop module; shop module cache-busts the revised basket module.
- Isolated `scripts/shop-browser.cjs` tests assert exactly one authoritative basket read on first/second premade add and custom add, in addition to existing mixed-cart and viewport tests.

Verification: source branch `recast/quick-shop-cart-20261103`. Local Node suite, hosted Chromium/WebKit, production deploy and live smoke not yet run at this writing. Never infer live publication from GitHub branch. No production orders, payments, supplier generations or AI calls.

Remaining: 10 dog and 10 cat designs with varied scenes and additional merchandise still require separate suitable print masters, correct placement, supplier-reviewed mockups and verified identity/prices. Currently only two Golden Retriever mug sizes are purchasable. Do not advertise candidate art as supplier-approved stock.

Rollback: revert the PR and restore prior cache-busted modules; existing saved carts, supplier proofs, approvals and Shopify data remain unchanged.
