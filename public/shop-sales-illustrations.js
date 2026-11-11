// Marketing images never authorize checkout or supply production artwork.
// Each entry is tied to one product family and an immutable artwork revision.
const entries = Object.freeze([
  {
    "collection": "pillows",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-pillow-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/golden-village-pillow-20261109-640.webp"
  },
  {
    "collection": "canvas",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-canvas-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/golden-village-canvas-20261109-640.webp"
  },
  {
    "collection": "coaster-sets",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-coaster-sets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/golden-village-coaster-sets-20261109-640.webp"
  },
  {
    "collection": "magnet-sets",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-magnet-sets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/golden-village-magnet-sets-20261109-640.webp"
  },
  {
    "collection": "sticker-sheets",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-sticker-sheets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/golden-village-sticker-sheets-20261109-640.webp"
  },
  {
    "collection": "coaster-sets",
    "designId": "christmas-village-labrador-retriever",
    "artworkRevision": "2fe1cef7ace1ed368b16e49b53f93c93928c377d6d8550427c3288d51bae114e",
    "url": "/shop-assets/sales/labrador-village-coaster-sets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/labrador-village-coaster-sets-20261109-640.webp"
  },
  {
    "collection": "magnet-sets",
    "designId": "christmas-village-labrador-retriever",
    "artworkRevision": "2fe1cef7ace1ed368b16e49b53f93c93928c377d6d8550427c3288d51bae114e",
    "url": "/shop-assets/sales/labrador-village-magnet-sets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/labrador-village-magnet-sets-20261109-640.webp"
  },
  {
    "collection": "sticker-sheets",
    "designId": "christmas-village-labrador-retriever",
    "artworkRevision": "2fe1cef7ace1ed368b16e49b53f93c93928c377d6d8550427c3288d51bae114e",
    "url": "/shop-assets/sales/labrador-village-sticker-sheets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/labrador-village-sticker-sheets-20261109-640.webp"
  },
  {
    "collection": "coaster-sets",
    "designId": "christmas-village-german-shepherd",
    "artworkRevision": "eeeb9c399993eae5cc8ebfada27b893171fe25c8e39dff118bd90b8b68eb3382",
    "url": "/shop-assets/sales/german-shepherd-village-coaster-sets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/german-shepherd-village-coaster-sets-20261109-640.webp"
  },
  {
    "collection": "magnet-sets",
    "designId": "christmas-village-german-shepherd",
    "artworkRevision": "eeeb9c399993eae5cc8ebfada27b893171fe25c8e39dff118bd90b8b68eb3382",
    "url": "/shop-assets/sales/german-shepherd-village-magnet-sets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/german-shepherd-village-magnet-sets-20261109-640.webp"
  },
  {
    "collection": "sticker-sheets",
    "designId": "christmas-village-german-shepherd",
    "artworkRevision": "eeeb9c399993eae5cc8ebfada27b893171fe25c8e39dff118bd90b8b68eb3382",
    "url": "/shop-assets/sales/german-shepherd-village-sticker-sheets-20261109.webp",
    "thumbnailUrl": "/shop-assets/sales/german-shepherd-village-sticker-sheets-20261109-640.webp"
  },
  // Illustrated product scenes are marketing only; never supplier proofs or print masters.
  {
    "collection": "blankets",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-blanket-sales-20261111.webp?v=1794376153",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-blanket-sales-20261111.webp?v=1794376153"
  },
  {
    "collection": "canvas",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-canvas-sales-20261111.webp?v=1794376291",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-canvas-sales-20261111.webp?v=1794376291"
  },
  {
    "collection": "tumblers",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-tumblers-sales-20261111.webp?v=1794376294",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-tumblers-sales-20261111.webp?v=1794376294"
  },
  {
    "collection": "hoodies",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-hoodies-sales-20261111.webp?v=1794376297",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-hoodies-sales-20261111.webp?v=1794376297"
  },
  {
    "collection": "t-shirts",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-t-shirts-sales-20261111.webp?v=1794376301",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-t-shirts-sales-20261111.webp?v=1794376301"
  },
  {
    "collection": "phone-cases",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-phone-cases-sales-20261111.webp?v=1794376304",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-phone-cases-sales-20261111.webp?v=1794376304"
  },
  {
    "collection": "pillows",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-pillows-sales-20261111.webp?v=1794376307",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-pillows-sales-20261111.webp?v=1794376307"
  },
  {
    "collection": "tote-bags",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-tote-bags-sales-20261111.webp?v=1794376310",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-tote-bags-sales-20261111.webp?v=1794376310"
  },
  {
    "collection": "sticker-sheets",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-sticker-sheets-sales-20261111.webp?v=1794376313",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-sticker-sheets-sales-20261111.webp?v=1794376313"
  },
  {
    "collection": "coaster-sets",
    "designId": "christmas-village-husky",
    "artworkRevision": "c5a2531cd402cfa39db4f047f9b3e4f96e454795821bb5721618a54f2ad48ea8",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-coaster-sets-sales-20261111.webp?v=1794376316",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-husky-coaster-sets-sales-20261111.webp?v=1794376316"
  },
  {
    "collection": "blankets",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-blankets-sales-20261111.webp?v=1794377098",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-blankets-sales-20261111.webp?v=1794377098"
  },
  {
    "collection": "tumblers",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-tumblers-sales-20261111.webp?v=1794377101",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-tumblers-sales-20261111.webp?v=1794377101"
  },
  {
    "collection": "hoodies",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-hoodies-sales-20261111.webp?v=1794377104",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-hoodies-sales-20261111.webp?v=1794377104"
  },
  {
    "collection": "t-shirts",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-t-shirts-sales-20261111.webp?v=1794377107",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-t-shirts-sales-20261111.webp?v=1794377107"
  },
  {
    "collection": "tote-bags",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-tote-bags-sales-20261111.webp?v=1794377111",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-tote-bags-sales-20261111.webp?v=1794377111"
  },
  {
    "collection": "phone-cases",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-phone-cases-sales-20261111.webp?v=1794377114",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-phone-cases-sales-20261111.webp?v=1794377114"
  },
  {
    "collection": "framed-prints",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-framed-prints-sales-20261111.webp?v=1794377118",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-framed-prints-sales-20261111.webp?v=1794377118"
  },
  {
    "collection": "posters",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-posters-sales-20261111.webp?v=1794377121",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-posters-sales-20261111.webp?v=1794377121"
  },
  {
    "collection": "puzzles",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-puzzles-sales-20261111.webp?v=1794377125",
    "thumbnailUrl": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-puzzles-sales-20261111.webp?v=1794377125"
  }
]);
export function salesIllustration(collection, design) {
 return entries.find(entry => entry.collection === collection &&
  entry.designId === design?.designId && entry.artworkRevision === design?.artworkRevision) || null;
}

export const SALES_ILLUSTRATIONS=entries;
