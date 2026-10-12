# RM146 — Continuous case photo and two full mug panels

2026-10-12. Baseline main bb9094f7c2fd31fa90837212cf16a00c17fefb80; live runtime ed74e670d9b722cba2d36f69697c1b47d43e67d9. Owner screenshots show v10 phone photo meeting a blurred upper band and mug side views showing one copy plus filler near handle. Two copies were already composed, but v10 did not fill the entire printfile. A side-view mockup is not evidence that only one copy exists.

Owner explicitly selected **Full photo wrap** after being told it crops and requires checking camera overlap. Tough Case now recommends existing v6 cover/full-bleed (one continuous photo), with v10 whole-photo-below-camera still available in Edit design. No claim of automatic camera/face protection for cover. Frontend, fast checkout and social recommendations agree.

Mug new explicit v11 close/two-sided layout gives each copy half of the supplier printfile width and full height. Copies meet exactly in the middle and cover to both outer edges without filler strips. Cover crops without stretching; vertical content can be lost on portrait sources. UI explains two copies/one per side view and crop check. Inapplicable size slider hidden for fixed full-panel layout; other spacing options retain existing controls. v10 and earlier approved layouts remain unchanged.

Files: src/commerce-store.js, src/social-products.js, public/checkout.js, public/index.html, public/recast.html; corresponding checkout/content/mapping tests. Checkout cache v296. No model, prompt, subject detection, SKU, price, order automation, customer artwork or completed order changes.

524 Node tests pass; Worker dry-run pass. Geometry checks cover portrait/landscape/narrow sources, full-width two-panel coverage, v10 retention, full-case preset agreement and earlier camera-safe versions. These are not physical-print or live-supplier visual acceptance. Hosted CI, release and actual mockups pending. No paid AI render/order/payment/fulfillment action.

Rollback: restore v10 default recommendations and UI, retaining v11 compositor for any newly approved purchases. Do not reinterpret frozen approvals. Styled catalog illustrations remain examples rather than supplier proofs. Actual photos vary; don't promise every source will match the sample or avoid camera cutouts.

Initial hosted browser run38293189703 failed because its custom-layout scenario attempted to move the now-hidden fixed-panel size slider. Updated the scenario to assert that it is hidden, switch spacing to Standard, then adjust size and retain the existing preview-required assertions. No bypass/force click. Security38293189536 passed. Earlier RM145 read-only launch audit38272663536 confirmed successful. Browser recovered from a transient transport disconnect; authorized CAPTCHA succeeded and public hero no-AI upload produced RC-MV5LV354-603A579D. No supplier requests yet; awaiting release.

## Live release receipt

PR65 https://github.com/WebZomb/recast-me/pull/65 final head7052c508c75284ca7845896569d0f6f87a67df54, tree2c1dd57ee855977755d122fefa49233d1ae5c93f. Final security38293582428 and customer WebKit/Chromium38293582684 PASS. Merged runtime315f9386b1e15e51df9cd377f72a3a5f47808ce9. Guarded deploy including production smoke38293969974 PASS; Worker5f96fa3a-6ded-472b-b53d-fe5b0384f486. Read-only launch audit38293970008 PASS. Live DOM confirms checkout.js?v=296.

Shopify Tough Case15419162460404 description updated to continuous cropped photo wrap, camera-preview guidance and optional whole-photo fit. Readback confirms all9variant IDs/SKUs/prices unchanged and same styled catalog image. Uploaded public hero only; two normal supplier preview requests (11oz Mug and iPhone14 Tough Case) submitted after deployment. No AI render, payment, order, fulfillment, alert, or service activation.

## Supplier evidence and follow-up

Real iPhone14 full wrap removes the upper band but the public hero's high human face intersects the camera cutout. Explicitly told owner; full wrap is not face-safe and v10 remains optional. Mug first request failed with a generic preview error; one explicit retry succeeded. Actual both-side views show full panels/no filler but default centre crop cuts the high human head. This is a concrete quality defect; not called finished.

Follow-up new mug v12 retains two full panels and uses Cloudflare's documented gravity:auto saliency focal crop. v11 remains immutable. Source: https://developers.cloudflare.com/images/optimization/features/#gravity--g and binding transform docs https://developers.cloudflare.com/images/optimization/binding/ . It prioritizes visually salient pixels, not a guarantee of every human/pet face. No extra generative model call. Same transform in preview and production. 525 regression tests pending at note; hosted gates and new supplier proof required before claiming improvement. Checkout v297; case unchanged. Total supplier attempts so far3, no AI render/order/payment.
