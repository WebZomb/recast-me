// Recast's existing physical Printful product families.
// These are browsing destinations, NOT supplier-approved premade offers.
// Only the signed /api/shop/catalog response can make a design purchasable.
export const SHOP_COLLECTIONS=Object.freeze([
 {slug:'mugs',label:'Mugs',offerType:'mug',url:'/shop',sizes:['11 oz','15 oz'],tagline:'A little Christmas magic with every sip.',description:'Finished Christmas pet mugs with real supplier previews for approved designs.'},
 {slug:'blankets',label:'Blankets',offerType:'blanket',sizes:['50 × 60 in','60 × 80 in'],tagline:'Wrap their favorite face in Christmas magic.',description:'Explore the same Christmas pet illustrations for cozy Recast blankets. Exact blanket print placement and supplier previews are being prepared.'},
 {slug:'pillows',label:'Pillows',offerType:'pillow',sizes:['14 in','16 in','18 in','22 in'],tagline:'A cozy spot for a favorite face.',description:'Holiday pet art for illustrated throw pillows. Each design needs a product-specific Printful proof before sale.'},
 {slug:'canvas',label:'Canvas',offerType:'canvas',sizes:['12 × 16 in','18 × 24 in','24 × 36 in'],tagline:'Christmas art worth hanging onto.',description:'Original pet scenes for canvas wall art. Canvas-specific crop and wrap previews must be approved before buying.'},
 {slug:'tumblers',label:'Tumblers',offerType:'tumbler',sizes:['20 oz'],tagline:'Festive designs for every refill.',description:'Explore Christmas pet illustrations for tumblers. Exact cylindrical print previews are pending.'},
 {slug:'hoodies',label:'Hoodies',offerType:'hoodie',sizes:['S','M','L','XL','2XL'],tagline:'Wear their Christmas spirit.',description:'Holiday pet artwork for hoodies. Garment-specific front placement and print quality checks are in preparation.'},
 {slug:'t-shirts',label:'T-Shirts',offerType:'tee',sizes:['S','M','L','XL','2XL'],tagline:'Pet portraits with holiday personality.',description:'Browse original Christmas dog and cat illustrations planned for T-shirts. Real supplier product photos are pending.'},
 {slug:'tote-bags',label:'Tote Bags',offerType:'tote',sizes:['Black'],tagline:'Carry a little Christmas cheer.',description:'Pet portrait artwork prepared as a design collection for tote bags. No unverified printed product is offered for sale.'},
 {slug:'phone-cases',label:'Phone Cases',offerType:'phone-case',sizes:['Selected iPhone 14–16 models'],tagline:'Their favorite face, wherever you go.',description:'Holiday pet designs for phone cases. Individual device fit, camera area and Printful wrap proofs are required.'},
 {slug:'sticker-sheets',label:'Sticker Sheets',offerType:'sticker-sheet',sizes:['Sheet'],tagline:'Tiny gifts with a lot of personality.',description:'Christmas dog and cat artwork concepts for sticker sheets. The finished sheet layout requires supplier proof.'},
 {slug:'stickers',label:'Stickers',offerType:'sticker',sizes:['3 × 3 in'],tagline:'A small splash of Christmas.',description:'Pet illustrations planned for individual stickers, pending a real cutline and supplier proof.'},
 {slug:'posters',label:'Posters',offerType:'poster',sizes:['12 × 16 in','18 × 24 in','24 × 36 in'],tagline:'Make Christmas part of the room.',description:'Original Christmas pet portraits planned for posters with print-quality checks before sale.'},
 {slug:'framed-prints',label:'Framed Prints',offerType:'frame',sizes:['8 × 10 in','12 × 16 in','18 × 24 in'],tagline:'A festive moment to frame.',description:'Holiday pet artwork planned for framed prints. Exact frame and art-crop proofs are pending.'},
 {slug:'journals',label:'Journals',offerType:'journal',sizes:['Hardcover'],tagline:'A Christmas story on every cover.',description:'Browse pet art planned for hardcover journals. Correct front and back wrapping must be checked before sale.'},
 {slug:'coaster-sets',label:'Coaster Sets',offerType:'coaster',sizes:['4-pack'],tagline:'A cozy detail for every table.',description:'Matching pet illustrations planned for four-piece coaster sets. Supplier print previews are pending.'},
 {slug:'magnet-sets',label:'Magnet Sets',offerType:'magnet',sizes:['3-pack'],tagline:'Little reminders of a favorite pet.',description:'Christmas illustrations planned for magnet sets. Individual layouts and supplier previews are pending.'},
 {slug:'puzzles',label:'Puzzles',offerType:'puzzle',sizes:['252 pieces','520 pieces'],tagline:'A Christmas scene worth putting together.',description:'Holiday dog and cat art planned for puzzles. Exact board, cut and box artwork must be supplier-verified.'}
].map(c=>Object.freeze({...c,url:c.url||'/shop-'+c.slug+'.html',sizes:Object.freeze(c.sizes)})));
export function collectionBySlug(slug){return SHOP_COLLECTIONS.find(c=>c.slug===slug)||null;}
export function collectionDesigns(designs){
 if(!Array.isArray(designs))return [];
 return designs.filter(d=>d&&d.product==='mug'&&d.occasion==='christmas'&&d.status==='preview'&&
  ['dog','cat'].includes(d.pet)&&typeof d.designId==='string'&&typeof d.breed==='string'&&
  typeof d.title==='string'&&/^[a-f0-9]{64}$/.test(d.artworkRevision||'')&&
  typeof d.artworkImage==='string'&&d.artworkImage.startsWith('https://cdn.shopify.com/'));
}
export function categoryOffers(offers,collection,designs){
 if(!Array.isArray(offers)||!collection||!Array.isArray(designs))return [];
 const revisions=new Set(designs.map(d=>d.designId+'|'+d.artworkRevision));
 return offers.filter(o=>o?.product===collection.offerType&&o?.status==='verified'&&
  o?.proof?.approved===true&&o?.proof?.provider==='printful'&&
  o?.proof?.artworkRevision===o.artworkRevision&&
  revisions.has(o.designId+'|'+o.artworkRevision));
}
