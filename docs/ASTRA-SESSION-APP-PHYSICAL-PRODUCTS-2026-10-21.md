# Native apps: physical products; digital artwork on the website

## Owner decision and baseline

October 21, 2026: the owner explicitly chose to remove HD Digital Recast and Recast Pack from the Apple and Android app experience and keep them on the website. The owner does not want to buy digital artwork for review evidence. This is an ongoing product-availability change for app users, not a temporary review-only setting.

Baseline main: `39d2f4c18331f9e547e76ed2ca4b8bd3869a59a4`. The preceding deployed runtime was `c2c14872e9e3251f7edb55ee4b3f072d8519324f`. Work is isolated on `fix/apps-physical-products-20261021`; unrelated earlier local changes were preserved.

Submitted iOS 1.0 (1002) source is `release/recast-ios-1002` at `515836953e961498797ef5ee4fbee072c93ea22f`. Its first-party WKWebViews expose the recastPreview/recastAccess/recastHaptic bridge at document start. They can load this shared web change without a new native build. No Android source, manifest, Gradle/TWA/Capacitor project or uploaded Android artifact was found in the repository/126 branches. Earlier records say Android setup is paused pending a qualifying device. Android WebView/explicit-marker support is prepared, not proof of an installed or released Android binary.

## Implementation

- `public/app-channel.js` detects the existing iOS bridge and provides per-request `x-recast-app-platform` headers. Future wrappers can inject `window.RecastApp.platform` with `ios`/`android`, or use `RecastMeApp/iOS` / `RecastMeApp/Android` in their user agent. Legacy iOS WebView and Android `; wv)` user agents are recognized. No channel cookie or persistent browser setting is written.
- `public/app.js`, `public/checkout.js`, `public/seasonal-products.js` remove both digital offers from main merchandising, artwork-specific catalogs and Specials in app mode. Checkout rechecks the channel at click time to reject a restored/stale digital card. Physical product approval, checkout and free watermarked preview Save/Share remain.
- `src/app-channel.js` and `src/entry.js` apply the same policy to checkout options, seasonal products and fulfillment mapping. Digital checkout is rejected before catalog/provider work. `src/social.js` retains channel context through the internal shared-artwork purchase bridges.
- `public/order.js`, `src/workflow.js` and `src/preview-security.js` suppress paid download eligibility/actions in the app and reject direct native download requests. Stored purchases, entitlements and historical order records are retained; website downloads still require the existing paid entitlement and artwork key.
- Support/privacy paid-digital copy is website-only. Script versions are refreshed on main, shared artwork, order and Specials pages, including fallback checkout injection. Older order guidance now uses the actual Order details & updates label.
- `scripts/app-channel-browser.cjs` and the existing customer-policy workflow cover normal desktop/mobile browsers and native contexts. Four raw-VM/cache-version test harnesses were adapted to the actual shared module import. `tests/app-channel.test.mjs` covers server policy, shared-route propagation, normal browser preservation, physical checkout and entitlement preservation.

## Verification before release

- All **611 Node tests passed** with local server/child-process support. Six new regression tests exercise the real Worker router with mocked external services.
- Worker dry-run bundle passed: 724.12 KiB / gzip 181.82 KiB, 225 public assets; no deployment from the local build command.
- JavaScript syntax checks and `git diff --check` passed. Independent source review found and resolved the shared-artwork script-cache and Specials-header gaps.
- Initial fresh-checkout run lacked its existing dependencies; linking the identical prior dependency install resolved it. One new social test fixture omitted the existing CSRF header and was corrected. Sandbox-only local-server/process restrictions and Wrangler configuration-directory restrictions were resolved by running the same tests/build with authorized execution support. No production check was bypassed.
- Chromium/WebKit are not installed locally. The new browser script is connected to hosted validation; actual hosted results and release receipts must be appended below before claiming live acceptance.
- No paid AI calls, purchases, orders, supplier mockups, digital entitlements, Shopify product mutations or customer messages were performed. Browser test APIs, image uploads and merchant destinations are mocked.

## Scope and remaining review work

Ordinary desktop browsers, iPhone Safari and Android Chrome retain digital products. The generic WebView fallback can also restrict embedded browsers inside other apps; it is deliberately conservative for older clients and direct-download navigation. This is a product-channel policy, not authentication or app attestation. No promise is made for an Android wrapper that removes all native markers while impersonating an ordinary browser.

The merchant checkout sheet is a separate browser and does not inherit the first-party bridge/header. This change governs Recast's first-party catalog and checkout initiation; it does not claim to control independent browsing around the merchant website.

The new owner Software Update screenshot confirms the phone still runs iOS 26.6.2 and offers 27.0.1. The previous 4:28 combined walkthrough is historical evidence from the older OS and older catalog. Once the app change is deployed/verified, a latest-OS launch-to-typical-flow video should show physical checkout and the working Community dialogs; it does not require a digital artwork purchase or download. The six-answer Apple draft is maintained privately outside this public repository. No App Review reply, attachment or resubmission has been performed. Existing browser-control availability remains unresolved.

Rollback: revert this focused change to the baseline shared app files; stored catalog products and digital entitlements need no restoration because they were never removed. Such a rollback would re-enable the old in-app digital offers and would contradict the owner's current product decision, so communicate that effect before choosing it.

## Hosted validation and release receipt

October 22: PR107 implementation head `8e625a633e12502472d447063c4ad6609cfeae17` matched locally verified tree `8457fa10ddf520107698c5c60da80216b83879e9`. Hosted security validation and the pre-existing browser suites passed. The first new app-channel browser case stopped during free preview Save because its mock access token was not the 64-character hexadecimal value required by the existing private-collection contract. The fixture now uses a valid synthetic token, and failure reporting retains the original stack. Production validation was preserved. No customer key or real purchase was used. Full browser validation and release remain pending until the corrected head passes.

The corrected fixture head `475c2cbb6bda127eb4499cebc3928e314f73d7e7` passed all three normal-browser contexts and the iOS app's catalog/Save/Share/physical checkout/download-visibility assertions. Its next assertion mistakenly inspected the earlier landing-page order-history poll rather than the order page request. That assertion is now scoped to requests after order-page navigation begins. The new app/browser suite runs before the older browser suites so failures are diagnosed sooner; all existing gates remain. These two corrections affect the test harness only, not production behavior.

Append exact final head, tested tree, merge/deployment identifiers, checks actually completed and production readback here.
