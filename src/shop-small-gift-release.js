// Converts COMPLETED supplier previews to immutable production files and cart offers.
// No supplier task, order, charge or generative artwork is created here.
// Publication requires a separately visually reviewed four-hash signature.
import {read,hash,change,fault,composeProductLayout,stickerSheetBoxes} from './commerce-store.js';
import {FULFILLMENT,prepareCheckout} from './entry.js';
import {EXPANSION_DESIGNS} from './shop-expansion.js';
import {hashBytes,SHOP_CATALOG_KEY,resolveShopOffer} from './shop-catalog-store.js';
const master=EXPANSION_DESIGNS[0];
const root='shop/preparation/small-gifts/v1/';
export const SMALL_GIFTS=Object.freeze([
 {id:'christmas-village-golden-retriever-coaster-4pack',sku:'RECAST-COASTER-SET',product:'coaster',title:'Golden Retriever Christmas Village Coaster Set',variantLabel:'4 matching coasters',catalogId:611,variantId:15662,width:1181,height:1181,mime:'image/jpeg',pilot:'shop/preparation/coasters/v1/golden-retriever-4pack.json'},
 {id:'christmas-village-golden-retriever-magnet-3pack',sku:'RECAST-MAGNET-SET',product:'magnet',title:'Golden Retriever Christmas Village Magnet Set',variantLabel:'3 matching magnets',catalogId:656,variantId:16366,width:900,height:900,mime:'image/jpeg',pilot:'shop/preparation/magnets/v1/golden-retriever-3pack.json'},
 {id:'christmas-village-golden-retriever-sticker-sheet-six',sku:'RECAST-STICKER-PACK',product:'sticker-sheet',title:'Golden Retriever Christmas Village Sticker Sheet',variantLabel:'6 stickers · 5.83 × 8.27 in',catalogId:505,variantId:12917,width:1750,height:2482,mime:'image/png',pilot:'shop/preparation/sticker-sheets/v1/golden-retriever-six.json'}
].map(Object.freeze));
// Empty until authentic supplier pictures AND clean native print files are inspected.
// A readiness flag, admin button or browser payload can never add a signature here.
export const REVIEWED_SMALL_GIFT_SIGNATURES=Object.freeze({});
const origin=env=>String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
const now=()=>new Date().toISOString();
const fail=code=>{throw fault(code,'This finished gift requires print-file review before publication.',409)};
export const smallGiftKey=id=>root+id+'.json';
export async function smallGiftSignature(offer){
 return hash(JSON.stringify([offer.approvalRecordHash,offer.proofHash,offer.proof.printFileHash,offer.proof.placementHash]));
}
export function verifySmallGiftArea(item,report,source){
 const row=report?.variants?.find(v=>v.sku===item.sku),area=row?.area;
 if(report?.status!=='complete'||Number(report.productId)!==item.catalogId||!area||area.width!==item.width||area.height!==item.height||area.dpi!==300)fail('gift_template_changed');
 if(source?.width!==1254||source?.height!==1254)fail('gift_source_dimensions');
 if(item.mime==='image/png'){
  const boxes=stickerSheetBoxes(source,item.width,item.height);
  if(boxes.length!==6||boxes.some(b=>b.width>source.width||b.height>source.height))fail('gift_tile_enlargement');
 }else if(item.width>source.width||item.height>source.height)fail('gift_source_resolution');
 return {width:item.width,height:item.height};
}
export async function freezeSmallGift(env,item,pilot,{prepare=prepareCheckout,compose=composeProductLayout}={}){
 const map=FULFILLMENT[item.sku];
 if(map?.printfulProductId!==item.catalogId||map?.printfulVariantId!==item.variantId)fail('gift_mapping_changed');
 const meta=await read(env,`requests/${master.requestId}/request.json`);
 if(!meta||meta.source!=='premade-catalog'||meta.requestId!==master.requestId||meta.catalogDesignId!==master.id||meta.catalogMasterHash!==master.sha256||!meta.catalogRightsConfirmedAt||!meta.accessToken)fail('gift_source_identity');
 if(pilot?.status!=='ready_for_review'||!pilot.mockupId||!pilot.design)fail('gift_supplier_incomplete');
 const report=await read(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`);
 verifySmallGiftArea(item,report,meta);
 const request=new Request(origin(env)+'/api/checkout-link',{method:'POST',headers:{'content-type':'application/json','x-recast-request':'1',origin:origin(env)},body:JSON.stringify({requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,mockupId:pilot.mockupId,design:pilot.design,confirmDesign:true})});
 const prepared=await prepare(request,env,{});
 if(prepared instanceof Response)fail('gift_freeze_rejected');
 const record=prepared.checkoutApproval;
 const task=await read(env,`mockups/${meta.requestId}/${item.sku}/${pilot.mockupId}/task.json`);
 if(!record||record.requestId!==meta.requestId||record.sku!==item.sku||record.mockupId!==pilot.mockupId||record.approvalMode!=='product-mockup'||!task?.taskKey||task.status!=='completed'||task.printfulVariantId!==item.variantId||task.sourceHash!==record.proofHash||JSON.stringify(task.position)!==JSON.stringify(record.position)||JSON.stringify(task.design)!==JSON.stringify(record.design))fail('gift_supplier_proof_changed');
 if(record.position.area_width!==item.width||record.position.area_height!==item.height)fail('gift_placement_area_changed');
 const snapshot=await env.ARTWORK.get(record.snapshotKey);
 if(!snapshot)fail('gift_snapshot_missing');
 const encoded=await snapshot.text();
 if(await hash(encoded)!==record.sourceHash)fail('gift_source_changed');
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 const info=await env.IMAGES.info(new Blob([bytes],{type:meta.previewMime}).stream());
 const area=verifySmallGiftArea(item,report,info);
 // Native Printful dimensions, not a needless 4096px enlargement of small artwork.
 const composed=await compose(env,bytes,info,area,map,record.design,item.width);
 const mime=composed.mime||'image/jpeg',out=composed.bytes;
 if(mime!==item.mime||!out||out.length<100||composed.outputSize?.width!==item.width||composed.outputSize?.height!==item.height)fail('gift_printfile_invalid');
 if(item.mime==='image/png'){
  if(record.design.product!=='Sticker Sheet'||record.design.version!==8||record.design.layout!=='six-pictures'||composed.artworkBoxes?.length!==6||out[0]!==137||out[1]!==80||out[2]!==78||out[3]!==71)fail('gift_sticker_transparency');
 }else if(out[0]!==255||out[1]!==216)fail('gift_printfile_invalid');
 const printHash=await hashBytes(out),ext=mime==='image/png'?'png':'jpg';
 const finalKey=`shop/printfiles/${item.id}/${printHash}.${ext}`;
 const placementHash=await hash(JSON.stringify(record.position));
 await env.ARTWORK.put(finalKey,out,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:mime}});
 const premadePrint={key:finalKey,sha256:printHash,mime,sku:item.sku,sourceHash:record.sourceHash,proofHash:record.proofHash,placementHash,artworkRevision:master.sha256};
 const full=await change(env,`commerce/preapprovals/${record.token}.json`,null,old=>{
  if(!old||old.sourceHash!==record.sourceHash||old.proofHash!==record.proofHash||old.sku!==item.sku)fail('gift_approval_changed');
  if(old.premadePrint&&JSON.stringify(old.premadePrint)!==JSON.stringify(premadePrint))fail('gift_print_changed');
  return {...old,premadePrint};
 });
 const proof={provider:'printful',approved:true,artworkRevision:master.sha256,printfulVariantId:item.variantId,printFileHash:printHash,placementHash,taskId:String(task.taskKey),checkedAt:now()};
 const offer={id:item.id,designId:master.id,title:item.title,variantLabel:item.variantLabel,sku:item.sku,occasion:master.occasion,pet:master.pet,breed:master.breed,product:item.product,variantId:prepared.row.variantId,priceCents:Math.round(Number(prepared.row.price)*100),currency:'USD',status:'verified',artworkRevision:master.sha256,artworkKey:meta.catalogMasterKey||`shop/masters/${master.id}/${master.sha256}.png`,requestId:meta.requestId,sourceHash:record.sourceHash,proofHash:record.proofHash,mockupId:record.mockupId,approvalToken:record.token,approvalRecordHash:await hash(JSON.stringify(full)),mockupUrl:prepared.approvedPreview.imageUrl,proof};
 // This private draft is not in SHOP_CATALOG_KEY and cannot be bought.
 return {id:item.id,status:'ready_for_review',offer,views:prepared.approvedPreview.images,preparedAt:now(),printSize:{width:item.width,height:item.height},reviewSignature:await smallGiftSignature(offer)};
}
export async function publishSmallGift(env,item,state,{reviewed=REVIEWED_SMALL_GIFT_SIGNATURES,resolve=resolveShopOffer}={}){
 const expected=reviewed[item.id];
 if(!expected||!state?.offer)return false;
 if(await smallGiftSignature(state.offer)!==expected)fail('gift_review_signature_changed');
 const proofKey=`shop/proofs/${item.id}.json`;
 const previous=await read(env,proofKey),proof={...state.offer.proof,mockupUrl:state.offer.mockupUrl};
 if(previous&&JSON.stringify(previous)!==JSON.stringify(proof))fail('gift_proof_conflict');
 await env.ARTWORK.put(proofKey,JSON.stringify(proof));
 await resolve(env,item.id,state.offer.artworkRevision,{catalog:{version:1,offers:[state.offer]}});
 await change(env,SHOP_CATALOG_KEY,{version:1,revision:0,offers:[]},catalog=>{
  const old=catalog.offers.find(o=>o.id===item.id);
  if(old&&JSON.stringify(old)!==JSON.stringify(state.offer))fail('gift_catalog_conflict');
  return old?catalog:{...catalog,revision:catalog.revision+1,offers:[...catalog.offers,state.offer]};
 });
 await env.ARTWORK.put(smallGiftKey(item.id),JSON.stringify({...state,status:'published',publishedAt:now()}));
 return true;
}
export async function runSmallGiftRelease(env,{freeze=freezeSmallGift,publish=publishSmallGift}={}){
 if(env.PREMADE_SMALL_GIFT_RELEASE_ENABLED!=='true'||!env.ARTWORK||!env.IMAGES)return {enabled:false};
 let prepared=0,published=0;
 for(const item of SMALL_GIFTS){
  const key=smallGiftKey(item.id),state=await read(env,key);
  if(state?.status==='published'||state?.status==='needs_review'||state?.status==='preparing')continue;
  try{
   if(state?.status==='ready_for_review'){if(await publish(env,item,state))published++;continue;}
   const pilot=await read(env,item.pilot);
   if(pilot?.status!=='ready_for_review'||prepared>=1)continue;
   if(!await env.ARTWORK.put(key,JSON.stringify({id:item.id,status:'preparing',startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))continue;
   prepared++;
   await env.ARTWORK.put(key,JSON.stringify(await freeze(env,item,pilot)));
  }catch(e){await env.ARTWORK.put(key,JSON.stringify({id:item.id,status:'needs_review',code:/^[a-z0-9_]{3,70}$/.test(String(e?.code))?e.code:'gift_preparation_failed',checkedAt:now()}));}
 }
 return {enabled:true,prepared,published};
}
export async function smallGiftReleaseStatus(env){
 const items=[];
 for(const item of SMALL_GIFTS){const s=await read(env,smallGiftKey(item.id));items.push({id:item.id,product:item.product,status:s?.status||'not_started',checkoutEnabled:s?.status==='published',code:s?.code||null});}
 return {enabled:env.PREMADE_SMALL_GIFT_RELEASE_ENABLED==='true',items};
}
