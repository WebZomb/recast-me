# RM068 — existing Gmail mailbox for owner alerts

2026-10-08. Remote baseline 2eea140159d1c938bbc38eb1ac857ca1db02324d, tree aca1e39e8775e0ed1c55081ed8997c2c60a4fa47. Owner approves reuse of the existing PourIQ Gmail sender for Recast alerts after new-account signup was blocked. No new mailbox or Resend account required. Do not bypass Google's signup verification.

## Implemented
- src/gmail-alerts.js: narrow direct Gmail SMTP adapter using Workers cloudflare:sockets, smtp.gmail.com:465 with TLS from connection start. Validated Gmail sender/app password, recipient and fixed plain-text alert headers; base64 UTF-8 MIME body, bounded response parsing and 15-second overall send timeout. Only final DATA 250 means accepted; ambiguous connection/timeout outcomes remain unknown without transport retries. Provider errors never returned verbatim. No general SMTP relay or arbitrary host/header interface.
- src/owner-alerts.js: explicit Gmail provider selection, readiness and actionable setup messages, existing consent/revision/deduplication/daily cap gates preserved. Resend remains available by explicit alternate configuration; no silent fallback when Gmail is incomplete.
- public/admin-alerts.js and public/admin.html: explain missing connection and disabled channel, Gmail setup support, refresh test-button readiness after a test instead of blindly enabling it.
- wrangler.jsonc selects ALERT_EMAIL_PROVIDER=gmail. Actual sender/app password are private deployment configuration, not committed.
- tests/gmail-alerts.test.mjs: TLS endpoint, fragmented/multiline replies, final acceptance, auth rejection redaction, post-DATA disconnect, timeout cleanup, header injection and readiness cases.

## Validation and limitations
372 local tests passed, zero failures. Worker deploy dry-run passed; git diff --check passed. All SMTP tests mocked; no live Google authentication or email sent. No purchases or AI calls. Shared Gmail quota can affect both apps. Supabase/PourIQ source, deployments and credentials untouched; direct Worker SMTP avoids a new relay or cross-project backend dependency.

## Required private activation
In recast-me Production runtime secrets add ALERT_GMAIL_USER (existing approved Gmail address) and ALERT_GMAIL_APP_PASSWORD (a dedicated Google app password named Recast Alerts). Do not put a Google login password or app password in chat, repository, screenshots, or alert destination form. Existing account uses 2-Step Verification per PourIQ setup record; present app-password availability must be confirmed by owner. Do not retrieve/copy PourIQ secrets.

The owner is signed into Cloudflare on their own phone; agent cloud-browser login previously failed after Google authorization. Do not resume that failed sign-in loop. Owner can enter the two secrets directly, deploy, refresh Alerts, save enabled email and consent, then send the explicit test. Entering configuration enables scheduled sending if email is already enabled; it may send an existing incident before the manual test. Test receipt is required; configured or provider-accepted is not proof of receipt. SMS remains unconfigured. Content screening, Turnstile and X activation gates from RM067 remain unresolved.

## Official references consulted
https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/ (TLS sockets; port25 prohibition, using465)
https://support.google.com/a/answer/176600 (Gmail SMTP/app passwords)
https://support.google.com/accounts/answer/185833 (app passwords and 2-Step Verification)

## Deployment / rollback
Application deployment receipt follows when observed. Roll back RM068 code as a unit or disable email channel; preserve private send claims/counters/settings. Switching provider must not reset deduplication records. Do not claim live delivery until owner confirms receipt.
