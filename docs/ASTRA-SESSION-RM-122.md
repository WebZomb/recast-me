# RM122 — Automatic subject recognition in owner comparisons

2026-10-11. Baseline `eec73fe1139d99a8854cacbc3282697b5416d3bc`; branch `recast/rm122-auto-comparison`.

The owner correctly objected to choosing Pet in the comparison page when customers only upload a photo and choose a style. Removed the owner lab's required subject selector, always submits `subject=auto`, and removed the demo button's forced Pet assignment. Default and demo instructions now describe a royal cape/crown and palace without naming the subject type. Royal fields are prefilled so the owner can upload the original and run the three existing comparisons without typing prompts. Script version v282 avoids stale assets.

No classifier call or service added: the existing image-edit model interprets the photo, as in the customer auto flow. No change to public recipes, model choices, provider credentials, prices, budgets, moderation or storage. Auto interpretation and face likeness still need actual visual acceptance; this change does not prove either.

Adjusted existing owner integration and mobile browser checks to assert auto submission, no subject selector, and subject-neutral default instructions. Local 9/9 owner integration tests PASS; Chromium 393px and 320px lab checks PASS. Required full-suite/WebKit CI and deployment evidence appended when available.

Changed: public/model-lab.html, public/model-lab.js, scripts/rm050-browser-tests.cjs, scripts/rm121-model-lab-audit.cjs, tests/owner-identity-comparison.test.mjs, this session and cumulative handoff.

Zero paid calls, purchases or subscriptions. Owner will run comparisons on their phone; Desktop Commander is not needed for owner-operated tests. Do not ask for credentials in chat. Three initial Royal comparisons remain about $0.111 generation cost (~12 cents rounded), only one per deliberate click. Stop on a pending/error response. The larger nine-image pilot is not yet performed.

Rollback: revert the eventual RM122 merge to restore the previous owner lab selector; no data migration/deletion. A commit/build success is not production deployment or demonstrated image quality.
