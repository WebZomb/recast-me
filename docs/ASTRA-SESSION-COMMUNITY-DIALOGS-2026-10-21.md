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

## Final PR verification

Final PR106 head `019de4e8f660d064f9f2672524cff9ac2a198e93`, tree `bbb2052f2a43b487be56d700c2d9e2b2e6f507fb`, contains only the local-blob fixture correction and diagnostic notes after the initial source commit. Hosted run39645011047/job119378145194 completed successfully: 605/605 Node tests, Worker dry-run, all existing customer/owner, Model Lab, seasonal and gift-guide browser suites, and all ten Community scenarios. The log explicitly confirms both customer dialog checks and owner review in Chromium and WebKit at 320/393/768/1280px plus the 393px simulated native bridge. Allowing the fixture's local blob resources cleared the WebKit owner-preview failure without removing its assertion or changing the production owner panel.

Native reload audit: build1002 creates the Community WebView with a normal URLRequest to the extensionless `/community` URL. It uses the persistent default data store; there is no forced cache bypass. Resume only dispatches an event, and Community has no reload listener. Verify the deployed extensionless HTML and its cache headers, then instruct a full quit from the app switcher and reopen. The hosted native-bridge fixture is not a real iPhone test.

## Verified production release — October 21, 2026, 17:44 UTC

PR106 was marked ready and merged with an expected-head guard at `019de4e8f660d064f9f2672524cff9ac2a198e93`. Main/runtime commit is `c2c14872e9e3251f7edb55ee4b3f072d8519324f`; its tree `bbb2052f2a43b487be56d700c2d9e2b2e6f507fb` exactly matches the tested PR tree. Prior main was `82d619f087fc2ac0fab31709a3c93793673d07ae`.

Guarded deployment run39645991618 succeeded: test/bundle job119381583185 and deployment job119381786383, including the read-only production smoke. Worker version `9e291499-9397-4d4d-a1dd-31c89ac2ce89` was published at approximately 17:41:51 UTC; the run completed at 17:41:57. Existing deployment credentials were used by the workflow, with no secret values read or changed. The separate security workflow was skipped for this change; do not describe it as a completed security run.

Final browser artifact12366409353 (`recast-policy-browser-evidence`, 62,196,251 bytes) has SHA-256 `0abe579bb51f2e66b150d54ac9bbf8580e86e3c689433e3ff828fe859eeb9efb`. Both Report and Block screenshots were visually inspected in WebKit at 320px and in the 393px native fixture: readable text, visible Cancel and action buttons, no clipping or navigation overlap. At 320px actions stack; at 393px the Block contributor label wraps cleanly within its touch target. The blocked external logo in fixtures is not a new production defect.

Read-only launch audit39645991718/job119381584105 also passed (605 tests, public HTTP/browser checks with no listed failures, 18 product illustrations, isolated mock-commerce flow). It listed the previous Community CSS version, so it may have read production before deployment completed and is not the evidence that this fix is live.

Independent live asset readback at approximately 17:44 UTC verified `/community`, `/community.html` (redirecting to `/community`), `/community.js?v=4` and `/community.css?v=2` all return HTTP200. Both HTML paths reference the new JS and CSS versions and retain the programmatically focusable status. Responses use `Cache-Control: public, max-age=0, must-revalidate`. JavaScript and CSS match the tested source byte for byte:

- JS SHA-256: `3daa408641cd4c5b9a092a5afc6b7c1beebfdf757622fd3706a436ca6f8fa0d8`.
- CSS SHA-256: `d1824ec95fe3b67f2dc4b172c5d2f7a553ea65d50377d74bc7fbf597ba9cb1fb`.
- HTML source SHA-256: `4173b74677e983856ad4fdd71ae60bb16fff654ca7185b1d13718795e937ba8b`. Live HTML differs only by Cloudflare's injected analytics beacon; removing exactly that one injection yields a byte-for-byte match. Do not claim unmodified live HTML has the source hash.

The authorized PC's default DNS lookup initially returned ENOTFOUND. A read-only query to public resolver1.1.1.1 returned the domain's addresses; the successful HTTPS reads used one returned address for those requests while preserving the domain Host/SNI and normal certificate verification. No PC DNS, browser session or TLS setting was changed. The deployment workflow independently reached the normal public domain successfully.

The fix is deployed and its public assets are verified. Physical acceptance remains: fully quit Recast Me from the app switcher, reopen Community, open Report then Cancel, and open Block contributor then Cancel. This leaves report/block submission untested on the real phone; never claim fixture success or dialog-only footage proves a completed live report/block or Apple acceptance. No new native build was created and no Apple submission or review message was changed. No live report, block, moderation action, render, purchase or paid provider request was performed.

Rollback remains a focused revert of this runtime change through the existing guarded workflow, preserving all stored Community data. It would restore the original native-confirm defect; prefer a forward correction if further device evidence identifies a problem.
