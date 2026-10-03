# Recast Me — iPhone release checklist

Updated October 3, 2026. **Development project, not an App Store submission candidate.** This document supersedes the old ZIP-install/iPhone planning steps in FINISH-LAUNCH-v1.9.md; historical records are preserved.

## Implemented in RM-015

- SwiftUI iOS 17+ app source and XcodeGen specification in `ios/`.
- Create tab uses the existing preview service in WKWebView with persistent website storage and native system file selection.
- Native My Recasts collection stores up to 20 explicitly saved, server-watermarked previews. Offline viewing, system sharing and confirmed local deletion. The collection is excluded from iCloud backup and written with iOS data protection. No private artwork tokens are exported into the native collection.
- Save bridge accepts messages only from the exact preview HTTPS origin's main frame. Web exporter always fetches the protected preview endpoint and checks the watermark contract. Byte type and size are bounded. Native replies only after persistence.
- Guide and connection-error recovery. No automatic in-flight render resubmission. No native background generation/resume/notifications claimed.
- Website preview sharing, explicit Cloudflare photo-processing consent, factual privacy/help page, safe-area/reduced-motion/keyboard improvements and missing base order-page stylesheet corrected.
- Mac GitHub workflow generates and compiles an unsigned simulator app. It does not sign, archive, publish to TestFlight or submit for review.

## Build

On a Mac with Xcode and Homebrew: `brew install xcodegen`, then `cd ios && xcodegen generate`. Open RecastMe.xcodeproj. The proposed identifier `com.recastme.ios` must be checked and registered under the owner's Apple team before signing. No Apple credential is in source. The development app always uses the secure preview hostname, even Release builds. Switching to production requires an explicit tested release change.

## Required before TestFlight / submission

1. **Service readiness:** configure the approved $5/day budget with a verified per-call reserve; credits secret, bot protection and isolated test storage; verify real readiness without exposing admin keys. Finish RM-013 commerce acceptance. Confirm usable latency and recovery after app backgrounding; durable render jobs remain unimplemented.
2. **Commerce:** test Shopify payment/refund ingestion, five bonus credits exactly once, artwork swap/proof/approval lock, correct Printful SKU/size/placement, protected clean print access and an owner-approved physical sample. Current native navigation intentionally blocks automatic off-origin redirects; checkout is NOT verified in the app. Add a deliberate physical-checkout handoff and safe return route, then test. Do not ship broken checkout buttons.
3. **Digital purchases:** choose launch storefronts and an Apple-compliant purchase design before shipping. Physical goods use ordinary checkout (3.1.3(e)); digital artwork and render credits need separate treatment under 3.1.1 and regional provisions. Website digital checkout and purchase-linked in-app render bonuses cannot simply be assumed compliant. StoreKit receipts, restores and entitlements are not implemented. No attempt is made to disguise digital purchases as merchandise.
4. **Privacy / safety:** verify owner/business support contact, final shipping/refund and retention policy, photo-processing consent through every entry point, server deletion/recovery, moderation/report handling and required privacy labels/manifests. The new privacy page describes current behavior; it is not a complete legal review or verified support operation. X is only an existing public contact. Do not submit “no data collected”: uploaded photos, prompts, identifiers, diagnostics and purchase/fulfillment information need accurate classification. Native framework and web-service data practices both count.
5. **Apple project:** verify bundle ID, Apple Developer team, App Store Connect app record and signing/API-key connection. Add reviewed 1024px app icon and complete privacy manifest. No App Store Connect/Codemagic tool or signed session was available in this turn; no keys were requested in chat.
6. **Device tests:** native picker/camera, consent, foreground render, loss of connectivity, app background/foreground, persistent wallet, save bridge, offline gallery/share, storage full/corrupt handling, local vs server deletion, order return and large text/VoiceOver/iPad layouts. A compile pass is not a device test or App Review acceptance.
7. **Store listing:** screenshots from the actual signed build, accurate description, support/privacy URLs, age-rating questionnaire, export-compliance answers, review notes and accessible review credentials/service budget. No invented device screenshots or guaranteed output claims. TestFlight first; resolve feedback; then submit.

## Suggested listing draft (only claim verified features at release)

Name: Recast Me
Subtitle: Pet portraits & personal gifts
Description: Turn a favorite photo of your pet, you together, or your family into an imaginative AI portrait. Describe the look and choose a world, review your watermarked preview, and save your favorites. Explore personalized gifts featuring the artwork you choose. AI results vary: review faces, markings and details before ordering.

## Sources checked October 3, 2026

https://developer.apple.com/app-store/review/guidelines/ — 4.2 minimum functionality, 3.1 payments, 5.1 privacy and explicit third-party AI permission. Native gallery/share are intended to add utility; acceptance is Apple's decision.
https://developer.apple.com/documentation/webkit/wkframeinfo/securityorigin — origin checks for native bridge.
