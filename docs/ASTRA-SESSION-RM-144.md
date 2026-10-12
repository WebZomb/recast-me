# RM144 — Camera-clear Tough Case and launch polish review

2026-10-12. Owner requests faces clear of the case camera, consistent presentation, and a full flow/design/automation review. Baseline main3ad6ec648bb779aaf8dc6962e76fed165b9b5a17; deployed runtime0767de0193c0598b11e686abc7155152534b7929.

## Implemented, pending release

New explicit design version9 for Tough Case recommendations: whole source image contained below40% of the printfile height, with13% side margins and13% bottom margin. Blended colors cover the entire template, including edges. This conservatively preserves all people/pets and all source pixels without face classification, cropping, or generative rerender. It trades maximum subject size for predictable camera clearance. Geometry is an engineering margin pending real preview verification, not claimed supplier safe-zone certification. Supplier601 catalog read live: printfile331,1392x2220,300DPI, all mapped nine glossy models use331. Fail closed if aspect ratio changes. Older explicit v6/v7 approvals keep their existing composition; optional crop remains v6 and requires its own preview. UI, fast checkout and social recommendations share v9. Tests cover portrait/square/wide/group geometry, source proportions, legacy approvals and changed-template rejection.

Fixed desktop checkout grid: landing class merch-home-all applied display:block!important, overriding checkout grid and creating1205px-wide cards. Checkout grid now explicitly wins; existing one/two/three-column breakpoints retained. Case alternate preview labels no longer imply a room, and case defaults prefer the product view. Admin removes obsolete RM069/launch-off wording and shows actual approved-order auto-print flag as read-only status; no automation flags changed. Modules/CSS cache versions bumped.

## Read-only operational findings

Authenticated current Orders dashboard: two stored jobs, mug and sticker sheet both shipped; zero awaiting action/open issues. Last automatic check was2026-10-12T07:40:47Z. These are provider statuses, not physical-quality acceptance. Live System reports order sync enabled; repository configuration enables approved-order auto-print. Code confirms payment/proof checks, per-job claims, uncertain-result holds, Printful sync before Shopify reconciliation, ten-minute scheduling and daily missing-order audit. No new paid order or production action taken.

Email alerts enabled, sender configured; latest test provider-accepted2026-10-08, delivery not confirmed. SMS disabled/no sender. X bot lacks credentials and is disabled; trend scanning/retention cleanup also off. Four recent error records comprise three old protected-head experiment dimension failures and one Safari Load failed record; this does not prove current Nano failures or resolve Safari crashes. Public upload Turnstile succeeded last session; no new security changes here.

## Final fine-comb priorities (proposals, not activated)

1. Verify camera clearance using real iPhone14 and Pro supplier previews; inspect physical case/blanket sample before print-quality claims. Keep exact approved clean artwork identical between preview and production.
2. Confirm test alert inbox receipt. Add independent uptime monitoring; internal alerts cannot run during a complete Worker outage. SMS optional; not required for order automation.
3. Repeat normal iPhone Safari flow (upload, generate, scroll, several product previews, reopen saved art) on an actual device. Hosted WebKit tests do not diagnose OS process termination. Reduce large images/compositor layers only with measured evidence.
4. Test a range of pet/person/group photo compositions using the accepted engine prompts before more promotion; no more model/prompt churn in this UI release.
5. Keep current no-AI/AI choice, editable subject suggestion, six saved versions, recommended product defaults with optional Edit, and exact-artwork approval. The original long phone photo needs no extra cropping step.
6. Consider a dedicated support inbox, shipping/delivery expectations before checkout, broader verified phone models, and a shorter bestsellers-first catalog. Avoid adding more choices until real usage identifies friction.
7. X marketing automation remains a separate connection/controlled-test project; paid credit-pack delivery still has its prior test gate. Do not call all automation complete. Retention cleanup needs a deliberate policy/expiry review before enabling deletion.

Official references checked2026-10-12: https://www.printful.com/custom/phone-cases/personalized/tough-iphone-case confirms designable edges/3D wrap; https://help.printful.com/hc/en-us/articles/50264024409233-What-is-the-safe-print-area recommends full-bleed backgrounds with important elements in the safe area. Public page did not expose exact camera-zone geometry.

Validation so far:523 Node tests PASS; Worker dry-run PASS. Hosted browser/security checks and release pending. No paid AI render, order, alert send or fulfillment action. Changes limited to commerce composition/defaults, product gallery presentation, admin status copy/flag, associated tests and this record. Rollback: restore prior recommendations/UI while retaining v9 compositor for any already-approved v9 orders; do not reinterpret frozen approvals.
