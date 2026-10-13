# Privacy review — October 13, 2026

Baseline: native source and the embedded Recast website at main a8cc764. This manifest is a source-based declaration, not confirmation of provider dashboards or completion of App Store Connect privacy labels.

- Photos/videos and other user content: selected photos and prompts sent for storage, analysis, generation and product printing. Functionality; linked conservatively because artwork and purchases can be associated.
- Name, email, address, phone and purchase history: order/fulfillment data in `src/order-queries.js` and `src/workflow.js`. Functionality; linked. Payment-card details are handled outside the app by checkout and are not accessible to this app.
- User/device identifiers: artwork access, browser credit wallet and abuse-control identifiers. Functionality; linked conservatively.
- Other diagnostics: operational rendering/order failure records. Functionality; linked conservatively where associated with artwork/orders.
- Product interaction and coarse location: optional first-party aggregate events and country counts in `src/traffic-analytics.js`. Analytics; not linked in retained aggregates. No exact location permission or GPS collection.
- No advertising tracking or tracking domains were found in native source or the first-party analytics implementation. External checkout has its own policies; re-review before embedding new checkout/advertising SDKs.
- Native gallery keeps up to 20 watermarked previews locally, excluded from device backup. This local storage does not add another off-device collection purpose.
- No listed required-reason API usage was found in the current native Swift files. There are no third-party native SDKs. The empty accessed-API list must be revisited if dependencies or native storage APIs change.

Before public release, verify actual enabled providers, log retention, optional analytics, support collection and Apple's App Store privacy questionnaire. The manifest does not replace consent or the public privacy policy. No privacy settings were changed by this packaging work.

References: Apple documentation, Describing data use in privacy manifests; NSPrivacyCollectedDataType and NSPrivacyCollectedDataTypePurposes. Exact data-type constants checked against Apple's documentation JSON. Public policy: https://recastmeai.com/privacy.html.
