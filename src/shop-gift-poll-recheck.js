// One reconciliation of an EXISTING task after a failed status read.
// This module never creates supplier tasks, signs proofs, publishes or places orders.
import {read,change,hash} from './commerce-store.js';
import {GIFT_BATCH_ITEMS,giftMaster,giftBatchKey} from './shop-gift-definitions.js';
import {smallGiftKey} from './shop-small-gift-release.js';
import {mockupStatus} from './workflow.js';
const root='shop/preparation/gift-poll-rechecks/v1/';
const now=()=>new Date().toISOString();
export async function recheckGiftPoll(env,item,state,meta,{poll=mockupStatus}={}){
 const result={attempted:false,state};
 if(env.PREMADE_GIFT_POLL_RECHECK_ENABLED!=='true'||!env.ARTWORK)return result;
 if(!GIFT_BATCH_ITEMS.some(x=>x.id===item?.id&&x.sku===item.sku)||state?.id!==item.id||state.status!=='needs_review'||state.code!=='gift_batch_poll')return result;
 const source=giftMaster(item),id=state.mockupId;
 if(typeof id!=='string'||!id||id.length>160||/[\/\\]|\.\./.test(id)||state.sourceRevision!==source.sha256||!state.design)return result;
 if(meta?.requestId!==source.requestId||meta.catalogDesignId!==source.id||meta.catalogMasterHash!==source.sha256||!meta.catalogRightsConfirmedAt||!meta.contentSafety||!meta.accessToken)return result;
 if(!Number.isSafeInteger(state.polls)||state.polls<0||state.polls>=20)return result;
 if(await read(env,smallGiftKey(item.id)))return result; // Never replace frozen or published work.
 const task=await read(env,`mockups/${source.requestId}/${item.sku}/${id}/task.json`);
 if(!task||task.requestId!==source.requestId||task.sku!==item.sku||task.mockupId!==id||task.printfulVariantId!==item.variantId||!task.taskKey||JSON.stringify(task.design)!==JSON.stringify(state.design))return result;
 const key=root+item.id+'.json',stateHash=await hash(JSON.stringify(state));
 const claimed=await env.ARTWORK.put(key,JSON.stringify({version:1,id:item.id,sourceRevision:source.sha256,mockupId:id,stateHash,status:'checking_existing_task',startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})});
 if(!claimed)return result; // Includes interrupted/uncertain rechecks: no blind repeat.
 const finish=async(status)=>env.ARTWORK.put(key,JSON.stringify({version:1,id:item.id,sourceRevision:source.sha256,mockupId:id,stateHash,status,checkedAt:now()}));
 if(task.status==='failed'){await finish('supplier_task_failed');return result;}
 if(!['pending','completed','processing','in_progress'].includes(task.status)){await finish('supplier_state_requires_review');return result;}
 result.attempted=true;
 try{
  const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
  const query=new URLSearchParams({requestId:source.requestId,token:meta.accessToken,sku:item.sku,mockup:id});
  const response=await poll(new Request(origin+'/api/mockup/status?'+query,{method:'GET',headers:{origin,'x-recast-request':'1'}}),env);
  const data=await response.json();
  if(!response.ok||data.ok!==true){await finish(data.status==='failed'?'supplier_task_failed':'status_read_unconfirmed');return result;}
  if(!['pending','completed'].includes(data.status)||data.status==='completed'&&(!Array.isArray(data.images)||!data.images.length)){await finish('supplier_views_unconfirmed');return result;}
  const next={...state,status:data.status==='completed'?'ready_for_review':'pending_preview',polls:state.polls+1,pollRecheckVersion:1,priorFailureCode:state.code,code:null,checkedAt:now(),...(data.status==='completed'?{providerViewCount:data.images.length}:{})};
  const stored=await change(env,giftBatchKey(item.id),null,async old=>{
   if(!old||await hash(JSON.stringify(old))!==stateHash)return undefined;
   return next;
  });
  if(stored?.pollRecheckVersion===1&&stored.mockupId===id){result.state=stored;await finish(data.status==='completed'?'existing_views_recovered':'existing_task_pending');}
  else await finish('state_changed_no_update');
 }catch{await finish('status_read_unconfirmed');}
 return result;
}
