# Recast Me v0.6 — Visual + Image Engine Upgrade

Upload all files in this ZIP to the existing `recast-me` GitHub repo, preserving folders.

Changes:
- New customer-facing visual design.
- New original SVG visuals for all 8 style cards.
- New original product illustrations for merch cards.
- Replaces the hero placeholder blobs with a clear Original → Recast story.
- Hides production diagnostics from normal customers (use `?debug=1` to show).
- Corrects tumbler display to $49.99 and adds all current catalog items.
- Switches new previews to Cloudflare-hosted FLUX.2 Dev at 20 steps.
- Keeps FLUX.2 Klein 4B only as a transient-service fallback.
- Adds `/api/model-status`.
- Existing Shopify/Printful/R2/checkout code remains in place through `src/entry.js`.

After deploy:
1. Open `/api/model-status`.
2. Create one fresh Recast and compare identity/detail.
3. Keep Shopify catalog in DRAFT until paid fulfillment is finished.
