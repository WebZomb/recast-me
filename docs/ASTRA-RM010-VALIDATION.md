# RM-010 validation addendum — 2026-09-29

## Exact evidence anchor

- Trigger diagnostic: `GEN-MUN9XZCT-7231` from private R2 storage.
- Diagnostic values supplied by the owner: stage `ai-generation`, normalized reason `capacity`, provider code `null`, provider message `attempt timeout`.
- Application correction commit: `8a949595f601959a1566c14b026256351e7a92c1`.
- Parent before the application correction: `a1077d14c9fc1b930316bc9286c90ff11330076c`.
- Branch: `recast/secure-previews-2026-09-29`.
- Review: PR #1 remains draft and unmerged into production.

The diagnostic proved that the earlier result was not a confirmed Cloudflare 3040 response. The application itself had raced `AI.run` against a 125-second High-Quality timer (60 seconds for Quick), thrown `attempt timeout`, and normalized that local error as capacity. A JavaScript `Promise.race` does not cancel the losing provider promise, so a late completion could be discarded and misreported.

## Implemented result

RM-010 removes the local AI attempt race and awaits `AI.run` directly while retaining `rejectIfBusy: true` as the immediate provider-capacity guard. It now distinguishes provider timeout, confirmed busy/capacity, temporary provider unavailability, quota, moderation, and other provider failures. No automatic retry was added for timeout, busy, or unavailable results.

High and Quick retain independent readiness state. Default cooldowns are capacity 90 seconds, quota 300 seconds, timeout 45 seconds, and unavailable 60 seconds. Customer messages, retry labels, and readiness-dot states now match the normalized reason. Browser-side waiting limits remain longer and advise checking Recent Versions before another submission because aborting a browser request does not prove inference stopped.

The one-time patch workflow and patch script were deleted by the validated result commit. The final repository tree contains neither those temporary files nor `node_modules`.

## Tests actually observed

GitHub Actions workflow `Apply RM-010 timeout correction`, run `36646566068`, job `109670799116`, completed successfully.

- Complete mocked suite: **92 passed, 0 failed, 0 skipped, 0 cancelled**.
- Added coverage includes distinct timeout classification, one provider call/no automatic retry, no executable local `Promise.race` attempt timer, timeout/unavailable per-mode circuits, client messaging, and ready/waiting/error status colors.
- Wrangler 4.138.0 bundle dry-run: passed and explicitly exited in dry-run mode.
- Final validated application commit was pushed as `8a949595f601959a1566c14b026256351e7a92c1`.
- No live AI call, Images transformation, checkout, Printful production action, X post, or engine switch was performed by this correction workflow.

A normal PR workflow initially reported `action_required` on the bot-authored result commit; that is a workflow-authorization state, not a failed application test. This documentation commit is intentionally human-authored through the repository connection so normal CI and the Cloudflare Preview can validate the final tree again.

## Remaining acceptance gates

Passing mocked tests and a dry-run do not establish current provider capacity, real completion latency, visible watermark output, Safari behavior, or pet likeness. Before production merge, use the latest Cloudflare Preview for one controlled same-photo test only after its build and deployment succeed. Inspect the finished image against the original pet, verify the flattened `@RecastMeAi • PREVIEW` mark in the large result and Recent Versions, and save both surfaces to confirm no clean preview escapes.

Rollback before merge: leave PR #1 draft/unmerged or reset the branch to `21d64268631c1609a31dfe7acd01e95001247fe7`. That rollback restores the misleading local timeout and should not be treated as a safe production fix.
