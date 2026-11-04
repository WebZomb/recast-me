// Owner-only, read-only proof gallery for one premade Christmas magnet canary.
// Never accepts approval or checkout actions; images are real saved Printful
// mockups, not our decorative sales illustrations.
export function initMagnetReview(api){
 const status=document.getElementById('magnet-proof-status');
 const grid=document.getElementById('magnet-proof-grid');
 const button=document.getElementById('magnet-proof-refresh');
 if(!status||!grid||!button)return {load:async()=>{},clear:()=>{}};
 const node=(tag,cls,text)=>{
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(text!==undefined)e.textContent=text;
  return e;
 };
 function figure(url,title,caption){
  const fig=node('figure','magnet-proof-card');
  const img=node('img');
  img.src=url;img.alt=title;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
  const cap=node('figcaption',null,caption);
  fig.append(img,cap);return fig;
 }
 function cleanProofUrl(url){
  try{
   const u=new URL(url);
   if(u.origin!==location.origin||!u.pathname.startsWith('/api/mockup/image/')||!u.searchParams.get('token'))return null;
   return u.href;
  }catch{return null;}
 }
 function cleanSourceUrl(url){
  try{
   const u=new URL(url);
   if(u.protocol!=='https:'||u.hostname!=='cdn.shopify.com'||!u.pathname.startsWith('/s/files/1/0854/3810/3796/files/'))return null;
   return u.href;
  }catch{return null;}
 }
 let sequence=0;
 async function load(){
  const seq=++sequence;
  grid.replaceChildren();
  status.textContent='Checking supplier preview status…';
  try{
   const snapshot=await api('/api/shop/magnet-pilot');
   if(seq!==sequence)return;
   if(snapshot.status!=='ready_for_review'){
    const text={
     not_started:'Supplier preview not started.',
     pending_preview:'Printful is preparing the real magnet pictures. Nothing is for sale yet.',
     rate_limited:'Waiting for the shared Printful preview rate window.',
     needs_review:'Supplier preparation needs reconciliation before another attempt.',
     awaiting_template_audit:'Waiting for Printful\'s exact magnet print-area check before requesting a supplier preview.',
     creating_preview:'Task result needs manual reconciliation; no duplicate has been sent.'
    }[snapshot.status]||'Waiting for a completed manufacturer preview.';
    status.textContent=text+' No sales or production were started.';
    return;
   }
   const [proof,gallery]=await Promise.all([
    api('/api/shop/magnet-pilot/qa'),
    fetch('/shop-gallery.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
   ]);
   if(seq!==sequence)return;
   const original=Array.isArray(gallery?.designs)?gallery.designs.find(d=>d.designId===proof.designId&&d.artworkRevision===proof.artworkRevision):null;
   const originalUrl=cleanSourceUrl(original?.artworkImage);
   if(originalUrl)grid.append(figure(originalUrl,'Original approved Golden Retriever Christmas Village artwork','Original artwork · inspect subject, pose and colors'));
   let count=0;
   for(const view of proof.supplierPictures||[]){
    const url=cleanProofUrl(view.url);
    if(!url)continue;
    grid.append(figure(url,'Actual Printful magnet preview: '+String(view.title||''),'Printful · '+String(view.title||'Supplier view')));
    count++;
   }
   if(!count)throw new Error('The saved supplier pictures are not available for review.');
   status.textContent=count+' real Printful magnet views received. Compare every view with the original. This item is NOT approved for sale or printing.';
  }catch(e){
   if(seq!==sequence)return;
   status.textContent='Proof review unavailable: '+String(e?.message||'try refreshing').slice(0,160)+'. No change was made to product availability.';
   grid.replaceChildren();
  }
 }
 function clear(){
  sequence++;
  grid.replaceChildren();
  status.textContent='Unlock the Control Center to inspect saved supplier previews.';
 }
 button.addEventListener('click',()=>{load()});
 return {load,clear};
}
