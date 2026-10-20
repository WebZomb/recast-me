# Community heart persistence — October 20, 2026
Baseline main eff6e86a22041fe36c638cef4532d4f73a3aa373. Owner reports repeat hearts after returning; screenshots show two hearts but do not independently establish requests/network identity. Source confirmed network-only identity and independent browser-local toggles. Popular already sorts descending, top100 within30days; preserved.

Implemented signed HMAC HttpOnly Secure SameSite cookie retaining original salted network voter for one year across network changes; server GET supplies liked state, UI uses filled heart and server state instead of local toggles. Legacy network votes recognized without destructive migration. No rawIP stored. Sameinitial-network guard preserved; anonymous cookies do not establish unique humans across cleared storage/devices. Reports retain network identity. Privacy disclosure updated. No customer votes reset or live customer artwork touched.

Seven focused tests PASS including changed-IP retries/reload/undo, tampered-cookie rejection and legacy votes. Full602 Node tests PASS after linking existing dependencies; first full test attempt failed missing packages, not assertions. Browser regression added for filled/pressed heart after reload; execution/hostedCI pending. No deployment yet. No paid order/render/spending.

Rollback code through guarded deploy, retaining Community records and existing votes; cookie can be ignored by older code. Do not delete records or broadly reset vote counts. Further AppStore readiness requires abusive-user block capability review; heart deduplication does not meet that requirement by itself. CartPR93 stilldraft/defaultoff despite732tests and hostedbrowser pass: realunpaidStorefront handoff, receipt/sessionrenewal and completed/expired reconciliation remain.

Worker bundle dry-run PASS. Local browser run failed before assertions: Chromium executable missing. Hosted browser validation remains required.
