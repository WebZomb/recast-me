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
  }
]);
export function salesIllustration(collection, design) {
 return entries.find(entry => entry.collection === collection &&
  entry.designId === design?.designId && entry.artworkRevision === design?.artworkRevision) || null;
}

export const SALES_ILLUSTRATIONS=entries;
