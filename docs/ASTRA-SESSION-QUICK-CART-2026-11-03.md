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

## Production release receipt — November 3, 2026
- PR [#129](https://github.com/WebZomb/recast-me/pull/129) head `42a839d767e4c770e7223bca80be59cfbf36dc82` merged to main `bd4ef90648794814462699dfd79bfba3b99f0b8a`; unchanged frozen artwork/proofs/prices/order routing.
- Hosted PR customer-policy workflow `41720926782` **success**: Node regression suite, Wrangler dry-run, Chromium/WebKit Shop mixed-cart regression (including one cart GET for each premade/custom add), basket recovery, Christmas, SEO and narrow-viewport checks all passed. No paid operations; tests use isolated mock traffic.
- Guarded Cloudflare production workflow `41722438066` **success**: offline tests/dry-run, Worker deploy and read-only production smoke passed. Deployed Worker version `96043667-b052-4361-8865-83f1e9458284`.
- Read-only launch-audit workflow `41722438155` **success** (may race the production deployment; not independently proof of new assets).
- Independently verified public GETs after deploy: `/basket.js?v=3` HTTP 200 containing `initialFetchDone`, `/shop.js?v=5` HTTP 200 importing `basket.js?v=3`, `/shop.html` HTTP 200 referencing `shop.js?v=5`. `/api/basket/status` returned enabled=true. `/api/shop/catalog` returned exactly 2 verified offers, 11 oz $24.99 and 15 oz $29.99. No live cart mutation/order/payment to verify monetary or latency improvements; this change removes redundant network round trips by construction, but no production timing claim is made.
- No source/master or provider photos were created or changed. Larger pet assortment remains unlaunched for the reasons above. Rollback: revert merge SHA `bd4ef90648794814462699dfd79bfba3b99f0b8a`, rerun guarded production deploy and read-only smoke.
