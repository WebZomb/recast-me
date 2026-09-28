# Recast Me — finish and launch

## This update
Reviewed the live site on September 28, 2026 and recovered current GitHub main 43d529c. Fixed the remaining preview-illustration crop, preserved complete images in process/history/merch cards, moved uploads first, added selected-photo thumbnails and removal, added Surprise me without overwriting the subject description, shortened the creation intro, enlarged secondary merchandise cards on phones, and improved keyboard/reduced-motion behavior.

The owner-only model comparison page is now at /model-lab.html, linked from Control Center → System. Each manual run uses the live generation pipeline after admin authentication. It displays model name, duration, settings and image. Public models remain unchanged. No live model comparison, purchase, X reply or production submission was performed. New endpoint tests verify authorization and the model allowlist.

## Step 1 — install this patch
1. Unzip recast-me-v1.9-launch-polish.zip and merge its folders into the repository root. Keep other files. Replace matching files.
2. Commit the uploaded files and wait for the Cloudflare GitHub deployment to succeed. Confirm it uses src/router.js.
3. Reload the site: the creation intro says “Make it yours,” photos come first, and Surprise me appears under world suggestions. Check the dog in “See your preview.”
4. Open /admin.html on the same site. Enter the existing ADMIN_TOKEN only into that private page; never send it in chat. If none is configured, create it as a Cloudflare encrypted Worker secret using your own password manager, then reload. Do not put secrets into GitHub.
5. In Control Center → System, check AI, storage, Shopify, Printful and image-processing readiness. Share a screenshot with secret values excluded. This is the next guided checkpoint.

## Step 2 — choose the volume engine from real results
Use Control Center → System → Compare rendering engines. Same reference photo and descriptions, one selected engine per click. Run dev, klein9, then klein4. Repeat with a dog, a person + dog and a couple + dog. Test costumes and face/marking preservation. Record successful results per attempt and timing. Each run is billable and may receive the existing same-engine retry for certain errors.

The lab compares actual production modes: dev at 1024×1280/18 steps; both klein models at 768×960. It is not an equal-resolution benchmark. It does not change the public engine.

Illustrative inference costs at an identical 1024×1024 output and one reference fitting within 512×512, before shared free allowance, infrastructure, retries and taxes:

| Engine | One attempt | 10,000 attempts |
|---|---:|---:|
| FLUX.2 klein 4B | $0.001207 | $12.07 |
| FLUX.2 klein 9B | about $0.0155 | about $155 |
| FLUX.2 dev, 18 steps | $0.03330 | $333 |

Calculated from published prices, not measured invoices. Current HQ portrait output is larger and costs more. The $5 Workers base plan does not include unlimited AI usage. At 1,000 people × 20 daily attempts, even the 4B example costs about $24/day in inference before other costs/allowance. Quality/retry rate can change the economics substantially.

Proposed route after testing: inexpensive previews if likeness is good enough; an explicitly chosen higher-quality option when desired. Always sell the exact approved image; a new premium render requires fresh approval. Do not silently switch models or replace purchased artwork. There is no verified unlimited/free high-quality rendering solution.

## Step 3 — build volume protection before broad promotion
Still required, not implemented by this visual patch:
- Durable background render jobs with polling/resume so closing Safari does not lose an in-flight result. Stable job IDs and idempotency must prevent duplicate billable submissions.
- Server-enforced allowance (initial target 20 successful previews/day per verified customer), separate owner/social allocations, concurrent-job limits, and a total spending ceiling. Anonymous browser IDs alone are insufficient protection.
- Turnstile is supported in code; configure its public site key and secret as appropriate and test it. It does not replace a budget or queue.
- Monitor provider quotas, inference latency, failure rates and cost per usable picture. Arrange capacity increases if load tests show throttling.
- Track preview-to-product clicks and completed purchases. Adjust allowances from real conversion and margin data.

## Step 4 — prove a complete sale
1. Confirm Shopify/Printful credentials in Control Center. Do not enable automation just to turn a status green.
2. Verify product prices, variants, shipping and all Printful SKU mappings.
3. Generate a real product mockup from one selected Artwork ID; inspect placement for poster, mug and apparel.
4. Run a controlled Shopify test purchase. Confirm the right image, paid order ingestion, private status link and authorized digital download. Verify an unpaid visitor cannot download clean art.
5. Configure the Images binding used by print finishing and social watermarks. Resizing alone cannot create missing image detail; inspect the actual print-ready file and order one sample before scaling sales.
6. Enable paid-order sync after successful tests. Keep physical production approval manual initially. ORDER_SYNC_ENABLED is false in the checked repository.
7. Confirm privacy/deletion behavior, shipping/refund copy, support contact and retention cleanup. RETENTION_CLEANUP_ENABLED is false in the checked repository.

## Step 5 — connect @recastmeai
Use the existing X pipeline, currently disabled. Set up developer API access and credentials with the required mention-read, media-upload and reply permissions; verify current X access costs and automated-reply rules before enabling it. The profile automation label alone does not activate the bot.

Test one controlled attached-photo request: mention → saved image → watermarked reply → purchase page for that exact image. Verify missing-photo handling, duplicate prevention, private-token protection and the separate social budget. Only then enable X_BOT_ENABLED and X_BOT_APPROVED. Never publish admin or clean-art access tokens. Trend scanning can wait until this core loop works.

## Step 6 — iPhone app
Finish and test the website purchase/rendering loop first. Then build an iOS client with native photo picking/camera, saved creations, render-job resume/notifications and sharing. A simple website wrapper may fail Apple's minimum-functionality rule.

Use the existing Apple Developer membership if active. Build and sign with Xcode, test on TestFlight, prepare privacy disclosures/screenshots/support URL and submit to App Review. Physical merchandise uses ordinary checkout; digital artwork/render credits need a separate App Store payment design based on distribution regions and current rules. Do not assume the website's digital checkout can be copied unchanged. Approval is not guaranteed. No iOS binary is built or submitted in this patch.

## Sources checked September 28, 2026
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/
- https://developer.apple.com/app-store/review/guidelines/

Repository defaults are not proof of live dashboard settings. The Control Center status check is the next step for identifying exactly which connections remain.
