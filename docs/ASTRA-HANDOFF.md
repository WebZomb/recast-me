# Recast Me — cumulative Astra handoff

Updated: 2026-09-29. Keep this index and append-only session records current whenever work is performed; the owner does not need to repeat the request for notes.

## Start here

- [RM-001: recovered baseline and requirements](ASTRA-HANDOFF-RM001.md). This is an exact preserved copy of the original handoff (blob 83d3d01e98bc9dd9a77b8489ba9af9bea543865b).
- [RM-002: protected previews and AI-call controls](ASTRA-SESSION-RM-002.md). New code, tests, activation requirements and limitations.

Application baseline: `209ac10fd4a7ec3b156417a08e2df86ad77b766a`.
Notes-only predecessor: `cf03314c152d8fd832245f3812410ef2e9393983`.
Implementation branch: `recast/secure-previews-2026-09-29`.

Do not confuse uploaded code with a deployed application. The new preview boundary requires an Images binding, and the optional AI-call limit is not a monetary spending ceiling. Read the latest session before merging. No engine switch or paid render was authorized by this handoff.

For each future session, record baseline/head commits, changed files, reasons, tests actually run and their evidence, failures, costs, deployment state, unresolved items and rollback. Preserve older entries; correct claims with a dated correction. Keep secrets, customer photos, access tokens and private transcripts out of this public repository.

Astra should independently inspect the diff, rerun tests, and decide accept/revise/reject/insufficient evidence for each change. Passing mocked tests does not establish live provider quality, browser behavior, purchase success or total security.
