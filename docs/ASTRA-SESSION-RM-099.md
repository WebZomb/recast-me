# RM099 — Owner-only fal test rollout and production activation safeguards

2026-10-09 EDT. Base source is draft Recast PR #16, initially head `3ee1af6dbf761fbc8173e40991165e13ed8107aa`, against main `93488b18b96137ebcf2fa8fb37602df2f6351cb5`. The owner asked why the completed fal integration is not yet on the public website and how to test it. We distinguish a provider-only proof (real fal output and temporary remote Worker canary), offline/mock full-flow tests, and a genuine owner-only live application test.

## Actual scope and owner decisions
- Publish optional, **owner-authenticated** comparison in `/model-lab.html` on Recast, with fal HQ vs Cloudflare HQ choice. No unapproved customer switch.
- Config explicitly sets `RECAST_HQ_PROVIDER=cloudflare`, `FAL_PROVIDER_ENABLED=false`, `FAL_PROVIDER_VERIFIED=false`, `CF_PROVIDER_VERIFIED=false`, and `FAL_OWNER_TEST_ENABLED=true`. This permits owner-only fal calls using the admin-protected route while all public automatic switching remains off.
- Keep original `PRINTFUL_API_TOKEN`, `ADMIN_TOKEN`, OpenAI moderation, Shopify, Turnstile, Printful order and X secrets in the existing Cloudflare account. Fal secret must be supplied from the owner PC as `FAL_API_KEY` via Cloudflare's secret API/CLI, never included in GitHub, stdout, or preview assets.
- Do not make fresh orders or auto-confirm fulfillment. Any paid owner-only rendering tests stay within the user's previously approved small fal test allowance; no paid render for readiness checks.
- Safest rollout: merge a reviewable, CI-green PR, deploy with fal public feature flags off, confirm public protection and owner authentication before prompting owner for a real form submission. If any required guard fails, revert or roll back to the previous Worker version and leave existing artwork/order records untouched.

## Verification evidence before deployment
- Main branch and production Worker were inspected and still matched the original baseline/Worker deployment version `c0352ee3-4e55-4187-af48-820feb69293e` last deployed 2026-10-08T23:44:27Z. No evidence of concurrent production code changes.
- Same pr HEAD `3ee1af6...` had both GitHub checks **SUCCESS**: security validation and customer-policy validation including mobile WebKit/Chromium (browser tests are mocked).
- Prior isolated application build: **402 local Node tests PASSED** plus successful Wrangler dry-run. One Cloudflare `wrangler dev --remote` canary using only an authorized PUBLIC dog example returned a real fal 1024×1280 JPEG in ~29 sec and verified inline result; this was not the production site's image/watermark/credit acceptance.
- Read-only `wrangler secret list` confirmed current production secret *names* ADMIN_TOKEN, ALERT_GMAIL_APP_PASSWORD, ALERT_GMAIL_USER, MODERATION_OPENAI_API_KEY, PRINTFUL_API_TOKEN, SHOPIFY_CLIENT_SECRET, TURNSTILE_SECRET_KEY. Values not printed.
- Additional canary flags were staged in `wrangler.jsonc`; a Wrangler `deploy --dry-run` completed successfully. These do not activate fal for customers.

## Incomplete / actual deployment receipts
This note was prepared before the final PR merge, production deploy, Cloudflare fal-secret binding and owner form acceptance. Record results afterward with exact commit and Worker deployment/version IDs; do NOT interpret this plan as completed actions. The site is not ready for public HQ failover until moderation, R2/Images, credits, actual preview, order-safe persisted states and accepted-job recovery are proven with a live owner-only request.

## Rollback / safety
Keep `RECAST_HQ_PROVIDER=cloudflare` and Fal public flags false throughout owner's canary. Back up prior Worker version ID and verify original secrets survive. Avoid unrelated config rewrites. If production behavior regresses, roll back the Worker version, not customer data or supplier orders.
