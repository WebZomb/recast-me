# RM-014 — approved daily generation budget

Date: 2026-10-03.
Baseline: `25d16e7caa33f2a0c37456a459565b25990e5240` on `recast/secure-previews-2026-09-29`.
Result: this documentation commit (identify with `git log -- docs/ASTRA-SESSION-RM-014.md`).

The owner approved a $5/day AI generation budget, adjustable as the business grows. No automatic budget increase is authorized. At full use the reservation target is $150/30 days or $155/31 days, plus unrelated services. Keep FLUX.2 dev HQ and previously accepted customer allowances.

Changes: activation guide now records `AI_DAILY_BUDGET_CENTS=500` as the approved activation target; cumulative handoff links this record. No application or deployment configuration changed. The per-call reserve is unmeasured; configuring the daily variable alone would fail closed, so it was not added to Wrangler. Current runtime overrides remain unverified. Verify largest supported reference/step settings against billed usage before activation. Prior 4–6-cent estimate is not a worst-case cap.

Validation: documentation diff reviewed; `git diff --check`. No application tests needed for prose-only changes. No AI, Images, commerce or production actions; no billable provider requests. GitHub documentation upload only. No production merge. Earlier commerce/preview activation gates remain.

Rollback: revert this documentation commit if the budget decision changes; no ledger or artwork changes to undo. Record any new owner-approved amount explicitly.
