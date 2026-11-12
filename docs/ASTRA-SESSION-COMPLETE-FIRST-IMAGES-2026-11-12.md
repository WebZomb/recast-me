# Complete Christmas first-image catalog — November 12, 2026

## Scope and baseline

The owner asked not to stop at another partial batch. This change completes product-specific first-image coverage for **all 35 Christmas dog/cat designs in all 15 active non-mug collections: 525 combinations**. The separate existing mug gallery and its sales illustrations remain unchanged.

Baseline: `d99c0e51bb29ae9e2a3b74ddb97027c3b47e294c` (PR192, previously deployed), with30 non-mug scenes. This release fills495 missing combinations and replaces18 low-resolution/generated collage concepts with exact-source compositions. Twelve reviewed scenes remain unchanged: eleven local Golden/Labrador/German Shepherd scenes and the owner's exact Husky coaster reference. New assets: **513 full-size WebP images and513 browsing thumbnails**.

This is image coverage, **not** certification that every product is ready to manufacture or buy. Only independently verified supplier offers remain purchasable. No original artwork, print file, provider, price, approval, customer cart, payment, order or fulfillment record changes.

## Construction and visual review

All35 existing original public artworks were read and hashed without modification. Marketing scenes project the matching original artwork pixels onto product surfaces in existing Christmas lifestyle scenes. No pet was regenerated or substituted. Small gifts retain four coasters, three magnets and six stickers. Apparel depicts front prints rather than invented all-over garments. Handles, cameras and actual supplier previews are distinct from source artwork.

Review caught classic faces behind camera cutouts, cropped puzzle heads, leftover original-colored blanket edges and an unattractive camera-safe filler band. These were corrected before release. Classic phone portraits preserve proportions and extend only the original decorative top edge. Puzzle layouts retain the full square artwork with reflected peripheral decoration rather than cropped heads. Material shading, perspective, illustrative puzzle seams and print placement remain **marketing concepts**, not pixel-identical Printful proofs or variant certification.

Visual checks included Siamese, White Persian and Ragdoll across product types, all35 phone/puzzle/small-gift designs in contact sheets, corrected detailed images, and narrow-phone shop screenshots. Image decoding and output hashes cover every new asset. Representative visual inspection is not a physical print test.

## Frontend and image delivery

The immutable registry expands35 pinned artwork identities across15 explicit collections, with12 preserved overrides. Every generated path is backed by a real committed image and coverage tests, not a placeholder. Runtime registry is approximately10.7KB. Detail images are1254square; browsing thumbnails640square. The new collection totals approximately56MB of thumbnails versus198MB of detail files; this is storage across the entire catalog, **not** measured page-load time. Pages retain lazy loading of their own images.

Category import advances to sales registry v4, and all15 category HTML entrypoints to category v11. Sales-first cards, real Printful controls, original artwork access, loading indicators and verified-only checkout remain. Mug gallery and API/source commerce code are unchanged.

## Rebuild and evidence

`docs/evidence/shop-first-image-coverage-20261112.json` records513 output/thumbnail hashes, dimensions, sizes and pinned artwork identities. `docs/evidence/shop-scene-original-sources-20261112.json` records35 original hashes and public URLs. Offline recipe: `scripts/compose-shop-scenes.cjs` plus `scripts/shop-scene-templates.cjs`. Use isolated `sharp@0.34.4`, provide it through `NODE_PATH`, and set `RECAST_SCENE_WORKSPACE` to an absolute workspace containing `originals/<designId>.png`. No sharp production dependency or on-demand image generation is added. Never use marketing outputs as supplier print files.

## Validation checkpoint

Before the final phone-framing adjustment:956/956 Node tests passed, Worker dry-run passed, and installed-Chrome category/verified-only checkout fixtures passed at320/393/768/1280px. Focused asset/revision/hash tests were rerun during corrections. Final exact-head Node/browser reruns and hosted security/Chromium/WebKit workflows are required before merging. A commit is not a deployment; production release evidence is separate and must be appended in the PR/session follow-up.

One receipt helper failed after registry writes due to a misspelled byte-total variable; rebuilding the receipt repaired it without removing approvals. Default device DNS failed; read-only downloads and git used per-process explicit resolution, without changing Windows DNS, hosts, execution policy or security settings. npm.cmd replaced a blocked npm.ps1 invocation. An isolated checkout avoided interference with other projects.

No paid renders, AI credits, subscriptions, external paid services, ads, printing, purchases or customer-data access.

## Rollback and separate manufacturing work

Revert this assets/presentation commit and redeploy to restore the prior30-scene registry. No data migration or supplier rollback is required. Unreferenced marketing assets do not affect orders. Large-format print masters, per-product supplier proof review, publication of unapproved categories and native-app release remain separate workstreams; do not claim this image rollout completes them.
