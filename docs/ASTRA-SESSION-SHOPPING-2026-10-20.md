# Google Shopping landing price correction

Baseline: b73ba98b41d24cbb60955b7813ea21ebac1a2759 (origin/main). Isolated worktree; previous worktrees and concurrent edits preserved.

Observed Google pillow variant 67710901715188 (22×22) lands on Shopify with main heading From $29.99; option costs $49.99. Local tracked product-entry section confirms unconditional product.price_min. Changed only that price paragraph to show explicit selected variant price and escaped size; generic entry retains minimum price. Existing layout, artwork approval and prices unchanged.

Tested with LiquidJS rendering: explicit 22×22 $49.99; generic From $29.99; default variant $24.99 without Default Title. All pass. git diff --check passes. Full Shopify theme validation and live theme upload NOT done; repository copy is not proof of deployed theme version. This change is prepared, not deployed.

Other verified observations: design CTA links to generic https://recastmeai.com/#start, losing product context. No fix for that yet: server catalog SKU mapping and approved-artwork route need a coordinated change. Do not claim full checkout tested. Shopify shipping general profile 116180812020 shows Printful under Not fulfilling from, store-location US rates present. This does not establish custom fulfillment is broken; inspect actual order routing before altering. Do not copy transit estimates as production-plus-transit promises.

Merchant Center account 5876588517: prior run saved active US defective-only return policy referencing owner-published Shopify refund URL. Pillow free listings pending initial review; no guarantee of approval. No ads, spending-limit changes, production orders or provider renders. Browser automation used existing funded TinyFish wallet for read-only checks in preceding turns.

Rollback: revert this isolated template change. Next: compare current live theme file, validate/upload the one section through supported theme access; then verify 22×22 and generic URL in mobile/desktop browsers. Product context and shipping remain open.

Follow-up evidence: Shopify Admin read identified MAIN theme 188993994996 (Recast Me — launch review) and its current sections/recast-product-entry.liquid checksum 0de99fd08cc599648ffc7204084ebcc7. Its price paragraph matches the affected baseline. Connector policy blocks live/MAIN theme writes; no theme mutation attempted. Git CLI upload failed for missing credentials after owner upload authorization; using the connected GitHub app for this review branch. This repository upload does not deploy a Shopify theme.
