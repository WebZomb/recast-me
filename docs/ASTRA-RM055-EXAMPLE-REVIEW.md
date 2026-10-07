# RM055 real product example review

Application baseline 5b6a689d19c34db33f391194adc08512d14a0e77. Real provider run 37585045651 completed, nine generated mockup products, one held. Used only existing public hero-your-world-v08.webp; zero image-generation inference, checkout, orders or production calls. Image-processing charges may apply.

Reviewed at 2026-10-07T07:22:08.600562+00:00. Seven accepted source images are hosted unchanged on Shopify CDN and bound to exact SKU, supplier variant identity, v6 settings, output area and image/source hashes in public/catalog-examples.json. No object resizing, artificial room placement or AI modification was performed. Front views selected for both apparel products; the blank garment-back images were rejected as storefront defaults. Framed poster, mug, magnets and coasters use product views. The poster uses an honestly labeled room view: a 12x16 poster is not enlarged relative to the room. Packs explicitly say one item shown and give per-item dimensions.

Not accepted: canvas crops into the subject near the top; it needs a front-safe artwork/bleed treatment and closer view. Folded blanket view conceals the main artwork; needs a better template/view. Tumbler failed because no compatible Printful print area/view was returned. No verified example is published for these three, and their existing artwork/proof protections are preserved. New gift products remain DRAFT and outside fulfillment; Sticker Pack not ready for paid testing.

Fixed an asynchronous initial-example bug: default select controls were captured before presets applied. The example lookup now reads settings after the manifest await, with a behavioral regression covering this timing. Existing personalized previews are not replaced. A manifest regression checks every published SKU against the actual FULFILLMENT supplier IDs, denies the three held products, and checks pack labels. Cache key advances to 2552 for changed checkout and manifest.

The original provider responses and all 23 watermarked sample files are in run artifact rm055-public-examples (11466268318). Seven images were manually inspected; the full contact sheet and rejected canvas/blanket views were inspected as well. Provider-verified means verified mockup identity/composition, not a guarantee of physical print color or manufacturing tolerances.

Validation: local checks and full CI results are recorded separately. No claim that the remaining three or new products are complete. Rollback only this manifest/UI change, not supplier orders or stored approvals.

## Observed isolated CI
Run 37587656967 verified the exact delta and passed 303 Node tests, Wrangler dry-run, WebKit/Chromium product fixtures, and owner/credit fixtures. Providers were mocked in these checks. The earlier real sample run and its inspected images are separate evidence. Live sample publication is checked by the existing production audit plus the new read-only sample-image audit after main promotion.
