// Owner-authorized, source-pinned starter catalog migration. No public mutation
// endpoint, AI generation, payment, supplier order or production submission.
import {read,hash,randomToken,change,fault,recommendedCheckoutDesign,composeProductLayout} from './commerce-store.js';
import {moderateContent} from './content-safety.js';
import {FULFILLMENT,prepareCheckout} from './entry.js';
import {createMockup,mockupStatus} from './workflow.js';
import {hashBytes,SHOP_CATALOG_KEY,resolveShopOffer} from './shop-catalog-store.js';
export const SEED_DESIGN=Object.freeze({id:'christmas-golden-retriever-winter-lights',requestId:'RC-SHOP-GOLDEN-WINTER-V1',asset:'/shop-assets/christmas-golden-artwork.png',sha256:'a003e979d4a1c2056d37f9c23610399dd83ed82ec0f85cde8733f99fbd1ff0a2',width:1254,height:1254,pet:'dog',breed:'Golden Retriever',occasion:'christmas'});
export const SEED_ITEMS=Object.freeze([{id:'golden-winter-lights-mug-11oz',sku:'RECAST-MUG-11OZ',title:'Golden Retriever Winter Lights Mug',variantLabel:'White glossy · 11 oz'},{id:'golden-winter-lights-mug-15oz',sku:'RECAST-MUG-15OZ',title:'Golden Retriever Winter Lights Large Mug',variantLabel:'White glossy · 15 oz'}]);
// Filled only in a reviewed source commit AFTER real supplier proofs are inspected.
export const REVIEWED_SEED_PROOFS=Object.freeze({});
const key=id=>`shop/preparation/v1/${id}.json`;
const now=()=>new Date().toISOString();
const base=env=>String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
const inner=(env,path,body)=>new Request(base(env)+path,{method:body?'POST':'GET',headers:{'x-recast-request':'1',origin:base(env),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const b64=bytes=>{let out='';for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(out);};
async function source(env){
 const meta=await read(env,`requests/${SEED_DESIGN.requestId}/request.json`);
 if(meta){if(meta.source!=='premade-catalog'||meta.catalogDesignId!==SEED_DESIGN.id||meta.catalogMasterHash!==SEED_DESIGN.sha256)throw fault('seed_identity','The catalog source needs review.',503);return meta;}
 const claim='shop/preparation/v1/source.claim';
 if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('seed_source_pending','The original catalog import needs review before retrying.',503);
 const response=await env.ASSETS.fetch(new Request('https://recast-assets.local'+SEED_DESIGN.asset));
 if(!response.ok)throw fault('seed_asset','The approved catalog artwork could not load.',503);
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(await hashBytes(bytes)!==SEED_DESIGN.sha256)throw fault('seed_asset_changed','The catalog artwork does not match its approved source.',503);
 const info=await env.IMAGES.info(new Blob([bytes],{type:'image/png'}).stream());
 if(info.width!==SEED_DESIGN.width||info.height!==SEED_DESIGN.height)throw fault('seed_dimensions','The catalog artwork dimensions changed.',503);
 const notes='Original fictional Golden Retriever Winter Lights — premade catalog',text=notes+' ';
 const screened=await moderateContent(env,{text,images:[new File([bytes],'golden-winter-lights.png',{type:'image/png'})],required:true});
 const encoded=b64(bytes),createdAt=now(),requestId=SEED_DESIGN.requestId;
 const saved={requestId,accessToken:randomToken(),previewMime:'image/png',source:'premade-catalog',catalogDesignId:SEED_DESIGN.id,catalogMasterHash:SEED_DESIGN.sha256,catalogRightsConfirmedAt:createdAt,contentSafety:screened,notes,styleId:'christmas',styleName:'Winter Lights',subjectType:'pet',qualityMode:'original',modelUsed:null,status:'preview_ready',paid:false,fulfillment:'not_started',createdAt,updatedAt:createdAt,width:info.width,height:info.height};
 await env.ARTWORK.put(`shop/masters/${SEED_DESIGN.id}/${SEED_DESIGN.sha256}.png`,bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'image/png'}});
 await env.ARTWORK.put(`requests/${requestId}/preview.b64`,encoded,{onlyIf:new Headers({'If-None-Match':'*'})});
 await env.ARTWORK.put(`security/content-screening/${requestId}.json`,JSON.stringify({...screened,hash:await hash(encoded+'|'+text)}));
 const stored=await env.ARTWORK.put(`requests/${requestId}/request.json`,JSON.stringify(saved),{onlyIf:new Headers({'If-None-Match':'*'})});
 if(!stored)throw fault('seed_source_conflict','The catalog source changed during import.',503);
 return saved;
}
async function freezeOffer(env,item,meta,state){
 const prepared=await prepareCheckout(inner(env,'/api/checkout-link',{requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,mockupId:state.mockupId,design:state.design,confirmDesign:true}),env,{});
 if(prepared instanceof Response)throw fault('seed_approval','The product preview could not be frozen.',503);
 const record=prepared.checkoutApproval,task=await read(env,`mockups/${meta.requestId}/${item.sku}/${state.mockupId}/task.json`);
 if(!task?.taskKey||task.status!=='completed'||record.approvalMode!=='product-mockup')throw fault('seed_proof','A completed supplier proof is required.',503);
 const sourceObject=await env.ARTWORK.get(record.snapshotKey),encoded=await sourceObject.text();
 if(await hash(encoded)!==record.sourceHash)throw fault('seed_source_changed','The approved source changed.',503);
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0)),area={width:record.position.area_width,height:record.position.area_height};
 const info=await env.IMAGES.info(new Blob([bytes],{type:meta.previewMime}).stream());
 // Starter assortment is mugs only: source height exceeds the supplier's native
 // print-area height. Larger products cannot silently reuse this small master.
 if(FULFILLMENT[item.sku].product!=='Mug'||info.height<area.height||info.width<area.height)throw fault('seed_resolution','This design needs a larger master for this product.',503);
 const composed=await composeProductLayout(env,bytes,info,area,FULFILLMENT[item.sku],record.design,4096);
 const finalHash=await hashBytes(composed.bytes),mime=composed.mime||'image/jpeg';
 if(mime!=='image/jpeg'||composed.bytes[0]!==255||composed.bytes[1]!==216)throw fault('seed_printfile','The locked print file is invalid.',503);
 const finalKey=`shop/printfiles/${item.id}/${finalHash}.jpg`,placementHash=await hash(JSON.stringify(record.position));
 await env.ARTWORK.put(finalKey,composed.bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:mime}});
 const premadePrint={key:finalKey,sha256:finalHash,mime,sku:item.sku,sourceHash:record.sourceHash,proofHash:record.proofHash,placementHash,artworkRevision:SEED_DESIGN.sha256};
 const full=await change(env,`commerce/preapprovals/${record.token}.json`,null,old=>{
  if(!old||old.sourceHash!==record.sourceHash||old.proofHash!==record.proofHash)throw fault('seed_approval_changed','The frozen product approval changed.',503);
  if(old.premadePrint&&JSON.stringify(old.premadePrint)!==JSON.stringify(premadePrint))throw fault('seed_print_changed','This print file needs review.',503);
  return {...old,premadePrint};
 });
 const mockupUrl=prepared.approvedPreview.imageUrl,proof={provider:'printful',approved:true,artworkRevision:SEED_DESIGN.sha256,printfulVariantId:FULFILLMENT[item.sku].printfulVariantId,printFileHash:finalHash,placementHash,taskId:String(task.taskKey),checkedAt:now()};
 const offer={...item,designId:SEED_DESIGN.id,occasion:SEED_DESIGN.occasion,pet:SEED_DESIGN.pet,breed:SEED_DESIGN.breed,product:'mug',variantId:prepared.row.variantId,priceCents:Math.round(Number(prepared.row.price)*100),currency:'USD',status:'verified',artworkRevision:SEED_DESIGN.sha256,artworkKey:`shop/masters/${SEED_DESIGN.id}/${SEED_DESIGN.sha256}.png`,requestId:meta.requestId,sourceHash:record.sourceHash,proofHash:record.proofHash,mockupId:record.mockupId,approvalToken:record.token,approvalRecordHash:await hash(JSON.stringify(full)),mockupUrl,proof};
 await env.ARTWORK.put(`shop/proofs/${item.id}.json`,JSON.stringify({...proof,mockupUrl}));
 return {id:item.id,status:'ready_for_review',title:item.title,variantLabel:item.variantLabel,offer,views:prepared.approvedPreview.images,preparedAt:now()};
}
async function publishReviewed(env,item,state){
 const review=REVIEWED_SEED_PROOFS[item.id];if(!review)return;
 const signature=await hash(JSON.stringify([state.offer.approvalRecordHash,state.offer.proofHash,state.offer.proof.printFileHash,state.offer.proof.placementHash]));
 if(review!==signature)throw fault('seed_review_changed','The inspected product proof has changed.',503);
 await resolveShopOffer(env,item.id,state.offer.artworkRevision,{catalog:{version:1,offers:[state.offer]}});
 await change(env,SHOP_CATALOG_KEY,{version:1,revision:0,offers:[]},catalog=>{
  const old=catalog.offers.find(x=>x.id===item.id);if(old&&JSON.stringify(old)!==JSON.stringify(state.offer))throw fault('seed_offer_conflict','A published gift with this identity already exists.',503);
  return old?catalog:{...catalog,revision:catalog.revision+1,offers:[...catalog.offers,state.offer]};
 });
 await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'published',publishedAt:now()}));
}
export async function runShopSeed(env){
 if(env.PREMADE_SEED_ENABLED!=='true'||!env.ARTWORK||!env.ASSETS)return {enabled:false};
 const lock='shop/preparation/v1/migration.lock',old=await env.ARTWORK.get(lock);
 if(old&&Date.parse((await old.json()).until)>Date.now())return {busy:true};
 const locked=await env.ARTWORK.put(lock,JSON.stringify({until:new Date(Date.now()+180000).toISOString()}),{onlyIf:old?{etagMatches:old.etag}:new Headers({'If-None-Match':'*'})});if(!locked)return {busy:true};
 try{
  for(const item of SEED_ITEMS){
   let state=await read(env,key(item.id));if(state?.status==='published'||state?.status==='needs_review')continue;
   try{
    if(state?.status==='ready_for_review'){await publishReviewed(env,item,state);continue;}
    const meta=await source(env),design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
    if(!state){
     state={id:item.id,status:'creating_preview',startedAt:now()};
     if(!await env.ARTWORK.put(key(item.id),JSON.stringify(state),{onlyIf:new Headers({'If-None-Match':'*'})}))continue;
     const response=await createMockup(inner(env,'/api/mockup/create',{requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,design}),env),data=await response.json();
     if(!response.ok||!data.ok||!data.mockupId)throw fault('seed_preview','The supplier preview could not be confirmed; no automatic recreation.',503);
     await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'pending_preview',mockupId:data.mockupId,design,polls:0}));continue;
    }
    if(state.status!=='pending_preview')throw fault('seed_uncertain','The previous preview attempt needs review before retrying.',503);
    if(state.polls>=20)throw fault('seed_preview_timeout','The supplier preview did not complete in its bounded polling window.',503);
    const query=new URLSearchParams({requestId:meta.requestId,token:meta.accessToken,sku:item.sku,mockup:state.mockupId});
    const response=await mockupStatus(inner(env,'/api/mockup/status?'+query),env),data=await response.json();
    if(!response.ok||!data.ok)throw fault('seed_preview_failed','The supplier preview needs review.',503);
    if(data.status!=='completed'){await env.ARTWORK.put(key(item.id),JSON.stringify({...state,polls:state.polls+1}));continue;}
    await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'freezing_preview'}));
    await env.ARTWORK.put(key(item.id),JSON.stringify(await freezeOffer(env,item,meta,state)));
   }catch(error){await env.ARTWORK.put(key(item.id),JSON.stringify({...state,id:item.id,status:'needs_review',code:error.code||'seed_failed',message:String(error.message||'Catalog preparation failed').slice(0,180),checkedAt:now()}));}
  }
  return {enabled:true};
 }finally{await env.ARTWORK.delete(lock);}
}
export async function shopPreparationStatus(env){
 const items=[];for(const item of SEED_ITEMS){const state=await read(env,key(item.id));items.push({id:item.id,title:item.title,variantLabel:item.variantLabel,status:state?.status||'not_started',code:state?.code||null,...(state?.offer?{views:state.views,previewUrl:state.offer.mockupUrl,reviewSignature:await hash(JSON.stringify([state.offer.approvalRecordHash,state.offer.proofHash,state.offer.proof.printFileHash,state.offer.proof.placementHash]))}: {})});}
 return {enabled:env.PREMADE_SEED_ENABLED==='true',items};
}
