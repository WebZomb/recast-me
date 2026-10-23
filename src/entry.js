import {applyHolidayDiscount} from './holiday-campaigns.js';
import {isNativeAppRequest, digitalUnavailableInAppResponse} from './app-channel.js';
import {checkStoredArtwork} from './content-safety.js';
import core, { shopifyCatalog } from "./index.js";
import {createMockup} from "./workflow.js";
import { hash, normalizeProductDesign, recommendedCheckoutDesign } from "./commerce-store.js";

export const FULFILLMENT = {
  "RECAST-HOODIE-S":      { printfulProductId: 380, printfulVariantId: 10779, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-M":      { printfulProductId: 380, printfulVariantId: 10780, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-L":      { printfulProductId: 380, printfulVariantId: 10781, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-XL":     { printfulProductId: 380, printfulVariantId: 10782, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-2XL":    { printfulProductId: 380, printfulVariantId: 10783, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 29.84, product: "Hoodie", color: "Black" },

  "RECAST-TEE-S":         { printfulProductId: 71, printfulVariantId: 4016, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-M":         { printfulProductId: 71, printfulVariantId: 4017, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-L":         { printfulProductId: 71, printfulVariantId: 4018, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-XL":        { printfulProductId: 71, printfulVariantId: 4019, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-2XL":       { printfulProductId: 71, printfulVariantId: 4020, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 13.92, product: "T-Shirt", color: "Black" },

  "RECAST-BLANKET-50X60": { printfulProductId: 395, printfulVariantId: 10986, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 29.36, product: "Blanket" },
  "RECAST-BLANKET-60X80": { printfulProductId: 395, printfulVariantId: 13222, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 39.76, product: "Blanket" },

  "RECAST-POSTER-12X16":  { printfulProductId: 1, printfulVariantId: 1349, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 11.11, product: "Poster" },
  "RECAST-POSTER-18X24":  { printfulProductId: 1, printfulVariantId: 1, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 13.15, product: "Poster" },
  "RECAST-POSTER-24X36":  { printfulProductId: 1, printfulVariantId: 2, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 18.25, product: "Poster" },

  "RECAST-FRAME-8X10":    { printfulProductId: 2, printfulVariantId: 4651, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 20.76, product: "Framed Poster", color: "Black" },
  "RECAST-FRAME-12X16":   { printfulProductId: 2, printfulVariantId: 1350, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 32.20, product: "Framed Poster", color: "Black" },
  "RECAST-FRAME-18X24":   { printfulProductId: 2, printfulVariantId: 3, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 46.30, product: "Framed Poster", color: "Black" },

  "RECAST-CANVAS-12X16":  { printfulProductId: 3, printfulVariantId: 5, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 23.41, product: "Canvas" },
  "RECAST-CANVAS-18X24":  { printfulProductId: 3, printfulVariantId: 7, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 33.66, product: "Canvas" },
  "RECAST-CANVAS-24X36":  { printfulProductId: 3, printfulVariantId: 825, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 52.02, product: "Canvas" },

  "RECAST-MUG-11OZ":      { printfulProductId: 19, printfulVariantId: 1320, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 6.07, product: "Mug", color: "White" },
  "RECAST-MUG-15OZ":      { printfulProductId: 19, printfulVariantId: 4830, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 8.11, product: "Mug", color: "White" },

  "RECAST-TUMBLER-20OZ":  { printfulProductId: 909, printfulVariantId: 23470, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 24.97, product: "Tumbler", color: "White" },
  "RECAST-MAGNET-SET":     { printfulProductId: 656, printfulVariantId: 16366, preferredPlacement: "default", orderFileType: "default", quantity: 3, baseCost: 3.39, product: "Magnet 3-Pack", color: "White" },
  "RECAST-COASTER-SET":    { printfulProductId: 611, printfulVariantId: 15662, preferredPlacement: "default", orderFileType: "default", quantity: 4, baseCost: 5.55, product: "Coaster 4-Pack" },

  "RECAST-STICKER-PACK": { printfulProductId: 505, printfulVariantId: 12917, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 5.15, product: "Sticker Sheet" },
  "RECAST-STICKER-3X3":    { printfulProductId: 358, printfulVariantId: 10163, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 2.34, product: "Sticker" },
  "RECAST-PILLOW-14":      { printfulProductId: 83, printfulVariantId: 49853, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 13.57, product: "Pillow" },
  "RECAST-PILLOW-16":      { printfulProductId: 83, printfulVariantId: 49854, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 14.59, product: "Pillow" },
  "RECAST-PILLOW-18":      { printfulProductId: 83, printfulVariantId: 4532, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 16.6, product: "Pillow" },
  "RECAST-PILLOW-22":      { printfulProductId: 83, printfulVariantId: 11075, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 18.68, product: "Pillow" },
  "RECAST-JOURNAL-HC":     { printfulProductId: 867, printfulVariantId: 22658, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 9.77, product: "Hardcover Journal" },
  "RECAST-TOTE-BLACK":     { printfulProductId: 84, printfulVariantId: 4533, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 17.60, product: "Tote Bag" },
  "RECAST-PUZZLE-252":     { printfulProductId: 534, printfulVariantId: 13431, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 15.25, product: "Puzzle" },
  "RECAST-PUZZLE-520":     { printfulProductId: 534, printfulVariantId: 13432, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 24.92, product: "Puzzle" },
  // RM143: verified glossy Tough Case; legacy clear-case SKUs remain immutable.
  "RECAST-TOUGH-IP14": { printfulProductId: 601, printfulVariantId: 16124, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP14PLUS": { printfulProductId: 601, printfulVariantId: 16128, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP14PRO": { printfulProductId: 601, printfulVariantId: 16126, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP14PM": { printfulProductId: 601, printfulVariantId: 16130, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP15": { printfulProductId: 601, printfulVariantId: 17714, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP15PRO": { printfulProductId: 601, printfulVariantId: 17718, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP15PM": { printfulProductId: 601, printfulVariantId: 17720, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP16": { printfulProductId: 601, printfulVariantId: 20302, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-TOUGH-IP16PRO": { printfulProductId: 601, printfulVariantId: 20304, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 14.23, product: "Phone Case", caseType: "tough" },
  "RECAST-CASE-IP14":      { printfulProductId: 181, printfulVariantId: 16240, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 11.17, product: "Phone Case" },
  "RECAST-CASE-IP14PLUS":  { printfulProductId: 181, printfulVariantId: 16242, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 11.17, product: "Phone Case" },
  "RECAST-CASE-IP14PRO":   { printfulProductId: 181, printfulVariantId: 16241, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 11.17, product: "Phone Case" },
  "RECAST-CASE-IP14PM":    { printfulProductId: 181, printfulVariantId: 16243, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 11.17, product: "Phone Case" },
  "RECAST-CASE-IP15":      { printfulProductId: 181, printfulVariantId: 17616, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 9.57, product: "Phone Case" },
  "RECAST-CASE-IP15PRO":   { printfulProductId: 181, printfulVariantId: 17618, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 9.57, product: "Phone Case" },
  "RECAST-CASE-IP15PM":    { printfulProductId: 181, printfulVariantId: 17619, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 9.57, product: "Phone Case" },
  "RECAST-CASE-IP16":      { printfulProductId: 181, printfulVariantId: 20290, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 9.57, product: "Phone Case" },
  "RECAST-CASE-IP16PRO":   { printfulProductId: 181, printfulVariantId: 20292, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 9.57, product: "Phone Case" },

  "RECAST-DIGITAL-HD":     { digital: true, quantity: 1, baseCost: 0, product: "HD Digital Recast" },
  "RECAST-DIGITAL-PACK":   { digital: true, quantity: 1, baseCost: 0, product: "Recast Pack" }
};

const PRODUCT_ORDER = [
  "Custom Recast Hoodie",
  "Custom Recast T-Shirt",
  "Custom Recast Blanket",
  "Custom Recast Framed Poster",
  "Custom Recast Poster",
  "Custom Recast Canvas",
  "Custom Recast Mug",
  "Custom Recast Tumbler",
  "Custom Recast Magnet 3-Pack",
  "Custom Recast Coaster 4-Pack",
  "HD Digital Recast",
  "Recast Pack"
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function shopDomain(env) {
  const raw = String(env.SHOPIFY_SHOP || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return raw.endsWith(".myshopify.com") ? raw : `${raw}.myshopify.com`;
}

function numericVariantId(gid) {
  const match = String(gid || "").match(/ProductVariant\/(\d+)$/);
  return match ? match[1] : null;
}

function base64UrlUtf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function callCore(request, env, ctx, path) {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = "";
  return core.fetch(new Request(url.toString(), { method: "GET" }), env, ctx);
}

async function validateRecast(request, env, ctx, requestId, accessToken) {
  if (!requestId || !accessToken) throw new Error("Missing Recast request credentials.");
  const url = new URL(request.url);
  url.pathname = `/api/request/${encodeURIComponent(requestId)}`;
  url.search = new URLSearchParams({ token: accessToken }).toString();
  const response = await core.fetch(new Request(url.toString(), { method: "GET" }), env, ctx);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || "Recast request could not be verified.");
  return data.request;
}

async function shopifySnapshot(request, env, ctx) {
  return shopifyCatalog(env);
}

export function flattenShopifyProducts(snapshot) {
  const rows = [];
  for (const product of snapshot.recastProducts || []) {
    for (const variant of product.variants?.nodes || []) {
      if (!variant.sku || !FULFILLMENT[variant.sku]) continue;
      const fulfillment = FULFILLMENT[variant.sku];
      const retail = Number(variant.price || 0);
      const productionCost = Number(fulfillment.baseCost || 0) * Number(fulfillment.quantity || 1);
      rows.push({
        productId: product.id,
        title: product.title,
        handle: product.handle,
        status: product.status,
        variantId: variant.id,
        variantTitle: variant.title,
        sku: variant.sku,
        price: variant.price,
        printfulVariantId: fulfillment.printfulVariantId || null,
        printfulQuantity: fulfillment.quantity || 1,
        digital: Boolean(fulfillment.digital),
        productionCost: productionCost.toFixed(2),
        marginBeforeShippingAndFees: (retail - productionCost).toFixed(2)
      });
    }
  }
  return rows;
}

async function checkoutOptions(request, env, ctx) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const accessToken = url.searchParams.get("token");
  const recast = await validateRecast(request, env, ctx, requestId, accessToken);
  const snapshot = await shopifySnapshot(request, env, ctx);
  const rows = flattenShopifyProducts(snapshot).filter(row => !row.digital || !isNativeAppRequest(request));

  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.title)) {
      grouped.set(row.title, {
        title: row.title,
        handle: row.handle,
        status: row.status,
        variants: []
      });
    }
    grouped.get(row.title).variants.push(row);
  }

  const products = [...grouped.values()].sort((a, b) => {
    const ai = PRODUCT_ORDER.indexOf(a.title);
    const bi = PRODUCT_ORDER.indexOf(b.title);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });

  return json({
    ok: true,
    request: {
      requestId: recast.requestId,
      styleName: recast.styleName,
      subjectType: recast.subjectType
    },
    products,
    allProductsActive: products.length > 0 && products.every((p) => p.status === "ACTIVE")
  });
}

function liveBase(env,request){
  return String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||new URL(request.url).origin).replace(/\/$/,"");
}
function htmlEscape(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
async function freezeApprovedPreview(request,env,{requestId,sku,mockupId,proofHash,mockup,design,accessToken}){
  const token=(await hash([requestId,sku,mockupId,proofHash,accessToken,"approved-product-preview"].join("|"))).slice(0,48);
  const imageKey=`commerce/checkout-previews/${token}.jpg`,metaKey=`commerce/checkout-previews/${token}.json`;
  const artworkOnly=mockup.approvalMode==='recommended-no-mockup';
  if(artworkOnly){
    const source=await env.ARTWORK.get(`requests/${requestId}/preview.b64`);
    if(!source)throw new Error('Selected artwork is unavailable.');
    const bytes=Uint8Array.from(atob(await source.text()),c=>c.charCodeAt(0));
    // Private frozen source; secureApplication watermarks EVERY public image response.
    const protectedBytes=bytes;
    for(const key of [imageKey,`commerce/checkout-previews/${token}/view-0.jpg`])await env.ARTWORK.put(key,protectedBytes,{httpMetadata:{contentType:'image/jpeg',cacheControl:'private, no-store'}});
    await env.ARTWORK.put(metaKey,JSON.stringify({token,requestId,sku,mockupId,proofHash,design,approvalMode:'recommended-no-mockup',views:[{index:0,title:'Approved artwork · product mockup skipped'}],createdAt:new Date().toISOString()}),{httpMetadata:{contentType:'application/json'}});
    const base=liveBase(env,request);
    return {token,url:`${base}/proof/${token}`,imageUrl:`${base}/api/approved-preview/${token}`,images:[{title:'Approved artwork · product mockup skipped',url:`${base}/api/approved-preview/${token}/0`}]};
  }
  const views=(mockup.images||[]).slice(0,3);
  if(!views.length)return null;
  const folder=`mockups/${requestId}/${sku}/${mockupId}`;
  const savedViews=[];
  for(let i=0;i<views.length;i++){
    const source=await env.ARTWORK?.get(`${folder}/image-${i}.jpg`);
    if(!source)continue;
    const viewKey=`commerce/checkout-previews/${token}/view-${savedViews.length}.jpg`;
    await env.ARTWORK.put(viewKey,source.body,{httpMetadata:{contentType:"image/jpeg",cacheControl:"private, no-store"}});
    savedViews.push({index:savedViews.length,title:views[i]?.title||`View ${savedViews.length+1}`});
  }
  if(!savedViews.length)return null;
  const preferred=savedViews.find(v=>/front/i.test(String(v.title||"")))||savedViews[0];
  const primary=await env.ARTWORK?.get(`commerce/checkout-previews/${token}/view-${preferred.index}.jpg`);
  if(primary)await env.ARTWORK.put(imageKey,primary.body,{httpMetadata:{contentType:"image/jpeg",cacheControl:"private, no-store"}});
  await env.ARTWORK.put(metaKey,JSON.stringify({token,requestId,sku,mockupId,proofHash,design,views:savedViews,primaryIndex:preferred.index,viewTitle:preferred.title,createdAt:new Date().toISOString()}),{httpMetadata:{contentType:"application/json"}});
  const base=liveBase(env,request);
  return {token,url:`${base}/proof/${token}`,imageUrl:`${base}/api/approved-preview/${token}`,images:savedViews.map(v=>({title:v.title,url:`${base}/api/approved-preview/${token}/${v.index}`}))};
}

async function freezeCheckoutApproval(env,{requestId,sku,mockupId,proofHash,mockup,design,approvedPreview,sourceBase64}){
  if(!approvedPreview?.token)throw new Error("Approved product preview is required.");
  const token=approvedPreview.token;
  const snapshotKey=`commerce/preapprovals/${token}/source.b64`;
  const recordKey=`commerce/preapprovals/${token}.json`;
  if(!await env.ARTWORK?.head(snapshotKey))await env.ARTWORK.put(snapshotKey,sourceBase64,{httpMetadata:{contentType:"text/plain"}});
  const record={
    token,requestId,sku,mockupId,proofHash,previewToken:token,design,snapshotKey,
    sourceHash:await hash(sourceBase64),position:mockup.position,images:approvedPreview.images||[],
    approvedAt:new Date().toISOString(),schemaVersion:1,approvalMode:mockup.approvalMode||'product-mockup'
  };
  const previous=await env.ARTWORK.get(recordKey);
  if(previous){
    const saved=await previous.json();
    for(const key of ['token','requestId','sku','mockupId','proofHash','previewToken','design','snapshotKey','sourceHash','position','approvalMode']){
      if(JSON.stringify(saved[key])!==JSON.stringify(record[key]))throw new Error('This approved design needs review. Please generate a fresh preview.');
    }
    return saved;
  }
  await env.ARTWORK.put(recordKey,JSON.stringify(record),{httpMetadata:{contentType:"application/json"}});
  return record;
}

export async function prepareCheckout(request, env, ctx) {
  const body = await request.json().catch(() => ({}));
  const requestId = String(body.requestId || "");
  const accessToken = String(body.accessToken || "");
  const sku = String(body.sku || "");
  if (FULFILLMENT[sku]?.digital && isNativeAppRequest(request)) return digitalUnavailableInAppResponse();
  const recast = await validateRecast(request, env, ctx, requestId, accessToken);
  const safetyMeta=await env.ARTWORK.get(`requests/${requestId}/request.json`);
  if(safetyMeta)await checkStoredArtwork(env,await safetyMeta.json());

  if (!FULFILLMENT[sku]) return json({ ok: false, error: "Unknown Recast SKU." }, 400);

  const snapshot = await shopifySnapshot(request, env, ctx);
  const row = flattenShopifyProducts(snapshot).find((item) => item.sku === sku);
  if (!row) return json({ ok: false, error: "Shopify variant not found for this SKU." }, 404);
  if (row.status !== "ACTIVE") {
    return json({
      ok: false,
      ready: false,
      error: "This Shopify product is still in DRAFT status. Activate the catalog before checkout testing.",
      sku,
      product: row.title
    }, 409);
  }

  const numericId = numericVariantId(row.variantId);
  if (!numericId) return json({ ok: false, error: "Could not parse the Shopify variant ID." }, 500);

  let verifiedDesign=null,proofHash=null,mockupId=null,approvedPreview=null,checkoutApproval=null;
  if(!FULFILLMENT[sku].digital){
    if(body.confirmDesign!==true)return json({ok:false,error:"Confirm the final product design before checkout."},409);
    verifiedDesign=normalizeProductDesign(FULFILLMENT[sku],body.design||{});
    if(body.skipMockup===true){
      if(body.confirmArtwork!==true)return json({ok:false,error:'Approve this artwork before using the recommended placement.'},409);
      const recommended=recommendedCheckoutDesign(FULFILLMENT[sku]);
      if(JSON.stringify(verifiedDesign)!==JSON.stringify(recommended))return json({ok:false,error:'Preview custom placement, or reset to the recommended setup for Buy now.'},409);
      const prepared=await createMockup(new Request(request.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId,accessToken,sku,design:recommended})}),env,{prepareOnly:true});
      const result=await prepared.json();
      if(!prepared.ok||!result.ok)return json({ok:false,error:'We could not verify this product’s print setup. Your artwork is saved; please try again or preview the product.'},prepared.status>=400?prepared.status:503);
      body.mockupId=result.mockupId;
    }
    mockupId=String(body.mockupId||"");
    if(!/^[a-zA-Z0-9._-]{1,180}$/.test(mockupId))return json({ok:false,error:"Generate a fresh product preview before checkout."},409);
    const mockupObject=await env.ARTWORK?.get(`mockups/${requestId}/${sku}/${mockupId}/task.json`);
    if(!mockupObject)return json({ok:false,error:"This product preview is no longer current. Generate it again before checkout."},409);
    const mockup=await mockupObject.json();
    const source=await env.ARTWORK?.get(`requests/${requestId}/preview.b64`);
    if(!source)return json({ok:false,error:"The selected artwork is unavailable."},404);
    const sourceBase64=await source.text();
    proofHash=await hash(sourceBase64+'|'+JSON.stringify(verifiedDesign));
    if((body.skipMockup===true?mockup.status!=='prepared'||mockup.approvalMode!=='recommended-no-mockup':mockup.status!=='completed')||!mockup.position||mockup.sourceHash!==proofHash||JSON.stringify(mockup.design||{})!==JSON.stringify(verifiedDesign)){
      return json({ok:false,error:"Your product settings changed after the preview. Generate and review a fresh preview before checkout."},409);
    }
    approvedPreview=await freezeApprovedPreview(request,env,{requestId,sku,mockupId,proofHash,mockup,design:verifiedDesign,accessToken});
    checkoutApproval=await freezeCheckoutApproval(env,{requestId,sku,mockupId,proofHash,mockup,design:verifiedDesign,approvedPreview,sourceBase64});
  }

  const properties = {
    "Artwork ID": requestId,
    "Recast Style": recast.styleName || "",
    "Recast Subject": recast.subjectType || "",
    ...(verifiedDesign?{
      "Recast Layout":verifiedDesign.layout==="six-pictures"?"Six whole pictures · 2 columns × 3 rows":verifiedDesign.layout==="two-sided"?"Best setup · image on both sides":verifiedDesign.layout==="wrap"?"Full wrap":verifiedDesign.layout==="cover"?"Best setup · full bleed":verifiedDesign.layout==="fit"?"Keep whole image":"One image",
      "Recast Position":verifiedDesign.x[0].toUpperCase()+verifiedDesign.x.slice(1),
      "Recast Size":verifiedDesign.scale+"%",
      ...(verifiedDesign.layout==="fit"?{"Recast Fill":verifiedDesign.fill==="dark"?"Dark fill":verifiedDesign.fill==="light"?"Light fill":verifiedDesign.fill==="full-bleed"?"Artwork edge fill":"Blended artwork colors"}:{}),
      ...(verifiedDesign.layout==="two-sided"?{"Recast Spacing":verifiedDesign.spacing==="close"?"Closer together":verifiedDesign.spacing==="wide"?"Farther apart":"Standard"}:{}),
      "Recast Design":body.skipMockup===true?"Artwork approved · recommended placement · product mockup skipped":"Confirmed before checkout",
      "Recast Next Step":"Payment completes your order — no extra design approval needed",
      ...(approvedPreview?{"Approved Preview":approvedPreview.url}:{}),
      "_Recast Design":JSON.stringify(verifiedDesign),
      "_Recast Proof":proofHash,
      "_Recast Mockup":mockupId,
      ...(approvedPreview?{"_Recast Preview Token":approvedPreview.token}:{}),
      ...(checkoutApproval?{"_Recast Preapproval":checkoutApproval.token}:{})
    }:{})
  };
  return {requestId, recast, row, numericId, properties, checkoutApproval, approvedPreview, sku};
}

async function checkoutLink(request, env, ctx) {
  const prepared=await prepareCheckout(request,env,ctx);
  if(prepared instanceof Response)return prepared;
  const {requestId,recast,row,numericId,properties,approvedPreview,sku}=prepared;
  const encodedProperties = base64UrlUtf8(JSON.stringify(properties));
  const checkoutUrl = await applyHolidayDiscount(`https://${shopDomain(env)}/cart/${numericId}:1?properties=${encodeURIComponent(encodedProperties)}&ref=recast-me`,env,new Date(),{artwork:recast,variantId:row.variantId,properties,requestId});

  return json({
    ok: true,
    ready: true,
    checkoutUrl,
    sku,
    product: row.title,
    variant: row.variantTitle,
    price: row.price,
    fulfillment: FULFILLMENT[sku],
    approvedPreviewUrl: approvedPreview?.url || null
  });
}

async function orderMatch(request, env, ctx) {
  const url = new URL(request.url);
  const requestId = String(url.searchParams.get("requestId") || "");
  const accessToken = String(url.searchParams.get("token") || "");
  await validateRecast(request, env, ctx, requestId, accessToken);
  const snapshot = await shopifySnapshot(request, env, ctx);

  for (const order of snapshot.recentOrders || []) {
    for (const line of order.lineItems?.nodes || []) {
      const artwork = (line.customAttributes || []).find((attr) => attr.key === "Artwork ID");
      if (artwork?.value === requestId) {
        return json({
          ok: true,
          found: true,
          order: {
            id: order.id,
            name: order.name,
            createdAt: order.createdAt,
            financialStatus: order.displayFinancialStatus,
            lineItem: {
              name: line.name,
              sku: line.sku,
              quantity: line.quantity,
              customAttributes: line.customAttributes
            }
          }
        });
      }
    }
  }
  return json({ ok: true, found: false, requestId });
}

function previewAngleLabel(title,index){
  const raw=String(title||"");
  if(/^default$/i.test(raw))return "3D view";
  if(/handle on left/i.test(raw))return "Handle left";
  if(/front/i.test(raw))return "Front view";
  return raw||`View ${index+1}`;
}
async function ensureApprovedPreviewViews(env,token,meta){
  if(Array.isArray(meta.views)&&meta.views.length)return meta;
  if(!meta.requestId||!meta.sku||!meta.mockupId)return meta;
  const mockupObject=await env.ARTWORK?.get(`mockups/${meta.requestId}/${meta.sku}/${meta.mockupId}/task.json`);
  if(!mockupObject)return meta;
  const mockup=await mockupObject.json(),sourceViews=(mockup.images||[]).slice(0,3),folder=`mockups/${meta.requestId}/${meta.sku}/${meta.mockupId}`,views=[];
  for(let i=0;i<sourceViews.length;i++){
    const source=await env.ARTWORK?.get(`${folder}/image-${i}.jpg`);if(!source)continue;
    const index=views.length;
    await env.ARTWORK.put(`commerce/checkout-previews/${token}/view-${index}.jpg`,source.body,{httpMetadata:{contentType:"image/jpeg",cacheControl:"private, no-store"}});
    views.push({index,title:sourceViews[i]?.title||`View ${index+1}`});
  }
  if(!views.length)return meta;
  const preferred=views.find(v=>/front/i.test(String(v.title||"")))||views[0];
  const primary=await env.ARTWORK.get(`commerce/checkout-previews/${token}/view-${preferred.index}.jpg`);
  if(primary)await env.ARTWORK.put(`commerce/checkout-previews/${token}.jpg`,primary.body,{httpMetadata:{contentType:"image/jpeg",cacheControl:"private, no-store"}});
  meta={...meta,views,primaryIndex:preferred.index,viewTitle:preferred.title};
  await env.ARTWORK.put(`commerce/checkout-previews/${token}.json`,JSON.stringify(meta),{httpMetadata:{contentType:"application/json"}});
  return meta;
}

async function approvedPreviewImage(env,token,index=null){
  if(!/^[a-f0-9]{48}$/.test(token))return new Response("Not found",{status:404});
  let key=`commerce/checkout-previews/${token}.jpg`;
  if(index!==null){
    const n=Number(index);if(!Number.isInteger(n)||n<0||n>2)return new Response("Not found",{status:404});
    key=`commerce/checkout-previews/${token}/view-${n}.jpg`;
    if(!await env.ARTWORK?.head(key)){
      const metaObject=await env.ARTWORK?.get(`commerce/checkout-previews/${token}.json`);
      if(metaObject)await ensureApprovedPreviewViews(env,token,await metaObject.json());
    }
  }
  const image=await env.ARTWORK?.get(key);
  if(!image)return new Response("Not found",{status:404});
  return new Response(image.body,{headers:{"content-type":"image/jpeg","cache-control":"private, no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff"}});
}
async function approvedPreviewApprovalRedirect(env,token){
  if(!/^[a-f0-9]{48}$/.test(token))return new Response("Not found",{status:404});
  const metaObject=await env.ARTWORK?.get(`commerce/checkout-previews/${token}.json`);
  if(!metaObject)return new Response("Not found",{status:404});
  const meta=await metaObject.json();
  const target=new URL("/",String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||"https://recast-me.sergz24.workers.dev"));
  target.searchParams.set("approvalRequest",String(meta.requestId||""));
  target.hash="preview-section";
  return new Response(null,{status:302,headers:{location:target.toString(),"cache-control":"private, no-store","referrer-policy":"no-referrer"}});
}

async function approvedPreviewPage(env,token){
  if(!/^[a-f0-9]{48}$/.test(token))return new Response("Not found",{status:404});
  const metaObject=await env.ARTWORK?.get(`commerce/checkout-previews/${token}.json`);
  if(!metaObject)return new Response("Not found",{status:404});
  let meta=await metaObject.json();meta=await ensureApprovedPreviewViews(env,token,meta);
  const preapproval=await env.ARTWORK?.head(`commerce/preapprovals/${token}.json`);
  const design=meta.design||{};
  const layout=design.layout==="two-sided"?"Same image on both sides":design.layout==="wrap"?"Full wrap":"One image";
  const spacing=design.layout==="two-sided"?(design.spacing==="close"?"Closer together":design.spacing==="wide"?"Farther apart":"Standard"):null;
  const views=(meta.views||[{index:meta.primaryIndex||0,title:meta.viewTitle||"Product preview"}]).slice(0,3);
  const gallery=views.map((view,i)=>{
    const label=previewAngleLabel(view.title,i),src=`/api/approved-preview/${htmlEscape(token)}/${view.index}`;
    return `<figure class="angle"><img src="${src}" alt="${htmlEscape(label)} of approved Recast product preview"><figcaption><strong>${htmlEscape(label)}</strong><a href="${src}" download="recast-approved-${i+1}.jpg">Save this angle</a></figcaption></figure>`;
  }).join("");
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Approved Recast Product Preview</title><style>body{margin:0;background:#070812;color:#fff;font-family:system-ui,-apple-system,sans-serif}.wrap{max-width:980px;margin:auto;padding:32px 18px 64px}.card{border:1px solid #33354d;border-radius:24px;background:#0d0f1d;padding:20px;box-shadow:0 25px 80px #0007}h1{font-size:clamp(34px,7vw,58px);line-height:1;margin:8px 0 14px}.eyebrow{font-size:11px;letter-spacing:.18em;color:#9fe9ff;font-weight:800}.approve{display:inline-block;padding:14px 18px;border-radius:13px;background:linear-gradient(90deg,#8f43ff,#20c7ef);color:#fff;text-decoration:none;font-weight:900}.safety{margin:18px 0 8px;padding:16px;border:1px solid #4d426f;border-radius:14px;background:#151229;color:#e7e7f2;line-height:1.5}.gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:22px 0}.angle{margin:0;border:1px solid #2f3148;border-radius:16px;overflow:hidden;background:#090a14}.angle img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff}.angle figcaption{padding:11px;display:grid;gap:7px;color:#d8d8e5}.angle a{color:#9fe9ff;font-size:13px}.meta{display:grid;gap:8px;color:#c3c4d4}.note{color:#9799ae;line-height:1.55;margin-top:20px}.brand{font-weight:900;letter-spacing:.04em;color:#fff;text-decoration:none}.save-all{display:inline-block;padding:12px 16px;border-radius:12px;background:#fff;color:#080812;text-decoration:none;font-weight:800}@media(max-width:700px){.gallery{grid-template-columns:1fr}.angle img{aspect-ratio:auto;max-height:560px}}</style></head><body><main class="wrap"><a class="brand" href="/">RECAST ME</a><section class="card">${preapproval?`<div class="eyebrow">DESIGN CONFIRMED BEFORE CHECKOUT</div><h1>You’re done. No extra design approval is needed.</h1><div class="safety"><strong>Next step:</strong> nothing else from you. After payment is verified, Recast prepares the clean print file and sends the confirmed design into fulfillment automatically. Shopify or Shop may show its own delivery estimate while that happens.</div><h2>${meta.approvalMode==='recommended-no-mockup'?'You approved this artwork with recommended placement and skipped the product mockup.':'These are the product-preview angles saved with your order.'}</h2>`:`<div class="eyebrow">ORDER CONFIRMED · PRINT SAFEGUARD ACTIVE</div><h1>Your order is paid, but it is not sent to production yet.</h1><div class="safety"><strong>Next step:</strong> review the saved product previews below, then continue to Recast and approve this design for printing. Shopify or Shop may show an estimated arrival date before this approval is complete; Recast production remains paused until you approve.</div><p><a class="approve" href="/proof/${htmlEscape(token)}/approve">Complete design approval →</a></p><h2>${meta.approvalMode==='recommended-no-mockup'?'You approved this artwork with recommended placement and skipped the product mockup.':'These are the product-preview angles saved with your order.'}</h2>`}<div class="gallery">${gallery}</div><div class="meta"><div><strong>Artwork ID:</strong> ${htmlEscape(meta.requestId)}</div><div><strong>Product:</strong> ${htmlEscape(meta.sku)}</div><div><strong>Layout:</strong> ${htmlEscape(layout)}</div><div><strong>Position:</strong> ${htmlEscape(design.x||"center")}</div><div><strong>Size:</strong> ${htmlEscape(design.scale||100)}%</div>${spacing?`<div><strong>Spacing:</strong> ${htmlEscape(spacing)}</div>`:""}</div><p class="note">${meta.approvalMode==='recommended-no-mockup'?'This is your watermarked artwork record, not a product mockup.':'These saved pictures are the watermarked product previews you reviewed.'} The production file uses your clean private artwork with these approved settings, not the preview watermark.</p><p><a class="save-all" href="/#preview-section" style="margin-right:10px">Return to Recast Me</a><a class="save-all" href="/api/approved-preview/${htmlEscape(token)}/${views[0]?.index??0}" download="recast-approved-product-preview.jpg">Save first preview</a></p></section></main></body></html>`;
  return new Response(html,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"private, no-store","referrer-policy":"no-referrer","x-content-type-options":"nosniff"}});
}

async function injectCheckoutScript(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  const html = await response.text();
  if (html.includes("/checkout.js")) return new Response(html, response);
  const next = html.replace("</body>", '  <script src="/checkout.js?v=304" type="module"></script>\n</body>');
  return new Response(next, {
    status: response.status,
    headers: response.headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if(url.pathname==='/api/seasonal-products'&&request.method==='GET'){
      try{
        const rows=flattenShopifyProducts(await shopifySnapshot(request,env,ctx)).filter(row=>row.status==='ACTIVE'&&(!row.digital||!isNativeAppRequest(request)));
        const products=new Map();
        for(const row of rows){
          const name=FULFILLMENT[row.sku].product;
          const old=products.get(name),price=Number(row.price);
          if(!Number.isFinite(price)||price<=0)continue;
          if(!old||price<old.price)products.set(name,{name,price,sku:row.sku});
        }
        return json({ok:true,products:[...products.values()]});
      }catch{return json({ok:false,error:'Products are temporarily unavailable.'},503);}
    }
    const approvedImage=url.pathname.match(/^\/api\/approved-preview\/([a-f0-9]{48})(?:\/(\d))?$/);
    if(approvedImage&&request.method==="GET")return approvedPreviewImage(env,approvedImage[1],approvedImage[2]??null);
    const approvalPage=url.pathname.match(/^\/proof\/([a-f0-9]{48})\/approve$/);
    if(approvalPage&&request.method==="GET")return approvedPreviewApprovalRedirect(env,approvalPage[1]);
    const approvedPage=url.pathname.match(/^\/proof\/([a-f0-9]{48})$/);
    if(approvedPage&&request.method==="GET")return approvedPreviewPage(env,approvedPage[1]);

    if (url.pathname === "/api/fulfillment-map" && request.method === "GET") {
      const mapping=isNativeAppRequest(request)?Object.fromEntries(Object.entries(FULFILLMENT).filter(([,product])=>!product.digital)):FULFILLMENT;
      return json({ ok: true, mapping });
    }

    if (url.pathname === "/api/checkout-options" && request.method === "GET") {
      try {
        return await checkoutOptions(request, env, ctx);
      } catch (error) {
        return json({ ok: false, error: error?.message || String(error) }, 400);
      }
    }

    if (url.pathname === "/api/checkout-link" && request.method === "POST") {
      try {
        return await checkoutLink(request, env, ctx);
      } catch (error) {
        return json({ ok: false, error: error?.message || String(error) }, 400);
      }
    }

    if (url.pathname === "/api/order-match" && request.method === "GET") {
      try {
        return await orderMatch(request, env, ctx);
      } catch (error) {
        return json({ ok: false, error: error?.message || String(error) }, 400);
      }
    }

    const response = await core.fetch(request, env, ctx);
    return injectCheckoutScript(response);
  }
};
