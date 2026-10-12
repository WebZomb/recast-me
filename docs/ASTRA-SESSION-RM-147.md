# RM147 — whole-photo home-product defaults

Owner requests screenshot settings for Tote Bag, Pillow and Blanket: fit, dark fill, centered, 100%. Optional photo covering product without added background, cropping allowed. Baseline main181b0272472280f0dd125d9f6892d2d9f0d11018, tree99f674e552d224c2bc703d5dc251e1435bff2b27; deployed runtime217ec01a46195b4b0a66531317919307c7f6a94c.

Aligned public/checkout.js, src/commerce-store.js and src/social-products.js recommendations. Existing cover compositor supplies unstretched edge-to-edge photo crop: labeled Fill entire product · crop to fit. Help explains possible top/bottom OR side cropping depending on aspect ratio; no small-crop guarantee. Explicit approved prior layouts unchanged. No apparel/tumbler settings change. HTML checkout cache298. Mobile controls retain existing native select and wrapping help text.

Initial Node tests found three stale blanket110/ambient expectations; updated affected tests plus legacy-explicit settings preservation. Final suite/hosted release pending. No paid inference, supplier mockup, order, payment or fulfillment action. Physical print and fresh supplier visual acceptance unverified. Rollback restores previous recommendations/labels; composition versions unchanged.
