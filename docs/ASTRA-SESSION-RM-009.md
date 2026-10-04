# RM-009 — readiness-aware retry controls

Date: 2026-09-29
Parent: a16e393bbc96e33418bcc4c1d21cc8c8c68c5a88

## Real Preview evidence
The owner attempted one controlled High-Quality render after RM-008. Cloudflare returned another temporary capacity/busy result. Support reference: `GEN-MUN9HTTB-1C16`. RM-007 correctly opened the High-Quality cooldown and the main Create control changed to Temporarily busy/cooling down. However, the error card still displayed an enabled `Try High-Quality again` button. The server gate would block it, but the UI invited an action known not to be ready.

## Correction
Retry and quality-switch controls now synchronize to the same passive readiness snapshot as the main Create control. During a failed mode's cooldown its retry button is disabled and says it is temporarily busy/checking. It becomes actionable only after readiness polling reports that mode ready. The alternate quality button remains optional and is enabled only if that mode is independently ready. Neither mode is silently selected.

Every retry/switch click performs another zero-AI-call readiness refresh immediately before form submission. The server-side preflight remains authoritative, so DOM manipulation cannot bypass the circuit. Existing 30-second idle polling continues. Uploaded photo/settings and last successful preview remain preserved.

No provider/model switch, production deployment, purchase, Printful action, X post, or dummy AI probe is part of RM-009. Full CI and Cloudflare Preview deployment are required before broader testing.
