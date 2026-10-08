# RM064 — automatic fulfillment reconciliation

2026-10-08. Baseline main ab485bc997a02ffd28acd38f31adf9b8ebf5fc0e (tree1e7f8681acdb61eb9e1a30e68277a6e3aedfdca9). Owner asks for smooth automatic customer fulfillment after personally confirming the recovered sticker draft. Read-only live check found supplier order179888000 pending while Recast remained held. No new purchase or agent provider confirmation.

## Changes
- Verify supplier ID, recorded external reference and returned store before reconciling. Observe pending/inprocess/partial/fulfilled acceptance, set a durable sent marker with observation timestamp, archive stale hold reason, and never call provider confirmation from sync. This closes the external-confirmation gap and prevents subsequent automation from re-confirming the same order.
- Supplier onhold/failed (or a submitted order returned to draft) becomes review, not healthy production. Partial shipping does not prematurely fulfill the entire Shopify line.
- Persist supplier truth before Shopify tags; failed tag updates remain visible and can retry. Bounded supplier sync rotates its storage cursor past the first100 jobs.
- Scheduled supplier sync runs before Shopify ingestion. Each scheduled phase catches its own error and records system/commerce-sync.json; a Shopify outage no longer prevents supplier status updates.
- Add authenticated Printful-only status-sync button/route. It can reconcile existing shipment records through the existing Shopify fulfillment path; it does not create/confirm supplier orders.
- Admin awaiting-action count excludes normal production and includes actual holds/errors. Customer status distinguishes accepted/waiting from manufacturing, adds safe HTTPS tracking link, partial/canceled labels and do-not-reorder guidance on holds. Admin and order script cache keys advanced.

## Validation
341 mocked local tests pass, including7 new functional regressions for external confirmation, ID mismatch, supplier hold, admin auth, scheduled Shopify outage, partial shipping and cursor rotation. Initial new tag-failure assertion failed because existing tag helper returns false rather than throwing; caller now records that failure explicitly and suite passes. Node syntax checks passed. Current main file contents fetched and compared to local selected changes before publishing; no unrelated historical local changes included.

## Boundaries
Native300DPI sticker preparation fix is RM063 and already deployed. Normal preapproved auto-print flag was already enabled; no setting or payment gate weakened here. No AI render, new customer charge or Printful confirmation. Existing protected exact design, original production claims and manual recovery requirements remain. Shipping emails remain the existing Shopify notifyCustomer fulfillment behavior, not a new message campaign.

Live deployment/status receipt to follow. New-order unattended end-to-end and real shipment notification still need live acceptance; mock tests are not that evidence. Production lead time remains supplier/carrier controlled. No promise of instant shipment. No moderation/X/bot service activation.

Rollback only RM064 selected source/UI/test changes over baseline; preserve live job records and all provider locks. Do not clear sent markers or resubmit orders that the provider already accepted.

## Live receipt and account blocker
Application481771ddf44704732b526e98e29e69ea19f0675c deployed successfully (Workers113165083708). Admin Printful-only sync verified both existing orders as in_printful_production with the sticker's stale hold/release action removed. Provider still reports pending, not physical shipment. This check submitted no new provider order or confirmation.

Status-tag failure became visible for both orders. Diagnostic follow-up136e8005debaad6c6651c589bbb779169c7f22ae deployed (Workers113165659523), exposing exact supplier-independent error: Access denied for tagsAdd field.

Read-only owner scope audit added in c236d3a08996ace78eb3b69d68bc1e89cb21c03f, deployed Workers113166430492 SUCCESS, public-browser-audit113166259792 SUCCESS. Live currentAppInstallation returned app title Recast Me Fulfillment, granted scopes ONLY read_orders and read_products. Therefore this app cannot currently tag orders or write Shopify fulfillment/tracking. No permission was broadened. Owner permission approval remains required; inspect the app's permission configuration and fulfillment location routing before requesting the narrow correct fulfillment-order write scope, plus write_orders for order tags. Do not claim fully automatic Shopify tracking/notification readiness until granted and a shipment is actually verified.

Final342 local mocked tests passed;52 focused commerce tests passed. Scope-query schema validated against2026-07 with Shopify toolkit. Public UI supplier statuses and read-only scope audit verified live. Privately saved screenshot recast-fulfillment-permissions-rm064.jpg shows account blocker and accepted sticker; no customer images/tokens committed. Test purchase not repeated. Every additional application change above is isolated to diagnostics/authenticated scope inventory; no payment settings changed.

Documentation references: https://shopify.dev/docs/api/admin-graphql/2026-07/queries/currentAppInstallation ; https://shopify.dev/docs/api/admin-graphql/latest/mutations/fulfillmentCreate ; https://developers.printful.com/docs/ . Supplier pending means accepted awaiting fulfillment; production/shipping speed cannot be guaranteed by Recast. Read-only scope endpoint returns app title and scope handles, not credentials or customer data.
