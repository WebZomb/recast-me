# Recast Me: public App Store submission package

Prepared 2026-10-17. SOURCE PREPARATION; not a signed upload or Apple submission.

## Identity and release route
- Repository: WebZomb/recast-me; native base rm152-ios-testflight, baseline 6839ad74a95ae9054c89cedd3c0af8c8f373a75d. Do not merge this stale website snapshot into main.
- Bundle: com.recastme.ios; recorded App Store Connect ID: 6822107649. Reconfirm in authenticated account.
- Version: 1.0; Codemagic distribution workflow uses its numeric build counter + 1000. Check against highest uploaded build before running; future internal workflows must also use a higher number after distribution uploads.
- Run recast-app-store-release, not recast-internal-testflight. Distribution export omits testFlightInternalTestingOnly. Existing signing integration retained; no certificate changes.
- Workflow uploads an eligible archive but intentionally does not automatically submit an incomplete listing. Owner has authorized public submission once release gates are met.

## Proposed listing copy
Name: Recast Me
Subtitle: Photo Art & Personalized Gifts
Promotional text: Turn favorite photos of your pets and people into personalized art and gifts. Use AI styles, or put your own photo on a product.
Keywords: pet,portrait,photo,gifts,personalized,art,family,keepsake,custom
Support URL: https://recastmeai.com/support.html
Privacy URL: https://recastmeai.com/privacy.html
Marketing URL: https://recastmeai.com
Proposed primary category: Photo & Video. Confirm existing account selection.

Description:
Make something worth keeping with your favorite photos.

Create personalized artwork featuring your pets and people, explore imaginative styles, and preview your picture on gifts. Prefer your original photo? You can use it directly on supported products without an AI render.

• Choose photos and create an AI Recast.
• Check the result before selecting a product.
• Keep up to 20 watermarked previews in your private offline collection.
• Return to saved artwork to explore personalized products.
• View order updates and carrier tracking when available.
• Discover seasonal gift ideas.

AI creation requires an internet connection and is subject to available render allowances. Products and delivery are charged separately. Photo processing and privacy details are available in the app before opening the studio.

## Review notes draft
Recast Me combines a native SwiftUI gallery and guide with the live Recast Me creation and ordering service. On first opening the studio in each app session, review the provider disclosure and choose Agree & Open Studio. Selecting My Recasts or Guide does not require accepting this screen.

Create: choose your own permitted photo, follow the website consent and subject/style steps, and create a preview. The original-photo route skips AI rendering. Reviewers need working service capacity and an available allowance; check this before submission, without bypassing safety controls.

Save a completed preview to My Recasts, open it offline, and use Put on a product to return to its private artwork link. Physical merchandise checkout uses a secure browser. A shipment tracking link appears only after tracking exists. Deleting a local preview removes its device link, not server artwork or order records; privacy/support links explain requests.

Before pasting these notes, verify the exact release build and selected storefront purchase behavior. Add a verified review contact and any account instructions actually required. Do not invent credentials or state that digital purchases use StoreKit: they currently do not.

## Submission gates, in order
1. Reconnect authenticated App Store Connect and Codemagic access. Current Opera connector is disconnected; prior Apple PC offline. Do not disturb the shared trading PC or extract browser credentials.
2. Pass hosted Xcode simulator compile and packaged icon/privacy checks. Exercise consent scrolling and readable text on a narrow iPhone and iPad, all five tabs, offline gallery, resume after checkout, failed connection and original-photo flow.
3. Resolve launch regions and digital-commerce rules. Live embedded website exposes downloads/render packs and purchase-linked renders. There is no StoreKit implementation. US external-link treatment does not establish global compliance. Review current Apple rules and select a compliant regional flow before submission; physical goods use separate rules. Do not silently disable existing website sales or claim global approval.
4. Confirm App Privacy answers against native plus embedded site/provider behavior using ios/PRIVACY-REVIEW.md. Verify current provider disclosure, support/report route, deletion process, retention and required-reason API manifests. No native tracking SDK is evidenced; do not infer the checkout has no collection.
5. Complete truthful age-rating questionnaire, content rights, export compliance, review contact, pricing/availability and any account agreements in App Store Connect. Existing encryption declaration is source, not proof of all answers.
6. Run distribution workflow, inspect signing/upload logs, wait for processing, select eligible build. Verify version/build numbers and no internal-testing-only flag.
7. Capture real screenshots from that app: creation flow, completed permitted artwork, native gallery, product preview, order/help view. Supply supported iPhone and iPad sizes from current Apple screenshot specification. Avoid personal/customer artwork, fabricated orders, testing banners, misleading prices and simulated screenshots passed off as actual app screens.
8. Recheck live creation capacity, no-AI upload, checkout, support/privacy links and service error messages. Preserve truthful neutral outage wording; do not promise shopping when shared services are failing.
9. Submit for App Review and record submission/build IDs and status. Monitor review messages; respond with tested fixes. Release only the reviewed build and recheck production behavior.

## Evidence limits and references
Recorded earlier owner TestFlight checkout success does not certify this changed build. No new paid render, purchase, archive, screenshot set or submission was performed during source preparation. No guarantee of Apple approval or review time.

- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app
- https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
- https://docs.codemagic.io/yaml-publishing/app-store-connect/
