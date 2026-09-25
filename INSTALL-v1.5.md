# Recast Me v1.5 — install and activate

## First: unblock pictures

The current screenshot shows Cloudflare error 3036: the account's shared free Workers AI allowance has been used. **Enable Workers Paid on the Cloudflare account that owns `recast-me`.** Workers Paid has a $5/month minimum; AI usage beyond the free allocation is additional. A code ZIP cannot change billing or remove this provider limit.

Open https://dash.cloudflare.com/, choose the account that owns the Worker, and open the Workers plans/billing screen. Upgrade Workers to Paid, then retry one photo on the existing site. If that account is already on Workers Paid, verify the deployment belongs to that account and inspect the new error under Control Center → Generation Errors. Do not assume every 429 means quota; provider 3040 is temporary capacity, while 3036 is the free-allocation block.

The app has no daily per-customer count cap. Generous previews are possible with paid inference, subject to model capacity. The current high-quality settings are approximately $0.05 per render with one reference, so 20 attempts are roughly $1 of AI inference before additional photos, retries, storage and other charges. Track conversion against usage before promising unlimited free previews. Cloudflare budget alerts notify; they do not impose a hard spending stop.

## Install this small update over v1.4

1. Unzip `recast-me-v1.5-update.zip`.
2. Merge the included `src`, `public`, and `tests` folders into the matching folders in your existing repository. Replace matching files. Keep their folder paths: server files belong in `src`, not loose in the repository root.
3. Replace root `wrangler.jsonc` and the included documentation. Existing public art assets and other source files remain in place.
4. Deploy with your existing GitHub/Cloudflare build, or run `npm ci` then `npx wrangler deploy` from the repository after signing into Cloudflare. This archive is a patch, not a standalone full site.
5. Open `/api/model-status`; it should report `version: v1.5`. `promptVersion: v1.4` is expected because the subject prompt is unchanged from v1.4.
6. On a phone, test a fresh image: select **You + your pet**, **Halloween**, and ask for clearly visible original Halloween costumes on both subjects. Then test a second version and the previous-version selector. Automated tests mock the AI; they cannot establish real visual quality.

## Activate image replies on X after rendering works

The X image-reply workflow is built, but installation does not connect an X account or turn it on. No real replies were sent while building/testing.

Required account setup:

- A funded X API app with OAuth 2.0 user authorization for the Recast account. Scopes: `tweet.read`, `users.read`, `tweet.write`, `media.write`, `offline.access`.
- Cloudflare secrets `X_USER_ACCESS_TOKEN`, `X_REFRESH_TOKEN`, and `X_CLIENT_SECRET` for a confidential OAuth client. Add `X_CLIENT_ID`, numeric `X_USER_ID`, and `X_USERNAME=recastmeai` as Worker variables. These must identify the same authorized account. Do not put secrets in GitHub.
- An Images binding named `IMAGES`, for reference resizing and the public watermark. Add `"images": {"binding":"IMAGES"}` to the top level of `wrangler.jsonc` once Images billing is ready, so future deploys retain the binding.
- Workers AI paid capacity, private `ARTWORK` R2 and `ASSETS` bindings, plus existing Shopify catalog setup. Products must be ACTIVE for the public purchase page to offer them.
- X's prior written approval for an AI reply bot. Once received and the connection is ready, set `X_BOT_APPROVED=true` and `X_BOT_ENABLED=true` in deployment configuration. Both remain false in this package.

Test from another X account with your own attached person-and-dog photo and an explicit tag: `@recastmeai make me and my dog ready for Halloween`. The worker saves a job, renders, posts a watermarked picture, and links to `/recast.html?share=...`. The reply offers the clean high-resolution picture, poster, and mug. The public link cannot open the original uploads, expose the private clean-art token, or delete the artwork.

Use Control Center → X Requests to inspect `queued`, `generating`, `awaiting_capacity`, `replied`, `needs_review`, or `delivery_unknown`. If delivery is unknown, check the X thread before manually intervening. The bot intentionally does not resend an uncertain POST. No-photo requests receive an upload link; private website uploads are not automatically made public on X.

The launch queue processes two jobs at a time sequentially, polling once a minute when enabled; an overlapping invocation waits for the current run. Throughput depends on image generation time. Review the queue before a large promotion; this is not a load-tested high-volume queue service. Do not raise the batch size beyond two without changing the execution design.

## Sources and validation

- Cloudflare errors: https://developers.cloudflare.com/workers-ai/platform/errors/
- Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- X automation requirements: https://help.x.com/en/rules-and-policies/x-automation
- X API pricing: https://docs.x.com/x-api/getting-started/pricing
- X OAuth/scopes: https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code

Run `npm test` and `npx wrangler deploy --dry-run`. These validate software paths and packaging, not live provider credentials, paid billing, model likeness, print quality, or X approval.
