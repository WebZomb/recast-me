# November 6, 2026 — collection and basket request efficiency

Baseline main: 6b41c431c8b4220a66444b0bbbd085b1c4797675. The 177 published offers remain the sellable inventory; thirteen other product families remain unfinished.

Collection clients now request only their product family. The server filters candidates before the existing per-offer source, proof, SKU and price verification. The unfiltered API retains its existing behavior. No cross-request cache or relaxed verification was added. Basket add resolves Shopify products once and shares that result with offer verification and response pricing within the same request. Empty baskets avoid unnecessary Shopify calls; subsequent requests and checkout still fetch current products.

Changed src/shop-catalog-store.js, src/shop-routes.js, src/basket-routes.js, public collection clients and their versioned HTML references; updated asset assertions and added three integration tests covering filtered verification, request reuse and empty baskets.

Validation: 941 Node tests passed. Before-release unfiltered production catalog request took 26.988 seconds (one sample, not a statistical benchmark). Worker build and hosted release checks pending at this checkpoint. No production deployment or measured live improvement claimed yet. Visual layout and artwork unchanged; responsive hosted browser verification pending.

No paid actions, provider generation, orders, model changes or artwork replacement. Existing 1254px originals still do not meet large-product print areas. Generic Shopify checkout thumbnails remain a limitation; correct approved proof and artwork identifiers continue to be carried.

Rollback: revert this focused change; previous unfiltered API remains supported. Publication remains conditional on actual native print files and authentic supplier proof review.

## Verified release receipt

PR181 merged as1b019e8052c4996211994e5580347fc7901c357e. All hosted checks passed (customer policy42325798205, source-specific proof and owner publication plus security/bundle). Guarded production deployment42326548124 including smoke passed. A live filtered coaster request returned exactly35 coaster offers in8.857seconds versus the earlier unfiltered177-offer26.988second sample. These are individual observations, not a benchmark guarantee. Live UI added Golden Retriever Coaster Set at$39.99 with exact artworkRC-SHOP-GOLDEN-RETRIEVER-V1; test item was removed and cart visibly saved empty/$0.00. An unauthenticated shell basket probe was rejected403 as expected and is not a basket performance measurement.

Checkout-thumbnail follow-up: read-only Shopify inspection found an existing DRAFT Golden Retriever Christmas Village Mug product15484155625716 with variants68035387949300/68035387982068, SKUs RMCM-001-11 / RMCM-001-15. These are distinct from the mapped RECAST-MUG SKUs used by the current177 verified offers. Activating those drafts alone would not safely migrate approved artwork/fulfillment bindings. No Shopify product image, SKU, status or publication was changed in this session. Exact design-specific Shopify thumbnails remain an unfinished migration; Recast's own basket uses the correct approved product picture.

## Final cleanup release, November 7 UTC

PR183 merged c8c71d553ad069b2963780ea8edb378baaff019f after all five head checks passed at df04d31fab7907808e4d767ab6ae874cf5430c26. Local 942 Node tests and Worker dry-run passed. Guarded deployment42334008186, including production smoke, succeeded. Browser verified old /shop-stickers redirects to /shop-sticker-sheets, 35 ready-to-buy sheets, 16 active navigation categories without retired singles, and owner review105/105 published. The .html legacy path independently returned301 to the same canonical sheet collection. Public cart remains empty after the earlier add/remove test. No paid processing or order.

Next bounded proposal is one source-preserving8192px Golden Retriever master for a50×60 blanket, maximum$5 total including any credit fee, awaiting explicit spending authorization. Revised plan excludes oversized60×80/native canvas transforms; source bytes/hash verified. Twelve other active categories and design-specific Shopify checkout thumbnails remain unfinished.
