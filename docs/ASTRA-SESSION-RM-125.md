# RM125 — Football pose conflict and one inclusion control

2026-10-11. Baseline main `aeed3a8ed2e2b2b474b59a69dc2552715e8f19be`, tree `a3f14c5e2d5ea8f514471ea4006709ab095cac62`. Owner supplied upload/Football Gameday screenshots. Uploaded puppy is held with tilted head; result shows a smaller, front-facing standing dog, with altered expression/face proportions. Screenshot does not expose actual per-render model metadata. This is evidence of remaining likeness drift, not a successful likeness acceptance. No user photos committed.

Confirmed conflict in shared adventure guide: Football pet outfit explicitly said “all four paws grounded,” contradicting preserving this source pose. Removed that demand from both HQ and Standard via shared guide. Public Nano recipe v2 makes original camera angle/framing explicit, avoids invented standing poses/zoom-out, and places background behind prominent faces. This is a modest prompt correction, not a protected pixel mask or guarantee; no cost/model change or extra image call. Other 47 guides unchanged.

Upload UI now has ONE native disclosure: Include: Automatic / Change. Category/face options stay inside it, hidden before uploading; duplicate “Choose who to include” control removed. Native summary retains keyboard operation. App/wizard cache v285, guide v2, flow CSS v3. Existing face taps, optional labels, original references and commerce unchanged.

Files: public/adventure-guides.js, public/app.js, public/creation-wizard.js, public/index.html, public/simple-flow-v117.css, src/customer-identity.js; tests/customer-identity.test.mjs, tests/owner-identity-comparison.test.mjs, tests/render-wait-ui.test.mjs and scripts/rm050-browser-tests.cjs aligned with version/keyboard behavior. Local Node suite 477/477 PASS. Local/CI browser/deploy receipts follow. Zero assistant paid generation, purchase, credit mutation or fulfillment. No claim prompt-only tests prove visual likeness. Owner should compare one fresh Football HQ output from the same original after deployment, without added cleanup instructions; do not rerender approved purchases.

Rollback: revert RM125 source merge through guarded deployment, preserving private artwork and order snapshots.

Local browser test first FAILED: existing wizard Enter shortcut intercepted summary activation and advanced to Style, hiding face selection. Fixed by allowing native summary keyboard behavior; rerun below. Failure was not deployed.

## Final release receipt

Local Chromium 320/1440 browser rerun PASS, including Enter-to-open single disclosure, face selection, fresh uploads and both purchase paths. PR #45 head `f2127d5568101dcdc01ca2d217da623bb75d4cf5` matched local staged tree; security CI `38161641943` PASS, policy CI `38161641941` PASS (477 Node tests, bundle, WebKit/Chromium and Model Lab). Squash main `d78aba880874b614d03367eda724addcf2727211`, tree `4d3dac59d25984c00c77a214fa0ee2812f19f0ab`. Guarded deployment `38161860020` and public launch audit `38161860042` both PASS, including product examples and isolated social commerce.

Direct live root, app v285, wizard v285, guides v2, CSS v3 all HTTP200 and byte-identical to source. Health Worker `20f07af5-4179-40f2-a5ef-3c0dcd2fa2b2` at `2026-10-11T17:59:10.829333Z`; model status `fal-ai/nano-banana/edit`, prompt `nano-identity-adventures-v2`. Ready for owner visual test; no assistant render, purchase or fulfillment initiated. Likeness improvement remains unverified until actual output comparison.
