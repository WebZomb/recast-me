/* RM052: immutable subject cutouts and print-safe transparent edge treatment.
 * Only Cloudflare Images is used. No new provider, source URL or model is exposed.
 */
const PNG=[137,80,78,71,13,10,26,10];
const fail=(code,message,status=503)=>Object.assign(new Error(message),{code,status,renderControl:true});
const sha=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');
export const isPng=bytes=>bytes?.length>32&&PNG.every((v,i)=>bytes[i]===v);
export async function pngOutput(chain){
  const out=await chain.output({format:'image/png'}),response=out.response();
  if(!response.ok)throw fail('apparel_finish_failed','The clothing artwork could not be prepared. Your original is saved.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(!isPng(bytes)||bytes.length>20000000)throw fail('apparel_finish_invalid','A transparent print file could not be verified.');
  return bytes;
}
export async function prepareApparelArtwork(env,bytes,finish,{allowCreate=false}={}){
  if(finish!=='cutout')return bytes;
  if(!env.ARTWORK||!env.IMAGES?.input)throw fail('apparel_finish_unavailable','Background removal is temporarily unavailable. Use Soft-edge photo in Edit design.');
  const originalHash=await sha(bytes),key=`commerce/apparel-cutouts/v1/${originalHash}.png`;
  const existing=await env.ARTWORK.get(key);
  if(existing){
    const result=new Uint8Array(await existing.arrayBuffer());
    if(!isPng(result)||existing.customMetadata?.sha256!==await sha(result))throw fail('apparel_integrity','Saved clothing artwork needs a new review.');
    return result;
  }
  if(!allowCreate)throw fail('apparel_preview_required','Prepare and review the clothing preview again before printing.');
  // One bounded attempt per source. A timeout is not silently retried at payment.
  const claimed=await env.ARTWORK.put(`${key}.claim`,'started',{onlyIf:new Headers({'If-None-Match':'*'})});
  if(!claimed)throw fail('apparel_finish_pending','Background removal is still processing or needs review. Try Soft-edge photo in Edit design.',409);
  try{
    const result=await pngOutput(env.IMAGES.input(new Blob([bytes]).stream()).transform({width:2048,height:2048,fit:'scale-down',segment:'foreground',background:'rgba(0,0,0,0)'}));
    await env.ARTWORK.put(key,result,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'image/png'},customMetadata:{sha256:await sha(result),originalHash,finishVersion:'1'}});
    return result;
  }catch(cause){
    // Leave the conservative claim; never generate a different cutout at fulfillment.
    throw fail('apparel_finish_unavailable','Background removal could not finish. Your original is saved. Choose Soft-edge photo in Edit design.');
  }
}
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0}
function chunk(type,data){const out=new Uint8Array(data.length+12),view=new DataView(out.buffer);view.setUint32(0,data.length);out.set(new TextEncoder().encode(type),4);out.set(data,8);view.setUint32(out.length-4,crc(out.subarray(4,out.length-4)));return out}
function join(parts){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
// Opaque dots / genuinely transparent gaps. No low-opacity gray rectangle.
export async function apparelEdgeMask(width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>24000000)throw fail('apparel_dimensions','Clothing print dimensions are invalid.');
  const rows=new Uint8Array((width+1)*height),edge=Math.max(1,Math.min(width,height)*.18);
  const dot=Math.max(3,Math.round(width/190));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const distance=Math.min(x,y,width-1-x,height-1-y),t=Math.min(1,Math.max(0,distance/edge)),coverage=t*t*(3-2*t);
    const dx=((x+.5)%dot)/dot-.5,dy=((y+.5)%dot)/dot-.5;
    rows[y*(width+1)+x+1]=coverage>=1||coverage>0&&dx*dx+dy*dy<coverage*.5?255:0;
  }
  const compressed=new Uint8Array(await new Response(new Blob([rows]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const header=new Uint8Array(13),v=new DataView(header.buffer);v.setUint32(0,width);v.setUint32(4,height);header[8]=8; // grayscale; 0 made transparent by tRNS
  return join([new Uint8Array(PNG),chunk('IHDR',header),chunk('tRNS',new Uint8Array([0,0])),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())]);
}

export async function transparentCanvas(width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>24000000)throw fail('apparel_dimensions','Clothing print dimensions are invalid.');
  const rows=new Uint8Array((width+1)*height);
  const compressed=new Uint8Array(await new Response(new Blob([rows]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const header=new Uint8Array(13),view=new DataView(header.buffer);view.setUint32(0,width);view.setUint32(4,height);header[8]=8;
  return join([new Uint8Array(PNG),chunk('IHDR',header),chunk('tRNS',new Uint8Array([0,0])),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())]);
}
