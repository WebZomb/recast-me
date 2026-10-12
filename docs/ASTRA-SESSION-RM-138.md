# RM138 — Clear product waits, six recent Recasts and mobile display memory

2026-10-12 UTC. Baseline `291939093fefbc1dffb98d65c3e91f1ec8ba08b1`; runtime RM137 `d56e86b1c8c8bbdf6dc6bbaaae1503edfebd00ae`.

## Authorized scope and findings

Owner requests a single 20–45-second product preview estimate only in loading panels, guidance to keep browsing/request other products, six recent pictures, illustrated More Styles/Surprise controls, review of simple flow, and recurring Safari page-crash investigation. Inline screenshots reviewed; no Library attachment retrieval. Crash seen on model-lab and reported on main/admin; exact cause NOT reproduced.

Confirmed estimate mismatch: product button note snapshots the initial estimate while the panel reads later session samples. Product preview state is already independent per card; other cards are not globally disabled. This change adds no extra provider calls or retry policy.

## Changes

- `public/checkout.js`: single owner-observed estimate in active panel, longer-wait copy after 45 seconds, instructions to keep page open and preview other products, no forced scroll on request. Remove obsolete timing samples and duplicate note. Actual supplier timing may exceed estimate; existing limits/retries remain.
- `public/app.js`, `recast-history.js`, `index.html`: six persisted recent successful artwork entries, existing four-reference-upload limit unchanged. Keep four-entry image cache and deferred history fetching. Original photos are not newly persisted; browser history stores existing private artwork references. Older already-evicted versions cannot be recovered by this change.
- `creation-wizard.js`, `simple-flow-v117.css`, `index.html`: large illustrated discovery buttons using existing local style art; accessible labels and expand/collapse preserved. Surprise excludes the custom-description option. Photo → Style structure retained, optional controls still optional.
- `app.js`: selected-photo thumbnails now small 480px display copies, sequential decode and stale-element guard; original File objects/generation preparation unchanged. `model-lab.js`: similarly reduced original display copy with stale-selection guard and object URL release; output images lazy decoded. Existing four-result limit retained.
- Mobile main/owner CSS reduces selected blur/compositing effects; `admin.html`, `model-lab.html`, `recast.html`, main imports cache-busted. These are mitigations, NOT proof that the intermittent iPhone crash is fixed. No automatic crash reload loop added.
- `tests/original-photo.test.mjs`, `render-wait-ui.test.mjs`, `scripts/rm050-browser-tests.cjs`: six-history bound/recovery, illustrated targets, small display thumbnail, loading-only time, existing checkout protections.

## Validation and release status

Initial Node run: 506/507; one stale asset-version assertion corrected. Then 507/507 PASS. Initial customer Chromium run failed on the intentionally removed pre-click estimate assertion; corrected to require no estimate before request and the single estimate inside loading. Next customer Chromium 320/1440 PASS with no page JS errors. Further final thumbnail assertion/screenshots added; final run pending. Model-lab Chromium 393/320 PASS (local synthetic uploads, six mock engines, existing 500/1024 preparation unchanged). Wrangler dry-run PASS. Hosted WebKit/customer CI and release pending.

No paid assistant image renders, purchases, fulfillment, or provider/model/prompt changes. Safari device-level crash not reproduced; no claim of live iPhone stability. Six-history is explicitly owner authorized, superseding AGENTS last-four guideline. Rollback: revert RM138 frontend changes; six records may be reduced to four on a later write by old code, generated artwork/order storage remains untouched.

Final local customer run also passes thumbnail dimensions and six-entry selection. Screenshot inspection then found inherited 135px minimum width causing discovery-card overflow at 320px; explicitly reset minimum width/margin and added container-bound assertions before release. Hosted checks must use corrected head.
