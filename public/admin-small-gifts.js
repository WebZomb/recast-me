import {attachGiftPublication} from './admin-small-gift-publication.js?v=2';
const $=s=>document.querySelector(s),key='recast_admin_token';
const initial='christmas-village-golden-retriever';
const suffixes=['-coaster-4pack','-magnet-3pack','-sticker-sheet-six'];
let generation=0,controller=null,selected=new URL(location.href).searchParams.get('design')||initial;
let progress=[];const urls=new Set();
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e;};
function removeImages(){for(const url of urls)URL.revokeObjectURL(url);urls.clear();$('#original-source').replaceChildren();$('#gift-reviews').replaceChildren();}
function lock(){generation++;controller?.abort();removeImages();sessionStorage.removeItem(key);$('#review-content').hidden=true;$('#review-login').hidden=false;$('#lock-review').hidden=true;$('#review-token').value='';$('#review-status').textContent='Private review locked. Signed images and print files were removed from this page.';}
function figure(src,title){const f=el('figure','review-image'),img=el('img');img.src=src;img.alt=title;img.referrerPolicy='no-referrer';img.decoding='async';f.append(img,el('figcaption',null,title));return f;}
function sourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='cdn.shopify.com'&&u.pathname.startsWith('/s/files/1/0854/3810/3796/files/')?u.href:null;}catch{return null;}}
function supplierUrl(value,requestId,sku){try{const u=new URL(value);return /^RC-[A-Z0-9-]+$/.test(requestId||'')&&u.origin===location.origin&&u.pathname.startsWith('/api/mockup/image/'+requestId+'/'+sku+'/')&&u.searchParams.get('token')?u.href:null;}catch{return null;}}
async function loadProgress(current,signal){
 try{
  const response=await fetch('/api/shop/gift-batch',{cache:'no-store',credentials:'omit',signal});
  if(!response.ok)return;
  const data=await response.json();if(current!==generation||!Array.isArray(data.designs))return;
  progress=data.designs.filter(d=>typeof d.id==='string'&&/^[a-z0-9-]+$/.test(d.id)&&Array.isArray(d.items));
  const picker=$('#gift-design-select');if(!picker)return;
  picker.replaceChildren();
  for(const design of progress){
   const live=design.items.filter(i=>i.checkoutEnabled===true).length;
   const ready=design.items.filter(i=>i.printFileReady&&!i.checkoutEnabled).length;
   const option=el('option',null,design.title+' · '+live+'/3 live'+(ready?' · '+ready+' to review':''));
   option.value=design.id;picker.append(option);
  }
  if(progress.some(d=>d.id===selected))picker.value=selected;
  $('#gift-batch-progress').textContent=String(data.published||0)+' of '+String(data.totalProducts||105)+' gifts published · '+String(data.readyForReview||0)+' ready for print review'+(data.needsReview?' · '+data.needsReview+' held for correction':'')+'. Preview preparation never publishes automatically.';
 }catch(error){if(error?.name!=='AbortError'&&current===generation&&$('#gift-batch-progress'))$('#gift-batch-progress').textContent='Progress summary unavailable. Existing reviewed products are unchanged.';}
}
async function load(){
 const token=sessionStorage.getItem(key)||'';
 if(!token){$('#review-content').hidden=true;$('#review-login').hidden=false;return;}
 const current=++generation,sourceId=selected;controller?.abort();controller=new AbortController();removeImages();
 const options={headers:{authorization:'Bearer '+token,'x-recast-request':'1'},credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal};
 $('#review-status').textContent='Verifying stored print-file integrity…';
 void loadProgress(current,options.signal);
 try{
  const endpoint='/api/shop/small-gift-review'+(sourceId===initial?'':'?design='+encodeURIComponent(sourceId));
  const response=await fetch(endpoint,options);
  if(response.status===401||response.status===403){lock();$('#review-status').textContent='Owner login was not accepted. Use the existing Control Center credentials.';return;}
  if(!response.ok)throw Error('The stored print-file comparison is unavailable.');
  const data=await response.json();if(current!==generation)return;
  if(data?.ok!==true||!Array.isArray(data.items)||(data.sourceDesign&&data.sourceDesign!==sourceId))throw Error('Invalid owner review response.');
  const requestId=data.sourceRequestId||(sourceId===initial?'RC-SHOP-GOLDEN-RETRIEVER-V1':'');
  const allowedIds=new Set(suffixes.map(suffix=>sourceId+suffix));
  $('#review-login').hidden=true;$('#review-content').hidden=false;$('#lock-review').hidden=false;$('#review-token').value='';
  const original=sourceUrl(data.originalArtwork);if(original)$('#original-source').append(figure(original,'Original approved Christmas pet artwork'));
  let ready=0;
  for(const item of data.items){
   if(current!==generation)return;
   if(!allowedIds.has(item.id))continue;
   const section=el('section','gift-review');section.dataset.giftId=item.id;
   section.append(el('h2',null,item.title||item.sku),el('p','availability',item.checkoutEnabled?'Published catalog offer':'Not published · review still required'));
   $('#gift-reviews').append(section);
   if(!item.cleanPrintUrl){section.append(el('p',null,'Print-file preparation: '+String(item.status||'not ready').replaceAll('_',' ')));continue;}
   try{
    const expected='/api/shop/small-gift-review/'+item.id+'/print';
    if(item.cleanPrintUrl!==expected||!/^image\/(png|jpeg)$/.test(item.mime||'')||!/^[a-f0-9]{64}$/.test(item.reviewSignature||''))throw Error('Unrecognized print-file reference.');
    const grid=el('div','review-grid');section.append(grid);
    for(const view of item.supplierPictures||[]){const url=supplierUrl(view.url,requestId,item.sku);if(url)grid.append(figure(url,'Printful · '+String(view.title||'Actual product preview')));}
    const file=await fetch(expected,options);if(!file.ok||!(file.headers.get('content-type')||'').startsWith(item.mime))throw Error('Native print-file verification failed.');
    const blob=await file.blob();if(current!==generation)return;
    if(blob.size<100||blob.size>20000000)throw Error('Unexpected print-file size.');
    const url=URL.createObjectURL(blob);urls.add(url);grid.append(figure(url,'Clean production file · '+item.printSize.width+' × '+item.printSize.height+' px · '+item.mime));
    const signature=el('code','review-signature',item.reviewSignature);signature.setAttribute('aria-label','Exact print and supplier review signature');
    section.append(el('p','review-note','This signature locks the supplier proof, clean print file and placement together. Reviewing the images alone does not publish a product.'),signature);
    await attachGiftPublication({item,section,blob,isCurrent:()=>current===generation,getToken:()=>sessionStorage.getItem(key)||'',signal:options.signal,lock});ready++;
   }catch(error){
    if(current!==generation||error?.name==='AbortError')return;
    section.append(el('p','review-error','This product’s native print file could not be verified. It cannot be published from this review; refresh to recheck.'));
   }
  }
  if(current===generation)$('#review-status').textContent=ready+' native print files available for private inspection. Only an explicit Publish reviewed design confirmation changes product availability.';
 }catch(error){if(current!==generation||error?.name==='AbortError')return;removeImages();$('#review-status').textContent='Review unavailable. Refresh to check product status; no automatic publication or printing was requested.';}
}
$('#review-login-form').addEventListener('submit',e=>{e.preventDefault();const token=$('#review-token').value.trim();if(token){sessionStorage.setItem(key,token);load();}});
$('#lock-review').addEventListener('click',lock);$('#refresh-review').addEventListener('click',load);
$('#gift-design-select')?.addEventListener('change',event=>{selected=event.target.value;const url=new URL(location.href);url.searchParams.set('design',selected);history.replaceState(null,'',url);load();});
$('#gift-next-ready')?.addEventListener('click',()=>{const other=progress.find(d=>d.id!==selected&&d.items.some(i=>i.printFileReady&&!i.checkoutEnabled));if(other){selected=other.id;$('#gift-design-select').value=selected;load();}else $('#review-status').textContent='No other finished print files are awaiting review in this snapshot. Refresh to check preparation.';});
window.addEventListener('pagehide',()=>{generation++;controller?.abort();removeImages();});
load();
