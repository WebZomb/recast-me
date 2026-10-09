# RM103 — Fix spinning render timer and remove duplicate 30–40-second messaging

Date 2026-10-09 EDT. Owner provided mobile screenshots of the actual live fal public beta using Recast; the generated dog's appearance was close to the reference, and the new waiting overlay had **two unreadable rotating timer circles**. The 30–40-second estimate was displayed repeatedly before pressing Generate, inside the overlay and below its activity bar. The owner explicitly requested removal of the repetitions and a clean stationary elapsed timer.

## Baseline / rollback
- Main GitHub commit at start: `a2832c4a30822a9e98a2930bd1ff29a1dcbda918` (docs-only follow-up to completed public beta).
- The last public-beta Worker source deployment was `ec070c24-dbf8-43c8-aec9-ff8d12ca51a7`, and read-only Wrangler deployment history subsequently showed version `9f393b37-9f2f-45db-8cca-7b73da588297` as the most recent production version. Check actual current deployment history immediately before rollback rather than assuming version IDs are interchangeable.
- A no-secret exact local copy of the relevant HTML, JS, CSS and test/browser script was created before edits at `C:\Users\sergz\Documents\Recast-Diagnostics-20261008\Render-Wait-Polish-Backup-20261009\`, with README. Earlier full rollback of pre-fal configuration remains at `Recast-Rollback-PreFalPublic-20261009`. Neither copy contains API keys.

## Root cause actually verified
- Shared `public/styles.css` has the broad legacy CSS rule `.loading span { width:44px; height:44px; border:3px solid ...; animation:spin 1s linear infinite }`. The new `#generation-clock` and `.render-clock-icon` are both spans inside `#loading`, so both inherited the 44px spinning ring CSS. This explains the two circles, rotating elapsed text and unreadability in the owner's screenshot.
- Existing markup showed the same estimate in three simultaneously visible places: pre-submit render-time-hint card, in-overlay `generation-detail`, and another `generation-wait-note` below the animated bar.

## Actual isolated source changes
1. `public/index.html`: removes the pre-submit estimate card and repeated note under the progress bar, preserves the accessible wait spinner, the static clock and one `generation-detail` message only inside the waiting overlay; gives `#generation-elapsed` accessible timer semantics. Changes stylesheet query to `render-wait-v1.css?v=2` and JS to `app.js?v=269` to avoid stale iPhone browser assets. No changes to customer consent, product page, checkout, saved artwork, credit counts or Cloudflare/Printful integrations.
2. `public/app.js`: removes all code for removed card and note; displays the 30–40-second HQ estimate only as the single `generation-detail` field during normal rendering. Standard uses separate variable-timing text. After longer waits the same field shows patient operational messaging without starting extra paid inference, and the unchanged elapsed clock continues to count. Original rendering API and image generation logic untouched.
3. `public/render-wait-v1.css`: explicitly overrides the legacy global rotating span rule for ONLY `#loading .render-elapsed > #generation-clock` and `.render-clock-icon`: `animation:none!important`, `transform:none!important`, `border:0!important`, `width/height:auto!important`, fixed readable text. The activity bar still has its own indeterminate animation and the loader-orbit dots still spin where reduced-motion permits. Reduced-motion support preserved. No global CSS selector changes.
4. `tests/render-wait-ui.test.mjs`: tests only the single in-overlay estimate, absence of duplicate card and paragraph, correct versioned assets and CSS specificity, timer states and Standard mode text.
5. `scripts/rm050-browser-tests.cjs`: mocked WebKit 393px and Chromium 320/1440px browser regression asserts the waiting clock and icon have **computed** `animationName=none`, `transform=none`, 0px spinner border and readable line-height; no model request executed.

## Tests and deployment
- **407/407 local Node tests passed**, 0 skipped/failed. Source check for app.js and browser test passed. Wrangler `deploy --dry-run` succeeded, 139 public assets. 
- This document is created before the GitHub branch merge / actual production deployment. Do not claim the change is live without the Wrangler deploy receipt and external static asset/readiness checks.
- No paid model rendering was initiated, no background job or provider billing changed, and no image/stylistic generation was requested.
- Owner screenshot displayed promising likeness; the prompt/model parameters and artwork remain untouched.
- Production public beta continues to use fal FLUX.2 dev. Cloudflare HQ remains unverified, Standard model and original checkout/orders unchanged. Existing accepted-but-uncertain job reconciliation is still a separate high-volume readiness issue.

## Rollback
If the new UI misbehaves, restore the three public assets (index.html, app.js, render-wait-v1.css) from `Render-Wait-Polish-Backup-20261009` or roll back only the Worker to the last confirmed pre-UI version after checking deployment history. Do not roll back or modify customer credits, saved previews, private R2, Shopify, Printful or moderation settings.
