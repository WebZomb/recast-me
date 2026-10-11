# RM121 — Face-identity research and controlled owner comparison

Date: 2026-10-11. Baseline `3f4f224c72f67ecd2769d517c055d3afd191244e` (RM120 source + release evidence). Branch `recast/rm121-identity-comparison`. Owner asked to research existing/alternative engines, preserve faces accurately and keep costs low. Implementation/release SHAs and deployment evidence appended after CI; this section does not claim live deployment or better likeness.

## Evidence and decision

Owner's Royal and Dinosaur screenshots still show facial drift compared with the original puppy: changed muzzle, eye proportions and apparent age; the Dinosaur outfit has human-like boots. This is a visual observation, not a proven attribution to one parameter. RM119/120 fixed reference detail/refinement handling but cannot guarantee likeness.

Production remains fal `fal-ai/flux-2/edit` (FLUX.2 dev), 18 steps/guidance 5, 1024x1280; Standard remains Cloudflare FLUX.2 klein 9B at 768x960. Confirmed comparison-page defect: its own upload preparation still downscaled all references to 500px, unlike the customer HQ uploader. Auto adventure prompts include both human and animal costume alternatives; potential bleed is a hypothesis, not established causation. No public prompt or model is switched in this change.

Official sources checked 2026-10-11:
- https://fal.ai/models/fal-ai/flux-2/edit — $0.012 per input/output megapixel, input resized to 1MP. Existing conservative one-photo 1024x1280 budget estimate is $0.036. Actual invoice rounding should be checked in a live pilot.
- https://fal.ai/models/fal-ai/flux-2/edit/api — default guidance 2.5, default steps 28; no documented mask, denoise strength or identity-lock parameter. Guidance controls adherence to text, not a guaranteed face lock.
- https://developers.cloudflare.com/workers-ai/platform/pricing/ — Klein9B $0.015 first output MP, $0.002 subsequent MP and $0.002 per input MP. CF dev is priced per tile and step, so its cost changes with steps.
- https://fal.ai/models/fal-ai/nano-banana/edit — original Gemini 2.5 Flash Image, $0.039 per image, available through the existing fal provider. https://fal.ai/models/fal-ai/nano-banana/edit/api documents base64 inputs, inline output, one-image limit, safety tolerance and 4:5 aspect ratio. Output schema has images and description, NOT a has_nsfw_concepts verdict.
- https://developers.googleblog.com/en/introducing-gemini-2-5-flash-image/ — manufacturer describes character consistency and targeted edits; this is not independent evidence of exact pet likeness. This is the first low-cost challenger selected for real testing, not a declared winner.
- https://fal.ai/models/fal-ai/flux-pro/kontext — $0.04 per image and character-consistency editing; second candidate if needed, NOT integrated here.
- https://fal.ai/models/fal-ai/qwen-image-edit-2511 — $0.03 per MP (not $0.03 flat at all sizes); promising consistency, NOT integrated here.

Masking/compositing could preserve original face interior pixels while generating clothing/background around them. That requires reliable head/ear/fur selection and edge blending, retains the photographed head angle, and conflicts with full illustration restyling. No segmentation service, face swap, masked pipeline, LoRA or extra paid pass implemented. Human-face embedding tools should not be assumed suitable for pets. Do not promise pixel-exact identity from a natural-language edit instruction.

## Implemented

- `src/owner-identity-comparison.js`: two allowlisted owner recipes: `dev-edit` (existing fal model, shorter constrained editing prompt, 2.5 guidance/28 steps), and `nano-banana` (same short prompt on the original Nano Banana). Only fresh custom-direction tests; no prior-artwork refinement in experiments.
- `src/preview-security.js`, `src/router.js`: owner authentication and existing `FAL_OWNER_TEST_ENABLED` gate before experiment selection. No form/query field on a public route can enable experiments. Correct owner quality mode is selected before provider routing/budget. Nano reserves at least its explicit $0.039 estimate plus existing buffer/minimum. Existing daily limits and watermark/protected storage continue.
- `src/fal-format.js`, `src/fal-service.js`: reuse one-submit durable queue ledger and strict provider callback allowlist; candidate-specific queue roots; inline image-only responses; no public output URL fetching; one image; Nano safety stays enabled, mandatory existing input/output moderation; native image dimensions verified via Images binding. Existing FLUX safety array remains mandatory. Candidate job metadata contains actual endpoint; candidate failures/success do not alter public fal/provider render health. No retries/fallback to another model.
- `src/highquality.js`: preserve real candidate model and prompt version in private saved metadata. Public generation recipe unchanged.
- `public/model-lab.html/js`: original reference displayed; fair <=1024px fal reference + <=500px CF copy; baseline FLUX / edit FLUX / Nano choices, explicit per-image cost and one-click-one-generation notice. Actual provider/model/prompt version shown with each result. Original engine modes still available; CF-compatible references retained.
- `tests/owner-identity-comparison.test.mjs`: behavior coverage for auth/activation/moderation gates, public-forgery isolation, full-detail input, one submission, metadata, no provider-health pollution, rejected safety/untrusted callbacks/remote output, and call limit.
- `scripts/rm121-model-lab-audit.cjs` and customer CI workflow: local mocked mobile browser checks for original preview, four selections, prepared pixel sizes and layout; no real account/provider access.

## Validation and spending

Initial targeted existing fal tests 15/15 PASS; new tests 9/9 PASS. Full suite 468/468 PASS; Wrangler dry-run PASS. First local browser launch failed because bundled browser binary was absent; initial latest-browser download was corrupt/unavailable. Retried an isolated pinned Playwright 1.51.1 installation; final browser evidence appended below. No failed browser check is described as a pass.

Zero paid image calls, purchases, new subscriptions, fulfillment or messages. Both connected Desktop Commander PCs were offline (primary last seen 9h ago); no usable authenticated owner render session available here. GitHub permits code deployment but does not supply the private admin/FAL secret. Never extract CI secrets, weaken admin authentication or add a public testing bypass to run a pilot.

## Next acceptance gate

Use the owner's original puppy (not a screenshot of generated art), identical Royal and Dinosaur descriptions, baseline FLUX / edit-recipe FLUX / original Nano Banana: six outputs about $0.222 generation cost by current estimates. Then the same three-way comparison on a consenting adult portrait: total nine outputs about $0.333, with a proposed $0.50 pilot cap. One run per click, no automatic retry, stop on pending/error. Require explicit owner pilot authorization before these billable runs; none executed in this session. Check eyes, muzzle/nose, head geometry, age, ears, unique markings, anatomy, scene and cost per acceptable image. This small pilot is triage, not statistical proof across all 48 styles, group shots, skin tones, animal types or illustrations. Repeat the winner on harder samples before any public switch. Exact pixel preservation needs a separate masked/composited design if these fail.

Rollback: revert the eventual RM121 source merge through guarded deployment. Public recipes remain at RM120; no customer data deletion or migration. Existing owner test flag can suspend lab fal access without changing public configuration.

### Local validation update
- 468/468 Node tests passed again after final budget-estimate wiring. `git diff --check` clean.
- Local Chromium mobile checks PASS at 393px and 320px: original preview, all four model choices, 768x1024 detail vs 375x500 CF copy, single intercepted request, result metadata, no page errors or horizontal overflow.
- Browser test initially waited on stale prior-result status; fixed to wait for incremented result count, and UI now immediately shows photo preparation status.
- WebKit binary downloaded but host lacks shared libraries; system dependency installation failed due container setgroups permissions. No escalation/workaround of controls attempted. Full WebKit test remains required in existing GitHub runner, which installs its own dependencies.
- `src/provider-jobs.js` now labels Nano jobs accurately in the owner ledger (previously every row was hardcoded FLUX.2 dev).
