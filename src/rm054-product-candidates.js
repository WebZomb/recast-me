// RM054 approved roadmap candidates.
// Research-only mappings: nothing in this file is reachable by checkout or fulfillment.
// A candidate moves into FULFILLMENT only after Printful catalog identity, placement,
// mockup generation, print geometry, Shopify variant and proof behavior are verified.
export const RM054_PRODUCT_CANDIDATES = Object.freeze({
  sticker: {
    wave:"main", title:"Custom Recast Sticker Pack", supplier:"Printful Kiss-Cut Sticker Sheet",
    variants:[{label:"5.83×8.27 sticker sheet", printfulProductId:505, printfulVariantId:null, shopifySku:"RECAST-STICKER-PACK"}],
    draftRetail:14.99, supplierPriceObserved:5.15, state:"draft-needs-exact-variant",
    testPurpose:"Final low-cost end-to-end purchase and automatic fulfillment test"
  },
  phoneCase: {
    wave:"main", title:"Custom Recast Phone Case", supplier:"Printful Clear Case for iPhone®",
    variants:[
      {label:"iPhone 15",printfulVariantId:17616},
      {label:"iPhone 15 Pro",printfulVariantId:17618},
      {label:"iPhone 15 Pro Max",printfulVariantId:17619},
      {label:"iPhone 16",printfulVariantId:20290},
      {label:"iPhone 16 Pro",printfulVariantId:20292}
    ],
    draftRetail:29.99, supplierPriceObserved:9.57, state:"draft-unmapped"
  },
  pillow: {
    wave:"main", title:"Custom Recast Pillow", supplier:"Printful All-Over Print Basic Pillow",
    variants:[{label:"18×18",printfulVariantId:4532,shopifySku:"RECAST-PILLOW-18X18"}],
    draftRetail:39.99, supplierPriceObserved:13.57, state:"draft-unmapped"
  },
  notebook: {
    wave:"main", title:"Custom Recast Notebook", supplier:"Printful Spiral Notebook",
    variants:[{label:"5.5×8.5",printfulVariantId:12141,shopifySku:"RECAST-NOTEBOOK"}],
    draftRetail:24.99, supplierPriceObserved:12.43, state:"draft-unmapped"
  },
  petBandana: {
    wave:"more-gifts", title:"Custom Recast Pet Bandana", supplier:"Printful Pet Bandana Collar",
    variants:[
      {label:"S",printfulVariantId:23142},{label:"M",printfulVariantId:23141},
      {label:"L",printfulVariantId:23140},{label:"XL",printfulVariantId:23143}
    ],
    draftRetail:34.99, supplierPriceObserved:17.93, state:"draft-unmapped"
  },
  puzzle: {
    wave:"more-gifts", title:"Custom Recast Puzzle", supplier:"Printful Jigsaw Puzzle",
    variants:[{label:"252 pieces",printfulVariantId:13431},{label:"520 pieces",printfulVariantId:13432}],
    draftRetail:34.99, supplierPriceObserved:15.25, state:"draft-unmapped",
    regionNote:"Printful currently states this product is available in the US only."
  },
  tote: {
    wave:"more-gifts", title:"Custom Recast Tote Bag", supplier:"Printful All-Over Print Tote Bag",
    variants:[{label:"15×15 · black handles",printfulVariantId:4533,shopifySku:"RECAST-TOTE"}],
    draftRetail:39.99, supplierPriceObserved:17.60, state:"draft-unmapped"
  }
});
