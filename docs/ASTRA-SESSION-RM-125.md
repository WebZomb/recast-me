# RM125 — Football pose conflict and one inclusion control

2026-10-11. Baseline main `aeed3a8ed2e2b2b474b59a69dc2552715e8f19be`, tree `a3f14c5e2d5ea8f514471ea4006709ab095cac62`. Owner supplied upload/Football Gameday screenshots. Uploaded puppy is held with tilted head; result shows a smaller, front-facing standing dog, with altered expression/face proportions. Screenshot does not expose actual per-render model metadata. This is evidence of remaining likeness drift, not a successful likeness acceptance. No user photos committed.

Confirmed conflict in shared adventure guide: Football pet outfit explicitly said “all four paws grounded,” contradicting preserving this source pose. Removed that demand from both HQ and Standard via shared guide. Public Nano recipe v2 makes original camera angle/framing explicit, avoids invented standing poses/zoom-out, and places background behind prominent faces. This is a modest prompt correction, not a protected pixel mask or guarantee; no cost/model change or extra image call. Other 47 guides unchanged.

Upload UI now has ONE native disclosure: Include: Automatic / Change. Category/face options stay inside it, hidden before uploading; duplicate “Choose who to include” control removed. Native summary retains keyboard operation. App/wizard cache v285, guide v2, flow CSS v3. Existing face taps, optional labels, original references and commerce unchanged.

Files: public/adventure-guides.js, public/app.js, public/creation-wizard.js, public/index.html, public/simple-flow-v117.css, src/customer-identity.js; tests/customer-identity.test.mjs, tests/owner-identity-comparison.test.mjs, tests/render-wait-ui.test.mjs and scripts/rm050-browser-tests.cjs aligned with version/keyboard behavior. Local Node suite 477/477 PASS. Local/CI browser/deploy receipts follow. Zero assistant paid generation, purchase, credit mutation or fulfillment. No claim prompt-only tests prove visual likeness. Owner should compare one fresh Football HQ output from the same original after deployment, without added cleanup instructions; do not rerender approved purchases.

Rollback: revert RM125 source merge through guarded deployment, preserving private artwork and order snapshots.

Local browser test first FAILED: existing wizard Enter shortcut intercepted summary activation and advanced to Style, hiding face selection. Fixed by allowing native summary keyboard behavior; rerun below. Failure was not deployed.
