# Inline Community administration — October 20, 2026
Baseline main 728f02c395db1339d2de41c165beb6fc0b5e8b4b. Owner explicitly requested Community review in the Control Center, with all admin work in one place.

Changed public/admin.html, admin.js, admin.css and new admin-community-panel.js: Community Review tab next to Orders, pending badge, same owner login and refresh, watermarked private previews, explicit Approve / Reject-hide / confirmed Delete. Existing standalone review URL retained for old links. Backend authorization, consent and moderation remain unchanged. No submissions auto-approved; no real customer content accessed or changed. Private blob previews revoked on refresh/lock/page exit; generation guard prevents late requests restoring locked content; credentials sent only to same-origin image URLs. Approve waits for preview load. No new token persistence. Small responsive cards, contained images and wrapping 44px action targets.

Validation: 600/600 Node tests pass. Initial run failed one obsolete cache-version assertion; updated expected admin script version and reran successfully. JS syntax and whitespace checks pass. Added hosted browser fixture coverage for 320/393/768/1280 widths, pending-to-approved-to-hidden transitions, clear and panel overflow. Local Chromium unavailable; actual browser result and deployment pending. Bundle dry-run result recorded in follow-up. No paid actions, orders, render calls or cap changes.

Rollback: revert this UI change; standalone admin-community page and backend remain available. Preserve independent capacity PR90 and cart PR93 during integration. Source implementation is not evidence of production deployment or review of the owner's pending submission.


## Verified production release
Runtime head 8285535776c8cb0c559acccc0eaed296b26e989a, tree88f0f7fa5a00524bf89bd49d438d9b228f0abff5. PR100 merged as5cbafdb1d28adfaff81a259a8bfb8f1e8aa86f1d. Security39446221348 and full customer/browser39446221297 passed, including new owner fixtures at four widths. Artifact12277266858 downloaded and393px review screenshot inspected: contained picture, readable status and wrapping approval/hide/delete targets. Local Worker dry-run also passed.

Guarded production deployment39447024253 passed test/bundle and Cloudflare deployment plus read-only production smoke. Independent live HTTP readback confirms community-pending tab, admin.js?v=community2, and exported initCommunityReview module. No authenticated production review action performed and owner's specific pending submission not inspected or approved. This release receipt supersedes pending/source-only wording above. CLI git push lacked credentials; uploaded identical verified tree through authorized GitHub connector instead. No cap/discount/spending changes.
