# RM066 — configurable owner email and text alerts

2026-10-08. Remote baseline `54bd182323507f6289375043f240cf41c461bf72` (application RM065 plus live receipt); local equivalent receipt commit6dd8808. Owner explicitly asks for a place to enter any phone/email destination for order-error alerts and asks whether X is the final launch item.

## Implementation
- New `src/owner-alerts.js`: owner-only private versioned settings; single email, international phone, channel enable switches, order/system/new-order categories, recipient permission, per-channel daily cap. Save never sends. Settings changes are revision guarded and checked again immediately before delivery. Provider credentials are deployment secrets, never exposed in settings.
- Resend email and Twilio SMS adapters; scheduled checks follow the existing10-minute commerce cycle. Bounded50-record pages rotate across jobs and ingestion issues. Grouped notices contain no customer details, order IDs, source photos, capability links or raw errors. Unknown transmission results are preserved without blind same-day retries. Durable claims prevent duplicate same-batch submissions; per-event/day acknowledgments prevent resending when a batch changes; daily atomic caps bound messages. Provider acceptance is labeled accepted, not delivered.
- New `public/admin-alerts.js` and Alerts tab: editable destinations, channel switches, categories, cap, save/reload and explicit test-send actions; service readiness and last attempt status. Draft edits survive refresh. Credentials are not editable in the form. Empty destinations and delivery switches default off.
- `src/workflow.js` isolates dispatch failures from normal commerce tasks, with dashboard sync-error visibility. Existing order/production gates unchanged. No actual recipient configured or real message sent by the agent.

## Provider setup still needed
Private Workers secrets/configuration: ALERT_RESEND_API_KEY, ALERT_EMAIL_FROM (verified email sender); ALERT_TWILIO_ACCOUNT_SID, ALERT_TWILIO_AUTH_TOKEN, ALERT_SMS_FROM (approved SMS sender). No accounts, sender numbers, paid services or credentials created/activated. Sender/domain and recipient geography/carrier restrictions require provider setup and a real recipient-approved test. Native deliverability callbacks/polling are not implemented; the page explicitly distinguishes provider acceptance from final delivery. Full site/scheduler outages require independent external uptime monitoring; this worker cannot alert if it cannot run.

Official API references consulted: https://resend.com/docs/api-reference/emails/send-email ; https://www.twilio.com/docs/messaging/api/message-resource . Fixed provider endpoints and bounded payloads; no arbitrary user-configured webhook.

## Validation
358 local tests pass,0 fail. Eight new functional regressions cover authentication/validation/permission, stale settings, no-send-on-save/private secret response, incident deduplication/concurrency, unknown SMS handling, daily caps, explicit test consent, rejected/missing providers. All provider calls mocked. Worker dry-run and syntax/whitespace checks passed. No physical purchase, render, message, supplier confirmation or customer email was sent. Live UI/deployment receipt follows.

## Launch answer / boundaries
X is optional for a website-only launch and remains a separate activation gate. Earlier live RM065 evidence confirms current Shopify order/merchant-managed-fulfillment permissions and enabled order sync, plus2 accepted supplier orders; not new unattended fulfillment/shipment proof. Content screening was still disabled. Owner alerts need providers and real delivery tests, bot protection needs current verification, and complete unattended order-to-shipment acceptance remains open. Preserve approved simple subjects, exact artwork, model and budget settings.

Rollback RM066 source/UI/tests together, preserving private alert settings, send claims, budget counters and order records. Do not reset sent markers or provider claims. Turning alert channels off stops subsequent new dispatch attempts; in-flight accepted provider messages cannot be recalled here.
