// One explicit owner-requested fresh preview for a single unrecoverable hold.
// The old provider outcome remains UNKNOWN; this is not automatic reconciliation.
import {read,hash,recommendedCheckoutDesign,privateJson,sameOrigin,fault} from './commerce-store.js';
import {giftDefinition,giftMaster,giftBatchKey} from './shop-gift-definitions.js';
import {verifyBatchSource} from './shop-gift-batch.js';
import {smallGiftKey} from './shop-small-gift-release.js';
import {claimMugPreviewRateSlot} from './shop-expansion.js';
import {FULFILLMENT} from './entry.js';
import {requireAdmin,createMockup} from './workflow.js';
export const FRENCHIE_ID='christmas-archive-french-bulldog-toy-shop-coaster-4pack';
const item=giftDefinition(FRENCHIE_ID),source=giftMaster(item);
const root='shop/recovery/owner-frenchie-20261106/';
const unique=new Headers({'If-None-Match':'*'});
const write=(env,key,value,onlyIf)=>env.ARTWORK.put(key,JSON.stringify(value),{...(onlyIf?{onlyIf}:{}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
export async function prepareFrenchiePreview(env,{create=createMockup,rate=claimMugPreviewRateSlot}={}){
 if(await read(env,root+'attempt.json'))throw fault('repair_attempt_exists','A fresh-preview attempt is already recorded. Refresh its status; do not repeat.',409);
 const object=await env.ARTWORK.get(giftBatchKey(item.id)),state=object?await object.json():null;
 const reconciliation=await read(env,'shop/reconciliation/20261106/'+item.id+'.json');
 if(state?.id!==item.id||state.status!=='needs_review'||state.code!=='gift_batch_create'||state.mockupId||reconciliation?.status!=='no_saved_task_evidence'||await read(env,smallGiftKey(item.id)))throw fault('repair_state','This is not the exact unrecoverable coaster hold.',409);
 const meta=await read(env,`requests/${source.requestId}/request.json`);
 verifyBatchSource(item,meta,await read(env,'shop/catalog/v1.json'),await read(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`));
 const tasks=await env.ARTWORK.list({prefix:`mockups/${source.requestId}/${item.sku}/`,limit:1});
 if(tasks.truncated||tasks.objects.length)throw fault('repair_saved_task','An existing supplier record must be reconciled instead.',409);
 if(!await rate(env))throw fault('repair_rate','The shared preview rate window is full. No request was sent.',429);
 const receipt={status:'owner_requested_fresh_preview',startedAt:new Date().toISOString(),priorProviderOutcome:'unknown',automaticRetry:false,sourceRevision:source.sha256};
 if(!await write(env,root+'attempt.json',receipt,unique))throw fault('repair_attempt_exists','Another fresh-preview attempt is recorded.',409);
 await write(env,root+'original-hold.json',state,unique);
 await write(env,root+'original-reconciliation.json',reconciliation,unique);
 try{
  const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
  const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
  const response=await create(new Request(origin+'/api/mockup/create',{method:'POST',headers:{origin,'x-recast-request':'1','content-type':'application/json'},body:JSON.stringify({requestId:source.requestId,accessToken:meta.accessToken,sku:item.sku,design})}),env);
  const data=await response.json();
  if(!response.ok||!data.ok||!data.mockupId)throw fault('repair_unconfirmed','The fresh preview needs review; it will not be submitted again.',409);
  const task=await read(env,`mockups/${source.requestId}/${item.sku}/${data.mockupId}/task.json`),preview=await env.ARTWORK.get(`requests/${source.requestId}/preview.b64`);
  if(!task?.taskKey||task.requestId!==source.requestId||task.sku!==item.sku||task.printfulProductId!==item.catalogId||task.printfulVariantId!==item.variantId||!preview||task.sourceHash!==await hash((await preview.text())+'|'+JSON.stringify(task.design))||JSON.stringify(task.design)!==JSON.stringify(design))throw fault('repair_identity','The saved supplier task identity needs review.',409);
  const next={id:item.id,status:'pending_preview',mockupId:data.mockupId,design:task.design,polls:0,ownerRecovery:root,priorProviderOutcome:'unknown'};
  if(!await write(env,giftBatchKey(item.id),next,{etagMatches:object.etag}))throw fault('repair_conflict','The held record changed. No overwrite was made.',409);
  await write(env,root+'attempt.json',{...receipt,status:'fresh_preview_submitted',supplierCreates:1});
  return {id:item.id,status:'pending_preview',checkoutEnabled:false};
 }catch(error){await write(env,root+'attempt.json',{...receipt,status:'needs_review',code:/^[a-z0-9_]{3,70}$/.test(error?.code||'')?error.code:'repair_failed'});throw error;}
}
export async function frenchiePreviewRepairRoute(request,env){
 if(new URL(request.url).pathname!=='/api/admin/shop-source-repair/frenchie')return null;
 try{
  requireAdmin(request,env);
  if(request.method==='GET'){
   const state=await read(env,giftBatchKey(item.id)),attempt=await read(env,root+'attempt.json');
   return privateJson({ok:true,source:{asset:source.asset,sha256:source.sha256},title:'French Bulldog Toy Shop Coaster Set',status:state?.status||'not_started',attempt:attempt?.status||null,priorProviderOutcome:'unknown',automaticRetry:false});
  }
  if(request.method!=='POST')return privateJson({ok:false},405);
  sameOrigin(request,env);const raw=await request.text();if(raw.length>1000)throw fault('repair_body','Confirmation is too large.',413);
  const body=JSON.parse(raw);
  if(body.confirmFreshPreview!==true||body.acknowledgePriorUnknown!==true||body.sourceRevision!==source.sha256)throw fault('repair_confirmation','Confirm one fresh mockup with the previous outcome recorded as unknown.',400);
  return privateJson({ok:true,...await prepareFrenchiePreview(env)});
 }catch(error){return privateJson({ok:false,error:error?.status?error.message:'The fresh preview needs review. No automatic retry will run.'},error?.status||503);}
}
