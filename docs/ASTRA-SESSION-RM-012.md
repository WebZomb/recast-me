# RM-012 — protected print-finish comparison

Date: 2026-10-03
Baseline: 3a3121ef5e8be7632decef7b329195706662801e
Branch: recast/secure-previews-2026-09-29; PR #1 remains draft.

## Recovered decision and scope
The September 30 PR comment records the owner's acceptance of the Standard FLUX.2 dev 12-step result (main preview and Recent Versions watermarked). This supersedes the earlier instruction to wait for that Standard benchmark. The next agreed step was Preserve versus Enhanced enlargement from the saved Standard master. Klein remains retired from normal customer rendering. The older local v1.9.1 patch was not overlaid onto this newer branch: RM-002 through RM-011 already replaced it and include live raster-watermark fixes.

## Implementation
- Owner-only `/print-finish.html`, linked from Control Center; authenticated GET/POST `/api/admin/print-finish`.
- One explicitly requested finish per POST: Preserve uses bicubic interpolation; Enhanced uses Images `upscale: generate`. Both use the same saved master at exactly 2× dimensions, preserve aspect ratio and verify resulting dimensions.
- No new FLUX generation, input re-upload, master replacement, purchase selection or fulfillment change. These are comparison artifacts only, not approved print assets.
- Private originals/candidates stay under the artwork's R2 prefix. Responses expose only flattened `@RecastMeAi` JPEG previews. Full-size protected inspection avoids hiding enhancement differences by shrinking back to Standard size. Existing customer previews retain their 768×960 maximum.
- Durable conditional R2 claim keyed by source hash + finish mode + algorithm version prevents repeat clicks/concurrent requests from repeating the transform. Cached comparison loading starts no image processing. Failed or interrupted claims are retained: no timed automatic release or paid retry.
- Per-finish records include dimensions, duration, submitted upscale/watermark operations, and actualCostUsd=null. This is honest usage telemetry, not a verified monetary cost or spending ceiling. The UI states that Cloudflare Images is metered and separate from the AI.run cap.
- Admin token stays in page memory, in the Authorization header only. No clean download endpoint is added. Zoom uses already-protected bytes.
- Added ignore rules so installed dependencies and local secret files do not enter future GitHub updates.

Files: src/print-finish.js, src/router.js, src/preview-security.js, public/print-finish.html, public/print-finish.js, public/admin.html, tests/print-finish.test.mjs, .gitignore, this record and cumulative index.

## Verification actually performed
- Full suite: `node --test --test-isolation=none tests/*.test.mjs`, Node v24.19.0: **100 passed, 0 failed**. Tests mock AI/Images/R2/commerce. Coverage includes unauthenticated denial, read-only GET, original preservation, watermarked full-size output, explicit algorithm choice, duplicate claims, ambiguous failure and consent validation.
- Initial ordinary npm test reported only seven file-level passes in this execution environment; the no-isolation run above provides the actual individual count.
- Locked dependencies installed with `npm ci --ignore-scripts --no-audit --no-fund`.
- Initial Wrangler dry-run failed because the sandbox could not create /root/.config; rerun with config/log paths under /tmp passed. Wrangler 4.138.0, bundle 164.64 KiB. No deployment command without --dry-run was run.
- `git diff --check` passed. Browser appearance and real Images upscaling have not been tested in this session. No live inference, upscale, purchase, fulfillment or X post was started.

## Next acceptance and remaining launch work
1. Require CI and the new Cloudflare Preview deployment to pass. On that Preview, open Control Center → Compare print finishes. Load a saved test Artwork ID, explicitly create Preserve once, then Enhanced once, and inspect full-size marked output. Record actual Images usage and identity/detail differences. Do not infer real results from mocked tests.
2. If binding support or billing is unavailable, show failure and keep the original. Do not silently substitute another engine or repeatedly retry. Failed/ambiguous claims require engineering reconciliation; there is deliberately no public reset button.
3. 2× of Standard is 1536×1920, not a universal large-format print file. Product dimensions/DPI, selected finish approval, exact-art checkout binding and a physical print sample remain required before fulfillment integration.
4. Durable render jobs/resume, bounded queue concurrency, cost reservation/monetary cap, verified-user allowances and shared kill switch remain necessary before 100–1000/day public traffic. The existing optional call cap is not a dollar ceiling.
5. Main is still 209ac10. Production Images configuration, live checkout → order → exact paid download/Printful flow, storage isolation, refunds and X activation remain separate gates. This comparison does not authorize a production merge.

## Rollback and source
Revert this session's files to the baseline to remove the lab. Keep existing preview security and newer timeout fixes. Test artifacts are private and do not change purchase masters; never delete customer/order originals during cleanup.

Official docs checked October 3: https://developers.cloudflare.com/images/optimization/features/#upscale and https://developers.cloudflare.com/images/optimization/binding/ . Docs specify interpolation versus ESRGAN 2×/4× upscaling; account availability, actual output and cost remain live checks.

Resulting commit is the commit containing this session record; verify its SHA in GitHub. Upload/build/Preview/production are separate states.
