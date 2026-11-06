# Last small-gift preparation holds — November 6, 2026

## Verified starting point
Baseline main: aeb3aa06f6530a5e7592e61f9adbd9cea0134f81. The immediately preceding owner-authorized review published 20 individually inspected gift variants, increasing the public catalog from 150 to **170 offers**: 70 mug sizes, 33 coaster sets, 34 magnet sets, and 33 sticker sheets. The small-gift queue is **100/105 published, 0 ready for review, 5 held**. This does not mean the other thirteen product categories are purchasable.

The inspected additions were Dalmatian Christmas Fire Engine, Sphynx Christmas Present, Dachshund Gingerbread Village, Rottweiler Fireside Christmas, and Jack Russell Snowy Sleigh (all three gifts each); Poodle Christmas Village coasters and magnets; French Bulldog Toy Shop magnets and sheet; and Orange Tabby Christmas Village coasters. Each was compared against the original artwork, two actual saved Printful views, and its clean native production file before the explicit publication action. No customer payment or printing was triggered.

A separate anonymous 393px browser test added a Dalmatian coaster, Rottweiler magnet, and Sphynx sticker sheet; checked images, quantity changes, removal/re-addition, and the $79.97 subtotal; reached Shopify checkout with all three breed descriptions visible after expanding the desktop order summary; then cleared the isolated test basket. An earlier test failed its mobile collapsed-summary assertion and cleanup check, so it was not counted as a pass. The corrected second test passed without entering customer/payment information. These are cart/checkout-entry checks, not physical sample or paid-order tests.

## Known holds
- Poodle Christmas Village Sticker Sheet: gift_batch_poll.
- French Bulldog Christmas Toy Shop Coaster Set: gift_batch_create.
- Three Siamese Christmas Village gifts: gift_batch_source.
- Siamese mug 11oz source failed with Images-binding error 9502 before source metadata was saved. The 15oz source was held as seed_source_pending. These two mug sizes are separate from the five small gifts.

## This change
src/shop-held-task-reconcile.js is narrowly scoped to the first two named holds. It finds a unique saved supplier task only inside the exact approved artwork/SKU prefix, verifies current source approval, the variant mapping, original source hash, design, and placement, then reuses/polls that exact task. It never calls Printful task creation and never deletes a claim.

A completed existing task can move back to preparation for the existing native-file freezer and later explicit visual review. Its original held record and original supplier task are archived privately, and the update is conditional on the held record's ETag. Missing/ambiguous tasks, a confirmed supplier failure, changed identity, or an interrupted reconciliation stay held. Already-published or already-frozen products are untouched.

The new GET-only /api/shop/held-reconciliation returns a sanitized progress summary and source-presence booleans, not credentials, task keys, signed picture URLs, raw provider replies, customer files, or approval authority. The dedicated PREMADE_HELD_TASK_RECONCILE_ENABLED configuration flag enables the owner-directed check and can disable it without altering current offers. The source-specific Siamese import is diagnosed but is NOT recreated by this module.

## Release gates and rollback
Run new mocked identity/idempotency/concurrency/failed-provider/no-task/GET-only tests, all existing Node tests, the Worker dry run, and hosted checks before merging. A successful test or commit is not a production release. Record deployment and live results separately.

No AI generation, replacement provider task, payment, production order, Shopify mutation, or automatic publication is authorized by this change. Printful's documented task-result endpoint is GET /mockup-generator/task with the saved task key; an unknown original result must not be treated as a confirmed failure and blindly recreated.

Rollback by setting PREMADE_HELD_TASK_RECONCILE_ENABLED=false or reverting the focused code release. Preserve reconciliation receipts, original task archives, source claims, existing catalog offers, and all customer orders.
