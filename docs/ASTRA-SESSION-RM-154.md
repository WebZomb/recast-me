# RM154 — Apple app registration and Codemagic continuation

October 12–13, 2026. Baseline draft PR71 head fbcf5c1910bb619406ba7aa41246a2bffbb6d8a7; main a8cc764acef9483e6d7479c771091ae50fdbb79c. This commit adds this session receipt only. Its resulting SHA is the GitHub commit containing this file.

Recovered prior session notes and verified hosted iOS compile run 38325360552, job 115062643211: success, including Xcode 26.2 simulator compilation and packaged asset/privacy checks. This is unsigned simulator evidence, not a signed archive or device test.

Owner completed secure Apple sign-in. Verified intended developer team in Apple UI. Registered explicit com.recastme.ios (Recast Me) with default capabilities. Created matching App Store Connect iOS record, English (U.S.), SKU recast-me-ios, limited user access. Apple app ID 6822107649. Verified TestFlight page displays No Builds.

Added WebZomb/recast-me to existing Codemagic personal account through the existing GitHub integration. Selected rm152-ios-testflight; Codemagic successfully loaded codemagic.yaml and displayed Start your first build. No build started.

Read-only signing review found existing Apple integration named Starveil Codemagic and an existing production distribution certificate expiring September 16, 2027. Existing Codemagic stored profiles cover Starveil and PourIQ, not Recast. Do not revoke/replace these shared assets. Current YAML integration name Recast Me does not match the existing integration; update only after the intended signing reuse is settled.

Prepared Apple App Store provisioning profile form named Recast Me App Store for com.recastme.ios using the one existing matching team distribution certificate. Stopped before Generate for action-time approval of signing access. No profile generated/imported, API key created, certificate generated, permissions expanded or credentials exported. Browser sessions retained for continuation. PC command device lists online; its native browser is not exposed to this session.

Remaining: approve/create app-specific signing profile and fetch into Codemagic, align integration name, verify billing/minutes, run a signed internal-only build/upload, inspect processing and install on owner iPhone. App privacy questionnaire/provider review and digital purchase policy remain public-distribution gates. Website and commerce untouched. No paid build, render, order, fulfillment, invite or public release.

Rollback: revert this receipt if needed; app registration and Codemagic app are separate external setup state. Do not delete them or shared signing identities as an automatic rollback. Existing production website remains unchanged.
