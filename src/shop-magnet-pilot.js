// One Golden Retriever magnet proof canary. This is NOT product publication.
// A real Printful mockup task is cached and inspected before any premade sale.
// Never convert the already-approved mug proof into magnet fulfillment.
import {read,recommendedCheckoutDesign,privateJson,fault} from './commerce-store.js';
import {FULFILLMENT} from './entry.js';
import {createMockup,mockupStatus,requireAdmin} from './workflow.js';
import {EXPANSION_DESIGNS,claimMugPreviewRateSlot} from './shop-expansion.js';

const master=EXPANSION_DESIGNS[0];
export const MAGNET_PILOT=Object.freeze({
 id:'christmas-village-golden-retriever-magnet-3pack',
 designId:master.id,
 requestId:master.requestId,
 artworkRevision:master.sha256,
 sku:'RECAST-MAGNET-SET',
 product:'magnet',
 variantLabel:'Three matching magnets',
});
const KEY='shop/preparation/magnets/v1/golden-retriever-3pack.json';
const LOCK='shop/preparation/magnets/v1/lock.json';
const iso=()=>new Date().toISOString();
const base=env=>String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
const internal=(env,path,body)=>new Request(base(env)+path,{
 method:body?'POST':'GET',
 headers:{'x-recast-request':'1',origin:base(env),...(body?{'content-type':'application/json'}:{})},
 body:body?JSON.stringify(body):undefined
});
const enabled=env=>env?.PREMADE_MAGNET_PILOT_ENABLED==='true';
function checkSource(meta,catalog){
 const mapped=FULFILLMENT[MAGNET_PILOT.sku];
 if(!mapped||mapped.product!=='Magnet 3-Pack'||mapped.printfulProductId!==656||mapped.printfulVariantId!==16366)throw fault('magnet_mapping_changed','The magnet supplier mapping needs review.',503);
 if(!meta||meta.source!=='premade-catalog'||meta.catalogDesignId!==master.id||
  meta.catalogMasterHash!==master.sha256||!meta.catalogRightsConfirmedAt||
  !meta.contentSafety||!meta.accessToken||meta.width!==1254||meta.height!==1254)
  throw fault('magnet_source_review','Approved original pet artwork is not available for magnet previews.',503);
 const verified=Array.isArray(catalog?.offers)&&catalog.offers.some(o=>
  o.designId===master.id&&o.artworkRevision===master.sha256&&o.requestId===master.requestId&&
  o.status==='verified'&&o.proof?.provider==='printful'&&o.proof?.approved===true);
 if(!verified)throw fault('magnet_mug_source_review','The same exact original artwork has not been verified in the Recast catalog.',503);
 return mapped;
}
async function stateWrite(env,state){
 await env.ARTWORK.put(KEY,JSON.stringify(state),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
}
function failRecord(old,error){
 const code=String(error?.code||'magnet_provider_needs_review');
 const safe=/^[a-z0-9_-]{3,70}$/.test(code)?code:'magnet_provider_needs_review';
 return {...old,status:'needs_review',code:safe,checkedAt:iso()};
}
// This scheduled worker owns a single proof, and cannot create more than one
// Printful task. Shared provider rate protection is reused from the mug desk.
export async function runMagnetPilot(env,{create=createMockup,poll=mockupStatus,rate=claimMugPreviewRateSlot}={}){
 if(!enabled(env)||!env?.ARTWORK||!env?.IMAGES)return {enabled:false};
 const prior=await env.ARTWORK.get(LOCK);
 if(prior){
  try{if(Date.parse((await prior.json()).until)>Date.now())return {enabled:true,busy:true};}
  catch{return {enabled:true,busy:true};}
 }
 const lock=await env.ARTWORK.put(LOCK,JSON.stringify({until:new Date(Date.now()+180000).toISOString()}),{
  onlyIf:prior?{etagMatches:prior.etag}:new Headers({'If-None-Match':'*'})
 });
 if(!lock)return {enabled:true,busy:true};
 try{
  let state=await read(env,KEY);
  if(state&&state.status!=='pending_preview')return {enabled:true,status:state.status,created:0};
  const meta=await read(env,`requests/${master.requestId}/request.json`);
  const catalog=await read(env,'shop/catalog/v1.json');
  try{checkSource(meta,catalog);}
  catch(error){
   if(!state)await stateWrite(env,failRecord({id:MAGNET_PILOT.id},error));
   return {enabled:true,status:'needs_review',created:0};
  }
  // Supplier GET preflight must confirm 1254px meets this exact magnet area.
  // Full print proof and manual review still required before any sales.
  if(!state){
   const template=await read(env,'shop/preparation/printfile-audit/v1/656.json');
   if(!template||template.status==='checking')return {enabled:true,status:'awaiting_template_audit',created:0};
   const variant=Array.isArray(template?.variants)?template.variants.find(v=>v.sku===MAGNET_PILOT.sku):null;
   if(template.status!=='complete'||!variant?.fullPixelsMeetSupplierArea||!variant?.aspectCompatible){
    await stateWrite(env,failRecord({id:MAGNET_PILOT.id},fault('magnet_print_area_review','The source needs a verified magnetic-print-area master.',503)));
    return {enabled:true,status:'needs_review',created:0};
   }
  }
  const design=recommendedCheckoutDesign(FULFILLMENT[MAGNET_PILOT.sku]);
  if(!state){
   if(!await rate(env))return {enabled:true,status:'rate_limited',created:0};
   state={id:MAGNET_PILOT.id,status:'creating_preview',startedAt:iso(),artworkRevision:master.sha256};
   const claimed=await env.ARTWORK.put(KEY,JSON.stringify(state),{onlyIf:new Headers({'If-None-Match':'*'})});
   if(!claimed)return {enabled:true,busy:true,created:0};
   // If the provider accepts this but its response is lost, the durable
   // creating_preview claim intentionally prevents any automated second task.
   try{
    const response=await create(internal(env,'/api/mockup/create',{
     requestId:meta.requestId,accessToken:meta.accessToken,sku:MAGNET_PILOT.sku,design
    }),env);
    const data=await response.json();
    if(!response.ok||!data?.ok||!data.mockupId)throw fault('magnet_mockup_create','The supplier task needs manual reconciliation.',503);
    await stateWrite(env,{...state,status:'pending_preview',mockupId:data.mockupId,design,polls:0,taskStartedAt:iso()});
    return {enabled:true,status:'pending_preview',created:1};
   }catch(error){
    await stateWrite(env,failRecord(state,error));
    return {enabled:true,status:'needs_review',created:1};
   }
  }
  if(state.polls>=20){
   await stateWrite(env,failRecord(state,fault('magnet_mockup_poll_limit','Supplier task needs manual review.',503)));
   return {enabled:true,status:'needs_review',created:0};
  }
  try{
   const query=new URLSearchParams({
    requestId:meta.requestId,token:meta.accessToken,sku:MAGNET_PILOT.sku,mockup:state.mockupId
   });
   const response=await poll(internal(env,'/api/mockup/status?'+query),env);
   const data=await response.json();
   if(!response.ok||!data.ok)throw fault('magnet_mockup_poll','Supplier proof needs manual review.',503);
   if(data.status!=='completed'){
    await stateWrite(env,{...state,polls:state.polls+1,checkedAt:iso()});
    return {enabled:true,status:'pending_preview',created:0};
   }
   if(!Array.isArray(data.images)||data.images.length<1)throw fault('magnet_no_proof','Supplier did not return an actual product view.',503);
   await stateWrite(env,{...state,status:'ready_for_review',providerViewCount:data.images.length,checkedAt:iso(),manualApprovalRequired:true});
   return {enabled:true,status:'ready_for_review',created:0};
  }catch(error){
   await stateWrite(env,failRecord(state,error));
   return {enabled:true,status:'needs_review',created:0};
  }
 }finally{await env.ARTWORK.delete(LOCK);}
}
export async function magnetPilotStatus(env){
 const state=await read(env,KEY);
 return {enabled:enabled(env),id:MAGNET_PILOT.id,sourceDesign:master.id,
  sku:MAGNET_PILOT.sku,status:state?.status||'not_started',
  proofOnly:true,checkoutEnabled:false,automaticApproval:false,
  providerViewCount:state?.providerViewCount||0,
  code:state?.status==='needs_review'?state.code||'manual_review':null};
}
export async function magnetPilotRoute(_request,env){return privateJson({ok:true,...await magnetPilotStatus(env)});}

// Owner-only inspection endpoint. A bearer admin token is required to see
// saved, manufacturer-produced image views for a particular completed task.
// No token, customer link or provider secret is returned by the public status.
export async function magnetPilotOwnerProof(request,env){
 try{requireAdmin(request,env);}
 catch(error){return privateJson({ok:false,error:'Owner authorization required.'},error.status||401)}
 const state=await read(env,KEY);
 if(!state||state.status!=='ready_for_review'||!state.mockupId)
  return privateJson({ok:false,error:'No completed magnet proof is ready for owner review.'},409);
 const task=await read(env,`mockups/${master.requestId}/${MAGNET_PILOT.sku}/${state.mockupId}/task.json`);
 if(task?.status!=='completed'||task.requestId!==master.requestId||task.sku!==MAGNET_PILOT.sku||
  task.mockupId!==state.mockupId||!Array.isArray(task.images)||!task.images.length)
  return privateJson({ok:false,error:'The saved Printful preview needs reconciliation.'},409);
 const images=[];
 for(const view of task.images.slice(0,4)){
  try{
   const url=new URL(view.url);
   const prefix=`/api/mockup/image/${encodeURIComponent(master.requestId)}/${encodeURIComponent(MAGNET_PILOT.sku)}/`;
   if(url.origin!==base(env)||!url.pathname.startsWith(prefix)||!url.searchParams.get('token'))continue;
   images.push({title:String(view.title||'Printful product preview').slice(0,100),url:url.href});
  }catch{/* Unsupported or corrupt preview link cannot be shown. */}
 }
 if(!images.length)return privateJson({ok:false,error:'No authenticated supplier pictures were available.'},409);
 return privateJson({ok:true,id:MAGNET_PILOT.id,designId:master.id,
  artworkRevision:master.sha256,sku:MAGNET_PILOT.sku,reviewStatus:'manual_review_required',
  supplierPictures:images,checkoutEnabled:false,automaticApproval:false});
}
