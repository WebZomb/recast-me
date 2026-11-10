// Show real stages rather than an invented percentage for remote availability checks.
export function shopLoading(root){
 const label=root.querySelector('[data-loading-label]'),bar=root.querySelector('progress'),retry=root.querySelector('button');
 let timer;
 return {
  start(onRetry){clearTimeout(timer);root.hidden=false;bar.hidden=false;retry.hidden=true;root.setAttribute('aria-busy','true');label.textContent='Loading Christmas gifts…';retry.onclick=onRetry;
   timer=setTimeout(()=>{label.textContent='Still checking current prices. You can browse the designs while we finish.';},8000);},
  finish(){clearTimeout(timer);root.hidden=true;root.setAttribute('aria-busy','false');},
  fail(onRetry){clearTimeout(timer);root.hidden=false;bar.hidden=true;retry.hidden=false;root.setAttribute('aria-busy','false');label.textContent='We couldn’t check availability. Your designs are here; try again to see prices and buying options.';retry.onclick=onRetry;}
 };
}
export async function readShopCatalog(url){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
 try{
  const response=await fetch(url,{cache:'no-store',signal:controller.signal});
  const data=await response.json();
  if(!response.ok||data.ok===false||data.version!==1||!Array.isArray(data.offers))throw Error('Catalog unavailable');
  return data;
 }finally{clearTimeout(timer);}
}
// Shopify's image CDN can deliver appropriately sized browsing images.
// Keep the original URL for product detail and actual supplier proofs.
export function browsingImage(url){
 try{const parsed=new URL(url,'https://recastmeai.com');if(parsed.hostname==='cdn.shopify.com'&&parsed.pathname.includes('/files/')){parsed.searchParams.set('width','640');return parsed.href;}}catch{}
 return url;
}

export function trackImage(img){
 img.dataset.loading='true';
 const done=()=>{delete img.dataset.loading;};
 img.addEventListener('load',done);img.addEventListener('error',done);
 return img;
}

export async function readShopGallery(){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch('/shop-gallery.json',{cache:'no-cache',signal:controller.signal});return response.ok?await response.json():null;}
 catch{return null;}finally{clearTimeout(timer);}
}
