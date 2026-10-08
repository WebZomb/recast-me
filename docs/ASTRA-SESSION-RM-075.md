# RM075 — owner same-browser daily reset

2026-10-08. Baseline remote f901123826c59981fd0c8a387bee1dc8214c2358, localac304c4. Owner requested three fresh test previews and notification of actual recovery.

Added POST /api/admin/reset-my-renders to existing authenticated owner route and Limits & usage button. Requires admin authorization, same-origin write and existing same-browser credit cookie. Resets only that network-shared daily HQ ledger to zero with fresh24h window and ownerResetAt audit stamp; rejects active reservations. Existing configured HQ allowance remains3. Site budget/call caps, bonus/purchase credits, Standard, moderation and models untouched. Does not start inference. User must click in Safari holding their existing wallet; agent browser cannot reset the user's separate wallet. UI explains network sharing and missing-wallet recovery. Admin asset versions bumped.

377 mocked tests passed; new regression covers unauthorized/missing-wallet/in-flight rejection and restoration2to3 without changing globalsettings. Worker dry-run and git diff check passed. No actual customer allowance reset or live render performed by agent. Deployment receipt pending. Files: src/owner-settings.js, public/admin.html, admin.js, admin-settings.js, tests/owner-settings.test.mjs and these notes. Rollback removes route/button together; no purchase records altered.

Read-only live health still lastHQsuccess21:49:48UTC, predating23:09failure. Hourly conditional notification created successfully; requires newerHQsuccessafter23:09:46.365UTC and newerthanlatestfailure, then disables itself. No paid probes. Statusreadyalone not recovery. Underlying provider failure remains unverified as resolved.
