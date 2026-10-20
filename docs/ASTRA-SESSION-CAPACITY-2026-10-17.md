# Read-only upload and screening capacity

October 17, 2026. Baseline main `849282875b4eba428bd5f3f6b7a05974f5c230c7`.
Isolated branch `codex/capacity-visibility-20261017`.

## Scope and implementation

The Christmas audit found screening, original-photo and subject-detection caps absent from Limits & usage. Add authenticated GET-only `/api/admin/capacity` and a responsive read-only panel beside the existing render controls. It reports effective caps, configuration source, known usage/headroom, UTC reset and snapshot time. Original-photo and subject network counters apply only to the current request's network, not all visitors.

Missing, corrupt or unreadable counters remain unknown. No absent ledger is represented as zero. A configuration flag is not reported as proof of provider health. Diagnostic reads neither initialize network salts nor mutate ledgers, scan customer records, reserve capacity, call providers or send alerts. Only aggregate numbers and safe metadata are returned; credentials, IPs, network hashes and destinations are excluded. Pending UI requests cannot repopulate the panel after locking the dashboard; failure clears the prior view.

`src/capacity-policy.js` extracts the existing screening fallback, subject cap validator and fixed original-photo cap unchanged so diagnostics and enforcement use one definition. Screening remains default200/range1–1000, subject caps default200/day and20/network/day, original uploads10/network/day. No settings, budgets, model, screening activation, commerce, discount or fulfillment behavior changes. The panel is an incremental capacity inventory, not the complete planned operations dashboard: alert delivery, burst usage, provider balances and account-wide limits remain outside it.

Changed files: capacity policy/snapshot modules; imports in content-safety/original-photo/subject-detection; authenticated route in owner-settings; admin-capacity.js and admin HTML/JS/CSS; owner-capacity tests, browser regression fixture/assertions and admin cache assertion; this session and handoff index.

## Validation

- 44 focused tests passed, including existing upload/screening/settings/subject protections.
- First full suite: 600/601 passed; the single failure was the expected old admin asset version. Updated that assertion; final full suite **601/601 passed**.
- Worker dry-run bundle, JS syntax checks and `git diff --check` passed.
- Local browser runner could not launch because WebKit was absent. Browser installation returned invalid/truncated archives; no local browser pass claimed. Hosted browser gates include the new exhausted/unknown display, read-only inputs and narrow-screen fit assertions.
- Public read-only `/api/seasonal-campaign` returned `promotionsEnabled:false`, `offer:null`, `checkoutReady:false`, Halloween active. No offer enabled.

## Release gates, remaining risks and rollback

Review branch only; not merged or deployed at this checkpoint. Hosted CI/browser results and exact remote head will be recorded after upload. No new production settings or authenticated capacity values verified, no alert sent, render made, order submitted, payment or spending change. Tests use fixtures, not real provider capacity or delivery evidence. PR88 deployment and public audit were independently confirmed successful in the preceding Christmas audit; native PR89 is separate ongoing work.

Next: inspect hosted security/mobile/browser checks, then controlled release and authenticated capacity readback in a separate authorized step. Preserve the current basket specification for later implementation; basket is still absent. Rollback this presentation/diagnostic change as one unit; no data migration or ledger reset required.

## October 18 owner quick-fix controls

Owner explicitly requested live-capacity quick fixes in the command center. Expanded PR90 from parent 975c9e01c81adc67460cc164c0d744ccc3dc7c20 with editable safety-screening daily (1–1000), subject-check daily (0–1000) and per-network subject-check (0–1000) caps. Existing revision checks, same-origin/admin authorization and bounded history apply. Every increase requires INCREASE_LIMITS; no safety bypass, counter reset, provider request or automatic increase exists. Original-photo network/day cap remains 10.

Legacy stored forms inherit configured effective caps. Older clients that omit the new fields preserve their current values instead of resetting them. Admin form shows explicit fields and increase confirmation; missing form inputs retain current values during version skew. Files: src/owner-settings.js, public/admin.html, public/admin-settings.js, tests/owner-settings.test.mjs, this record and cumulative handoff. Initial focused run exposed the expected old shape assertion; updated fixture and added migration, confirmation, hard-bound, stale-revision and counter-retention cases. Full local Node suite: 603/603 passing; git diff --check passed. No live configuration read, edit, deployment, provider bill or order was performed. Hosted checks on the new commit still require verification. Rollback: revert this isolated commit; existing settings history remains private and usage ledgers remain untouched. Before release, coordinate admin integration with PR93 and verify live values plus actual delivered alerts; never treat default values as live evidence.

Browser follow-up: updated the existing mocked owner-settings API fixture to include the three new capacity values; otherwise native required-input validation would correctly block the old incomplete fixture. Added phone-browser assertions for displayed screening cap, lowering network cap, raising screening cap and INCREASE_LIMITS submission. Hosted verification pending for this follow-up. No production behavior or limits changed by the fixture update.

## October 20 current-main integration

Integrated current main728f02c395db1339d2de41c165beb6fc0b5e8b4b into PR90 parent d56c9b74a99d9a31e5ff105da7c6292a43c03623 in an isolated worktree. The only conflict was this project's cumulative handoff index; retained both histories. Community review link, five-tab navigation, SEO/Christmas guides and outage-only photo shopping preserved. Existing capacity enforcement and guarded increase confirmation unchanged. PR93 cart, PR97 Shopping price and PR98 Save remain separate.

All608 Node tests and Worker bundle-only dry-run passed; git diff whitespace and JavaScript syntax checks passed. First test attempt lacked fast-png in the isolated worktree; linked the existing installed dependencies and reran successfully. Local Chromium browser check could not launch because its executable is absent; no local visual pass claimed. Final-head hosted security/browser gates must be recorded separately after upload. Earlier d56c9b7 hosted checks39143099156/39143099159 passed, but are not evidence for this merge.

No main merge, production deployment, cap increase, reset, paid provider request, order, alert send or discount activation. Authenticated effective settings/counters, actual alert delivery and provider balances remain unverified. Capacity panel is partial: source labels still cannot distinguish saved-owner overrides from environment values, and Community occupancy/provider-observation freshness are separate diagnostics. Those must not be represented as completed inventory. Public readiness read at2026-10-20T11:43:56Z returned ready but provider last-success observations remainOctober17HQ/October13Standard; response freshness is not a new provider probe.

Rollback: revert this integration as a first-parent merge revert, preserving the earlier PR90 history and all private counters. Next: verify final hosted phone/desktop gates, resolve diagnostic source attribution, and obtain authenticated read-only live configuration/alert evidence before controlled release. No production readiness claimed.
