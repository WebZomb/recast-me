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
  const rows=new Uint8Array((width+1)*height),edgeX=Math.max(1,width*.24),edgeY=Math.max(1,height*.24);
  // Broad elliptical dissolve: the center remains fully intact while corners and sides
  // break up gradually, avoiding the visible rectangular print boundary.
  const dot=Math.max(3,Math.round(width/210));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const dxEdge=Math.min(x,width-1-x)/edgeX,dyEdge=Math.min(y,height-1-y)/edgeY;
    const t=Math.min(1,Math.max(0,Math.min(dxEdge,dyEdge)));
    const coverage=t*t*(3-2*t);
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

// RM055 / v6 only. Never call this for saved v5 approvals.
// 100% fills the usable print area, not an arbitrary percentage of a model's shirt.
export function scenePrintBox(sw,sh,width,height,scale=100,position='center'){
  if(![sw,sh,width,height,scale].every(n=>Number.isFinite(n)&&n>0))throw fail('apparel_dimensions','Clothing print dimensions are invalid.');
  const factor=Math.min(width*.98/sw,height*.94/sh)*Math.min(1,Math.max(.70,scale/100));
  const w=Math.max(1,Math.round(sw*factor)),h=Math.max(1,Math.round(sh*factor));
  const center=position==='left'?.30:position==='right'?.70:.50;
  return {width:w,height:h,left:Math.round(Math.max(0,Math.min(width-w,width*center-w/2))),top:Math.round(Math.min(height-h,height*.04))};
}
// Rounded, gently irregular silhouette with a sharp central scene and opaque ink
// dots / transparent gaps. No low-opacity gray haze or black rectangle is printed.
export async function sceneEdgeMask(width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width*height>24000000)throw fail('apparel_dimensions','Clothing print dimensions are invalid.');
  const rows=new Uint8Array((width+1)*height),cell=Math.max(1,Math.round(width/1800));
  const bayer=[0,48,12,60,3,51,15,63,32,16,44,28,35,19,47,31,8,56,4,52,11,59,7,55,40,24,36,20,43,27,39,23,2,50,14,62,1,49,13,61,34,18,46,30,33,17,45,29,10,58,6,54,9,57,5,53,42,26,38,22,41,25,37,21];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const nx=(x/(width-1)-.5)*2,ny=(y/(height-1)-.5)*2;
    const radius=Math.pow(Math.pow(Math.abs(nx),4)+Math.pow(Math.abs(ny),4),.25);
    const ripple=.015*Math.sin(nx*31+ny*17)+.010*Math.sin(ny*47-nx*13);
    const t=Math.min(1,Math.max(0,(.985-radius+ripple)/.235));
    const coverage=t*t*(3-2*t),threshold=(bayer[(Math.floor(y/cell)%8)*8+Math.floor(x/cell)%8]+.5)/64;
    const rim=x===0||y===0||x===width-1||y===height-1;
    rows[y*(width+1)+x+1]=!rim&&coverage>threshold?255:0;
  }
  const compressed=new Uint8Array(await new Response(new Blob([rows]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const header=new Uint8Array(13),v=new DataView(header.buffer);v.setUint32(0,width);v.setUint32(4,height);header[8]=8;
  return join([new Uint8Array(PNG),chunk('IHDR',header),chunk('tRNS',new Uint8Array([0,0])),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())]);
}
