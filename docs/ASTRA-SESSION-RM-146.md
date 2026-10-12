# RM146 — Continuous case photo and two full mug panels

2026-10-12. Baseline main bb9094f7c2fd31fa90837212cf16a00c17fefb80; live runtime ed74e670d9b722cba2d36f69697c1b47d43e67d9. Owner screenshots show v10 phone photo meeting a blurred upper band and mug side views showing one copy plus filler near handle. Two copies were already composed, but v10 did not fill the entire printfile. A side-view mockup is not evidence that only one copy exists.

Owner explicitly selected **Full photo wrap** after being told it crops and requires checking camera overlap. Tough Case now recommends existing v6 cover/full-bleed (one continuous photo), with v10 whole-photo-below-camera still available in Edit design. No claim of automatic camera/face protection for cover. Frontend, fast checkout and social recommendations agree.

Mug new explicit v11 close/two-sided layout gives each copy half of the supplier printfile width and full height. Copies meet exactly in the middle and cover to both outer edges without filler strips. Cover crops without stretching; vertical content can be lost on portrait sources. UI explains two copies/one per side view and crop check. Inapplicable size slider hidden for fixed full-panel layout; other spacing options retain existing controls. v10 and earlier approved layouts remain unchanged.

Files: src/commerce-store.js, src/social-products.js, public/checkout.js, public/index.html, public/recast.html; corresponding checkout/content/mapping tests. Checkout cache v296. No model, prompt, subject detection, SKU, price, order automation, customer artwork or completed order changes.

524 Node tests pass; Worker dry-run pass. Geometry checks cover portrait/landscape/narrow sources, full-width two-panel coverage, v10 retention, full-case preset agreement and earlier camera-safe versions. These are not physical-print or live-supplier visual acceptance. Hosted CI, release and actual mockups pending. No paid AI render/order/payment/fulfillment action.

Rollback: restore v10 default recommendations and UI, retaining v11 compositor for any newly approved purchases. Do not reinterpret frozen approvals. Styled catalog illustrations remain examples rather than supplier proofs. Actual photos vary; don't promise every source will match the sample or avoid camera cutouts.
