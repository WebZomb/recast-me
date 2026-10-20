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


## October 20 12:20 Eastern — device screenshot and release access follow-up

Owner screenshot shows top Help and native bottom Guide. Fresh source comparison confirms distribution source553fd4e7bb9b902141a67e576a00dc74b28face3 has Guide; current rm152-ios-testflight RecastMeApp.swift blob7e2b0290f68d47969c01aee1e2cc8120bb9ebb0d has Community. Screenshot is consistent with the older native shell; Help alone is not evidence of a new binary. No device build number was independently read this turn.

TinyFish run9dae2c2a-319d-4ae2-8768-e2828163f6b4 verified saved Codemagic access and app identity; latest visible finished build remained6ad3917d7550aed8108f9998 from October17, source553fd4e. Follow-up run3d2cfc1e-863a-494f-bd7d-612e09b1c4a2 opened the corrected singular /app/ URL but main app UI stayed blank after one reload; root/navigation/modal containers empty, support widget only. Could not inspect Start build, set one-off build number, or verify active builds. Opera connector read-only list_tabs returned Browser not connected. No repeated login requested because prior saved authentication worked; current blocker is dashboard rendering/control access.

No code/config changes, signed build, Apple upload, review submission, or billing changes this turn. Only this evidence record updated. Next: use working Codemagic build controls, verify unique Apple number above1001, launch recast-app-store-release on current native branch once, verify final upload and processing, then assign to existing Owner Testing group. Do not start with missing RECAST_NEXT_BUILD_NUMBER or claim that website Help updates native tabs. Existing rollback guidance above remains applicable.


## October 20 12:50 Eastern — alternate connections and workflow discrepancy

Owner asked to use TinyFish/Desktop Commander alternatives. Desktop Commander device DESKTOP-96HLGJF online; harmless CMD ver completed on device a2401aff-0e49-407b-aac4-0332e4ce5311. This connector provides terminal/files, not native browser click controls.

TinyFish run b91a7858-b352-4d35-8557-c765c251bb94 successfully navigated /apps card to /app/6acd782d2442f441f5fc7d30/settings. The /app root blank page is not a sign-in failure. Start dialog exposes branch/tag, workflow, SSH/VNC and start/cancel, but no observed one-off environment field. No active builds; latest still October17.

Follow-up a56a76ac-d69b-4197-9bab-f5ea1ad5d1d3 verified Apple build1001 listed and1002 not listed, no sign-in wall. It reported Codemagic showing only recast-internal-testflight and no app environment variables/groups, then stopped without starting or setting a variable. Its conclusion that release workflow is absent from repository is contradicted by fresh GitHub fetch: codemagic.yaml blob d93d74e29414a73b974841ddb8a83ec95c6c633c on rm152-ios-testflight contains BOTH recast-internal-testflight and recast-app-store-release, each requiring RECAST_NEXT_BUILD_NUMBER. Treat as unresolved UI branch/config resolution discrepancy; do not add duplicate workflow or assert source missing. No new build/upload, config/billing change or public submission. Next: establish exact branch/commit/file Codemagic resolves, refresh correct configuration through supported controls, supply verified unused number effectively, then start exactly once. Native baseline before this docs-only receipt b3bb4a77de5b1f657a48de2cd45462f454a8b97d. Existing rollback unchanged.
