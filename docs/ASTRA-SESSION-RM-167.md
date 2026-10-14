# RM167 — Style-qualified seasonal gifting

Baseline: `61649e14b37497f1d89b5bba49b10333c2d57bf8` (RM166).

## Implemented
- New cinematic Halloween hero (`public/assets/recast-halloween-hero-v167.webp`) and illustrated-color offer card. Phone hero artwork stays visible above text. Sale copy identifies the required filter and never publishes a coupon.
- Annual Eastern-time rotation: Halloween Oct 10–31, Christmas Nov 1–Dec 25, New Year Dec 26–Jan 7, Valentine Jan 8–Feb 14; Easter, Mother’s/Father’s Days, graduation, summer, beach days, and pet occasions use dated windows with overlap priorities. Owner overrides remain available. Easter currently links to Storybook; New Year links to Birthday/celebration; summer/beach link to Beach Escape. These are existing filters, not newly trained styles.
- New mug composition v13 keeps two copies meeting at the front and shifts the cover crop down within each panel using source gravity x=.5/y=.35. Older approved v12 and earlier compositions retain their original geometry. No render model or prompt changes.
- Replaced reusable cart-coupon integration with fixed Shopify draft checkout lines, after existing artwork authorization and proof confirmation. Only the matching private saved styleId qualifies. Fixed variant, quantity and proof attributes are preserved. Discount-code entry and extra automatic discounts are disabled on the invoice. The line discount does not expose a reusable code.
- Permission-gated promotion: `write_draft_orders` must be granted to the production Shopify app. Without it, sale banners/prices stay hidden and ordinary checkout remains available at normal prices. Connected Shopify readback confirmed this permission is currently missing. No claims that secure discounts are active until grant and verification.
- Existing minute scheduler removes expired unpaid seasonal drafts; paid orders are never deleted/repriced. New discounted checkout creation stops at Eastern midnight on the cutoff date. Already-open invoices are revoked by scheduled cleanup (normally the next minute; provider outage can delay cleanup). This is not an absolute real-time payment-deadline guarantee.

## Validation / status
- 590 Node tests passed, including matching-style/forged-style cases, exact invoice lines/proof, draft reuse, annual boundaries, expiry and paid-order preservation.
- Chromium at 320/393/768/1280px: all 18 products, offer fixture, owner form save, no overflow/page errors; hero screenshot inspected. This fixture shows the intended enabled promotion, not current live permission status.
- Worker dry-run passed. Hosted checks/deployment pending.
- No real order, payment, paid app render, supplier request or customer-photo publication performed. No live fixed invoice created yet.
- Initial test failures were assertions for superseded v12 crop, old hero filename, Halloween-only schedule and public coupon behavior; updated to the new requirements and supplemented with checkout behavior tests.
- Remaining activation: grant draft-order permission to the production app, verify a disposable unpaid invoice including shipping/tax behavior, then confirm live banners/checkout. Pending ambiguous Shopify creation remains on hold instead of silently creating a duplicate; owner recovery is manual. Existing draft inventory is not reserved.
- Rollback: revert RM167 runtime/UI changes. Do not restore the broad reusable code unless deliberately accepting the old unrestricted behavior. Existing approvals/orders remain unchanged.

## Artwork provenance
Built-in image generation, new original fictional scene. Prompt: premium cinematic moonlit Halloween village, vampire Jack Russell and wizard cat with personalized mug/framed artwork, violet/amber lighting, uncluttered left third, no text/logos/watermarks. Asset optimized to WebP; previous approved product imagery preserved.
