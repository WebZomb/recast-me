# RM118 — Fresh-photo replacement and foreground identity discipline (2026-10-11)

## Customer evidence and baseline
Owner supplied a Recast Dinosaur Adventure preview with an older explorer, a dog and two SUVs, alongside a source photograph of one close-up puppy. This is a visible mismatch: the pet is small, and the result introduces unrelated co-stars. We cannot infer exactly how many photos were submitted without reading private job metadata; never claim proven causation or inspect user media unnecessarily.

Base: GitHub main `7a129d62a6642d9de8cf3b2462374530860a3a97` at start of this session; branch `recast/rm118-fresh-photos-subject-focus`. Previous live Worker `efdeb2c1-5544-4487-93e6-03c8a2fae3b2` from RM117; RM117 live public audit was green. User does not want another photo-classification question, extra subscriptions, long prompt walls, or a separate paid inference just to guess photo contents.

## Evidence-based diagnosis
1. **Confirmed frontend bug:** `public/app.js` had a photo `change` handler that took `selectedPhotoFiles`, appended any files from the next picker selection and resent up to four. Picking a new puppy photo after a previous session could silently include earlier photos of a person/car in the **same render**. This is a source-level fact; whether it happened in the owner's exact pictured render is unverified.
2. **Prompt risk:** `subject=auto` referenced pet, person and vehicle guidance together. Even when intended as alternatives, the image-edit model may invent those unrequested characters. There is no verified vision classifier or masked face preservation at present; a prompt cannot guarantee exact likeness.

## Actual proposed code change on branch
- `public/app.js`: a newly chosen file selection **replaces** old selected photos, not silently merging them. Up to four *explicitly multi-selected* photos still work in the same picker action, with the existing per-thumbnail Remove buttons. No new customer form question.
- `src/identity-first-adventure-prompt.js`: compact default/automatic mode explicitly limits foreground cast to source-photo main subjects, treats a cropped hand holding a pet as context rather than another character, selects pet-vs-person wardrobe as **mutually exclusive** alternatives and keeps existing source subjects large and recognizable. The same shared prompt continues to reach fal FLUX.2 HQ, Cloudflare HQ fallback and Standard Klein across all 48 worlds. Specific requested background settings still apply.
- `tests/adventure-prompt-audit.test.mjs`, `tests/simplified-creator.test.mjs`: assertions for new no-extra-subject default and fresh-photo replace. `scripts/rm050-browser-tests.cjs`: real WebKit/Chromium browser regression: select two images, select one new image (expect exactly one, no stale thumbnail), then explicitly select two together (expect two).
- No model/config/provider keys, quality balances, pricing, purchase/credit wallets, previews, Printful fulfillment, watermark/approval, human check, safety rules, fallback or backend photo storage changed.

## Verification, rollout and remaining risk
Initial state: branch changes proposed; no independent CI evidence or live deployment yet. Update this section with actual PR SHA/actions/tests/Worker version only after each occurred. No real AI image inference, customer credit deduction, order, subscription, payment or external classifier call authorized or performed.

**Crucial owner acceptance test:** Select only one puppy photo and create Dinosaur Adventure. Verify exactly ONE uploaded thumbnail before the render; there should be no adult explorer or SUVs. The dog must dominate the composition and retain its actual eye placement, ears, muzzle and fur markings. Compare HQ on the same input only after owner approves the credit/cost. An identical face still cannot be guaranteed with current free-form full-image FLUX.2 edit; selective mask/segmentation and the available provider features need separate investigation and explicit cost review. Avoid claiming face fidelity fixed from mocked tests.

Rollback is to revert the eventual PR and guarded deployment, never delete the last-four artwork records or stored R2 originals/credits.
