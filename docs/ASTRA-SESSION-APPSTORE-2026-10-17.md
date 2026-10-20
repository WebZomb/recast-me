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

## October20 submission association and screenshot capture
Authenticated browser run fc95ea5c-5168-429a-9a9d-6d1f251abf06 verified app6822107649/com.recastme.ios and selected eligible processed build1002 for version1.0, saved. Old1001 TestFlight build not expired/deleted. Existing auto-release setting restored. No Add for Review/submission. Media Manager reports no uploaded screenshots/assets. Optional previews/header are not asserted mandatory. Library title/content search and PC Downloads filename search did not locate the remembered finished screenshot package; this is not proof it never existed.
Prepared isolated simulator capture workflow on native baseline587457812da54957a22247800e8e7be9d6b8cdfd. Shipping Swift code remains unchanged; temporary XcodeGen UI-test target captures actual consent, loaded studio, empty native gallery and guide for available Pro Max/13-inch iPad simulators. No synthetic artwork/order injection, customer photo access, rendering/payment, signing or Apple upload. Workflow and actual project-preparation shell/YAML validated locally; Xcode execution and image review pending. Artifact screenshots must be inspected before listing upload; failed/error screens are not store assets. UGC blocking and final privacy verification remain submission gates. Rollback remove this capture-only branch/workflow; no production data affected.

Correction during this session: found existing screenshot branch codex/ios-store-screenshots at1d2e8a80 and reviewed asset branch codex/store-assets-39047136940 at3c288ba9cd2b0b967a79a4661868fcbe4a9b09ec. Six original PNGs are present under docs/app-store/screenshots/{iphone,ipad}/ (store-home/guide/specials). Visually inspected original iPhone home: it still shows Guide fifth tab, so stale for1002 Community navigation. Preserved old branch untouched (non-fast-forward protection correctly rejected attempted new branch collision). Newcapture branch codex/ios-store-screenshots-1002. Previous session documents TinyFish file-upload limitation and offline PC desktop copy; currently onlinePC expectedDesktop andOneDriveDesktop folders absent. No files deleted. Old shots exist; prior broad search was incomplete.


## October 20, 2026 — verified Apple and screenshot handoff

TinyFish run fc95ea5c-5168-429a-9a9d-6d1f251abf06 removed only version association with build1001, selected build1002 on app6822107649/version1.0, saved and preserved after-approval auto release. No Add for Review or submission. Media Manager had zero uploaded screenshots. Privacy run c0fb092b-4733-4e3e-8e2c-b838f29e1680 reached Other Diagnostic Data setup but could not advance the tracking explanation modal; this entry was NOT saved and privacy remains draft. Do not interpret captured cookies as successful submission.

Owner correctly recalled prior screenshot files: branch codex/store-assets-39047136940 at 3c288ba9cd2b0b967a79a4661868fcbe4a9b09ec contains six iPhone/iPad home, guide and specials PNGs. Old home screenshot reviewed: fifth tab Guide, now stale relative to build1002 Community. Preserve originals. Older PC desktop package was not found on the currently connected PC.

Fresh capture workflow39471217030: iPhone job succeeded, iPad failed because capture code assumed a phone tabBar. Capture-only selector corrected in a990f955cf866b70e4d2fba883344a3dcbe372c1; rerun39472522131 still in progress at this receipt. Shipping app sources unchanged. Initial iPhone artifact12287822876 and partial iPad artifact12287582041 retain actual simulator captures. Visual review REJECTED iPhone02-create as store-ready: logo/product images were not loaded, despite the text readiness assertion passing. Native photo-guide capture was loaded. Partial iPad Create displayed loaded form and Community navigation. No new screenshot uploaded to Apple. Successful capture CI alone is not visual acceptance.

Release gates remain: fully loaded/reviewed screenshot set and upload, complete/review/publish App Privacy, verified Content Rights, and community abusive-user blocking readiness. Do not claim Apple review submitted or Android launched. Cart PR93 remains separate/default-off and is not part of build1002.

## October 20 afternoon verified progress

Community blocking PR103 merged main b885b3f and guarded deployment39475403821 plus independent public audit39475403893 succeeded. Runtime live; anonymous browser/network limitations documented in Community session.

Privacy attempt fdfc5a11-87ad-4514-8312-ad64eb49855a again could not advance Other Diagnostic Data tracking definitions dialog after App Functionality and linked Yes; entry remains unsaved and privacy unpublished. Manual completion required; do not claim submission. Content Rights still requires accurate verification.

Capture run39472522131: iPad succeeded (artifact12287194583); iPhone failed at simulator launch. Visually reviewed actual RGB iPad Create and Guide2064x2752, and earlier iPhone Guide1320x2868. Packaged these three in Recast_App_Store_Current_Screenshots.zip; no Apple upload. Durable file delivery attempt failed HTTP403; originals remain in GitHub Actions artifacts. Capture-only retry39474820757 with simulator boot and test retry plus20-second image settle remained in progress at receipt; not a successful capture claim. Old screenshot branch preserved. No duplicate Apple binary upload. Cart PR93 remains tested/default-off and not deployed; Storefront access verification is blocked by connector access denial, not proof credentials absent.


## October 20 — App Privacy published and stronger screenshot capture

Privacy completed: TinyFish66474d4b-277f-4684-a3bf-6f92ebc79ef8 saved Other Diagnostic Data; e5e93e27-bec8-45ac-a96e-37857251b806 verified12categories and published declaration. Review sign-in confirmedOFF by2cd2cc76-e304-43db-97b2-a784cef428c2. Content Rights remainsunset; screenshot uploads0. Build1002selected, NOT submitted. This supersedes earlier manual privacy blocker. Owner authorizes only our sample imagery for listing; customer Community images excluded. TinyFish cannot upload files.

Owner rejected preliminary3image package as inadequate. Capture-only commit ec129b0026cffe66bb58ddf7a111b89e17e1b286 replaces consent/emptygallery captures with real home, product catalog, creation choices and original-photo UI plus supporting Guide. Uses existing public brand samples; no customer posts or orders, no new paid renders. Native app and live site unchanged. Capture workflow39485324720 in progress; outputs require visual review. Proposed richer saved-art/product-customizer screens are not claimed captured. Rollback: revert capture test only; no runtime rollback needed.
