# RM-007 test-fixture correction — 2026-09-29

The second RM-007 CI run still showed four social-suite failures. Inspection found the production logic was being exercised with a stale social test fixture: RM-007 correctly defines IMAGES.info as part of readiness because server-side preview protection calls it, but the social mock only implemented IMAGES.input. The fixture therefore represented a broken binding and the gate correctly prevented inference. The quota-recovery test also deleted only the legacy health key even though RM-007 intentionally persists per-mode state at system/render-health-high.json.

Correction is test-only: make the social Images mock satisfy the same input+info contract as the real binding, and clear the new High-Quality circuit key when that test deliberately simulates capacity restoration. Application code is unchanged. This does not weaken website or background readiness. Full CI and Preview deployment are required after this correction.
