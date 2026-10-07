# RM-052 — real transparent apparel, bounded product stages and provider lifestyle views

Session: 2026-10-06 evening local / 2026-10-07 UTC.
Application baseline: `3fc6df6a8be51556d4a65bfbb70da44970411648` (RM-051.2).
Isolated source/check branch: `recast/rm052-product-studio`, preparation anchor `0906570bbaab9ef02f2c234cfecaca5995c934f7`.
The final application commit is printed by the isolated validation workflow and retained in its `rm052-validation` artifact. A source push is not proof of production deployment.

## Owner request
Fix the visibly bottom-clipped product previews, make the shop attractive, use suitable room/lifestyle views, remove the artificial background rectangle on shirts/hoodies, offer soft photo edges, and investigate the repeatedly failing tumbler preview. Keep all products, original images, approved orders, branding, models, credit policy and payment/print-approval safeguards. Consolidate updates to avoid notification noise. Do not claim personal GitHub notification preferences were changed; this connection cannot modify them.

## Findings and changes
- Reproduced the actual cropping with the current DOM and styles: on a 393px viewport the media window was 227.94px high while its intrinsic grid image row was 391px, then enlarged to 430.1px by the earlier 1.10 scale. This was not solved by `object-fit:contain` alone.
- `public/product-studio-v52.css` makes the image absolutely fit a bounded square stage, removes the old zoom, and takes precedence over product-specific selectors. Measured corrected stage 391px, image 391x390px, no spill. Product spacing, badges, ready state, view chips and CTA hierarchy are tightened. All source mockup pixels remain visible.
- `public/checkout.js` recommends **AI subject cutout / no background** for new apparel previews. Edit design exposes Cutout, Soft-edge photo and straight-edge original photo. The AI processing disclosure is visible before previewing, and the original remains unchanged. Changing finish invalidates the previous proof, so payment still requires reviewing the exact current design. Size is bounded to 75–100% for apparel; legacy product controls are preserved.
- `src/apparel-finish.js` prepares one immutable private Cloudflare Images foreground cutout per source SHA-256. A durable claim prevents retry storms or a different AI cutout at fulfillment. A missing or failed cutout gives an explicit Soft-edge alternative; fulfillment never generates a new cutout. Integrity is checked on reuse. The separate soft-photo finish builds a binary-opacity dot fade, rather than semitransparent DTG fill. No external image provider is introduced.
- `src/commerce-store.js` opts explicit new apparel finishes into design v5. PNG alpha and a truly transparent full-print-area canvas replace the artificial dark JPEG rectangle. v4 and older already-approved designs retain their original normalization/composition.
- `src/order-approval.js` preserves clean PNG MIME, extension and pixels through the locked print-finishing and protected paid-file route. Original artwork and snapshots are not replaced. The same saved cutout and composition settings drive the preview and final high-resolution file; no new segmentation occurs after approval.
- `src/preview-security.js` protects supplier mockup sources with the existing tiled watermark, without placing a promotional blue footer inside the printed design. Alpha and exact print-area dimensions are preserved. Customer-visible mockups still receive their existing watermarks; clean unpaid images are never returned.
- `src/product-gallery.js` requests only actual catalog-listed lifestyle/studio groups. Non-apparel favors a supported lifestyle scene, apparel a flat/studio view. No artificial room is presented as a manufacturer's proof. Availability depends on the exact provider product.
- `src/printful-v2-mockup.js` adds a **narrow tumbler fallback** only when the old catalog has no print area or returns 404. It verifies the existing exact product and variant, supported placement/technique, simple print geometry, real style IDs and variant restrictions. It converts provider inches/DPI to the pixel geometry used by existing proofs, creates one V2 task, and polls that exact task. No product/variant substitution or invented dimensions. Unsupported advanced geometry and incomplete data fail closed. A live completed tumbler mockup is still an acceptance gate.
- `src/workflow.js` isolates fresh gallery tasks using a `studio2` key; existing paid/approved mockup records are not overwritten. It retains provider lifestyle metadata and routes the validated tumbler fallback. No changes to actual Printful orders or Shopify catalog.
- `public/index.html`: RM-052 build marker, isolated new CSS and checkout cache update. The prior world expansion, hero fixes and animation are preserved.

## Validation actually performed before branch publication
- Isolated baseline workflow **37567645125** passed on the exact preparation anchor; downloaded archive source SHA recorded in that workflow.
- Local baseline full Node command could not run one file because Miniflare was unavailable locally. The remaining **263** baseline tests passed. No full-local-suite claim.
- Updated local suite excluding only that same dependency-bound file: **279 passed, zero failures/skips** (includes 16 new behavioral/raster-mask/proof/provider tests).
- Sharp reference compositor: three finishes at 1200x1440 output correct-size PNG with transparent background, opaque subject/center, binary soft-edge alpha, and an identical alpha channel before/after supplier watermarking. Segmentation in this test uses a deterministic synthetic fixture; it is NOT a Cloudflare quality benchmark. All generated test graphics contain no customer image.
- Offline Chromium DOM checks at 320/393/1440: all 10 physical product cards stay within their media stages; no horizontal overflow; cutout default, soft-finish invalidation, reset, lifecycle selection and final-review gates work. Normal local navigation was blocked by browser administrator policy. The local version used an offline about:blank fixture and origin adapter; CI runs the exact unmodified pages with intercepted APIs instead. No real providers are contacted by these tests.
- New test-harness syntax/undersized-PNG-fixture issues were corrected locally before publishing. The production source passed syntax checks. `git diff --check` clean.
- Full locked-dependency Node suite, Wrangler dry-run, existing policy browser tests, new WebKit/Chromium product tests and pixel tests must all pass in the isolated workflow before main is advanced. Inspect that run; do not infer success from this plan.

## Official technical references checked
- Cloudflare Images foreground segmentation and transformations: https://developers.cloudflare.com/images/optimization/features/
- Binding draw compositing (`in` for the alpha mask, `atop` for alpha-preserving watermarks): https://developers.cloudflare.com/images/optimization/draw-overlays/
- Printful print-file guidance recommends real PNG transparency and halftones instead of semitransparent fades: https://help.printful.com/hc/en-us/articles/50264019148177-How-should-I-prepare-my-print-file-for-the-best-results
- Printful V2 catalog and mockup task contracts: https://developers.printful.com/docs/v2-beta/

## Costs, live limits and rollback
No real AI render, live foreground-removal comparison, purchase, Printful production order, refund or social post was initiated during development/testing. New customer-triggered background removal uses Cloudflare Images processing and can incur that service's charges; it is not represented as free or covered by the website's FLUX inference reserve. It is cached once per source; failures do not silently cause repeated processing. Physical print quality, real cutout edge quality and the exact live tumbler catalog/task remain unverified by mocked tests.

GitHub account notification preferences have NOT been changed. One isolated preparation and one consolidated production release are intended; existing notification settings may still email for those workflow runs. No customer transactional email setting was disabled.

Rollback only the RM-052 application change on top of then-current main. Do not roll back to the September branch or undo existing orders. Once v5 purchases exist, keep v5 PNG finishing/serving support for those approved jobs even if the storefront is reverted; otherwise their matching files cannot be safely fulfilled. Existing v4 jobs must remain unchanged. Do not delete cached cutouts or clean print files still referenced by orders.


## Observed isolated CI validation
Run 37570400509 applied and verified source-delta SHA256 97d1250e28096fadc673be52c34069ffb80c3c98a0d12c0b60ea88da7efa4d50 against preparation commit 7d7d88209973c5eac42e8e36e57757dec5b45ba3. All 280 full Node tests passed with zero failures; Wrangler dry-run, three raster-finishing checks, WebKit 393 / Chromium 320 and 1440 product-browser checks, and the existing RM050 credit/owner-policy browser checks passed. Providers and writes were mocked; no live segmentation, Printful generation, purchase, or fulfillment was performed. This validated source is published only to the isolated branch; production promotion and live verification are separate. The resulting exact application commit is recorded in the rm052-validation artifact and workflow log.
