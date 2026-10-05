export const fault = (code, message, status = 409) => Object.assign(new Error(message), {code, status, renderControl:true});
export async function hash(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export function equal(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || a.length !== b.length) return false;
  let d=0; for(let i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0;
}
export function randomToken(){return [...crypto.getRandomValues(new Uint8Array(32))].map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function read(env,key){const o=await env.ARTWORK?.get(key);return o ? o.json() : null}
export async function change(env,key,initial,mutate){
  if(!env.ARTWORK)throw fault('commerce_storage','Private storage is unavailable.',503);
  for(let i=0;i<12;i++){
    const old=await env.ARTWORK.get(key),value=old?await old.json():structuredClone(initial);
    const next=await mutate(value);
    if(next===undefined)return value;
    const written=await env.ARTWORK.put(key,JSON.stringify(next),{onlyIf:old?{etagMatches:old.etag}:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json'}});
    if(written)return next;
  }
  throw fault('commerce_busy','Another update is in progress. Please refresh and try again.',409);
}
export function sameOrigin(request){
  if(request.headers.get('x-recast-request')!=='1' || (request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin))throw fault('origin_required','Please use the Recast Me page to make this change.',403);
}
export function privateJson(data,status=200,extra={}){return Response.json(data,{status,headers:{'cache-control':'private, no-store','referrer-policy':'no-referrer',...extra}})}

export function normalizeProductDesign(map,raw={}){
  const mug=map?.product==='Mug';
  const allowedLayout=mug?['single','two-sided','wrap']:['single'];
  const layout=allowedLayout.includes(String(raw.layout))?String(raw.layout):'single';
  const x=['left','center','right'].includes(String(raw.x))?String(raw.x):'center';
  const n=Number(raw.scale),scale=Math.round(Math.max(55,Math.min(250,Number.isFinite(n)?n:(mug?92:100))));
  return {version:1,layout,background:mug?'scene-fill':'none',x,scale};
}
export function productPrintfile(catalog,variantId,placement){
  const variant=catalog?.variant_printfiles?.find(v=>Number(v.variant_id)===Number(variantId));
  const file=catalog?.printfiles?.find(f=>Number(f.printfile_id)===Number(variant?.placements?.[placement]));
  if(!file||![file.width,file.height].every(n=>Number.isFinite(n)&&n>0))throw fault('print_area_missing','Printful print dimensions are unavailable for this variant.',502);
  return file;
}

function fitDimensions(sw,sh,mw,mh){
  const factor=Math.min(mw/sw,mh/sh);
  return {width:Math.max(1,Math.round(sw*factor)),height:Math.max(1,Math.round(sh*factor))};
}
async function jpegBytes(chain){
  const out=await chain.output({format:'image/jpeg',quality:93});
  const response=out.response();
  if(!response.ok)throw fault('product_compose_failed','Product artwork composition failed.',502);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length<100||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw fault('product_compose_invalid','Product artwork composition returned invalid image data.',502);
  return bytes;
}
export async function composeMugLayout(env,sourceBytes,sourceSize,area,rawDesign={},targetWidth=1600){
  if(!env.IMAGES?.input)throw fault('images_required','Image processing is not configured.',503);
  const design=normalizeProductDesign({product:'Mug'},rawDesign);
  const outWidth=Math.max(800,Math.round(targetWidth));
  const outHeight=Math.max(240,Math.round(outWidth*area.height/area.width));
  const stream=()=>new Blob([sourceBytes],{type:'image/jpeg'}).stream();
  if(design.layout==='wrap'){
    const chain=env.IMAGES.input(stream()).transform({width:outWidth,height:outHeight,fit:'cover'});
    return {bytes:await jpegBytes(chain),design,outputSize:{width:outWidth,height:outHeight}};
  }
  const background=env.IMAGES.input(stream()).transform({width:outWidth,height:outHeight,fit:'cover',blur:22});
  const add=(chain,center,maxWidth,maxHeight)=>{
    const factor=design.scale/100;
    const d=fitDimensions(sourceSize.width,sourceSize.height,outWidth*maxWidth*factor,outHeight*maxHeight*factor);
    const left=Math.round(Math.max(0,Math.min(outWidth-d.width,center*outWidth-d.width/2)));
    const top=Math.round((outHeight-d.height)/2);
    const overlay=env.IMAGES.input(stream()).transform({width:d.width,height:d.height,fit:'cover'});
    return chain.draw(overlay,{left,top});
  };
  let chain=background;
  if(design.layout==='two-sided'){
    chain=add(chain,0.24,0.29,0.90);
    chain=add(chain,0.76,0.29,0.90);
  }else{
    const center=design.x==='left'?0.25:design.x==='right'?0.75:0.5;
    chain=add(chain,center,0.43,0.92);
  }
  return {bytes:await jpegBytes(chain),design,outputSize:{width:outWidth,height:outHeight}};
}
