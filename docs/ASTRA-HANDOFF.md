# Recast Me — cumulative Astra handoff

Updated: 2026-10-03. Keep this index and append-only session records current whenever work is performed; the owner does not need to repeat the request for notes.

## Start here

- [RM-016: likeness/anatomy and deployment clarity](ASTRA-SESSION-RM-016.md). 127 mocked tests passed; prompt version identity-anatomy-v2. Production confirmed older v1.5; latest protection still requires preview acceptance before merge.

- [RM-015: web polish and iPhone development project](ASTRA-SESSION-RM-015.md), [App Store readiness](APP-STORE-READINESS.md). Protected sharing, explicit AI permission, native offline preview gallery. 126 mocked tests passed; unsigned iOS simulator compiled successfully in Mac CI; application `7feaad0` deployed to Preview. Not yet signed or submission-ready.

- [RM-014: approved $5/day budget](ASTRA-SESSION-RM-014.md). Decision recorded; runtime settings unchanged until the per-call reserve is verified.

- [RM-013: bounded previews and customer print approval](ASTRA-SESSION-RM-013.md) and [activation checklist](COMMERCE-ACTIVATION.md). HQ-first; three starter previews/five per paid order; customer swap/proof/approval flow. 124 mocked tests and dry-run passed; application `5aaa7c8` deployed successfully to Cloudflare Preview. New limits remain inactive until configured. Owner-provided RM-012 comparison screenshots show successful output; physical print quality remains unverified.

- [RM-012: protected print-finish comparison](ASTRA-SESSION-RM-012.md). Owner accepted Standard in the September 30 PR record. New owner-only Preserve/Enhanced comparison; 100 mocked tests and local bundle passed, live upscaling still unverified.
- [RM-011: Standard FLUX benchmark](ASTRA-SESSION-RM-011.md) and [live timeout correction](ASTRA-RM011-LIVE-TIMEOUT-CORRECTION.md). Current draft customer modes both use FLUX.2 dev; Standard is 12 steps, High Quality 18.

- [RM-001: recovered baseline and requirements](ASTRA-HANDOFF-RM001.md). Exact preserved copy of the original handoff.
- [RM-002: protected previews and AI-call controls](ASTRA-SESSION-RM-002.md). Implementation, activation requirements and limitations.
- [RM-002: observed full-repository validation](ASTRA-RM002-VALIDATION.md). **73 mocked tests passed; Wrangler dry-run passed** at source commit b0dd044bd2a90d6bc6ac800c8f0b011aea3c3ae6. Actual provider, browser and commerce verification remains outstanding.
- [RM-003: Cloudflare PR Preview configuration fix](ASTRA-SESSION-RM-003.md). Automatic Preview cloned/installed successfully but failed because its AI binding lacked Preview configuration; the branch now declares `previews.ai.binding = "AI"`.
- [RM-006: capacity handling](ASTRA-SESSION-RM-006.md). Automatic same-model busy retry was removed and Workers AI calls use `rejectIfBusy`.
- [RM-010: timeout classification and wait-policy correction](ASTRA-SESSION-RM-010.md). R2 diagnostic `GEN-MUN9XZCT-7231` proved the prior “capacity” result was Recast Me’s own 125-second timer; the artificial timer is removed and timeout/busy/unavailable states are distinct.
- [RM-010: observed validation](ASTRA-RM010-VALIDATION.md). Application commit `8a949595f601959a1566c14b026256351e7a92c1`; **92 mocked tests passed and Wrangler dry-run passed**. Live image completion, watermark output, and likeness remain acceptance gates.

Application baseline: `209ac10fd4a7ec3b156417a08e2df86ad77b766a`.
Implementation branch: `recast/secure-previews-2026-09-29`.
Review: https://github.com/WebZomb/recast-me/pull/1 (draft; do not merge solely because CI is green).

Do not confuse uploaded code, mocked validation, a dry-run, or a Cloudflare PR Preview with a deployed production application. The optional AI-call limit is not a monetary spending ceiling. See dated session records for later model decisions and owner-run comparisons; the older RM-001/RM-002 no-change statements apply only to those sessions.

For each future session, record baseline/head commits, changed files, reasons, tests actually run and their evidence, failures, costs, deployment state, unresolved items and rollback. Preserve older entries; correct claims with a dated correction. Keep secrets, customer photos, access tokens and private transcripts out of this public repository.

Astra should independently inspect the diff, rerun tests, and decide accept/revise/reject/insufficient evidence for each change. Passing mocked tests does not establish live provider quality, browser behavior, purchase success or total security.
