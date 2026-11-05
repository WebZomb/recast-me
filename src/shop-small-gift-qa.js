// Existing Admin Bearer authentication is mandatory for metadata and pixels.
// These GET routes remain read-only. The separate owner publication action
// reuses inspectSmallGift only AFTER authenticating and confirming exact hashes.
import {requireAdmin} from './workflow.js';
import {read,hash,privateJson} from './commerce-store.js';
import {SMALL_GIFTS,smallGiftKey,smallGiftSignature} from './shop-small-gift-release.js';
import {verifiedPremadePrint} from './premade-print.js';
import {EXPANSION_DESIGNS} from './shop-expansion.js';
const basePath='/api/shop/small-gift-review';
const master=EXPANSION_DESIGNS[0];
const headers={'cache-control':'private, no-store','x-robots-tag':'noindex, nofollow','referrer-policy':'no-referrer','x-content-type-options':'nosniff'};
// Internal only: callers must require existing owner authorization before reading.
export async function inspectSmallGift(env,item){
 const state=await read(env,smallGiftKey(item.id));
 if(!state?.offer||!['ready_for_review','published'].includes(state.status))return {item,state,ready:false};
 const offer=state.offer;
 if(offer.id!==item.id||offer.sku!==item.sku||offer.requestId!==master.requestId||offer.artworkRevision!==master.sha256||!/^[a-f0-9]{48}$/.test(offer.approvalToken||''))throw Error('identity');
 const record=await read(env,`commerce/preapprovals/${offer.approvalToken}.json`);
 if(!record||record.sku!==item.sku||record.requestId!==master.requestId||record.sourceHash!==offer.sourceHash||record.proofHash!==offer.proofHash||await hash(JSON.stringify(record))!==offer.approvalRecordHash)throw Error('record');
 if(state.reviewSignature!==await smallGiftSignature(offer))throw Error('signature');
 const locked=await verifiedPremadePrint(env,record);
 if(locked.finalHash!==offer.proof.printFileHash)throw Error('file');
 const task=await read(env,`mockups/${master.requestId}/${item.sku}/${offer.mockupId}/task.json`);
 if(task?.status!=='completed'||task.requestId!==master.requestId||task.sku!==item.sku||task.mockupId!==offer.mockupId||task.printfulVariantId!==item.variantId||task.sourceHash!==record.proofHash||String(task.taskKey)!==String(offer.proof.taskId)||JSON.stringify(task.position)!==JSON.stringify(record.position)||JSON.stringify(task.design)!==JSON.stringify(record.design))throw Error('supplier');
 return {item,state,offer,record,locked,task,ready:true};
}
export async function smallGiftOwnerReview(request,env){
 const pathname=new URL(request.url).pathname;
 if(pathname!==basePath&&!pathname.startsWith(basePath+'/'))return null;
 try{requireAdmin(request,env);}catch(e){return privateJson({ok:false,error:'Owner authorization required.'},e.status||401);}
 if(request.method!=='GET')return privateJson({ok:false,error:'This inspection is read-only.'},405);
 try{
  if(pathname===basePath){
   const items=[];
   for(const item of SMALL_GIFTS){
    const row=await inspectSmallGift(env,item);
    if(!row.ready){items.push({id:item.id,sku:item.sku,status:row.state?.status||'not_started',code:row.state?.code||null});continue;}
    const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
    const supplierPictures=[];
    for(const image of (row.task.images||[]).slice(0,4)){
     try{const u=new URL(image.url);if(u.origin!==origin||!u.pathname.startsWith(`/api/mockup/image/${master.requestId}/${item.sku}/`)||!u.searchParams.get('token'))continue;supplierPictures.push({title:String(image.title||'Printful product view').slice(0,100),url:u.href});}catch{}
    }
    items.push({id:item.id,sku:item.sku,title:item.title,status:row.state.status,priceCents:row.offer.priceCents,reviewSignature:row.state.reviewSignature,printFileHash:row.locked.finalHash,mime:row.locked.finalMime,printSize:row.state.printSize,sourceRevision:master.sha256,design:row.record.design,placement:row.record.position,supplierPictures,cleanPrintUrl:basePath+'/'+item.id+'/print',checkoutEnabled:row.state.status==='published'});
   }
   const response=privateJson({ok:true,readOnly:true,originalArtwork:master.asset,items});for(const [k,v] of Object.entries(headers))response.headers.set(k,v);return response;
  }
  const match=pathname.match(/^\/api\/shop\/small-gift-review\/([a-z0-9-]+)\/print$/);
  const item=match&&SMALL_GIFTS.find(x=>x.id===match[1]);
  if(!item)return privateJson({ok:false,error:'Unknown product review.'},404);
  const row=await inspectSmallGift(env,item);
  if(!row.ready)return privateJson({ok:false,error:'The clean print file is not ready.'},409);
  const bytes=await env.ARTWORK.get(row.locked.finalKey);
  if(!bytes)return privateJson({ok:false,error:'The clean print file is unavailable.'},409);
  return new Response(bytes.body,{headers:{...headers,'content-type':row.locked.finalMime}});
 }catch{return privateJson({ok:false,error:'Stored proof or print-file integrity needs review. Nothing was changed.'},409);}
}
