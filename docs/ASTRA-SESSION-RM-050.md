# RM-050 — High Quality first, three purchase credits, simple products, owner controls

Date: 2026-10-06. Baseline main: `1594e0b4ec9cc883bdd2f5efc7d152418c31c44f` (RM-049.5).
Preparation branch: `recast/rm050-simple-flow`. Exact-source archive anchor: `86e9b7686662203c206232a315a8761ad89547f2` (adds read-only validation workflow only).

## Owner decisions
- Three High Quality previews per daily allowance; five Standard previews only after all available High Quality previews are used. An outage alone must not reveal Standard.
- Explain Standard may lose detail/likeness. Offer the next reset or three bonus High Quality previews from an eligible paid Recast order. Do not encourage buying an unwanted result.
- New purchase bonus is THREE, not the older five. Preserve amounts already granted rather than removing customers' existing credits.
- Product defaults should be automatic. Hide crop/position/spacing behind a single Edit design control. Preserve the final reviewed design lock before payment.
- Owner needs private usage/operations visibility and adjustable limits over time.
- The accepted preceding engine proposal is HQ FLUX.2 dev, Standard Klein 9B, X Klein 4B. X activation/posting is NOT part of this change; both enable/approval flags remain false.

## Implementation
- `src/render-credits.js`: configurable 3/5 allowances; backend Standard lock while HQ or purchased credits remain; three-credit new grants snapshot their amount; legacy grants without an amount retain five. Duplicate paid events, refunds, cancellations, failed-preview restoration and 24-hour windows remain enforced. Credits are held during an attempt, returned on failure, and purchase credits do not expire at daily reset.
- Free allowances retain existing shared-network abuse protection, not authenticated one-person-one-account identity. Browser wallet cookie remains Secure/HttpOnly/SameSite=Lax. Optional private-R2 random salt bootstraps during wallet POST when no environment salt is provided. It is not public, not an admin-editable value, and no IP/salt is returned in the dashboard. Existing CREDIT_IP_SALT takes precedence.
- `public/quality-policy.js`, `app.js`, `index.html`: no Standard UI for an outage or stale selection; daily and purchased balance text; local reset time; explicit lower-quality warning at exhaustion. Return to High Quality after a reset or restored/purchased credits. Refresh balance after attempts and when a visible tab resumes. Build marker RM-050; app/checkout cache keys 250.
- `public/checkout.js`: one Recommended layout applied line, one collapsed Edit design control, Preview my product primary action, and Reset to recommended inside the editor. Changes invalidate the reviewed mockup; payment still requires a fresh matching proof. All 12 catalog products remain intact.
- `public/order.js`: automatically checks verified purchase credits on the private order page; removes stale five-credit promise; credits are for NEXT creations and cannot silently swap an already-confirmed printed design.
- `src/owner-settings.js`: authenticated `/api/admin/owner-settings` GET/POST with same-origin write checks, bounded allowlisted values, revision/CAS conflict checks, extra confirmation for increased budget/call ceilings and last-20 before/after history. Settings cannot edit secrets, payment state or auto-print/X activation. It overrides numeric policy at each API/scheduled invocation without redeployment.
- `public/admin-settings.js`, admin HTML/JS/CSS: Limits & usage tab, website/HQ/Standard/X reserved-attempt counts, reserved AI spend, quota/bonus/budget controls, pause switch, config/history. Requests use existing admin authorization; no password is created or printed. Settings form does not overwrite unsaved edits during refresh. Private order listing is paginated rather than silently stopping at 100. Summary counts explicitly identify their bounded snapshot. Order/error rendering is escaped/text-only.
- `render-controls.js`: customer credit eligibility checked before spending reservations, separate website vs social reserved-attempt counters (not billed-call totals), preserved $5/day shared reservation budget, per-model conservative reserves. Public form fields cannot select the social budget. X health/cooldowns are separate from website Standard health.
- `wrangler.jsonc`: activate daily/purchase credits using private salt bootstrap; Standard = Klein 9B; X = Klein 4B, still disabled. Keep website 70/day safety ceiling; separate X 100/day pool. Owner dashboard can adjust these. Keep 500-cent shared budget; reserve 7 cents for HQ, 3 for Standard, 1 for X. These are conservative reservations, NOT actual invoice charges or guarantees of whole-account cost.

## Cost basis and current limitations
Official Cloudflare pricing checked 2026-10-06: https://developers.cloudflare.com/workers-ai/platform/pricing/ . Model: https://developers.cloudflare.com/workers-ai/models/flux-2-klein-9b/ .
Klein 9B: $0.015 first output MP + $0.002/additional MP + $0.002 per input image MP. Current Standard output is 768x960, inputs are bounded/prepared by existing generator. Three cents is a conservative reserve for up to four reference images, including input billing rounding. Klein 4B is priced by input/output 512px tiles; one cent conservatively exceeds the bounded social call calculation. HQ keeps the separately documented seven-cent reserve. Each actual retry reserves again; a failed customer render refunds its credit, not inference spending. Images, R2, Workers platform fees, Shopify, Printful and unrelated services are outside this AI-only guard. Do not alter image dimensions/models/step counts without recalculating reserves.

## Validation observed before upload
- Exact baseline: 178 Node mocked tests passed, zero failures.
- Updated local source: 196 Node mocked tests passed, zero failures; `git diff --check` clean; admin and browser script syntax checks passed.
- Earlier in-progress suite failures were old expected policies (five purchase credits, one Standard slot, fallback on outage, X health sharing HQ). Replaced those expectations with explicit new-policy regressions, retaining concurrency/refund/lock tests.
- Local Chromium navigation was blocked by the container's browser administrator policy (`ERR_BLOCKED_BY_ADMINISTRATOR`); no local browser pass is claimed.
- Added `scripts/rm050-browser-tests.cjs` for CI: real Chromium/WebKit DOM with all API/provider requests intercepted. Covers initial HQ-only state, outage state, Standard exhaustion, purchase returning to HQ, hidden product editor/reset and owner settings save/increase confirmation. Does not call live AI, Printful, checkout or admin services. Screenshots use fixture CDN imagery and are not visual-brand acceptance evidence.
- Full CI browser/bundle results and live deployment confirmation remain pending until the preparation run is inspected. A source commit does not prove deployment.

## Risks, scope, and rollback
- Standard/X engine quality and latency are NOT newly benchmarked against real customer photos in this session. No paid renders, real purchases, refunds, Printful drafts/confirmations, or X posts were initiated by this work.
- Printful order #1001 and RM-049.5 recovery/authorization code are not reworked here. Never claim fulfilled from a code change.
- Turnstile was not configured in the previous production audit. This patch retains the monetary guard and network protection but does not create a Turnstile site or eliminate abuse risks.
- iOS source, approved orbit branding, hero artwork, last-four-preview storage and all merchandise mappings are preserved.
- Roll back only this RM-050 application commit, not main to an old baseline. New stored owner settings are separate at `system/owner-settings-v1.json`; setting changes are revisioned and do not reset existing usage. New wallet grants have explicit amounts; reverting to pre-RM-050 code would wrongly assume five, so inspect/migrate that data before a credit-policy rollback.

CI attempt 37528626385: source checksum, 196 Node tests and Wrangler bundle passed. Browser harness stopped because Playwright Request.url was referenced instead of called; fixed the harness to use url(). CI attempt 37529121500 also passed 196 Node tests and bundle, then correctly rejected its incomplete saved-preview fixture: no image had been returned, so the app did not activate checkout. Added the mocked protected-preview response and wait for checkout activation. Neither failed attempt published application changes. Also shortened the repeated exhaustion notice, clarified the Standard selection button, and cleared stale admin save errors.

## CI preparation evidence
Run 37529663190 verified the full source-delta checksum, passed the Node mocked suite and Wrangler dry-run, and passed Chromium 320/1440 plus WebKit 393 fixture-browser checks. The browser report and screenshots are in the run artifact. No live generation, commerce, admin settings or deployment was performed by this preparation. Application changes were published only to the working branch after validation.
