# Recast Me — Astra continuation handoff

Last updated: 2026-09-29
Session: RM-001 — recovery and baseline review
Status: documentation only; application behavior has not been changed by this session.

## Read this first

This is a cumulative engineering handoff, not a claim that all earlier conversations were recovered or that the site is production-ready. Review the evidence and test results independently before accepting changes. Never convert a proposed feature, an earlier assistant report, or a repository default into a claim about the running service.

The complete owner-facing handoff also records recovery gaps and the private preview-delivery investigation. This public repository document deliberately excludes private conversation transcripts, credentials, customer images, access tokens, and operational security details.

## 1. Verified baseline

- Repository: `WebZomb/recast-me`.
- Default branch inspected: `main`.
- Application baseline commit: `209ac10fd4a7ec3b156417a08e2df86ad77b766a`.
- Baseline commit time: `2026-09-28T17:52:32Z`.
- Handoff branch: `recast/astra-handoff-2026-09-29`, created from that exact commit.
- Configured Worker entry point: `./src/router.js`, not a similarly named root-level file.
- Configured public address: `https://recast-me.sergz24.workers.dev`.
- Latest installation guide inspected: `INSTALL-v1.9.md`.
- Package version is still `0.1.0`; README title is v1.5; installation notes include v1.9. These labels are not a reliable deployment identifier. Use commit SHA plus live deployment evidence.
- `keep_vars: true` is present. Repository configuration does not prove current dashboard variables, bindings, secrets, billing, or deployed version.

Source files inspected through the authenticated GitHub connection include `README.md`, `INSTALL-v1.9.md`, `docs/FINISH-LAUNCH-v1.9.md`, `package.json`, `wrangler.jsonc`, `src/router.js`, and portions of generation/checkout source. This was a focused review, not an exhaustive audit of every file.

## 2. Project intent and continuity requirements

Recast Me turns uploaded reference photos into recognizable, substantially transformed artwork, then ties the selected artwork to merchandise or a paid digital purchase. The current presentation is pet-led, without removing the broader person/pet/family/vehicle use cases.

Preserve the approved direction:

- Retain likeness and pet markings; visibly transform the subject rather than only replacing the background.
- Keep High-Quality Preview and Quick Preview explicit; do not silently downgrade engines.
- Preserve the last successful image when a retry fails and keep the last four successful saved versions available.
- Keep custom-world setting separate from subject instructions. The custom-world field belongs to the Custom option.
- All unpaid customer artwork previews must be watermarked in the delivered image, not merely covered by a removable UI element.
- The exact approved Artwork ID must survive selection, checkout, payment handling, downloads, mockups, and production. Do not substitute a freshly generated image after approval.
- Prefer direct, reviewable GitHub updates over replacement ZIP workflows. Preserve existing work; do not overwrite the project wholesale.
- Keep costs bounded. Provider changes and billable comparisons require an explicit budget and a real quality comparison first.

These requirements come from recovered project context and existing documentation. They are not all independently verified working features.

## 3. Repository findings

### Rendering and model lab

At the inspected baseline, repository defaults remain:

- High quality: `@cf/black-forest-labs/flux-2-dev`.
- Quick: `@cf/black-forest-labs/flux-2-klein-9b`.
- High-quality settings: 1024 x 1280, 18 steps by default.
- Quick settings: 768 x 960.

`src/router.js` contains an admin-authenticated model-test route with an allowlist for dev, klein9, and klein4. The existing guide documents `/model-lab.html`. Its manual submissions are billable; this session did not submit any. This is a comparison of production modes with different resolutions/settings, not an equal-resolution benchmark. Access-control behavior was inspected in source, not newly runtime-tested.

### Patch reconciliation

Recovered history mentions a later v1.9.1 watermark-protection patch and reports 24 tests passing in that earlier work. The patch bytes and that test log were not recovered in this session. The inspected main baseline must not be described as containing or deploying that patch. Reconcile preview delivery, saved-version retrieval, social previews, and clean-file entitlements before wider launch. Detailed owner-facing findings should be reviewed before writing a replacement patch.

### Launch work

`docs/FINISH-LAUNCH-v1.9.md` explicitly leaves the following unverified or unfinished: durable render jobs and resume, duplicate-billing prevention, verified-customer allowances, concurrent-job limits, total spending protection, conversion measurement, a complete Shopify/Printful sale, X activation, and print-quality validation.

The inspected repository sets order sync, X bot, X approval, trend scanning, and unpaid-retention cleanup to false. The Images binding is shown as an optional commented configuration, not an active binding in that file. Dashboard overrides and live readiness were not checked.

The existing documentation describes manual approval before physical production. Do not enable automatic production, run a real paid purchase, change billing, or enable social posting merely to complete this handoff.

## 4. Low-cost rendering research status

Recovered history and the owner's screenshot identify `LOW-COST-RENDER-RESEARCH-2026-09-29.md` and recommend a tightly limited Runware comparison rather than a subscription commitment or public engine switch. The full report was not retrieved from Library or verified in the inspected repository during this session.

Runware, Qwen Image Edit, and alternative hosting of FLUX models are research leads only. Earlier price figures were not independently rechecked here and are intentionally not repeated as current quotes. No comparative renders, quality scores, timing measurements, invoices, or provider charges were produced by this session. A previous disliked Klein 4B result was not recovered for visual review.

When authorized, compare the same reference photos and instructions, with explicit model/version, resolution, steps, and retry counts. Use a small fixed test set spanning a pet, person plus pet, and multiple subjects. Retain the existing approved artwork as the baseline rather than generating unnecessary new baseline images.

Record likeness, pet markings, anatomy, instruction following, transformation quality, print suitability, latency, all attempts, and actual spend. Calculate cost per usable result using total billable attempts, not just the nominal price of a successful API call. Establish the cap before testing; stop at the cap. Do not select an engine on price alone.

## 5. Session RM-001 — what actually happened

Completed:

1. Retrieved available context for the Recast-Me continuation chats and reviewed the two supplied screenshots.
2. Searched Library for the latest research report and watermark patch. Relevant screenshots were found; the original report/patch were not recovered.
3. Verified repository access and anchored a focused source/documentation review to the baseline SHA above.
4. Identified the need to reconcile the reported later watermark patch with the inspected application baseline.
5. Created this separate documentation branch and started the cumulative handoff.

Not performed:

- No application source, model setting, provider account, secret, production flag, or default-branch change.
- No merge, application deployment, live rendering, billable comparison, checkout purchase, fulfillment submission, or X post.
- No new execution of the application test suite or Cloudflare deployment dry run.
- No live iPhone/browser interaction or verification of Cloudflare deployment state.

Execution limitations:

- Connected GitHub reads worked. Branch creation and this file write exercise the connected GitHub write path.
- A local clone attempt failed because the container could not resolve GitHub. No complete runnable local checkout was established.
- The public site and raw download attempts were unavailable through the available web/download routes. That is a tool-access limitation, not evidence the website itself is down.

Historical test claims, not fresh results:

- `INSTALL-v1.9.md` reports 20 backend tests and earlier mobile/desktop checks. They were not rerun here.
- Recovered history reports 24 tests for v1.9.1. Neither the original patch nor its execution evidence was recovered.

## 6. Recommended next work, in order

1. Reconcile the missing watermark/entitlement patch with the actual baseline; add negative tests before claiming protection. Confirm deployment identity separately.
2. Add or verify spending protection and duplicate-submission prevention before offering high-volume public rendering. Successful-preview allowances alone do not cap paid failures/retries.
3. Run a capped provider comparison only after current prices and an explicit budget are verified. Preserve the public engine until a quality gate is passed.
4. Prove one exact-artwork purchase and fulfillment flow in an appropriately controlled test environment; verify that unpaid access is denied and unrelated customer entitlements are not interchangeable.
5. Finish mobile polish and social-launch work after the core rendering, access-control, and commerce paths are reliable.

This order is a recommendation from the current review, not an assertion that these changes have been implemented.

## 7. Required evidence for future changes

Each later entry should include:

- Session ID/date, user request, baseline SHA, and head SHA.
- Problem reproduced and evidence; distinguish source analysis from runtime reproduction.
- Files changed and rationale; alternatives considered and rejected.
- Exact test commands and fresh outputs, including failures and skipped tests.
- Provider calls, spending authorization, cap, observed spend, and unknown billing.
- Deployment state: local only, branch, merged, build succeeded, or verified live.
- Side effects, regressions, remaining uncertainty, rollback target, and user-visible acceptance checks.

Suggested acceptance checks (not run in RM-001): watermarked delivered previews; last-four-version retrieval; unauthorized and cross-customer clean-file denial; exact Artwork ID through checkout; failed retry preserving selection; Custom-field behavior; no silent model downgrade; concurrent-request budget behavior; duplicate/replayed request behavior; Safari background/resume; unpaid deletion and cache behavior; manual production confirmation.

## 8. Astra review instructions

Read the latest main and this branch before modifying either; do not assume neither changed. Compare every reported change against its diff. Re-run relevant tests and review the owner-facing handoff for private findings. Give each item one of: accept, revise, reject, or insufficient evidence. Evaluate correctness, security, economic protection, quality/likeness, usability, maintainability, and rollback safety separately. Do not assign a favorable score merely because the previous assistant said tests passed.

Append later sessions rather than silently rewriting history. If a prior conclusion is wrong, record the correction and its evidence. Documentation-only branch rollback is simply to leave it unmerged; the baseline application code remains unchanged.
