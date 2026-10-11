# RM128 — One-render removal instructions

2026-10-11. Baseline main d4c371817541c99eaf8f586db7dffe5c31f6b61b (RM127 documentation), runtime RM126 6fdb99df2c69b8bd81da01138edd22eeafd421e5.

Owner authorizes trying one render before retesting. Their accepted Football likeness remains the baseline; unwanted supporting torso/hands remain the problem. Uploaded prompt examples suggest explicit removal and reconstruction, but generic beauty enhancement or instructions to preserve all hands would conflict with this goal.

## Implementation
- Nano public recipe v4 retains the existing face-preservation paragraph verbatim, visible-original-face inclusion, pose, camera angle and close framing.
- Replaces contradictory outfit/background-only scope with explicit complete removal of excluded figures, including clothing, torsos, arms and hands; reconstruct only newly exposed areas naturally. Included subjects and their limbs remain protected.
- Shared Standard/legacy HQ adventure recipe receives the same conditional removal/reconstruction rule across all 48 styles. Illustration identity and scene integration rules retained in compact wording.
- Same existing provider request, no second cleanup render, classifier, automatic retry or model change. No change to orders, approved artwork or UI.

## Validation and limits
479/479 local Node tests pass. Regression covers auto, pet, person, mixed person/pet, group, couple and family for both prompt recipes. Existing all-48-style compact prompt budget remains passing. Initial tests caught old phrase assertions and a 2207-character prompt exceeding the 2200 budget; compacted wording, retained face visibility and no-cutout instruction, updated obsolete phrase assertions and reran successfully. CI/browser/deployment receipts pending.

Mocked tests verify instructions/routing, not actual removal or likeness. No assistant paid render, order, credit use, model activation or fulfillment. User should retest the same original Football photo with High Quality and Automatic inclusion after deployment; inspect both accepted face and absence of supporting people/hands. One render cannot guarantee these visually.

## Continuity correction
Owner confirms sticker AND mug orders were already performed. RM127's recommendation to place a sticker order must not be repeated as outstanding work without a specific unresolved failure; current supplier fulfillment status was not freshly checked. RM127 masked cleanup remains an unimplemented alternative, superseded for now by this authorized single-render experiment.

Rollback: revert RM128 source changes to RM126 runtime (keeping cumulative docs); restore Nano recipe v3 if owner sees likeness regression. Release commit and live receipts to follow.
