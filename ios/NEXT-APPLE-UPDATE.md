# Next Apple update — owner checklist, October 20, 2026

Owner explicitly requests that the duplicate Help fix and other outstanding requests be carried into the next Apple app update. Do not withdraw or replace the submitted build merely for this cleanup.

## Current submission evidence
Owner screenshots confirm Recast Me iOS1.0 build1002 Waiting for Review, submitted October20 at4:36PM Eastern, submission97bb66e0-dfc6-4cea-95c1-5568200b93c0. This supersedes older notes saying public submission is pending. Approval/public availability has not been verified.

## Required before the next update is called ready
- [ ] Single Help entry on every native web-backed page. PR104 on website main moves the native bridge check before website Help injection. Keep native top Help and standalone browser Help. Confirm production deployment and actual installed-device behavior. This remote web fix can reach build1002 without a new binary, but remains a next-update acceptance item.
- [ ] Reconcile owner's earlier missing-feature requests against current main, native branch and open PRs before assembling the next build. Do not assume separate chats or branches are already integrated.
- [ ] Save to phone Photos/gallery, plus existing private My Recasts saving, sharing and protected product access: verify actual iPhone permission/denial/success paths and current Save PR98 status before claiming completed.
- [ ] Multi-product cart: check PR93/latest implementation and release status; preserve each line's approved artwork, variant, quantity, removal and saved designs; verify checkout/order/fulfillment reconciliation and duplicate protection before claiming it works.
- [ ] Small/large iPhone and supported iPad layouts: verify header, single Help, five tabs, readable labels, safe areas, product previews and checkout return. Store screenshot inheritance is not runtime layout testing.
- [ ] Preserve Community fifth tab, native Help guide, moderation/report/block controls, My Orders and tracking, Specials and original-photo outage path. Community is already in build1002, not a newly missing tab.
- [ ] Record which requests are native-binary changes versus shared website changes and their exact release evidence. Keep discounts default-off unless separately authorized and checkout verified.
- [ ] Before signing, inspect Apple for highest existing build and choose a new unused number. Do not reuse the build1002 pinned release branch. Verify signed upload, processing, internal install and final App Review receipt separately.

These are tracked acceptance items, not claims that the work is implemented or live. No paid order/render/test purchase required or authorized by this checklist. Android setup is paused at owner's request pending access to a real qualifying Android device.
