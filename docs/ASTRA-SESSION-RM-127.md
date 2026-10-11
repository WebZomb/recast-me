# RM127 — Accepted likeness, selective-cleanup research and flow review

2026-10-11. Last verified repository main `19e8971f972da331fb0c5c6d5cf92bcb980bdf7d`, tree `384682257f032dd75f018bbf0c2ca75ffdfd161e`. Git fetch during this review failed CONNECT 403; use expected-SHA connector update to avoid overwriting newer work. Documentation-only research; no runtime change.

## Owner acceptance and remaining problem
Owner explicitly said the face likeness is very good for the latest Football result (RC-MV457WSZ-E5E805). Treat Nano v3 as the accepted baseline for this example, not proof of all faces/48 styles. The latest result no longer invents a face, but retains supporting torso/hand and an odd shoulder-pad shape. More whole-image prompt edits risk losing the accepted face. User asks to figure out removal and review site suggestions.

## Verified primary-source research
- https://fal.ai/models/fal-ai/nano-banana/edit/api — current original Nano edit schema exposes reference images/prompt, not a dedicated edit-mask input. A prompt alone is not a protected-pixel guarantee.
- https://fal.ai/models/fal-ai/object-removal/mask/api — dedicated image_url + mask_url; white pixels mark removal. model enum low_quality/medium_quality/high_quality/best_quality, default best; mask_expansion 0–50 default15.
- https://fal.ai/models/fal-ai/object-removal/mask — displayed removal prices $0.006/$0.012/$0.018/$0.024 per request. This excludes segmentation, existing generation, moderation, transforms/storage and failed attempts. No billed latency/quality benchmark performed.
- https://fal.ai/models/fal-ai/sam-3/image/api — candidate mask generator accepts text/points/boxes and returns masks and optional scores/boxes. Its generic sales/search results disagreed on price; current opened page did not expose a price. Do not state an all-in cleanup price yet. Mask scores are not proof of semantic correctness.
- https://developers.cloudflare.com/images/optimization/features/#segment — existing Images foreground segmentation uses BiRefNet, isolating foreground from background. It does not expose a person-vs-pet selection in this option. Inference: the existing apparel cutout operation can retain both holder and dog; not a reliable targeted-hand remover.

## Recommended implementation, NOT built or enabled
1. Keep Nano v3 generation and accepted private clean artwork as immutable source. Work on that artwork, not the watermarked screenshot and not a fresh whole-photo render.
2. First owner-only prototype: review explicit removal mask for holder/hand and protection mask covering accepted head/face/ears plus a margin. Do not ask customers to draw these. An automatic mask pipeline comes after validating the actual cleanup. Facial coordinates from upload taps cannot be blindly reused on generated artwork because framing may differ.
3. Reject mask/protected-region overlap, empty/oversized invalid masks, dimension/orientation changes and uncertain selections. Do not auto-remove an intended visible-face family member. Keep inclusion intent and source face visibility separately from segmentation.
4. Submit one bounded removal request with mask_expansion=0 after locally controlling margins; do not rely on provider defaults or preservation claims.
5. Composite ONLY the approved removal region back onto the accepted source; copy every pixel outside it directly from the source. Protect the face/ears/head fully. Feather only inside approved editable boundaries, never across protected face pixels. Preserve decoded source color space/orientation; lossless PNG master at identical dimensions, no global resampling. Verify exact decoded protected-pixel equality before accepting. Subsequent product resizing is separate and does not imply the file bytes remain identical.
6. Screen the completed composite, add preview watermark server-side, store as a NEW version linked to immutable source/mask hashes and model. Customer approves actual final version. Never replace a purchased snapshot or clean master in a public URL.
7. No silent paid retry. On failure retain accepted artwork. Only add automatic cleanup for cases proven to benefit; ordinary single-subject photos should not pay extra.

The hidden body under a hand still needs plausible reconstruction; copying the face cannot ensure a natural torso, paw or support pose. The dog may appear to float when its holder is removed. Tight portrait framing is a useful alternate fallback but can crop intended content and must be reviewed.

Proposed first evidence gate: one accepted Football clean image with one manually reviewed owner-only mask, low and high removal quality (nominal $0.024 total removal charges); assess unwanted-person removal, reconstructed edges/support, exact protected pixels and elapsed time. This is a proposal, not an approved/executed paid test. Do not claim ready-to-run until owner route/private asset access/budget controls exist. Next validate automatic masks across held pet, solo pet negative control and intentional person+pet/group.

## Site review and suggestions
Reviewed current creator/result markup, canvas rendering, apparel cutout, source snapshot/checkout guards, original/reference handling and latest release evidence. Direct public root/health/model status HTTP200, Nano v3 live. A context-free checkout-options GET returns400 (requires artwork context); this is not evidence of a broken purchase. Latest RM126 public browsers/products/mocked social commerce already passed; no duplicate full audit or live paid checkout run here.

Priorities:
1. Original/Recast comparison at matching scale, optionally zoom, to make likeness review easy; source must remain private and compare must never expose clean generated artwork. Not currently implemented.
2. More compact mobile result header; move long technical artwork ID to optional details with a simple Saved privately line. User screenshots show heading/ID consuming substantial vertical space before the picture. Keep support ID recoverable.
3. Put main product CTA nearer artwork and inspect image footer/frame clipping visible in screenshots. Code uses contain; do not assume CSS is the proven cause or remove preview watermarks. Verify intrinsic image footer versus container clipping before fixing.
4. Preserve simple default inclusion, optional Change, and Preview vs Buy Now with explicit artwork approval. Avoid introducing engine/mask jargon to shoppers.
5. Launch gate: one real low-cost sticker order traced through Shopify/Printful, order-status/email/error handling. Existing tests are mocks, not fresh fulfillment proof. Verify checkout brand name (repository admin notes old My Store issue; current merchant setting not inspected).

No production code edits, deployment, paid renders, cleanup requests, orders, user-photo commits, credit reset or fulfillment. No tests of real masked cleanup yet. This record saves owner approval and research; it does not claim cleanup is fixed.
