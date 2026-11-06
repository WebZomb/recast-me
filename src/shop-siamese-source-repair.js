// Owner-only repair of the recorded Siamese Images 9502 pre-provider failure.
// No automatic retry. Original claims remain intact. Each SKU can submit its
// first supplier PREVIEW at most once; this never approves sales or production.
import {read,hash,randomToken,recommendedCheckoutDesign,privateJson,sameOrigin,fault} from './commerce-store.js';
import {EXPANSION_DESIGNS,EXPANSION_ITEMS,approvedMugSourceMime,claimMugPreviewRateSlot} from './shop-expansion.js';
import {FULFILLMENT} from './entry.js';
import {hashBytes} from './shop-catalog-store.js';
import {moderateContent} from './content-safety.js';
import {requireAdmin,createMockup} from './workflow.js';
const source=EXPANSION_DESIGNS.find(s=>s.id==='christmas-village-siamese-cat');
const items=EXPANSION_ITEMS.filter(i=>i.designId===source.id);
const root='shop/recovery/owner-siamese-20261106/';
const unique=new Headers({'If-None-Match':'*'});
const now=()=>new Date().toISOString();
const write=(env,path,value,onlyIf)=>env.ARTWORK.put(path,JSON.stringify(value),{...(onlyIf?{onlyIf}:{}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
const mugKey=id=>'shop/preparation/v3/'+id+'.json';
function matchingMeta(meta){return meta?.requestId===source.requestId&&meta.source==='premade-catalog'&&meta.catalogDesignId===source.id&&meta.catalogMasterHash===source.sha256&&meta.catalogRightsConfirmedAt&&meta.contentSafety&&meta.accessToken&&meta.width===source.width&&meta.height===source.height;}
export function knownSiameseImportFailure(states){
 const first=states?.find(s=>s?.id==='village-siamese-cat-mug-11oz'),second=states?.find(s=>s?.id==='village-siamese-cat-mug-15oz');
 return Boolean(first?.status==='needs_review'&&String(first.code)==='9502'&&!first.startedAt&&!first.mockupId&&!first.offer&&second?.status==='needs_review'&&second.code==='seed_source_pending'&&!second.startedAt&&!second.mockupId&&!second.offer);
}
async function repairSource(env,{fetcher=fetch,screen=moderateContent}={}){
 const meta=await read(env,`requests/${source.requestId}/request.json`);
 if(meta){if(!matchingMeta(meta))throw fault('source_repair_identity','The saved source identity needs review.',409);return meta;}
 if(await read(env,root+'source-attempt.json'))throw fault('source_repair_attempt_held','The previous source repair needs review; no automatic retry.',409);
 const states=await Promise.all(items.map(i=>read(env,mugKey(i.id))));
 const oldClaim=await read(env,'shop/preparation/v3/source-'+source.id+'.claim');
 const supplier=await env.ARTWORK.list({prefix:`mockups/${source.requestId}/`,limit:1});
 const artifacts=await Promise.all([`requests/${source.requestId}/preview.b64`,`security/content-screening/${source.requestId}.json`,`shop/masters/${source.id}/${source.sha256}.jpg`,`shop/masters/${source.id}/${source.sha256}.png`].map(key=>env.ARTWORK.head(key)));
 if(!knownSiameseImportFailure(states)||!oldClaim||supplier.truncated||supplier.objects.length||artifacts.some(Boolean))throw fault('source_repair_evidence','The exact pre-provider failure has not been established.',409);
 if(!await write(env,root+'source-attempt.json',{status:'owner_confirmed',startedAt:now(),sourceRevision:source.sha256},unique))throw fault('source_repair_claim','Another owner repair is already recorded.',409);
 await write(env,root+'original-mug-failures.json',states,unique);
 await write(env,root+'original-source-claim.json',oldClaim,unique);
 try{
  const url=new URL(source.asset);
  if(url.origin!=='https://cdn.shopify.com'||!url.pathname.startsWith('/s/files/1/0854/3810/3796/files/'))throw fault('source_repair_origin','The approved source URL is not recognized.',409);
  const response=await fetcher(url.href,{redirect:'manual',headers:{accept:'image/png'},signal:AbortSignal.timeout(15000)});
  if(response.status!==200||response.redirected||response.type==='opaqueredirect')throw fault('source_repair_download','The original source could not be verified.',503);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<100||bytes.length>15000000||await hashBytes(bytes)!==source.sha256)throw fault('source_repair_hash','The downloaded artwork is not the exact approved original.',409);
  const mime=approvedMugSourceMime(bytes),info=await env.IMAGES.info(new Blob([bytes],{type:mime}).stream());
  if(info.width!==source.width||info.height!==source.height)throw fault('source_repair_dimensions','The original artwork dimensions differ.',409);
  const notes=`Original fictional ${source.breed} Christmas Village — premade catalog`,text=notes+' ';
  const screened=await screen(env,{text,images:[new File([bytes],source.id+(mime==='image/jpeg'?'.jpg':'.png'),{type:mime})],required:true});
  let raw='';for(let n=0;n<bytes.length;n+=16384)raw+=String.fromCharCode(...bytes.subarray(n,n+16384));const encoded=btoa(raw);
  const at=now(),masterKey=`shop/masters/${source.id}/${source.sha256}.${mime==='image/jpeg'?'jpg':'png'}`;
  const saved={requestId:source.requestId,accessToken:randomToken(),previewMime:mime,catalogMasterKey:masterKey,source:'premade-catalog',catalogDesignId:source.id,catalogMasterHash:source.sha256,catalogRightsConfirmedAt:at,contentSafety:screened,notes,styleId:'christmas',styleName:'Christmas Village',subjectType:'pet',qualityMode:'original',modelUsed:null,status:'preview_ready',paid:false,fulfillment:'not_started',createdAt:at,updatedAt:at,width:info.width,height:info.height};
  if(!await env.ARTWORK.put(masterKey,bytes,{onlyIf:unique,httpMetadata:{contentType:mime}}))throw fault('source_repair_conflict','Source bytes already exist; refusing overwrite.',409);
  if(!await env.ARTWORK.put(`requests/${source.requestId}/preview.b64`,encoded,{onlyIf:unique}))throw fault('source_repair_conflict','Source preview already exists; refusing overwrite.',409);
  if(!await write(env,`security/content-screening/${source.requestId}.json`,{...screened,hash:await hash(encoded+'|'+text)},unique))throw fault('source_repair_conflict','Screening record already exists; refusing overwrite.',409);
  if(!await write(env,`requests/${source.requestId}/request.json`,saved,unique))throw fault('source_repair_conflict','Source metadata already exists; refusing overwrite.',409);
  await write(env,root+'source-attempt.json',{status:'restored_original',checkedAt:now(),sourceRevision:source.sha256,generatedArtwork:false});
  return saved;
 }catch(error){await write(env,root+'source-attempt.json',{status:'needs_review',checkedAt:now(),code:/^[a-z0-9_]{3,70}$/.test(error?.code||'')?error.code:'source_repair_failed'});throw error;}
}
export async function prepareFirstSiamesePreview(env,sku,{restore=repairSource,create=createMockup,rate=claimMugPreviewRateSlot}={}){
 const item=items.find(i=>i.sku===sku);if(!item)throw fault('source_repair_sku','Choose one of the two existing Siamese mug sizes.',400);
 const receipt=root+item.id+'.json';
 if(await read(env,receipt))throw fault('source_repair_preview_claimed','This first preview already has an attempt record; do not resubmit.',409);
 const object=await env.ARTWORK.get(mugKey(item.id)),held=object?await object.json():null;
 if(!held||held.status!=='needs_review'||!['9502','seed_source_pending'].includes(String(held.code))||held.mockupId||held.offer||held.startedAt)throw fault('source_repair_mug_state','This mug is not in the original pre-submission hold.',409);
 const meta=await restore(env);
 if(!matchingMeta(meta)||!matchingMeta(await read(env,`requests/${source.requestId}/request.json`)))throw fault('source_repair_identity','The restored original could not be verified.',409);
 const tasks=await env.ARTWORK.list({prefix:`mockups/${source.requestId}/${sku}/`,limit:1});
 if(tasks.truncated||tasks.objects.length)throw fault('source_repair_existing_task','An existing supplier record must be reconciled, not recreated.',409);
 if(!await rate(env))throw fault('source_repair_rate','The shared preview rate window is full. No new task was requested.',429);
 if(!await write(env,receipt,{status:'creating_first_preview',startedAt:now()},unique))throw fault('source_repair_preview_claimed','A first-preview request is already recorded.',409);
 await write(env,root+item.id+'/original-hold.json',held,unique);
 try{
  const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
  const design=recommendedCheckoutDesign(FULFILLMENT[sku]);
  const request=new Request(origin+'/api/mockup/create',{method:'POST',headers:{origin,'x-recast-request':'1','content-type':'application/json'},body:JSON.stringify({requestId:meta.requestId,accessToken:meta.accessToken,sku,design})});
  const response=await create(request,env),data=await response.json();
  if(!response.ok||!data.ok||!data.mockupId)throw fault('source_repair_preview_unconfirmed','The first-preview response needs review; no duplicate will be sent.',409);
  const task=await read(env,`mockups/${source.requestId}/${sku}/${data.mockupId}/task.json`),preview=await env.ARTWORK.get(`requests/${source.requestId}/preview.b64`);
  if(!task?.taskKey||task.requestId!==source.requestId||task.sku!==sku||task.printfulProductId!==FULFILLMENT[sku].printfulProductId||task.printfulVariantId!==FULFILLMENT[sku].printfulVariantId||!preview||task.sourceHash!==await hash((await preview.text())+'|'+JSON.stringify(task.design)))throw fault('source_repair_task_identity','The saved supplier task is not verified.',409);
  if(!await write(env,mugKey(item.id),{id:item.id,status:'pending_preview',mockupId:data.mockupId,design:task.design,polls:0,repairedAt:now(),repairReceipt:receipt},{etagMatches:object.etag}))throw fault('source_repair_hold_conflict','The original hold changed; no overwrite was made.',409);
  await write(env,receipt,{status:'first_preview_submitted',checkedAt:now(),supplierCreates:1,checkoutEnabled:false});
  return {id:item.id,status:'pending_preview',checkoutEnabled:false,requiresVisualApproval:true};
 }catch(error){await write(env,receipt,{status:'needs_review',checkedAt:now(),code:/^[a-z0-9_]{3,70}$/.test(error?.code||'')?error.code:'source_repair_preview_failed'});throw error;}
}
export async function siameseSourceRepairRoute(request,env){
 if(new URL(request.url).pathname!=='/api/admin/shop-source-repair/siamese')return null;
 try{
  requireAdmin(request,env);
  if(!['GET','POST'].includes(request.method))return privateJson({ok:false},405);
  if(request.method==='GET'){
   const meta=await read(env,`requests/${source.requestId}/request.json`),rows=[];
   for(const item of items){const state=await read(env,mugKey(item.id)),attempt=await read(env,root+item.id+'.json');rows.push({id:item.id,sku:item.sku,title:item.title,status:state?.status||'not_started',attempt:attempt?.status||null});}
   return privateJson({ok:true,source:{id:source.id,asset:source.asset,sha256:source.sha256,metadataVerified:Boolean(matchingMeta(meta))},items:rows,automaticPublication:false});
  }
  sameOrigin(request,env);
  const raw=await request.text();if(raw.length>1500)throw fault('source_repair_body','Repair confirmation is too large.',413);
  const body=JSON.parse(raw);
  if(body?.confirmFirstPreview!==true||body.sourceRevision!==source.sha256)throw fault('source_repair_confirmation','Confirm the exact original artwork and one first supplier preview.',400);
  return privateJson({ok:true,...await prepareFirstSiamesePreview(env,body.sku)});
 }catch(error){return privateJson({ok:false,code:/^[a-z0-9_]{3,70}$/.test(error?.code||'')?error.code:'source_repair_denied',error:error?.status?error.message:'The source repair needs review. No automatic retry will run.'},error?.status||503);}
}
