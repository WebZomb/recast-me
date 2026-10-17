# App Store preparation — 2026-10-17

Baseline native branch rm152-ios-testflight at 6839ad74a95ae9054c89cedd3c0af8c8f373a75d. Isolated worktree; shared dirty repository untouched.

Implemented: separate Codemagic distribution export without internal-only flag, explicit version fields, session-only native photo-provider consent before WKWebView instantiation, production Guide wording and support link, submission metadata/review/gate dossier. Consent uses scrollable constrained-width layout with a minimum44pt button label. No web models, quotas, prices, fulfillment or live website source changes.

Validation: git diff --check passed before publication. Hosted Xcode compile requested through native PR; outcome pending. Native visual/device test pending. Apple/Codemagic cannot currently be reached through authenticated browser: Opera disconnected; prior Apple PC offline; active shared PC debugging endpoints unavailable. No credentials harvested or shared browser disturbed. No paid actions, signed upload, App Store submission or public release.

Risks: digital downloads/render credits in embedded live site require regional compliance resolution; final privacy/rating/contact/screenshot fields need authenticated review. Release counter starts above1000; verify highest account build and coordinate later internal numbering. Consent is intentionally once per app session and affects all embedded tabs; Guide/offline gallery remain accessible.

Rollback: revert this native change or keep using prior tested internal build. Public website is unaffected. Result commit and CI receipts to be appended after publication.


## 2026-10-17 morning receipt
PR89 final head a18903b7a512a5d286b62a8514aadddd27080300: simulator-build and Workers Builds checks PASS. Earlier simulator run39008669429 also passed compile, icon and privacy packaging. PR89 merged into native branch only as 68bd5d7b349058b36f27fb55b6a54053640dd594. Production website main unchanged; Cloudflare automatically produced a branch preview.

Opera connected and authenticated Apple page inspected. Recast Me1.0 remains Prepare for Submission; no build selected, description/keywords/support URL/review-contact fields blank. App Information subtitle and content-rights setup unfinished. Apple initially required updated developer agreement; owner reports acceptance. No new binary uploaded or submitted. Opera exposes read/navigation/screenshot but no form action/upload capability, and Desktop Commander has no native UI controls in this session. Available interactive-browser option TinyFish suggested, not connected. No credentials extracted, paid operations or private contact details committed. Final privacy, storefront digital-commerce decision, screenshots, signed build and submission remain pending.


## Authenticated App Store listing update, 2026-10-17 late morning
Owner connected TinyFish and explicitly signed in/saved Apple browser profile. Run e50d73da-d5a8-4d0e-8b85-02e461301392 saved and verified English-US version1.0 description, promotional text, keywords, support URL and marketing URL with no validation errors. Run c2444dd0-9727-4601-a2fd-183266a9cac6 saved subtitle Photo Art & Personalized Gifts, primary category Photo & Video and draft privacy policy URL. No build attached, no screenshots selected, no submission.

Observed remaining Apple fields: age ratings not started; content rights not set; price and country availability not set; privacy data questionnaire not completed. Build chooser opened but eligible build list/internal-only markers could not be fully inspected, so highest build remains unverified. Mac distribution shows Automatic (Apple Silicon); assess before launch since no Mac testing completed. Review contact still not entered. Digital-commerce storefront decision remains open. Codemagic profile setup prepared for owner sign-in; no signing or upload started. TinyFish browser runs are metered (initial wallet$10; exact settled remaining balance not checked). No top-up/auto-reload enabled. Source and website runtime unchanged during these listing operations.


## Signed distribution upload receipt, 2026-10-17
Codemagic app6acd782d2442f441f5fc7d30 build6ad3917d7550aed8108f9998 SUCCEEDED on native source553fd4e7bb9b902141a67e576a00dc74b28face3 using recast-app-store-release. Version1.0 build1001, bundlecom.recastme.ios, App Store distribution, iOS17+. Code signing, archive and publishing all succeeded. Apple deliveryUUID964742b6-19dd-4eb7-a67c-35ddf611aaa5, upload logged no errors. Existing integration reused; no certificate/payment/plan changes. Build used available included capacity. Browser receipt runs da8c4d79-7107-47fe-96d1-02ed43075ac8 and b0812546-518f-4bb6-9b42-2e4d59db70dd.

Apple follow-up7377bebd-9f49-40f2-90c1-b1e1f396fb9f saved review notes. Build1001 not yet in Add Build chooser; old6-10 disabled. Upload confirmed but processing/eligibility/attachment NOT confirmed; do not reupload duplicate merely because processing delayed. Screenshots still missing; privacy/ratings/content rights/price/regions/review contact unresolved. No App Review submission, approval or public release. Owner has not yet answered initial US-only availability question. Do not treat older internal build as eligible. Future internal uploads must use build numbers above1001.
