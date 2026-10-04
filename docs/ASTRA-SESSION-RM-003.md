# RM-003 — Cloudflare Worker Preview configuration fix

Date: 2026-09-29
Parent/head before fix: `5e259aa310662600fe9040c92bdb783b65a9cf6a`
Branch: `recast/secure-previews-2026-09-29`

## Observed failure

Cloudflare's automatic PR Worker Preview cloned the repository and installed dependencies successfully, then failed during the deploy step. The owner supplied the Cloudflare build log for build `d40dc000-a926-4baf-8c53-0f4e59a3fff9`. The relevant deployment command was `npx wrangler preview`; Cloudflare reported that the AI binding used by this Worker needed an explicit Preview binding configuration.

This is distinct from the earlier GitHub Actions validation: `npm test` (73/73) and `wrangler deploy --dry-run` passed at implementation commit `b0dd044...`, but a dry-run is not the same as Cloudflare's PR Preview environment.

## Change

`wrangler.jsonc` now includes:

```json
"previews": {
  "ai": {
    "binding": "AI"
  }
}
```

The existing production `ai.binding = "AI"` is unchanged. No image model, AI step count, public URL, commerce setting, social setting, secret, billing option or production deployment setting was changed.

## Verification state

This commit is intended to trigger Cloudflare's automatic PR Preview again. Do not record the Preview as successful until the new Cloudflare bot/build result is observed. Do not retry or merge based only on this note.

The separate RM-002 activation gate remains: the server-side watermark boundary requires the Cloudflare Images binding (`IMAGES`). This AI Preview-binding fix does **not** add or enable `IMAGES`, does not select `AI_DAILY_CALL_LIMIT`, and does not make the branch production-ready.

No live AI render, purchase, Printful production action, X post or engine switch was initiated while making this configuration fix.
