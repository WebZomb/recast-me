import {loadV2MockupSpec,v2MockupPayload,v2CreatedTask,v2PolledTask} from './printful-v2-mockup.js';
import {prepareApparelArtwork} from './apparel-finish.js';
import {selectMockupGroups,rankMockupCandidates} from './product-gallery.js';
import {printfulReferenceForNewDraft} from './printful-reference.js';
import {verifiedLegacyEmptyStoreForRecovery} from './printful-diagnostics.js';
import {RM054_PRODUCT_CANDIDATES} from './rm054-product-candidates.js';
import { FULFILLMENT } from "./entry.js";
import { runSocialPipeline, socialReadiness } from './social.js';
import { renderHealth } from './render-health.js';
import { change, hash, fault, sameOrigin, privateJson, normalizeProductDesign, productPrintfile, composeMugLayout, composeProductLayout } from './commerce-store.js';
import { reconcileOrderCredits, orderEligible, creditsEnabled, walletFor, creditBalance } from './render-credits.js';
import { designFor, publicDesign, customerDesignAction, approvedDesign, finishApprovedDesign, printDesignFile } from './order-approval.js';
import { SYNC_ORDERS_QUERY, VERIFY_ORDER_QUERY } from './order-queries.js';

const X_API = "https://api.x.com/2";
const PRINTFUL_API = "https://api.printful.com";

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function now(){return new Date().toISOString()}
function randomHex(byteCount=18){const bytes=new Uint8Array(byteCount);crypto.getRandomValues(bytes);return[...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function requestKey(id,suffix){return `requests/${id}/${suffix}`}
function jobKey(id){return `jobs/${id}.json`}
function mockupDesignId(design){return sanitizeId(`v${design?.version||1}-${design?.product||'Generic'}-${design?.layout||'fit'}-${design?.fill||design?.background||'none'}-studio2-${design?.x||'center'}-${design?.scale||100}-${design?.spacing||'standard'}${design?.finish?'-'+design.finish:''}`)}
function mockupKey(id,sku,mockupId="legacy"){return mockupId==="legacy"?`mockups/${id}/${sku}/task.json`:`mockups/${id}/${sku}/${sanitizeId(mockupId)}/task.json`}
function socialKey(id){return `social/x/${id}.json`}
function trendKey(id){return `trends/${id}.json`}
function sanitizeId(value){return String(value||"").replace(/[^a-zA-Z0-9._-]+/g,"-").slice(0,180)}

async function readJson(env,key){
  const obj=await env.ARTWORK?.get(key);
  if(!obj)return null;
  try{return await obj.json()}catch{return null}
}
async function putJson(env,key,value){
  if(!env.ARTWORK)throw new Error("Private storage is not configured.");
  await env.ARTWORK.put(key,JSON.stringify(value),{httpMetadata:{contentType:"application/json"}});
}
async function listJson(env,prefix,limit=100){
  if(!env.ARTWORK)return[];
  const result=await env.ARTWORK.list({prefix,limit});
  const rows=[];
  for(const object of result.objects){
    const value=await readJson(env,object.key);
    if(value)rows.push(value);
  }
  return rows;
}
function decodeBase64(input){
  const clean=String(input||"").replace(/\s+/g,"");
  const bin=atob(clean);const out=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);
  return out;
}
function bearer(request){
  const h=request.headers.get("authorization")||"";
  const m=h.match(/^Bearer\s+(.+)$/i);return m?.[1]||request.headers.get("x-recast-admin")||"";
}
function safeEqual(a,b){
  a=String(a||"");b=String(b||"");if(!a||a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;
}
export function requireAdmin(request,env){
  if(!env.ADMIN_TOKEN)throw Object.assign(new Error("Admin access is not configured yet."),{status:503});
  if(!safeEqual(bearer(request),env.ADMIN_TOKEN))throw Object.assign(new Error("Admin authorization required."),{status:401});
}

async function requestMeta(env,requestId){return readJson(env,requestKey(requestId,"request.json"))}
async function requireRequest(env,requestId,token){
  const meta=await requestMeta(env,requestId);
  if(!meta)throw Object.assign(new Error("Artwork request not found."),{status:404});
  if(!safeEqual(meta.accessToken,token))throw Object.assign(new Error("Invalid artwork access token."),{status:403});
  return meta;
}
async function approvedPreviewMeta(env,proofToken){
  const token=String(proofToken||"");
  if(!/^[a-f0-9]{48}$/.test(token))return null;
  return readJson(env,`commerce/checkout-previews/${token}.json`);
}
async function requireOrderCapability(env,requestId,token,proofToken){
  if(proofToken){
    const proof=await approvedPreviewMeta(env,proofToken);
    if(!proof||proof.requestId!==requestId)throw Object.assign(new Error("Invalid private order link."),{status:403});
    const meta=await requestMeta(env,requestId);
    if(!meta)throw Object.assign(new Error("Artwork request not found."),{status:404});
    return meta;
  }
  return requireRequest(env,requestId,token);
}
async function ensurePrintToken(env,meta){
  if(meta.printAccessToken)return meta;
  meta.printAccessToken=randomHex(28);meta.updatedAt=now();
  await putJson(env,requestKey(meta.requestId,"request.json"),meta);
  return meta;
}
function appBase(env,request){return String(env.PUBLIC_APP_URL||new URL(request.url).origin).replace(/\/$/,"")}

function printfulHeaders(env,extra={}){
  const headers={Authorization:`Bearer ${env.PRINTFUL_API_TOKEN}`,...extra};
  if(env.PRINTFUL_STORE_ID)headers["X-PF-Store-ID"]=String(env.PRINTFUL_STORE_ID);
  return headers;
}
async function printful(env,path,options={}){
  if(!env.PRINTFUL_API_TOKEN)throw Object.assign(new Error("Printful is not connected."),{status:503,code:"printful_binding_missing"});
  const response=await fetch(`${PRINTFUL_API}${path}`,{
    ...options,
    headers:printfulHeaders(env,options.headers||{})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data?.code&&data.code>=400){
    const msg=data?.error?.message||data?.result||`Printful HTTP ${response.status}`;
    throw Object.assign(new Error(typeof msg==="string"?msg:JSON.stringify(msg)),{status:502,printfulStatus:response.status});
  }
  return data.result??data;
}

export async function printfulHealth(env){
  const base={secretConfigured:Boolean(env.PRINTFUL_API_TOKEN),storeScopeConfigured:Boolean(env.PRINTFUL_STORE_ID),workerVersionId:env.CF_VERSION_METADATA?.id||null};
  try{
    await printful(env,"/mockup-generator/printfiles/19",{method:"GET"});
    return json({ok:true,...base,providerReachable:true});
  }catch(error){
    return json({ok:false,...base,providerReachable:false,providerStatus:error.printfulStatus||null},error.status||503);
  }
}

export async function servePrintSource(request,env,requestId){
  const url=new URL(request.url);const token=url.searchParams.get("token")||"";
  const meta=await requestMeta(env,requestId);
  if(!meta||!safeEqual(meta.printAccessToken,token))return new Response("Not found",{status:404});
  const wantsFinal=url.searchParams.get("final")==="1";
  if(wantsFinal){
    const finalObject=await env.ARTWORK?.get(requestKey(requestId,"final-print.jpg"));
    if(!finalObject)return new Response("Print-ready artwork not prepared",{status:404});
    return new Response(finalObject.body,{headers:{"content-type":"image/jpeg","cache-control":"private, max-age=300","x-content-type-options":"nosniff"}});
  }
  const object=await env.ARTWORK?.get(requestKey(requestId,"preview.b64"));
  if(!object)return new Response("Not found",{status:404});
  const bytes=decodeBase64(await object.text());
  return new Response(bytes,{headers:{"content-type":meta.previewMime||"image/jpeg","cache-control":"private, max-age=300","x-content-type-options":"nosniff"}})
}

export async function serveMockupSource(request,env,requestId,sku,layoutId){
  const url=new URL(request.url),token=url.searchParams.get('token')||'';
  const meta=await requestMeta(env,requestId);
  if(!meta||!safeEqual(meta.printAccessToken,token))return new Response('Not found',{status:404});
  const object=await env.ARTWORK?.get(`mockup-sources/${requestId}/${sku}/${layoutId}.jpg`);
  if(!object)return new Response('Not found',{status:404});
  return new Response(object.body,{headers:{'content-type':'image/jpeg','cache-control':'private, max-age=300','x-content-type-options':'nosniff'}});
}

export function mockupPosition(catalog, variantId, placement, size, rawDesign=null){
  const variant=catalog.variant_printfiles?.find(v=>Number(v.variant_id)===Number(variantId));
  const file=catalog.printfiles?.find(f=>Number(f.printfile_id)===Number(variant?.placements?.[placement]));
  const raw=rawDesign||size?.design||{};
  const design=normalizeProductDesign({product:size?.product||raw?.product||'Generic'},raw);
  const areaWidth=Number(file?.width),areaHeight=Number(file?.height),sourceWidth=Number(size?.width),sourceHeight=Number(size?.height);
  if(!file || ![areaWidth,areaHeight,sourceWidth,sourceHeight].every(n=>Number.isFinite(n)&&n>0))throw fault('print_area_missing','Printful print dimensions are unavailable for this variant.',502);
  if(Number(design.version)>=4||['scene-fill','full-bleed','ambient','dark','light'].includes(size?.design?.background))return {area_width:areaWidth,area_height:areaHeight,width:areaWidth,height:areaHeight,top:0,left:0};
  const scale=Math.min(areaWidth/sourceWidth,areaHeight/sourceHeight)*(design.scale/100);
  const width=Math.max(1,Math.floor(sourceWidth*scale)),height=Math.max(1,Math.floor(sourceHeight*scale));
  const center=design.x==='left'?0.25:design.x==='right'?0.75:0.5;
  return {area_width:areaWidth,area_height:areaHeight,width,height,top:Math.floor((areaHeight-height)/2),left:Math.floor(areaWidth*center-width/2)};
}

export async function createMockup(request,env){
  let stage="request";
  try{
    const body=await request.json().catch(()=>({}));
    const requestId=String(body.requestId||"");const accessToken=String(body.accessToken||"");const sku=String(body.sku||"");
    stage="artwork-access";
    let meta=await requireRequest(env,requestId,accessToken);
    const map=FULFILLMENT[sku]; // product layout is normalized after SKU validation
    if(!map)return json({ok:false,error:"Unknown Recast product."},400);
    if(map.digital)return json({ok:false,error:"Digital products do not need a physical mockup."},400);
    if(!map.printfulProductId||!map.printfulVariantId)return json({ok:false,error:"This product is not mapped to Printful yet."},500);
    const design=normalizeProductDesign(map,body.design||{});
    stage="print-token";
    meta=await ensurePrintToken(env,meta);
    let sourceUrl=`${appBase(env,request)}/api/print-source/${encodeURIComponent(requestId)}?token=${encodeURIComponent(meta.printAccessToken)}`;
    stage="artwork-source";
    const savedSource=await env.ARTWORK.get(requestKey(requestId,'preview.b64'));
    if(!savedSource)throw fault('artwork_missing','The saved artwork is unavailable.',404);
    const savedBase64=await savedSource.text(),sourceHash=await hash(savedBase64+'|'+JSON.stringify(design));
    const mockupId=mockupDesignId(design);
    const existing=await readJson(env,mockupKey(requestId,sku,mockupId));
    if(existing?.sourceHash===sourceHash&&existing.position&&['completed','pending'].includes(existing.status))return json({ok:true,status:existing.status,taskKey:existing.taskKey,sku,mockupId,design:existing.design||design,waitSeconds:10});
    if(!env.IMAGES)throw fault('images_required','Image processing is not configured.',503);
    stage="image-info";
    const size=await env.IMAGES.info(new Blob([decodeBase64(savedBase64)]).stream());size.design=design;size.product=map.product;
    const placement=map.preferredPlacement||'default';
    stage="printful-catalog";
    let catalog={},position,v2Spec=null;
    try{
      catalog=await printful(env,`/mockup-generator/printfiles/${map.printfulProductId}`,{method:'GET'});
      position=mockupPosition(catalog,map.printfulVariantId,placement,size);
    }catch(error){
      if(map.product!=='Tumbler'||!(error.code==='print_area_missing'||error.printfulStatus===404))throw error;
      stage='printful-v2-catalog';
      v2Spec=await loadV2MockupSpec((path,options)=>printful(env,path,options),map);
      position=v2Spec.position;
    }
    if(Number(design.version)>=4||design.background==='scene-fill'){
      const q=new URLSearchParams({
        token:meta.printAccessToken,product:design.product||map.product,layout:design.layout,
        fill:design.fill||design.background||'ambient',x:design.x,scale:String(design.scale),
        spacing:design.spacing||'standard',areaWidth:String(position.area_width),areaHeight:String(position.area_height)
      });
      q.set('version',String(design.version));if(design.finish)q.set('finish',design.finish);
      sourceUrl=`${appBase(env,request)}/api/print-source/${encodeURIComponent(requestId)}?${q}`;
    }
    if(design.version===5)await prepareApparelArtwork(env,decodeBase64(savedBase64),design.finish,{allowCreate:true});
    const groups=selectMockupGroups(catalog,map.product);
    const payload={...(groups.length?{option_groups:groups}:{}),variant_ids:[map.printfulVariantId],format:"jpg",width:1200,files:[{placement,image_url:sourceUrl,position}]};
    stage="printful-create-task";
    const result=v2Spec?v2CreatedTask(await printful(env,'/v2/mockup-tasks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(v2MockupPayload(map,v2Spec,sourceUrl))})):await printful(env,`/mockup-generator/create-task/${map.printfulProductId}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    if(!result.task_key)throw fault('mockup_task_missing','Printful did not return a preview task. Please try again later.',502);
    const record={...(v2Spec?{providerApi:'v2',v2Spec}:{}),requestId,sku,mockupId,sourceHash,design,position,taskKey:result.task_key,status:result.status||"pending",createdAt:now(),updatedAt:now(),mockupAccessToken:randomHex(24),sourceUrl,printfulProductId:map.printfulProductId,printfulVariantId:map.printfulVariantId};
    await putJson(env,mockupKey(requestId,sku,mockupId),record);
    return json({ok:true,status:record.status,taskKey:record.taskKey,sku,mockupId,design:record.design,waitSeconds:10});
  }catch(error){
    return json({ok:false,error:error?.message||String(error),reason:error?.code||null,providerStatus:error?.printfulStatus||null,stage,workerVersionId:env.CF_VERSION_METADATA?.id||null},error.status||500)
  }
}

async function persistMockups(env,record,result,request){
  const urls=[];let index=0;
  const candidates=[];
  for(const mockup of result.mockups||[]){
    if(mockup.mockup_url)candidates.push({url:mockup.mockup_url,title:mockup.display_name||mockup.placement||"Mockup",group:mockup.option_group||""});
    for(const extra of mockup.extra||[])if(extra.url)candidates.push({url:extra.url,title:extra.title||extra.option||"Mockup",group:extra.option_group||''});
  }
  for(const item of rankMockupCandidates(candidates,FULFILLMENT[record.sku]?.product).slice(0,4)){
    const response=await fetch(item.url);
    if(!response.ok)continue;
    const bytes=await response.arrayBuffer();
    const folder=record.mockupId?`mockups/${record.requestId}/${record.sku}/${record.mockupId}`:`mockups/${record.requestId}/${record.sku}`;
    const key=`${folder}/image-${index}.jpg`;
    await env.ARTWORK.put(key,bytes,{httpMetadata:{contentType:"image/jpeg"}});
    const query=new URLSearchParams({token:record.mockupAccessToken});if(record.mockupId)query.set('mockup',record.mockupId);
    urls.push({title:item.title,group:item.group||'',url:`${appBase(env,request)}/api/mockup/image/${encodeURIComponent(record.requestId)}/${encodeURIComponent(record.sku)}/${index}?${query}`});
    index++;
  }
  if(!urls.length)throw fault('mockup_images_missing','The product preview images are not available yet.',502);
  record.images=urls;record.status="completed";record.updatedAt=now();
  await putJson(env,mockupKey(record.requestId,record.sku,record.mockupId||"legacy"),record);
  return record;
}

export async function mockupStatus(request,env){
  try{
    const url=new URL(request.url);const requestId=String(url.searchParams.get("requestId")||"");const token=String(url.searchParams.get("token")||"");const sku=String(url.searchParams.get("sku")||"");const mockupId=String(url.searchParams.get("mockup")||"legacy");
    await requireRequest(env,requestId,token);
    let record=await readJson(env,mockupKey(requestId,sku,mockupId));
    if(!record)return json({ok:false,error:"Mockup task not found."},404);
    if(record.status==="completed"&&record.images?.length)return json({ok:true,status:"completed",images:record.images,position:record.position,design:record.design||null});
    const result=record.providerApi==='v2'?v2PolledTask(await printful(env,`/v2/mockup-tasks?id=${encodeURIComponent(record.taskKey)}`,{method:'GET'}),record):await printful(env,`/mockup-generator/task?task_key=${encodeURIComponent(record.taskKey)}`,{method:"GET"});
    if(result.status==="failed"){
      record.status="failed";record.error=result.error||"Printful could not generate this mockup.";record.updatedAt=now();await putJson(env,mockupKey(requestId,sku,mockupId),record);
      return json({ok:false,status:"failed",error:record.error},502);
    }
    if(result.status!=="completed")return json({ok:true,status:"pending",waitSeconds:10});
    record=await persistMockups(env,record,result,request);
    return json({ok:true,status:"completed",images:record.images,position:record.position,design:record.design||null});
  }catch(error){return json({ok:false,error:error?.message||String(error)},error.status||500)}
}

export async function serveMockupImage(request,env,requestId,sku,index){
  const url=new URL(request.url);const token=url.searchParams.get("token")||"";const mockupId=String(url.searchParams.get("mockup")||"legacy");
  const record=await readJson(env,mockupKey(requestId,sku,mockupId));
  if(!record||!safeEqual(record.mockupAccessToken,token))return new Response("Not found",{status:404});
  const folder=mockupId==="legacy"?`mockups/${requestId}/${sku}`:`mockups/${requestId}/${sku}/${mockupId}`;
  const object=await env.ARTWORK?.get(`${folder}/image-${index}.jpg`);
  if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"content-type":"image/jpeg","cache-control":"private, max-age=3600","x-content-type-options":"nosniff"}})
}

let shopifyTokenCache={token:null,expiresAt:0};
function shopDomain(env){const raw=String(env.SHOPIFY_SHOP||"").trim().replace(/^https?:\/\//,"").replace(/\/$/,"");return raw.endsWith(".myshopify.com")?raw:`${raw}.myshopify.com`}
async function getShopifyToken(env){
  if(shopifyTokenCache.token&&shopifyTokenCache.expiresAt>Date.now()+60000)return shopifyTokenCache.token;
  if(!env.SHOPIFY_CLIENT_ID||!env.SHOPIFY_CLIENT_SECRET||!env.SHOPIFY_SHOP)throw new Error("Shopify is not fully configured.");
  const response=await fetch(`https://${shopDomain(env)}/admin/oauth/access_token`,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"client_credentials",client_id:env.SHOPIFY_CLIENT_ID,client_secret:env.SHOPIFY_CLIENT_SECRET})});
  const data=await response.json().catch(()=>({}));if(!response.ok||!data.access_token)throw new Error(data?.error_description||data?.error||"Shopify token request failed.");
  shopifyTokenCache={token:data.access_token,expiresAt:Date.now()+(Number(data.expires_in||86399)-90)*1000};return data.access_token;
}
async function shopifyGraphQL(env,query,variables={}){
  const token=await getShopifyToken(env);const response=await fetch(`https://${shopDomain(env)}/admin/api/2026-07/graphql.json`,{method:"POST",headers:{"content-type":"application/json","x-shopify-access-token":token},body:JSON.stringify({query,variables})});
  const data=await response.json().catch(()=>({}));if(!response.ok||data.errors?.length)throw new Error(data.errors?.map(e=>e.message).join("; ")||`Shopify HTTP ${response.status}`);return data.data;
}

async function addShopifyOrderTags(env,orderId,tags=[]){
  const clean=[...new Set(tags.map(x=>String(x||"").trim()).filter(Boolean))];
  if(!orderId||!clean.length)return null;
  try{
    const data=await shopifyGraphQL(env,`mutation RecastOrderTags($id:ID!,$tags:[String!]!){tagsAdd(id:$id,tags:$tags){node{id} userErrors{field message}}}`,{id:orderId,tags:clean});
    const errors=data?.tagsAdd?.userErrors||[];
    if(errors.length)throw new Error(errors.map(e=>e.message).join("; "));
    return true;
  }catch(error){
    console.warn("Shopify order tag update failed",orderId,clean,error?.message||error);
    return false;
  }
}

async function createShopifyShipmentFulfillment(env,job,shipment){
  if(job.shopifyFulfillmentId)return job.shopifyFulfillmentId;
  if(!job.orderId||!job.lineId)throw new Error("Shopify fulfillment is missing its order or line reference.");
  const data=await shopifyGraphQL(env,`query RecastFulfillmentOrders($id:ID!){
    order(id:$id){
      fulfillmentOrders(first:20){
        nodes{
          id
          status
          lineItems(first:100){nodes{id remainingQuantity lineItem{id}}}
        }
      }
    }
  }`,{id:job.orderId});
  const groups=[];let remaining=Math.max(1,Number(job.quantity||1));
  for(const order of data?.order?.fulfillmentOrders?.nodes||[]){
    if(remaining<=0)break;
    if(["CLOSED","CANCELLED"].includes(String(order.status||"").toUpperCase()))continue;
    const items=[];
    for(const item of order.lineItems?.nodes||[]){
      if(item?.lineItem?.id!==job.lineId)continue;
      const qty=Math.min(remaining,Math.max(0,Number(item.remainingQuantity||0)));
      if(qty>0){items.push({id:item.id,quantity:qty});remaining-=qty;}
    }
    if(items.length)groups.push({fulfillmentOrderId:order.id,fulfillmentOrderLineItems:items});
  }
  if(!groups.length){
    // A manual fulfillment may already have closed this line. Do not create a duplicate.
    job.shopifyFulfillmentAlreadyClosedAt ||= now();
    return null;
  }
  if(remaining>0)throw new Error("Shopify does not expose enough remaining quantity to mirror this shipment safely.");
  const tracking={};
  const carrier=String(shipment?.carrier||"Printful").trim();if(carrier)tracking.company=carrier;
  const number=String(shipment?.tracking_number||"").trim();if(number)tracking.number=number;
  const url=String(shipment?.tracking_url||"").trim();if(url)tracking.url=url;
  const mutation=await shopifyGraphQL(env,`mutation RecastCreateFulfillment($fulfillment:FulfillmentInput!){
    fulfillmentCreate(fulfillment:$fulfillment){
      fulfillment{id status trackingInfo(first:10){company number url}}
      userErrors{field message}
    }
  }`,{fulfillment:{lineItemsByFulfillmentOrder:groups,notifyCustomer:true,...(Object.keys(tracking).length?{trackingInfo:tracking}:{})}});
  const errors=mutation?.fulfillmentCreate?.userErrors||[];
  if(errors.length)throw new Error(errors.map(e=>e.message).join("; "));
  const fulfillment=mutation?.fulfillmentCreate?.fulfillment;
  if(!fulfillment?.id)throw new Error("Shopify did not return a fulfillment record.");
  job.shopifyFulfillmentId=fulfillment.id;
  job.shopifyFulfilledAt=now();
  delete job.shopifyFulfillmentError;
  return fulfillment.id;
}

function attrFromLine(line,key){return(line.customAttributes||[]).find(a=>a.key===key)?.value||""}
function artworkFromLine(line){return attrFromLine(line,"Artwork ID")}
function purchasedDesign(line,map){
  const raw=attrFromLine(line,"_Recast Design");if(!raw)return null;
  try{return normalizeProductDesign(map,JSON.parse(raw))}catch{return null}
}
function preapprovalTokenFromLine(line){return attrFromLine(line,"_Recast Preapproval")}
async function validatedPreapproval(env,line,map,requestId){
  if(map.digital)return null;
  const token=preapprovalTokenFromLine(line);if(!/^[a-f0-9]{48}$/.test(token))return null;
  const row=await readJson(env,`commerce/preapprovals/${token}.json`);if(!row)return null;
  const design=purchasedDesign(line,map),proof=attrFromLine(line,"_Recast Proof"),mockup=attrFromLine(line,"_Recast Mockup"),preview=attrFromLine(line,"_Recast Preview Token");
  if(row.requestId!==requestId||row.sku!==line.sku||row.proofHash!==proof||row.mockupId!==mockup||row.previewToken!==preview)return null;
  if(!design||JSON.stringify(design)!==JSON.stringify(row.design))return null;
  if(!row.snapshotKey||!await env.ARTWORK?.head(row.snapshotKey))return null;
  return row;
}
function recipientFromOrder(order){
  const a=order.shippingAddress||{};return{name:a.name||[a.firstName,a.lastName].filter(Boolean).join(" "),company:a.company||undefined,address1:a.address1,address2:a.address2||undefined,city:a.city,state_code:a.provinceCode||undefined,state_name:a.province||undefined,country_code:a.countryCodeV2,zip:a.zip,phone:a.phone||undefined,email:order.email||undefined};
}

export async function verifyPaidOrder(env,job,{forProduction=false}={}){
  const data=await shopifyGraphQL(env,VERIFY_ORDER_QUERY,{id:job.orderId});
  const order=data.order;
  if(!order)throw fault('payment_unverified','We could not verify this payment. Your order is still on hold.',503);
  await reconcileOrderCredits(env,order);
  if(forProduction&&order.test)throw fault('test_order','Shopify test orders cannot be sent to paid print production.');
  if(!orderEligible(order,env))throw fault('payment_required','This order is not eligible for printing or bonus renders. Check its payment, refund or cancellation status.');
  if(job.productDesignRequired&&!job.digital&&(!job.productDesign||!job.productProofHash||!job.productMockupId||!job.approvedPreviewToken))throw fault('design_required','This physical order is missing its reviewed product layout or approved preview snapshot and must be held for owner review.');
  if(order.lineItems?.pageInfo?.hasNextPage)throw fault('order_review','This large order needs an owner review.');
  const line=(order.lineItems?.nodes||[]).find(l=>job.lineId?l.id===job.lineId:(artworkFromLine(l)===job.requestId&&l.sku===job.sku));
  if(!line||line.sku!==job.sku||line.quantity!==job.quantity||artworkFromLine(line)!==job.requestId)throw fault('order_changed','The purchased item changed. An owner must review this order before printing.');
  if(!job.digital&&job.productDesignRequired){
    const liveDesign=purchasedDesign(line,FULFILLMENT[job.sku]);
    if(!liveDesign||JSON.stringify(liveDesign)!==JSON.stringify(job.productDesign)||attrFromLine(line,"_Recast Proof")!==job.productProofHash||attrFromLine(line,"_Recast Preview Token")!==job.approvedPreviewToken)throw fault('design_changed','The purchased product layout or approved preview changed. An owner must review this order before printing.');
    if(job.preapprovedCheckout&&attrFromLine(line,"_Recast Preapproval")!==job.preapprovalToken)throw fault('design_changed','The pre-checkout design confirmation changed. An owner must review this order before printing.');
  }
  return order;
}

export async function reconcileShopifyOrder(env,order){
  if(order.lineItems?.pageInfo?.hasNextPage)throw fault('order_review','An order has more than 250 lines and needs manual review.',503);
  let created=0,seen=0,walletId=null;
  const eligible=orderEligible(order,env);
  for(const line of order.lineItems?.nodes||[]){
    const requestId=artworkFromLine(line);if(!requestId||!line.sku||!FULFILLMENT[line.sku])continue;
    if(!/^RC-[A-Z0-9-]{8,60}$/.test(requestId))continue;
    const meta=await requestMeta(env,requestId);if(!meta)continue;
    walletId ||= meta.creditWalletId||null;seen++;
    const legacy=sanitizeId(`${order.name}-${requestId}-${line.sku}`);
    const id=await env.ARTWORK.head(jobKey(legacy))?legacy:sanitizeId(`${order.id.split('/').pop()}-${line.id.split('/').pop()}`);
    const map=FULFILLMENT[line.sku];
    const productDesign=map.digital?null:purchasedDesign(line,map);
    const productProofHash=map.digital?null:attrFromLine(line,"_Recast Proof");
    const productMockupId=map.digital?null:attrFromLine(line,"_Recast Mockup");
    const approvedPreviewToken=map.digital?null:attrFromLine(line,"_Recast Preview Token");
    const preapproval=map.digital?null:await validatedPreapproval(env,line,map,requestId);
    const layoutComplete=Boolean(map.digital||(productDesign&&productProofHash&&productMockupId&&approvedPreviewToken));
    const checkoutApproved=Boolean(!map.digital&&layoutComplete&&preapproval);
    if(eligible){
      const job={id,lineId:line.id,orderId:order.id,orderName:order.name,orderCreatedAt:order.createdAt,financialStatus:order.displayFinancialStatus,requestId,sku:line.sku,quantity:line.quantity,product:map.product,digital:Boolean(map.digital),productDesignRequired:!map.digital,productDesign,productProofHash,productMockupId,approvedPreviewToken,preapprovedCheckout:checkoutApproved,preapprovalToken:checkoutApproved?preapproval.token:null,recipient:recipientFromOrder(order),status:map.digital?'digital_fulfillment_pending':checkoutApproved?'design_confirmed':layoutComplete?'awaiting_customer_approval':'product_layout_review',createdAt:now(),updatedAt:now(),printfulVariantId:map.printfulVariantId||null,printfulProductId:map.printfulProductId||null};
      const put=await env.ARTWORK.put(jobKey(id),JSON.stringify(job),{onlyIf:new Headers({'If-None-Match':'*'})});if(put)created++;
      if(checkoutApproved&&put){
        await putJson(env,`commerce/designs/${id}.json`,{revision:1,selectedRequestId:requestId,approvedAt:preapproval.approvedAt,preapprovedAt:preapproval.approvedAt,snapshotKey:preapproval.snapshotKey,sourceHash:preapproval.sourceHash,printToken:randomHex(24),proof:{images:preapproval.images||[],position:preapproval.position,design:preapproval.design,sku:line.sku,quantity:line.quantity,sourceHash:preapproval.sourceHash}});
      }
      await putJson(env,`commerce/request-jobs/${requestId}/${id}.json`,{id});
      if(checkoutApproved&&String(env.AUTO_PRINT_PREAPPROVED_ENABLED||"false")==="true"){
        const currentJob=put?job:await loadJob(env,id);
        await autoProcessPreapprovedJob(env,currentJob).catch(()=>null);
      }
      if(!checkoutApproved&&!map.digital&&Array.isArray(order.tags)&&order.tags.includes("RECAST_SEND_PRODUCTION")){
        const currentJob=put?job:await loadJob(env,id);
        await processOwnerReleasedLegacyJob(env,currentJob).catch(()=>null);
      }
    }else if(await env.ARTWORK.head(jobKey(id))){
      await change(env,jobKey(id),null,j=>({...j,financialStatus:order.displayFinancialStatus,paymentRevokedAt:now(),status:j.sentToProductionAt?j.status:'payment_hold'}));
    }
    await change(env,requestKey(requestId,'request.json'),null,m=>{
      if(!m)return undefined;
      m.paid=eligible;m.financialStatus=order.displayFinancialStatus;m.orderName=order.name;m.updatedAt=now();
      if(!eligible)m.revokedAt=now();
      if(eligible&&map.digital){m.digitalEntitlement=line.sku;m.digitalPaidAt=now()}
      return m;
    });
  }
  await reconcileOrderCredits(env,order,walletId);
  return {created,seen};
}

export async function syncPaidOrders(env){
  if(!env.ARTWORK)return{ok:false,error:'R2 missing'};
  // Updated orders include refunds and cancellations, not only paid orders.
  // Bounded pages persist their cursor; the next sync resumes instead of losing orders.
  const key='system/order-sync-cursor.json',old=await readJson(env,key);
  const until=old?.cursor?old.until:now();
  const since=old?.since||new Date(Date.now()-30*86400000).toISOString();
  let cursor=old?.cursor||null,created=0,seen=0,more=false;
  for(let page=0;page<4;page++){
    const data=await shopifyGraphQL(env,SYNC_ORDERS_QUERY,{after:cursor,query:`updated_at:>='${since}' updated_at:<='${until}'`});
    for(const order of data.orders?.nodes||[]){const result=await reconcileShopifyOrder(env,order);created+=result.created;seen+=result.seen}
    more=Boolean(data.orders?.pageInfo?.hasNextPage);cursor=data.orders?.pageInfo?.endCursor||null;
    if(!more)break;
  }
  await putJson(env,key,more?{since,until,cursor}:{since:new Date(Date.parse(until)-60000).toISOString(),cursor:null});
  await putJson(env,'system/order-sync.json',{lastRun:now(),created,seen,more});
  return{ok:true,created,seen,more};
}

async function prepareOrderProof(request,env,job,meta){
  if(appBase(env,request)!==new URL(request.url).origin)throw fault('proof_host','The owner must configure this deployment’s public URL before product previews can be made.',503);
  const map=FULFILLMENT[job.sku],design=normalizeProductDesign(map,job.productDesign||{});
  const source=await env.ARTWORK.get(requestKey(meta.requestId,'preview.b64'));
  const sourceHash=await hash((await source.text())+'|'+JSON.stringify(design));
  const mockupId=job.productMockupId||mockupDesignId(design);
  const existing=await readJson(env,mockupKey(meta.requestId,job.sku,mockupId));
  if(!existing||existing.sourceHash!==sourceHash||!existing.position||JSON.stringify(existing.design||{})!==JSON.stringify(design)){
    const claim=`commerce/proof-start/${await hash(meta.requestId+'|'+job.sku+'|'+sourceHash)}.json`;
    if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('proof_started','A product preview has already started. Refresh to check it; an interrupted task needs owner review.');
    const r=await createMockup(new Request(request.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:meta.requestId,accessToken:meta.accessToken,sku:job.sku,design})}),env);
    const result=await r.json();if(!r.ok)throw fault('proof_failed',result.error||'The product preview could not start.',502);
    return result;
  }
  const url=new URL('/api/mockup/status',request.url);url.searchParams.set('requestId',meta.requestId);url.searchParams.set('token',meta.accessToken);url.searchParams.set('sku',job.sku);url.searchParams.set('mockup',mockupId);
  const r=await mockupStatus(new Request(url),env),result=await r.json();
  if(!r.ok)throw fault('proof_failed',result.error||'The product preview did not finish.',502);
  return result;
}

export async function serveApprovedPrint(request,env,id){
  try{return await printDesignFile(request,env,await loadJob(env,id),(e,j)=>verifyPaidOrder(e,j,{forProduction:true}))}catch(e){return privateJson({ok:false,error:e.message},e.status||503)}
}

export async function syncPrintfulJobs(env){
  if(!env.ARTWORK||!env.PRINTFUL_API_TOKEN)return{ok:false,updated:0,error:"Printful or R2 missing"};
  const jobs=await listJson(env,"jobs/",100);let updated=0;
  for(const job of jobs){
    if(!job.printfulOrderId||job.digital)continue;
    if(["canceled","failed"].includes(String(job.status)))continue;
    try{
      const order=await printful(env,`/orders/${encodeURIComponent(job.printfulOrderId)}`,{method:"GET"});
      job.printfulStatus=order.status||job.printfulStatus;
      const shipment=(order.shipments||[])[0]||null;
      if(shipment){job.trackingNumber=shipment.tracking_number||job.trackingNumber||null;job.trackingUrl=shipment.tracking_url||job.trackingUrl||null;job.carrier=shipment.carrier||job.carrier||null;job.shippedAt=shipment.shipped_at||job.shippedAt||null}
      if(order.status==="fulfilled"||shipment?.shipped_at)job.status="shipped";
      else if(order.status==="failed")job.status="printful_failed";
      else if(order.status==="canceled")job.status="canceled";
      else if(job.sentToProductionAt)job.status="in_printful_production";
      const visibleTags=["RECAST_PRINTFUL_DRAFT"];
      if(job.sentToProductionAt)visibleTags.push("RECAST_PRINTFUL_SUBMITTED");
      if(job.status==="in_printful_production")visibleTags.push("RECAST_IN_PRODUCTION");
      if(job.status==="shipped")visibleTags.push("RECAST_SHIPPED");
      if(job.status==="printful_failed")visibleTags.push("RECAST_PRINTFUL_REVIEW");
      if(job.status==="shipped"&&!job.shopifyFulfillmentId&&!job.shopifyFulfillmentAlreadyClosedAt){
        try{await createShopifyShipmentFulfillment(env,job,shipment);}
        catch(error){job.shopifyFulfillmentError=error.message||String(error);job.shopifyFulfillmentFailedAt=now();visibleTags.push("RECAST_SHOPIFY_FULFILLMENT_REVIEW");}
      }
      await addShopifyOrderTags(env,job.orderId,visibleTags);
      await saveJob(env,job);updated++;
      const meta=await requestMeta(env,job.requestId);if(meta){meta.fulfillment=job.status;meta.updatedAt=now();await putJson(env,requestKey(job.requestId,"request.json"),meta)}
    }catch(error){job.lastPrintfulSyncError=error.message;await saveJob(env,job)}
  }
  await putJson(env,"system/printful-sync.json",{lastRun:now(),updated});return{ok:true,updated}
}

async function loadJob(env,id){const job=await readJson(env,jobKey(id));if(!job)throw Object.assign(new Error("Fulfillment job not found."),{status:404});return job}
async function saveJob(env,job){job.updatedAt=now();await putJson(env,jobKey(job.id),job);return job}

export async function customerOrderStatus(request,env){
  try{
    const url=new URL(request.url);const requestId=String(url.searchParams.get("requestId")||"");const token=String(url.searchParams.get("token")||"");
    const meta=await requireRequest(env,requestId,token);
    let index=await listJson(env,`commerce/request-jobs/${requestId}/`,1000);
    let jobs=index.length?(await Promise.all(index.map(row=>readJson(env,jobKey(row.id))))).filter(Boolean):(await listJson(env,'jobs/',1000)).filter(j=>j.requestId===requestId);
    if(!jobs.length&&String(env.ORDER_SYNC_ENABLED||"false")==="true"){
      await syncPaidOrders(env).catch(()=>null);
      index=await listJson(env,`commerce/request-jobs/${requestId}/`,1000);
      jobs=index.length?(await Promise.all(index.map(row=>readJson(env,jobKey(row.id))))).filter(Boolean):(await listJson(env,'jobs/',1000)).filter(j=>j.requestId===requestId);
    }
    const views=await Promise.all(jobs.map(async j=>{
      let approvedPreviewImages=[];
      if(j.approvedPreviewToken){
        const previewMeta=await readJson(env,`commerce/checkout-previews/${j.approvedPreviewToken}.json`);
        approvedPreviewImages=(previewMeta?.views||[]).slice(0,3).map(v=>({title:v.title||`View ${Number(v.index)+1}`,url:`${appBase(env,request)}/api/approved-preview/${encodeURIComponent(j.approvedPreviewToken)}/${Number(v.index)}`}));
        if(!approvedPreviewImages.length)approvedPreviewImages=[{title:previewMeta?.viewTitle||"Product preview",url:`${appBase(env,request)}/api/approved-preview/${encodeURIComponent(j.approvedPreviewToken)}`}];
      }
      return {id:j.id,orderName:j.orderName,product:j.product,sku:j.sku,status:j.status,digital:j.digital,preapprovedCheckout:Boolean(j.preapprovedCheckout),createdAt:j.createdAt,printfulStatus:j.printfulStatus||null,trackingUrl:j.trackingUrl||null,approvedPreviewUrl:j.approvedPreviewToken?`${appBase(env,request)}/proof/${encodeURIComponent(j.approvedPreviewToken)}`:null,approvedPreviewImage:approvedPreviewImages[0]?.url||null,approvedPreviewImages,productDesign:j.productDesign||null,design:j.digital?null:publicDesign(await designFor(env,j))};
    }));
    return json({ok:true,creditsEnabled:creditsEnabled(env),request:{requestId,styleName:meta.styleName,paid:Boolean(meta.paid),orderName:meta.orderName||null,digitalEntitlement:meta.digitalEntitlement||null},jobs:views});
  }catch(error){return json({ok:false,error:error.message},error.status||500)}
}

export async function digitalDownload(request,env,requestId){
  try{
    const url=new URL(request.url);const token=String(url.searchParams.get("token")||"");const meta=await requireRequest(env,requestId,token);
    if(!meta.paid||!meta.digitalEntitlement)return new Response("Digital purchase required",{status:403});
    const finalObject=await env.ARTWORK?.get(requestKey(requestId,"final-print.jpg"));
    if(finalObject)return new Response(finalObject.body,{headers:{"content-type":"image/jpeg","content-disposition":`attachment; filename=\"${requestId}-recast.jpg\"`,"cache-control":"private, no-store"}});
    const object=await env.ARTWORK?.get(requestKey(requestId,"preview.b64"));
    if(!object)return new Response("Artwork unavailable",{status:404});
    const bytes=decodeBase64(await object.text());
    const mime=meta.previewMime||"image/jpeg";
    const extension=mime==="image/png"?"png":mime==="image/webp"?"webp":"jpg";
    return new Response(bytes,{headers:{"content-type":mime,"content-disposition":`attachment; filename=\"${requestId}-recast.${extension}\"`,"cache-control":"private, no-store"}});
  }catch(error){return new Response(error.message||"Download unavailable",{status:error.status||500})}
}

export async function deleteUnpaidRecast(request,env,requestId){
  try{
    const url=new URL(request.url);const token=String(url.searchParams.get("token")||"");const meta=await requireRequest(env,requestId,token);
    if(meta.paid)return json({ok:false,error:"Paid artwork cannot be deleted while it may be needed for fulfillment."},409);
    const listed=await env.ARTWORK?.list({prefix:`requests/${requestId}/`,limit:1000});
    const keys=(listed?.objects||[]).map(o=>o.key);if(keys.length)await env.ARTWORK.delete(keys);
    const mockups=await env.ARTWORK?.list({prefix:`mockups/${requestId}/`,limit:1000});const mockupKeys=(mockups?.objects||[]).map(o=>o.key);if(mockupKeys.length)await env.ARTWORK.delete(mockupKeys);
    return json({ok:true,deleted:true,requestId});
  }catch(error){return json({ok:false,error:error.message},error.status||500)}
}


export async function clientDiagnostic(request,env){
  try{
    if(!env.ARTWORK)return json({ok:false,error:"diagnostics unavailable"},503);
    const body=await request.json().catch(()=>({}));
    const diagnosticId=`WEB-${Date.now().toString(36).toUpperCase()}-${randomHex(2).toUpperCase()}`;
    const record={
      diagnosticId,
      createdAt:now(),
      kind:String(body.kind||"client"),
      message:String(body.message||"").slice(0,500),
      clientAttemptId:String(body.clientAttemptId||"").slice(0,96)||null,
      serverDiagnosticId:String(body.serverDiagnosticId||"").slice(0,96)||null,
      hadPreviousPreview:Boolean(body.hadPreviousPreview),
      page:String(body.page||"").slice(0,120),
      userAgent:String(body.userAgent||"").slice(0,300),
      source:String(body.source||"").slice(0,200)||null,
      line:Number(body.line||0)||null
    };
    await putJson(env,`diagnostics/client/${diagnosticId}.json`,record);
    return json({ok:true,diagnosticId});
  }catch(error){return json({ok:false,error:error.message||String(error)},500)}
}

export async function adminStatus(request,env){
  try{requireAdmin(request,env);const jobs=await listJson(env,"jobs/",100);const trends=await listJson(env,"trends/",100);const socials=await listJson(env,"social/x/",100);const genErrors=await listJson(env,"diagnostics/generation/",100);const clientErrors=await listJson(env,"diagnostics/client/",100);const attempts=await listJson(env,"diagnostics/attempts/",100);return json({ok:true,version:"1.0.2",jobs:{total:jobs.length,awaiting:jobs.filter(x=>!String(x.status).includes("completed")&&!String(x.status).includes("shipped")).length},trends:{total:trends.length,review:trends.filter(x=>x.status==="review").length},generationErrors:{total:genErrors.length+clientErrors.length,recent:[...genErrors,...clientErrors].filter(x=>Date.now()-Date.parse(x.createdAt||0)<86400000).length,attempts:attempts.length},xRequests:socials.length,connections:{shopify:Boolean(env.SHOPIFY_CLIENT_ID&&env.SHOPIFY_CLIENT_SECRET),printful:Boolean(env.PRINTFUL_API_TOKEN),images:Boolean(env.IMAGES),x:Boolean(env.X_USER_ACCESS_TOKEN&&env.X_USER_ID),admin:true},automation:{orderSync:String(env.ORDER_SYNC_ENABLED||"false")==="true",xBot:String(env.X_BOT_ENABLED||"false")==="true",trendScanner:String(env.TREND_SCANNER_ENABLED||"false")==="true",retentionCleanup:String(env.RETENTION_CLEANUP_ENABLED||"false")==="true"}})}catch(error){return json({ok:false,error:error.message},error.status||500)}
}
export async function adminJobs(request,env){
 try{
  requireAdmin(request,env);
  const cursor=new URL(request.url).searchParams.get('cursor');
  if(cursor&&cursor.length>2048)return json({ok:false,error:'Invalid page cursor'},400);
  const page=await env.ARTWORK.list({prefix:'jobs/',limit:100,...(cursor?{cursor}:{})});
  const jobs=(await Promise.all(page.objects.map(o=>readJson(env,o.key)))).filter(Boolean);
  jobs.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  return json({ok:true,jobs,cursor:page.truncated?page.cursor:null,partial:Boolean(page.truncated)});
 }catch(error){return json({ok:false,error:error.message},error.status||500)}
}
export async function adminGenerationErrors(request,env){try{requireAdmin(request,env);const server=await listJson(env,"diagnostics/generation/",100);const client=await listJson(env,"diagnostics/client/",100);const attempts=await listJson(env,"diagnostics/attempts/",100);const errors=[...server,...client,...attempts.filter(x=>x.status==="failed")];errors.sort((a,b)=>String(b.createdAt||b.failedAt||b.updatedAt).localeCompare(String(a.createdAt||a.failedAt||a.updatedAt)));return json({ok:true,errors:errors.slice(0,75)})}catch(error){return json({ok:false,error:error.message},error.status||500)}}
export async function adminTrends(request,env){try{requireAdmin(request,env);const rows=await listJson(env,"trends/",100);rows.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({ok:true,trends:rows})}catch(error){return json({ok:false,error:error.message},error.status||500)}}
export async function adminSocial(request,env){try{requireAdmin(request,env);const rows=await listJson(env,"social/x/",100);const listed=await env.ARTWORK?.list({prefix:"requests/",limit:1000});const byTweet=new Map();for(const object of listed?.objects||[]){if(!object.key.endsWith("/request.json"))continue;const meta=await readJson(env,object.key);if(meta?.sourceTweet)byTweet.set(String(meta.sourceTweet),meta)}for(const row of rows){const meta=byTweet.get(String(row.tweetId));if(meta){row.recastRequestId=meta.requestId;row.converted=true;row.paid=Boolean(meta.paid)}}rows.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({ok:true,requests:rows})}catch(error){return json({ok:false,error:error.message},error.status||500)}}
export async function adminProductCandidates(request,env){
  try{
    requireAdmin(request,env);
    const products=[];
    for(const [key,candidate] of Object.entries(RM054_PRODUCT_CANDIDATES)){
      const variants=[];
      for(const item of candidate.variants){
        try{
          const response=await printful(env,`/v2/catalog-variants/${item.printfulVariantId}`,{method:'GET'});
          const row=response?.data||{};
          variants.push({requestedId:item.printfulVariantId,verified:Number(row.id)===Number(item.printfulVariantId),catalogProductId:Number(row.catalog_product_id)||null,name:row.name||null,size:row.size||null,color:row.color||null,availability:row.availability_status||row.availability||null});
        }catch(error){
          variants.push({requestedId:item.printfulVariantId,verified:false,error:error.message||String(error),providerStatus:error.printfulStatus||null});
        }
      }
      products.push({key,title:candidate.title,wave:candidate.wave,state:candidate.state,variants});
    }
    return json({ok:true,productionSubmitted:false,products});
  }catch(error){return json({ok:false,error:error.message},error.status||500)}
}

export async function adminSyncOrders(request,env){try{requireAdmin(request,env);const orders=await syncPaidOrders(env);const legacy=await retryLegacyOwnerReleaseCandidates(env);const printful=await syncPrintfulJobs(env);return json({ok:true,created:orders.created||0,seen:orders.seen||0,legacyChecked:legacy.checked||0,legacyReleased:legacy.released||0,printfulUpdated:printful.updated||0})}catch(error){return json({ok:false,error:error.message},error.status||500)}}

async function finalizePrintArt(env,job){
  if(job.digital){job.printReadyAt=now();job.status='digital_ready';await saveJob(env,job);return job}
  await verifyPaidOrder(env,job);
  const design=await finishApprovedDesign(env,job);
  job.printReadyAt=design.finishedAt;job.printReadyMethod=design.finishMethod;job.status='ready_for_printful_draft';await saveJob(env,job);return job;
}

async function finalizePhysicalJob(env,job){
  if(job.digital){job.printReadyAt=now();job.status='digital_ready';await saveJob(env,job);return job}
  await verifyPaidOrder(env,job,{forProduction:true});
  const design=await finishApprovedDesign(env,job);
  job.artApprovedAt ||= design.approvedAt||now();
  job.printReadyAt=design.finishedAt;job.printReadyMethod=design.finishMethod;job.status='ready_for_printful_draft';
  return saveJob(env,job);
}
async function createPrintfulDraftForJob(env,job){
  if(job.digital)throw fault('physical_only','Digital products do not use Printful.',400);
  if(job.printfulOrderId)return job;
  if(job.status==='on_hold'||job.paymentRevokedAt)throw fault('order_hold','This order is on hold.');
  await verifyPaidOrder(env,job,{forProduction:true});
  const design=await approvedDesign(env,job);
  if(!design.proof?.position)throw fault('proof_placement_missing','Review a product preview with verified placement before printing.');
  if(!design.finalKey)throw fault('print_not_ready','Prepare the approved print file first.');
  const map=FULFILLMENT[job.sku];const sourceUrl=`${String(env.PUBLIC_APP_URL||'').replace(/\/$/,'')}/api/order-print/${encodeURIComponent(job.id)}?token=${encodeURIComponent(design.printToken)}`;
  const claim=`commerce/production/${await hash(job.id)}-draft.json`;
  // Existing attempts keep their exact reference and duplicate-submission lock.
  if(await env.ARTWORK.head(claim))throw fault('draft_started','Draft submission already started; review Printful before retrying.');
  const externalId=await printfulReferenceForNewDraft(job);
  if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now(),externalId,referenceVersion:2}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('draft_started','Draft submission already started; review Printful before retrying.');
  const payload={external_id:externalId,recipient:job.recipient,items:[{variant_id:map.printfulVariantId,quantity:Number(job.quantity||1)*Number(map.quantity||1),files:[{type:map.orderFileType||"default",url:sourceUrl,position:design.proof.position}]}]};
  const result=await printful(env,"/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  job.printfulExternalId=externalId;job.printfulOrderId=result.id;job.printfulStatus=result.status||"draft";job.printSourceUrl=sourceUrl;job.status="printful_draft_ready";job.printfulCreatedAt=now();
  // Persist the provider result before a separate Shopify tagging call can fail.
  await saveJob(env,job);
  await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_DRAFT"]);
  return saveJob(env,job);
}
async function sendPrintfulProductionForJob(env,job){
  if(!job.printfulOrderId)throw fault('draft_required','Create a Printful draft first.',409);
  if(job.sentToProductionAt)return job;
  if(job.status==='on_hold'||job.paymentRevokedAt)throw fault('order_hold','This order is on hold.');
  await verifyPaidOrder(env,job,{forProduction:true});await approvedDesign(env,job);
  const claim=`commerce/production/${await hash(job.id)}-confirm.json`;
  if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('production_started','Production submission already started; review Printful before retrying.');
  const result=await printful(env,`/orders/${encodeURIComponent(job.printfulOrderId)}/confirm`,{method:"POST"});
  job.status="submitted_to_printful";job.printfulStatus=result.status||"pending";job.sentToProductionAt=now();
  await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_SUBMITTED"]);
  return saveJob(env,job);
}
async function autoProcessPreapprovedJob(env,job){
  if(!job.preapprovedCheckout||String(env.AUTO_PRINT_PREAPPROVED_ENABLED||"false")!=="true")return job;
  if(job.sentToProductionAt)return job;
  try{
    if(!job.printReadyAt)job=await finalizePhysicalJob(env,job);
    if(!job.printfulOrderId)job=await createPrintfulDraftForJob(env,job);
    if(!job.sentToProductionAt)job=await sendPrintfulProductionForJob(env,job);
    job.autoPrintCompletedAt=now();delete job.autoPrintError;return saveJob(env,job);
  }catch(error){
    job.autoPrintError=error.message||String(error);job.autoPrintFailedAt=now();
    if(!job.sentToProductionAt&&job.status!=='on_hold')job.status='auto_print_review';
    await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_REVIEW"]);
    await saveJob(env,job);throw error;
  }
}

async function recoverLegacyApprovedDesign(env,job){
  const existing=await designFor(env,job);
  if(existing?.approvedAt)return existing;
  if(job.digital||!job.productDesign||!job.productProofHash||!job.productMockupId||!job.approvedPreviewToken)return null;

  const token=String(job.approvedPreviewToken||"");
  if(!/^[a-f0-9]{48}$/.test(token))return null;

  const preview=await readJson(env,`commerce/checkout-previews/${token}.json`);
  if(!preview)return null;

  const normalized=normalizeProductDesign(FULFILLMENT[job.sku],job.productDesign);
  if(
    preview.requestId!==job.requestId ||
    preview.sku!==job.sku ||
    preview.mockupId!==job.productMockupId ||
    preview.proofHash!==job.productProofHash ||
    JSON.stringify(preview.design||{})!==JSON.stringify(normalized)
  )return null;

  // Require the exact preview artifact the customer saw to still exist.
  const previewImage=await env.ARTWORK?.head(`commerce/checkout-previews/${token}.jpg`);
  if(!previewImage)return null;

  const sourceObject=await env.ARTWORK?.get(requestKey(job.requestId,"preview.b64"));
  if(!sourceObject)return null;
  const sourceBase64=await sourceObject.text();
  const sourceHash=await hash(sourceBase64);
  const proofHash=await hash(sourceBase64+'|'+JSON.stringify(normalized));
  if(proofHash!==job.productProofHash)return null;

  const mockup=await readJson(env,`mockups/${job.requestId}/${job.sku}/${job.productMockupId}/task.json`);
  if(
    !mockup ||
    mockup.status!=="completed" ||
    !mockup.position ||
    mockup.sourceHash!==proofHash ||
    JSON.stringify(mockup.design||{})!==JSON.stringify(normalized)
  )return null;

  const snapshotKey=`commerce/artwork/${await hash(job.id)}/${sourceHash}.b64`;
  if(!await env.ARTWORK?.head(snapshotKey)){
    await env.ARTWORK.put(snapshotKey,sourceBase64,{httpMetadata:{contentType:"text/plain"}});
  }

  const recoveredAt=now();
  const recovered={
    revision:1,
    selectedRequestId:job.requestId,
    sourceHash,
    snapshotKey,
    approvedAt:recoveredAt,
    legacyRecoveredAt:recoveredAt,
    legacyPreviewCreatedAt:preview.createdAt||null,
    printToken:randomHex(24),
    proof:{
      images:[],
      position:mockup.position,
      design:normalized,
      sku:job.sku,
      quantity:job.quantity,
      sourceHash
    }
  };
  await putJson(env,`commerce/designs/${job.id}.json`,recovered);
  job.legacyApprovalRecoveredAt=recoveredAt;
  job.status='art_approved_needs_high_res';
  await saveJob(env,job);
  return recovered;
}

async function processOwnerReleasedLegacyJob(env,job){
  if(job.digital||job.sentToProductionAt)return job;
  let design=await designFor(env,job);
  if(!design?.approvedAt){
    design=await recoverLegacyApprovedDesign(env,job);
  }
  if(!design?.approvedAt){
    job.ownerReleaseError="The legacy order could not be matched to its exact saved product preview and artwork. Production was not started.";
    job.ownerReleaseFailedAt=now();
    if(job.status!=='on_hold')job.status='owner_release_review';
    await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_REVIEW"]);
    return saveJob(env,job);
  }
  try{
    if(!job.printReadyAt)job=await finalizePhysicalJob(env,job);
    if(!job.printfulOrderId)job=await createPrintfulDraftForJob(env,job);
    if(!job.sentToProductionAt)job=await sendPrintfulProductionForJob(env,job);
    job.ownerReleasedAt ||= now();job.ownerReleaseCompletedAt=now();delete job.ownerReleaseError;
    return saveJob(env,job);
  }catch(error){
    job.ownerReleaseError=error.message||String(error);job.ownerReleaseFailedAt=now();
    if(!job.sentToProductionAt&&job.status!=='on_hold')job.status='owner_release_review';
    await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_REVIEW"]);
    await saveJob(env,job);throw error;
  }
}

export async function retryLegacyOwnerReleaseCandidates(env){
  if(!env.ARTWORK||!env.SHOPIFY_CLIENT_ID||!env.SHOPIFY_CLIENT_SECRET)return{ok:false,checked:0,released:0};
  const jobs=await listJson(env,"jobs/",100);
  let checked=0,released=0;
  for(let job of jobs){
    if(
      job.digital ||
      job.sentToProductionAt ||
      job.preapprovedCheckout ||
      job.status==='on_hold' ||
      job.paymentRevokedAt ||
      !job.orderId ||
      !job.requestId ||
      !job.sku ||
      !job.productDesign ||
      !job.productProofHash ||
      !job.productMockupId ||
      !job.approvedPreviewToken
    )continue;
    checked++;
    try{
      const data=await shopifyGraphQL(env,VERIFY_ORDER_QUERY,{id:job.orderId});
      const order=data?.order;
      if(!order||!Array.isArray(order.tags)||!order.tags.includes("RECAST_SEND_PRODUCTION"))continue;
      job.legacyReleaseRecoveryLastAttemptAt=now();
      job.legacyReleaseRecoveryAttempts=Number(job.legacyReleaseRecoveryAttempts||0)+1;
      await saveJob(env,job);
      job=await processOwnerReleasedLegacyJob(env,job);
      if(job.sentToProductionAt){
        job.legacyReleaseRecoveryV1At ||= now();
        await addShopifyOrderTags(env,job.orderId,["RECAST_LEGACY_RECOVERY_MATCHED"]);
        await saveJob(env,job);
        released++;
      }else if(job.status==='owner_release_review'){
        await addShopifyOrderTags(env,job.orderId,["RECAST_LEGACY_RECOVERY_BLOCKED"]);
      }
    }catch(error){
      job.legacyReleaseRecoveryError=error.message||String(error);
      job.legacyReleaseRecoveryFailedAt=now();
      await saveJob(env,job);
    }
  }
  return{ok:true,checked,released};
}


export async function adminJobAction(request,env,id,action){
  try{
    requireAdmin(request,env);let job=await loadJob(env,id);
    if(action==="approve-art"){
      if(!job.digital){await verifyPaidOrder(env,job);await approvedDesign(env,job)}
      job.artApprovedAt=now();job.status=job.digital?"digital_ready":"art_approved_needs_high_res";await saveJob(env,job);return json({ok:true,job});
    }
    if(action==="finalize-art"){
      if(!job.artApprovedAt)return json({ok:false,error:"Approve the artwork before preparing the print file."},409);
      job=await finalizePrintArt(env,job);return json({ok:true,job});
    }
    if(action==="hold"){
      const body=await request.json().catch(()=>({}));job.status="on_hold";job.holdReason=String(body.reason||"Manual hold");await saveJob(env,job);return json({ok:true,job});
    }
    if(action==="recover-missing-draft"){
      const body=await request.json().catch(()=>({}));
      if(body.confirm!=="RECOVER_MISSING_DRAFT")return json({ok:false,error:"Explicit missing-draft recovery confirmation is required."},409);
      if(job.digital)return json({ok:false,error:"Digital products do not use Printful."},400);
      if(job.printfulOrderId||job.sentToProductionAt)return json({ok:false,error:"This job already has a Printful order or production submission."},409);
      if(job.paymentRevokedAt)return json({ok:false,error:"This order is not eligible for recovery because its payment is on hold."},409);
      if(!job.artApprovedAt||!job.printReadyAt)return json({ok:false,error:"The exact approved high-resolution print file must already be prepared."},409);
      const claimKey=`commerce/production/${await hash(job.id)}-draft.json`;
      const claimObject=await env.ARTWORK.get(claimKey);
      if(!claimObject)return json({ok:false,error:"The original draft-attempt lock is not present. Use the normal draft action instead."},409);
      const verified=await verifiedLegacyEmptyStoreForRecovery(env,job,claimObject);
      if(!verified.eligible)return json({ok:false,error:verified.reason,recoveryState:verified.state},409);
      await verifyPaidOrder(env,job,{forProduction:true});
      const design=await approvedDesign(env,job);
      if(!design.proof?.position||!design.finalKey)throw fault('print_not_ready','The exact approved print file or placement is unavailable.');
      const map=FULFILLMENT[job.sku];
      const sourceUrl=`${String(env.PUBLIC_APP_URL||'').replace(/\/$/,'')}/api/order-print/${encodeURIComponent(job.id)}?token=${encodeURIComponent(design.printToken)}`;
      const externalId=await printfulReferenceForNewDraft(job);
      const recoveryStartedAt=now(),previousStatus=job.status;
      job.status='on_hold';
      job.holdReason='Safe Printful draft recovery in progress. Paid production is blocked until owner inspection.';
      job.printfulRecoveryStartedAt=recoveryStartedAt;
      job.printfulRecoveryPreviousStatus=previousStatus;
      await saveJob(env,job);
      const replacement=await env.ARTWORK.put(claimKey,JSON.stringify({
        startedAt:recoveryStartedAt,externalId,referenceVersion:3,recovery:true,
        recoveredFrom:{startedAt:verified.claimStartedAt||null,externalId:verified.legacyExternalId,verifiedEmptyAt:verified.checkedAt,storeId:verified.configuredStoreId}
      }),{onlyIf:{etagMatches:verified.claimEtag}});
      if(!replacement){
        job.holdReason='Recovery paused because the saved attempt changed during verification. Re-check Printful before any further action.';
        job.printfulRecoveryError='attempt_lock_changed';
        await saveJob(env,job);
        return json({ok:false,error:job.holdReason},409);
      }
      const payload={external_id:externalId,recipient:job.recipient,items:[{variant_id:map.printfulVariantId,quantity:Number(job.quantity||1)*Number(map.quantity||1),files:[{type:map.orderFileType||"default",url:sourceUrl,position:design.proof.position}]}]};
      let result;
      try{
        result=await printful(env,"/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      }catch(error){
        job.status='on_hold';job.holdReason='Recovery draft result is not confirmed. Keep this job on hold and use Check Printful status before any retry.';
        job.printfulRecoveryError=error.message||String(error);job.printfulRecoveryFailedAt=now();
        await saveJob(env,job);throw error;
      }
      job.printfulExternalId=externalId;job.printfulOrderId=result.id;job.printfulStatus=result.status||"draft";
      job.printSourceUrl=sourceUrl;job.printfulCreatedAt=now();job.recoveredPrintfulDraftAt=now();job.status='on_hold';
      job.holdReason=`Recovered Printful draft #${result.id} — inspect the draft before paid production.`;
      delete job.ownerReleaseError;delete job.autoPrintError;delete job.printfulRecoveryError;
      await saveJob(env,job);
      try{await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_DRAFT","RECAST_RECOVERED_DRAFT"])}
      catch(error){job.printfulRecoveryTagWarning=error.message||String(error);await saveJob(env,job)}
      return json({ok:true,recovered:true,productionSubmitted:false,printfulOrderId:String(result.id),externalId,job});
    }
    if(action==="create-draft"){
      if(job.digital)return json({ok:false,error:"Digital products do not use Printful."},400);
      if(!job.artApprovedAt)return json({ok:false,error:"Approve the artwork before creating a Printful draft."},409);
      if(!job.printReadyAt)return json({ok:false,error:"Prepare the high-resolution print file before creating a Printful draft."},409);
      if(job.printfulOrderId)return json({ok:true,job,alreadyCreated:true});
      if(job.status==='on_hold'||job.paymentRevokedAt)throw fault('order_hold','This order is on hold.');
      await verifyPaidOrder(env,job,{forProduction:true});const design=await approvedDesign(env,job);
      if(!design.proof?.position)throw fault('proof_placement_missing','Review a product preview with verified placement before printing.');
      if(!design.finalKey)throw fault('print_not_ready','Prepare the approved print file first.');
      const map=FULFILLMENT[job.sku];const sourceUrl=`${String(env.PUBLIC_APP_URL||'').replace(/\/$/,'')}/api/order-print/${encodeURIComponent(job.id)}?token=${encodeURIComponent(design.printToken)}`;
      const claim=`commerce/production/${await hash(job.id)}-draft.json`;
      // Existing attempts keep their exact reference and duplicate-submission lock.
      if(await env.ARTWORK.head(claim))throw fault('draft_started','Draft submission already started; review Printful before retrying.');
      const externalId=await printfulReferenceForNewDraft(job);
      if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now(),externalId,referenceVersion:2}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('draft_started','Draft submission already started; review Printful before retrying.');
      const payload={external_id:externalId,recipient:job.recipient,items:[{variant_id:map.printfulVariantId,quantity:Number(job.quantity||1)*Number(map.quantity||1),files:[{type:map.orderFileType||"default",url:sourceUrl,position:design.proof.position}]}]};
      const result=await printful(env,"/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      job.printfulExternalId=externalId;job.printfulOrderId=result.id;job.printfulStatus=result.status||"draft";job.printSourceUrl=sourceUrl;job.status="printful_draft_ready";job.printfulCreatedAt=now();await saveJob(env,job);return json({ok:true,job});
    }
    if(action==="release-recovered-draft"){
      const body=await request.json().catch(()=>({}));
      if(body.confirm!=="SEND_INSPECTED_RECOVERED_DRAFT")return json({ok:false,error:"Explicit inspected-draft production confirmation is required."},409);
      if(job.digital)return json({ok:false,error:"Digital products do not use Printful."},400);
      if(job.sentToProductionAt)return json({ok:true,job,alreadySent:true});
      if(job.status!=="on_hold"||!job.recoveredPrintfulDraftAt||!job.printfulOrderId||!job.printfulExternalId)return json({ok:false,error:"Only a recovered Printful draft that is still on hold can use this release."},409);
      if(job.paymentRevokedAt)throw fault('order_hold','This order is no longer eligible for production.');
      await verifyPaidOrder(env,job,{forProduction:true});
      const design=await approvedDesign(env,job);
      if(!design?.finalKey||!design?.proof?.position)throw fault('print_not_ready','The exact approved print file or placement is unavailable.',409);
      const current=await printful(env,`/orders/${encodeURIComponent(job.printfulOrderId)}`,{method:"GET"});
      if(String(current?.id)!==String(job.printfulOrderId)||current?.external_id!==job.printfulExternalId)return json({ok:false,error:"The Printful draft no longer matches this Recast order. Production was not started."},409);
      if(current?.store!==undefined&&String(current.store)!==String(env.PRINTFUL_STORE_ID||""))return json({ok:false,error:"The Printful draft belongs to a different configured store. Production was not started."},409);
      if(String(current?.status||"").toLowerCase()!=="draft")return json({ok:false,error:`Printful reports this order as ${String(current?.status||"unknown")}, not draft. Review it before any release.`},409);
      const claim=`commerce/production/${await hash(job.id)}-confirm.json`;
      const startedAt=now();
      if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt,printfulOrderId:String(job.printfulOrderId),externalId:job.printfulExternalId,recoveredDraft:true}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('production_started','Production submission already started; review Printful before retrying.');
      let result;
      try{result=await printful(env,`/orders/${encodeURIComponent(job.printfulOrderId)}/confirm`,{method:"POST"});}
      catch(error){job.status="on_hold";job.holdReason="Production confirmation result is unknown. Keep this recovered draft on hold and inspect Printful before any retry.";job.recoveredReleaseError=error.message||String(error);job.recoveredReleaseFailedAt=now();await saveJob(env,job);throw error;}
      job.status="submitted_to_printful";job.printfulStatus=result.status||"pending";job.sentToProductionAt=now();job.recoveredDraftReleasedAt=job.sentToProductionAt;
      delete job.holdReason;delete job.recoveredReleaseError;
      await saveJob(env,job);
      try{await addShopifyOrderTags(env,job.orderId,["RECAST_PRINTFUL_SUBMITTED","RECAST_RECOVERED_RELEASED"])}catch(error){job.recoveredReleaseTagWarning=error.message||String(error);await saveJob(env,job)}
      return json({ok:true,released:true,printfulOrderId:String(job.printfulOrderId),productionSubmitted:true,job});
    }
    if(action==="send-production"){
      const body=await request.json().catch(()=>({}));if(body.confirm!=="SEND_TO_PRODUCTION")return json({ok:false,error:"Explicit production confirmation is required."},409);
      if(!job.printfulOrderId)return json({ok:false,error:"Create a Printful draft first."},409);
      if(job.sentToProductionAt)return json({ok:true,job,alreadySent:true});
      if(job.status==='on_hold'||job.paymentRevokedAt)throw fault('order_hold','This order is on hold.');
      await verifyPaidOrder(env,job,{forProduction:true});await approvedDesign(env,job);
      const claim=`commerce/production/${await hash(job.id)}-confirm.json`;
      if(!await env.ARTWORK.put(claim,JSON.stringify({startedAt:now()}),{onlyIf:new Headers({'If-None-Match':'*'})}))throw fault('production_started','Production submission already started; review Printful before retrying.');
      const result=await printful(env,`/orders/${encodeURIComponent(job.printfulOrderId)}/confirm`,{method:"POST"});job.status="submitted_to_printful";job.printfulStatus=result.status||"pending";job.sentToProductionAt=now();await saveJob(env,job);return json({ok:true,job});
    }
    return json({ok:false,error:"Unknown job action."},404);
  }catch(error){return json({ok:false,error:error.message},error.status||500)}
}

function cleanMention(text,username){return String(text||"").replace(new RegExp(`@${String(username||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`,"ig"),"").replace(/\s+/g," ").trim()}
export async function pollXMentions(env){
  return runSocialPipeline(env);
}

const TREND_REJECT=["war","invasion","airstrike","bombing","shooting","murder","killed","death","dead","funeral","earthquake","wildfire","flood","hurricane","tornado","hostage","terror","genocide","hate crime"];
const TREND_REVIEW=["election","vote","president","senate","congress","governor","protest","boycott","lawsuit","scandal","celebrity","movie","disney","marvel","dc","pokemon","star wars","harry potter","fortnite","minecraft"];
function classifyTrend(name){const v=String(name||"").toLowerCase();if(TREND_REJECT.some(x=>v.includes(x)))return"rejected";if(TREND_REVIEW.some(x=>v.includes(x)))return"review";return"safe"}
export async function scanTrends(env){
  if(String(env.TREND_SCANNER_ENABLED||"false")!=="true")return{ok:true,disabled:true};
  if(!env.X_APP_BEARER_TOKEN)return{ok:false,error:"X app bearer token missing."};
  const response=await fetch(`${X_API}/trends/by/woeid/1`,{headers:{Authorization:`Bearer ${env.X_APP_BEARER_TOKEN}`}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.detail||data?.title||`X trends HTTP ${response.status}`);
  const trends=data.data||data.trends||[];let saved=0;
  for(const [i,t] of trends.slice(0,40).entries()){
    const name=t.name||t.trend?.name||String(t);const status=classifyTrend(name);if(status==="rejected")continue;
    const id=sanitizeId(`${new Date().toISOString().slice(0,10)}-${i}-${name}`);if(await env.ARTWORK.head(trendKey(id)))continue;
    await putJson(env,trendKey(id),{id,name,status,rank:i+1,createdAt:now(),source:"x-worldwide",decision:status==="safe"?"background-idea":"needs-human-approval"});saved++;
  }
  await putJson(env,"system/trend-scan.json",{lastRun:now(),saved,count:trends.length});return{ok:true,saved,count:trends.length}
}

export async function adminTrendAction(request,env,id,action){
  try{
    requireAdmin(request,env);
    const key=trendKey(id);const trend=await readJson(env,key);
    if(!trend)return json({ok:false,error:"Trend item not found."},404);
    if(action==="approve"){
      trend.status="approved";trend.decision="approved-by-human";trend.reviewedAt=now();
    }else if(action==="reject"){
      trend.status="rejected";trend.decision="rejected-by-human";trend.reviewedAt=now();
    }else return json({ok:false,error:"Unknown trend action."},404);
    await putJson(env,key,trend);return json({ok:true,trend});
  }catch(error){return json({ok:false,error:error.message},error.status||500)}
}

export async function cleanupExpiredUnpaid(env){
  if(!env.ARTWORK)return{ok:false,error:"R2 missing"};
  const days=Math.max(1,Number(env.UNPAID_RETENTION_DAYS||30));const cutoff=Date.now()-days*86400000;
  const listed=await env.ARTWORK.list({prefix:"requests/",limit:1000});let deleted=0,checked=0;
  for(const object of listed.objects||[]){
    if(!object.key.endsWith("/request.json"))continue;checked++;
    const meta=await readJson(env,object.key);if(!meta||meta.paid)continue;
    const created=Date.parse(meta.createdAt||"");if(!Number.isFinite(created)||created>=cutoff)continue;
    const reqPrefix=`requests/${meta.requestId}/`;const reqList=await env.ARTWORK.list({prefix:reqPrefix,limit:1000});const reqKeys=(reqList.objects||[]).map(o=>o.key);if(reqKeys.length)await env.ARTWORK.delete(reqKeys);
    const mockPrefix=`mockups/${meta.requestId}/`;const mockList=await env.ARTWORK.list({prefix:mockPrefix,limit:1000});const mockKeys=(mockList.objects||[]).map(o=>o.key);if(mockKeys.length)await env.ARTWORK.delete(mockKeys);
    deleted++;
  }
  await putJson(env,"system/retention-cleanup.json",{lastRun:now(),checked,deleted,days});return{ok:true,checked,deleted,days}
}

export async function scheduledWorkflow(controller,env,ctx){
  if(controller.cron==='* * * * *')return pollXMentions(env);
  const tasks=[];
  if(String(env.ORDER_SYNC_ENABLED||"false")==="true")tasks.push((async()=>{
    const orders=await syncPaidOrders(env);
    const legacy=await retryLegacyOwnerReleaseCandidates(env);
    const printful=await syncPrintfulJobs(env);
    return{orders,legacy,printful};
  })());
  if(String(env.TREND_SCANNER_ENABLED||"false")==="true")tasks.push(scanTrends(env));
  if(String(env.RETENTION_CLEANUP_ENABLED||"false")==="true")tasks.push(cleanupExpiredUnpaid(env));
  const results=await Promise.allSettled(tasks);return results
}

export async function routeWorkflow(request,env,ctx){
  const url=new URL(request.url);const p=url.pathname;
  if(p==="/api/client-diagnostic"&&request.method==="POST")return clientDiagnostic(request,env);
  if(p==="/api/printful-health"&&request.method==="GET")return printfulHealth(env);
  if(p==="/api/mockup/create"&&request.method==="POST")return createMockup(request,env);
  if(p==="/api/mockup/status"&&request.method==="GET")return mockupStatus(request,env);
  let m=p.match(/^\/api\/print-source\/([^/]+)$/);if(m&&request.method==="GET")return servePrintSource(request,env,decodeURIComponent(m[1]));
  m=p.match(/^\/api\/mockup\/image\/([^/]+)\/([^/]+)\/(\d+)$/);if(m&&request.method==="GET")return serveMockupImage(request,env,decodeURIComponent(m[1]),decodeURIComponent(m[2]),Number(m[3]));
  if(p==="/api/order-status"&&request.method==="GET")return customerOrderStatus(request,env);
  const designPreview=p.match(/^\/api\/order-design\/([a-zA-Z0-9._-]+)\/preview$/);
  if(designPreview&&request.method==='GET'){
    try{
      const job=await loadJob(env,designPreview[1]);await requireRequest(env,job.requestId,url.searchParams.get('token'));
      const d=await designFor(env,job),object=await env.ARTWORK.get(d.snapshotKey||requestKey(d.selectedRequestId,'preview.b64'));
      if(!object)return privateJson({ok:false,error:'Artwork unavailable'},404);
      // The security boundary flattens the watermark before serving this image.
      return new Response(decodeBase64(await object.text()),{headers:{'content-type':'image/jpeg','cache-control':'private, no-store'}});
    }catch(e){return privateJson({ok:false,error:e.message},e.status||503)}
  }
  const orderAction=p.match(/^\/api\/order-design\/([a-zA-Z0-9._-]+)\/(swap|proof|approve)$/);
  if(orderAction&&request.method==='POST'){
    try{return await customerDesignAction(request,env,orderAction[1],orderAction[2],{verifyPaid:verifyPaidOrder,proof:prepareOrderProof})}
    catch(e){return privateJson({ok:false,error:e.message},e.status||503)}
  }
  const bonus=p.match(/^\/api\/order-bonus\/([a-zA-Z0-9._-]+)$/);
  if(bonus&&request.method==='POST'){
    try{
      sameOrigin(request);if(!creditsEnabled(env))throw fault('credits_disabled','Purchase credits are not enabled yet.',503);
      const body=await request.json(),job=await loadJob(env,bonus[1]);await requireRequest(env,job.requestId,body.token);
      const wallet=await walletFor(request,env);if(!wallet)throw fault('credits_required','Prepare your preview account first.',401);
      const order=await verifyPaidOrder(env,job),grant=await reconcileOrderCredits(env,order,wallet.id);
      if(grant.walletId!==wallet.id)throw fault('credits_already_linked','This order’s bonus is linked to the browser used to create its artwork. Use that browser or contact support for recovery.');
      return privateJson({ok:true,...await creditBalance(env,wallet)});
    }catch(e){return privateJson({ok:false,error:e.message},e.status||503)}
  }
  m=p.match(/^\/api\/digital-download\/([^/]+)$/);if(m&&request.method==="GET")return digitalDownload(request,env,decodeURIComponent(m[1]));
  m=p.match(/^\/api\/recast\/([^/]+)$/);if(m&&request.method==="DELETE")return deleteUnpaidRecast(request,env,decodeURIComponent(m[1]));
  if(p==="/api/admin/status"&&request.method==="GET")return adminStatus(request,env);
  if(p==='/api/admin/render-readiness'&&request.method==='GET'){
    try{requireAdmin(request,env);return json({ok:true,render:await renderHealth(env),social:socialReadiness(env),quotaAction:'Cloudflare error 3036 requires Workers Paid billing. A code update cannot increase the shared free allowance.'});}
    catch(error){return json({ok:false,error:error.message},error.status||500);}
  }
  if(p==="/api/admin/jobs"&&request.method==="GET")return adminJobs(request,env);
  if(p==="/api/admin/product-candidates"&&request.method==="GET")return adminProductCandidates(request,env);
  if(p==="/api/admin/generation-errors"&&request.method==="GET")return adminGenerationErrors(request,env);
  if(p==="/api/admin/trends"&&request.method==="GET")return adminTrends(request,env);
  if(p==="/api/admin/social"&&request.method==="GET")return adminSocial(request,env);
  if(p==="/api/admin/sync-orders"&&request.method==="POST")return adminSyncOrders(request,env);
  m=p.match(/^\/api\/admin\/job\/([^/]+)\/(approve-art|finalize-art|hold|create-draft|recover-missing-draft|release-recovered-draft|send-production)$/);if(m&&request.method==="POST")return adminJobAction(request,env,decodeURIComponent(m[1]),m[2]);
  if(p==="/api/admin/poll-x"&&request.method==="POST"){try{requireAdmin(request,env);return json(await pollXMentions(env))}catch(error){return json({ok:false,error:error.message},error.status||500)}}
  if(p==="/api/admin/scan-trends"&&request.method==="POST"){try{requireAdmin(request,env);return json(await scanTrends(env))}catch(error){return json({ok:false,error:error.message},error.status||500)}}
  m=p.match(/^\/api\/admin\/trend\/([^/]+)\/(approve|reject)$/);if(m&&request.method==="POST")return adminTrendAction(request,env,decodeURIComponent(m[1]),m[2]);
  return null;
}
