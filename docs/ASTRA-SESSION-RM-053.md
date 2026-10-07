# RM-053 — discovery, store expansion research, and launch protection

Baseline: RM-052 production commit 4f137c291b3d86612e816cd59086334c99bcdbe0.
Date: 2026-10-07 UTC.

## Recovered owner direction
Recast Me remains pet-led but must support many more subjects, combinations and creative worlds without making the first screen overwhelming. High Quality remains default; Standard is fallback after HQ allowance; purchase bonus and owner controls remain unchanged. Product settings remain recommended-by-default with optional editing. Existing product/print proof safeguards and clean purchased art must not regress.

## Implemented on RM053 branch
- Subject library expanded behind a simple quick-choice layer: pets, multiple pets, horses/animals, individual people, couples, families, friends/groups, children/teens, babies, person/pet and family/pet combinations, vehicles, homes/places, memorial/tribute and custom.
- Reference labeling and identity handling expanded for the new subject families.
- Worlds expanded beyond the RM051.2 library with Music & Fame, Travel & Lifestyle, Careers & Dreams, History & Legends and Funny & Wild. Public presets remain original/generic rather than presenting protected franchises, celebrities or real team logos as official products.
- Worker-side burst limiter added for customer render submissions (8/minute per initialized credit wallet) in addition to existing 24-hour credit limits and global AI call/budget guards. Turnstile server verification already exists but production still needs a real sitekey/secret.
- No existing Shopify product, SKU, price, Printful mapping, order or approved design changed.

## Store expansion research
Printful's current public catalog advertises 563 customizable products and explicitly includes phone cases, pillows, totes, water bottles, mouse pads, laptop sleeves, pet products, greeting cards and holiday decor. Current Recast store stays at its validated 12 offerings until exact catalog product IDs, variants, placements, mockup styles, costs, Shopify variants and proof geometry are verified.

Priority candidate waves:
1. Pet/gift fit: pet bowl, pet bandana, pillow, ornament.
2. Everyday visual products: phone case, tote bag, water bottle.
3. Desk/tech: mouse pad/desk mat, laptop sleeve.
4. Later: greeting cards/stickers and other low-ticket add-ons.

Do not expose checkout for a candidate based only on a marketing page. Printful V2 catalog data and mockup styles must be checked against the connected store and US selling region first.

## Remaining account-gated item
Cloudflare Turnstile requires a widget sitekey and secret. The Worker already validates Turnstile when TURNSTILE_SECRET_KEY is configured. Production public-config currently reports no sitekey. A Cloudflare widget/credentials must be created or connected before this gate can be turned on. Do not invent credentials.

## Validation
Use the isolated RM053 workflow for full locked Node tests and Wrangler dry-run. Promote only after a final validation run on the exact branch head. Main production audit remains required after promotion.
