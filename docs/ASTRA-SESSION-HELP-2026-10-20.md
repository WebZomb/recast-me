# One Help entry in the native app — October 20, 2026

Baseline main: 16a2bf417d3fb1df73632fa959396b16db4c608c. Branch: codex/remove-duplicate-help-20261020. Result identified by commit `Avoid duplicate web Help inside native app`.

Owner screenshots show native top Help plus injected web Help on Create and My Orders. Native branch rm152-ios-testflight at 587457812da54957a22247800e8e7be9d6b8cdfd confirms StudioView provides a 44-point Help control and registers recastPreview before page load. The web navigation script appended Help before its native bridge early return.

Moved the existing native guard before Help creation. Browser visitors retain the Help link and five navigation destinations; native users retain the shell Help/guide even on loading errors. Bumped shared script URL165 to166 across17 HTML pages to refresh cached clients; updated four cache-version assertions. Extended existing route test to check native vs browser Help on Create, Orders, Specials and Community. No native binary change or withdrawal of Apple's submitted build.

Validation: 26 focused navigation/seasonal/gallery/shipment checks passed; after extending the existing test, its3 checks passed. git diff --check passed. These are local simulated DOM checks, not physical iPhone or visual browser acceptance. Hosted checks and production deployment pending. No paid calls, orders, account changes or spending. No render/checkout behavior changed.

Rollback: revert this commit and deploy through existing guarded workflow. Reload pages after deployment to check a single Help control and unchanged phone layout. Android account setup paused by owner pending access to a qualifying device; no Android draft created.

## Owner follow-up — next Apple update
Owner explicitly requests this fix and other outstanding requests in the next Apple update. Durable checklist added as ios/NEXT-APPLE-UPDATE.md on the shipping native branch rm152-ios-testflight. Verify one Help on installed devices even though the fix is delivered by website deployment. Preserve current build1002 submission; no new build or submission performed in this follow-up. Checklist includes Save to Photos, multi-product cart reconciliation, supported-device layout and preservation of existing Community/Orders/Specials behavior, all pending current implementation/release verification.
