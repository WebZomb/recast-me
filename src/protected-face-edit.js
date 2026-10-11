// Owner-only experiment: one SAM segmentation + one masked edit. No retry/fallback.
import {decode,encode} from 'fast-png';
import {FAL_PILOT_HEADERS,decodeFalInlineImage,decodeFalInlineResult} from './fal-format.js';
export const PROTECTED_FACE_VERSION='owner-protected-head-v1';
export const protectedChoice=choice=>['qwen-protected','fill-protected'].includes(choice);
const fail=message=>Object.assign(Error(message),{reason:'provider'});
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s)};
const uri=bytes=>'data:image/png;base64,'+b64(bytes);
const bytesOf=base64=>Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
export function checkedPng(bytes){
 // Check header dimensions BEFORE allocating decompressed buffers.
 if(bytes.length<33||bytes.length>12000000||!([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)))throw fail('Invalid PNG.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),w=view.getUint32(16),h=view.getUint32(20);
 if(!w||!h||w>2048||h>2048||w*h>4200000)throw fail('Unsupported PNG dimensions.');
 const p=decode(bytes,{checkCrc:true});
 if(![1,2,4,8,16].includes(p.depth)||![1,2,3,4].includes(p.channels)||(p.depth<8&&(p.channels!==1||w*p.depth%8)))throw fail('Unsupported normalized PNG format.');
 const data=new Uint8Array(w*h*4),max=(1<<p.depth)-1;
 const sample=index=>p.depth<8?(p.data[Math.floor(index*p.depth/8)]>>(8-p.depth-index*p.depth%8))&max:p.data[index];
 for(let i=0;i<w*h;i++){
  const start=i*p.channels,d=i*4;
  if(p.palette){const color=p.palette[sample(start)];if(!color)throw fail('Invalid PNG palette.');data.set([color[0],color[1],color[2],color[3]??255],d);}
  else {const channel=n=>Math.round(sample(start+n)*255/max);data[d]=channel(0);data[d+1]=channel(p.channels>2?1:0);data[d+2]=channel(p.channels>2?2:0);data[d+3]=p.channels===2?channel(1):p.channels===4?channel(3):255;}
 }
 return {width:w,height:h,data};
}
async function normalize(env,bytes,width,height){
 const result=await env.IMAGES.input(new Blob([bytes]).stream()).transform({width,height,fit:'contain',background:'#000000'}).output({format:'image/png'});
 const response=result.response();if(!response.ok)throw fail('Could not prepare the protected photo.');
 const png=new Uint8Array(await response.arrayBuffer()),pixels=checkedPng(png);
 if(pixels.width!==width||pixels.height!==height)throw fail('Image processor changed the test dimensions.');
 return {png,pixels};
}
export function combineHeadMasks(masks,width,height){
 const keep=new Uint8Array(width*height);let total=0;
 for(const p of masks){
  if(p.width!==width||p.height!==height)throw fail('Head mask is not aligned with the photograph.');
  let count=0;
  for(let i=0;i<keep.length;i++){
   const k=i*4; // SAM apply_mask:false yields a white foreground on black.
   if(p.data[k]>=128&&p.data[k+1]>=128&&p.data[k+2]>=128&&p.data[k+3]>=128){count++;if(!keep[i]){keep[i]=255;total++;}}
  }
  if(count<width*height*.003||count>width*height*.65)throw fail('Head mask coverage needs review; no scene render was submitted.');
 }
 if(!masks.length||total>width*height*.8)throw fail('No usable head masks; no scene render was submitted.');
 return keep;
}
export function restoreProtectedPixels(original,generated,keep){
 if(original.width!==generated.width||original.height!==generated.height||keep.length!==original.width*original.height)throw fail('Generated scene is not aligned with the original.');
 const {width,height}=original,data=new Uint8Array(generated.data);
 // Original region is copied exactly. A two-pixel OUTER ring blends the seam;
 // no smoothing, color correction or feathering is applied inside the mask.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,k=i*4;let alpha=keep[i]?1:0;
  if(!alpha){let distance=3;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height&&keep[yy*width+xx])distance=Math.min(distance,Math.max(Math.abs(dx),Math.abs(dy)));
  }alpha=distance===1?2/3:distance===2?1/3:0;}
  if(alpha)for(let c=0;c<4;c++)data[k+c]=alpha===1?original.data[k+c]:Math.round(original.data[k+c]*alpha+generated.data[k+c]*(1-alpha));
 }
 return {width,height,channels:4,depth:8,data};
}
async function job(env,endpoint,root,input,suffix){
 const credential=String(env.FAL_API_KEY||'').trim();
 if(credential.length<21||/\s|[\x00-\x1f\x7f]/.test(credential))throw fail('Invalid provider configuration.');
 const id=String(env.RECAST_PROVIDER_ATTEMPT_ID||crypto.randomUUID()).replace(/[^a-zA-Z0-9._-]/g,'').slice(0,85)+'-'+suffix;
 const key='system/providers/fal-jobs/'+id+'.json';
 let record={model:endpoint,comparison:env.RECAST_OWNER_IDENTITY_MODEL,status:'submitting',startedAt:new Date().toISOString(),imageCount:1};
 const save=async updates=>{record={...record,...updates,updatedAt:new Date().toISOString()};await env.ARTWORK.put(key,JSON.stringify(record),{httpMetadata:{contentType:'application/json'}})};
 const claim=await env.ARTWORK.put(key,JSON.stringify(record),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});
 if(!claim)throw fail('This comparison already has a provider claim. Do not repeat a pending test.');
 const headers={...FAL_PILOT_HEADERS,Authorization:'Key '+credential};let acknowledged=false,finished=false;
 try{
  const response=await fetch('https://queue.fal.run/'+endpoint,{method:'POST',headers,body:JSON.stringify(input),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw fail('Provider rejected the '+suffix+' request ('+response.status+').');
  const submission=await response.json(),requestId=submission.request_id;
  if(!/^[0-9a-z-]{25,100}$/i.test(requestId||''))throw fail('Provider acknowledgement is invalid.');
  acknowledged=true;
  const base='https://queue.fal.run/'+root+'/requests/'+requestId;
  if(submission.status_url!==base+'/status'||submission.response_url!==base)throw fail('Provider callback does not match this test.');
  await save({status:'accepted',requestId});
  const until=Date.now()+85000;
  while(Date.now()<until){
   const status=await fetch(base+'/status',{headers:{Authorization:headers.Authorization},signal:AbortSignal.timeout(12000)});
   if(!status.ok)throw fail('Could not check the accepted comparison.');
   const state=await status.json();
   if(state.status==='COMPLETED'){
    const result=await fetch(base,{headers:{Authorization:headers.Authorization},signal:AbortSignal.timeout(20000)});
    if(!result.ok)throw fail('Could not retrieve the accepted comparison.');
    const data=await result.json();finished=true;await save({status:'completed',completedAt:new Date().toISOString()});return data;
   }
   if(!['IN_QUEUE','IN_PROGRESS'].includes(state.status))throw fail('Unexpected provider job status.');
   await new Promise(resolve=>setTimeout(resolve,2500));
  }
  throw fail('Comparison is still processing.');
 }catch(error){
  try{await save({status:finished?'completed_output_unavailable':acknowledged?'accepted_unknown_outcome':'submission_uncertain',error:'Comparison stopped; review provider job before repeating.'})}catch{}
  throw Object.assign(Error('Comparison stopped. Check owner provider jobs before repeating; a submitted request may still be billable.'),{reason:'pending',cause:error});
 }
}
export async function runProtectedFaceEdit(env,prepared,candidate){
 if(env.RECAST_OWNER_PILOT_REQUEST!=='true'||!protectedChoice(env.RECAST_OWNER_IDENTITY_MODEL))throw fail('Protected editing requires the owner lab.');
 if(env.CONTENT_MODERATION_ENABLED!=='true'||!env.MODERATION_OPENAI_API_KEY)throw fail('Protected editing requires input and output screening.');
 if(prepared.image_urls.length!==1)throw fail('Use one original photograph for the protected-head comparison.');
 const raw=bytesOf(prepared.image_urls[0].split(',')[1]);
 const info=await env.IMAGES.info(new Blob([raw]).stream());
 if(!Number.isInteger(info.width)||!Number.isInteger(info.height)||Math.min(info.width,info.height)<256||Math.max(info.width,info.height)>4096)throw fail('Unsupported reference dimensions.');
 const scale=Math.min(1,960/Math.max(info.width,info.height));
 const width=Math.floor(info.width*scale/32)*32,height=Math.floor(info.height*scale/32)*32;
 if(Math.min(width,height)<256)throw fail('This photo is too narrow for the protected-head pilot.');
 const original=await normalize(env,raw,width,height);
 const segmentation=await job(env,'fal-ai/sam-3/image','fal-ai/sam-3',{
  image_url:uri(original.png),prompt:'head',apply_mask:false,return_multiple_masks:true,max_masks:8,include_scores:true,include_boxes:true,output_format:'png',sync_mode:true
 },'mask');
 if(!Array.isArray(segmentation.masks)||!segmentation.masks.length||segmentation.masks.length>=8)throw fail('Automatic head detection needs review; no scene render was submitted.');
 const masks=[];
 for(let i=0;i<segmentation.masks.length;i++){
  const score=segmentation.scores?.[i]??segmentation.metadata?.find(m=>m.index===i)?.score;
  if(!Number.isFinite(score)||score<.5)throw fail('Automatic head detection is uncertain; no scene render was submitted.');
  const inline=decodeFalInlineImage({images:[segmentation.masks[i]]});
  const bytes=bytesOf(inline.image),dimensions=await env.IMAGES.info(new Blob([bytes]).stream());
  if(dimensions.width!==width||dimensions.height!==height)throw fail('Automatic head mask is misaligned; no scene render was submitted.');
  masks.push((await normalize(env,bytes,width,height)).pixels);
 }
 const keep=combineHeadMasks(masks,width,height);
 const editMask=new Uint8Array(width*height*4);
 for(let i=0;i<keep.length;i++){editMask.fill(255-keep[i],i*4,i*4+3);editMask[i*4+3]=255;}
 const maskUrl=uri(encode({width,height,channels:4,depth:8,data:editMask}));
 const prompt=prepared.prompt+' Edit only the white mask. Retain the position and size of each protected head. Remove faceless supporting people, their clothing and hands. Build the requested scene and outfit around the existing heads. Match the original face lighting. No new heads or faces.';
 const input={prompt,image_url:uri(original.png),mask_url:maskUrl,num_images:1,output_format:'png',sync_mode:true,...(env.RECAST_OWNER_IDENTITY_MODEL==='qwen-protected'?{image_size:{width,height},num_inference_steps:30,guidance_scale:4,strength:.93,enable_safety_checker:true}:{safety_tolerance:'2',enhance_prompt:false})};
 const result=await job(env,candidate.endpoint,candidate.queueRoot,input,'scene');
 const rendered=decodeFalInlineResult(result,{image_size:{width,height}}),renderBytes=bytesOf(rendered.image);
 const dimensions=await env.IMAGES.info(new Blob([renderBytes]).stream());
 if(dimensions.width!==width||dimensions.height!==height)throw fail('Scene dimensions changed; original faces cannot be safely restored.');
 const generated=await normalize(env,renderBytes,width,height);
 const final=restoreProtectedPixels(original.pixels,generated.pixels,keep);
 return {image:b64(encode(final)),providerUsed:'fal',modelUsed:candidate.endpoint};
}
