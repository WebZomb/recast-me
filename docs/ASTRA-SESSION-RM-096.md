# RM096 — optional fal FLUX.2 dev host and controlled routing (staged, not live)

October 9, 2026 UTC. Baseline main `93488b18b96137ebcf2fa8fb37602df2f6351cb5`. Work developed in isolated `rm094-provider-build` copy of this exact source; no production deployment or payment/order/fulfillment action in this session before the separate deployment receipt is recorded. Previous session docs RM077–RM087 are local on the owner PC and were consulted, not presumed merged.

## Owner requirements
Preserve existing HQ FLUX.2 dev quality, subject identity, approved content screening, protected previews, 3 free HQ/5 Standard/3 paid-order bonus credits, Shopify/Printful flow and last four browser versions. Use cheapest verified healthy host per request; do not silently substitute a weaker model, charge duplicate generation, bypass screening or generate a paid health probe for every visitor. High-quality production host remains Cloudflare until an owner-approved live activation. Standard, social and commerce remain unchanged. Pricing estimates are not invoice guarantees.

## Observed live fal evidence (all on owner's PC, not on production site)
- Owner funded fal with one-time $10 credit balance and left auto top-up OFF. Test key is kept locally only. Do not commit or print it.
- First fal queued test returned HTTP200 with a provider request ID but no immediate image; recovered with official `@fal-ai/client`, whose normalized status URL uses `/fal-ai/flux-2/requests/<id>` (not `/edit/requests/<id>`). Completed job returned a 1024×1280 JPEG and provider safety flag `[false]`; result stays private/local.
- Actual long application Royal prompt (~6,411 characters) produced a strongly cartoon-stylized dog on a blank background with weaker apparent likeness. One later request was submission-uncertain after a fetch failure, with no confirmed new job ID; receipt preserved and not blindly replayed. Dashboard originally showed $9.96 after first generated output; subsequent exact charges not reconciled in this record.
- An explicit 762-character photoreal Royal prompt generated a natural-looking dog in a palace scene. The actual compact prompt builder then generated a 1,429-character request and also returned a 1024×1280, photographic Royal scene with recognizable Jack Russell features, fitted royal cape/crown and real palace background. These are owner quality checks, not guaranteed reproduction of exact markings or quality across every World.
- Original photo is the already-public Jack Russell demo. No customer photo or credentials added to GitHub. No X post, Shopify checkout, supplier job or order created.
- Owner's approved pilot balance remains constrained to $1 in verification renders. There is no automated retry or hidden subscription. Provider request receipts and private images remain on the authorized computer, not committed.

## Actual source changes prepared in this branch
1. `src/fal-format.js`: immutable, validated one-output mapping from existing FLUX.2 multipart to fal FLUX.2 dev edit JSON; preserving input order, dimensions, guidance, steps; requires inline JPEG and explicit safe provider verdict.
2. `src/fal-prompt.js`: shorter, front-loaded subject identity and World instructions for fal-only HQ. Original Cloudflare prompt remains unchanged.
3. `src/fal-service.js`: optional server-side fal queue submission with one accepted request ID, strict provider URL whitelist, secure inline result validation, read-only status polling, a durable R2 diagnostic receipt and no implicit retries/model switch. Marks ambiguous results/pending jobs for reconciliation instead of submitting a second billable attempt.
4. `src/provider-routing.js`: provider-specific read-only health snapshots, price estimates and explicit fal/cloudflare/auto selection. Auto requires Fal owner verification and will not treat Cloudflare as recovered merely because its cooldown expired.
5. `src/preview-security.js`: provider selection occurs **inside existing protected generation guard** and before credits/AI reservations. Adapts conservative daily reserve per route; owner-only model lab may opt into fal behind `FAL_OWNER_TEST_ENABLED`. Admin-only provider status read endpoint. Default Cloudflare behavior untouched.
6. `src/highquality.js`: propagates actual host provenance into protected metadata; fal-only compact prompt for HQ. Existing no-retry, content screening, credits and image storage remain.
7. `src/render-health.js`: isolates fal and Cloudflare HQ circuit cooldowns so one failing host does not automatically pause an otherwise verified host.
8. `public/model-lab.html`, `public/model-lab.js`: owner-only host choice for the dev model, with fal test opt-in; no new public customer switch.
9. `tests/fal-provider-integration.test.mjs`: self-contained simulated fal queue using public demo WebP and synthetic JPEG. Verifies screen→one dispatch→private save→watermark→credit settlement→recovery; safer than committing real provider image pixels.

## Activation is intentionally gated
Defaults: Cloudflare HQ. `FAL_API_KEY` must be stored as a Cloudflare **secret**, not code/config. Required owner flags: `FAL_OWNER_TEST_ENABLED=true` for private test; `FAL_PROVIDER_ENABLED=true`, `FAL_PROVIDER_VERIFIED=true`, and `RECAST_HQ_PROVIDER=auto` for later public routing. `CF_PROVIDER_VERIFIED` must remain false until Cloudflare model recovery has been independently confirmed. No automatic fallback should treat a timeout or uncertain accepted job as a reason to start another payable generation.

## Validation and remaining gates
Test and deployment receipts must be appended separately once completed; prior baseline 378 tests/Worker dry-run passed in RM076, and local RM094-stage 382 tests and dry-run passed before the latest health/owner UI changes. Tests with mocked providers are not live checkout, image-quality, worker-network, privacy, shipping or successful rendering evidence.

**Do not declare launch-ready yet**: run final full unit suite + Worker dry-run after final edits; verify the optional path on Cloudflare's runtime with real key and actual input/output moderation, protected Images watermark, private R2, credits; inspect actual client UX/timeout and admin recovery, confirm fal consent/privacy disclosure before customers' photos are transmitted there. Customer provider switching stays disabled until those checks pass. Existing separate production/order/shipment acceptance gates still apply.

Rollback: revert this isolated PR (or set all fal routing/owner flags false to restore original Cloudflare path); no changes to existing artwork, Shopify, Printful, daily credits or database migrations are required. Never publish a raw API key, signed upload URL, customer photo, personal transcript or local rendered image.
