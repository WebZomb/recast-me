# Christmas Village mug proof approval — Labrador Retriever, German Shepherd, French Bulldog

Owner requested every ready-made mug made buyable while retaining source quality and Printful approvals. The first Golden Retriever Christmas Village 11oz/15oz pair was approved and verified in production.

## Supplier receipts and visual checks (November 3, 2026 Eastern)
The Recast supplier preparation v3 queue returned **ready_for_review** with completed real Printful mockups for both 11oz and 15oz, separately for:
- Labrador Retriever Christmas Village, source `christmas-village-labrador-retriever`
- German Shepherd Christmas Village, source `christmas-village-german-shepherd`
- French Bulldog Christmas Village, source `christmas-village-french-bulldog`

All six 11oz and 15oz **3D handle-right proof images** were compared side by side with each source image using the saved QA composites at the authorized Recast desktop (`RecastMugProofQA/review-1-2.jpg`, `review-3-1.jpg`). Exact matching dog/breed, red snowflake scarf/Santa hat and snowy Christmas village are visible on the mug. No blank product sides, wrong artwork, or clipped central pet face were seen. The manufacturer-specific mug shapes and size differences matched 11oz/15oz. Source rights, CDN revision SHA, required moderation, print file/presentation hash and Shopify Custom Recast Mug SKU mapping remain enforced server-side by `resolveShopOffer`.

## Exact provider signature authorizations
- Labrador Retriever 11oz `859163145a6650e7e9e092047ada6d25077cf90a76837ac2ee1927e170ec5f33`
- Labrador Retriever 15oz `d571679afef663d389116bc51abbaf441eefc12981f74a0cd4e78e7e439de941`
- German Shepherd 11oz `bcb075fd4fe0d8fdbe5b509b974013f3e931b8c064104676d614cc087ccdde85`
- German Shepherd 15oz `a487bde8c62f69f0a942705f256d49e2a957663c3ddab82d019eac847a7f5c8d`
- French Bulldog 11oz `a61b3871c29c252af5a485bde2e7b4b204232fd9ce6ce7f2268cadd5a5d131be`
- French Bulldog 15oz `427f93b08b399626afd2db2c599960c200867b0bc3e6b9d051ff7502e20e119f`

The immutable `REVIEWED_EXPANSION_PROOFS` allowlist is expanded by only these six exact entries. Provider-task hashes cannot be changed without failing the signature check. Publication under cron must still revalidate every source, supplier proof, frozen clean print file, exact variant mapping and price before appending an offer to the live Recast catalog.

## Limitations and rollout
35 separate breed-specific Shopify draft products remain in DRAFT. Website purchases of reviewed art use the already-approved Custom Recast Mug size variant with frozen artwork attributes and Printful order metadata. Do not separately activate a draft Shopify product until a compatible standalone fulfillment mapping and direct-checkout path exist; direct external Shopify checkout lacks Recast buyer-scope proof attributes.

No new sale, charge, Shopify order or Printful production order was created in this approval. Read-only live buyability and no-charge checkout tests after deployment are required before claiming completion.

Roll back signed entries only if supplier proof or print file is invalidated; preserve existing approved golden offers and all order records. 
