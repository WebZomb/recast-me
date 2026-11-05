// Explicit owner action only. Never called by a page load, cron or public cart.
// Uses the existing Admin Bearer; does not expand storage permissions or expose
// private files. It publishes an existing verified offer, never a paid order.
import {requireAdmin} from './workflow.js';
import {sameOrigin,change,privateJson,fault} from './commerce-store.js';
import {SMALL_GIFTS,smallGiftSignature,publishSmallGift} from './shop-small-gift-release.js';
import {inspectSmallGift} from './shop-small-gift-qa.js';
import {resolveShopOffer} from './shop-catalog-store.js';
export const SMALL_GIFT_PUBLISH_PATH='/api/admin/small-gifts/publish';
export const PUBLISH_CONFIRMATION='PUBLISH_THIS_REVIEWED_PRINT_FILE';
const digest=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const paths=Object.freeze({coaster:'/shop-coaster-sets',magnet:'/shop-magnet-sets','sticker-sheet':'/shop-sticker-sheets'});
const reply=(body,status=200)=>privateJson(body,status,{'x-robots-tag':'noindex, nofollow','x-content-type-options':'nosniff'});
async function inputJson(request){
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw fault('publish_json','A JSON confirmation is required.',415);
 if(Number(request.headers.get('content-length')||0)>2048)throw fault('publish_size','Confirmation is too large.',413);
 const reader=request.body?.getReader();
 if(!reader)throw fault('publish_input','Confirmation is missing.',400);
 let total=0;const chunks=[];
 try{
  while(true){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;
   if(total>2048){await reader.cancel();throw fault('publish_size','Confirmation is too large.',413);}chunks.push(value);
  }
 }finally{reader.releaseLock();}
 const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
 let input;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{throw fault('publish_input','Invalid confirmation.',400);}
 const names=['id','reviewSignature','printFileHash','sourceRevision','confirm'];
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==names.length||Object.keys(input).some(k=>!names.includes(k))||typeof input.id!=='string'||input.confirm!==PUBLISH_CONFIRMATION||!digest(input.reviewSignature)||!digest(input.printFileHash)||!digest(input.sourceRevision))throw fault('publish_confirmation','Confirm the exact supplier proof and clean print file before publishing.',400);
 return input;
}
function hasSupplierView(row,env){
 const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
 const prefix=`/api/mockup/image/${row.offer.requestId}/${row.item.sku}/`;
 return (row.task.images||[]).some(view=>{try{const u=new URL(view.url);return u.origin===origin&&u.pathname.startsWith(prefix)&&Boolean(u.searchParams.get('token'));}catch{return false;}});
}
export async function smallGiftOwnerPublish(request,env,{inspect=inspectSmallGift,publish=publishSmallGift,resolve=resolveShopOffer}={}){
 if(new URL(request.url).pathname!==SMALL_GIFT_PUBLISH_PATH)return null;
 // Authentication MUST precede any private metadata lookup or body consumption.
 try{requireAdmin(request,env);}catch(e){return reply({ok:false,error:'Existing owner authorization is required.'},e.status||401);}
 if(request.method!=='POST')return reply({ok:false,error:'Publishing requires an explicit POST confirmation.'},405);
 let input,item,row;
 try{
  sameOrigin(request);
  if(request.headers.get('origin')!==new URL(request.url).origin)throw fault('origin_required','Publish from the existing owner review page.',403);
  input=await inputJson(request);
  item=SMALL_GIFTS.find(gift=>gift.id===input.id);
  if(!item)return reply({ok:false,error:'Unknown prepared product.'},404);
  row=await inspect(env,item);
  if(!row?.ready||!row.offer||!hasSupplierView(row,env))throw fault('publish_unready','The actual supplier proof and native print file are not ready.',409);
  if(input.reviewSignature!==row.state.reviewSignature||input.reviewSignature!==await smallGiftSignature(row.offer)||input.printFileHash!==row.locked.finalHash||input.sourceRevision!==row.offer.artworkRevision)throw fault('publish_stale','The proof or print file changed. Reload and inspect the current files before publishing.',409);
 }catch(error){return reply({ok:false,error:error.renderControl?error.message:'Stored proof or print-file integrity needs review. No publication was attempted.'},error.renderControl?error.status:409);}
 const result=alreadyPublished=>({ok:true,id:item.id,published:true,alreadyPublished,storePath:paths[item.product],paymentCreated:false,productionSubmitted:false});
 // Retries of an already published exact offer never append duplicate products.
 if(row.state.status==='published'){
  try{await resolve(env,item.id,input.sourceRevision);return reply(result(true));}
  catch{return reply({ok:false,error:'The published offer is not currently purchasable. Check the current product connection.'},409);}
 }
 const auditKey=`shop/owner-publications/v1/${item.id}/${input.reviewSignature}.json`;
 try{
  await change(env,auditKey,null,old=>{
   if(old){if(old.id!==item.id||old.reviewSignature!==input.reviewSignature||old.printFileHash!==input.printFileHash||old.sourceRevision!==input.sourceRevision)throw fault('publication_conflict','The publication record requires review.',409);return old;}
   return {version:1,id:item.id,sku:item.sku,reviewSignature:input.reviewSignature,printFileHash:input.printFileHash,sourceRevision:input.sourceRevision,actor:'authenticated-owner',confirmation:PUBLISH_CONFIRMATION,requestedAt:new Date().toISOString(),status:'authorized'};
  });
  // This exact one-item authorization is created only by this authenticated POST.
  // The unattended REVIEWED_SMALL_GIFT_SIGNATURES list remains unchanged/empty.
  const published=await publish(env,item,row.state,{reviewed:{[item.id]:input.reviewSignature},resolve});
  if(!published)throw fault('publication_unconfirmed','Publication was not confirmed.',409);
  // Revalidate the committed catalog, clean-file bytes and ACTIVE Shopify row.
  // This creates no checkout, customer order or supplier production request.
  await resolve(env,item.id,input.sourceRevision);
  await change(env,auditKey,null,old=>{
   if(!old||old.reviewSignature!==input.reviewSignature)throw fault('publication_audit','The publication audit needs review.',409);
   return old.status==='published'?old:{...old,status:'published',publishedAt:new Date().toISOString()};
  });
  return reply(result(false));
 }catch{
  // Catalog CAS may already have succeeded: never falsely promise "nothing changed".
  return reply({ok:false,error:'Publication could not be confirmed. Refresh the review and storefront status before retrying. No payment or production was submitted.'},409);
 }
}
