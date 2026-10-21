# Community confirmations inside the installed app — October 21, 2026

Baseline main: `82d619f087fc2ac0fab31709a3c93793673d07ae` (tree `36c2b9fbf633fc2a6b6d06039cbb6f8ba54a19a1`). Branch: `fix/community-in-app-confirmations-20261021`. Exact resulting commits and release receipts are appended after their creation; source implementation is not a deployment claim.

## Observed problem and cause

The owner supplied two device recordings: the native Recast Me Community did not display Report/Block confirmations; Safari displayed both. Neither recording establishes a completed report or block. In the submitted `release/recast-ios-1002` source, `StudioView.swift` (blob `f39944e42708bf382455285df635a93b848a9999`) assigns a WKUIDelegate but does not implement the JavaScript confirmation callback. The two public Community actions called `window.confirm()` before their POST. WebKit documents that a missing confirmation callback behaves as Cancel, explaining the no-op in the app.

The release's Community tab loads `https://recastmeai.com/community`; its minimum iOS version is 17. In-page HTML dialogs are already used for Community sharing and management and are supported by WebKit from iOS 15.4. This focused web fix does not require a new native binary. Fully close and reopen the installed app after successful deployment because merely resuming it dispatches an event without reloading the document.

Primary platform references: https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/API/Cocoa/WKUIDelegate.h and https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/.

## Implemented changes

- `public/community.js`: replace the two browser confirmation panels with accessible in-page dialogs. Cancel receives initial focus; Cancel, Escape and failure to open cannot send an action. Only the explicit Send report / Block contributor button authorizes the existing POST. Prevent stacked dialogs, remove them on close, restore trigger focus, preserve request error/retry behavior, and focus the stable status element after action feedback. Blocking copy accurately acknowledges shared-network grouping.
- `public/community.css`: reuse the existing dark dialog style; add readable headings and wrapping action buttons with at least 46px height for narrow phones.
- `public/community.html`: JS cache version 3 → 4 and CSS 1 → 2; make the existing status element programmatically focusable.
- `scripts/community-browser.cjs`: run the Community fixtures in Chromium and WebKit at 320/393/768/1280px, plus a 393px simulated native-bridge scenario. Disable native JS confirmations to reproduce the installed-shell limitation. Check both DOM dialogs, Cancel/Escape with no POST, duplicate activation, explicit confirmation, error/retry, success, focus, fit and touch targets. Keep existing pagination, favorites, consent and owner-review fixture coverage. No fixture traffic reaches the live Community API.
- `.github/workflows/recast-rm050-validation.yml`: include the Community browser script in the path filter so a future test-only update also runs the browser gate.
- This session record and `docs/ASTRA-HANDOFF.md`: cumulative evidence and release tracking.

No backend or native source, provider, moderation configuration, budget, order, artwork, identity cookie or block record is changed. The existing self-block/shared-network limitations and absence of a public viewer-unblock control remain; do not tell the owner to confirm Block on a normal personal contribution as a reversible test. The native Help work and other open branches remain separate.

## Verification at implementation time

- JavaScript syntax checks for the changed page module and browser harness passed; `git diff --check` passed.
- Focused Community backend test file passed.
- Initial full test run under restricted process permissions failed in two existing subprocess/runtime-dependent files. The full offline suite was rerun with the required local process permissions and exited successfully; exact count is appended with the release evidence.
- Worker dry-run initially could not write its normal local configuration/log directory in the restricted environment; the permitted local dry-run succeeded. No Cloudflare deployment occurred in that command.
- Local browser harness could not listen on localhost under the restricted environment. The installed Playwright package had no browser executables, and its attempted browser download returned invalid archives. No local browser pass or visual acceptance is claimed. Hosted Chromium/WebKit execution and screenshot review are pending.
- Independent source review found no blocking issue. Its focus observation was addressed by focusing the stable status element after action success/error.

## Deployment, paid actions and remaining acceptance

At this entry the fix is local source only. The existing guarded deployment must follow successful checks on the actual PR revision. Production HTML/JS/CSS must be read back after deployment; then the owner must open both dialogs and Cancel in installed build1002. That safe device check verifies the pop-ups, not actual report/block completion or Apple acceptance. Keep the existing Apple submission intact and do not present the malfunctioning recording as proof of working controls.

No live report, block, ban, photo publication, vote, render, purchase, fulfillment action, secret read, or paid provider request was made. Browser regressions use local fixtures only.

Rollback: revert only this session's page JS/CSS/HTML changes through the guarded deployment, preserving all Community backend state and block references. That restores the previous native confirmation defect, so a forward correction is preferable. Do not revert the underlying blocking feature or clear user data.

## First hosted run and test-harness follow-up

PR106 source head `90083ae1fdebf8245dba77472c9a91738238fa76`, tree `e77d284ec018402a9d9661c8df0190ea841f608b`. Local full-suite result was 605/605. Hosted run39643948455/job119374468674 passed the same 605 tests, bundle, all pre-existing customer/Model Lab/seasonal/gift-guide suites, and all five Chromium Community scenarios. The first WebKit scenario completed the new report/block/cancel/error/retry/consent steps but then timed out at the existing owner-preview Approve-enabled wait (script line91). The run failed and was not merged or deployed.

The local-only browser network guard was broadened to permit same-origin `blob:` previews and embedded `data:` resources, while continuing to reject every external network request. This accounts for WebKit interception of owner preview blobs. Added bounded failure diagnostics and a screenshot at the owner-preview wait so a further failure will identify image load state instead of only a timeout. This is a test-harness change, not a claimed production fix or justification to skip the failed assertion. A fresh full hosted pass is required. The customer JS/CSS/HTML are unchanged from the reviewed source head.

Related follow-up found during source audit: unpaid artwork deletion (`public/order.js`), web favorite removal (`public/my-recasts.js`) and a render-error fallback (`public/app.js`) still use native JS confirm/alert calls. Their actual installed-app behavior is untested here. Record native dialog delegate coverage for the next native update or separately verify and migrate those flows; do not describe this two-action Community correction as a global popup fix.
