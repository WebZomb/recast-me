# RM132 — Owner protected-head comparison (local, not deployed)

2026-10-11. Baseline main and origin/main: `35c709766745c2b7f37fcdc4c05e0a43b03c9e87`. Last verified production remains RM131 Worker `835f2a08-2561-4d46-a027-ebc43a4122ad`, customer app v286. Owner rejects manual customer cropping and approves trying the researched automatic mask + single scene generation + deterministic head restoration approach. This session builds the owner comparison, not a public engine replacement.

## Research and actual scope

Sources checked October 11:
- https://huggingface.co/docs/diffusers/using-diffusers/inpaint — masks alone can change unmasked pixels; source overlay forces preservation but may create unnatural transitions.
- https://fal.ai/models/fal-ai/sam-3/image/api — text-prompted masks, apply_mask false, inline outputs, scores. Listed segmentation cost $0.005/request.
- https://fal.ai/models/fal-ai/qwen-image-edit/inpaint/api — image + mask, inline output, safety check. Listed $0.03/MP.
- https://fal.ai/models/fal-ai/flux-pro/v1/fill/api — image + mask at matching dimensions, inline output, safety. Listed $0.05/MP rounded up. This is NOT FLUX.2 dev.

Production-provider quality, score calibration, actual head detection, queue callback roots and provider formats have NOT been exercised live. SAM prompt `head` is a candidate for humans/pets, not proven universal recognition. It may include background heads or miss ears/fur. All detected masks are retained; this does NOT implement semantic foreground/group selection. Wrong but confident masks can still pass geometric checks. No guarantee of all-photo support or pixel identity at original file resolution.

## Implementation

- `src/protected-face-edit.js`: owner-only one SAM request followed by one Qwen Inpaint OR FLUX Fill request; no retries/fallback. Uses private inline media only, strict acknowledgement URL checks, durable stage claims/job records, timeouts, maximum 7 masks (8 means possible truncation and fails), confidence >=0.5, coverage and dimension validation. Missing/uncertain/misaligned masks stop before paid scene generation. Each stage remains billable if already submitted, even on a later error. Submitted/ambiguous jobs are not replayed automatically.
- Normalize the entire reference onto a <=960px canvas, dimensions divisible by 32, with aspect-preserving contain/padding, not cropping or stretching. Two images used internally share coordinates. Request `head` masks; invert white head pixels into black keep regions for inpainting. Copy normalized reference RGBA pixels exactly within masks after generation; blend only a two-pixel outer seam. Encode private final PNG; existing independent output moderation and watermark/storage protection still apply. Previews are subsequently resized/watermarked/JPEG encoded, so display pixels are not claimed byte-identical.
- `fast-png` 6.2.0 pinned in package files for Worker-compatible PNG encode/decode. Header dimension/byte bounds checked before decode; normalized grayscale/RGB/RGBA/indexed PNG supported. No browser GPU or new service credentials required.
- `src/fal-service.js`, `src/owner-identity-comparison.js`, `src/router.js`, `src/preview-security.js`, `src/highquality.js`: two authenticated lab choices only; mandatory existing moderation and activation gates. Candidate-specific metadata `owner-protected-head-v1`; failures do not change public provider health. Shared daily generation limit counts one logical comparison; budget conservatively reserves at least 8 cents for its mask+scene. User-generated attempts can still incur platform processing and storage overhead.
- `src/provider-jobs.js`: distinguish SAM/Qwen/Fill ledger rows.
- `public/model-lab.html/js`: selectable Qwen and Fill protected-head tests, explicit mask+scene costs, uncut original upload, experimental limitations, source comparison. Limit visible results to four; release temporary resize canvas. Lab asset v287; customer app remains v286. Two tests nominally <=9 cents model cost total at <=1MP (3.5 + 5.5), excluding overhead. No paid test run by assistant.
- `tests/protected-face-edit.test.mjs`: real synthetic PNG/sharp pixel tests, mocked provider stages, source exactness, mask polarity, palette handling, no second stage on mask failure, no remote output fetch, no retry on rejected/uncertain dispatch, output dimensions/safety, durable duplicate claims, secured route moderation/storage/watermark, auth/activation/budget/call gates.
- `scripts/rm121-model-lab-audit.cjs`: six engine choices through actual local multipart uploads; mobile layout and four-result cap checked.

## Validation and deployment block

493/493 Node tests PASS (479 existing +14 new). Local Chromium 393px and 320px Model Lab tests PASS: six choices, correct host/detail uploads, no JS errors or horizontal overflow, results capped at four. Providers are mocked. Offline esbuild Worker bundle PASS (640.1KB uncompressed); git diff --check PASS. Real Worker runtime, Cloudflare Images normalization, WebKit/iPhone and hosted CI still need verification before publishing.

Automatic approval review rejected the Wrangler dry-run follow-up, stating that the dry-run could transmit the private Worker bundle/deployment metadata to Cloudflare without explicit disclosure authorization. Did not retry it, inspect its output to claim success, or use GitHub CI/deployment as a workaround. Continued with local-only esbuild, Node and local-browser verification. No Cloudflare dry-run/deployment PASS claimed. No GitHub push, PR, merge, deployment, paid render, order, fulfillment or service activation in this session. Need explicit owner approval to transmit/publish this concrete update to existing Cloudflare hosting, then run normal security/browser CI and guarded deployment.

## Next gate and rollback

After authorization, push a reviewable branch/PR, pass existing hosted security/customer CI including WebKit and Wrangler checks, then guarded deployment and exact live lab-asset verification. Owner tests original held dog first with Qwen, then Fill, same direction. Check actual mask/face inclusion, original pose/lighting, missing supporting person, seam, head size and scene. Never label synthetic test success as actual provider likeness acceptance. Customer HQ stays Nano v5 and Standard unchanged. No extra mug/sticker order needed (owner already tested both).

Rollback: remove the two owner lab choices and protected branch through a normal reviewed revert; no migrations or customer-artwork changes. Keep cumulative evidence. Existing FAL_OWNER_TEST_ENABLED gate still suspends these comparisons.

## Authorized release — 2026-10-11 20:40 UTC

Owner explicitly approved publishing after the prior approval block: “Yes build it, fix it.” No repeated escalation was needed. Local implementation commit `1c4526e4b876b331fb78928a3ae76cd38680fb8f`; GitHub PR #50 head `d3efc8ebdf59a729c65560432f1903e17f2a9200`, tested tree `76603f69674fec274d07935905897052de9b926e` exactly matches local implementation. Security CI `38172956113` and customer-policy CI `38172956029` PASS, including 493 tests, Worker bundle/dry-run, customer browser tests, owner lab WebKit/Chromium tests. Squash main `3d3dad08e0c78ae24d95a4ec16a6665c787e1229` has the same tree. Local tracked tree matched origin/main before synchronization.

Guarded deployment `38173165729` PASS: 493 tests, dry-run, deploy, read-only production smoke. Deployment logs report Worker `c97f1919-69d2-4608-8078-d42c03b51ca4` at 20:40:47 UTC. Existing provider secrets/configuration preserved by existing workflow. No paid image or commerce action.

Direct local urllib verification returned HTTP403 and the web retrieval tool could not access the lab; neither counted as a verification pass. Independently requested live UI verification succeeded in cloud browser: `/model-lab.html` redirects to `https://recastmeai.com/model-lab`, displaying both new protected-head choices, Qwen selected, fal host correctly disabled/selected, original upload, one-mask-plus-one-render cost notice, experimental limitations and Generate button. This verifies visible deployed controls, not authenticated provider inference or byte equality of live assets. No admin credential entry, photo upload or Generate click occurred.

Public launch audit `38173165737`: public production browser checks and product examples PASS at this receipt; isolated social-commerce check still running. Final audit result recorded separately. User can now perform owner visual tests; automatic head-mask quality and scene blending remain unverified on real photos.

Final public audit receipt: `38173165737` / job `114569881353` completed SUCCESS, including public browser audit, approved examples, isolated social purchase tests and retained evidence. No purchases or image generations performed. Ready for owner visual comparison, not declared a production-quality winner.
