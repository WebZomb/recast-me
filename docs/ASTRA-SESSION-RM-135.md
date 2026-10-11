# RM135 — Concise face-first Nano and FLUX comparison

2026-10-11. Baseline HEAD be30c564bd7fd4f7bb3e0c1ac89a7ef748cfdd52 / runtime RM133 ebcaacac97dbf6fdb8c5cda90ff1f531e536da8a. Includes previously local RM134 research notes. Owner authorizes prompt refinement, Nano/FLUX lead-and-backup comparison, keeping Standard. Latest instruction favors refining working native editors over adding segmentation. No mask stage added.

## Research and decision

Google's current original Nano model page lists 65,536 input tokens; this is not a quality-optimal word count. No documented universal word threshold for identity collapse found in the reviewed primary docs. fal's input schema does not specify an optimum. Do not claim 75/100/150 words is a manufacturer limit. Current Google image guide favors explicit detail preservation and specific edits; BFL character/clothing guides explain preserving identity while changing scene/clothes. Conflicting pose/crop instructions are a concrete defect in our v5 prompt, independent of length.

Sources checked: https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image ; https://ai.google.dev/gemini-api/docs/image-generation ; https://fal.ai/models/fal-ai/nano-banana/edit/api ; https://docs.bfl.ai/flux_2/flux2_image_editing ; https://docs.bfl.ai/guides/usecases_editing_character_consistency ; https://docs.bfl.ai/guides/usecases_editing_clothing_tryon . Prompt-only revisions cannot guarantee exact likeness.

## Changes

- `src/customer-identity.js`: Nano v6, identity details first (eyes/spacing, nose/muzzle, mouth/jaw, ears/hairline, skin/fur/marking boundaries, age/expression). Single original-pose/framing direction. Removed forced crop/head-and-upper-body recomposition, repetitive prohibitions and duplicated reference sentences. Preserved full scene/outfit/finish for all 48 guides, subject overrides and reference-branch distinction. Default automatic adventure prompts now 148–187 whitespace-delimited words (Royal 160); lab Royal custom example 125 words. These are measured recipe lengths, not empirically proven optima. Customer extra instructions are still respected under existing character limits, not silently truncated to a word budget.
- `src/owner-identity-comparison.js`, `src/highquality.js`, `src/preview-security.js`: owner-only `promptRecipe=concise` for Nano/dev-edit invokes the same concise identity builder; default/missing recipe uses unchanged earlier owner v1 control. New metadata `owner-identity-concise-v2`. Invalid recipe/engine combinations rejected before paid calls. No provider/model/steps/resolution changes.
- `public/model-lab.html/js`: Nano first/default, FLUX dev second. Recipe chooser defaults concise with earlier control available. Removed duplicate face instructions from editable outfit default. Older Qwen/Fill tests explicitly discouraged after quality failures; no longer default or recommended next action. Existing options remain for owner diagnostics. Original photo unchanged, automatic subject type, one generation per native edit, no added retries. Four-card cap retained. Cache v289.
- Tests validate all guides, intended group handling, absence of forced-crop conflict, actual endpoint requests for both recipes with detailed original bytes, one generation, moderation and protected owner selection. Mobile audit checks recipe submission.

## Tests and limits

20 targeted tests PASS; full 499 Node tests PASS. Local Chromium 393/320px model-lab audit PASS, including all six tested choices, original photo dimensions, recipe selection, no JS errors or horizontal overflow. `git diff --check` PASS. Tests are mocked and do not establish likeness or removal quality. No paid generation, orders, credential changes, service activation or moderation changes. No new automated fallback: Nano remains provisional lead; FLUX.2 dev is a backup candidate pending real visual acceptance. Standard Klein 9B unchanged. Current CF backup verification is false; do not enable automatic routing without acceptance. No duplicate-charge retry after an ambiguous/accepted job.

Deployment pending receipt. Rollback: revert this session's runtime/UI changes through normal guarded release while preserving research notes. No data migration or approved-artwork regeneration.

PR #52 initial head d9fb84d25153c79e4f99b50e87513a74a5e30516: security 38177736615 passed; customer-policy 38177736644 failed because the older broad browser audit expected the demo button to select dev. New intended default is Nano/concise. Corrected the stale assertion in scripts/rm050-browser-tests.cjs and added recipe assertion; no runtime change made to bypass the gate. Hosted checks rerun on the corrected commit.

## Release receipt

PR #52 corrected head 27205c14f55774f6d0fb24a22fb982e3db3747a8, tree 4e625ab65a3259e956720063f65ff49843d22749. Security 38177935563 and customer-policy 38177935571 PASS including hosted mobile checks. Squash main 4dc83bf3f09c11dc3b0c37eea2d7b5f758cbd9ad. Guarded deployment 38178129636 PASS (499 tests, dry-run, deployment, read-only production smoke). Worker fdd4ddaf-7f3c-46ff-845e-167e5092fe7f. Live browser verified https://recastmeai.com/model-lab defaults to Nano and concise face-first, exposes FLUX dev and earlier control, and warns about the older protected experiments. No photo submitted and no paid calls. Public launch audit 38178129741 still running at this receipt. Actual revised-prompt quality awaits owner visual comparison; no claim of solved likeness/removal or validated backup.
