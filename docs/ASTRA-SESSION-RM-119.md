# RM119 — Preserve puppy facial detail in HQ reference photos (2026-10-11)

## Owner feedback and visual findings
Owner uploaded two more owner-generated RecastMeAi screenshots (Royal, Dinosaur Adventure) and the same original puppy photo. Both scenes and pet-only composition improved after RM118 (no unrelated explorer or vehicles); however the generator changes the real puppy's muzzle length, eye shape/head age and body posture. Royal makes the dog look older and almost human-posed; Dinosaur adds boots and anthropomorphic staging. Exact used provider in these owner images is not independently confirmed from screenshots. No private artwork or metadata accessed.

**Root image-quality bottleneck confirmed:** `public/app.js` previously resized ALL photo uploads to `max=500` px on the longest side *before either generator saw them*. The original owner's photo shown in chat was 1152×1536; it would be reduced to approximately 375×500 before inference. This drops visible eye, fur and muzzle detail that prompting cannot recover. The prior 500px limit is intentional for Cloudflare Workers AI FLUX.2 edit references (official limit below 512×512); blindly increasing that limit globally would break Standard and Cloudflare HQ backup. In contrast, fal FLUX.2 edit supports high-res references (input images resized to 1MP at inference). Pricing is $0.012 per rounded 1MP for input and output; submitting one input at <=1024px long side remains at or below the same one-input-image 1MP charge band. These provider documents should be rechecked if pricing changes.

## Work branch
Starting main revision after RM118 docs: `65fcf1db3c8468f1783fe51c3a4c7a774a14bfb1`.
Branch `recast/rm119-hq-reference-detail`.

## Implemented on branch (not yet a verified live likeness fix)
- `public/app.js`: preserves existing <=500px JPEG per photo as `image_0..3`. When High Quality is chosen, also prepares a <=1024px version `hq_image_0..3` from the *same original file*; no extra user step or extra image-render call. The full reference has around 4 times the source pixel area for typical portrait input; no upscaling beyond original size.
- `src/highquality.js`: validates optional detailed references, requires same count/indices as primary images, refuses malformed, overly large (>2MB) or Standard-only extra detailed inputs **before calling AI**. Uses detailed files ONLY when the upstream authenticated/policy-selected HQ provider is `fal`. Cloudflare HQ backup, Standard, browser legacy clients and social jobs still receive <=500px as before; branch/refinement images continue to work unchanged. Moderation and saved source reference use the *actual chosen* reference files (not a second billable inference).
- `src/identity-first-adventure-prompt.js`: concise default and pet-specific constraints now explicitly keep a puppy's juvenile face/muzzle/body, discourage human-style boots, torsos and upright poses; preserves the adventure scenes and details for all 48 filters without a new subject picker. No guaranteed facial identity lock or mask/inpainting.
- `src/provider-routing.js`: correct explanatory comment for unchanged conservative cost reserve estimate.
- Tests: `tests/adventure-prompt-audit.test.mjs` covers fal HQ picks detailed files with single inference, Cloudflare and Standard keep 500px; missing/mismatched/extra detail rejects without model request. `tests/simplified-creator.test.mjs` checks automatic dual resizing does not add customer steps.
- No new model or subscription, added model call, billing, quality allowance change, customer-facing complexity, photo download exposure, watermark/preview handling, Printful/Shopify, moderation policy or wallet credit change.

## Pre-merge and post-merge verification record
Pending. Initial PR CI, exact head SHA, Node pass/fail counts, full browser results, Wrangler dry-run, production Worker version and post-deploy public audit must be appended based on actual tool outputs. No live paid image renders, Printful orders or product purchase performed. Do NOT call this a proven improvement until owner compares same original puppy in HQ and Standard on live site.

## Remaining design risks / owner visual evaluation
- Larger input to fal is better *source information*, but FLUX.2 is still a generative full-image editor; exact eye placement, fur patches, ears and head shape can still drift. There is no mask/inpainting or separate face recognition service in this code.
- Royal should keep a four-legged puppy with royal cape and crown on its real anatomy; Dinosaur should use a pet harness/collar, dog paws, and retain puppy face proportions; no booted humanoid pose.
- The customer should have to upload only ONE photo. If the model still matures/reimagines the puppy, next steps are budget-checked masked editing/identity anchoring or different approved provider **only with owner authorization**; no uncontrolled paid retries or new questions.
- Need ensure upload format, Cloudflare fallback (<=500), fal detailed reference (<=1MP) and isolated real mobile/desktop browsers are still stable. 
- Rollback: revert final RM119 code commit/PR and gated Cloudflare deployment; preserve all R2 source and preview/history/credit/order records.
