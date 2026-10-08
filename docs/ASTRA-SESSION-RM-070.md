# RM070 — likeness across every world

2026-10-08. Baseline remote e1f26dea89c1722c606f9664c6514f7a03be97d0 (RM069 cache fix, Workers success previously observed). Owner requested strong recognizable identity for every person and pet in every filter.

Implemented src/highquality.js shared all-world identity rules in primary and simplified prompts. Both HQ and Standard use the primary builder. Explicit human geometry/age/texture and animal geometry/asymmetric markings apply to mixed groups regardless of subject label. Illustrated worlds use linework/shading rather than generic enlarged eyes or changed faces; monochrome preserves contrast/patch boundaries. Accessories must not hide identifying features. Original photos outrank drifted previous output. Person pose wording now defers to supplied views. Prompt version identity-all-worlds-v5. Models, dimensions, inference parameters, budgets, references, saved art and fulfillment unchanged.

Tests: all375 local tests passed, including model-boundary mocked requests covering six worlds across both modes with mixed-group subject label. Wrangler dry-run and git diff --check passed. No billable inference, orders or messages. Tests establish prompt delivery, NOT guaranteed model compliance or live likeness quality. Existing anime owner example shows recognizable pet but stylization; this was generated before the update. Do not claim every filter visually verified.

Owner screenshots at13:30–13:33ET showed successful Turnstile and completed original-photo and AI previews. This is owner-run happy-path acceptance, not adversarial verification. Owner intends to set TURNSTILE_REQUIRED=true; setting not yet verified. Moderation and X still require configuration and live acceptance. Earlier email receipt accepted by owner. No flags changed in this session.

Rollback src/highquality.js and generator test version/assertions together; preserves previously approved artwork. Deployment receipt follows.

Application pushed to main:1648bfcd05b0d19cfe258e1bce91e7ecb6b81f45; local equivalent cd4b8e8. At final poll Workers113452476513 and public-browser-audit113452466453 remained in progress. CI mocked-tests-and-bundle skipped; local375 tests are the evidence. Deployment not yet confirmed at this checkpoint.
