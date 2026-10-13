# RM153 — iOS packaging

October 13, 2026. Baseline draft PR71 commit a206df1bc9e84260abb1269e79a444eb35c3f70c; main a8cc764acef9483e6d7479c771091ae50fdbb79c remains unchanged. Work stays on rm152-ios-testflight.

Added opaque 1024px universal AppIcon catalog, asset build setting, privacy manifest and source-based privacy review. Version 0.2.1/build3. Selected Xcode26.2 for unsigned CI and manual Codemagic configuration; build counter starts above3. Added CI verification that icon and manifest are actually embedded. Updated setup prerequisites. No website, checkout, rendering, printing or fulfillment code changed.

Icon provenance: public approved orbit RM icon (400px) inspected. Built-in image-generation edit requested faithful 1024px enlargement preserving letters, orbit, border and black background, no new text/redesign/transparency. Output1254px was deterministically resized to1024 RGB PNG. The derived app icon is not pixel-identical to the original; original website artwork untouched. Generated source exec-1363e482-a97f-47c7-8543-6b763713c264.png. One image-generation request; billing unmeasured. No paid render/order or signed build initiated.

Validation at preparation: 1024x1024 RGB icon confirmed, JSON/plist/YAML parsing and shell syntax checked; git diff check. Hosted Mac compile pending. No device screenshot/visual acceptance, signed archive, TestFlight upload or Apple app registration. PC command access works but native browser control is not exposed; owner's PC Apple session cannot be controlled with available tools. Do not extract its cookies or credentials.

Privacy declarations include embedded service photo/prompt, order/contact, identifier and operational data, plus aggregate analytics/country counts. No tracking found; no native required-reason APIs found. Actual provider settings and App Store privacy questionnaire remain owner-account review tasks. Digital purchase policy remains unresolved before public distribution.

Rollback: revert packaging/config files in this draft branch. No live deployment or migration. Resulting commit and hosted checks will be recorded in a follow-up receipt.
