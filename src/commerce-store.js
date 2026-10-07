import {apparelEdgeMask,transparentCanvas,prepareApparelArtwork,pngOutput,sceneEdgeMask,scenePrintBox} from './apparel-finish.js';
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

export function recommendedProductDesign(map={}){
  const product=String(map?.product||'Generic');
  if(product==='Mug')return {layout:'two-sided',fill:'ambient',x:'center',scale:110,spacing:'standard'};
  if(product==='Tumbler')return {layout:'two-sided',fill:'ambient',x:'center',scale:108,spacing:'standard'};
  if(product==='Blanket')return {layout:'fit',fill:'ambient',x:'center',scale:92,spacing:'standard'};
  if(['Poster','Framed Poster','Canvas','Magnet 3-Pack','Coaster 4-Pack'].includes(product))return {layout:'cover',fill:'full-bleed',x:'center',scale:100,spacing:'standard'};
  return {layout:'fit',fill:'ambient',x:'center',scale:100,spacing:'standard'};
}
export function normalizeProductDesign(map,raw={}){
  const product=String(map?.product||'Generic'),recommended=recommendedProductDesign(map);
  const rawVersion=Number(raw?.version||0);
  if(rawVersion===6&&['Hoodie','T-Shirt'].includes(product)){
    const n=Number(raw.scale),scale=Math.round(Math.max(70,Math.min(100,Number.isFinite(n)?n:100)));
    return {version:6,layout:'fit',background:'transparent',fill:'transparent',x:['left','center','right'].includes(raw.x)?raw.x:'center',scale,spacing:'standard',product,finish:['soft','cutout','rectangle'].includes(raw.finish)?raw.finish:'soft'};
  }
  if(product==='Mug'&&rawVersion>0&&rawVersion<4){
    const layout=['single','two-sided','wrap'].includes(String(raw.layout))?String(raw.layout):'single';
    const x=['left','center','right'].includes(String(raw.x))?String(raw.x):'center';
    const n=Number(raw.scale),scale=Math.round(Math.max(55,Math.min(250,Number.isFinite(n)?n:92)));
    const spacing=['close','standard','wide'].includes(String(raw.spacing))?String(raw.spacing):'standard';
    return {version:rawVersion,layout,background:'scene-fill',x,scale,spacing};
  }
  const wrapProduct=['Mug','Tumbler'].includes(product);
  const flatProduct=['Blanket','Poster','Framed Poster','Canvas','Magnet 3-Pack','Coaster 4-Pack'].includes(product);
  const allowedLayout=wrapProduct?['single','two-sided','wrap','fit']:flatProduct?['cover','fit']:['fit','cover'];
  const requested=String(raw.layout||'');
  const layout=allowedLayout.includes(requested)?requested:recommended.layout;
  const x=['left','center','right'].includes(String(raw.x))?String(raw.x):recommended.x;
  const n=Number(raw.scale),scale=Math.round(Math.max(70,Math.min(140,Number.isFinite(n)?n:recommended.scale)));
  const spacing=wrapProduct&&['close','standard','wide'].includes(String(raw.spacing))?String(raw.spacing):recommended.spacing;
  const allowedFill=['full-bleed','ambient','dark','light'];
  const fill=allowedFill.includes(String(raw.fill))?String(raw.fill):(layout==='cover'||layout==='wrap'?'full-bleed':recommended.fill);
  const background=(layout==='cover'||layout==='wrap')?'full-bleed':fill;
  // Old v4 approvals keep their original composition. New apparel choices opt into v5.
  if(['Hoodie','T-Shirt'].includes(product)&&['cutout','soft','rectangle'].includes(raw.finish)&&(!rawVersion||rawVersion>=5)){
    const apparelScale=Math.min(raw.finish==='soft'?118:100,scale);
    return {version:5,layout:'fit',background:'transparent',fill:'transparent',x,scale:apparelScale,spacing,product,finish:raw.finish};
  }
  if(rawVersion===6)return {version:6,layout,background,fill,x,scale,spacing,product,...(['Poster','Framed Poster','Canvas'].includes(product)?{orientation:raw.orientation==='landscape'?'landscape':'portrait'}:{})};
  return {version:4,layout,background,fill,x,scale,spacing,product};
}
// Pillow front and back share one supplier-verified template and the same artwork.
// Older approved revisions retain their original single placement.
export function productPlacements(map,design={}){
  if(map.product==='Pillow'&&Number(design.version)>=6)return ['front','back'];
  return [map.preferredPlacement||'default'];
}
export function productionFiles(map,design,url,position){
  return productPlacements(map,design).map((placement,index)=>({type:index?placement:(map.orderFileType||'default'),url,position}));
}
export function productPrintfile(catalog,variantId,placement){
  const variant=catalog?.variant_printfiles?.find(v=>Number(v.variant_id)===Number(variantId));
  const file=catalog?.printfiles?.find(f=>Number(f.printfile_id)===Number(variant?.placements?.[placement]));
  const width=Number(file?.width),height=Number(file?.height);
  if(!file||![width,height].every(n=>Number.isFinite(n)&&n>0))throw fault('print_area_missing','Printful print dimensions are unavailable for this variant.',502);
  return {...file,width,height};
}

const MUG_BG_PNG=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,120,218,99,224,17,144,1,0,0,100,0,57,1,178,224,122,0,0,0,0,73,69,78,68,174,66,96,130]);
const LIGHT_BG_PNG=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4+vUHAAXFAuNCbvT6AAAAAElFTkSuQmCC'),c=>c.charCodeAt(0));
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
export async function composeProductLayout(env,sourceBytes,sourceSize,area,map={},rawDesign={},targetWidth=2400){
  if(!env.IMAGES?.input)throw fault('images_required','Image processing is not configured.',503);
  const design=normalizeProductDesign(map,rawDesign);
  const outWidth=Math.max(800,Math.round(targetWidth));
  const outHeight=Math.max(300,Math.round(outWidth*area.height/area.width));
  const stream=()=>new Blob([sourceBytes],{type:'image/jpeg'}).stream();

  if(design.version===6&&['Hoodie','T-Shirt'].includes(design.product)){
    const art=await prepareApparelArtwork(env,sourceBytes,design.finish);
    const info=await env.IMAGES.info(new Blob([art]).stream());
    const box=scenePrintBox(info.width,info.height,outWidth,outHeight,design.scale,design.x);
    let overlay=env.IMAGES.input(new Blob([art]).stream()).transform({width:box.width,height:box.height,fit:'squeeze',background:'rgba(0,0,0,0)'});
    if(design.finish==='soft'){
      const mask=await sceneEdgeMask(box.width,box.height);
      overlay=env.IMAGES.input(new Blob([mask],{type:'image/png'}).stream()).draw(overlay,{left:0,top:0,composite:'in'});
    }
    const canvas=await transparentCanvas(outWidth,outHeight);
    const chain=env.IMAGES.input(new Blob([canvas],{type:'image/png'}).stream()).draw(overlay,{left:box.left,top:box.top});
    return {bytes:await pngOutput(chain),mime:'image/png',design,outputSize:{width:outWidth,height:outHeight},artworkBox:box,method:'apparel-v6-'+design.finish};
  }
  if(design.version===5&&['Hoodie','T-Shirt'].includes(design.product)){
    const art=await prepareApparelArtwork(env,sourceBytes,design.finish);
    const info=await env.IMAGES.info(new Blob([art]).stream());
    if(![info.width,info.height].every(n=>Number.isFinite(n)&&n>0))throw fault('apparel_dimensions','Clothing artwork dimensions could not be verified.',503);
    const sizeFactor=Math.min(1.12,design.scale/100);
    const fitted=fitDimensions(info.width,info.height,outWidth*.96*sizeFactor,outHeight*.96*sizeFactor);
    const center=design.x==='left'?.30:design.x==='right'?.70:.50;
    const left=Math.round(Math.max(0,Math.min(outWidth-fitted.width,center*outWidth-fitted.width/2))),top=Math.round((outHeight-fitted.height)/2);
    let overlay=env.IMAGES.input(new Blob([art]).stream()).transform({width:fitted.width,height:fitted.height,fit:'squeeze',background:'rgba(0,0,0,0)'});
    if(design.finish==='soft'){
      const mask=await apparelEdgeMask(fitted.width,fitted.height);
      overlay=env.IMAGES.input(new Blob([mask],{type:'image/png'}).stream()).draw(overlay,{left:0,top:0,composite:'in'});
    }
    // A real transparent base fixes the full print-area geometry without a solid fill.
    const canvas=await transparentCanvas(outWidth,outHeight);
    const chain=env.IMAGES.input(new Blob([canvas],{type:'image/png'}).stream()).draw(overlay,{left,top});
    return {bytes:await pngOutput(chain),mime:'image/png',design,outputSize:{width:outWidth,height:outHeight},method:'apparel-v5-'+design.finish};
  }
  if(design.layout==='cover'||design.layout==='wrap'){
    const chain=env.IMAGES.input(stream()).transform({width:outWidth,height:outHeight,fit:'cover'});
    return {bytes:await jpegBytes(chain),design,outputSize:{width:outWidth,height:outHeight},method:'full-bleed-cover'};
  }
  if(['Mug','Tumbler'].includes(design.product)&&design.layout==='two-sided'){
    return composeMugLayout(env,sourceBytes,sourceSize,area,design,targetWidth);
  }

  // Preserve the whole portrait over a product-filling backdrop. This is used
  // only when a customer explicitly chooses a fit-style edit instead of the
  // product's recommended full-bleed crop.
  const baseBytes=design.fill==='light'?LIGHT_BG_PNG:MUG_BG_PNG;
  const baseBg=new Blob([baseBytes],{type:'image/png'}).stream();
  let chain=env.IMAGES.input(baseBg).transform({width:outWidth,height:outHeight,fit:'cover'});
  if(design.fill==='ambient'){
    const wash=env.IMAGES.input(stream()).transform({width:outWidth,height:outHeight,fit:'cover',blur:180,saturation:0.78,gamma:1.25});
    chain=chain.draw(wash,{left:0,top:0,opacity:0.58});
  }else if(design.fill==='full-bleed'){
    const wash=env.IMAGES.input(stream()).transform({width:outWidth,height:outHeight,fit:'cover',blur:42,saturation:0.92});
    chain=chain.draw(wash,{left:0,top:0,opacity:0.9});
  }

  const factor=design.scale/100;
  const fitted=fitDimensions(sourceSize.width,sourceSize.height,outWidth*0.92*factor,outHeight*0.92*factor);
  const center=design.x==='left'?0.30:design.x==='right'?0.70:0.50;
  const left=Math.round(Math.max(0,Math.min(outWidth-fitted.width,center*outWidth-fitted.width/2)));
  const top=Math.round((outHeight-fitted.height)/2);
  const overlay=env.IMAGES.input(stream()).transform({width:fitted.width,height:fitted.height,fit:'contain'});
  chain=chain.draw(overlay,{left,top});
  return {bytes:await jpegBytes(chain),design,outputSize:{width:outWidth,height:outHeight},method:'fit-over-fill'};
}

export async function composeMugLayout(env,sourceBytes,sourceSize,area,rawDesign={},targetWidth=1600){
  if(!env.IMAGES?.input)throw fault('images_required','Image processing is not configured.',503);
  const design=normalizeProductDesign({product:rawDesign?.product==='Tumbler'?'Tumbler':'Mug'},rawDesign);
  const outWidth=Math.max(800,Math.round(targetWidth));
  const outHeight=Math.max(240,Math.round(outWidth*area.height/area.width));
  const stream=()=>new Blob([sourceBytes],{type:'image/jpeg'}).stream();
  if(design.layout==='wrap'){
    const chain=env.IMAGES.input(stream()).transform({width:outWidth,height:outHeight,fit:'cover'});
    return {bytes:await jpegBytes(chain),design,outputSize:{width:outWidth,height:outHeight}};
  }

  // Use the artwork itself as a heavily blurred color field so the exposed band
  // feels like a natural continuation of the image instead of a flat black strip.
  let background=env.IMAGES.input(stream()).transform({
    width:outWidth,height:outHeight,fit:'cover',blur:280,saturation:0.88,gamma:1.18
  });
  const shade=env.IMAGES.input(new Blob([MUG_BG_PNG],{type:'image/png'}).stream()).transform({width:outWidth,height:outHeight,fit:'cover'});
  background=background.draw(shade,{left:0,top:0,opacity:0.12});

  const addFullHeight=(chain,center,maxWidth=0.42)=>{
    const factor=design.scale/100;
    const aspect=Math.max(0.2,Math.min(4,Number(sourceSize.width)/Number(sourceSize.height)));
    const naturalWidth=outHeight*aspect*factor;
    const slotWidth=Math.max(
      Math.round(outWidth*0.24),
      Math.min(Math.round(outWidth*maxWidth),Math.round(naturalWidth))
    );
    const left=Math.round(Math.max(0,Math.min(outWidth-slotWidth,center*outWidth-slotWidth/2)));
    const overlay=env.IMAGES.input(stream()).transform({width:slotWidth,height:outHeight,fit:'cover'});
    return chain.draw(overlay,{left,top:0});
  };

  let chain=background;
  if(design.layout==='two-sided'){
    const centers=design.spacing==='close'?[0.31,0.69]:design.spacing==='wide'?[0.20,0.80]:[0.25,0.75];
    chain=addFullHeight(chain,centers[0],0.42);
    chain=addFullHeight(chain,centers[1],0.42);
  }else{
    const center=design.x==='left'?0.25:design.x==='right'?0.75:0.5;
    chain=addFullHeight(chain,center,0.48);
  }
  return {bytes:await jpegBytes(chain),design,outputSize:{width:outWidth,height:outHeight}};
}
