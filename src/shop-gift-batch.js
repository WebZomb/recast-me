// Preparation only: 34 additional approved artworks x three existing products.
// Never publishes a catalog offer, places an order, or generates AI artwork.
import {read,change,fault,recommendedCheckoutDesign} from './commerce-store.js';
import {FULFILLMENT} from './entry.js';
import {EXPANSION_DESIGNS,claimMugPreviewRateSlot} from './shop-expansion.js';
import {createMockup,mockupStatus} from './workflow.js';
import {GIFT_BATCH_ITEMS,ALL_SMALL_GIFTS,giftMaster,giftArtworkTitle,giftBatchKey} from './shop-gift-definitions.js';
import {freezeSmallGift,smallGiftKey,verifySmallGiftArea} from './shop-small-gift-release.js';
const leaseKey='shop/preparation/gift-batch/v1/lease.json';
const now=()=>new Date().toISOString();
const enabled=env=>env.PREMADE_GIFT_BATCH_ENABLED==='true';
const base=env=>String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
const internal=(env,path,body)=>new Request(base(env)+path,{method:body?'POST':'GET',headers:{origin:base(env),'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const held=(item,cause)=>({id:item.id,status:'needs_review',code:/^[a-z0-9_]{3,70}$/.test(String(cause?.code))?cause.code:'gift_batch_provider_review',checkedAt:now()});
async function save(env,key,value){return env.ARTWORK.put(key,JSON.stringify(value),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});}
export function verifyBatchSource(item,meta,catalog,report){
 const source=giftMaster(item),map=FULFILLMENT[item.sku];
 if(map?.printfulProductId!==item.catalogId||map?.printfulVariantId!==item.variantId)throw fault('gift_batch_mapping','Supplier mapping needs review.',409);
 if(!meta||meta.source!=='premade-catalog'||meta.requestId!==source.requestId||meta.catalogDesignId!==source.id||meta.catalogMasterHash!==source.sha256||!meta.catalogRightsConfirmedAt||!meta.contentSafety||!meta.accessToken)throw fault('gift_batch_source','The exact approved original is not available.',409);
 const verified=catalog?.offers?.some(o=>o.designId===source.id&&o.requestId===source.requestId&&o.artworkRevision===source.sha256&&o.status==='verified'&&o.proof?.provider==='printful'&&o.proof?.approved===true);
 if(!verified)throw fault('gift_batch_source_unreviewed','The original artwork must already have a verified supplier offer.',409);
 verifySmallGiftArea(item,report,meta);
 return source;
}
export async function runGiftBatch(env,{create=createMockup,poll=mockupStatus,freeze=freezeSmallGift,rate=claimMugPreviewRateSlot}={}){
 if(!enabled(env)||!env.ARTWORK||!env.IMAGES)return {enabled:false};
 const owner=crypto.randomUUID(),stamp=Date.now();
 const lease=await change(env,leaseKey,null,old=>old?.expiresAt>stamp?old:{owner,expiresAt:stamp+300000});
 if(lease.owner!==owner)return {enabled:true,busy:true};
 const tally={enabled:true,created:0,polled:0,prepared:0,held:0,published:0};
 const current=async()=>{const s=await read(env,leaseKey);return s?.owner===owner&&s.expiresAt>Date.now();};
 try{
  const catalog=await read(env,'shop/catalog/v1.json');
  const sources=new Map(),reports=new Map();
  const valid=async item=>{
   const source=giftMaster(item);
   if(!sources.has(source.id))sources.set(source.id,await read(env,`requests/${source.requestId}/request.json`));
   if(!reports.has(item.catalogId))reports.set(item.catalogId,await read(env,`shop/preparation/printfile-audit/v1/${item.catalogId}.json`));
   const meta=sources.get(source.id);verifyBatchSource(item,meta,catalog,reports.get(item.catalogId));return meta;
  };
  for(const item of GIFT_BATCH_ITEMS){
   if(!await current())break;
   const key=giftBatchKey(item.id);let state=await read(env,key);
   // Only the three Siamese source-validation holds occurred before any task.
   // Resume them once the recovered original has a reviewed live mug offer.
   let sourceHold=null;
   if(state?.status==='needs_review'&&state.code==='gift_batch_source'&&giftMaster(item).id==='christmas-village-siamese-cat'&&!state.startedAt&&!state.mockupId&&!state.design){
    if(await read(env,smallGiftKey(item.id)))continue;
    try{await valid(item);}catch{continue;}
    const tasks=await env.ARTWORK.list({prefix:`mockups/${giftMaster(item).requestId}/${item.sku}/`,limit:1});
    if(tasks.truncated||tasks.objects.length)continue;
    const original=await env.ARTWORK.get(key);
    if(!original||JSON.stringify(await original.json())!==JSON.stringify(state))continue;
    sourceHold={state,etag:original.etag};state=null;
   }
   if(state?.status==='needs_review'||state?.status==='creating_preview'||state?.status==='frozen')continue;
   if(state?.status==='pending_preview'){
    if(tally.polled>=4)continue;
    try{
     if(state.polls>=20)throw fault('gift_batch_poll_limit','The existing supplier task needs review.',409);
     const meta=await valid(item),query=new URLSearchParams({requestId:meta.requestId,token:meta.accessToken,sku:item.sku,mockup:state.mockupId});
     tally.polled++;
     const response=await poll(internal(env,'/api/mockup/status?'+query),env),data=await response.json();
     if(!response.ok||!data.ok)throw fault('gift_batch_poll','The existing supplier task needs review.',409);
     if(data.status!=='completed'){state={...state,polls:state.polls+1,checkedAt:now()};await save(env,key,state);continue;}
     if(!Array.isArray(data.images)||!data.images.length)throw fault('gift_batch_no_views','Supplier pictures are missing.',409);
     state={...state,status:'ready_for_review',providerViewCount:data.images.length,checkedAt:now()};await save(env,key,state);
    }catch(error){await save(env,key,{...state,...held(item,error)});tally.held++;continue;}
   }
   if(state?.status==='ready_for_review'){
    if(tally.prepared>=2)continue;
    const releaseKey=smallGiftKey(item.id),existing=await read(env,releaseKey);
    if(existing){
     if(['published','ready_for_review'].includes(existing.status))await save(env,key,{...state,status:'frozen'});
     continue;
    }
    try{
     await valid(item);
     const claim=await env.ARTWORK.put(releaseKey,JSON.stringify({id:item.id,status:'preparing',startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})});
     if(!claim)continue;
     tally.prepared++;
     const frozen=await freeze(env,item,state);
     if(frozen?.id!==item.id||frozen.status!=='ready_for_review'||frozen.offer?.designId!==giftMaster(item).id)throw fault('gift_batch_freeze_identity','Print-file source identity changed.',409);
     await save(env,releaseKey,frozen);await save(env,key,{...state,status:'frozen'});
    }catch(error){await save(env,releaseKey,held(item,error));await save(env,key,{...state,...held(item,error)});tally.held++;}
    continue;
   }
   if(state)continue; // Unknown/uncertain durable states never create another task.
   if(tally.created>=2)continue;
   let meta;
   try{meta=await valid(item);}catch(error){await save(env,key,held(item,error));tally.held++;continue;}
   if(!await rate(env))continue;
   if(!await current())break;
   const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
   state={id:item.id,status:'creating_preview',sourceRevision:giftMaster(item).sha256,design,startedAt:now()};
   if(sourceHold){
    const archive=`shop/recovery/siamese-gifts-20261106/${item.id}/original-hold.json`;
    await env.ARTWORK.put(archive,JSON.stringify(sourceHold.state),{onlyIf:new Headers({'If-None-Match':'*'})});
    state.sourceRecovery=archive;
   }
   if(!await env.ARTWORK.put(key,JSON.stringify(state),{onlyIf:sourceHold?{etagMatches:sourceHold.etag}:new Headers({'If-None-Match':'*'})}))continue;
   tally.created++;
   try{
    const response=await create(internal(env,'/api/mockup/create',{requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,design}),env),data=await response.json();
    if(!response.ok||!data.ok||!data.mockupId)throw fault('gift_batch_create','The supplier response needs reconciliation, not a retry.',409);
    await save(env,key,{...state,status:'pending_preview',mockupId:data.mockupId,polls:0});
   }catch(error){await save(env,key,{...state,...held(item,error)});tally.held++;}
  }
  return tally;
 }finally{
  await change(env,leaseKey,null,old=>old?.owner===owner?{...old,expiresAt:0}:undefined);
 }
}
export async function giftBatchStatus(env){
 const designs=[];let ready=0,published=0,heldCount=0;
 for(const source of EXPANSION_DESIGNS){
  const items=[];
  for(const item of ALL_SMALL_GIFTS.filter(g=>(g.designId||EXPANSION_DESIGNS[0].id)===source.id)){
   const release=await read(env,smallGiftKey(item.id));
   const task=release?null:await read(env,item.pilot);
   const status=release?.status||task?.status||'not_started';
   if(status==='ready_for_review'&&release)ready++;
   if(status==='published')published++;
   if(status==='needs_review')heldCount++;
   items.push({id:item.id,product:item.product,status,printFileReady:release?.status==='ready_for_review'||status==='published',checkoutEnabled:status==='published',code:release?.code||task?.code||null});
  }
  designs.push({id:source.id,title:giftArtworkTitle(source),breed:source.breed,pet:source.pet,items});
 }
 return {enabled:enabled(env),totalDesigns:35,totalProducts:105,readyForReview:ready,published,needsReview:heldCount,automaticPublication:false,designs};
}
