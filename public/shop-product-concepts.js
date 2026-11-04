// Product-shaped marketing CONCEPTS only. Never a Printful proof or print file.
// Every pictured pet stays anchored to its exact, owner-approved source revision.
const validSlugs=new Set([
 'blankets','pillows','canvas','tumblers','hoodies','t-shirts','tote-bags','phone-cases',
 'sticker-sheets','stickers','posters','framed-prints','journals','coaster-sets','magnet-sets','puzzles'
]);
const blanketSizes=Object.freeze({'50 × 60 in':5/6,'60 × 80 in':3/4});
const validSource=url=>{
 try{
  const parsed=new URL(url);
  return parsed.protocol==='https:'&&parsed.hostname==='cdn.shopify.com'&&
    parsed.pathname.startsWith('/s/files/1/0854/3810/3796/files/')&&
    /\.(png|jpe?g|webp)$/i.test(parsed.pathname)?parsed:null;
 }catch{return null;}
};
export function previewImageUrl(source,width=640){
 const parsed=validSource(source);
 if(!parsed)return null;
 const px=Math.max(160,Math.min(1200,Number(width)||640));
 parsed.searchParams.set('width',String(Math.round(px)));
 return parsed.href;
}
export function blanketPreviewRatio(size){
 return blanketSizes[size]||blanketSizes['50 × 60 in'];
}
export function conceptStyle(slug){return validSlugs.has(slug)?slug:'blankets';}
export function conceptSizeOptions(slug,sizes=[]){
 if(slug==='blankets')return sizes.filter(s=>Object.hasOwn(blanketSizes,s));
 return [];
}
function el(tag,className,text){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=text;
 return node;
}
export function createProductConcept(design,{slug='blankets',size='50 × 60 in',large=false}={}){
 const source=previewImageUrl(design?.artworkImage,large?1000:640);
 if(!source)throw new TypeError('An original approved pet illustration is required for this preview.');
 const type=conceptStyle(slug);
 const root=el('div','collection-preview collection-preview--'+type+(type==='blankets'?' collection-preview--blanket':''));
 root.dataset.previewKind='illustration';
 root.dataset.sourceDesign=design.designId;
 root.dataset.artworkRevision=design.artworkRevision;
 root.title='Illustrative product concept — not a real Printful mockup';
 root.style.setProperty('--recast-art','url("'+source+'")');
 if(type==='blankets'){
  root.style.setProperty('--recast-blanket-ratio',String(blanketPreviewRatio(size)));
  root.dataset.previewSize=size;
 }
 const artwork=el('div','collection-artwork');
 const img=el('img');
 img.src=source;
 img.width=large?1000:640;img.height=large?1000:640;
 img.loading=large?'eager':'lazy';
 img.decoding='async';
 img.alt=design.breed+' — original Christmas pet illustration in a conceptual '+type.replaceAll('-',' ')+' layout (not a supplier proof)';
 artwork.append(img);
 root.append(artwork);
 if(type==='blankets')root.append(el('span','collection-hem'));
 root.append(el('span','collection-preview-label','Design concept · not a print proof'));
 return root;
}
