# RM076 — two controlled HQ failures and honest recovery status

2026-10-08. Baseline remote6271c0caf61eb13abb37ab1ac248f913472c21c4, local4e02f2e. Owner authorized two controlled paid tests with a $1 total ceiling. Exactly two owner-model-test submissions made; no automatic retry or model switch. One established public Jack Russell reference, one newly supplied dog photo. Both used Pet, a simple blue bandana and sunlit garden, FLUX.2 dev1024x1280. Owner model lab downsizes input to500px JPEG. No photos or tokens committed.

Live results:
- 23:36:45.435UTC: GEN-MV06E9A3-B6F2,25.454s,3043 Internal server error, ai-generation/unavailable.
- 23:38:17.018UTC: GEN-MV06G7Y2-A110,12.773s,3043 Internal server error, ai-generation/unavailable.
These reproduce outside the baseball style and across both photos. This establishes an upstream error response, not its internal cause or a Cloudflare-wide outage. No actual recovery or usable output. Both calls stopped; no third paid test. Published Cloudflare pricing at18steps estimates about$0.048 per test ($0.096 total); even30steps about$0.16 total. Invoice charges not inspected. No added subscription.

Changed public readiness copy: expired cooldown with latest failed result shows Retry available — recovery not yet confirmed, amber rather than green, and visible notice. Retains deliberate retry access and existing server cooldown; no entitlement/model/credit changes. Error copy no longer equates Ready with recovery. Owner lab now displays support reference and accurately says no automatic retries. Future generation diagnostics include actual selected qualityMode. Public asset versions bumped.

378 tests pass,0fail; Worker dry-run passes. During development an initial test run overlapped a corrected catch-scope edit; only the completed final378-pass run is acceptance evidence. New test proves cooldown expiry invokes no AI and remains recovery-unverified until success. These are mocked tests, not provider recovery. Deployment receipt pending.

Correction to RM074 observation: refreshed signed-in dashboard now lists54records including these new failures and13recent records; prior zero-recent display was stale. Bounded100-key enumeration remains a scaling limitation but is not established as the cause of that prior display.

Open: upstream3043 remains unresolved. Cloudflare support needs to investigate with model, timestamps, request format, account-side inference logs and these references (app-local IDs, not Cloudflare trace IDs). Do not claim launch-ready. No customer quota reset in this session. Existing same-browser reset remains for owner. Existing recovery watcher remains read-only. Its lastSuccessAt signal measures inference output; protected preview/storage still requires separate acceptance. Rollback this commit restores prior status/lab copy and diagnostic payload; no data migration.
