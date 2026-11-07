// Immutable product/source registry. Existing Golden Retriever IDs and storage
// keys remain unchanged; every other gift is tied to its own approved artwork.
import {EXPANSION_DESIGNS} from './shop-expansion.js';
const golden=EXPANSION_DESIGNS[0];
export const SMALL_GIFTS=Object.freeze([
 {id:'christmas-village-golden-retriever-coaster-4pack',sku:'RECAST-COASTER-SET',product:'coaster',title:'Golden Retriever Christmas Village Coaster Set',variantLabel:'4 matching coasters',catalogId:611,variantId:15662,width:1181,height:1181,mime:'image/jpeg',pilot:'shop/preparation/coasters/v1/golden-retriever-4pack.json'},
 {id:'christmas-village-golden-retriever-magnet-3pack',sku:'RECAST-MAGNET-SET',product:'magnet',title:'Golden Retriever Christmas Village Magnet Set',variantLabel:'3 matching magnets',catalogId:656,variantId:16366,width:900,height:900,mime:'image/jpeg',pilot:'shop/preparation/magnets/v1/golden-retriever-3pack.json'},
 {id:'christmas-village-golden-retriever-sticker-sheet-six',sku:'RECAST-STICKER-PACK',product:'sticker-sheet',title:'Golden Retriever Christmas Village Sticker Sheet',variantLabel:'6 stickers · 5.83 × 8.27 in',catalogId:505,variantId:12917,width:1750,height:2482,mime:'image/png',pilot:'shop/preparation/sticker-sheets/v1/golden-retriever-six.json'}
].map(Object.freeze));
export const GIFT_COLLECTION_PATHS=Object.freeze({coaster:'/shop-coaster-sets',magnet:'/shop-magnet-sets','sticker-sheet':'/shop-sticker-sheets'});
export const giftArtworkTitle=source=>source.title?source.title.replace(/\s+Mug$/,''):source.breed+' Christmas Village';
const productNames={coaster:'Coaster Set',magnet:'Magnet Set','sticker-sheet':'Sticker Sheet'};
export const GIFT_BATCH_ITEMS=Object.freeze(EXPANSION_DESIGNS.slice(1).flatMap(source=>SMALL_GIFTS.map(template=>{
 const id=source.id+template.id.slice(golden.id.length);
 return Object.freeze({...template,id,designId:source.id,title:giftArtworkTitle(source)+' '+productNames[template.product],pilot:'shop/preparation/gift-batch/v1/'+id+'.json'});
})));
export const ALL_SMALL_GIFTS=Object.freeze([...SMALL_GIFTS,...GIFT_BATCH_ITEMS]);
const byId=new Map(ALL_SMALL_GIFTS.map(item=>[item.id,item]));
const sources=new Map(EXPANSION_DESIGNS.map(source=>[source.id,source]));
if(ALL_SMALL_GIFTS.length!==105||byId.size!==105||sources.size!==35)throw Error('Review the approved gift registry before changing its scope.');
export function giftDefinition(id){return byId.get(id)||null;}
export function giftMaster(item){
 const known=byId.get(item?.id);
 if(!known||known.sku!==item.sku)throw Error('Unknown source-specific gift.');
 return sources.get(known.designId||golden.id);
}
export function giftsForArtwork(id=golden.id){
 if(!sources.has(id))return null;
 return ALL_SMALL_GIFTS.filter(item=>(item.designId||golden.id)===id);
}
export const giftBatchKey=id=>'shop/preparation/gift-batch/v1/'+id+'.json';
