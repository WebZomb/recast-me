import { requireAdmin } from './workflow.js';
import { digest } from './render-controls.js';
import { watermarkBytes, SECURITY_VERSION } from './preview-security.js';

const VERSION = 'finish-compare-1';
const MODES = { preserve: 'interpolate', enhanced: 'generate' };
const headers = { 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer' };
const reply = (data, status=200) => Response.json(data, {status, headers});
const fail = (message, status=400) => Object.assign(new Error(message), {status});
function encode(bytes) {
  let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(text);
}
async function context(env, id) {
  if(!/^RC-[A-Z0-9-]{1,80}$/.test(id))throw fail('Invalid Artwork ID.');
  if(!env.ARTWORK || !env.IMAGES?.input || !env.IMAGES?.info)throw fail('Private storage and image processing are required.',503);
  const meta=await env.ARTWORK.get(`requests/${id}/request.json`);
  const source=await env.ARTWORK.get(`requests/${id}/preview.b64`);
  if(!meta || !source)throw fail('Saved artwork not found.',404);
  const text=(await source.text()).replace(/^data:image\/[\w.+-]+;base64,/, '').replace(/\s/g,'');
  if(text.length>16000000)throw fail('Source exceeds comparison size limit.');
  const bytes=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
  const sourceHash=await digest(bytes);
  return {bytes,sourceHash,prefix:`requests/${id}/finish-tests/${VERSION}/${sourceHash}`};
}
async function result(env, ctx, mode) {
  const record=await env.ARTWORK.get(`${ctx.prefix}/${mode}.json`);
  if(!record)return {mode,status:'not_started'};
  const state=await record.json();
  const safe={mode,status:state.status,width:state.width,height:state.height,elapsedMs:state.elapsedMs,
    usage:state.usage,message:state.message};
  if(state.status==='succeeded') {
    const image=await env.ARTWORK.get(`${ctx.prefix}/${mode}-${SECURITY_VERSION}.jpg`);
    if(!image)return {...safe,status:'preview_unavailable',message:'Protected comparison unavailable. No automatic transform was started.'};
    safe.preview=`data:image/jpeg;base64,${encode(new Uint8Array(await image.arrayBuffer()))}`;
    safe.watermarked=true;
  }
  return safe;
}
export async function printFinishRoutes(request,env) {
  const url=new URL(request.url);
  if(url.pathname!=='/api/admin/print-finish')return null;
  try {
    requireAdmin(request,env);
    if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed.'},405);
    const body=request.method==='POST'?await request.json():{};
    const id=String(body.requestId || url.searchParams.get('requestId') || '');
    const ctx=await context(env,id);
    if(request.method==='POST') {
      const mode=body.mode;
      if(!Object.hasOwn(MODES,mode))throw fail('Choose Preserve or Enhanced.');
      if(body.confirmBillable!==true)throw fail('Confirm this image-processing comparison before starting.');
      const info=await env.IMAGES.info(new Blob([ctx.bytes]).stream());
      if(!Number.isInteger(info.width)||!Number.isInteger(info.height)||info.width<1||info.height<1||info.width>1536||info.height>1920)throw fail('Use a saved preview no larger than 1536 × 1920.');
      const key=`${ctx.prefix}/${mode}.json`;
      const state={status:'running',sourceHash:ctx.sourceHash,mode,createdAt:new Date().toISOString(),width:info.width*2,height:info.height*2,
        usage:{upscaleSubmissions:0,watermarkSubmissions:0,actualCostUsd:null,billing:'Check Cloudflare Images usage; this is outside the AI.run call ceiling.'}};
      // Durable, non-expiring claim: an interrupted provider operation is ambiguous.
      // Never release it automatically and accidentally submit another paid upscale.
      const claim=await env.ARTWORK.put(key,JSON.stringify(state),{onlyIf:new Headers({'If-None-Match':'*'})});
      if(claim) {
        const started=Date.now();
        try {
          state.usage.upscaleSubmissions=1;await env.ARTWORK.put(key,JSON.stringify(state));
          const output=await env.IMAGES.input(new Blob([ctx.bytes]).stream()).transform({width:state.width,height:state.height,fit:'contain',upscale:MODES[mode]}).output({format:'image/jpeg',quality:95});
          const response=output.response();
          if(!response.ok||!response.headers.get('content-type')?.startsWith('image/jpeg'))throw fail('Image processing did not return a JPEG.',502);
          const clean=new Uint8Array(await response.arrayBuffer());
          const dimensions=await env.IMAGES.info(new Blob([clean]).stream());
          if(dimensions.width!==state.width||dimensions.height!==state.height)throw fail('The service did not produce the requested 2× dimensions.',502);
          await env.ARTWORK.put(`${ctx.prefix}/${mode}-private.jpg`,clean,{httpMetadata:{contentType:'image/jpeg'}});
          state.usage.watermarkSubmissions=1;await env.ARTWORK.put(key,JSON.stringify(state));
          const marked=await watermarkBytes(env,clean,{maxWidth:3072,maxHeight:3840});
          await env.ARTWORK.put(`${ctx.prefix}/${mode}-${SECURITY_VERSION}.jpg`,marked,{httpMetadata:{contentType:'image/jpeg',cacheControl:'private, no-store'}});
          state.status='succeeded';
        } catch {
          state.status='failed';state.message='The comparison did not finish. No automatic retry will run. The original artwork is unchanged; review image-processing usage before retrying manually.';
        }
        state.elapsedMs=Date.now()-started;await env.ARTWORK.put(key,JSON.stringify(state));
      }
    }
    return reply({ok:true,requestId:id,comparisonOnly:true,scale:2,candidates:await Promise.all(Object.keys(MODES).map(mode=>result(env,ctx,mode)))});
  } catch(error) {return reply({ok:false,error:error.status?error.message:'The protected comparison could not be loaded.'},error.status||503)}
}
