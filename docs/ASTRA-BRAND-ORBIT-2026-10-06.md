# Approved RM orbit brand — 2026-10-06

## Owner decision and scope
The owner selected concept 3 (cyan R, magenta M, swirling light trails) and approved the stacked, square icon and horizontal layouts shown in this conversation. They explicitly asked to use these on the website and requested a Twitter/X banner and description; they will update Twitter themselves. No social-account change is authorized or performed.

## Baseline and preservation
Read current main at fdeed52c04cc77407c661befd2b2daaccd741a8c (tree 93cb80c101fed34ebb24a1ee69ec12887981bbe3), not the September 29 preview branch. Current main contains RM-049.4 launch UI and later Printful retry work. This patch must preserve that newer work, every product, generation policy, checkout state and current automation settings. It changes only static branding markup/assets and adds isolated regression tests. No source/backend, provider, budget, order, printing or X-post changes.

## Approved assets
Reused the exact approved artwork, without another image-generation call for website assets. Prepared a compact transparent header lockup from the approved monogram and outline-only wordmark, plus app/tab icon sizes. Transparent presentation removes only the black background; it is not a new font or letter design. The original stacked approved master is retained unchanged.
Uploaded to the already-connected matching Shopify store b2wnfu-7g solely as public brand files:
- Header: https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-header-v1.png?v=1791313673
- Stacked: https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-stacked-v1.png?v=1791313709
- Icon: https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-icon-v1.png?v=1791313742
No customer photos, tokens or font files were uploaded. Existing store products/images were not modified or removed.

## Changes
- scripts/apply-orbit-brand-v1.mjs: idempotent, narrowly matched replacement of legacy nested R/M spans in static public HTML. Retains outer links/classes, forms, scripts and all unrelated content. Adds favicon/Apple touch icon, shared responsive CSS and home-page Open Graph/X card metadata.
- public/brand-orbit-v1.css: responsive sizing scoped to the approved logo image; keeps legacy/other selectors intact.
- tests/orbit-brand.test.mjs: replacement scope, idempotence, untouched forms/scripts, non-home metadata isolation, asset privacy and responsive styling.
- public/*.html matched by the application script: actual changed list is printed in the preparation workflow and retained in git diff.
- docs/ASTRA-HANDOFF.md: append a link; do not rewrite old entries.

## Validation and deployment protocol
Container execution initially had transport errors; public GitHub cloning from the container failed DNS. Therefore run the full exact-source tests and dry-run in GitHub Actions on a dedicated preparation branch before advancing main. The one-shot preparation workflow deletes itself before the final commit. It must stop on any test/build failure and must push without force. Final main advance must also be non-forced to avoid losing parallel updates. Inspect the actual run logs and Cloudflare status before saying deployed. Until checked, tests/deployment are pending; later PR comment or commit record should provide observed results.

## User-facing social copy
Suggested display name: Recast Me Ai | AI Art & Gifts.
Suggested bio: Your photo. A whole new world. Transform pets, people & the ones you love into AI art. Put your favorite on mugs, clothing, wall art & gifts.
X official profile guide: header 1500x500, profile 400x400, bio up to 160 characters. Keep critical banner content away from crop/overlap edges. Banner creation is a separate branding asset, not an inference call by the Recast website.

## Remaining limits
No claim of tested physical-print quality, 1000/day capacity, completed fulfillment, or perfect protection is made here. Native iOS and Shopify-hosted checkout/theme brand settings are not changed by static website markup. Original live-logo letter shapes are intentionally replaced by the owner-approved orbit artwork. Browser-level checks and the CDN must remain part of deployment verification.

## Rollback
Revert only this branding commit on top of the latest main. Do not reset the repository to the September baseline or revert current checkout/Printful work. Uploaded CDN files can remain harmlessly unreferenced; do not delete shared files automatically.
