# RM101 — Live owner Model Lab short-failure diagnosis and fal Authorization normalization

Date 2026-10-09 EDT. Current live site `https://recastmeai.com/model-lab`, public fal switching remains OFF. Owner submitted the public demo Jack Russell image through the authenticated fal High Quality Model Lab twice at about 12:57 local time; both requests failed within ~5–6 seconds, no image returned. Reference codes supplied in screenshots: `GEN-MV17KLL5-49F1`, `GEN-MV17KY14-9201`. No additional paid inference was authorized or submitted during this diagnosis.

## Evidence retrieved from actual live production R2, read-only
`wrangler r2 object get recast-me-artwork/diagnostics/generation/<ID>.json --remote` downloaded each exact reference's diagnostic JSON to local files under `Recast-Diagnostics-20261008`. Both have `stage: ai-generation`, `reason: provider`, `providerMessage: Invalid header value.`, `providerCode:null`, `qualityMode:high`, model `@cf/black-forest-labs/flux-2-dev`. This is a request-formation error, not evidence of Cloudflare FLUX.2 dev 3043 or fal's inference model failure.

Checked the authorized local `fal-key.txt` **without displaying the credential**: raw text length 78 versus trimmed length 72 (six surrounding whitespace characters); internal whitespace after trimming false. The initial `wrangler secret put FAL_API_KEY` operation had sourced this file directly via standard input. This strongly explains both production Authorization header failures. Do not print/share/commit the key. Fal wallet billing for failed requests has not been reconciled; since requests were rejected while building headers, they likely did not submit paid inference, but no categorical billing claim.

## Actual source change (in isolated source snapshot, not yet automatically deployed)
`src/fal-service.js` normalizes the secret once with `String(env.FAL_API_KEY||'').trim()`, rejects illegal internal whitespace/control characters and absurdly short credential, constructs a validated Web Headers object before recording any durable paid request claim or sending network traffic. The same validated Authorization header is used for queued status/result reads. No secret is logged or returned to the client. This makes future accidental trailing newline in Wrangler secrets harmless and fails closed if the key is malformed.

`tests/fal-provider-integration.test.mjs` now reads headers through the standard Headers API, preserving verification of no retries, secret safety and protected preview generation.

New `tests/fal-credential-headers.test.mjs`: (1) mock credential with trailing spaces+CRLF, confirm it is normalized for POST/status/result, returns a protected viable result, and uses exactly one billable attempt; (2) reject an embedded newline before writing any attempt claim or calling fetch. All fake tokens are obviously non-real.

## Validation actually performed
Targeted tests: **6 passed** (including new two tests), 0 failed.
Entire offline local Node suite: **404 passed**, no fails or skips; run 8.17 seconds. Wrangler `deploy --dry-run` passed. These do not themselves prove a new production success. In particular, do not ask owner to retry until the code is deployed and the release is verified.

## Pending next steps
Commit this small hotfix to a review branch based on GitHub main head `b178d68741828cf8da318cb4ea629687a70acaf4`; run GitHub security/customer CI; merge on green. Deploy actual Worker to production and record exact version ID, check admin-auth/public readiness and config secrets without logging their values. Then owner should run **one** authorized Model Lab fal test through the actual site within the prior $1 test allowance, inspecting output moderation, watermark, private R2 and saved result; ask for screenshot only if required. User's existing saved images and Shopify/Printful remain untouched. Do NOT switch fal on for public customers until this end-to-end test succeeds.
Rollback: prior Worker version `16c00106-b208-4521-a6e6-ff99ef4ef934` was last known after demo-button deploy; `5719409e-d92b-42da-ad1d-1fee081a0dd9` was the intermediate secret change. Confirm actual version before rollback. Keep flags `RECAST_HQ_PROVIDER=cloudflare`, `FAL_OWNER_TEST_ENABLED=true`, `FAL_PROVIDER_ENABLED=false`, `FAL_PROVIDER_VERIFIED=false` throughout owner canary.
