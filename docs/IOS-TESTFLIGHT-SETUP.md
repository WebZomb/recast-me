# Recast Me internal TestFlight setup

Prepared October 12, 2026. Configuration only: not connected, signed, uploaded or installed.

## Apple account steps

1. In Apple Developer, register an explicit App ID named **Recast Me**, bundle identifier **com.recastme.ios**. This identifier is proposed in the existing source; verify availability and the correct Apple team before registering. No extra capabilities are currently required by the native app.
2. In App Store Connect → Apps → + → New App, choose iOS, name **Recast Me**, English (U.S.), the registered bundle ID, and SKU **recast-me-ios**. Verify name availability. Do not create a duplicate if a matching app already exists.
3. Use the owner's existing Codemagic account. Add **WebZomb/recast-me** as an iOS native app using `codemagic.yaml`. The source can compile on its Mac builder even though the owner's computer is Windows.
4. Inspect the existing Apple integration and distribution certificate first. Do not revoke or replace signing assets used by other apps. Connect the owner's intended Apple team to Codemagic under the integration name **Recast Me**, or change that name in the YAML to match the verified existing integration. Adding an Apple API key grants sensitive account access and needs the owner's explicit approval of the chosen scope and destination. Never put a `.p8`, certificate password or account password in GitHub or chat.
5. Add/fetch an App Store provisioning profile specifically for **com.recastme.ios**, with a matching valid distribution certificate/private key in Codemagic.

## Finish before the first signed build

- Package the approved RM icon as a 1024×1024 opaque app icon in `ios/RecastMe/Assets.xcassets/AppIcon.appiconset/`; set the AppIcon build setting. The existing public brand icon is only 400×400; it has been inspected but not changed or packaged in this session.
- Review native required-reason APIs and all embedded web-service data collection, then package `PrivacyInfo.xcprivacy` and complete accurate App Store privacy disclosures. Do not declare the whole service collects no data.
- Confirm the Apple team, app record and bundle match. Select an Xcode version satisfying Apple's current upload requirements.
- Review available Codemagic minutes/billing before starting the build. This configuration has no automatic triggers; it does not start itself.

The workflow deliberately stops if the icon or manifest is missing. It generates the existing XcodeGen project, applies the configured signing profile, archives with `testFlightInternalTestingOnly`, and uploads to App Store Connect. Both review-submission switches are false: no external beta review or public App Store review is requested. In App Store Connect, add the processed build to the owner's internal testing group. Do not invite other people without authorization.

## Acceptance on the owner's iPhone

Test photo picker/camera and consent, likeness, foreground render, an interrupted connection without a duplicate render, recent-version recovery, native save/offline gallery/share/delete, physical-product preview, browser checkout handoff and return. Keep physical-order inspection and the final purchase automation test separate; a compile does not validate fulfillment or physical printing.

Before public distribution, resolve digital artwork/render-credit purchases and purchase-linked credits under current Apple rules. Native StoreKit is not implemented. This internal-only configuration cannot produce a public release; remove that restriction only through a reviewed release change after acceptance.

Sources checked October 12, 2026:
- https://docs.codemagic.io/yaml-quick-start/building-a-native-ios-app/
- https://docs.codemagic.io/yaml-publishing/app-store-connect/
