// Source-pinned, owner-directed Christmas Village pet mug expansion.
// Generates SUPPLIER MOCKUP REVIEWS only; no order, charge, checkout or fulfillment.
// Publication requires exact reviewed proof signatures in the source allow-list.
import {read,hash,randomToken,change,fault,recommendedCheckoutDesign,composeProductLayout} from './commerce-store.js';
import {moderateContent} from './content-safety.js';
import {FULFILLMENT,prepareCheckout} from './entry.js';
import {createMockup,mockupStatus} from './workflow.js';
import {hashBytes,SHOP_CATALOG_KEY,resolveShopOffer} from './shop-catalog-store.js';

export const EXPANSION_DESIGNS=Object.freeze([
  {
    "id": "christmas-village-golden-retriever",
    "requestId": "RC-SHOP-GOLDEN-RETRIEVER-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-golden-retriever-art-20261103.png?v=1793743769",
    "sha256": "582bc22115b2475f2ec6e15d4198c2071a69729dc619695dcaa23a1396e89137",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Golden Retriever",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-labrador-retriever",
    "requestId": "RC-SHOP-LABRADOR-RETRIEVER-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-labrador-retriever-art-20261103.png?v=1793743824",
    "sha256": "cc1f562f615f63cac4748f78bf091bc05bfdc8e9c9118007cc01176d30a91b0e",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Labrador Retriever",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-german-shepherd",
    "requestId": "RC-SHOP-GERMAN-SHEPHERD-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-german-shepherd-art-20261103.png?v=1793743831",
    "sha256": "db4d5801ca9cdb62f47022ae1ab0bc4f99cfcf0a4e983fa6d749c473e4b030d0",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "German Shepherd",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-french-bulldog",
    "requestId": "RC-SHOP-FRENCH-BULLDOG-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-french-bulldog-art-20261103.png?v=1793743838",
    "sha256": "f70ecbf69db44fbb8cabad1a29137bca024e9d07c72777404c82565f19cbfb92",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "French Bulldog",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-beagle",
    "requestId": "RC-SHOP-BEAGLE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-beagle-art-20261103.png?v=1793743845",
    "sha256": "f6c066a9cc15124126d37cc173df7c4a2df6a20c7522efc59e57df4e9a5a9c24",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Beagle",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-poodle",
    "requestId": "RC-SHOP-POODLE-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-poodle-art-20261103.png?v=1793743853",
    "sha256": "26aa77ff72df8e01b48c2fd5e22a6890b62e4398177327eda66feb056240e6e6",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Poodle",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-husky",
    "requestId": "RC-SHOP-HUSKY-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-husky-art-20261103.png?v=1793743860",
    "sha256": "de90e9ead88b054f344dcaeab20169d3efb92e35bdc9046bea8d9638ad994cd4",
    "width": 1254,
    "height": 1254,
    "pet": "dog",
    "breed": "Siberian Husky",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-siamese-cat",
    "requestId": "RC-SHOP-SIAMESE-CAT-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-siamese-cat-art-20261103.png?v=1793743866",
    "sha256": "84608cef086ab9acc4c585a3ce7d731f436d225ef0051d6e142ddb34d8671ece",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Siamese",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-orange-tabby",
    "requestId": "RC-SHOP-ORANGE-TABBY-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-orange-tabby-art-20261103.png?v=1793743872",
    "sha256": "3148db65251b1a10418ef54d1e21d749512f245ef20a36c895c34512169d1492",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Orange Tabby",
    "occasion": "christmas"
  },
  {
    "id": "christmas-village-tuxedo-cat",
    "requestId": "RC-SHOP-TUXEDO-CAT-V1",
    "asset": "https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-village-tuxedo-cat-art-20261103.png?v=1793743880",
    "sha256": "ec8bb18f88673696238e9183d743debc47c7763402d7c843bd1514e864ddd7f3",
    "width": 1254,
    "height": 1254,
    "pet": "cat",
    "breed": "Tuxedo",
    "occasion": "christmas"
  }
]);
export const EXPANSION_ITEMS=Object.freeze(EXPANSION_DESIGNS.flatMap(d=>[
 {id:d.id.replace(/^christmas-/,'')+'-mug-11oz',designId:d.id,sku:'RECAST-MUG-11OZ',title:d.breed+' Christmas Village Mug',variantLabel:'White glossy · 11 oz'},
 {id:d.id.replace(/^christmas-/,'')+'-mug-15oz',designId:d.id,sku:'RECAST-MUG-15OZ',title:d.breed+' Christmas Village Large Mug',variantLabel:'White glossy · 15 oz'}
]));
const byDesign=new Map(EXPANSION_DESIGNS.map(d=>[d.id,d]));
// DO NOT add a proof hash until both Printful image and frozen print placement
// have been independently inspected and compared to the pinned source artwork.
export const REVIEWED_EXPANSION_PROOFS=Object.freeze({});

const key=id=>`shop/preparation/v2/${id}.json`;
const now=()=>new Date().toISOString();
const base=env=>String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||'https://recastmeai.com').replace(/\/$/,'');
const inner=(env,path,body)=>new Request(base(env)+path,{method:body?'POST':'GET',headers:{'x-recast-request':'1',origin:base(env),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
const b64=bytes=>{let out='';for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(out);};
async function source(env,design){
 const meta=await read(env,`requests/${design.requestId}/request.json`);
 if(meta){if(meta.source!=='premade-catalog'||meta.catalogDesignId!==design.id||meta.catalogMasterHash!==design.sha256)throw fault('seed_identity','The catalog source needs review.',503);return meta;}
 const claim=`shop/preparation/v2/source-${design.id}.claim`;
 if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('seed_source_pending','The original catalog import needs review before retrying.',503);
 if(!design.asset.startsWith('https://cdn.shopify.com/s/files/1/0854/3810/3796/files/'))throw fault('seed_asset','The source URL is not from the approved Recast Me media library.',503);
 const response=await fetch(design.asset,{redirect:'error'});
 if(!response.ok)throw fault('seed_asset','The approved catalog artwork could not load.',503);
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(await hashBytes(bytes)!==design.sha256)throw fault('seed_asset_changed','The catalog artwork does not match its approved source.',503);
 const info=await env.IMAGES.info(new Blob([bytes],{type:'image/png'}).stream());
 if(info.width!==design.width||info.height!==design.height)throw fault('seed_dimensions','The catalog artwork dimensions changed.',503);
 const notes=`Original fictional ${design.breed} Christmas Village — premade catalog`,text=notes+' ';
 const screened=await moderateContent(env,{text,images:[new File([bytes],design.id+'.png',{type:'image/png'})],required:true});
 const encoded=b64(bytes),createdAt=now(),requestId=design.requestId;
 const saved={requestId,accessToken:randomToken(),previewMime:'image/png',source:'premade-catalog',catalogDesignId:design.id,catalogMasterHash:design.sha256,catalogRightsConfirmedAt:createdAt,contentSafety:screened,notes,styleId:'christmas',styleName:'Christmas Village',subjectType:'pet',qualityMode:'original',modelUsed:null,status:'preview_ready',paid:false,fulfillment:'not_started',createdAt,updatedAt:createdAt,width:info.width,height:info.height};
 await env.ARTWORK.put(`shop/masters/${design.id}/${design.sha256}.png`,bytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'image/png'}});
 await env.ARTWORK.put(`requests/${requestId}/preview.b64`,encoded,{onlyIf:new Headers({'If-None-Match':'*'})});
 await env.ARTWORK.put(`security/content-screening/${requestId}.json`,JSON.stringify({...screened,hash:await hash(encoded+'|'+text)}));
 const stored=await env.ARTWORK.put(`requests/${requestId}/request.json`,JSON.stringify(saved),{onlyIf:new Headers({'If-None-Match':'*'})});
 if(!stored)throw fault('seed_source_conflict','The catalog source changed during import.',503);
 return saved;
}
async function freezeOffer(env,item,meta,state,design){
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
 const premadePrint={key:finalKey,sha256:finalHash,mime,sku:item.sku,sourceHash:record.sourceHash,proofHash:record.proofHash,placementHash,artworkRevision:design.sha256};
 const full=await change(env,`commerce/preapprovals/${record.token}.json`,null,old=>{
  if(!old||old.sourceHash!==record.sourceHash||old.proofHash!==record.proofHash)throw fault('seed_approval_changed','The frozen product approval changed.',503);
  if(old.premadePrint&&JSON.stringify(old.premadePrint)!==JSON.stringify(premadePrint))throw fault('seed_print_changed','This print file needs review.',503);
  return {...old,premadePrint};
 });
 const mockupUrl=prepared.approvedPreview.imageUrl,proof={provider:'printful',approved:true,artworkRevision:design.sha256,printfulVariantId:FULFILLMENT[item.sku].printfulVariantId,printFileHash:finalHash,placementHash,taskId:String(task.taskKey),checkedAt:now()};
 const offer={...item,designId:design.id,occasion:design.occasion,pet:design.pet,breed:design.breed,product:'mug',variantId:prepared.row.variantId,priceCents:Math.round(Number(prepared.row.price)*100),currency:'USD',status:'verified',artworkRevision:design.sha256,artworkKey:`shop/masters/${design.id}/${design.sha256}.png`,requestId:meta.requestId,sourceHash:record.sourceHash,proofHash:record.proofHash,mockupId:record.mockupId,approvalToken:record.token,approvalRecordHash:await hash(JSON.stringify(full)),mockupUrl,proof};
 await env.ARTWORK.put(`shop/proofs/${item.id}.json`,JSON.stringify({...proof,mockupUrl}));
 return {id:item.id,status:'ready_for_review',title:item.title,variantLabel:item.variantLabel,offer,views:prepared.approvedPreview.images,preparedAt:now()};
}
async function publishReviewed(env,item,state){
 const expected=REVIEWED_EXPANSION_PROOFS[item.id];
 if(!expected||!state.offer)return false;
 const signature=await hash(JSON.stringify([state.offer.approvalRecordHash,state.offer.proofHash,state.offer.proof.printFileHash,state.offer.proof.placementHash]));
 if(signature!==expected)throw fault('expansion_review_changed','The exact approved print proof changed. No publication.',503);
 await resolveShopOffer(env,item.id,state.offer.artworkRevision,{catalog:{version:1,offers:[state.offer]}});
 await change(env,SHOP_CATALOG_KEY,{version:1,revision:0,offers:[]},catalog=>{
  const previous=catalog.offers.find(o=>o.id===item.id);
  if(previous&&JSON.stringify(previous)!==JSON.stringify(state.offer))throw fault('expansion_offer_conflict','The published offer needs manual review.',503);
  return previous?catalog:{...catalog,revision:catalog.revision+1,offers:[...catalog.offers,state.offer]};
 });
 await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'published',publishedAt:now()}));
 return true;
}

export async function runShopExpansion(env){
 if(env.PREMADE_EXPANSION_ENABLED!=='true'||!env.ARTWORK||!env.IMAGES)return {enabled:false};
 const lock='shop/preparation/v2/expansion.lock',existing=await env.ARTWORK.get(lock);
 if(existing&&Date.parse((await existing.json()).until)>Date.now())return {busy:true};
 const locked=await env.ARTWORK.put(lock,JSON.stringify({until:new Date(Date.now()+180000).toISOString()}),{onlyIf:existing?{etagMatches:existing.etag}:new Headers({'If-None-Match':'*'})});
 if(!locked)return {busy:true};
 let created=0,polled=0,ready=0;
 try{
  for(const item of EXPANSION_ITEMS){
   const design=byDesign.get(item.designId);
   let state=await read(env,key(item.id));
   if(state?.status==='published'||state?.status==='needs_review')continue;
   if(state?.status==='ready_for_review'){
    try{if(await publishReviewed(env,item,state))ready++;}
    catch(error){await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'needs_review',code:error.code||'expansion_review',message:String(error.message).slice(0,180),checkedAt:now()}));}
    continue;
   }
   if(!state&&created>=2)continue;
   if(state?.status==='pending_preview'&&polled>=6)continue;
   try{
    const meta=await source(env,design),layout=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
    if(!state){
     state={id:item.id,status:'creating_preview',startedAt:now()};
     if(!await env.ARTWORK.put(key(item.id),JSON.stringify(state),{onlyIf:new Headers({'If-None-Match':'*'})}))continue;
     created++;
     const response=await createMockup(inner(env,'/api/mockup/create',{requestId:meta.requestId,accessToken:meta.accessToken,sku:item.sku,design:layout}),env);
     const data=await response.json();
     if(!response.ok||!data.ok||!data.mockupId)throw fault('expansion_preview','Supplier preview creation needs review; no automatic recreation.',503);
     await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'pending_preview',mockupId:data.mockupId,design:layout,polls:0}));
     continue;
    }
    if(state.status!=='pending_preview')throw fault('expansion_uncertain','Uncertain supplier task; manual review required.',503);
    if(state.polls>=20)throw fault('expansion_timeout','Supplier preview poll limit reached.',503);
    polled++;
    const query=new URLSearchParams({requestId:meta.requestId,token:meta.accessToken,sku:item.sku,mockup:state.mockupId});
    const response=await mockupStatus(inner(env,'/api/mockup/status?'+query),env),data=await response.json();
    if(!response.ok||!data.ok)throw fault('expansion_poll','Supplier preview could not be confirmed.',503);
    if(data.status!=='completed'){await env.ARTWORK.put(key(item.id),JSON.stringify({...state,polls:state.polls+1}));continue;}
    await env.ARTWORK.put(key(item.id),JSON.stringify({...state,status:'freezing_preview'}));
    await env.ARTWORK.put(key(item.id),JSON.stringify(await freezeOffer(env,item,meta,state,design)));
    ready++;
   }catch(error){
    await env.ARTWORK.put(key(item.id),JSON.stringify({...state,id:item.id,status:'needs_review',code:error.code||'expansion_failed',message:String(error.message||'Preview preparation failed').slice(0,180),checkedAt:now()}));
   }
  }
  return {enabled:true,created,polled,ready};
 }finally{await env.ARTWORK.delete(lock);}
}
export async function shopExpansionStatus(env){
 const items=[];
 for(const item of EXPANSION_ITEMS){
  const state=await read(env,key(item.id));
  const offer=state?.offer;
  items.push({id:item.id,designId:item.designId,title:item.title,variantLabel:item.variantLabel,status:state?.status||'not_started',code:state?.code||null,
   ...(offer?{views:state.views,previewUrl:offer.mockupUrl,reviewSignature:await hash(JSON.stringify([offer.approvalRecordHash,offer.proofHash,offer.proof.printFileHash,offer.proof.placementHash]))}:{})});
 }
 return {enabled:env.PREMADE_EXPANSION_ENABLED==='true',items};
}
