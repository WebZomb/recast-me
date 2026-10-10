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

Latest: [RM058 — desktop hero alignment](ASTRA-SESSION-RM-058.md). Smaller mug and aligned photo/Recast/product composition above760px; phone rules preserved.

Latest: [RM059 — approved lifestyle catalog and visible product-preview loading](ASTRA-SESSION-RM-059.md).15 Shopify product images replaced and read back; matching website images, waiting overlay and duplicate-click guard.324 local tests pass; deployment/browser receipt recorded separately.

Latest work: [RM060 — contextual previews](ASTRA-SESSION-RM-060.md). Sticker example replacement and owner-only supplier view inspection; preview repair still under investigation.

RM060 follow-up: full-picture sticker example/copy live; owner now considering a sticker sheet replacement. Real room preview selectors and closer wall-art views deployed; supplier-specific exceptions remain for60×80blanket/phone-case and both-side pillow. Exact receipts, visual checks and remaining limits in RM060. No blanket claim of launch readiness.

Latest: [RM061 — six-picture sticker sheet replacement](ASTRA-SESSION-RM-061.md). Draft product, protected sheet compositor and exact supplier mapping implemented; activation waits for real supplier proof and checkout verification. Historical single-sticker mappings preserved.

RM061 completed: six-picture sheet ACTIVE at14.99; exact supplier preview, final review and Shopify checkout verified on public demo;332 tests and browser CI passed on4276321. Old single archived with historicalmapping preserved. Public Shopify theme is STILL Horizon; styled188993994996 remains draft. Owner publication required by connector restriction before public launch; no physical sample ordered. See RM061 final evidence.

Latest: [RM062 — launch recheck and pet viewpoint preservation](ASTRA-SESSION-RM-062.md). Owner-published matching Shopify theme observed public. Likeness prompt/photo guidance tightened;332 local tests pass, new provider output not yet tested. Moderation remains disabled and paid fulfillment acceptance outstanding.

Latest: [RM063 — interrupted sticker print-file recovery](ASTRA-SESSION-RM-063.md). Controlled owner recovery creates a held draft; paid production remains a separate inspection/release.

Latest: [RM064 — automatic fulfillment reconciliation](ASTRA-SESSION-RM-064.md). External provider confirmations, independent scheduled phases, bounded pagination, accurate hold/partial/tracking UI. Live receipts recorded in session; no new billable order.

Latest: [RM065 — durable skipped-order exceptions and safe owner recovery](ASTRA-SESSION-RM-065.md). Dashboard alerts, exact-order recheck and held 30-day backfill; 349 local tests and Worker dry-run passed. External alert delivery and live launch acceptance remain open.

Latest: [RM066 — configurable owner email and SMS alerts](ASTRA-SESSION-RM-066.md). Editable private destinations/categories/caps, provider readiness and explicit test buttons; scheduled dispatch code prepared, channels default off until owner configuration.358 mocked tests pass; real provider delivery not yet verified.

Latest: [RM067 — photo-policy and bot protection hardening, X safeguards](ASTRA-SESSION-RM-067.md).366 mocked tests and dry-run pass; no new paid order. Source improvements do NOT mean services enabled: Cloudflare verification/private credentials block live activation. Existing2orders in production, no audit issues; alert delivery and shipment acceptance remain unverified.

Latest: [RM068 — existing Gmail sender for alerts](ASTRA-SESSION-RM-068.md). Direct TLS SMTP adapter and clearer test-button setup;372 local tests and dry-run pass. Private Gmail app password and actual delivery acceptance remain required. No PourIQ backend/secret changes.

Latest: [RM069 — protection and X setup checklist](ASTRA-SESSION-RM-069.md). Owner confirms Gmail test receipt (Junk); delivery setup accepted. Actionable private photo/Turnstile/X setup guidance and consistent X credential presence;374 local tests pass. External activation/testing still required.

Latest: [RM070 — likeness across every world](ASTRA-SESSION-RM-070.md). Shared person/pet identity rules including illustrated styles and mixed groups;375 local tests and dry-run pass. Live likeness remains unverified; owner completed both Turnstile happy paths.

Latest: [RM071 — free-only baseline screening](ASTRA-SESSION-RM-071.md). Paid visual calls removed; narrower coverage disclosed;375 mocked tests pass. Live provider acceptance and deployment require separate evidence. RM070 deployment was found failed.

Latest: [RM072 — browser readiness after Turnstile](ASTRA-SESSION-RM-072.md). Owner clean-photo acceptance recorded; audit networkidle timeout diagnosed. X deferred by owner; manual marketing test delivered.

RM072 final: f742c56 Worker SUCCESS (version eb946f30-7cb8-4f66-ac62-dd065fb82436); public browser job113487838190 SUCCESS,375tests,4viewports,18product examples and mocked social checkout. Live Printful reachable. Specific challenge iframe errors separately reported; live challenge not automated. Current private Control Center signed out, so private fulfillment/incident inspection and real safety rejection/physical acceptance still open. Manual daily promo now includes a prominent verified product; revised mug creative delivered, no X posting.

Latest: [RM073 — private launch verification](ASTRA-SESSION-RM-073.md). Signed-in30day audit0issues,2existingPrintfulproductionorders; Shopifyconnection/permissions verified. Disabled unconfigured SMS while preserving Gmail alerts, fixing a concrete source of alerts:failed. Next scheduled cycle, moderation rejection quality and physical shipment acceptance remain open. No new paid action or app-code change.

Latest: [RM074 — Cloudflare3043 classification](ASTRA-SESSION-RM-074.md). Two live provider internal errors confirmed; unavailable classification/cooldown regression passed376tests and dry-run. No paid render; provider recovery unverified.

Latest: [RM075 — owner daily reset](ASTRA-SESSION-RM-075.md). Same-browser authenticated reset button;377tests and dry-run pass. Owner must click in original browser; no personal reset or render recovery claimed.

Latest: [RM076 — controlled HQ outage reproduction](ASTRA-SESSION-RM-076.md). Both authorized tests failed3043, including established sample; provider recovery unverified. Honest retry status and owner support references,378tests/dry-run pass. No third paid call or model switch.

Latest proposed integration: [RM096 — optional fal FLUX.2 dev host, verified owner-only pilot and safe provider routing](ASTRA-SESSION-RM-096.md). App changes remain on a separate review branch and are disabled by default. Do not infer customer-path acceptance, live provider recovery or production activation from the tests.

Latest staged review: [RM097 — owner-only provider-job diagnostics and CI/canary evidence](ASTRA-SESSION-RM-097.md). Adds safe admin-only fal attempt review without paid calls, 391 local tests pass, dry-run passes; PR #16 WebKit CI passed on rerun after original flake. No live Fal customer route or runtime-canary acceptance yet.

Latest staged development: [RM098 — fal-first fixed host priority, conditional Standard choice, accepted-job safety and actual remote-runtime canary](ASTRA-SESSION-RM-098.md). 402 local tests and Worker dry-run passed. One owner-approved public-demo Cloudflare remote preview generated through fal; preview terminated and temporary secrets cleaned. PR #16 remains draft, all public fal flags off, full Recast live acceptance not yet proven.

Latest production-rollout preparation: [RM099 — owner-only fal Model Lab deployment gate](ASTRA-SESSION-RM-099.md). Public route remains Cloudflare with explicit fal auto flags OFF, owner canary flag ON only behind admin token. Fal secret is set separately, never committed. Dry-run passes; do not claim deployment or owner full-flow acceptance without receipts.

Latest guarded production test rollout: [RM100 — owner-only fal Model Lab live on recastmeai.com, fal secret installed, public routing still off](ASTRA-SESSION-RM-100.md). PR #16 merged as b703166; Worker secret-change version 5719409; original seven secrets preserved. Public/admin smoke passed, no paid live Model Lab render yet. Adds an optional one-click demo photo, pending CI and asset deployment.

Latest owner Model Lab render error: [RM101 — confirmed two Invalid header value diagnostics, fal credential whitespace normalizer](ASTRA-SESSION-RM-101.md). Two R2 GEN references confirmed; original local key file has six surrounding whitespace characters, no key printed. Source patched and 404 offline checks/dry-run pass; deployment and final owner live generation still need receipt.

Latest staged user-authorized public HQ beta: [RM102 — switch customer High Quality to verified fal and add waiting UX](ASTRA-SESSION-RM-102.md). A full no-secret rollback snapshot and document were captured before edits (Worker version 1a6367a4-9f83-456e-b21b-33084e0049e3, main commit 29b9f340...). 407 local tests and Wrangler dry-run passed. Public deploy/CI and read-only smoke to be recorded separately; never claim recovery of Cloudflare FLUX.2 dev or full async job settlement.

RM102 beta released: fal public High Quality live via Worker version cf719c7f-0e5e-4867-ab2e-538005daed0b, PR#18 merged at 118837b4. The rollback snapshot remains in Recast-Rollback-PreFalPublic-20261009; prior Worker 1a6367a4. Smoke confirms read-only status and timing UI HTTP200. A follow-up Standard timing copy correction (JS v268) is staged and 407 local tests/dry-run pass; record later deployment separately. Do not assert new public paid preview was tested by assistant.

RM102 FINAL live public fal beta: Cloudflare Worker ec070c24-dbf8-43c8-aec9-ff8d12ca51a7, GitHub main 4971336ada480d7798857ff3aa582f25545bd8f4. Actual homepage/CSS/JS/readiness/model-status owner-auth read-only smoke all passed; 407 local tests passed. Previous Cloudflare-only Worker 1a6367a4 and SHA/backups saved in rollback folder/docs. No new paid public image render or async finalization acceptance claimed.

RM103 (staged): [Fix rotating timer and duplicate timing messages](ASTRA-SESSION-RM-103.md). Owner screenshot revealed legacy `.loading span` applied spinning 44px rings to both clock spans. Scope-only CSS reset stops rotation; pre-submit estimate and below-bar duplicate removed. Single 30–40-second estimate stays on waiting screen. 407 local tests and Wrangler dry-run pass; awaiting GitHub CI, merge/deploy receipts. No new paid renders or product/commerce changes.

RM103 LIVE: Stationary elapsed clock and exactly one 30–40-second estimate on active waiting overlay, no pre-submit banner or below-bar duplication. PR #19 merged as d4e8b16c; Worker deployed as 81bdf65e-5a80-43f9-8deb-c960fd78c9b5. Both GitHub checks and 407 local tests passed; real public read-only smoke passed for HTML/CSS/JS/readiness/privacy. No new paid render was started. Details in ASTRA-SESSION-RM-103.md; rollback screenshots/sources are on the authorized PC.

RM104 — Adventure/filter prompt accuracy audit (2026-10-09/10). Owner's Standard screenshots: Holiday Magic barely altered original yard and Rock Star only added cartoon outlines in the same yard. Fixed shared 48-adventure guides, scene-first Standard Klein prompts (distinct locations/costumes/photoreal-vs-artwork styles and strict real pet likeness), matching HQ fal world cues, and on-selection UI descriptions. No changes to engine selection, render credits, moderation, R2, checkout or fulfillment. PR #22 merged as 32c4b4fbbc68c3b70b028057afc9e82ff9c9a87e; 414 CI tests plus Chromium/WebKit checks and Wrangler dry-run passed, no paid image runs. LIVE DEPLOYMENT NOT VERIFIED: DESKTOP-GFOHB7M was offline during changes; preserve current working production site until controlled deployment and visual QA. See docs/ASTRA-SESSION-RM-104.md.

RM104 LIVE deployment (2026-10-10 UTC): Verified PC online and deployed exact pinned GitHub main ef16a45aaa8a90537cb64b55ddbc110dabcb0e59 to Cloudflare Worker edd814da-9525-4185-ba77-72b8c5bed8c5. Before version 66cfce6e-384f-42e5-b333-06e65c7d5627 saved in rollback note with complete pinned source archive. 414/414 Node tests and Wrangler --dry-run passed. Read-only live HTTP tests confirmed homepage/app.js?v270/48-adventure guides/CSS byte-identical to pinned source, HQ and Standard ready and admin route protected; all 49 plain and 8 secret Cloudflare bindings preserved unchanged. Did NOT pay for 48 visual tests. GitHub-to-Cloudflare automatic deployment still NOT configured (PC GitHub browser isn't authenticated to manage Actions secrets). Full details and rollback in docs/ASTRA-SESSION-RM-104.md.

RM105 guarded GitHub→Cloudflare automation scaffold merged at a35278055dabc0ca798da39a0710bf295632a4c7. GitHub Actions run 38020106133: offline tests and Wrangler dry-run SUCCESS; Cloudflare deployment job intentionally SKIPPED because CLOUDFLARE_DEPLOY_READY flag is absent. Production stays at verified Worker edd814da-9525-4185-ba77-72b8c5bed8c5 (pinned ef16a45... code), with all 49 plain + 8 secret bindings preserved. To finish hands-free deployment, owner must log into GitHub through PC Brave (currently 'Sign in to GitHub') to securely configure Cloudflare token/account ID GitHub secrets and then enable the repository ready flag. No credentials pasted in chat or committed; see docs/ASTRA-SESSION-RM-105.md.

RM106 AUTO-DEPLOY ACTIVE (2026-10-10 04:06 UTC): Verified two encrypted GitHub Actions repo secrets CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID and created repo variable CLOUDFLARE_DEPLOY_READY=true through authenticated browser (token values never exposed). Manual run 38022672773 deployed but smoke script failed due invalid CommonJS top-level await. PR#24 corrected async smoke, added predeploy node --check and push-path handling; merged 0c324e766de343d0baf4d4723ffa24819f0a3754. Fully AUTOMATIC post-merge GitHub Actions run 38022873709 passed 414 tests, dry-run, Wrangler deploy and read-only four-endpoint smoke; live Cloudflare Worker fd63aff4-6fa0-4c37-ac98-be27b970427a. Compared prior version 0c10d4bd-eaea-465f-8396-b45fdc3cf23b: 49/49 plain env unchanged, all 8 secret bindings preserved. No paid inference/orders. Future main source updates matching workflow paths now auto-publish without PC; docs-only pushes do not. Rollback instructions in docs/ASTRA-SESSION-RM-105.md RM106 section; turn repo ready variable false before rollback to suspend auto-redeployment. Temporary local account-ID helper deleted.

RM107 (2026-10-10) live Standard face-likeness improvement: owner comparison found new Holiday Magic/Rock Star backgrounds much stronger, but prior Standard preserved pet facial details better by retaining original scene. Updated only Standard Klein prompt to EDIT the same pet with eye/ear/muzzle/nose/fur/head-direction identity early, then keep detailed 48 adventure scenes/outfits and exact background replacement. Metadata version standard-identity-scenes-v2. PR#25 merged 8856b4eaff0734aeeaab5c35c7d0e3f210d7386c; both security+browser workflows passed, automatic GitHub→Cloudflare run 38024173157: 415/415 tests, dry-run and authenticated deployment ALL PASS. Live Worker version 20f4e766-3c30-42af-8356-47e5de7292f4; read-only smoke HQ/Standard ready and owner endpoint protected. No paid images generated, actual post-change facial likeness awaits user visual check; revert commit if world transformations regress. See docs/ASTRA-SESSION-RM-107.md.

RM108 (2026-10-10) Standard allowance visibility DEPLOYED: Customer preview balance now shows Standard remaining, total, used and its separate 24-hour refresh when HQ is depleted or server-approved outage fallback is offered. PR #26 merged as f40ddb59274da7a49092e071f041afd63319932d; automatic GitHub→Cloudflare run 38025149805 passed 416 Node tests, dry-run, deploy and read-only smoke. Live Worker version b2135359-5bb1-4ef7-9bc9-e540a4d3c855. No paid image calls; wallet, site allowance limits, providers and commerce logic unchanged. See [RM108 session and verification](ASTRA-SESSION-RM-108.md). Actual owner-wallet display and RM107 facial likeness await user check.

RM109 (2026-10-10) — Customer Standard exhausted-state clarity released in main `af877f77114084d909c7d49fafe0bdc81398866c`, Cloudflare Worker version `234ec50e-0f70-4506-b1bd-df3f1c1279b3`. Both HQ and Standard credit allowances/used/reset are visible above the fallback copy even while Standard creation is locked; an exhausted Standard button is replaced by a clear used-up/reset notice. Final 417 Node tests, security/browser CI, Wrangler dry-run and automatic production smoke passed; no paid render/order. Shopify paid HQ/Standard packs are **proposed only** and NOT active. See [RM109 session](ASTRA-SESSION-RM-109.md).
