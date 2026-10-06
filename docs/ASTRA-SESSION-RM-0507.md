# RM-050.7 — inspected recovered-draft release — 2026-10-06

## Baseline and live evidence
Baseline main c966b53fd1a8498810fa88fb8da2251958a4d5ff. Owner supplied Printful screenshots for recovered mug draft #179697346. The order is still Draft / saved as draft. The Print file shows the approved two-sided mug artwork filling the printable band vertically with the dark ambient center/background, and the mockup shows the approved artwork on the white 11 oz mug. Owner has not clicked Printful's red Confirm order button.

## Change
- Add owner-only `release-recovered-draft` admin action.
- UI shows **Approve inspected draft & send to production** only for a recovered Printful draft that is still on_hold, has a recorded Printful order ID, and has not been submitted.
- Requires explicit confirmation phrase `SEND_INSPECTED_RECOVERED_DRAFT`.
- Server revalidates Shopify paid-order identity and the exact approved final print file/placement.
- Server performs a fresh Printful GET by recorded order ID and requires exact external_id match, configured store match when present, and status=draft.
- Only then creates the existing atomic production-confirm claim and calls Printful /confirm exactly once.
- Successful provider response is saved before best-effort Shopify tags. Job leaves hold and becomes submitted_to_printful.
- A provider error keeps the job on_hold with an explicit ambiguity message. Mismatched or non-draft Printful states are blocked before confirm.
- Existing generic send-production remains unavailable while on_hold; this new action is the only intended release for recovered drafts.

## Tests
Added functional regressions for: wrong confirmation -> zero provider calls; exact recovered draft -> one status GET + one confirm, persisted submission and idempotent second call; changed provider reference -> blocked with zero confirms. Existing RM-050.5 recovery tests and RM-050.4 workerd diagnostics remain in the full suite.

## Preservation
No artwork, mug composition, catalog, price, quantity, render settings, customer credits, domain, Shopify order-processing setting, recovery claim, or Printful draft contents are changed by this code update. CI uses fixtures only; no live Printful confirmation occurs in tests.

## Next live action
After green CI and production deployment, owner should refresh Recast admin and use the new Recast button, not Printful's red Confirm order. That owner click is the actual paid-production submission for draft #179697346. Afterwards verify Recast status, Printful status, and later tracking/Shopify fulfillment before doing a fresh normal-path test purchase.

## Final launch test recommendation
After #1001 completes through shipment/tracking, run one brand-new normal customer purchase to prove the non-recovery path end-to-end. A lower-cost permanent test product can be added afterward; current mapped physical catalog makes the 11 oz mug the cheapest production-cost mapped item, while a future sticker could reduce test cost if its Printful mapping and Shopify listing are added and tested separately.
