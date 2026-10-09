// Optional server-side FLUX.2 dev host selection. Disabled by default.
// No paid health probes. Never interpret cooldown expiry as proof of recovery.
const CF='cloudflare',FAL='fal';
export const PROVIDER_HEALTH_PREFIX='system/providers/hq-';
const bounded=(value,fallback)=>{const n=Number(value);return Number.isFinite(n)&&n>0?n:fallback};
export function estimateHighQualityCosts({width=1024,height=1280,steps=18,photos=1}={}){
 const outTiles=Math.ceil(width/512)*Math.ceil(height/512);
 const inTiles=Math.max(1,photos); // Browser prepares <=500px reference photos.
 const cloudflare=steps*(outTiles*.00041+inTiles*.00021);
 // Conservative whole-megapixel estimate; verify against invoices at scale.
 const falUsd=.012*(Math.ceil(width*height/1e6)+photos);
 return {cloudflareUsd:Number(cloudflare.toFixed(6)),falUsd:Number(falUsd.toFixed(6)),basis:'planning estimate, not an invoice'};
}
async function jsonObject(env,key){try{const item=await env.ARTWORK?.get(key);return item?await item.json():null}catch{return null}}
export async function providerHealth(env){
 const [fal,cloudflare,legacy]=await Promise.all([
  jsonObject(env,PROVIDER_HEALTH_PREFIX+'fal.json'),
  jsonObject(env,PROVIDER_HEALTH_PREFIX+'cloudflare.json'),
  jsonObject(env,'system/render-health-high.json')
 ]);
 const oldCloudflare=legacy?.lastFailureAt && (!legacy.lastSuccessAt||legacy.lastFailureAt>legacy.lastSuccessAt)
   ? {status:'failed',reason:legacy.lastReason||legacy.reason,checkedAt:legacy.checkedAt,lastFailureAt:legacy.lastFailureAt,lastSuccessAt:legacy.lastSuccessAt} : null;
 return {fal,cloudflare:cloudflare||oldCloudflare};
}
function healthy(item){
 if(!item)return true; // Unknown status can be used only if explicitly enabled.
 if(item.status==='success')return true;
 if(item.status==='failed'||item.status==='pending'||item.status==='ambiguous')return false;
 return false;
}
export async function selectHighQualityProvider(env,form){
 const policy=String(env.RECAST_HQ_PROVIDER||'cloudflare').toLowerCase();
 if(!['cloudflare','fal','auto'].includes(policy))throw Object.assign(new Error('The image provider policy needs owner review.'),{code:'render_provider_config',status:503});
 const enabled=env.FAL_PROVIDER_ENABLED==='true'&&typeof env.FAL_API_KEY==='string'&&env.FAL_API_KEY.length>20;
 const photos=[...form.keys()].filter(k=>/^image_[0-3]$/.test(k)&&form.get(k) instanceof File&&form.get(k).size>0).length || 1;
 const prices=estimateHighQualityCosts({steps:bounded(env.IMAGE_HIGH_QUALITY_STEPS,18),photos});
 if(policy==='cloudflare')return {host:CF,prices,configured:true,policy};
 if(!enabled){
  if(policy==='fal')throw Object.assign(new Error('The selected image provider is not configured.'),{code:'render_provider_config',status:503});
  return {host:CF,prices,configured:true,policy};
 }
 const health=await providerHealth(env);
 if(policy==='fal'){
  if(!healthy(health.fal))throw Object.assign(new Error('The fal image engine needs a recovery check. Your photo is safe.'),{code:'render_provider_unavailable',status:503});
  return {host:FAL,prices,configured:true,policy};
 }
 // Auto requires explicit owner acknowledgement before sending customer images
 // to the independently hosted provider.
 const falAllowed=env.FAL_PROVIDER_VERIFIED==='true'&&healthy(health.fal);
 const cfAllowed=(env.CF_PROVIDER_VERIFIED==='true'||health.cloudflare?.status==='success')&&healthy(health.cloudflare);
 const candidates=[...(falAllowed?[{host:FAL,cost:prices.falUsd}]:[]),...(cfAllowed?[{host:CF,cost:prices.cloudflareUsd}]:[])].sort((a,b)=>a.cost-b.cost);
 if(!candidates.length)throw Object.assign(new Error('Both approved image providers are unavailable. Your photo and credits are safe.'),{code:'render_providers_unavailable',status:503});
 return {host:candidates[0].host,prices,configured:true,policy};
}
export async function providerStatus(env){
 const state=await providerHealth(env),costs=estimateHighQualityCosts({steps:bounded(env.IMAGE_HIGH_QUALITY_STEPS,18)});
 return {mode:String(env.RECAST_HQ_PROVIDER||'cloudflare'),falEnabled:env.FAL_PROVIDER_ENABLED==='true',falConfigured:!!env.FAL_API_KEY, falVerified:env.FAL_PROVIDER_VERIFIED==='true',cloudflareVerified:env.CF_PROVIDER_VERIFIED==='true'||state.cloudflare?.status==='success',health:state,costs,costsAreEstimates:true};
}
export async function recordProviderResult(env,host,status,reason=null){
 if(!env.ARTWORK||![CF,FAL].includes(host))return;
 const key=PROVIDER_HEALTH_PREFIX+host+'.json',current=await jsonObject(env,key),now=new Date().toISOString();
 const payload={host,status,reason,checkedAt:now,lastSuccessAt:status==='success'?now:current?.lastSuccessAt||null,lastFailureAt:status==='failed'?now:current?.lastFailureAt||null};
 try{await env.ARTWORK.put(key,JSON.stringify(payload),{httpMetadata:{contentType:'application/json'}})}catch{}
}
