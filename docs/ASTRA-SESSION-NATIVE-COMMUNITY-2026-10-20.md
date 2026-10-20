# Native Community and release follow-up — October 20, 2026
Baseline native dda0e41256088f9345a590776f083f9ff737a3dc, not website main. Owner authorized app completion, public submission and cart release with rollback protection. US-only availability was explicitly chosen in the conversation; older unanswered-region notes are superseded. Private owner review contact must remain out of source and public marketing.

Verified existing receipt: distribution build1001 uploaded October17 on source553fd4e with Codemagic build6ad3917d7550aed8108f9998; upload is not an App Review submission. Current Apple account/processing/tester assignment unknown. Current Opera connector disconnected; online PC responds to CMD, but Desktop Commander exposes terminal/files rather than interactive browser controls. TinyFish profile records only GitHub/Google sign-ins; no Apple/Codemagic session verified this turn. No secrets extracted, browser restart or sign-in bypass attempted.

Changes: RecastMeApp fifth tab now Community using existing same-origin StudioView. Guide contents retained as RecastGuideView offline sheet, accessible via44pt Help control even before photo consent. Existing five tabs, gallery private links, haptics, consent and checkout navigation retained. Codemagic both workflows require RECAST_NEXT_BUILD_NUMBER explicitly above1001 and below10000; check the highest Apple build first and supply a distinct value for each upload. This fixes the old internal +4 counter conflicting with distribution numbering, without guessing current Apple state. No signing integration/credentials changed.

Validation: whitespace passed. Native compile and packaged-resource validation requested through PR to native branch; result follows. No local Xcode or physical iPhone available, no signed upload/public release yet. App Review prerequisites still include exact-build screenshots, listing/privacy/rating/contact, US region verification, current commerce and Community user-content requirements (including abusive-user blocking); do not treat a passing compile as compliance approval.

Rollback: native changes can be reverted on this branch, preserving prior source/build1001. TestFlight users can select an eligible available previous build; public installed apps cannot be downgraded instantly by reverting GitHub. For public recovery, build the known-good source with a new unique build/version and submit an update; separately roll back affected website UI if needed. Never erase native gallery/Keychain or commerce records during rollback. Website main is unaffected by this PR.


PR101 head082ff4e86f022acc682f76e6a591c8407a39925d passed Xcode26.2 simulator build and packaged icon/privacy checks in run39448108542. Merged into native rm152-ios-testflight only; website main untouched. No signed archive, upload, tester assignment or App Review submission occurred. Physical-device layout and exact-build screenshots still pending. TinyFish wallet readback has available credit, so the current blocker is verified Apple/Codemagic session access, not a demonstrated credit shortage.


## October 20 authenticated Apple verification and internal distribution

TinyFish audit run 99290ce6-6c51-4607-bb77-91b9a5133cdf verified Recast Me app 6822107649, bundle com.recastme.ios. Version 1.0 remains Prepare for Submission; build 1001 is processed and selected on the distribution version. No App Review submission exists. Listing text and review fields are populated. Screenshot completeness still needs verification; privacy and availability are unverified, not asserted missing.

Run 9d6f470d-3a0b-42b3-9694-ee0838a8a09f successfully added existing build 1.0 (1001) to the existing internal Owner Testing group 87b17192-f0b0-400e-9895-954c22e000c8. Readback: four builds 1001, 10, 9, 6 all Testing; one existing tester preserved. No invitations, external beta submission, or public review submission. Older test builds retained.

Build 1001 is the October 17 binary and does NOT include today's native Community change. Latest native source still requires a new signed Codemagic archive/upload with an explicitly checked unused build number greater than 1001. Simulator CI success is not signed distribution evidence.

Pricing/availability and privacy pages did not render app-specific content during follow-up; no values changed. Next: authenticated Codemagic release build, verify actual screenshot requirements and privacy/US availability through working Apple navigation, then review submission readiness. Public release remains unsubmitted.
