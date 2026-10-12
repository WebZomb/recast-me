# RM147 — whole-photo home-product defaults

Owner requests screenshot settings for Tote Bag, Pillow and Blanket: fit, dark fill, centered, 100%. Optional photo covering product without added background, cropping allowed. Baseline main181b0272472280f0dd125d9f6892d2d9f0d11018, tree99f674e552d224c2bc703d5dc251e1435bff2b27; deployed runtime217ec01a46195b4b0a66531317919307c7f6a94c.

Aligned public/checkout.js, src/commerce-store.js and src/social-products.js recommendations. Existing cover compositor supplies unstretched edge-to-edge photo crop: labeled Fill entire product · crop to fit. Help explains possible top/bottom OR side cropping depending on aspect ratio; no small-crop guarantee. Explicit approved prior layouts unchanged. No apparel/tumbler settings change. HTML checkout cache298. Mobile controls retain existing native select and wrapping help text.

Initial Node tests found three stale blanket110/ambient expectations; updated affected tests plus legacy-explicit settings preservation. Final suite/hosted release pending. No paid inference, supplier mockup, order, payment or fulfillment action. Physical print and fresh supplier visual acceptance unverified. Rollback restores previous recommendations/labels; composition versions unchanged.

## Release receipt
PR67 head e980dd5d9f4a1b46f98b334b38d473a7e6a9a205, tree98522ebceaec0d51015f2b3abfb1f7bca420a8a5, merged/runtime4fdc5e9fccbdaf5a6a2bd66c6d9859b212ef00c6. All525Node tests pass. Security38303889940 and customer browser38303889728 pass. Guarded deployment38304205581: offline tests/dry-run and deployment jobs pass. Live blanket editor verified whole-photo fit selected, dark fill, center,100%; crop choice/help visible. Screenshot /workspace/scratch/recast-rm147-defaults.jpg. No new supplier mockup or physical sample. Read-only launch audit38304205533 status not rechecked.
