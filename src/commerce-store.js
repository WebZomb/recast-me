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
  const n=Number(raw.scale),scale=Math.round(Math.max(55,Math.min(115,Number.isFinite(n)?n:(mug?92:100))));
  return {version:1,layout,background:mug?'scene-fill':'none',x,scale};
}
export function productPrintfile(catalog,variantId,placement){
  const variant=catalog?.variant_printfiles?.find(v=>Number(v.variant_id)===Number(variantId));
  const file=catalog?.printfiles?.find(f=>Number(f.printfile_id)===Number(variant?.placements?.[placement]));
  if(!file||![file.width,file.height].every(n=>Number.isFinite(n)&&n>0))throw fault('print_area_missing','Printful print dimensions are unavailable for this variant.',502);
  return file;
}
