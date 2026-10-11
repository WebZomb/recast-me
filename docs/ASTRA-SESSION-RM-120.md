# RM120 — Saved refinement identity and provider compatibility (2026-10-11)

## Baseline and recovered state
Baseline main `ffdc4f9a7f9b80fc405fc1a21fe5e9d9d85836f0` (RM119). Read cumulative handoff and RM116–119 records; recovered relevant prior Recast conversation decisions. Latest code includes two-step Photos/Style flow, replaced photo selections, and detailed fal HQ references. Owner asks to continue building toward launch with minimal customer effort and recognizable actual faces. Remote PC offline; GitHub and public site reachable.

## Confirmed defects and changes
- `src/highquality.js`: saved `inputCount` included the previous generated artwork. Refining a refinement restored that artwork as if it were an original photo, accumulating generated identity references. New `originalInputCount` explicitly separates original identity anchors from the final continuity image. Repeated new refinements keep originals plus only the immediately previous artwork.
- RM119 stores detailed fal references, but the restoration path sent those directly to Cloudflare Standard/HQ backup. `src/refinement-references.js` preserves fal HQ detail and inspects restored Cloudflare references, scaling only oversized files to fit 500x500 through the existing Images binding. Stored originals retain their full available detail, even after a Standard refinement.
- Missing original references or image preparation failures stop before inference instead of silently dropping a subject or using generated artwork alone. No new customer field, model change, automatic inference retry, or separate classifier.
- Legacy metadata without the new count excludes its final previous-artwork slot. Older chains already containing multiple generated references may still have historical contamination; this does not retroactively identify or repair such files. Re-uploading the original resets that case.
- `tests/generator.test.mjs` and `tests/refinement-references.test.mjs`: repeated chains, retained source bytes, provider-specific preparation, legacy counts and failures before inference.
- `tests/simplified-creator.test.mjs`: baseline failed 1/454 due to hardcoded UTC calendar date in a local-time display assertion. Compare both formatted reset timestamps using the same local timezone instead. Customer date behavior unchanged.

## Verification performed
- Baseline: 453/454 local Node tests passed, one timezone-specific assertion failed.
- With fixes: 459/459 local Node tests pass, zero failed.
- Read-only current production smoke: homepage 200/branded; readiness 200 with local/HQ/Standard ready; model status 200; anonymous admin 401. This was BEFORE the new deployment and does not verify paid generation, remaining personal credits, or identity quality.
- Build/CI/PR/deployment evidence pending; append actual results below.

## Costs, limits and rollback
No live AI image generation, payment, credit mutation, order, message, key or subscription change performed. Existing Images binding `.info()` is free; oversized restored Cloudflare references require image transformations under the existing service billing, not extra generative AI calls. API verified against https://developers.cloudflare.com/images/optimization/binding/ on 2026-10-11. No changes to daily allowances, provider budget/selection, watermarked previews, four-version retention or commerce.

Automated mocked tests cannot establish actual face likeness. Owner acceptance still requires same-photo real HQ/Standard results. Other launch gates from earlier records remain: paid checkout/fulfillment/tracking acceptance, credit-pack activation/payment/refund gates, Shopify branding/support, and X testing/approval. Do not describe those as complete.

Rollback: revert the eventual RM120 code merge and use existing guarded deployment. No customer objects are deleted. Old code ignores `originalInputCount`; rollback restores the prior refinement risks.

## Final release evidence — 2026-10-11 UTC
- Exact reviewed PR #40 head `4eb99c594be67169c957ab3af9e0005f4c1c94b2`; GitHub source was fetched and compared with the tested local tree (identical). Security Actions `38150583525` SUCCESS; customer-policy WebKit/Chromium Actions `38150583540` SUCCESS with no browser failures. Local Wrangler dry-run passed. Additional America/New_York timezone regression: 9/9 creator tests passed.
- PR #40 squash merged as `6a0670b3c31a580c98b05c819e553955ee85b5f4`.
- Guarded Cloudflare Actions `38150778495` SUCCESS: 459 tests, dry-run, deployment and production read-only smoke. Worker version `f1f514fd-4f5c-4888-9b2d-df398a6f286a`, deployment 2026-10-11T15:19:51Z. Homepage/readiness/models HTTP200; local/HQ/Standard ready; anonymous admin HTTP401.
- Public launch audit Actions `38150778493` SUCCESS: live public browser checks, published product examples and isolated mocked social purchase flow all passed. No live generation or payment in these workflows.
- No real facial-likeness comparison performed. Zero paid renders, orders, messages or personal credit changes in this session. Remaining launch gates above are unchanged.
- Resulting implementation SHA is the squash merge above. A documentation-only evidence commit does not trigger the guarded Actions deployment; the separate Cloudflare Git integration may still rebuild identical application source. Rollback implementation by reverting `6a0670b` through guarded CI/deployment.

### Final serving-version reconciliation
The public audit and direct health endpoint returned `c0516cb4-844d-426f-a8a4-336aaeee53c9`, not the initial Actions version. GitHub check `114503845286` (Workers Builds: recast-me) confirms a second successful Cloudflare-native build of the SAME merge SHA `6a0670b`, completed 2026-10-11T15:20:23Z, with exactly that version ID. Thus the live audit was on the correct new source. Both GitHub Actions and native Cloudflare build integrations are active; deduplicating deployment triggers is a future configuration cleanup, not performed here. One Python cache-busting health request returned HTTP403; the ordinary Node fetch succeeded with the matching version.
