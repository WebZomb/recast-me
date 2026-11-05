// No action on load: only a checked visual review plus explicit publish click.
// Authorization is sent solely to the same-origin owner action, never images.
const endpoint='/api/admin/small-gifts/publish';
const confirmation='PUBLISH_THIS_REVIEWED_PRINT_FILE';
const storePaths=Object.freeze({
 'christmas-village-golden-retriever-coaster-4pack':'/shop-coaster-sets',
 'christmas-village-golden-retriever-magnet-3pack':'/shop-magnet-sets',
 'christmas-village-golden-retriever-sticker-sheet-six':'/shop-sticker-sheets'
});
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;};
const validHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
async function loaded(image){
 if(image.complete&&image.naturalWidth>0)return;
 if(typeof image.decode==='function'){await image.decode();return;}
 await new Promise((resolve,reject)=>{image.addEventListener('load',resolve,{once:true});image.addEventListener('error',()=>reject(Error('image')), {once:true});});
 if(!image.naturalWidth)throw Error('image');
}
export async function attachGiftPublication({item,section,blob,isCurrent,getToken,signal,lock}){
 if(!Object.hasOwn(storePaths,item.id)||!isCurrent())return;
 const panel=el('div','gift-publication'),status=el('p','publication-status');status.setAttribute('role','status');
 panel.append(status);section.append(panel);
 const linkToShop=()=>{const link=el('a','published-store-link','View this product collection');link.href=storePaths[item.id];panel.append(link);};
 if(item.checkoutEnabled){status.textContent='Published · customers can select this design in its collection.';linkToShop();return;}
 const label=el('label','publication-review-check'),box=el('input');box.type='checkbox';box.disabled=true;
 label.append(box,el('span',null,'I inspected the original, every Printful product view and the clean print file. The subject, placement, crop and print details are correct.'));
 const button=el('button','publish-reviewed-gift','Publish reviewed design');button.type='button';button.disabled=true;
 panel.append(label,button,el('p','review-note','Publishing enables Add to Cart for this exact finished design at the current Shopify price. It does not charge anyone or send a printing order.'));
 status.textContent='Waiting for all review images and native-file integrity checks…';
 let prepared=false,inFlight=false;
 const current=()=>isCurrent()&&!signal?.aborted;
 try{
  if(!validHash(item.printFileHash)||!validHash(item.sourceRevision)||!validHash(item.reviewSignature))throw Error('hash');
  const images=[document.querySelector('#original-source img'),...section.querySelectorAll('.review-grid img')];
  if(images.some(image=>!image)||images.length<3||(item.supplierPictures||[]).length<1)throw Error('images');
  const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
  const actual=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
  if(actual!==item.printFileHash)throw Error('hash');
  await Promise.all(images.map(loaded));
  if(!current())return;
  prepared=true;box.disabled=false;status.textContent='Files verified and images loaded. Inspect the images, then confirm below.';
 }catch{
  if(current())status.textContent='Review images or print-file integrity could not be verified. Refresh before publishing; this design stays unavailable.';
 }
 box.addEventListener('change',()=>{button.disabled=!prepared||!box.checked||inFlight||!current();});
 button.addEventListener('click',async()=>{
  if(!prepared||!box.checked||inFlight||!current())return;
  const token=getToken();if(!token){lock();return;}
  if(!window.confirm('Publish '+String(item.title||'this reviewed design')+' so customers can add it to their cart? This does not place a paid order or submit production.'))return;
  inFlight=true;button.disabled=true;box.disabled=true;button.textContent='Publishing…';status.textContent='Rechecking the exact print file, supplier proof and current Shopify product…';
  try{
   const response=await fetch(endpoint,{method:'POST',credentials:'omit',cache:'no-store',redirect:'error',signal,
    headers:{authorization:'Bearer '+token,'x-recast-request':'1','content-type':'application/json'},
    body:JSON.stringify({id:item.id,reviewSignature:item.reviewSignature,printFileHash:item.printFileHash,sourceRevision:item.sourceRevision,confirm:confirmation})});
   if(!current())return;
   if(response.status===401||response.status===403){lock();return;}
   const data=await response.json();
   if(!response.ok||data.ok!==true||data.published!==true||data.id!==item.id||data.storePath!==storePaths[item.id]){
    status.textContent='Publication was not confirmed. Refresh the review and storefront status before another attempt. No paid production was requested.';button.textContent='Refresh to check status';return;
   }
   section.querySelector('.availability').textContent='Published · Add to Cart enabled for this exact design';
   status.textContent=data.alreadyPublished?'This exact design was already published; no duplicate product was added.':'Published. The collection can now offer this exact design for purchase.';
   button.textContent='Published';label.hidden=true;linkToShop();
  }catch{
   if(current()){status.textContent='The publication response was interrupted. Refresh to check whether it completed before retrying. No payment or production request was sent.';button.textContent='Refresh to check status';}
  }
 });
}
