# Small-gift checkout implementation — November 4, 2026

This release completes the missing backend from completed supplier previews to native-resolution clean print files and existing premade cart offers. It does not add another preview-only pilot.

Scope is exactly the Golden Retriever Christmas Village Coaster 4-Pack (1181² JPEG), Magnet 3-Pack (900² JPEG), and six-picture Sticker Sheet (1750×2482 PNG). Exact source identity, rights, Printful variant, template DPI, supplier task, layout, and snapshot hash are verified before composition. The production file is generated once at native print dimensions from clean source artwork, not from watermarked supplier pictures. Six sticker tiles preserve transparent gaps.

The locked-print verifier now supports PNG only for the existing version-8 six-picture sticker-sheet SKU. Existing JPEG approvals and buyer-scoped cart/fulfillment checks stay unchanged. A draft print file never becomes a catalog offer until its four-hash review signature is explicitly committed to REVIEWED_SMALL_GIFT_SIGNATURES. The list starts empty. Modified print files or placements require a new visual review rather than automatic approval.

The read-only commercial QA export uses the existing authorized production Cloudflare integration to retrieve only these three predetermined source-commercial supplier tasks, print files and source art. It writes sanitized images/digests to a short-lived GitHub Actions artifact for inspection; no raw R2 metadata, customer artwork, access tokens or credentials are exported. The exporter has no write/delete/provider-order operation. Protected owner endpoints remain protected.

PREMADE_SMALL_GIFT_RELEASE_ENABLED controls bounded preparation (one file per scheduled pass) and signature-gated publication. Uncertain preparations remain held for inspection rather than blind retries. Existing mug catalog offers are preserved. No sample purchase, paid order, or Printful production submission is performed by this release.

Acceptance: full Node suite and Worker dry-run, retrieve and visually inspect actual supplier pictures AND native clean files, commit only matching review signatures, guarded deployment, then verify new catalog offers, add/remove in the actual cart and checkout handoff without payment. Physical sample quality is not claimed by digital QA.

Rollback: disable PREMADE_SMALL_GIFT_RELEASE_ENABLED or revert this focused release. Retain all supplier tasks, approval records, clean files and customer carts. Do not loosen the signature checks to force items into checkout.
