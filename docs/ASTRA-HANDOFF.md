# Recast Me — cumulative Astra handoff

Updated: 2026-09-29. Keep this index and append-only session records current whenever work is performed; the owner does not need to repeat the request for notes.

## Start here

- [RM-001: recovered baseline and requirements](ASTRA-HANDOFF-RM001.md). Exact preserved copy of the original handoff (blob 83d3d01e98bc9dd9a77b8489ba9af9bea543865b).
- [RM-002: protected previews and AI-call controls](ASTRA-SESSION-RM-002.md). Implementation, activation requirements and limitations.
- [RM-002: observed full-repository validation](ASTRA-RM002-VALIDATION.md). **73 mocked tests passed; Wrangler dry-run passed** at source commit b0dd044bd2a90d6bc6ac800c8f0b011aea3c3ae6. Actual provider, browser and commerce verification remains outstanding.

Application baseline: `209ac10fd4a7ec3b156417a08e2df86ad77b766a`.
Notes-only predecessor: `cf03314c152d8fd832245f3812410ef2e9393983`.
Implementation commit: `b0dd044bd2a90d6bc6ac800c8f0b011aea3c3ae6`.
Implementation branch: `recast/secure-previews-2026-09-29`.
Review: https://github.com/WebZomb/recast-me/pull/1 (draft, not merged at the last check).

Do not confuse uploaded code with a deployed application. The new preview boundary requires an Images binding, and the optional AI-call limit is not a monetary spending ceiling. Read the session and validation addendum before merging. No engine switch or paid render was performed.

For each future session, record baseline/head commits, changed files, reasons, tests actually run and their evidence, failures, costs, deployment state, unresolved items and rollback. Preserve older entries; correct claims with a dated correction. Keep secrets, customer photos, access tokens and private transcripts out of this public repository.

Astra should independently inspect the diff, rerun tests, and decide accept/revise/reject/insufficient evidence for each change. Passing mocked tests does not establish live provider quality, browser behavior, purchase success or total security.
