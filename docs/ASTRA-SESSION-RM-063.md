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

## First deployment and recovery evidence
334 local mocked tests passed. Application79ffa16d05473d46e8169757a15b2b6541d26922 deployed (Workers113158880144 success). Owner-authorized recovery used the same paid order and held it before image preparation. The preparation again returned Network connection lost, with no draft created. Do not call this recovered. Code review then found generic4096px finishing inflated the sheet canvas to4096×5809 (~95MB raw RGBA), despite supplier's exact1750×2482/300DPI template. Correcting the sticker-only clean finish width to1750 preserves physical layout and avoids that unnecessary enlargement. This is a concrete resource correction, not proof of the network error's upstream cause. A single recipe-versioned recovery claim allows the changed native-size recipe without erasing either earlier attempt. Other products keep their original limits. Paused recovery errors now persist visibly.

## Native-size deployed recovery receipt
Applicationdfb1163ff43d462ad18d7bc5afb3fa6fd551bb89 deployed successfully (Workers113159987856); public-browser-audit113159749592 SUCCESS.334 full local tests passed after native-size correction;49 focused commerce/sheet tests passed after error-persistence addition. Corrected recipe then successfully prepared the exact original-photo print file and created Printful draft179888000 for order1002 at2026-10-08T05:10:58Z. Authenticated read-only provider check found the same reference/store, HTTP200, statusdraft. Recast remainson_hold, quantity1, same artwork identifier. No Printful confirm or additional customer charge. Screenshot recast-sticker-order-recovered-rm063.jpg saved privately. Owner must inspect draft before the existing inspected-draft release; AGENTS prohibits agent auto-confirming fulfillment. Future sheets use exact native300DPI dimensions. Future automatic order-to-production and physical quality still need acceptance; this recovered draft alone is not proof of the complete automated path.
