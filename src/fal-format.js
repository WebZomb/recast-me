// Optional server-side fal FLUX.2 dev adapter. Enabled only with the owner provider gate.
// The caller must supply a controlled server-side transport; this data module has no
// network calls, credentials, retry loop, failover, or deployment side effects.
export const FAL_ENDPOINT = 'fal-ai/flux-2/edit';
const EXPECTED_MODEL = '@cf/black-forest-labs/flux-2-dev';
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2_000_000;
function fail(message, reason='provider') { return Object.assign(new Error(message), {reason}); }
function base64(bytes) {
  let binary='';
  for(let i=0;i<bytes.length;i+=16384) binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return btoa(binary);
}
function number(form,name,min,max,integer=false){
  const raw=form.get(name),value=Number(raw);
  if(raw===null||raw===''||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))throw fail('Invalid '+name,'input');
  return value;
}
function signature(bytes,type){
  if(type==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(type==='image/png')return [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  if(type==='image/webp')return String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  return false;
}
export async function prepareFalInput(model,{multipart}={}){
  if(model!==EXPECTED_MODEL)throw fail('Pilot accepts only the existing HQ FLUX.2 dev model.','input');
  if(!multipart?.body||!multipart.contentType?.startsWith('multipart/form-data;'))throw fail('Expected original model multipart request.','input');
  const form=await new Response(multipart.body,{headers:{'content-type':multipart.contentType}}).formData();
  const prompt=form.get('prompt');
  if(typeof prompt!=='string'||!prompt.trim()||prompt.length>20000)throw fail('Invalid pilot prompt.','input');
  const allowed=new Set(['prompt','width','height','guidance','steps','input_image_0','input_image_1','input_image_2','input_image_3']);
  const keys=[...form.keys()];
  if(keys.some(k=>!allowed.has(k))||new Set(keys).size!==keys.length)throw fail('Unexpected or duplicate provider field.','input');
  const image_urls=[];
  for(let i=0;i<4;i++){
    const file=form.get('input_image_'+i);
    if(file===null){if(keys.some(k=>/^input_image_/.test(k)&&Number(k.slice(12))>i))throw fail('Reference order has a gap.','input');continue;}
    if(!(file instanceof File)||!TYPES.has(file.type)||file.size<12||file.size>MAX_BYTES)throw fail('Invalid reference file.','input');
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!signature(bytes,file.type))throw fail('Reference type/signature mismatch.','input');
    image_urls.push('data:'+file.type+';base64,'+base64(bytes));
  }
  if(!image_urls.length)throw fail('Photo-editing pilot requires at least one reference.','input');
  return {prompt,image_urls,image_size:{width:number(form,'width',512,2048,true),height:number(form,'height',512,2048,true)},
    num_inference_steps:number(form,'steps',8,30,true),guidance_scale:number(form,'guidance',1,10),
    num_images:1,acceleration:'none',enable_prompt_expansion:false,enable_safety_checker:true,
    output_format:'jpeg',sync_mode:true};
}
export const FAL_PILOT_HEADERS=Object.freeze({
  'Content-Type':'application/json','X-Fal-No-Retry':'1','x-app-fal-disable-fallback':'true',
  'X-Fal-Store-IO':'0','X-Fal-Object-Lifecycle-Preference':'{"expiration_duration_seconds":3600}'
});
export function decodeFalInlineResult(data,input){
  if(!Array.isArray(data?.has_nsfw_concepts)||data.has_nsfw_concepts.length!==1||typeof data.has_nsfw_concepts[0]!=='boolean')throw fail('Missing provider safety result.');
  if(data.has_nsfw_concepts[0])throw fail('Image declined by provider moderation.','moderation');
  if(!Array.isArray(data.images)||data.images.length!==1)throw fail('Expected exactly one generated image.');
  const output=data.images[0];
  if((output.width!==undefined&&output.width!==input.image_size.width)||(output.height!==undefined&&output.height!==input.image_size.height))throw fail('Provider returned unexpected dimensions.');
  const uri=output.url;
  if(typeof uri!=='string'||uri.length>16_100_000)throw fail('Invalid generated image.');
  const match=uri.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  // Do not fetch or disclose a public output URL as a shortcut for private media.
  if(!match)throw fail('Pilot requires inline image output; remote URL retrieval needs separate review.');
  let bytes;try{bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));}catch{throw fail('Invalid image encoding.');}
  if(bytes.length<100||bytes.length>12_000_000||!signature(bytes,match[1]))throw fail('Invalid generated image signature or size.');
  return {image:match[2]};
}
export function createFalPilotBinding({send}={}){
  if(typeof send!=='function')throw fail('A controlled pilot transport is required.','configuration');
  return {async run(model,request){
    const input=await prepareFalInput(model,request);
    const data=await send({endpoint:FAL_ENDPOINT,input,headers:{...FAL_PILOT_HEADERS}});
    return decodeFalInlineResult(data,input);
  }};
}
