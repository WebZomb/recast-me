# Recast-Me — Pre-fal Public Test Rollback

Captured before changing the production HQ host, 2026-10-09T17:29:16.170Z. The original GitHub main commit was `29b9f340e6cb18c34ade8505303082b6222580d5` and the most recent Cloudflare Worker version was `1a6367a4-9f83-456e-b21b-33084e0049e3` (confirmed in Wrangler deployment history). An immediately preceding version was `11a06f88-8ca9-4af6-a84c-1bf2a19c537e`.

## Original settings

```json
{
  "RECAST_HQ_PROVIDER": "cloudflare",
  "FAL_OWNER_TEST_ENABLED": "true",
  "FAL_PROVIDER_ENABLED": "false",
  "FAL_PROVIDER_VERIFIED": "false",
  "CF_PROVIDER_VERIFIED": "false",
  "HQ_FREE_ALLOWANCE": "3",
  "STANDARD_FREE_ALLOWANCE": "5",
  "AI_DAILY_CALL_LIMIT": "70",
  "AI_DAILY_BUDGET_CENTS": "500",
  "AI_CALL_RESERVE_CENTS": "7",
  "IMAGE_MODEL_HIGH_QUALITY": "@cf/black-forest-labs/flux-2-dev",
  "IMAGE_MODEL_QUICK": "@cf/black-forest-labs/flux-2-klein-9b",
  "ORDER_SYNC_ENABLED": "true",
  "AUTO_PRINT_PREAPPROVED_ENABLED": "true"
}
```

## Roll back safely

Use the authorized PC and authenticated Wrangler session. From the Recast project directory run: `node node_modules\wrangler\bin\wrangler.js rollback 1a6367a4-9f83-456e-b21b-33084e0049e3 --name recast-me --yes --message "Restore pre-fal public rendering"`. Verify the deployment and customer rendering route afterward. If you use a new code deployment instead, restore the settings above from the saved `wrangler.jsonc` and original code from GitHub commit `29b9f340e6cb18c34ade8505303082b6222580d5`. Do not assume version rollback alone changes any subsequently rotated secret. Never remove unrelated Shopify/Printful/alert/moderation secrets.

The existing source image and artwork bucket, customer credits and merchant orders must not be deleted. This backup contains no API key values. A local snapshot of `wrangler.jsonc`, render code, public app, privacy page and CSS is stored alongside this document; hashes are in `rollback-manifest.json`. No supplier orders, payments or previews are changed by the backup.
