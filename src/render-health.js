import {budgetStatus} from './render-controls.js';
const PREFIX='system/render-health',LEGACY_KEY='system/render-health.json',MODES=new Set(['high','quick','social']);
const BLOCKING_REASONS=new Set(['capacity','quota','timeout','unavailable']);
const modeName=m=>MODES.has(m)?m:'high',key=m=>`${PREFIX}-${modeName(m)}.json`,scopedKey=(env,m)=>m==='high'&&['fal','cloudflare'].includes(env.RECAST_HQ_SELECTED_PROVIDER)?`${PREFIX}-high-${env.RECAST_HQ_SELECTED_PROVIDER}.json`:key(m),nowMs=n=>n instanceof Date?n.getTime():Number(n??Date.now()),parseMs=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
function seconds(env,name,fallback,min,max){return Math.max(min,Math.min(max,Number(env[name]||fallback)))*1000}
function cooldown(env,reason){
  if(reason==='capacity')return seconds(env,'RENDER_CAPACITY_COOLDOWN_SECONDS',90,15,900);
  if(reason==='quota')return seconds(env,'RENDER_QUOTA_COOLDOWN_SECONDS',300,60,86400);
  if(reason==='timeout')return seconds(env,'RENDER_TIMEOUT_COOLDOWN_SECONDS',300,15,900);
  if(reason==='unavailable')return seconds(env,'RENDER_UNAVAILABLE_COOLDOWN_SECONDS',60,15,1800);
  return 0;
}
async function readJson(env,objectKey){const object=await env.ARTWORK?.get(objectKey);return object?object.json().catch(()=>null):null}
export function localReadiness(env){const missing=[];if(env.RENDER_PAUSED==='true')missing.push('OWNER_PAUSED');if(!env.AI?.run)missing.push('AI');if(!env.ARTWORK?.get||!env.ARTWORK?.put)missing.push('ARTWORK');if(!env.IMAGES?.input||!env.IMAGES?.info)missing.push('IMAGES');const budget=budgetStatus(env);if((budget.configured||env.RENDER_CREDITS_ENABLED==='true')&&!budget.valid)missing.push('AI_BUDGET');if(env.RENDER_CREDITS_ENABLED==='true'&&String(env.CREDIT_IP_SALT||'').length<32&&env.RENDER_CREDITS_STORAGE_SALT!=='true')missing.push('CREDIT_IP_SALT');const controls=String(env.AI_DAILY_CALL_LIMIT??'');if(controls&&!/^(0|[1-9]\d*)$/.test(controls))missing.push('AI_DAILY_CALL_LIMIT');return{ready:missing.length===0,missing}}
export async function renderHealth(env,mode='high',now=Date.now()){
  const local=localReadiness(env),selected=modeName(mode);
  if(!local.ready)return{state:'unconfigured',ready:false,mode:selected,reason:'configuration',missing:local.missing,checkedAt:null,retryAt:null,lastResult:null,lastReason:'configuration',lastSuccessAt:null,lastFailureAt:null,visitorDailyLimit:null};
  const current=nowMs(now),selectedKey=scopedKey(env,selected),last=await readJson(env,selectedKey)||(selected==='social'?await readJson(env,LEGACY_KEY):null),retry=parseMs(last?.retryAt),blocked=last?.status==='failed'&&BLOCKING_REASONS.has(last?.reason)&&retry>current;
  return{state:blocked?'paused':'ready',ready:!blocked,mode:selected,reason:blocked?last.reason:null,checkedAt:last?.checkedAt||null,retryAt:blocked?last.retryAt:null,lastResult:last?.status||null,lastReason:last?.reason||null,lastSuccessAt:last?.lastSuccessAt||null,lastFailureAt:last?.lastFailureAt||null,visitorDailyLimit:null};
}
export async function readinessSnapshot(env,now=Date.now()){const local=localReadiness(env),[high,quick]=await Promise.all([renderHealth(env,'high',now),renderHealth(env,'quick',now)]);return{ok:local.ready,checkedAt:new Date(nowMs(now)).toISOString(),local,modes:{high,quick},costsAiCall:false}}
export async function assertRenderReady(env,mode='high',now=Date.now()){const health=await renderHealth(env,mode,now);if(health.ready)return health;const status=health.reason==='quota'?429:health.reason==='timeout'?504:503;throw Object.assign(new Error(health.state==='unconfigured'?'render configuration unavailable':health.reason||'render paused'),{reason:health.reason||'configuration',readiness:true,retryAt:health.retryAt,status})}
export async function recordRenderHealth(env,mode,status,reason=null,now=Date.now()){
  if(mode==='success'||mode==='failed'){reason=status||null;status=mode;mode='high'}
  if(!env.ARTWORK)return;
  const selected=modeName(mode),current=nowMs(now),selectedKey=scopedKey(env,selected),previous=await readJson(env,selectedKey);
  const delay=status==='failed'?cooldown(env,reason):0;
  const retryAt=delay?new Date(current+delay).toISOString():null;
  const payload={mode:selected,status,reason,checkedAt:new Date(current).toISOString(),retryAt,lastSuccessAt:status==='success'?new Date(current).toISOString():previous?.lastSuccessAt||null,lastFailureAt:status==='failed'?new Date(current).toISOString():previous?.lastFailureAt||null};
  await env.ARTWORK.put(selectedKey,JSON.stringify(payload),{httpMetadata:{contentType:'application/json'}}).catch(()=>{});
  if(selectedKey!==key(selected))await env.ARTWORK.put(key(selected),JSON.stringify({...payload,provider:env.RECAST_HQ_SELECTED_PROVIDER}),{httpMetadata:{contentType:'application/json'}}).catch(()=>{});
  return payload;
}
