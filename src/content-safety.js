// Keyword screening is a first layer, never a claim that pixels were screened.
export const CONTENT_POLICY_VERSION='family-friendly-1';
export const CONTENT_MESSAGE='Please choose a family-friendly photo and description. Nudity, sexual content, graphic violence, hate, harassment and explicit profanity are not supported.';
export function screenText(text=''){
  const value=String(text).normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'');
  const terms=/\b(nud(?:e|es|ity)|naked|porn(?:ography|ographic)?|nsfw|sexual|sex|erotic|undress|topless|genitals?|rape|gore|beheading|swastika|heil hitler|white supremacy|fuck(?:ing|ed|er|ers)?|motherfucker|shit|bullshit|bitch(?:es)?|cunt|asshole|nigger|faggot)\b/i;
  const evasion=/\b(?:f[\W_]*[u*][\W_]*[c*][\W_]*k|sh[1i!][t+]|p[o0]rn|n[u*]d[e3])\b/i;
  return terms.test(value)||evasion.test(value)?{status:'rejected',reason:'content_policy'}:{status:'passed',reason:null};
}
export function moderationReadiness(env){
  const enabled=String(env.CONTENT_MODERATION_ENABLED)==='true';
  return {enabled,configured:Boolean(env.MODERATION_OPENAI_API_KEY),ready:enabled&&Boolean(env.MODERATION_OPENAI_API_KEY),policy:CONTENT_POLICY_VERSION};
}
function failure(reason,message,status){return Object.assign(new Error(message),{reason,code:reason,status});}
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);}
// Explicit activation + dedicated secret required. Never reuse a generation API
// key, change generation models, or silently activate another provider.
export async function moderateContent(env,{text='',images=[],required=false}={}){
  if(screenText(text).status==='rejected')throw failure('content_policy',CONTENT_MESSAGE,422);
  const ready=moderationReadiness(env);
  if(!ready.enabled&&!required)return {status:'not_screened',policy:CONTENT_POLICY_VERSION};
  if(!ready.ready)throw failure('content_screening_unavailable','Photo safety screening is temporarily unavailable. Please try again later.',503);
  const input=[];
  if(text)input.push({type:'text',text:String(text).slice(0,4000)});
  for(const file of images){
    if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12000000)throw failure('content_screening_unavailable','This photo could not be checked. Choose a JPEG, PNG or WebP image under 12 MB.',400);
    input.push({type:'image_url',image_url:{url:`data:${file.type};base64,${base64(new Uint8Array(await file.arrayBuffer()))}`}});
  }
  if(!input.length)throw failure('content_screening_unavailable','There is no content to check.',400);
  let data;
  try{
    const res=await fetch('https://api.openai.com/v1/moderations',{method:'POST',headers:{'content-type':'application/json',Authorization:`Bearer ${env.MODERATION_OPENAI_API_KEY}`},body:JSON.stringify({model:'omni-moderation-latest',input}),signal:AbortSignal.timeout(15000)});
    if(!res.ok)throw new Error('provider unavailable');
    data=await res.json();
    if(!Array.isArray(data.results)||!data.results.length||data.results.some(x=>typeof x.flagged!=='boolean'||!x.categories||Object.values(x.categories).some(v=>typeof v!=='boolean')))throw new Error('invalid result');
  }catch{throw failure('content_screening_unavailable','Photo safety screening could not finish. Please try again later.',503);}
  if(data.results.some(x=>x.flagged||Object.values(x.categories).some(Boolean)))throw failure('content_policy',CONTENT_MESSAGE,422);
  return {status:'passed',policy:CONTENT_POLICY_VERSION,provider:'openai-moderation',checkedAt:new Date().toISOString()};
}

export async function checkStoredArtwork(env,meta){
  if(!moderationReadiness(env).enabled)return;
  const source=await env.ARTWORK.get(`requests/${meta.requestId}/preview.b64`);
  if(!source)throw failure('content_screening_unavailable','Saved artwork is unavailable.',404);
  const b64=await source.text(),text=`${meta.notes||''} ${meta.customWorld||''}`;
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(b64+'|'+text))),n=>n.toString(16).padStart(2,'0')).join('');
  const key=`security/content-screening/${meta.requestId}.json`,saved=await env.ARTWORK.get(key);
  if(saved){const old=await saved.json();if(old.hash===hash&&old.policy===CONTENT_POLICY_VERSION&&old.status==='passed')return;}
  const result=await moderateContent(env,{text,images:[new File([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],'artwork',{type:meta.previewMime||'image/jpeg'})],required:true});
  await env.ARTWORK.put(key,JSON.stringify({...result,hash}));
}
