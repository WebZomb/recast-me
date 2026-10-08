# RM060 — closer, contextual product previews

Baseline main78c5306ddd40bcf2124f6a7ff218d4131353f34f. Owner requests missing sticker example, closer proportional poster scenes, room backgrounds for personalized white-background previews, and repair of folded blanket hiding its image.

First stage: generated one wizard-cat sticker/laptop lifestyle illustration with built-in imagegen, uploaded through Shopify, replaced placeholder media46472252063988 on product15419161739508. Old URLhttps://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-sticker-printful.jpg?v=1791338074 retained here for rollback. New URLhttps://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-sticker-rm060.png?v=1791425106. Matching website references updated. Illustration is not a dimensional proof. Generated source exec-059802dd-dd05-472b-91c1-cda66ce09a98.png. Prompt: small wizard cat glossy silhouette sticker on unbranded13-inch laptop, walnut home desk, warm light and cyan/violet accents; no text; realistic scale.

Added owner-authenticated read-only exact mapped-SKU catalog inspection to existing admin page, to inspect real supplier view availability before choosing styles. Does not create previews or orders.

One existing public dog-space demo requested as blanket50×60 with existing v6fit92 layout for diagnosis; no AI/customer-upload/order/payment calls. Supplier returned default view. Further visual/provider investigation and fixes pending.

No final blanket or background fix claimed at this checkpoint. Preserve print geometry, old approvals and clean fulfillment files. Revert only this session delta over current main for rollback.

## Contextual supplier previews implementation
First-stage94ee0c30ebd5f4f620fabd88319cb32f71ba14a0 deployed successfully (Workers113114175026); browser113113987785 all steps succeeded,324 tests. Shopify sticker read-back confirms new media46505398075636.

Owner-only supplier catalog inspection verified Blanket395/10986 has variant-specific simple print area63×53in150dpi and multiple lifestyle plus flat styles; Canvas3/5 has portrait18×22in300dpi and room scenes. New room-v1 preview request selects V2 styles only when exact placement, variant restriction, technique and pixel geometry match the existing V1 print area. No print design/version change. Separate room1 mockup cache prevents replacing existing approved proofs. Folded/back/detail/placeholder styles excluded; preserves a flat proof where available. Pillow retains existing multi-side V1 path. Products without exact compatible V2 scene geometry retain prior V1 behavior.

Frontend retains distinct room views, prefers contextual view, adds whole-scene1.35× wall-art close-up with Full room option. Product-to-furniture proportions unchanged; original supplier images remain final-review proof. Source area bound for new room-v1 previews extended to20000px with aspect bound8 so mapped60×80 blankets and24×36 canvases exceed neither old12000px guard nor silently fall back to raw source. Old preview requests retain legacy guard.

327 Node tests pass, including exact geometry/variant isolation, old proof preservation and V2 payload. Two initial failures were expected outdated label/dedup assertions; retained non-scene label dedup and updated room label expectation. Live new scenes and blanket selection still pending at this checkpoint. No paid order or AI model change.

## Follow-up: full-picture sticker and verified scene corrections
Contextual implementation06f628292760effb36c26e2feb42acbb79f108d0 deployed (Workers113115704260 success); browser113115554678 all steps succeeded. Live dog-space public-demo requests verified both poster sizes and both canvas sizes produce real room scenes. Canvas12×16 also returned a Multi-product scene containing an unrelated shirt; exclude that category and prefer Wall for its plain proof.

Blanket50×60 Flat/Front proof shows the full design correctly; Lifestyle, Lifestyle2 and Lifestyle3 are folded views hiding the dog. Excluded those categories despite their misleading names; default blanket display to full-design proof. Separate room2 caches for canvas/blanket preserve already-approved room1 proofs. Blanket60×80 V2 create-task rejected catalog landscape83.007in width against portrait62.5067in; retain proven V1 path for exact variant13222 without guessing or changing print geometry. Remaining scene quality still requires live inspection.

Owner identified that generated art contains a full background, so silhouette sticker illustration was misleading. Used built-in imagegen to edit ONLY the sticker to a full-picture wizard cat with purple magical background, retaining laptop/desk/scale. Source exec-abad6230-020a-4006-afdb-4b3c458eebca.png; permanent URL https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-full-picture-sticker-rm060.png?v=1791426248. Updated Shopify description and matching website copy to full-picture with background included; no SKU/variant/price change and no new cutout pipeline. Replaced Shopify media46505398075636; old stage-one URL above remains rollback reference. Second imagegen call is an edit; no generation/fulfillment/order calls through Recast.

327 Node tests pass after scene/copy corrections. New deploy receipt and remaining visual verification pending.
