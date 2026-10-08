# RM074 — Cloudflare 3043 failure classification

2026-10-08. Baseline remote main 5f1462f7067065c5bd16d8736896cf62c0fd4415, local684e459. Owner reports repeated HQ render failures. Signed-in exact-reference lookup confirmed two ai-generation failures at22:49:26UTC and23:09:46UTC, reason provider, code3043, message Internal server error, HQ flux-2-dev. These are provider errors, not recorded moderation or quota rejections. No customer photo or private credentials committed.

Changed src/highquality.js to classify exact3043 as unavailable. Existing outage response, per-mode60second cooldown and health recording now apply. No automatic retry/model switch added. No model/prompt/quality/credits/moderation/fulfillment settings changed. The latest RM050-era policy intentionally locks Standard until HQ credits are exhausted; preserved rather than silently changing entitlement semantics. Old generic incidents are not retroactively rewritten. Cooldown expiry permits a fresh attempt; it does not prove provider recovery.

Added generator regression for both quality modes:503/unavailable, preserved diagnostic3043, future retryAt, second request blocked with exactly one AI.run. Targeted25tests passed; full376tests passed0fail; Wrangler dry-run passed. These use mocked providers. No paid inference, customer upload, order, message or new service. Source patch cannot repair upstream inference. Actual render recovery remains unverified. Deployment status must be checked separately after push.

Read-only diagnostic list displayed older items while exact lookup found current incidents; do not trust its zero-recent snapshot as comprehensive. Pagination/list freshness requires a separate bounded investigation. Prior automatic email-only cycle had cleared alerts:failed at18:51ET in browser; no new manual message sent.

Rollback: revert highquality classifier and added generator test; this restores generic reporting for3043. This session's resulting commit is the commit introducing this file; deployment receipt follows when available.
