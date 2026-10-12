# RM137 — Align automatic customer presets with accepted lab wording

2026-10-12 UTC / Oct 11 New York. Baseline `de5c35a02af3445d298a6c42395129d3fd25b4c4`; live runtime `88332a8853b31be2baf861b6214d1ba4aa7a7101` (RM136).

## Owner evidence

Normal-site Dinosaur screenshot RC-MV4NSMCQ-81AD92 preserves puppy face reasonably but retains supporting body/hand and invents a cropped human face. Beach RC-MV4NV9LI-5D0673 keeps/reconstructs a person, changes puppy pose/framing and makes the face smaller. Original photo supplied inline; no attachment retrieval through Library and no customer photos committed. Screenshots alone do not expose actual engine or submitted inclusion choice. These fail intended automatic handling; no claim that backend model identity was independently retrieved.

## Finding and bounded correction

Successful lab used a single neutral outfit instruction. Public automatic presets instead supplied both Animals and People wardrobes plus more elaborate scene/finish text. This is a confirmed code difference, and a plausible contributor to unwanted human inclusion, not a proven sole cause. Model variability remains possible.

`src/customer-identity.js` adds three automatic-only direct-edit presets. Royal and Dinosaur build byte-identical prompt text to accepted lab directions with no extra notes. Beach uses a light nautical neck scarf with sunset coast; does not ask for linen vacation clothes. Existing face/inclusion/removal/pose/anatomy sentences remain unchanged. Customer notes retain their full existing 1200-character budget; branch continuity retained. Explicit pet/person/group/both choices remain intact. All HQ/Standard engines use the same selected recipe. Version `identity-adventures-v7`; owner concise lab v2 control remains unchanged. No model, fallback, image preparation, segmentation, UI, extra call or cost change. Other 45 preset descriptions unchanged pending evidence; do not claim a comprehensive neutral rewrite.

Tests cover exact lab/preset equality, all-48 scene contracts with deliberate overrides, no dual wardrobe in affected auto presets, notes/branch continuity, explicit group preservation and updated metadata expectations. Local 507/507 tests PASS and Wrangler dry-run PASS. No failed test pass this session. No paid assistant renders, no order/fulfillment changes. Actual removal/likeness needs owner retest; prompt-only constraints cannot guarantee it.

## Release / rollback

Publication pending. Revert RM137 to restore RM136 automatic preset text. Preserve original photos, generated art and ledger. Do not regenerate purchased artwork. Next owner test: normal-site fresh upload with default Automatic and Dinosaur; no manual crop or customer description required.

## Final release receipt

PR #54 head `56a37bb8f2edb36edcac435a77724e1010c63277`, exact local/remote tree `b3cfa7b5bbca878d964fdcc56d1748c8a128f7b3`, main `d56e86b1c8c8bbdf6dc6bbaaae1503edfebd00ae`. Security `38198141140` and customer/mobile-browser policy `38198141142` PASS. Guarded deployment `38198365411` PASS: 507 tests, dry-run, deploy and production read-only smoke. Worker reported `883d4900-38d6-4bf7-abea-5ec74edbd30e` at 2026-10-12T03:05:52Z. Public launch audit `38198365473` still running at receipt; not claimed pass.

Reviewed upload path: default Automatic/fresh single photo supplies neither explicit reference labels nor face-selection notes; these remain optional customer controls. Thus default Royal/Dinosaur text can match the lab exactly. No actual new paid output tested by assistant. Ready for owner fresh-original/default-Automatic Dinosaur test through normal site; visual success remains open.
