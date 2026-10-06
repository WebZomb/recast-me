// Owner-only, versioned policy controls. No credentials or arbitrary env keys are editable.
import {change,read,equal,fault,sameOrigin,privateJson} from './commerce-store.js';
export const SETTINGS_KEY='system/owner-settings-v1.json';
const fields={
  highDaily:['HQ_FREE_ALLOWANCE',3,0,20],standardDaily:['STANDARD_FREE_ALLOWANCE',5,0,25],
  purchaseBonus:['PURCHASE_BONUS',3,0,20],websiteCalls:['AI_DAILY_CALL_LIMIT',70,0,10000],
  socialCalls:['AI_DAILY_SOCIAL_CALL_LIMIT',100,0,10000],budgetCents:['AI_DAILY_BUDGET_CENTS',500,0,100000]
};
function number(value,min,max,name){
  if(!/^(0|[1-9]\d*)$/.test(String(value))||!Number.isSafeInteger(Number(value))||Number(value)<min||Number(value)>max)throw fault('settings_invalid',`Invalid ${name}. Use a whole number between ${min} and ${max}.`,400);
  return Number(value);
}
export function policyFromEnv(env){
  const values={};for(const [key,[binding,fallback,min,max]] of Object.entries(fields))values[key]=number(env[binding]??fallback,min,max,key);
  values.paused=env.RENDER_PAUSED==='true';return values;
}
function validate(values){
  if(!values||typeof values!=='object'||Array.isArray(values))throw fault('settings_invalid','Send the complete settings form.',400);
  if(Object.keys(values).some(k=>!Object.hasOwn(fields,k)&&k!=='paused'))throw fault('settings_invalid','Unknown setting. Reload the form.',400);
  const result={};for(const [k,[,,min,max]] of Object.entries(fields))result[k]=number(values[k],min,max,k);
  if(typeof values.paused!=='boolean')throw fault('settings_invalid','Pause must be on or off.',400);
  result.paused=values.paused;return result;
}
export async function settingsSnapshot(env){
  const stored=await read(env,SETTINGS_KEY);
  if(!stored)return {revision:0,values:policyFromEnv(env),updatedAt:null,history:[]};
  if(!Number.isSafeInteger(stored.revision)||stored.revision<1)throw fault('settings_storage','Owner settings need review.',503);
  return {...stored,values:validate(stored.values)};
}
export async function withOwnerSettings(env){
  if(env.RECAST_SETTINGS_APPLIED||!env.ARTWORK)return env;
  const stored=await read(env,SETTINGS_KEY);if(!stored)return {...env,RECAST_SETTINGS_APPLIED:true};
  if(!Number.isSafeInteger(stored.revision)||stored.revision<1)throw fault('settings_storage','Owner settings need review.',503);
  const values=validate(stored.values),next={...env,RECAST_SETTINGS_APPLIED:true};
  for(const [key,[binding]] of Object.entries(fields))next[binding]=String(values[key]);
  next.RENDER_PAUSED=String(values.paused);return next;
}
function owner(request,env){
  const authorization=request.headers.get('authorization')||'';
  const token=authorization.match(/^Bearer\s+(.+)$/i)?.[1]||request.headers.get('x-recast-admin');
  if(!env.ADMIN_TOKEN)throw fault('admin_unconfigured','Owner access is not configured.',503);
  if(!equal(token,env.ADMIN_TOKEN))throw fault('admin_required','Admin authorization required.',401);
}
export async function ownerSettingsRoute(request,env){
  const url=new URL(request.url);if(url.pathname!=='/api/admin/owner-settings')return null;
  try{
    owner(request,env);
    if(request.method==='GET'){
      const state=await settingsSnapshot(env),day=new Date().toISOString().slice(0,10);
      const [website,social,budget,salt]=await Promise.all([
        read(env,`security/ai-calls/${day}.json`),read(env,`security/ai-social-calls/${day}.json`),
        read(env,`security/ai-budget/${day}.json`),env.ARTWORK?.head('commerce/private/network-salt.json')
      ]);
      return privateJson({ok:true,...state,usage:{day,timezone:'UTC',websiteCalls:website?.used||0,highCalls:website?.modes?.high||0,standardCalls:website?.modes?.quick||0,unclassifiedCalls:Math.max(0,(website?.used||0)-(website?.modes?.high||0)-(website?.modes?.quick||0)),socialCalls:social?.used||0,reservedCents:budget?.reservedCents||0},
        connections:{creditsEnabled:env.RENDER_CREDITS_ENABLED==='true',networkProtection:!!salt||String(env.CREDIT_IP_SALT||'').length>=32,privateSaltOnFirstVisit:env.RENDER_CREDITS_STORAGE_SALT==='true',botProtection:!!env.TURNSTILE_SECRET_KEY&&!!env.TURNSTILE_SITE_KEY,socialEnabled:env.X_BOT_ENABLED==='true'&&env.X_BOT_APPROVED==='true'},
        engines:{high:env.IMAGE_MODEL_HIGH_QUALITY||null,standard:env.IMAGE_MODEL_QUICK||null,social:env.IMAGE_MODEL_SOCIAL||null},
        note:'Usage counts attempts reserved before inference, including retries and later safeguard failures; reservations are not billed-call totals or the provider bill. Free allowances use 24-hour windows and shared-network protection. Existing purchase credits keep the amount originally granted.'});
    }
    if(request.method!=='POST')return privateJson({ok:false,error:'Method not allowed'},405);
    sameOrigin(request);
    if(Number(request.headers.get('content-length')||0)>8192)throw fault('settings_invalid','Settings request is too large.',413);
    const raw=await request.text();if(raw.length>8192)throw fault('settings_invalid','Settings request is too large.',413);
    let body;try{body=JSON.parse(raw)}catch{throw fault('settings_invalid','Settings must be valid JSON.',400)}
    const values=validate(body.values);
    if(!Number.isSafeInteger(body.revision)||body.revision<0)throw fault('settings_invalid','Reload settings before saving.',400);
    const saved=await change(env,SETTINGS_KEY,{revision:0,values:policyFromEnv(env),history:[]},old=>{
      if(old.revision!==body.revision)throw fault('settings_conflict','Settings changed in another tab. Reload before saving.',409);
      const increased=['budgetCents','websiteCalls','socialCalls'].some(k=>values[k]>old.values[k]);
      if(increased&&body.confirm!=='INCREASE_LIMITS')throw fault('settings_confirmation','Confirm the higher spending or call limits before saving.',409);
      const at=new Date().toISOString(),revision=old.revision+1;
      return {revision,values,updatedAt:at,history:[{revision,at,before:old.values,after:values},...(old.history||[])].slice(0,20)};
    });
    return privateJson({ok:true,...saved});
  }catch(e){return privateJson({ok:false,error:e.message,code:e.code||'settings_unavailable'},e.status||503)}
}
