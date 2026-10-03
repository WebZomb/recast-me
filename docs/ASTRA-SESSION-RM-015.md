# RM-015 — web polish and initial iPhone project

Date: 2026-10-03. Baseline `c84b05c7c66a42c3b434233f4dc01d8fc7ca6b8c` on `recast/secure-previews-2026-09-29`. Resulting implementation commit is the commit introducing this file; exact upload/CI evidence appended separately after verification. Main remains unmerged.

The owner requested final polish and preparation for App Store submission. Inspected live preview hero/form/catalog in the browser and authoritative current source. Hero has Jack Russell before/after; one catalog with separate physical/digital tiers. No iOS project existed. Reviewed current Apple guidelines for minimum functionality, AI permission and physical/digital purchases.

Changes: index/app/CSS/order-page polish; protected preview export module and security tests; factual privacy/help page; SwiftUI iOS development source with native local preview gallery/sharing, origin-restricted reply bridge, guide, connection error handling; XcodeGen and unsigned Mac compile CI; release checklist with truthful unimplemented gates. No model, budget runtime, production or commerce activation change.

Validation before upload: `node --check public/app.js`; 126 mocked Node tests passed, 0 failed. New export tests reject missing watermark contract, invalid types/bytes and oversized responses and verify private tokens are not included in returned share data. Existing tests cover backend watermark authorization. No live AI image or billable commerce/provider action initiated. Browser confirmed existing desktop preview layout; phone and native runtime still unverified. Initial git fetch failed due sandbox proxy; escalated fetch succeeded, local prior documentation changes matched remote before syncing HEAD.

Known limitations: development app connects to preview in all configurations, no StoreKit, signing/app icon/privacy manifest/App Store record yet, no background job resume or notification, native checkout redirect intentionally blocked until physical checkout design and digital policy are tested. My Recasts is local-only, max 20, not an account sync or backup. WKWebView picker/camera and save bridge need device testing. Apple approval is not promised. $5/day remains approved but inactive pending measured reserve. Live Cloudflare/Apple settings and keys were not available through a purpose-built connector in this turn. Checkout/sample/retention/support policies remain release gates.

Rollback: revert RM-015 source and docs together; no backend storage schema changed. Remove iOS workflow if undesired. Retain any user's native gallery files; website private artwork and orders are unaffected. Cumulative prior notes remain authoritative for their dated evidence.

## Observed upload and validation

Application commit: `7feaad0aaf928791e1a5e420c35113ff1a320f91`.
- GitHub security CI `37146682076`: success (tests and Worker bundle).
- Mac iOS CI `37146682131`, job `111271967722`: success. Xcode logs explicitly report `BUILD SUCCEEDED` for Debug iOS Simulator. Only observed warning: AppIntents metadata skipped because no AppIntents framework dependency. No signed archive, device install, or TestFlight upload.
- Cloudflare Preview deployment `0445da49-1ce7-44a3-8225-6cf2ec2e3cad` succeeded for the application commit at `2026-10-03T19:06:27.838Z`.
- Browser reloaded deployed preview: explicit Cloudflare consent and privacy link present. Privacy link navigated successfully to `/privacy`. Inspected console showed browser-extension metadata errors, not a Recast application error; no zero-error claim for all customer journeys. Desktop screenshots inspected; no phone viewport or native-runtime verification.
- Git fetch confirmed remote commit; local source index compared equal before updating local HEAD. Draft PR description updated with actual evidence and release holds.
- Plugin discovery for Codemagic/App Store Connect/Cloudflare found no relevant integration in its returned results. More integrations may exist in the plugin directory; no signing/provider account connection was established.
