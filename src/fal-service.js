import {protectedChoice,runProtectedFaceEdit} from './protected-face-edit.js';
import {prepareFalInput,decodeFalInlineResult,decodeFalInlineImage,FAL_PILOT_HEADERS,FAL_ENDPOINT} from './fal-format.js';
import {customerNano} from './customer-identity.js';
import {ownerIdentityModel} from './owner-identity-comparison.js';
import {recordProviderResult,recordModelRecovery} from './provider-routing.js';
// One acknowledged job per customer AI.run, with read-only polling afterwards.
// Unknown/slow submissions are NEVER resubmitted or switched to another host.
const HOST='https://queue.fal.run';
const MAX_WAIT_MS=85000, POLL_MS=2500;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function safeQueueUrl(value,id,kind,queueRoot='fal-ai/flux-2'){
 if(typeof value!=='string')throw Error('Fal did not return a usable '+kind+' URL.');
 const url=new URL(value);
 if(url.protocol!=='https:'||url.hostname!=='queue.fal.run'||url.port||url.username||url.password||url.search||url.hash)throw Error('Untrusted provider callback destination.');
 const expected='/'+queueRoot+'/requests/'+id+(kind==='status'?'/status':'');
 if(url.pathname!==expected)throw Error('Fal callback does not match the acknowledged request.');
 return url.href;
}
function reasonFromHttp(status){
 if(status===429)return Object.assign(new Error('3040 out of capacity'),{reason:'capacity'});
 if(status===401||status===403)return Object.assign(new Error('Fal credential rejected'),{reason:'configuration'});
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
 const candidate=ownerIdentityModel(env);
 const publicNano=customerNano(env);
 const endpoint=candidate?.endpoint||(publicNano?'fal-ai/nano-banana/edit':FAL_ENDPOINT);
 const queueRoot=candidate?.queueRoot||(publicNano?'fal-ai/nano-banana':undefined);
 const prepared=await prepareFalInput(model,originalRequest);
 if(candidate&&protectedChoice(env.RECAST_OWNER_IDENTITY_MODEL)){
  try{return await runProtectedFaceEdit(env,prepared,candidate)}catch(error){if(error.reason==='pending')throw error;throw Object.assign(Error(error.message),{reason:'protected_edit',providerDispatches:error.providerDispatches,cause:error})}
 }
 const nano=endpoint==='fal-ai/nano-banana/edit';
 if(nano&&(env.CONTENT_MODERATION_ENABLED!=='true'||!env.MODERATION_OPENAI_API_KEY))throw Object.assign(new Error('Candidate requires existing image safety screening.'),{reason:'configuration'});
 const input=nano?{prompt:prepared.prompt,image_urls:prepared.image_urls,num_images:1,aspect_ratio:'4:5',output_format:'jpeg',safety_tolerance:'4',sync_mode:true,limit_generations:true}:prepared;
 // Wrangler secret put can preserve a trailing newline from redirected files.
 // Normalize ONLY surrounding whitespace; reject any internal control characters
 // and build Headers eagerly, before the first paid provider request.
 const credential=String(env.FAL_API_KEY||'').trim();
 if(credential.length<21||/\s/.test(credential)||/[\x00-\x1f\x7f]/.test(credential))throw Object.assign(new Error('Fal API credential needs to be reconfigured.'),{reason:'configuration'});
 const headers=new Headers({...FAL_PILOT_HEADERS,Authorization:'Key '+credential});
 const localId=String(env.RECAST_PROVIDER_ATTEMPT_ID||crypto.randomUUID()).replace(/[^a-zA-Z0-9._-]/g,'').slice(0,100);
 await receipt(env,localId,{host:'fal',model:endpoint,comparison:env.RECAST_OWNER_IDENTITY_MODEL||null,status:'submitting',startedAt:new Date().toISOString(),imageCount:input.image_urls.length,...(nano?{aspectRatio:input.aspect_ratio}:{width:prepared.image_size.width,height:prepared.image_size.height,steps:input.num_inference_steps})},{initial:true,required:true});
 let rejected=false,submitted=false,receivedFinalResult=false,requestId='',statusUrl='',resultUrl='';
 try{
  const submit=await fetch(HOST+'/'+endpoint,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(30000)});
  if(!submit.ok){rejected=submit.status>=400&&submit.status<500;const providerError=reasonFromHttp(submit.status);await receipt(env,localId,{status:rejected?'rejected_before_ack':'submission_uncertain',httpStatus:submit.status});throw providerError;}
  const info=await json(submit);
  requestId=String(info?.request_id||'');
  if(!/^[0-9a-z-]{25,100}$/i.test(requestId))throw Object.assign(new Error('503 provider accepted without request identifier'),{reason:'unavailable'});
  statusUrl=safeQueueUrl(info.status_url,requestId,'status',queueRoot);
  resultUrl=safeQueueUrl(info.response_url,requestId,'result',queueRoot);
  submitted=true;
  await receipt(env,localId,{status:'accepted',requestId,acknowledgedAt:new Date().toISOString()});
  const deadline=Date.now()+MAX_WAIT_MS;
  while(Date.now()<deadline){
   const response=await fetch(statusUrl,{headers:{Authorization:headers.get('Authorization')},signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Object.assign(new Error('503 failed checking provider job'),{reason:'unavailable'});
   const state=await json(response);
   if(state.status==='COMPLETED'){
    const result=await fetch(resultUrl,{headers:{Authorization:headers.get('Authorization')},signal:AbortSignal.timeout(20000)});
    if(!result.ok)throw Object.assign(new Error('503 completed provider job could not be retrieved'),{reason:'unavailable'});
    const body=await json(result);
    receivedFinalResult=true;
    // Nano Banana's documented schema has no has_nsfw_concepts verdict.
    // Its provider moderation stays on; the existing independent output
    // screening must pass before any candidate is saved or returned.
    if(nano&&typeof body.description!=='string')throw Error('Invalid candidate output.');
    if(nano&&body.has_nsfw_concepts!==undefined&&(!Array.isArray(body.has_nsfw_concepts)||body.has_nsfw_concepts.length!==1||body.has_nsfw_concepts[0]!==false))throw Object.assign(new Error('Candidate declined by moderation.'),{reason:'moderation'});
    const image=nano?decodeFalInlineImage(body):decodeFalInlineResult(body,input);
    if(nano){
      const bytes=Uint8Array.from(atob(image.image),c=>c.charCodeAt(0));
      const dimensions=await env.IMAGES.info(new Blob([bytes]).stream());
      if(!Number.isInteger(dimensions?.width)||!Number.isInteger(dimensions?.height)||Math.min(dimensions.width,dimensions.height)<512||Math.max(dimensions.width,dimensions.height)>2048)throw Error('Candidate returned unsupported image dimensions.');
    }
    await receipt(env,localId,{status:'completed',completedAt:new Date().toISOString(),requestId,bytes:Math.round(image.image.length*.75)});
    if(!candidate)await recordProviderResult(env,'fal','success');
    else if(['nano-banana','dev-edit'].includes(env.RECAST_OWNER_IDENTITY_MODEL))await recordModelRecovery(env,nano?'nano-banana':'flux-2-dev').catch(()=>{});
    return {...image,providerUsed:'fal',providerRequestId:requestId,modelUsed:endpoint};
   }
   if(state.status!=='IN_QUEUE'&&state.status!=='IN_PROGRESS')throw Object.assign(new Error('503 unknown provider job state'),{reason:'unavailable'});
   await wait(POLL_MS);
  }
  await receipt(env,localId,{status:'pending_for_recovery',requestId,lastCheckedAt:new Date().toISOString()});
  throw Object.assign(new Error('Provider job is still processing; do not submit the same job again.'),{reason:'timeout',pendingRequestId:requestId});
 }catch(error){
  // Accepted jobs are NOT safe for a second paid submission until their
  // recorded provider request ID is reconciled, including connection loss.
  const ambiguous=Boolean(submitted&&!receivedFinalResult);
  const status=rejected?'rejected_before_ack':error.pendingRequestId?'pending_for_recovery':receivedFinalResult?'completed_output_unavailable':submitted?'accepted_unknown_outcome':'submission_uncertain';
  await receipt(env,localId,{status,requestId:requestId||null,error:publicError(error)});
  if(!candidate&&(ambiguous||!rejected&&!receivedFinalResult))await recordProviderResult(env,'fal','pending','awaiting_result');
  else if(!candidate&&['unavailable','capacity','timeout'].includes(error.reason))await recordProviderResult(env,'fal','failed',error.reason);
  if(ambiguous)throw Object.assign(new Error('Your image job was accepted, but its result is still being checked. Please do not start another paid attempt.'),{reason:'pending',pendingRequestId:requestId,cause:error});
  throw error;
 }
}
export async function runCloudflareTracked(env,model,request,options){
 try{
  const result=await env.AI.run(model,request,options);
  await recordProviderResult(env,'cloudflare','success');return {...result,providerUsed:'cloudflare'};
 }catch(error){
  const message=String(error?.message||error).toLowerCase();
  const operational=/\b3043\b|\b503\b|upstream unavailable|service unavailable/.test(message)?'unavailable'
    :/\b3040\b|out of capacity|busy/.test(message)?'capacity'
    :/timed out|timeout/.test(message)?'timeout':null;
  if(operational)await recordProviderResult(env,'cloudflare','failed',operational);
  throw error
 }
}
export function wrapImageProvider(env,selection){
 if(!selection||!['cloudflare','fal'].includes(selection.host))return env;
 env={...env,RECAST_HQ_SELECTED_MODEL:selection.customerModel,RECAST_HQ_USING_BACKUP:selection.usingBackup===true};
 const originalAI=env.AI,host=selection.host;
 return {...env,RECAST_HQ_SELECTED_PROVIDER:host,AI:{...originalAI,async run(model,args,options){
  if(model!==String(env.IMAGE_MODEL_HIGH_QUALITY||'@cf/black-forest-labs/flux-2-dev'))return originalAI.run(model,args,options);
  if(host==='fal')return runFalEdit({...env,RECAST_HQ_SELECTED_PROVIDER:host},model,args);
  return runCloudflareTracked(env,model,args,options);
 }}};
}
