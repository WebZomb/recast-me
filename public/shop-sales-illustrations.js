// Marketing images never authorize checkout or supply production artwork.
// Each entry is tied to one product family and an immutable artwork revision.
const entries = Object.freeze([
  {
    "collection": "pillows",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-pillow-20261109.webp"
  },
  {
    "collection": "canvas",
    "designId": "christmas-village-golden-retriever",
    "artworkRevision": "6e0a3f4c45a33cb4cc002344c95139d4712d1c6dc98566340dd41172e09e015f",
    "url": "/shop-assets/sales/golden-village-canvas-20261109.webp"
  }
]);
export function salesIllustration(collection, design) {
 return entries.find(entry => entry.collection === collection &&
  entry.designId === design?.designId && entry.artworkRevision === design?.artworkRevision) || null;
}
