# App Store preparation — 2026-10-17

Baseline native branch rm152-ios-testflight at 6839ad74a95ae9054c89cedd3c0af8c8f373a75d. Isolated worktree; shared dirty repository untouched.

Implemented: separate Codemagic distribution export without internal-only flag, explicit version fields, session-only native photo-provider consent before WKWebView instantiation, production Guide wording and support link, submission metadata/review/gate dossier. Consent uses scrollable constrained-width layout with a minimum44pt button label. No web models, quotas, prices, fulfillment or live website source changes.

Validation: git diff --check passed before publication. Hosted Xcode compile requested through native PR; outcome pending. Native visual/device test pending. Apple/Codemagic cannot currently be reached through authenticated browser: Opera disconnected; prior Apple PC offline; active shared PC debugging endpoints unavailable. No credentials harvested or shared browser disturbed. No paid actions, signed upload, App Store submission or public release.

Risks: digital downloads/render credits in embedded live site require regional compliance resolution; final privacy/rating/contact/screenshot fields need authenticated review. Release counter starts above1000; verify highest account build and coordinate later internal numbering. Consent is intentionally once per app session and affects all embedded tabs; Guide/offline gallery remain accessible.

Rollback: revert this native change or keep using prior tested internal build. Public website is unaffected. Result commit and CI receipts to be appended after publication.
