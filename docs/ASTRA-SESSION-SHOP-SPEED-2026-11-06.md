# November 6, 2026 — collection and basket request efficiency

Baseline main: 6b41c431c8b4220a66444b0bbbd085b1c4797675. The 177 published offers remain the sellable inventory; thirteen other product families remain unfinished.

Collection clients now request only their product family. The server filters candidates before the existing per-offer source, proof, SKU and price verification. The unfiltered API retains its existing behavior. No cross-request cache or relaxed verification was added. Basket add resolves Shopify products once and shares that result with offer verification and response pricing within the same request. Empty baskets avoid unnecessary Shopify calls; subsequent requests and checkout still fetch current products.

Changed src/shop-catalog-store.js, src/shop-routes.js, src/basket-routes.js, public collection clients and their versioned HTML references; updated asset assertions and added three integration tests covering filtered verification, request reuse and empty baskets.

Validation: 941 Node tests passed. Before-release unfiltered production catalog request took 26.988 seconds (one sample, not a statistical benchmark). Worker build and hosted release checks pending at this checkpoint. No production deployment or measured live improvement claimed yet. Visual layout and artwork unchanged; responsive hosted browser verification pending.

No paid actions, provider generation, orders, model changes or artwork replacement. Existing 1254px originals still do not meet large-product print areas. Generic Shopify checkout thumbnails remain a limitation; correct approved proof and artwork identifiers continue to be carried.

Rollback: revert this focused change; previous unfiltered API remains supported. Publication remains conditional on actual native print files and authentic supplier proof review.

## Verified release receipt

PR181 merged as1b019e8052c4996211994e5580347fc7901c357e. All hosted checks passed (customer policy42325798205, source-specific proof and owner publication plus security/bundle). Guarded production deployment42326548124 including smoke passed. A live filtered coaster request returned exactly35 coaster offers in8.857seconds versus the earlier unfiltered177-offer26.988second sample. These are individual observations, not a benchmark guarantee. Live UI added Golden Retriever Coaster Set at$39.99 with exact artworkRC-SHOP-GOLDEN-RETRIEVER-V1; test item was removed and cart visibly saved empty/$0.00. An unauthenticated shell basket probe was rejected403 as expected and is not a basket performance measurement.
