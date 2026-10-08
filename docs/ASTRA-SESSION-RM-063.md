# RM063 — failed sticker print-file recovery

Baseline main c5873eb056c59a19e7027f44378ace6179a8657d, tree546df4fc4e36ead465e496965036e8cd2651c00f. October8 UTC. Owner requests recovery of paid sticker sheet1002 after no Printful arrival.

## Evidence and diagnosis
Shopify connector confirms PAID/UNFULFILLED. Recast job auto_print_review with Network connection lost. Read-only provider lookup returned404 for exact bounded reference in configured store18798877; no draft-attempt lock was reported. Existing mug1001 retains provider179697346. Owner-approved artwork action succeeded on1002; print preparation returned finish_in_progress. These establish an interrupted clean print-file operation with a durable finish claim, before a Printful draft attempt; they do not establish the upstream cause of the network failure. No second Shopify purchase or paid production submission made.

## Implementation
- order-approval.js retains original finish claim and permits one separately claimed owner recovery of the same immutable approved snapshot. No AI regeneration.
- workflow.js owner recovery revalidates paid order/design, blocks any prior provider attempt or changed payment, atomically claims recovery, holds the job, prepares the clean file and creates one draft that remains held. No provider confirmation. Existing inspected-draft release remains a separate owner action.
- Auto processing now exits immediately for held/revoked jobs and records its stage to make future failures actionable. No new silent billable retries.
- Admin shows the controlled recovery action and prioritizes hold reason. Cache revision2630.
- Tests cover confirmation gate, exact source preservation, unchanged original claim, held draft only, duplicate blocking and no silent finishing retries. Full test result/deployment/live outcome recorded below once observed.

This repairs recoverability; it does not guarantee provider availability or declare automatic fulfillment launch-ready. No secrets/customer photos/private URLs committed. Rollback the enumerated RM063 source/UI/test changes over baseline without deleting any live finish, recovery or provider claims. A failed recovery remains held for investigation.
