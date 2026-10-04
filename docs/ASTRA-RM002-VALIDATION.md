# RM-002 validation addendum — 2026-09-29

This appends observed results to the initial RM-002 session. It supersedes only the initial statement that full-repository CI was still pending. Activation restrictions and unresolved items remain unchanged.

## Exact revision and review

- Application baseline: 209ac10fd4a7ec3b156417a08e2df86ad77b766a.
- Implementation/test commit: b0dd044bd2a90d6bc6ac800c8f0b011aea3c3ae6.
- Implementation tree: 2d3b479cae22bd0bbb8773c024b476207e8afbaf.
- Review: https://github.com/WebZomb/recast-me/pull/1 . Draft, not merged when checked.
- Branch: recast/secure-previews-2026-09-29.

## Tests actually executed and observed

The complete repository was fetched at the exact implementation commit by the validation workflow, not reconstructed from the older ZIP.

GitHub Actions push run: https://github.com/WebZomb/recast-me/actions/runs/36608527326 .
Job: https://github.com/WebZomb/recast-me/actions/runs/36608527326/job/109543678192 .
Job completed successfully at 2026-09-29T17:57:01Z. Its decoded job log was read, not inferred only from a green badge.

- Node v22.23.2; locked dependencies installed with npm ci --ignore-scripts --no-audit --no-fund.
- npm test ran node --test tests/*.test.mjs: **73 tests passed, 0 failed, 0 skipped, 0 cancelled**. This includes the existing 20 tests, 45 new isolated checks, and 8 new actual-router integration checks with mocked external bindings.
- npx --no-install wrangler deploy --dry-run --outdir /tmp/recast-security-bundle: **passed**, Wrangler 4.138.0. The log explicitly ends with --dry-run: exiting now. Bundle size reported: 151.09 KiB, gzip 41.41 KiB. This did not publish the Worker.
- The four changed/new application files and five changed/new test files were checked against GitHub tree blob SHA-1 values and matched their locally prepared bytes exactly.

Selected log excerpt (not the complete log):

```text
v22.23.2
b0dd044bd2a90d6bc6ac800c8f0b011aea3c3ae6
> node --test tests/*.test.mjs
1..73
# tests 73
# pass 73
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 490.131861
wrangler 4.138.0
Total Upload: 151.09 KiB / gzip: 41.41 KiB
--dry-run: exiting now.
```

The duration is for mocked tests, not rendering latency or production throughput. Earlier local execution separately passed the 45 isolated checks on Node v22.16.0 after correcting a test-helper syntax error.

## What this does not prove

No live AI generation, Cloudflare Images transformation, billable model comparison, real Shopify purchase, Printful production submission, X post or Safari interaction was performed. A successful dry-run does not validate Cloudflare account billing/bindings or actual overlay pixels. The dry-run lists AI, ARTWORK and ASSETS but no active IMAGES binding in repository configuration. Dashboard state remains unverified. No AI_DAILY_CALL_LIMIT allowance or dollar budget was selected or activated.

Do not merge merely because this test result is green. Verify IMAGES and the actual watermarked derivative in a controlled preview, reconcile any old exposed capabilities, confirm the desired allowance and inspect user-facing flows first. Uploaded and tested is not the same as deployed and verified live. Preserve source/test commit b0dd044 as the evidence anchor even after documentation-only follow-up commits.
