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
