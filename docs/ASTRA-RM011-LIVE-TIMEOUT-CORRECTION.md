# RM-011 live-test correction — 2026-09-29

Owner attempted the planned 12-step benchmark but the screenshots prove High-Quality Preview was still selected. Therefore this was **not** a Standard/12-step quality result and must not be used to judge Standard.

Observed live High-Quality outcome:
- Existing successful artwork RC-MUNC1QXP-EF9019 remained available underneath the failed attempt.
- New High-Quality attempt waited roughly five minutes and then returned a provider timeout.
- Support reference shown in UI: GEN-MUNGIFM1-651F.
- About one minute after the timeout, the same-mode retry became available because RM-010 used a 45-second timeout cooldown. Owner flagged that as too soon.

Corrections in this commit:
1. Standard Preview is now the selected/recommended default on this draft Preview branch so the benchmark cannot easily be confused with High Quality. High Quality remains available explicitly.
2. Browser-side 135s/270s generation abort timers are removed. As with the previously removed server Promise.race timer, a browser abort cannot cancel Workers AI and can orphan a paid inference whose result may later be discarded.
3. Genuine provider timeout cooldown is raised from 45 seconds to 300 seconds to discourage immediate repeat submissions during provider instability. The alternate Standard mode may remain independently available because it is materially lighter (12 steps / 768x960) even though it uses the same FLUX.2 dev model.
4. Remaining server/client copy now calls qualityMode=quick “Standard Preview,” not “Quick Preview.”
5. model-status defaultMode is aligned to Standard for this benchmark.

No live retry was started by these changes. No production merge, provider change, purchase, Printful action or X post occurred. Next acceptance test must visibly show Standard Preview selected and should use the same dog photo + Halloween direction once. Compare identity, instruction adherence, runtime, watermark and actual diagnostic if it fails.

Scale implication: at the owner's 100–1000 peak-day target, orphaned or too-rapid timeout retries are unacceptable because they can multiply cost and provider load. Queue/idempotency/cost-reservation work remains required after the 12-step quality benchmark.
