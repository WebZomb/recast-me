import {verifiedPremadePrint} from './premade-print.js';
import {read,hash,fault} from './commerce-store.js';
import {FULFILLMENT,flattenShopifyProducts} from './entry.js';
import {shopifyCatalog} from './index.js';
import {checkStoredArtwork} from './content-safety.js';
import {validateOffer,publicOffer} from './shop-offers.js';
export const SHOP_CATALOG_KEY='shop/catalog/v1.json';
export async function hashBytes(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const reject=()=>{throw fault('shop_offer_unavailable','This finished gift is not available. Please choose another design.',409);};
export async function readShopCatalog(env){
 const catalog=await read(env,SHOP_CATALOG_KEY);
 if(!catalog)return {version:1,revision:0,offers:[]};
 if(catalog.version!==1||!Array.isArray(catalog.offers)||catalog.offers.length>500)throw fault('shop_catalog_unavailable','The gift collection could not load. Please try again.',503);
 const ids=new Set();for(const offer of catalog.offers){if(ids.has(offer?.id))throw fault('shop_catalog_unavailable','The gift collection needs review.',503);ids.add(offer?.id);}
 return catalog;
}
export async function resolveShopOffer(env,offerId,revision,{catalog,products,integrity=true}={}){
 if(typeof offerId!=='string'||!/^[a-z0-9-]{1,100}$/.test(offerId)||typeof revision!=='string')reject();
 catalog=catalog||await readShopCatalog(env);
 const offer=validateOffer(catalog.offers.find(o=>o.id===offerId),FULFILLMENT);
 if(offer.artworkRevision!==revision||!/^RC-[A-Z0-9-]{8,60}$/.test(offer.requestId||'')||!/^[a-f0-9]{48}$/.test(offer.approvalToken||''))reject();
 const record=await read(env,`commerce/preapprovals/${offer.approvalToken}.json`);
 const meta=await read(env,`requests/${offer.requestId}/request.json`);
 // Only owner-imported catalog art may become public stock. Customer art never qualifies.
 if(!meta||meta.source!=='premade-catalog'||meta.catalogDesignId!==offer.designId||!meta.catalogRightsConfirmedAt)reject();
 if(!record||record.token!==offer.approvalToken||record.requestId!==offer.requestId||record.sku!==offer.sku||record.approvalMode!=='product-mockup'||record.sourceHash!==offer.sourceHash||record.proofHash!==offer.proofHash||record.mockupId!==offer.mockupId||record.previewToken!==record.token||!record.approvedAt||!record.position||!record.design)reject();
 if(offer.approvalRecordHash!==await hash(JSON.stringify(record)))reject();
 const task=await read(env,`mockups/${record.requestId}/${record.sku}/${record.mockupId}/task.json`);
 if(!task||task.status!=='completed'||task.sourceHash!==record.proofHash||task.printfulVariantId!==FULFILLMENT[offer.sku].printfulVariantId||JSON.stringify(task.design)!==JSON.stringify(record.design)||JSON.stringify(task.position)!==JSON.stringify(record.position)||String(task.taskKey)!==String(offer.proof.taskId))reject();
 const proof=await read(env,`shop/proofs/${offer.id}.json`);
 if(!proof||proof.approved!==true||proof.artworkRevision!==offer.artworkRevision||proof.printFileHash!==offer.proof.printFileHash||proof.placementHash!==offer.proof.placementHash||proof.mockupUrl!==offer.mockupUrl)reject();
 const locked=await verifiedPremadePrint(env,record,{checkBytes:integrity});
 if(locked.finalHash!==offer.proof.printFileHash||record.premadePrint.artworkRevision!==offer.artworkRevision)reject();
 if(integrity){
  const master=await env.ARTWORK.get(offer.artworkKey),snapshot=await env.ARTWORK.get(record.snapshotKey);
  if(!master||!snapshot||await hashBytes(await master.arrayBuffer())!==offer.artworkRevision||await hash(await snapshot.text())!==record.sourceHash)reject();
  await checkStoredArtwork(env,meta);
 }
 const rows=flattenShopifyProducts(products||await shopifyCatalog(env));
 const row=rows.find(r=>r.variantId===offer.variantId&&r.sku===offer.sku&&r.status==='ACTIVE'&&!r.digital);
 if(!row||!Number.isFinite(Number(row.price))||Number(row.price)<=0)reject();
 return {offer,record,row,priceCents:Math.round(Number(row.price)*100)};
}
export function shopOfferProperties(offer,record){
 return {'Artwork ID':record.requestId,'Recast Design':'Ready-made design — purchased as shown','Recast Next Step':'Payment completes your order — no further design approval needed','Approved Preview':new URL('/proof/'+record.previewToken,offer.mockupUrl).href,
  '_Recast Design':JSON.stringify(record.design),'_Recast Proof':record.proofHash,'_Recast Mockup':record.mockupId,'_Recast Preview Token':record.previewToken,'_Recast Preapproval':record.token,'_Recast Offer':offer.id,'_Recast Revision':offer.artworkRevision};
}
export async function publicShopCatalog(env){
 const catalog=await readShopCatalog(env);if(!catalog.offers.length)return {version:1,offers:[]};
 const products=await shopifyCatalog(env),offers=[];
 for(const offer of catalog.offers){
  try{const checked=await resolveShopOffer(env,offer.id,offer.artworkRevision,{catalog,products,integrity:false});offers.push({...publicOffer(offer),priceCents:checked.priceCents});}catch{/* Unapproved, retired or unavailable merchandise is never advertised. */}
 }
 return {version:1,offers};
}
