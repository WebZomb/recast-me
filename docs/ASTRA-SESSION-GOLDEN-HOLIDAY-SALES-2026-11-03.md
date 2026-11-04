# Golden Retriever Winter Lights holiday background — November 3, 2026

Owner correction: The first Shop card (Golden Retriever with burgundy scarf, snow and aurora, mug handle on left) needs more Christmas decoration **around** the mug. The adjacent Golden Retriever Christmas Village mug with Santa hat is good and must stay unchanged.

## Exact narrow change
- Replaced only the first card's **11 oz sales illustration** URL in `public/shop.js` with a new Recast-owned festive lifestyle image. It adds frosted evergreen branches, red Christmas baubles, glowing lantern, wrapped presents and Christmas lights around the product while retaining the original Winter Lights golden retriever design theme and handle orientation.
- New optimized illustration uploaded to Shopify Files as `recast-christmas-golden-winter-lights-festive-sales-v2-20261103.webp`, 1254×1254, 424,780 bytes locally; CDN image returned HTTP 200.
- The first product's 15 oz marketing shot, the entire adjacent **Golden Retriever Christmas Village** listing, all other 35 designs, prices, Add to Cart logic, stored print master, frozen approval and **actual Printful supplier proof** are untouched.
- This is explicitly a **marketing illustration**, not an exact supplier rendering. The real product is the existing Printful proof reached using `See real product`. No new checkout access, unpaid product SKU or Printful fulfillment change.
- Shop and Christmas HTML import `shop.js?v=8` for cache refresh. Regression test checks the exact changed SKU/URL and the unchanged other variant.

## Release receipts
- PR/CI/Cloudflare and read-only live verification must be appended after checks succeed. Roll back by restoring original 11 oz sales URL and reverting the cache-bust tags. No cart or order data migration needed.
