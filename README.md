# Recast Me v1.0 Launch Candidate

Recast Me turns private customer photo references into original cinematic artwork, then connects the approved Artwork ID to real products and fulfillment.

## What is included

### Premium storefront
- Cinematic neon/cosmic backgrounds across hero, Worlds, How It Works, shop, order status and admin.
- Approved `YOUR PHOTO -> YOUR WORLD` example.
- Eight full-image World cards.
- Premium realistic product marketing mockups.
- Physical products first; digital choices remain last.
- WebP-optimized site imagery for much faster mobile loading.
- Inline customer-friendly image-generation errors instead of raw provider errors.

### Image generation
- Primary model: `@cf/black-forest-labs/flux-2-klein-9b`.
- Fallback: `@cf/black-forest-labs/flux-2-klein-4b`.
- Customer direction is the highest-priority creative instruction.
- Identity-lock prompt rules for people, pets and vehicles.
- Automatic subject inference (`person` + dog/pet in notes becomes person + pet).
- 4:5 master artwork (1024x1280) for stronger merch/poster composition.
- Guidance 4 for stronger instruction following.
- Safe retry/fallback logic and per-attempt timeout so customers are not left waiting for many minutes.
- Clean art stays private in R2; watermark is added only to the browser preview.

### Real-product preview
After a Recast exists, each physical product card can call Printful's actual Mockup Generator using the exact mapped product/variant and the customer's exact Artwork ID.

Flow:
1. Customer chooses product/size.
2. Worker creates Printful mockup task.
3. Browser polls task status.
4. Temporary Printful mockup is copied into private R2.
5. Product card swaps to the real generated Printful preview.

### Shopify / fulfillment workflow
- Existing exact SKU -> Printful catalog mappings preserved.
- Paid Shopify orders can be synced into private R2 fulfillment jobs.
- Control Center supports:
  1. Approve artwork.
  2. Prepare high-resolution print art.
  3. Create a Printful **draft** order.
  4. Review it.
  5. Explicitly send it to production.
- Production confirmation requires the literal `SEND_TO_PRODUCTION` confirmation in the backend.
- Printful shipment/status polling is built.
- Customer private order-status page is built.
- Paid digital entitlement/download endpoint is built.
- Unpaid customers can delete their private Recast from the status page.

### Private Control Center
Open `/admin.html` after configuring `ADMIN_TOKEN`.

Tabs:
- Orders / production
- X requests
- Trend review
- System / launch readiness

Trend review has Approve / Reject actions. Physical production never auto-confirms by default.

### X / Twitter bot scaffold
Built but intentionally disabled until the Recast Me X developer app/account is connected.

When enabled:
1. Poll mentions for the connected Recast account.
2. Extract the customer's request.
3. Reply with a personalized private-upload URL.
4. Store the X request in R2.
5. Track when that tweet later creates a Recast / paid order.

### Trend scanner scaffold
Built but intentionally disabled.
- Tragedy/war/death/disaster exploitation terms: discarded.
- Ambiguous IP/political/current-event terms: human review.
- Other trends: stored silently as background ideas.

### Optional abuse protection
Turnstile support is already coded. It activates only after you configure the public site key and private secret key.

### Retention
Unpaid-customer cleanup is coded but disabled by default. Default planned retention: 30 days. Customers can delete an unpaid Recast immediately from their private status link.

## Current launch safety settings
These are intentionally OFF in `wrangler.jsonc`:
- `ORDER_SYNC_ENABLED=false`
- `X_BOT_ENABLED=false`
- `X_BOT_APPROVED=false`
- `TREND_SCANNER_ENABLED=false`
- `RETENTION_CLEANUP_ENABLED=false`

Shopify products should remain **DRAFT** until the first complete test order succeeds.

## Secrets already expected in Cloudflare
Existing:
- `PRINTFUL_API_TOKEN`
- `SHOPIFY_CLIENT_SECRET`

New before using the private dashboard:
- `ADMIN_TOKEN` — create a strong random secret in Cloudflare. Do not put it into GitHub.

Optional later:
- `TURNSTILE_SECRET_KEY`
- `X_USER_ACCESS_TOKEN`
- `X_APP_BEARER_TOKEN`

Non-secret variables needed later for X / Turnstile:
- `X_USER_ID`
- `X_USERNAME`
- `TURNSTILE_SITE_KEY`

## High-resolution physical production
The code supports Cloudflare Images AI upscaling to a 4096px master before Printful draft creation.

This is intentionally **not enabled automatically** because Cloudflare Images transformations are billable. Before a real physical order, add an Images binding named `IMAGES` to this Worker. Until that binding exists, the Control Center blocks creation of a physical Printful draft after art approval.

That safeguard prevents a low-resolution preview from accidentally being sent to production.

## Safe test sequence
1. Deploy this build.
2. Test the exact prompt: `Make me and my dog super heros` using the same person + dog photo.
3. Confirm identity and instruction following.
4. Choose a physical product and tap **Preview my Recast on the real product**.
5. Confirm the Printful-generated product mockup is reasonable.
6. Configure `ADMIN_TOKEN` and open `/admin.html`.
7. Keep Shopify products DRAFT until the remaining high-resolution/paid-order test is ready.
8. Add the optional `IMAGES` binding.
9. Activate only the test product(s) and run one real low-risk purchase.
10. Sync the paid order in the Control Center, approve art, prepare print file, create Printful draft, inspect it, then explicitly send it to production.
11. After that succeeds, enable recurring order sync.
12. Connect X separately and keep its automation disabled until the developer account/app is ready.

## Important
Never put Shopify, Printful, X or admin secrets in the repository or in customer-facing JavaScript.
