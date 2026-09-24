import { FULFILLMENT } from "./entry.js";

const X_API = "https://api.x.com/2";
const PRINTFUL_API = "https://api.printful.com";

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
function now(){return new Date().toISOString()}
function randomHex(byteCount=18){const bytes=new Uint8Array(byteCount);crypto.getRandomValues(bytes);return[...bytes].map(b=>b.toString(16).padStart(2,"0")).join("")}
function requestKey(id,suffix){return `requests/${id}/${suffix}`}
function jobKey(id){return `jobs/${id}.json`}
function mockupKey(id,sku){return `mockups/${id}/${sku}/task.json`}
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
function requireAdmin(request,env){
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
  if(!env.PRINTFUL_API_TOKEN)throw Object.assign(new Error("Printful is not connected."),{status:503});
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
  return new Response(bytes,{headers:{"content-type":"image/jpeg","cache-control":"private, max-age=300","x-content-type-options":"nosniff"}})
}

export async function createMockup(request,env){
  try{
    const body=await request.json().catch(()=>({}));
    const requestId=String(body.requestId||"");const accessToken=String(body.accessToken||"");const sku=String(body.sku||"");
    let meta=await requireRequest(env,requestId,accessToken);
    const map=FULFILLMENT[sku];
    if(!map)return json({ok:false,error:"Unknown Recast product."},400);
    if(map.digital)return json({ok:false,error:"Digital products do not need a physical mockup."},400);
    if(!map.printfulProductId||!map.printfulVariantId)return json({ok:false,error:"This product is not mapped to Printful yet."},500);
    meta=await ensurePrintToken(env,meta);
    const sourceUrl=`${appBase(env,request)}/api/print-source/${encodeURIComponent(requestId)}?token=${encodeURIComponent(meta.printAccessToken)}`;
    const payload={variant_ids:[map.printfulVariantId],format:"jpg",width:1200,files:[{placement:map.preferredPlacement||"default",image_url:sourceUrl}]};
    const result=await printful(env,`/mockup-generator/create-task/${map.printfulProductId}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
    const record={requestId,sku,taskKey:result.task_key,status:result.status||"pending",createdAt:now(),updatedAt:now(),mockupAccessToken:randomHex(24),sourceUrl,printfulProductId:map.printfulProductId,printfulVariantId:map.printfulVariantId};
    await putJson(env,mockupKey(requestId,sku),record);
    return json({ok:true,status:record.status,taskKey:record.taskKey,sku,waitSeconds:10});
  }catch(error){return json({ok:false,error:error?.message||String(error)},error.status||500)}
}

async function persistMockups(env,record,result,request){
  const urls=[];let index=0;
  const candidates=[];
  for(const mockup of result.mockups||[]){
    if(mockup.mockup_url)candidates.push({url:mockup.mockup_url,title:mockup.display_name||mockup.placement||"Mockup"});
    for(const extra of mockup.extra||[])if(extra.url)candidates.push({url:extra.url,title:extra.title||extra.option||"Mockup"});
  }
  for(const item of candidates.slice(0,4)){
    const response=await fetch(item.url);
    if(!response.ok)continue;
    const bytes=await response.arrayBuffer();
    const key=`mockups/${record.requestId}/${record.sku}/image-${index}.jpg`;
    await env.ARTWORK.put(key,bytes,{httpMetadata:{contentType:"image/jpeg"}});
    urls.push({title:item.title,url:`${appBase(env,request)}/api/mockup/image/${encodeURIComponent(record.requestId)}/${encodeURIComponent(record.sku)}/${index}?token=${encodeURIComponent(record.mockupAccessToken)}`});
    index++;
  }
  record.images=urls;record.status="completed";record.updatedAt=now();
  await putJson(env,mockupKey(record.requestId,record.sku),record);
  return record;
}

export async function mockupStatus(request,env){
  try{
    const url=new URL(request.url);const requestId=String(url.searchParams.get("requestId")||"");const token=String(url.searchParams.get("token")||"");const sku=String(url.searchParams.get("sku")||"");
    await requireRequest(env,requestId,token);
    let record=await readJson(env,mockupKey(requestId,sku));
    if(!record)return json({ok:false,error:"Mockup task not found."},404);
    if(record.status==="completed"&&record.images?.length)return json({ok:true,status:"completed",images:record.images});
    const result=await printful(env,`/mockup-generator/task?task_key=${encodeURIComponent(record.taskKey)}`,{method:"GET"});
    if(result.status==="failed"){
      record.status="failed";record.error=result.error||"Printful could not generate this mockup.";record.updatedAt=now();await putJson(env,mockupKey(requestId,sku),record);
      return json({ok:false,status:"failed",error:record.error},502);
    }
    if(result.status!=="completed")return json({ok:true,status:"pending",waitSeconds:10});
    record=await persistMockups(env,record,result,request);
    return json({ok:true,status:"completed",images:record.images});
  }catch(error){return json({ok:false,error:error?.message||String(error)},error.status||500)}
}

export async function serveMockupImage(request,env,requestId,sku,index){
  const url=new URL(request.url);const token=url.searchParams.get("token")||"";
  const record=await readJson(env,mockupKey(requestId,sku));
  if(!record||!safeEqual(record.mockupAccessToken,token))return new Response("Not found",{status:404});
  const object=await env.ARTWORK?.get(`mockups/${requestId}/${sku}/image-${index}.jpg`);
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

function artworkFromLine(line){return(line.customAttributes||[]).find(a=>a.key==="Artwork ID")?.value||""}
function recipientFromOrder(order){
  const a=order.shippingAddress||{};return{name:a.name||[a.firstName,a.lastName].filter(Boolean).join(" "),company:a.company||undefined,address1:a.address1,address2:a.address2||undefined,city:a.city,state_code:a.provinceCode||undefined,state_name:a.province||undefined,country_code:a.countryCodeV2,zip:a.zip,phone:a.phone||undefined,email:order.email||undefined};
}

export async function syncPaidOrders(env){
  if(!env.ARTWORK)return{ok:false,error:"R2 missing"};
  const data=await shopifyGraphQL(env,`query RecastPaidOrders {
    orders(first: 25, sortKey: CREATED_AT, reverse: true, query: "financial_status:paid") {
      nodes { id name createdAt email displayFinancialStatus
        shippingAddress { name firstName lastName company address1 address2 city province provinceCode countryCodeV2 zip phone }
        lineItems(first: 50) { nodes { name sku quantity customAttributes { key value } } }
      }
    }
  }`);
  let created=0,seen=0;
  for(const order of data.orders?.nodes||[]){
    for(const line of order.lineItems?.nodes||[]){
      const requestId=artworkFromLine(line);if(!requestId||!line.sku||!FULFILLMENT[line.sku])continue;seen++;
      const id=sanitizeId(`${order.name}-${requestId}-${line.sku}`);const key=jobKey(id);if(await env.ARTWORK.head(key))continue;
      const map=FULFILLMENT[line.sku];const job={id,orderId:order.id,orderName:order.name,orderCreatedAt:order.createdAt,financialStatus:order.displayFinancialStatus,requestId,sku:line.sku,quantity:line.quantity,product:map.product,digital:Boolean(map.digital),recipient:recipientFromOrder(order),status:map.digital?"digital_fulfillment_pending":"awaiting_art_approval",createdAt:now(),updatedAt:now(),printfulVariantId:map.printfulVariantId||null,printfulProductId:map.printfulProductId||null};
      await putJson(env,key,job);created++;
      const meta=await requestMeta(env,requestId);if(meta){meta.paid=true;meta.orderName=order.name;meta.fulfillment=job.status;if(map.digital){meta.digitalEntitlement=line.sku;meta.digitalPaidAt=now()}meta.updatedAt=now();await putJson(env,requestKey(requestId,"request.json"),meta)}
    }
  }
  await putJson(env,"system/order-sync.json",{lastRun:now(),created,seen});
  return{ok:true,created,seen}
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
      if(order.status==="fulfilled")job.status="shipped";
      else if(order.status==="failed")job.status="printful_failed";
      else if(order.status==="canceled")job.status="canceled";
      else if(job.sentToProductionAt)job.status="in_printful_production";
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
    const jobs=(await listJson(env,"jobs/",100)).filter(j=>j.requestId===requestId);
    return json({ok:true,request:{requestId,styleName:meta.styleName,paid:Boolean(meta.paid),orderName:meta.orderName||null,digitalEntitlement:meta.digitalEntitlement||null},jobs:jobs.map(j=>({id:j.id,orderName:j.orderName,product:j.product,sku:j.sku,status:j.status,digital:j.digital,createdAt:j.createdAt,printfulStatus:j.printfulStatus||null,trackingUrl:j.trackingUrl||null}))});
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
    return new Response(bytes,{headers:{"content-type":"image/jpeg","content-disposition":`attachment; filename=\"${requestId}-recast.jpg\"`,"cache-control":"private, no-store"}});
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

export async function adminStatus(request,env){
  try{requireAdmin(request,env);const jobs=await listJson(env,"jobs/",100);const trends=await listJson(env,"trends/",100);const socials=await listJson(env,"social/x/",100);return json({ok:true,version:"1.0",jobs:{total:jobs.length,awaiting:jobs.filter(x=>!String(x.status).includes("completed")&&!String(x.status).includes("shipped")).length},trends:{total:trends.length,review:trends.filter(x=>x.status==="review").length},xRequests:socials.length,connections:{shopify:Boolean(env.SHOPIFY_CLIENT_ID&&env.SHOPIFY_CLIENT_SECRET),printful:Boolean(env.PRINTFUL_API_TOKEN),images:Boolean(env.IMAGES),x:Boolean(env.X_USER_ACCESS_TOKEN&&env.X_USER_ID),admin:true},automation:{orderSync:String(env.ORDER_SYNC_ENABLED||"false")==="true",xBot:String(env.X_BOT_ENABLED||"false")==="true",trendScanner:String(env.TREND_SCANNER_ENABLED||"false")==="true",retentionCleanup:String(env.RETENTION_CLEANUP_ENABLED||"false")==="true"}})}catch(error){return json({ok:false,error:error.message},error.status||500)}
}
export async function adminJobs(request,env){try{requireAdmin(request,env);const jobs=await listJson(env,"jobs/",100);jobs.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({ok:true,jobs})}catch(error){return json({ok:false,error:error.message},error.status||500)}}
export async function adminTrends(request,env){try{requireAdmin(request,env);const rows=await listJson(env,"trends/",100);rows.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({ok:true,trends:rows})}catch(error){return json({ok:false,error:error.message},error.status||500)}}
export async function adminSocial(request,env){try{requireAdmin(request,env);const rows=await listJson(env,"social/x/",100);const listed=await env.ARTWORK?.list({prefix:"requests/",limit:1000});const byTweet=new Map();for(const object of listed?.objects||[]){if(!object.key.endsWith("/request.json"))continue;const meta=await readJson(env,object.key);if(meta?.sourceTweet)byTweet.set(String(meta.sourceTweet),meta)}for(const row of rows){const meta=byTweet.get(String(row.tweetId));if(meta){row.recastRequestId=meta.requestId;row.converted=true;row.paid=Boolean(meta.paid)}}rows.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));return json({ok:true,requests:rows})}catch(error){return json({ok:false,error:error.message},error.status||500)}}
export async function adminSyncOrders(request,env){try{requireAdmin(request,env);const orders=await syncPaidOrders(env);const printful=await syncPrintfulJobs(env);return json({ok:true,created:orders.created||0,seen:orders.seen||0,printfulUpdated:printful.updated||0})}catch(error){return json({ok:false,error:error.message},error.status||500)}}

async function finalizePrintArt(env,job){
  if(job.digital){
    job.printReadyAt=now();job.status="digital_ready";await saveJob(env,job);return job;
  }
  if(!env.IMAGES)throw Object.assign(new Error("High-resolution print finishing is not enabled yet. Add the Cloudflare Images binding before producing physical orders."),{status:503});
  const preview=await env.ARTWORK?.get(requestKey(job.requestId,"preview.b64"));
  if(!preview)throw Object.assign(new Error("Source artwork is missing."),{status:404});
  const bytes=decodeBase64(await preview.text());
  const stream=new Response(bytes,{headers:{"content-type":"image/jpeg"}}).body;
  const optimized=await env.IMAGES.input(stream)
    .transform({width:4096,fit:"scale-up",upscale:"generate"})
    .output({format:"image/jpeg",quality:95});
  const response=await optimized.response();
  if(!response.ok)throw Object.assign(new Error(`High-resolution image finishing failed (${response.status}).`),{status:502});
  const out=await response.arrayBuffer();
  await env.ARTWORK.put(requestKey(job.requestId,"final-print.jpg"),out,{httpMetadata:{contentType:"image/jpeg"}});
  const meta=await requestMeta(env,job.requestId);
  if(meta){meta.finalPrint={status:"ready",createdAt:now(),method:"cloudflare-images-ai-upscale",targetWidth:4096};meta.updatedAt=now();await putJson(env,requestKey(job.requestId,"request.json"),meta)}
  job.printReadyAt=now();job.printReadyMethod="cloudflare-images-ai-upscale";job.status="ready_for_printful_draft";await saveJob(env,job);return job;
}

export async function adminJobAction(request,env,id,action){
  try{
    requireAdmin(request,env);let job=await loadJob(env,id);
    if(action==="approve-art"){
      job.artApprovedAt=now();job.status=job.digital?"digital_ready":"art_approved_needs_high_res";await saveJob(env,job);return json({ok:true,job});
    }
    if(action==="finalize-art"){
      if(!job.artApprovedAt)return json({ok:false,error:"Approve the artwork before preparing the print file."},409);
      job=await finalizePrintArt(env,job);return json({ok:true,job});
    }
    if(action==="hold"){
      const body=await request.json().catch(()=>({}));job.status="on_hold";job.holdReason=String(body.reason||"Manual hold");await saveJob(env,job);return json({ok:true,job});
    }
    if(action==="create-draft"){
      if(job.digital)return json({ok:false,error:"Digital products do not use Printful."},400);
      if(!job.artApprovedAt)return json({ok:false,error:"Approve the artwork before creating a Printful draft."},409);
      if(!job.printReadyAt)return json({ok:false,error:"Prepare the high-resolution print file before creating a Printful draft."},409);
      if(job.printfulOrderId)return json({ok:true,job,alreadyCreated:true});
      let meta=await requestMeta(env,job.requestId);if(!meta)return json({ok:false,error:"Artwork metadata missing."},404);meta=await ensurePrintToken(env,meta);
      const map=FULFILLMENT[job.sku];const sourceUrl=`${String(env.PUBLIC_APP_URL||"").replace(/\/$/,"")}/api/print-source/${encodeURIComponent(job.requestId)}?token=${encodeURIComponent(meta.printAccessToken)}&final=1`;
      const payload={external_id:`recast-${job.id}`,recipient:job.recipient,items:[{variant_id:map.printfulVariantId,quantity:Number(job.quantity||1)*Number(map.quantity||1),files:[{type:map.orderFileType||"default",url:sourceUrl}]}]};
      const result=await printful(env,"/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
      job.printfulOrderId=result.id;job.printfulStatus=result.status||"draft";job.printSourceUrl=sourceUrl;job.status="printful_draft_ready";job.printfulCreatedAt=now();await saveJob(env,job);return json({ok:true,job});
    }
    if(action==="send-production"){
      const body=await request.json().catch(()=>({}));if(body.confirm!=="SEND_TO_PRODUCTION")return json({ok:false,error:"Explicit production confirmation is required."},409);
      if(!job.printfulOrderId)return json({ok:false,error:"Create a Printful draft first."},409);
      const result=await printful(env,`/orders/${encodeURIComponent(job.printfulOrderId)}/confirm`,{method:"POST"});job.status="submitted_to_printful";job.printfulStatus=result.status||"pending";job.sentToProductionAt=now();await saveJob(env,job);return json({ok:true,job});
    }
    return json({ok:false,error:"Unknown job action."},404);
  }catch(error){return json({ok:false,error:error.message},error.status||500)}
}

function cleanMention(text,username){return String(text||"").replace(new RegExp(`@${String(username||"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`,"ig"),"").replace(/\s+/g," ").trim()}
export async function pollXMentions(env){
  if(String(env.X_BOT_ENABLED||"false")!=="true")return{ok:true,disabled:true};
  if(String(env.X_BOT_APPROVED||"false")!=="true")return{ok:false,disabled:true,error:"X bot is not marked approved for AI-generated automated replies."};
  if(!env.X_USER_ID||!env.X_USER_ACCESS_TOKEN||!env.X_USERNAME)return{ok:false,error:"X credentials are incomplete."};
  const state=await readJson(env,"system/x-state.json")||{};
  const params=new URLSearchParams({max_results:"20","tweet.fields":"created_at,author_id,conversation_id"});if(state.sinceId)params.set("since_id",state.sinceId);
  const response=await fetch(`${X_API}/users/${encodeURIComponent(env.X_USER_ID)}/mentions?${params}`,{headers:{Authorization:`Bearer ${env.X_USER_ACCESS_TOKEN}`}});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data?.detail||data?.title||`X mentions HTTP ${response.status}`);
  const tweets=[...(data.data||[])].sort((a,b)=>BigInt(a.id)<BigInt(b.id)?-1:1);let replied=0,last=state.sinceId||null;
  for(const tweet of tweets){
    last=tweet.id;const requestText=cleanMention(tweet.text,env.X_USERNAME);if(!requestText)continue;
    const link=`${String(env.PUBLIC_APP_URL||"").replace(/\/$/,"")}/?source=x&tweet=${encodeURIComponent(tweet.id)}&request=${encodeURIComponent(requestText)}`;
    const replyText=`Your Recast request is ready to start ✨ Upload your photo privately here: ${link}`;
    const post=await fetch(`${X_API}/tweets`,{method:"POST",headers:{Authorization:`Bearer ${env.X_USER_ACCESS_TOKEN}`,"content-type":"application/json"},body:JSON.stringify({text:replyText,reply:{in_reply_to_tweet_id:tweet.id}})});
    const posted=await post.json().catch(()=>({}));
    const record={tweetId:tweet.id,authorId:tweet.author_id,requestText,link,createdAt:now(),replyStatus:post.ok?"replied":"failed",replyPostId:posted?.data?.id||null,error:post.ok?null:(posted?.detail||posted?.title||`HTTP ${post.status}`)};await putJson(env,socialKey(tweet.id),record);if(post.ok)replied++;
  }
  if(last)await putJson(env,"system/x-state.json",{sinceId:last,lastRun:now(),replied});return{ok:true,found:tweets.length,replied,sinceId:last}
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
  const tasks=[];
  if(String(env.ORDER_SYNC_ENABLED||"false")==="true"){tasks.push(syncPaidOrders(env));tasks.push(syncPrintfulJobs(env));}
  if(String(env.X_BOT_ENABLED||"false")==="true")tasks.push(pollXMentions(env));
  if(String(env.TREND_SCANNER_ENABLED||"false")==="true")tasks.push(scanTrends(env));
  if(String(env.RETENTION_CLEANUP_ENABLED||"false")==="true")tasks.push(cleanupExpiredUnpaid(env));
  const results=await Promise.allSettled(tasks);return results
}

export async function routeWorkflow(request,env,ctx){
  const url=new URL(request.url);const p=url.pathname;
  if(p==="/api/mockup/create"&&request.method==="POST")return createMockup(request,env);
  if(p==="/api/mockup/status"&&request.method==="GET")return mockupStatus(request,env);
  let m=p.match(/^\/api\/print-source\/([^/]+)$/);if(m&&request.method==="GET")return servePrintSource(request,env,decodeURIComponent(m[1]));
  m=p.match(/^\/api\/mockup\/image\/([^/]+)\/([^/]+)\/(\d+)$/);if(m&&request.method==="GET")return serveMockupImage(request,env,decodeURIComponent(m[1]),decodeURIComponent(m[2]),Number(m[3]));
  if(p==="/api/order-status"&&request.method==="GET")return customerOrderStatus(request,env);
  m=p.match(/^\/api\/digital-download\/([^/]+)$/);if(m&&request.method==="GET")return digitalDownload(request,env,decodeURIComponent(m[1]));
  m=p.match(/^\/api\/recast\/([^/]+)$/);if(m&&request.method==="DELETE")return deleteUnpaidRecast(request,env,decodeURIComponent(m[1]));
  if(p==="/api/admin/status"&&request.method==="GET")return adminStatus(request,env);
  if(p==="/api/admin/jobs"&&request.method==="GET")return adminJobs(request,env);
  if(p==="/api/admin/trends"&&request.method==="GET")return adminTrends(request,env);
  if(p==="/api/admin/social"&&request.method==="GET")return adminSocial(request,env);
  if(p==="/api/admin/sync-orders"&&request.method==="POST")return adminSyncOrders(request,env);
  m=p.match(/^\/api\/admin\/job\/([^/]+)\/(approve-art|finalize-art|hold|create-draft|send-production)$/);if(m&&request.method==="POST")return adminJobAction(request,env,decodeURIComponent(m[1]),m[2]);
  if(p==="/api/admin/poll-x"&&request.method==="POST"){try{requireAdmin(request,env);return json(await pollXMentions(env))}catch(error){return json({ok:false,error:error.message},error.status||500)}}
  if(p==="/api/admin/scan-trends"&&request.method==="POST"){try{requireAdmin(request,env);return json(await scanTrends(env))}catch(error){return json({ok:false,error:error.message},error.status||500)}}
  m=p.match(/^\/api\/admin\/trend\/([^/]+)\/(approve|reject)$/);if(m&&request.method==="POST")return adminTrendAction(request,env,decodeURIComponent(m[1]),m[2]);
  return null;
}
