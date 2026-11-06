// Reconcile two named preparation holds using existing saved supplier task keys.
// No supplier POST, task recreation, source import, purchase, or publication.
import {read,hash,change,recommendedCheckoutDesign,privateJson,fault} from './commerce-store.js';
import {FULFILLMENT} from './entry.js';
import {EXPANSION_DESIGNS,EXPANSION_ITEMS,safeExpansionFailureClass} from './shop-expansion.js';
import {giftDefinition,giftMaster,giftBatchKey} from './shop-gift-definitions.js';
import {smallGiftKey} from './shop-small-gift-release.js';
import {verifyBatchSource} from './shop-gift-batch.js';
import {mockupStatus} from './workflow.js';
export const HELD_TASK_IDS=Object.freeze(['christmas-village-poodle-sticker-sheet-six','christmas-archive-french-bulldog-toy-shop-coaster-4pack']);
const root='shop/reconciliation/20261106/';
const enabled=env=>env?.PREMADE_HELD_TASK_RECONCILE_ENABLED==='true';
const now=()=>new Date().toISOString();
const key=id=>root+id+'.json';
const write=(env,path,value,condition)=>env.ARTWORK.put(path,JSON.stringify(value),{...(condition?{onlyIf:condition}:{}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
const unique=new Headers({'If-None-Match':'*'});
async function inspectSavedTask(env,item,master,state){
 const prefix=`mockups/${master.requestId}/${item.sku}/`,listing=await env.ARTWORK.list({prefix,limit:40});
 if(listing.truncated)throw fault('reconcile_task_ambiguous','Saved task needs manual review.',409);
 const found=[];
 for(const object of listing.objects){
  if(!object.key.startsWith(prefix)||!object.key.endsWith('/task.json'))continue;
  const record=await read(env,object.key);
  if(record?.requestId===master.requestId&&record.sku===item.sku&&(!state.mockupId||record.mockupId===state.mockupId))found.push({path:object.key,record});
 }
 if(found.length!==1)return {count:found.length};
 const one=found[0],record=one.record,map=FULFILLMENT[item.sku],preview=await env.ARTWORK.get(`requests/${master.requestId}/preview.b64`);
 if(!preview||!record.taskKey||!record.mockupId||!record.position||record.printfulProductId!==map.printfulProductId||record.printfulVariantId!==map.printfulVariantId||JSON.stringify(record.design)!==JSON.stringify(state.design||recommendedCheckoutDesign(map))||record.sourceHash!==await hash((await preview.text())+'|'+JSON.stringify(record.design)))throw fault('reconcile_task_identity','Saved task does not match this exact source and product.',409);
 return {count:1,...one};
}
export async function reconcileOneHeldTask(env,id,{poll=mockupStatus}={}){
 if(!HELD_TASK_IDS.includes(id))throw fault('reconcile_unknown_id','Unknown reconciliation target.',400);
 if(await read(env,key(id)))return {acted:false,status:'already_examined'};
 const item=giftDefinition(id),master=giftMaster(item),original=await env.ARTWORK.get(giftBatchKey(id));
 const state=original?await original.json():null;
 if(await read(env,smallGiftKey(id))||!state||state.status!=='needs_review'||!['gift_batch_poll','gift_batch_create'].includes(state.code))return {acted:false,status:'not_a_known_hold'};
 const meta=await read(env,`requests/${master.requestId}/request.json`);
 verifyBatchSource(item,meta,await read(env,'shop/catalog/v1.json'),await read(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`));
 const found=await inspectSavedTask(env,item,master,state);
 if(found.count!==1){
  await write(env,key(id),{status:found.count?'ambiguous_saved_tasks':'no_saved_task_evidence',checkedAt:now(),savedTaskCount:found.count,providerCreateAllowed:false},unique);
  return {acted:false,status:'no_safe_task'};
 }
 if(!await write(env,key(id),{status:'checking_existing_task',startedAt:now()},unique))return {acted:false,status:'already_claimed'};
 await write(env,root+id+'/original-hold.json',state,unique);
 await write(env,root+id+'/original-task.json',found.record,unique);
 try{
  let record=found.record;
  if(record.status!=='completed'||!record.images?.length){
   const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
   const params=new URLSearchParams({requestId:master.requestId,token:meta.accessToken,sku:item.sku,mockup:record.mockupId});
   const response=await poll(new Request(origin+'/api/mockup/status?'+params,{headers:{origin,'x-recast-request':'1'}}),env),data=await response.json();
   record=await read(env,found.path);
   if(!response.ok||!data.ok){
    await write(env,key(id),{status:record?.status==='failed'?'supplier_confirmed_failed':'supplier_poll_unresolved',checkedAt:now(),providerStatus:record?.status||'unknown',failureClass:safeExpansionFailureClass(record?.error),providerCreateAllowed:false});
    return {acted:true,status:'held_for_review'};
   }
  }
  if(!record||record.taskKey!==found.record.taskKey||record.sourceHash!==found.record.sourceHash||record.mockupId!==found.record.mockupId)throw fault('reconcile_task_changed','Saved task changed during inspection.',409);
  if(!['pending','completed'].includes(record.status))throw fault('reconcile_task_state','Saved task is not resumable.',409);
  const status=record.status==='completed'&&record.images?.length?'ready_for_review':'pending_preview';
  const next={...state,status,mockupId:record.mockupId,design:record.design,polls:0,providerViewCount:record.images?.length||0,reconciledAt:now(),reconciliation:root+id+'/'};
  delete next.code;
  if(!await write(env,giftBatchKey(id),next,{etagMatches:original.etag}))throw fault('reconcile_hold_changed','Held state changed; refusing overwrite.',409);
  await write(env,key(id),{status:'existing_task_resumed',resumeStatus:status,checkedAt:now(),supplierCreates:0,automaticPublication:false});
  return {acted:true,status:'existing_task_resumed'};
 }catch(error){
  const code=typeof error.code==='string'&&/^[a-z0-9_]{3,70}$/.test(error.code)?error.code:'reconcile_needs_review';
  await write(env,key(id),{status:'needs_review',code,checkedAt:now(),supplierCreates:0});
  return {acted:true,status:'needs_review'};
 }
}
export async function runHeldTaskReconcile(env,dependencies={}){
 if(!enabled(env)||!env.ARTWORK)return {enabled:false};
 const owner=crypto.randomUUID(),stamp=Date.now(),leaseKey=root+'lease.json';
 const lease=await change(env,leaseKey,null,old=>old?.expiresAt>stamp?old:{owner,expiresAt:stamp+180000});
 if(lease.owner!==owner)return {enabled:true,busy:true};
 try{
  for(const id of HELD_TASK_IDS){const result=await reconcileOneHeldTask(env,id,dependencies);if(result.acted)return {enabled:true,...result};}
  return {enabled:true,status:'known_tasks_examined'};
 }finally{await change(env,leaseKey,null,old=>old?.owner===owner?{...old,expiresAt:0}:undefined);}
}
export async function heldTaskReconcileStatus(env){
 const items=[];
 for(const id of HELD_TASK_IDS){const r=await read(env,key(id));items.push({id,status:r?.status||'not_started',resumeStatus:r?.resumeStatus||null,code:r?.code||null,providerStatus:r?.providerStatus||null,failureClass:r?.failureClass||null});}
 const source=EXPANSION_DESIGNS.find(s=>s.id==='christmas-village-siamese-cat');
 const meta=await read(env,`requests/${source.requestId}/request.json`),claim=await read(env,'shop/preparation/v3/source-'+source.id+'.claim');
 const mugs=[];
 for(const item of EXPANSION_ITEMS.filter(i=>i.designId===source.id)){
  const state=await read(env,'shop/preparation/v3/'+item.id+'.json');
  mugs.push({id:item.id,status:state?.status||'not_started',code:state?.code||null,providerTaskRecorded:Boolean(state?.mockupId),failureClass:safeExpansionFailureClass(state?.message)});
 }
 return {enabled:enabled(env),automaticPublication:false,supplierCreates:0,items,source:{id:source.id,metadataPresent:Boolean(meta),originalClaimPresent:Boolean(claim),mugs}};
}
export async function heldTaskReconcileRoute(request,env){
 if(new URL(request.url).pathname!=='/api/shop/held-reconciliation')return null;
 if(request.method!=='GET')return privateJson({ok:false},405);
 const response=privateJson({ok:true,...await heldTaskReconcileStatus(env)});response.headers.set('x-robots-tag','noindex, nofollow');return response;
}
