# RM155 — approved signing and first internal build

October 12, 2026 Eastern. Baseline eef3111d794c98ce310a406c49622e3f09571bf9 on draft PR71 / rm152-ios-testflight. Owner explicitly approved generating the Recast Me provisioning profile and connecting it to Codemagic with the existing Apple certificate.

Apple UI confirmed profile Recast Me App Store created for com.recastme.ios, expiring September 16, 2027. Codemagic fetched and stored only this profile as recast-me-app-store; UI confirms its matching uploaded certificate is starveil-distribution. Existing certificate and API integration were reused; no new key/certificate, revocation or other-app profile modification.

Changed codemagic.yaml integration from placeholder Recast Me to verified existing Starveil Codemagic. Commit 440da6d2bf887289a5c9f7963007f175dc23e7f4. Readback and Python YAML parsing/release guard assertions PASS. Workflow remains manual, 30-minute maximum, internal-testing-only archive, no external/public review submission.

Billing UI displayed free macOS minutes 377/500, Enable subscription, no prior transactions. No subscription enabled or payment submitted. First build started at 20:26 EDT on October 12 using Mac mini M2 and exact commit 440da6d. Build ID 6acd7ab6546ce6236cedfbfa, index 1. Build URL: https://codemagic.io/app/6acd782d2442f441f5fc7d30/build/6acd7ab6546ce6236cedfbfa . At this checkpoint it is preparing; do not claim archive/upload success until the follow-up result.

Production website, commerce and rendering unchanged. No AI renders, orders, fulfillment, tester invitations or App Store public submission. Rollback: revert integration-name change to disable this build path; preserve shared signing assets. App Store privacy/provider review, digital purchase policy and real-device acceptance remain open.
