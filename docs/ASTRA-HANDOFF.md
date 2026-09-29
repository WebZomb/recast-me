# Recast Me — cumulative Astra handoff

Updated: 2026-09-29. Keep this index and append-only session records current whenever work is performed; the owner does not need to repeat the request for notes.

## Start here

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

Do not confuse uploaded code, mocked validation, a dry-run, or a Cloudflare PR Preview with a deployed production application. The optional AI-call limit is not a monetary spending ceiling. No engine switch or paid comparison was performed.

For each future session, record baseline/head commits, changed files, reasons, tests actually run and their evidence, failures, costs, deployment state, unresolved items and rollback. Preserve older entries; correct claims with a dated correction. Keep secrets, customer photos, access tokens and private transcripts out of this public repository.

Astra should independently inspect the diff, rerun tests, and decide accept/revise/reject/insufficient evidence for each change. Passing mocked tests does not establish live provider quality, browser behavior, purchase success or total security.
