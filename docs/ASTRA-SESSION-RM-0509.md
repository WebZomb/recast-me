# RM-050.9 — hero final scale cleanup — 2026-10-06

Baseline: main b113b72edf6cafdcf01c10d6cee1c90d05f4e966 (RM-050.8).

Owner screenshot after RM-050.8 showed the composition much closer to the approved Pic 2 target, with two remaining defects:
1. the hero mug/platform was still visibly oversized;
2. a literal backslash-n string appeared at the top-left of Safari.

Changes:
- public/index.html: replace the literal "\\n" between the brand and hero stylesheet tags with a real line break. Bump hero stylesheet cache from v1 to v2 and launch marker to RM-050.9.
- public/hero-target-v51.css: reduce mobile product width from65.5% to56.5% (57% under400px), move it slightly right/down, and let the existing cards/copy remain unchanged because those now closely match the target.
- scripts/launch-audit.cjs: expect RM-050.9.
- regressions: require the real newline, v2 cache key and final mug scale.

No creator, commerce, Printful, AI, customer credits, pricing, admin, recovery, order or fulfillment behavior changes.

Validation requires full repository tests, Wrangler dry-run, browser policy checks and successful production deployment. Roll back only RM-050.9 on current main if needed.
