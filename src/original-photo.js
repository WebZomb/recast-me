import {moderateContent} from './content-safety.js';
import {sameOrigin,change,hash,randomToken,fault} from './commerce-store.js';
import {verifyTurnstile} from './highquality.js';
export async function saveOriginalPhoto(request,env,{trustedSocialJob=false}={}){
  sameOrigin(request);
  if(!env.ARTWORK||!env.IMAGES?.input||!env.IMAGES?.info)throw fault('photo_unavailable','Photo storage is temporarily unavailable.',503);
  if(Number(request.headers.get('content-length'))>13000000)throw fault('upload_size','Choose a photo smaller than 12 MB.',413);
  const form=await request.formData(),file=form.get('photo');
  if(form.get('consent')!=='yes')throw fault('photo_permission','Please confirm permission to use this photo.',400);
  if(!(file instanceof File)||!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>12000000)throw fault('photo_format','Choose one JPEG, PNG, or WebP photo under 12 MB.',400);
  const check=trustedSocialJob?{success:true}:await verifyTurnstile(env,String(form.get('turnstileToken')||''),request.headers.get('CF-Connecting-IP')||'');
  if(!check.success)throw fault('human_check_failed','Please complete the security check and try again.',403);
  const salt=env.CREDIT_IP_SALT||env.ADMIN_TOKEN;
  if(!salt)throw fault('photo_unavailable','Photo uploads are not configured yet.',503);
  const day=new Date().toISOString().slice(0,10),network=await hash(`${salt}:photo:${request.headers.get('CF-Connecting-IP')||'unknown'}`);
  await change(env,`security/photo-uploads/${day}/${network}.json`,{count:0},state=>{if(state.count>=10)throw fault('photo_limit','Today’s photo-upload limit has been reached. Try again tomorrow.',429);return{count:state.count+1}});
  const bytes=await file.arrayBuffer(),info=await env.IMAGES.info(new Blob([bytes]).stream());
  if(!(info.width>0&&info.height>0&&info.width<=8000&&info.height<=8000&&info.width*info.height<=40000000))throw fault('photo_dimensions','Choose a photo up to 8,000 pixels per side and 40 megapixels.',400);
  const contentSafety=await moderateContent(env,{images:[file],required:trustedSocialJob});
  // Decode/re-encode without cropping or AI; discard embedded metadata.
  const output=await env.IMAGES.input(new Blob([bytes],{type:file.type}).stream()).output({format:'image/jpeg',quality:95});
  const response=output.response();if(!response.ok)throw fault('photo_processing','Your photo could not be prepared.',503);
  const clean=new Uint8Array(await response.arrayBuffer());if(clean.length>12000000)throw fault('upload_size','The prepared photo is too large.',413);
  let binary='';for(let i=0;i<clean.length;i+=16384)binary+=String.fromCharCode(...clean.subarray(i,i+16384));
  const requestId=`RC-${Date.now().toString(36).toUpperCase()}-${randomToken().slice(0,8).toUpperCase()}`,accessToken=randomToken(),now=new Date().toISOString();
  const meta={contentSafety,requestId,accessToken,styleId:'original',styleName:'Original photo',subjectType:'photo',qualityMode:'original',modelUsed:null,status:'preview_ready',source:'original-photo',previewMime:'image/jpeg',inputCount:1,paid:false,fulfillment:'not_started',createdAt:now,updatedAt:now,width:info.width,height:info.height};
  await env.ARTWORK.put(`requests/${requestId}/preview.b64`,btoa(binary));
  await env.ARTWORK.put(`requests/${requestId}/request.json`,JSON.stringify(meta));
  return {ok:true,requestId,accessToken,style:'Original photo',qualityMode:'original',persisted:true,createdAt:now};
}
