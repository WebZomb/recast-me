# Recast Me — cumulative Astra handoff

Updated: 2026-10-07. Keep this index and append-only session records current whenever work is performed; the owner does not need to repeat the request for notes.

## Start here

- [RM-024: owner-directed production test preparation](ASTRA-SESSION-RM-024.md). Production configuration verified present; controlled deployment in progress.

- [RM-023: visible mockup errors and preview fulfillment setup](ASTRA-SESSION-RM-023.md). Shopify live catalog verified; Printful secret still missing.

- [RM-022: product catalog isolation and owner diagnostics](ASTRA-SESSION-RM-022.md). 149 mocked tests passed; live commerce verification pending.

- [RM-021: owner artwork recovery and explicit rejection errors](ASTRA-SESSION-RM-021.md). Date/cursor-based recovery and exact diagnostic lookup; 148 mocked tests pass.

- [RM-020: original photos and private recovery links](ASTRA-SESSION-RM-020.md). No-AI photo products, browser transfer and history recovery; 144 mocked tests pass.

- [RM-019: purchase routing and stable adventure cards](ASTRA-SESSION-RM-019.md). Direct checkout script loading; 139 mocked tests pass.

- [RM-018: guided creation and reference labels](ASTRA-SESSION-RM-018.md). Who → Photos → Adventure; 134 mocked tests pass.

- [RM-017: HQ-first conditional fallback and renewing allowances](ASTRA-SESSION-RM-017.md). 131 mocked tests passed; feature configuration remains gated.

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

Latest: [RM-025 — mug activation and Shopify trial checkout hold](ASTRA-SESSION-RM-025.md).

Latest: [RM-027 — launch polish, production browser audit, and fulfillment-state correction](ASTRA-SESSION-RM-027.md).

Latest branding: [Approved RM orbit logo deployment and social assets](ASTRA-BRAND-ORBIT-2026-10-06.md).

Latest policy: [RM-050 — HQ-first daily previews, three purchase credits, simplified products and private owner settings](ASTRA-SESSION-RM-050.md).

Latest domain/UI follow-up: [RM-050.1 — RecastMeAi.com migration and owner-requested UI fixes](ASTRA-SESSION-RM-0501.md).

Latest mug/hero follow-up: [RM-050.2 — mug band composition, landing reference match and Printful connection evidence](ASTRA-SESSION-RM-0502.md).

Latest fulfillment diagnostics: [RM-050.3 — read-only Printful order lookup and draft-attempt investigation](ASTRA-SESSION-RM-0503.md).

Latest: [RM-050.4 — Workers-compatible order lookup and bounded Printful references](ASTRA-SESSION-RM-0504.md).

Latest: [RM-050.5 — verified-empty-store missing-draft recovery](ASTRA-SESSION-RM-0505.md).

Latest: [RM-050.7 — inspected recovered-draft release](ASTRA-SESSION-RM-0507.md).

Latest: [RM-050.8 — exact mobile landing hero match](ASTRA-SESSION-RM-0508.md).

Latest: [RM-050.9 — hero final scale cleanup](ASTRA-SESSION-RM-0509.md).

Latest: [RM-051.0 — Pic 2 precision hero match](ASTRA-SESSION-RM-0510.md).

Latest: [RM-051.1 — product gallery and Printful preview polish](ASTRA-SESSION-RM-0511.md).


Latest: [RM-051.2 — expanded worlds and final mobile visual polish](ASTRA-SESSION-RM-0512.md).

Latest: [RM-052 — transparent apparel and bounded product studio](ASTRA-SESSION-RM-052.md).


Latest: RM-053 discovery expansion and launch controls. Subjects and Worlds broadened; render burst limiter added. Existing 12-product checkout remains unchanged pending exact Printful candidate validation. Turnstile credentials remain account-gated. See ASTRA-SESSION-RM-053.md.


Latest: RM-054 restores the approved simple subject step and records the recovered product roadmap (Sticker, Phone Case, Pillow, Notebook; then Pet Bandana, Puzzle, Tote). Seven Shopify products were created as DRAFT only. Exact supplier variant candidates are isolated from checkout; an admin-only GET verifier can read their Printful V2 identities before any fulfillment mapping is enabled. See ASTRA-SESSION-RM-054.md.


Latest implementation: [RM055 product accuracy](ASTRA-SESSION-RM-055.md). Distinguish code checks, provider-generated samples, visual-reviewed manifest entries and paid physical tests. Do not claim unverified gifts/tumbler ready.

Latest reconciliation: [October 7 catch-up and restored validation](ASTRA-CATCHUP-2026-10-07.md). Current source includes six new mapped product types; older draft-only notes are historical. Single sticker and sticker pack remain distinct. 309 local tests and Worker dry-run passed; no live purchase or supplier verification in this session.

Latest launch audit: [October 7 live audit](ASTRA-LAUNCH-AUDIT-2026-10-07.md). Supplier mappings repaired; 29 real mockups and six new-category checkout links verified. 315 tests and final browser CI passed. Owner-paid fulfillment test, branding/support and bot protection remain launch gates.

Latest: [RM-056 — gifts, restored Shopify mug, content safeguards and X product requests](ASTRA-SESSION-RM-056.md). Image moderation integration requires explicit activation and a dedicated secret; X remains disabled.

Latest: [RM057 — varied supplier examples and matching Shopify draft](ASTRA-SESSION-RM-057.md).15 products/33 supplier views ready for owner image review; draft theme188993994996 unpublished. Poster fix0a692ec live; browser checks passed. Keep moderation/X and physical-order gates explicit.
