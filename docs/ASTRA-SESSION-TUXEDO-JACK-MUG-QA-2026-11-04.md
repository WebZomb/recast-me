# Tuxedo Cat and Jack Russell Christmas Village mug supplier approvals — November 3–4, 2026

## Review scope and baseline
- Baseline main commit: `34be69c6837f3b30b9401880ad0757c640384e79`. It already includes the approved Golden Retriever, Labrador Retriever, German Shepherd, French Bulldog, Beagle, Poodle, Siberian Husky and Orange Tabby Christmas Village designs in both 11oz and 15oz sizes. The earlier Golden Retriever Winter Lights remains separately buyable.
- This release adds only two further new Christmas Village designs, Tuxedo Cat and Jack Russell Terrier, in both sizes (four source-specific proof signatures). Existing saved approved proofs, print files, SKU mapping, owner review requirement and customer mixed-cart remain unchanged.
- Production `/api/shop/expansion` was read directly from the user's authorized Recast desktop: all four items were `ready_for_review`; each signed supplier review hash was re-read and matched unchanged before this patch.

## Authentic supplier picture review
- The exact source 1254×1254 art from Recast's approved Shopify media and Printful's saved 11oz and 15oz three-dimensional *handle-right* mockups were compared in `RecastMugProofQA/review-6-5.jpg`.
- Both designs were also compared to their saved, authentic Printful 11oz and 15oz *handle-left* mockups in `RecastMugProofQA/review-left-6-5.jpg`. Tuxedo Cat has correct black-and-white coat, Santa hat, red snowflake scarf and snowy Christmas village on both sides, with face and decoration visible. Jack Russell Terrier has correct tan-and-white face, open-mouth smile, Santa hat/scarf and village scene in both orientations. No swapped subject, wrong size, blank printed side or clipped central pet face was evident.
- Preview watermark bars and faint provider marks appear on saved mockup previews, **not** on approved original artwork or the separately frozen clean production print files. No actual physical samples have been ordered in this QA.

## Exact signed approval hashes
- Tuxedo Cat 11oz: `c820ad43f05a6cd6b1e30325d9a58bae69fae04a17fc356d05374d90df314ca2`
- Tuxedo Cat 15oz: `4a0d52ad627abf9d963bed195bba3187384c717c5a897921b1a44f800f724d78`
- Jack Russell 11oz: `82e96b6a9248a835b43a35eb3d9b6b5d9dac74cd55c81e4aca4c0f46f9a4a256`
- Jack Russell 15oz: `3b566030164e8bdcbef873507a831f503b3d6708f6b1bd97f8f3c2944aff200c`

Each signature is validated server-side against the saved source SHA, approved mockup version, frozen clean print file hash and placement hash before publication. The allowed source-specific Christmas Village list becomes 20 size variants (10 designs), compared with 16 variants (8 designs) at baseline. The original separately approved Golden Retriever Winter Lights remains an additional two buyable variants.

## Gates and rollback
- Change only the exact review signature allowlist and the source test expectation. No activation of the 35 Shopify DRAFT products; only the custom Recast shop may offer verified artwork through its existing preapproved Custom Recast Mug size variants.
- Require Node regression tests, Worker dry-run, hosted security / Chromium + WebKit customer-policy tests, guarded production deployment and live read-only catalog verification before claiming buyability.
- No new payment, customer order, Printful production confirmation, AI render, credential modification or data deletion was made by this release. Provider mockup tasks belong to the supplier preview staging queue and are not physical production orders.
- Roll back only these four signatures if their source/proof hashes are invalidated; leave all other approved offers, saved carts and historical supplier task status untouched.
