// Read-only Printful catalog preflight; no supplier POST, checkout or artwork writes.
// "Pixel sufficient" means only source dimensions >= the stated native supplier area.
// It never means "approved", "print-ready", or "available for sale".
import {FULFILLMENT} from './entry.js';
import {privateJson} from './commerce-store.js';
export const SHOP_SOURCE_PIXELS=Object.freeze({width:1254,height:1254});
const prefix='shop/preparation/printfile-audit/v1/';
const grouped=new Map();
for(const [sku,map] of Object.entries(FULFILLMENT)){
 if(!sku.startsWith('RECAST-')||map.digital||map.product==='Mug'||!Number.isSafeInteger(map.printfulProductId)||!Number.isSafeInteger(map.printfulVariantId))continue;
 const variants=grouped.get(map.printfulProductId)||[];
 variants.push(Object.freeze({sku,variantId:map.printfulVariantId,placement:map.preferredPlacement||'default'}));
 grouped.set(map.printfulProductId,variants);
}
export const PRINTFILE_AUDIT_GROUPS=Object.freeze([...grouped].map(([productId,variants])=>Object.freeze({productId,product:FULFILLMENT[variants[0].sku].product,variants:Object.freeze(variants)})));
const iso=()=>new Date().toISOString();
const valid=n=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<=30000;
const codeOf=e=>/^http_429$/.test(e?.code)?'supplier_rate_limited':/^http_(401|403)$/.test(e?.code)?'supplier_auth_review':
 e?.code==='bad_identity'?'supplier_identity_mismatch':e?.code==='bad_catalog'?'supplier_template_missing':'supplier_unavailable';
const error=code=>Object.assign(new Error('Supplier catalog needs review.'),{code});
export function inspectPrintfile(group,data,source=SHOP_SOURCE_PIXELS){
 if(!group||Number(data?.product_id)!==group.productId||!Array.isArray(data?.printfiles)||!Array.isArray(data?.variant_printfiles))throw error('bad_identity');
 const variants=group.variants.map(row=>{
  const mapped=data.variant_printfiles.find(v=>Number(v.variant_id)===row.variantId);
  const id=Number(mapped?.placements?.[row.placement]);
  const template=data.printfiles.find(f=>Number(f.printfile_id)===id);
  const width=Number(template?.width),height=Number(template?.height),dpi=Number(template?.dpi);
  const good=valid(id)&&valid(width)&&valid(height)&&valid(dpi)&&dpi<=1200;
  const fullPixelsMeetSupplierArea=good&&source.width>=width&&source.height>=height;
  const aspectCompatible=good&&Math.abs(width/height-source.width/source.height)<=0.04;
  const status=!good?'needs_template_review':!fullPixelsMeetSupplierArea?'higher_resolution_master_needed':
    !aspectCompatible?'crop_or_fit_review_needed':'supplier_proof_still_required';
  return {sku:row.sku,variantId:row.variantId,placement:row.placement,
    area:good?{width,height,dpi}:null,fullPixelsMeetSupplierArea:Boolean(fullPixelsMeetSupplierArea),
    aspectCompatible:Boolean(aspectCompatible),status};
 });
 return {status:'complete',productId:group.productId,product:group.product,checkedAt:iso(),
  variants,sourcePixels:source,verifiedProof:false,checkoutEnabled:false,supplierOrdersCreated:0};
}
async function providerGet(env,productId){
 if(!env.PRINTFUL_API_TOKEN||!env.PRINTFUL_STORE_ID)throw error('missing_auth');
 let res;
 try{res=await fetch('https://api.printful.com/mockup-generator/printfiles/'+productId,{
  method:'GET',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(12000),
  headers:{Authorization:'Bearer '+env.PRINTFUL_API_TOKEN,'X-PF-Store-Id':String(env.PRINTFUL_STORE_ID),Accept:'application/json'}
 })}catch{throw error('supplier_connection')}
 if(res.status>=300&&res.status<400||res.redirected||res.type==='opaqueredirect')throw error('redirect_blocked');
 if(res.status!==200)throw error('http_'+res.status);
 if(!(res.headers.get('content-type')||'').toLowerCase().includes('json'))throw error('bad_content_type');
 let data;try{data=await res.json()}catch{throw error('bad_json')}
 if(data?.code!==200||!data.result)throw error('bad_catalog');
 return data.result;
}
async function stored(env,key){
 try{const obj=await env.ARTWORK.get(key);return obj?await obj.json():null}
 catch{return {status:'needs_review',code:'storage_review'}}
}
export async function runPrintfileAudit(env,{get=providerGet}={}){
 if(env?.PREMADE_PRINTFILE_AUDIT_ENABLED!=='true'||!env.ARTWORK)return {enabled:false};
 for(const group of PRINTFILE_AUDIT_GROUPS){
  const key=prefix+group.productId+'.json',old=await stored(env,key);
  if(old)continue;
  const claim=await env.ARTWORK.put(key,JSON.stringify({status:'checking',productId:group.productId,startedAt:iso()}),{onlyIf:new Headers({'If-None-Match':'*'})});
  if(!claim)return {enabled:true,busy:true};
  try{
   const data=await get(env,group.productId);
   const report=inspectPrintfile(group,data);
   await env.ARTWORK.put(key,JSON.stringify(report));
   return {enabled:true,status:'complete',productId:group.productId,checked:1};
  }catch(e){
   await env.ARTWORK.put(key,JSON.stringify({status:'needs_review',code:codeOf(e),productId:group.productId,checkedAt:iso(),checkoutEnabled:false}));
   return {enabled:true,status:'needs_review',productId:group.productId,checked:1};
  }
 }
 return {enabled:true,status:'all_checked',checked:0};
}
export async function printfileAuditStatus(env){
 const products=[];
 for(const group of PRINTFILE_AUDIT_GROUPS){
  const record=env.ARTWORK?await stored(env,prefix+group.productId+'.json'):null;
  products.push({product:group.product,productId:group.productId,status:record?.status||'not_started',
   code:record?.status==='needs_review'?record.code:null,
   variants:Array.isArray(record?.variants)?record.variants.map(v=>({sku:v.sku,area:v.area,
    fullPixelsMeetSupplierArea:v.fullPixelsMeetSupplierArea===true,
    aspectCompatible:v.aspectCompatible===true,status:v.status})):[]
  });
 }
 return {enabled:env?.PREMADE_PRINTFILE_AUDIT_ENABLED==='true',sourcePixels:SHOP_SOURCE_PIXELS,
  supplierProofApprovalRequired:true,checkoutEnabled:false,products};
}
export async function printfileAuditRoute(request,env){
 if(request.method!=='GET')return privateJson({ok:false},405);
 return privateJson({ok:true,...await printfileAuditStatus(env)});
}
