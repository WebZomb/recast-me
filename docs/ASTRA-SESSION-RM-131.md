# RM131 — Reduce browser memory pressure

2026-10-11. Baseline main 083bc067eecd4c763ce812633cd00963e565d8e3, runtime RM129 c9000c5cd8f1e63c4ecbbae177a64f25d216e22e. Owner reports intermittent iPhone Safari opening failure, screenshot IMG_6525: “A problem repeatedly occurred” on /#start. Screenshot alone does not establish cause or reproduce a crash; do not blame device or claim a proven fix.

Inspected frontend loading, upload canvases, saved-history rendering and CSS. Found in-session previewCache unbounded across generations/recovery (despite saved history capped at four), immediate fetching/decoding of every history thumbnail on page load, and temporary resize canvases not explicitly released after JPEG encoding. These are concrete memory-use risks, not confirmed root cause.

Changes: cap in-memory preview cache at four (saved metadata/private originals untouched); defer history thumbnail fetches until cards approach viewport with IntersectionObserver and sequential fallback; lazy/async thumbnail decoding. Disconnect old observers before rebuilding cards. Release temporary resize canvas backing stores after toBlob settles. Cache error cleanup cannot evict a newer request. Main app cache key v286. No prompt/model/credits/payment or approved artwork change. Most recent artwork still restores automatically.

479 local Node tests PASS, node syntax check PASS. Initial test failed only on obsolete v285 asset expectation, updated to v286. Required browser/CI/deployment pending. No paid AI render, order or image alteration. Physical iPhone crash not reproduced; desktop WebKit success cannot prove iOS process stability. Need owner reopen/repeated-use feedback after rollout.

Research context: WebKit bug 195325 discusses overall page memory crashes versus canvas allocation (https://bugs.webkit.org/show_bug.cgi?id=195325); Safari 17 release notes report fixes to historical canvas allocation issues (https://webkit.org/blog/14445/webkit-features-in-safari-17-0/). Those historical reports do not establish the cause on owner's current iOS.

Rollback: revert RM131 frontend/asset-key changes, retain notes. Do not advise clearing site data as a first step because private saved-artwork access metadata resides locally.

## Release and verification
Added browser scenario with four saved versions: only active preview fetched on load, every thumbnail becomes available when scrolled into view, fourth version selectable. First implementation had an unbounded image-event wait; replaced with 12-second polling without replacing app load handlers. Final security CI 38169458642 and policy CI 38169458640 PASS, including WebKit393/Chromium320/1440 and owner Model Lab. Local extra Chromium attempt unavailable because browser binary not installed; do not count it as a pass. Required hosted browsers passed.

PR #49 final head 3d19164f8943a30d320bd8293655f8a87ff402ac, squash main 2921b51f794a21e1dc9906059bffe0d0d0621ea9, tree fff989be0c5becc428065d113d97524dea7f8673. Staged local tree matched merged main before syncing. Guarded deploy 38169676130 and public audit 38169676174 PASS. Direct live HTML uses v286 and live app.js byte-matches source. Worker 835f2a08-2561-4d46-a027-ebc43a4122ad at 2026-10-11T19:50:51.630063Z. Normal refresh loads update. 479 tests pass; original iPhone failure still not reproduced and not claimed fixed. No paid actions, no rendering changes.
