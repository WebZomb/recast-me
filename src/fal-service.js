import {prepareFalInput,decodeFalInlineResult,FAL_PILOT_HEADERS,FAL_ENDPOINT} from './fal-format.js';
import {recordProviderResult} from './provider-routing.js';
// One acknowledged job per customer AI.run, with read-only polling afterwards.
// Unknown/slow submissions are NEVER resubmitted or switched to another host.
const HOST='https://queue.fal.run', FAL_PATH='/fal-ai/flux-2/edit';
const MAX_WAIT_MS=85000, POLL_MS=2500;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function safeQueueUrl(value,id,kind){
 if(typeof value!=='string')throw Error('Fal did not return a usable '+kind+' URL.');
 const url=new URL(value);
 if(url.protocol!=='https:'||url.hostname!=='queue.fal.run'||url.port||url.username||url.password||url.search||url.hash)throw Error('Untrusted provider callback destination.');
 const expected='/fal-ai/flux-2/requests/'+id+(kind==='status'?'/status':'');
 if(url.pathname!==expected)throw Error('Fal callback does not match the acknowledged request.');
 return url.href;
}
function reasonFromHttp(status){
 if(status===429)return Object.assign(new Error('3040 out of capacity'),{reason:'capacity'});
 if(status===402)return Object.assign(new Error('3036 quota exceeded'),{reason:'quota'});
 if(status===422||status===400)return Object.assign(new Error('Fal rejected this image request.'),{reason:'provider'});
 return Object.assign(new Error('503 service unavailable'),{reason:'unavailable'});
}
function publicError(error){const m=String(error?.message||error).slice(0,200);return m.replace(/Key\s+\S+/gi,'Key [redacted]')}
async function receipt(env,id,updates,{initial=false,required=false}={}){
 try{
  if(!env.ARTWORK?.put||!env.ARTWORK?.get)throw Error('Private job ledger is unavailable.');
  const key='system/providers/fal-jobs/'+id+'.json',old=await env.ARTWORK.get(key);
  if(initial&&old)throw Error('This render already has a durable provider claim.');
  const previous=old?await old.json():{};
  const saved=await env.ARTWORK.put(key,JSON.stringify({...previous,...updates,updatedAt:new Date().toISOString()}),{
   ...(initial?{onlyIf:new Headers({'If-None-Match':'*'})}:{}),
   httpMetadata:{contentType:'application/json'}
  });
  if(initial&&!saved)throw Error('The provider claim is already reserved.');
  return Boolean(saved);
 }catch(error){
  if(required)throw Object.assign(new Error('Render job tracking is temporarily unavailable. No new image request was sent.'),{reason:'configuration',cause:error});
  return false; // After dispatch, NEVER replay an ambiguous accepted request.
 }
}
async function json(response){
 const raw=await response.text();
 try{return JSON.parse(raw)}catch{throw Object.assign(new Error('503 provider response could not be parsed'),{reason:'unavailable'});}
}
export async function runFalEdit(env,model,originalRequest){
 if(!env.FAL_API_KEY||typeof env.FAL_API_KEY!=='string'||env.FAL_PROVIDER_ENABLED!=='true')throw Object.assign(new Error('Fal provider is not configured'),{reason:'configuration'});
 const input=await prepareFalInput(model,originalRequest);
 const localId=String(env.RECAST_PROVIDER_ATTEMPT_ID||crypto.randomUUID()).replace(/[^a-zA-Z0-9._-]/g,'').slice(0,100);
 await receipt(env,localId,{host:'fal',model:'fal-ai/flux-2/edit',status:'submitting',startedAt:new Date().toISOString(),imageCount:input.image_urls.length,width:input.image_size.width,height:input.image_size.height,steps:input.num_inference_steps},{initial:true,required:true});
 const headers={...FAL_PILOT_HEADERS,Authorization:'Key '+env.FAL_API_KEY};
 let submitted=false,requestId='',statusUrl='',resultUrl='';
 try{
  const submit=await fetch(HOST+FAL_PATH,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(30000)});
  if(!submit.ok){const providerError=reasonFromHttp(submit.status);await receipt(env,localId,{status:'rejected_before_ack',httpStatus:submit.status});throw providerError;}
  const info=await json(submit);
  requestId=String(info?.request_id||'');
  if(!/^[0-9a-z-]{25,100}$/i.test(requestId))throw Object.assign(new Error('503 provider accepted without request identifier'),{reason:'unavailable'});
  statusUrl=safeQueueUrl(info.status_url,requestId,'status');
  resultUrl=safeQueueUrl(info.response_url,requestId,'result');
  submitted=true;
  await receipt(env,localId,{status:'accepted',requestId,acknowledgedAt:new Date().toISOString()});
  const deadline=Date.now()+MAX_WAIT_MS;
  while(Date.now()<deadline){
   const response=await fetch(statusUrl,{headers:{Authorization:headers.Authorization},signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Object.assign(new Error('503 failed checking provider job'),{reason:'unavailable'});
   const state=await json(response);
   if(state.status==='COMPLETED'){
    const result=await fetch(resultUrl,{headers:{Authorization:headers.Authorization},signal:AbortSignal.timeout(20000)});
    if(!result.ok)throw Object.assign(new Error('503 completed provider job could not be retrieved'),{reason:'unavailable'});
    const body=await json(result);
    const image=decodeFalInlineResult(body,input);
    await receipt(env,localId,{status:'completed',completedAt:new Date().toISOString(),requestId,bytes:Math.round(image.image.length*.75)});
    await recordProviderResult(env,'fal','success');
    return {...image,providerUsed:'fal',providerRequestId:requestId};
   }
   if(state.status!=='IN_QUEUE'&&state.status!=='IN_PROGRESS')throw Object.assign(new Error('503 unknown provider job state'),{reason:'unavailable'});
   await wait(POLL_MS);
  }
  await receipt(env,localId,{status:'pending_for_recovery',requestId,lastCheckedAt:new Date().toISOString()});
  throw Object.assign(new Error('Provider job is still processing; do not submit the same job again.'),{reason:'timeout',pendingRequestId:requestId});
 }catch(error){
  // A completed result may still be recoverable by its recorded request ID.
  const status=error.pendingRequestId?'pending_for_recovery':submitted?'accepted_unknown_outcome':'submission_uncertain';
  await receipt(env,localId,{status,requestId:requestId||null,error:publicError(error)});
  await recordProviderResult(env,'fal','failed',error.reason||'provider');
  throw error;
 }
}
export async function runCloudflareTracked(env,model,request,options){
 try{
  const result=await env.AI.run(model,request,options);
  await recordProviderResult(env,'cloudflare','success');return {...result,providerUsed:'cloudflare'};
 }catch(error){await recordProviderResult(env,'cloudflare','failed',String(error.message||'').includes('3043')?'unavailable':'provider');throw error}
}
export function wrapImageProvider(env,selection){
 if(!selection||!['cloudflare','fal'].includes(selection.host))return env;
 const originalAI=env.AI,host=selection.host;
 return {...env,RECAST_HQ_SELECTED_PROVIDER:host,AI:{...originalAI,async run(model,args,options){
  if(model!==String(env.IMAGE_MODEL_HIGH_QUALITY||'@cf/black-forest-labs/flux-2-dev'))return originalAI.run(model,args,options);
  if(host==='fal')return runFalEdit(env,model,args);
  return runCloudflareTracked(env,model,args,options);
 }}};
}
