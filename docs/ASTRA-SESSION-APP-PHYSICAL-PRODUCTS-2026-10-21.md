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

### October 22: released and independently verified

[PR107](https://github.com/WebZomb/recast-me/pull/107) merged as `3c7dbc96b2fc0e207db1c6e5331826121b49ab9f` from final tested head `32b8d2233ed7d6d43b0a3b2a5eba489ced4b2a65`. The merge tree exactly matches tested tree `14d39d648a1a36eeba931fa5d0740b9f65f04b5c`. Main remained at the recorded `39d2f4c` baseline until this guarded merge. The production source is unchanged from the initial implementation head; subsequent commits corrected test fixtures and their execution order.

**Final checks.** [Security validation 39714731584](https://github.com/WebZomb/recast-me/actions/runs/39714731584) and [customer-policy validation 39714731581](https://github.com/WebZomb/recast-me/actions/runs/39714731581) both succeeded on the final head. All 611 Node tests passed, with zero failures, and the Worker dry-run passed. All existing customer/owner, Model Lab, seasonal, gift-guide and Community browser suites passed. The new Chromium/WebKit matrix passed all 14 engine/client contexts plus four stale digital card checks, including free preview Save/Share, physical checkout, tracking, native paid-download hiding, Specials, support/privacy copy, request headers and viewport fit.

An isolated local WebKit diagnostic also passed all seven contexts and both stale-card checks. Initial local Chromium downloads were unavailable; the WebKit fallback and its dependencies succeeded. Settled desktop, iOS 393px and Android WebView 320px captures were visually reviewed: website digital offers remained, native cards were physical only, images stayed contained, labels/actions were legible and there was no horizontal overflow. At 320px, the physical approval dialog retains its existing vertical scrolling. Immediate screenshots can capture lazy-image placeholders; additional settled captures resolved image-fit uncertainty. These are mocked browser checks, not installed-Android acceptance or supplier-quality evidence.

Hosted evidence artifact `12399070711` is 66,367,589 bytes, SHA-256 `890e0f6e3b9f864da5002bc826bf83c4d3d7ae2fb92fffc7254d6edac3ebf16a`, retained by the workflow for seven days. Browser API/image/merchant requests were intercepted; no real photo upload, purchase or supplier action occurred.

**Deployment.** [Guarded Cloudflare deployment 39715254597](https://github.com/WebZomb/recast-me/actions/runs/39715254597) succeeded on merge `3c7dbc96b2fc0e207db1c6e5331826121b49ab9f`. Both offline tests/dry-run and deployment jobs succeeded. Worker version: `448b5feb-d859-4367-b420-99281d32132c`. Production smoke passed for the home page, render readiness, model status and owner-auth protection. [Read-only launch audit 39715254528](https://github.com/WebZomb/recast-me/actions/runs/39715254528) also succeeded; the independent readback below establishes the new release directly. Provider-example workflows were skipped by their existing explicit-approval gates.

**Independent production readback, 2026-10-22T03:12:09.608682+00:00.** Six live JavaScript assets exactly matched the merged source. The main page, shared-artwork page, order page and Specials page referenced the new script versions. Both public catalog routes returned `private, no-store`:

| Request context | Seasonal products | Fulfillment entries | Digital SKUs |
| --- | ---: | ---: | --- |
| Desktop website, iPhone Safari, Android Chrome | 18 | 56 | Both retained |
| iOS/Android app headers, legacy iOS WebView, Android WebView | 16 | 54 | Both absent |

The two digital SKUs are `RECAST-DIGITAL-HD` and `RECAST-DIGITAL-PACK`. Physical entries remained in every context. The readback used only public GET requests and made zero paid or write operations.

| Verified live asset | SHA-256 |
| --- | --- |
| `app-channel.js` | `7383a604e4a4949662c9b85eeb475c8507ddb3daf1273a62f412a9694d46162b` |
| `app.js?v=308` | `19fd70cde8e1b5036e8bcda7a3eb7dfaf411d41d85b69e53170f92b3ecacabf4` |
| `checkout.js?v=304` | `16b1e98aff39cdde7c18649449c70bd45392d6d858ce51f419f739fa796876e1` |
| `order.js?v=11` | `36c083470e704957c7b08e9ca80eca16488e4afe3fd564f69800003e1336c2fd` |
| `seasonal-products.js?v=167` | `2abe10b3fec4b6d46f6bd709d0d2d6b8d33a152ab746e8fb317554e707f9d7c2` |
| `seasonal-specials-v163.js?v=168` | `ef02aa96be3bfc489dc2b6fa739ee59cffbc45aeb70d4523acdebee1178adb92` |

The first local readback could not open network sockets in the default sandbox. Authorized read-only network support then reached Cloudflare, which rejected Python's default user agent with error 1010. The representative browser-user-agent probes above succeeded. These were verification-environment issues; they did not require production configuration changes.

**Changed paths (26).** Runtime/client changes: `public/app-channel.js`, `public/app.js`, `public/checkout.js`, `public/index.html`, `public/order.html`, `public/order.js`, `public/privacy.html`, `public/recast.html`, `public/seasonal-products.js`, `public/seasonal-specials-v163.js`, `public/specials.html`, `public/support.html`, `src/app-channel.js`, `src/entry.js`, `src/preview-security.js`, `src/social.js`, `src/workflow.js`. Verification: `scripts/app-channel-browser.cjs`, `tests/app-channel.test.mjs`, `tests/checkout-ui.test.mjs`, `tests/product-polish-rm0511.test.mjs`, `tests/render-wait-ui.test.mjs`, `tests/rm055-accuracy.test.mjs`, `.github/workflows/recast-rm050-validation.yml`. Records: this document and `docs/ASTRA-HANDOFF.md`.

**Current handoff.** Existing iOS 1.0 (1002) can receive the deployed web change after a full close/reopen; no native rebuild was performed. Android channel behavior is implemented and verified with browser contexts, but no Android binary was built, released or submitted. The website retains both digital offers and stored purchase entitlements remain intact. A digital purchase or paid-digital demonstration is no longer part of the revised native walkthrough. Fresh latest-iOS device footage remains required by the actual Apple request; the previous combined video remains historical. The private Apple package has been updated and saved with the live receipt and a single active six-answer draft. Apple reply/upload/Review Notes/resubmission have not occurred, and writable Apple controls remain unavailable. Owner authorization to resubmit once complete remains in force.

Rollback remains the focused source revert described above; it would restore the old in-app digital offers and therefore reverse the owner's current decision. No product or entitlement restoration is required.

