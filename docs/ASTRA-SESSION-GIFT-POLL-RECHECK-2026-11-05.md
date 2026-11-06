# Existing-task gift preview reconciliation — November 5, 2026

## Owner request and baseline
Continue finishing the ready-made shop, including actual cart availability rather than galleries alone. Baseline main: 66ba43cf43fe4adc10963048a4d4b0b0e0d2b7a9. The session began with 20/105 published small gifts, 80 native files ready for review and five holds, excluding 70 existing mug-size offers. Digital inspection and explicit publication of ready designs continues independently through the existing private owner interface.

Two non-Siamese holds report gift_batch_poll. A failed status read is not proof that the supplier's previously created task failed. This focused change checks the existing task without creating a replacement. The three Siamese source-import holds are not bypassed or reset.

## Implementation
- Add src/shop-gift-poll-recheck.js, gated by PREMADE_GIFT_POLL_RECHECK_ENABLED=true. Eligible records must be a registered non-Golden gift, needs_review with exactly gift_batch_poll, retained mockup ID, matching source revision and design, valid rights/screening metadata, and fewer than 20 prior polls.
- Existing queue source validation still requires an approved supplier offer and exact native print dimensions. The helper additionally matches the saved supplier request, SKU, variant, task and design. Existing frozen/published native files are untouched.
- A conditional create-once audit is stored before provider contact. Confirmed failed provider tasks stay held and are never recreated. A pending/processing/completed task may receive one GET through the existing mockupStatus function. No new task POST, AI generation, customer charge, production or automatic publication is added.
- Completed actual views return to the ordinary source-checked native-file preparation and individual visual approval path. A pending result continues the same task with its existing counter incremented, not reset. Failed or uncertain results consume the one reconciliation attempt and preserve the original hold.
- Compare-and-swap promotion requires the exact previous state. Concurrent newer records cannot be overwritten. Existing queue lease and maximum four status polls per execution remain intact.
- Public status exposes only a safe reconciliation label, never source tokens, provider task IDs, private image URLs or raw provider error messages.

## Validation
Seven new tests cover disabled and wrong-source rejection, one existing-task GET, terminal failure holding, no repeat after uncertainty, concurrent claims, newer-state preservation and native-file queue integration without catalog publication. Focused tests passed 15/15. The complete local suite passed 918/918; Wrangler dry-run passed. Hosted tests and actual production rollout must be recorded separately; no recovered live proof is claimed by these offline tests.

Official references: existing mockup task results are retrieved with GET and task_key (https://developers.printful.com/docs/). Cloudflare R2 conditional writes evaluate preconditions atomically (https://developers.cloudflare.com/r2/reference/consistency/).

## Limitations and rollback
No visual approval or purchase gate is weakened. Larger blanket/apparel/canvas collections remain unfinished. Physical sample quality is not established by digital inspection. Disable PREMADE_GIFT_POLL_RECHECK_ENABLED to stop future rechecks; preserve all task claims, audit records, native files and reviewed live offers. Never delete claims to force a repeated supplier request.
