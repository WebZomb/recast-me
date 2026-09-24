# Recast Me v1.1 — High-Quality / Quick generation modes

This patch implements the approved generation workflow.

## Customer choices
- **High-Quality Preview — recommended**
  - FLUX.2 Dev
  - 18 inference steps by default
  - stronger likeness / prompt-following / detail
  - slower
  - does NOT silently downgrade to the quick model if it fails
- **Quick Preview**
  - FLUX.2 Klein 9B
  - fast fixed 4-step model
  - lower detail / likeness accuracy
  - may use Klein 4B only as a quick-mode fallback

## Failure behavior
- A failed generation stays on the preview screen.
- Customer can retry the same quality.
- Customer can switch High-Quality ↔ Quick directly from the error card.
- Prompt, photos, subject, world, and consent stay in place.
- A successful old preview is never erased before the replacement succeeds.
- `Keep last preview` is available if a later attempt fails.
- Browser/server diagnostics from v1.0.2 remain enabled.

## Mobile preview fix
- Preview frame is locked to site width on mobile.
- 4:5 generated artwork is contained inside a 4:5 frame.
- Canvas can no longer overflow the page width.

## Cloudflare variables
Added:
- IMAGE_MODEL_HIGH_QUALITY=@cf/black-forest-labs/flux-2-dev
- IMAGE_MODEL_QUICK=@cf/black-forest-labs/flux-2-klein-9b
- IMAGE_MODEL_QUICK_FALLBACK=@cf/black-forest-labs/flux-2-klein-4b
- IMAGE_HIGH_QUALITY_STEPS=18
- IMAGE_HIGH_QUALITY_GUIDANCE=5
- IMAGE_QUICK_GUIDANCE=4

The GitHub-connected Cloudflare deploy should read these from wrangler.jsonc.

## Upload
Extract the small patch ZIP and upload the contents to the root of `WebZomb/recast-me`, preserving `public/` and `src/`, then commit to `main`.
