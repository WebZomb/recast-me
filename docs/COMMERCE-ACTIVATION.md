# Purchase previews and customer print approval — activation

Code is on the secure-preview branch. It is not enabled on production merely by a GitHub upload. Do not merge while launch gates below are incomplete.

## Approved daily budget — October 3, 2026

The owner approved **$5/day (500 cents)** for AI generation reservations. This replaces the earlier unselected amount; $2/day was only a discussion example. At full use this is $150 over 30 days or $155 over 31 days, excluding the base plan and non-generation services. It is adjustable; do not automatically raise it when orders arrive. Evaluate net contribution after product, shipping, payment and rendering costs.

Activation target: `AI_DAILY_BUDGET_CENTS=500`. This decision is recorded, **not live configuration**. Verify the per-call reservation against account usage and the largest supported reference/step settings before setting both budget variables together. Setting only the daily amount would fail budget validation and pause generation. The earlier 4–6-cent estimate described ordinary initial renders, not a measured worst-case reservation or guaranteed daily output. Existing environment values have not been inspected or changed in this session.

## Chosen customer flow

- FLUX.2 dev High Quality is selected by default; Standard remains an explicit option. No model replacement.
- Three starter previews, then five bonus previews per eligible paid Shopify order, not per line or quantity. Both quality modes use one customer credit.
- Failed protected previews restore customer credits when the request completes. Actual inference submissions, including failures and retries, retain their cost reservations. A Worker crash can leave a conservative reservation requiring support reconciliation.
- Guest wallet uses a Secure, HttpOnly, SameSite cookie. Starter allowance is shared by a salted network identifier to resist cookie resets. This is **not verified-person/account quota enforcement**; shared Wi-Fi users can share an allowance and changing networks can evade the starter limit. No raw IP address is stored. Verified customer sign-in and account recovery remain launch work for broader traffic.
- Purchase bonus is attached to the browser wallet that created the artwork. An authenticated private order link can claim an unassigned legacy purchase once. Already-assigned bonuses need the original browser or owner-assisted recovery.
- Physical orders wait for customer artwork selection and a Printful product preview. Swapping resets the preview/approval. Explicit approval locks the selected artwork and source snapshot. No countdown sends a job to print. Digital purchases remain tied to the purchased artwork.
- Finishing uses interpolation of the approved source, never another generative pass. Owner review, finalization, draft creation and explicit production confirmation remain required. A customer approval does not itself incur Printful production charges.

## Configure the deployment, then test

In the intended Cloudflare Worker environment:

| Setting | Required value/purpose |
|---|---|
| `RENDER_CREDITS_ENABLED` | `true` only after configuration/testing; absent means the new allowance is inactive |
| `AI_DAILY_BUDGET_CENTS` | Approved target `500` ($5/day); `0` pauses new AI submissions |
| `AI_CALL_RESERVE_CENTS` | Positive integer chosen conservatively from measured maximum cost per actual AI.run call |
| `AI_DAILY_CALL_LIMIT` | Optional additional cap on actual inference submissions |
| `CREDIT_IP_SALT` | New long random secret, at least 32 characters; keep stable and do not commit/share it |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Bot protection configured and verified for this deployment's hostname |
| `ARTWORK`, `AI`, `IMAGES` | Private R2, Workers AI and Images bindings |
| `ADMIN_TOKEN` | Existing private owner secret; never use as a customer token |
| `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`, `SHOPIFY_SHOP` | Verified Admin API access to orders |
| `PRINTFUL_API_TOKEN`, `PRINTFUL_STORE_ID` | Correct fulfillment store and mapped variants |
| `PUBLIC_APP_URL` | This exact deployment's externally reachable origin; preview must not point at production |
| `ORDER_SYNC_ENABLED` | Enable only after the manual payment/refund sync tests pass |
| `ALLOW_TEST_ORDER_CREDITS` | Optional `true` on isolated test deployments only; Shopify test orders are never sent to paid print production |

The budget caps **reserved amounts for AI.run calls**, not the Cloudflare invoice. Every retry reserves separately; there are no automatic reservation refunds. Images/upscaling/watermark processing, storage, Workers, taxes and other services are outside this counter. Owner/social calls bypass guest allowance but share configured call/budget limits. Other deployments sharing R2 must use compatible controls; calls from old unguarded deployments are not covered. Recheck the reserve amount whenever models, resolution, inputs, steps or provider prices change. The owner approved the $5/day target above; the per-call reserve still needs verification before activation.

Cloudflare's published FLUX.2 dev pricing is per input/output 512px tile per step: https://developers.cloudflare.com/workers-ai/models/flux-2-dev/ . Use actual account measurements for the reserve; do not infer unlimited AI from the $5 Workers plan.

## Acceptance sequence

1. Confirm CI and Preview deployment. Visually check the mobile form, order page, balance, recent-version dropdown, product proof and explicit approval checkbox.
2. On an isolated test setup, enable allowances with the chosen budget. Confirm three successful previews exhaust the starter allowance; one failed preview returns its credit. Confirm another browser on the same network cannot restart the allowance. All previews, including selected order art, must remain watermarked.
3. Create an appropriate Shopify test order, manually sync, and verify exactly five credits once across repeat syncs and multiple order items. Confirm unpaid/canceled/refunded/partially-refunded purchases cannot grant or restore credits. Refund revocation relies on sync, so it is not instantaneous; production actions also perform a fresh Shopify check.
4. Swap the artwork, generate the product proof, inspect crop/placement, and approve. Refresh and try another tab: changing the approved artwork must fail. Owner approval alone must not bypass customer approval.
5. Verify the real Printful variant/template mapping, placement, final dimensions and DPI for each product. The current proof and order both use default provider placement, with no customer crop editor. Mocked proof tests do not establish exact physical fit. Keep owner review until this is proven on real products.
6. Place the owner's real paid sample order only when ready to incur its checkout/production charges. Verify the dedicated clean print URL is reachable by Printful, locked to the approved job, protected by its separate token and denied on payment revocation. Inspect the delivered physical product before public launch.
7. Turn on scheduled order sync after successful live tests. It processes updated orders (including refunds), persists pagination and resumes each batch. First sync looks back 30 days; Shopify normally limits order access to 60 days without additional permission. Large orders above 250 lines stop for manual review.

## Operational holds and remaining work

- No auto-production timer or 24-hour reminder is implemented. Reminder delivery needs a verified notification channel and separate activation.
- Durable claim records intentionally stop automatic retries after ambiguous product-proof, finishing, draft or production submissions. Reconcile provider state before clearing a claim; otherwise duplicate charges/orders are possible. There is no customer reset endpoint.
- An order already carrying a legacy Printful draft cannot silently acquire approval or be reprinted. Review/cancel or migrate it deliberately; do not bypass the new customer gate.
- Approved private snapshots are outside unpaid-photo cleanup. Add an order-retention/privacy policy before broad rollout. Original order metadata/token remains the customer access anchor.
- Source snapshots preserve identity and composition. Interpolation adds pixels, not original detail. Large-format quality and final proof equivalence remain sample gates.
- Guest account recovery, verified-person allowances, durable render queue/resume and bounded inference concurrency are still needed for a high-volume launch. Daily budgets are not a concurrency controller.
- Production Images binding and commerce activation remain unverified in this session. X stays off. App Store submission is a later milestone.

Shopify references: https://shopify.dev/docs/api/admin-graphql/2026-07/queries/order and https://shopify.dev/docs/api/admin-graphql/2026-07/queries/orders . Both new operations were schema-validated for 2026-07.
