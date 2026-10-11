# RM122 — Automatic subject recognition in owner comparisons

2026-10-11. Baseline `eec73fe1139d99a8854cacbc3282697b5416d3bc`; branch `recast/rm122-auto-comparison`.

The owner correctly objected to choosing Pet in the comparison page when customers only upload a photo and choose a style. Removed the owner lab's required subject selector, always submits `subject=auto`, and removed the demo button's forced Pet assignment. Default and demo instructions now describe a royal cape/crown and palace without naming the subject type. Royal fields are prefilled so the owner can upload the original and run the three existing comparisons without typing prompts. Script version v282 avoids stale assets.

No classifier call or service added: the existing image-edit model interprets the photo, as in the customer auto flow. No change to public recipes, model choices, provider credentials, prices, budgets, moderation or storage. Auto interpretation and face likeness still need actual visual acceptance; this change does not prove either.

Adjusted existing owner integration and mobile browser checks to assert auto submission, no subject selector, and subject-neutral default instructions. Local 9/9 owner integration tests PASS; Chromium 393px and 320px lab checks PASS. Required full-suite/WebKit CI and deployment evidence appended when available.

Changed: public/model-lab.html, public/model-lab.js, scripts/rm050-browser-tests.cjs, scripts/rm121-model-lab-audit.cjs, tests/owner-identity-comparison.test.mjs, this session and cumulative handoff.

Zero paid calls, purchases or subscriptions. Owner will run comparisons on their phone; Desktop Commander is not needed for owner-operated tests. Do not ask for credentials in chat. Three initial Royal comparisons remain about $0.111 generation cost (~12 cents rounded), only one per deliberate click. Stop on a pending/error response. The larger nine-image pilot is not yet performed.

Rollback: revert the eventual RM122 merge to restore the previous owner lab selector; no data migration/deletion. A commit/build success is not production deployment or demonstrated image quality.

## Verified release
- PR #42 head `1d47f79abb5457992b4d30155f5da1b4e6c9cba1`, fetched and compared with the local tested tree (identical). Security CI `38156054468` PASS; customer CI `38156054370` PASS, including full 468-test suite and WebKit/Chromium owner comparisons with automatic subject handling.
- Squash main `c23295db9580004a0120dcc4a98a0fa6df02b602`. Deployment event was delayed briefly after merge; initial live checks still showed the old selector. No bypass/retrigger/configuration changes were needed.
- Guarded deployment `38156341295` SUCCESS; native Cloudflare check `114520089566` also SUCCESS for the same source (version `456029ee-1c0f-4a3a-bf83-14fc2c94939c`). Final direct live `/api/health` returned version `f27281c8-f196-4ca7-9c49-2e7ce8b6fd02`; the two existing deployment integrations remain active.
- Public audit `38156341294` SUCCESS across all steps. Direct live HTML and v282 JS HTTP200, both contain automatic handling and neutral Royal defaults, neither contains the removed subject control; HTML references v282.
- Ready for owner phone testing. No paid generation performed by assistant; face likeness and actual automatic interpretation remain unverified until the owner sends real results. Rollback implementation by reverting `c23295d` through guarded deployment; preserve all private artwork.
