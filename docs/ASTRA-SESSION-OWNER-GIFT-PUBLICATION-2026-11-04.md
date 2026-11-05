# Finished-gift purchase continuation — November 4, 2026

## Request, baseline and actual scope
The owner explicitly asked to continue until the shop is finished and purchasable, not to create more preview-only categories. Baseline main was ac423527bcb361069b691fb03be0c896acbe6dbf. The existing code already prepared actual frozen native clean files for three Golden Retriever Christmas Village items: Coaster 4-Pack, Magnet 3-Pack and six-picture Sticker Sheet. Each has genuine saved Printful views but checkoutEnabled=false pending visual review. All 35 designs across all 17 categories are NOT completed by this change.

The connected Opera browser is currently unavailable and the checked Chrome review context was not connected. A live public small-gifts status check confirmed all three remain ready_for_review, not published. The prior GitHub deployment credential's R2 read permission denial is respected: no retry, new token, scope expansion, private export or public image exposure was attempted. Existing owner login is still necessary to inspect and authorize the real commercial images.

## Implementation: finish the publication step instead of another preview pilot
- New src/shop-small-gift-publish.js exposes only POST /api/admin/small-gifts/publish after existing Admin Bearer authorization, required same-origin header/marker, configured LIVE_APP_URL and existing PREMADE_SMALL_GIFT_RELEASE_ENABLED=true. Authentication precedes any private reads. Preview hosts cannot publish into the shared live store.
- Accepts only five fixed fields (known product ID, four-hash review signature, native-file SHA, original revision and explicit PUBLISH_THIS_REVIEWED_PRINT_FILE confirmation), with a 2 KiB streaming body limit. Arbitrary SKUs, URLs, paths, stale signatures, missing confirmations and unknown products are rejected.
- Reuses inspectSmallGift (shared from the read-only QA module) to verify actual original identity, preapproval hash, native file bytes, completed exact Printful task/variant/layout and signed proof. Requires at least one correctly scoped saved supplier image. Then uses the existing publishSmallGift implementation, existing full resolveShopOffer integrity/content-safety/current ACTIVE Shopify validation and CAS catalog update. No buyer-provided prices or artwork URLs are trusted.
- This is a separately authenticated owner action, NOT an automatic signature exemption: REVIEWED_SMALL_GIFT_SIGNATURES stays empty; no cron/GET/checkbox/page-load publishes anything. Only the explicit owner POST supplies one exact reviewed signature to the internal publication function.
- Records a private per-product/per-signature audit (no credential value). Repeat confirmations and concurrent same-item requests preserve prior mug offers and do not duplicate catalog rows. A response lost after commit is not described as "nothing changed"; the owner is told to refresh status before retrying. No paid order or supplier production is created.
- Existing read-only GET review and native-byte routes retain Admin authorization, private/no-store headers and 405 on POST.

## Owner interface
- Native review page now offers an explicit Publish reviewed design control. It first verifies the fetched native-file SHA in the browser and requires the original, actual supplier view(s) and clean native image to decode successfully. Failed image/file checks leave controls disabled.
- The owner must check the visual-review acknowledgement and accept a separate confirmation before the one-item POST. Cancellation and refresh are read-only. On success the exact category link is shown; locking still aborts old requests, revokes native blob URLs and removes private images/token from the tab.
- The Ready-Made QA tab has a same-tab link to /admin-small-gifts, preserving the existing owner session without putting any token in a URL. The page does not bypass login.

## Catalog loading
The public catalog previously awaited verification for every offer serially. New request-local collectVerifiedShopOffers runs at most four complete verification chains concurrently, preserving order and hiding failed offers. No stale availability or price cache was introduced, and Add to Cart still performs the existing full integrity checks. A local pre-change live timing attempt failed on DNS resolution, so no measured live speedup is claimed.

## Verification evidence / limitations
- First focused publication/private-review/native-freeze tests: 18/18 passed. Initial full Node suite: 888/888, Worker dry-run passed before later concurrency additions.
- First WebKit publication fixture correctly kept controls disabled because its wildcard mock handler intercepted private blob images as unknown remote hosts. The fixture was fixed to let the browser decode blob: bytes normally; the application image/hash gate was NOT weakened.
- Updated mocked owner publication tests passed at 320/393/1280: no writes on load, acknowledgement required, cancellation no-op, exact confirmation payload, success link, no duplicate on refresh, locked image removal, corrupt native hash refusal and no bearer leak to image hosts.
- Existing mixed-cart regression was rerun in WebKit (quantity/removal, custom plus premade items, retained checkout and responsive layout). Final complete Node/browser/hosted/deploy receipts must be checked after the final branch head before claiming deployment.
- New tests cover four-chain bounded verification, order preservation, rejected offers hidden, no availability cache, disabled release and preview-host denial. A dedicated hosted workflow runs full Node tests, Worker dry-run, Chromium+WebKit owner publication and existing mixed-cart checks with fixtures only.
- No real owner publication POST, purchase, payment, Shopify product mutation, Printful task or physical production was executed during development. The actual supplier/native files remain visually unapproved without an unlocked owner session. Passing fixtures does NOT mean a live non-mug product has been made buyable.

## Rollback and next real milestone
Disable PREMADE_SMALL_GIFT_RELEASE_ENABLED to prevent further owner publication or revert this focused route/UI change. Preserve native files, signed proofs, existing orders, carts and private audit receipts. Reverting the interface is NOT an unpublish operation for any design that an owner may already have intentionally released; removing such a design needs a separate explicit catalog action.

Next: owner unlocks existing review access, visually checks real supplier/native files and explicitly publishes a satisfactory prepared design. Then verify its actual public catalog entry, Add to Cart, quantity, removal and checkout handoff without payment. Only then call that design purchasable. Larger products still need suitable high-resolution/layout-specific masters, and the remaining breeds need their own exact supplier and final-file approval; do not claim the full shop complete.
