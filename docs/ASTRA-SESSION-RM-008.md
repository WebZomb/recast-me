# RM-008 — fix real Cloudflare Images 9412 watermark failure

Date: 2026-09-29
Parent: 46d3c3937fb22f9b2b932767dbefd00240c080e5

## Real Preview evidence
The owner ran one controlled High-Quality dog/Halloween attempt after RM-007 was green. Generation progressed beyond readiness but secure preview finishing failed with Cloudflare Images error: `IMAGES_TRANSFORM_ERROR 9412: Could not resize the image: The requested file is not an image`. Site support reference: `WEB-MUN6B1DO-59B5`. No usable preview was delivered, so this attempt provides no likeness result.

## Root cause and correction
RM-004 had replaced the original raster watermark assets with dynamically generated SVG Blob draw inputs to get the requested text. The live Worker Preview demonstrates that this SVG draw path is not accepted reliably by Cloudflare Images. The repository already contains the earlier rasterized PNG watermark tile/footer, documented in RM-002 as using `@RecastMeAi`. RM-008 restores those PNGs as the draw sources while keeping the requested `@RecastMeAi • PREVIEW` branding and server-side flattening.

Security version advances to rm-preview-4 so old derivative caches cannot hide the change. No clean-image fallback is introduced. The large preview, Recent Versions, mockups/social preview boundary and unpaid print source still pass through the same server derivative protection.

## Required evidence
Run the complete mocked suite and Wrangler dry-run, then require successful Cloudflare Worker Preview deployment. The next controlled real render must verify both likeness and the actual visible watermark. Do not call RM-008 ready until both CI and Preview are green.

No engine/provider switch, commerce action, X post, production deployment or automatic retry was performed while making this correction.
