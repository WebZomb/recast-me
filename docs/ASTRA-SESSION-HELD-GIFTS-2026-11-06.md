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

## Work continuation: recovery deployed and actual supplier review
PR176 merged as 871358b14e859930136e6ca812bd408ddff381ef. Guarded deploy42278411135 passed offline tests, Worker dry-run, deployment and production smoke. Public reconciliation confirms the Poodle existing task resumed; French Bulldog Toy Shop coaster reports no_saved_task_evidence and remains held. No replacement coaster task was submitted.

After secure owner login, the Poodle Christmas Village original, both actual Printful sheet views and clean 1750x2482 six-picture transparent PNG were inspected. Exact signature f22ebd11b3ec701b553c1c623e50b8f88dc040c362902806e3e86368c37abd81 was explicitly published through the existing private UI, which confirmed Add to Cart enabled. This adds one option to the previous170 (live catalog recount pending).

The owner repair restored the exact Siamese original and submitted one first preview per 11oz/15oz mug. Both reached ready_for_review. All three saved supplier views per size were downloaded and visually compared with the original: same Siamese subject, Christmas hat/scarf/village, clear face on both handle-side views and expected rear wrap junction. Reviewed signatures are 88bec6f6685766c6fb593816df75004d24f3db309f2c55c9de75419a7d01a1d0 and 3894ecd0883074c96a052ef23b6aa1dec31aa289ab146c2a8dd0cb7b5b8be114. This follow-up pins those exact signatures for existing publication validation; no generic approval bypass.

Three Siamese small gifts remain in gift_batch_source from before any provider attempt. The follow-up lets only these exact source holds proceed once the recovered original has a verified published supplier offer. It requires no previous start/design/task, no existing release or supplier record, full current source/template validation, the existing shared rate window and lease, an archived original hold, and an ETag-conditional transition. Any uncertain new submission stays held and cannot repeat. Existing products remain unchanged; publication of the three new gifts still requires individual print/proof review.

Validation before the two signature additions: 933 Node tests PASS and Worker dry-run PASS, including source hold recovery, prior-task denial, unpublished-source denial, rate denial, lost-response single-attempt behavior and concurrent changed-hold preservation. Final-head checks and follow-up deployment remain pending at this checkpoint. Narrow UI review on the existing owner page showed matching six-tile layout and separated controls. No paid order or production request. Thirteen larger categories still require their own print-ready masters and supplier proofs; not complete.

Rollback: revert only the new recovery/signature change before publication; after publication preserve all frozen files and offer histories. Do not delete task claims or records. French Bulldog's unknown earlier provider acceptance remains a separate investigation.

Final-head validation correction: the first run after adding Siamese signatures failed two static approval-map assertions because they still expected the prior exact map and count68. Updated those assertions to the two reviewed signatures and count70; the other queue-size checks remain unchanged. Rerun results recorded at release.
