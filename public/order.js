const params=new URLSearchParams(location.search),requestId=params.get('requestId')||'',token=params.get('token')||'';
const card=document.querySelector('#order-card');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let jobs=[];
function versions(){try{return JSON.parse(localStorage.getItem('recast_recent_versions_v12')||'[]').filter(v=>v?.requestId&&v?.accessToken).slice(0,4)}catch{return[]}}
async function api(url,body){const r=await fetch(url,body?{method:'POST',headers:{'content-type':'application/json','x-recast-request':'1'},body:JSON.stringify(body)}:undefined);const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(d.userMessage||d.error||'We could not complete that update.');return d}
function message(text){document.querySelector('#order-message').textContent=text}
function designSummary(design){
 if(!design)return '';
 const layout=design.layout==='two-sided'?'Same image on both sides':design.layout==='wrap'?'Full wrap':'One image';
 const spacing=design.layout==='two-sided'?(design.spacing==='close'?'Closer together':design.spacing==='wide'?'Farther apart':'Standard'):null;
 return [layout,design.x?design.x[0].toUpperCase()+design.x.slice(1):null,design.scale?`${design.scale}%`:null,spacing].filter(Boolean).join(' · ');
}
function orderStatusLabel(j){
 const status=String(j.status||'').toLowerCase();
 if(status==='design_confirmed')return 'Design confirmed — preparing your print file';
 if(status==='ready_for_printful_draft')return 'Print file ready — preparing production';
 if(status==='printful_draft_ready')return 'Production order prepared';
 if(status==='submitted_to_printful'||status==='in_printful_production')return 'In production';
 if(status==='shipped')return 'Shipped';
 if(status==='auto_print_review'||status==='owner_release_review'||status==='printful_failed')return 'Paused for a production check';
 if(status==='payment_hold')return 'Payment needs review';
 if(status==='awaiting_customer_approval')return 'Design approval needed';
 if(status==='product_layout_review')return 'Product preview needs review';
 if(status==='digital_fulfillment_pending')return 'Preparing your digital download';
 if(status==='digital_ready')return 'Digital download ready';
 if(status==='on_hold')return 'Order paused for review';
 return status?'Order being prepared':'Checking order status';
}
function designCard(j){
 if(j.digital)return '';
 const d=j.design,locked=Boolean(d?.approvedAt||j.printfulStatus),saved=versions();
 const image=`/api/order-design/${encodeURIComponent(j.id)}/preview?token=${encodeURIComponent(token)}`;
 const savedAngles=(j.approvedPreviewImages?.length?j.approvedPreviewImages:(j.approvedPreviewImage?[{title:'Product preview',url:j.approvedPreviewImage}]:[])).slice(0,3);
 const approvedSnapshot=savedAngles.length?`<div class="approved-checkout-preview"><div class="eyebrow">SAVED WITH YOUR ORDER</div><h4>Your checkout product previews</h4><div class="approved-angle-grid">${savedAngles.map((v,i)=>`<figure><img src="${esc(v.url)}" alt="${esc(v.title||`Product preview ${i+1}`)}"><figcaption>${esc(v.title||`View ${i+1}`)}</figcaption></figure>`).join('')}</div><p>These are the product mockups saved when checkout opened. ${esc(designSummary(j.productDesign))}</p><a class="button ghost" href="${esc(j.approvedPreviewUrl||savedAngles[0].url)}">Open all approved preview angles</a></div>`:'';
 return `<div class="design-panel">${approvedSnapshot}<h3>${locked?(j.preapprovedCheckout?'Design confirmed at checkout':'Your approved design'):'Make it yours before it prints'}</h3>
 <img class="design-art" src="${esc(image)}" alt="Selected artwork with Recast Me preview watermark">
 <p>Artwork: ${esc(d?.selectedRequestId||requestId)}</p>
 ${locked?(j.preapprovedCheckout?'<p><strong>You’re done.</strong> This exact design was confirmed before payment. No extra approval is needed; Recast handles the print workflow automatically.</p>':'<p><strong>Design locked.</strong> Your artwork is approved for printing. Changes are closed; our final fulfillment check comes next.</p>'):`
 <p>Your order waits for you. Try your bonus previews, choose your favorite, then review it on your product. Nothing is sent to print because a timer runs out.</p>
 <label>Choose from your recent versions<select data-select="${esc(j.id)}"><option value="">Choose a saved version…</option>${saved.map((v,i)=>`<option value="${i}">${esc(v.styleName||v.style||'Recast')} · ${esc(v.requestId)}</option>`).join('')}</select></label>
 <button class="button ghost" data-action="swap" data-job="${esc(j.id)}">Use selected artwork</button>
 <button class="button ghost" data-action="proof" data-job="${esc(j.id)}">${d?.proof?'Refresh product preview':'Prepare / check product preview'}</button>
 <div class="product-proofs">${(d?.proof?.images||[]).map(i=>`<figure><img src="${esc(i.url)}" alt="${esc(i.title||'Product preview')}"><figcaption>${esc(i.title||'Product preview')}</figcaption></figure>`).join('')}</div>
 ${d?.proof?`<p>Review the crop and placement above. The watermark is removed for printing. We enlarge this same image without AI inventing new details. Colors and scale can vary on the physical product.</p>
 <label class="approval-check"><input type="checkbox" data-consent="${esc(j.id)}"> I checked this design and product preview. I understand I cannot swap it after approval.</label>
 <button class="button primary" data-action="approve" data-job="${esc(j.id)}" disabled>Approve this design for printing</button>`:'<p>Approval becomes available after your product preview is ready.</p>'}`}</div>`;
}
async function load(){
 if(!requestId||!token){card.innerHTML='<p>Open the private order link saved with your artwork.</p>';return}
 try{
  const d=await api(`/api/order-status?requestId=${encodeURIComponent(requestId)}&token=${encodeURIComponent(token)}`);jobs=d.jobs||[];
  document.querySelector('#order-title').textContent=d.request.paid?'Your next favorite thing.':'Your Recast is saved.';
  document.querySelector('#order-subtitle').textContent=`Artwork ID: ${requestId}`;
  card.innerHTML=`<div id="order-message" role="status" aria-live="polite"></div><div class="order-state"><strong>${d.request.paid?'Order detected':'Waiting for a paid order'}</strong><span>${esc(d.request.orderName||'Artwork saved')}</span></div>
  ${d.creditsEnabled&&jobs.length?'<div class="download-box"><h3>Keep creating</h3><p id="credit-status">Each eligible paid order adds five previews, once per order. Failed previews restore your credit.</p><button id="check-bonus" class="button ghost">Check my purchase credits</button><a id="create-more" class="button primary" href="/#start">Try another idea →</a></div>':''}
  <div class="order-items">${jobs.length?jobs.map(j=>`<article class="order-item"><h2>${esc(j.product)}</h2><p>Status: ${esc(orderStatusLabel(j))}${j.printfulStatus?` · ${esc(j.printfulStatus)}`:''}</p>${designCard(j)}</article>`).join(''):'<p>After payment is verified, your order will appear here automatically.</p>'}</div>
  ${d.request.digitalEntitlement?`<div class="download-box"><h3>Your digital artwork</h3><a class="button primary" href="/api/digital-download/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}">Download purchased artwork</a></div>`:''}
  <p class="order-note">Keep this private order link. It gives access to this artwork and its orders.</p>${!d.request.paid?'<button id="delete-recast" class="delete-recast">Delete this unpaid Recast</button>':''}`;
  card.querySelectorAll('[data-consent]').forEach(el=>el.onchange=()=>{card.querySelector(`[data-action="approve"][data-job="${CSS.escape(el.dataset.consent)}"]`).disabled=!el.checked});
  card.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>act(el));
  const more=document.querySelector('#create-more');if(more)more.onclick=()=>{try{sessionStorage.setItem('recast_order_return',location.pathname+location.search)}catch{}};
  const bonus=document.querySelector('#check-bonus');if(bonus)bonus.onclick=async()=>{
   bonus.disabled=true;
   try{await api('/api/render-credits',{});for(const order of new Map(jobs.map(j=>[j.orderName,j])).values())await api(`/api/order-bonus/${encodeURIComponent(order.id)}`,{token});const b=await api('/api/render-credits');document.querySelector('#credit-status').textContent=`${b.remaining} previews remaining (${b.bonus} purchase bonus).`;message('Your preview balance is up to date.')}catch(e){message(e.message)}finally{bonus.disabled=false}
  };
  const del=document.querySelector('#delete-recast');if(del)del.onclick=deleteRecast;
 }catch(e){card.innerHTML=`<p>${esc(e.message)}</p>`}
}
async function act(button){
 const j=jobs.find(j=>j.id===button.dataset.job),action=button.dataset.action;
 const body={token,revision:j.design.revision};
 if(action==='swap'){
  const value=card.querySelector(`[data-select="${CSS.escape(j.id)}"]`).value;
  const selected=value!==''?versions()[Number(value)]:null;
  if(!selected){message('Choose a saved version first.');return}
  body.selectedRequestId=selected.requestId;body.selectedAccessToken=selected.accessToken;
 }
 if(action==='approve')body.confirm='APPROVE_FOR_PRINT';
 button.disabled=true;message(action==='proof'?'Preparing your product preview…':'Saving your choice…');
 try{const d=await api(`/api/order-design/${encodeURIComponent(j.id)}/${action}`,body);await load();message(d.status==='pending'?'Your product preview is being prepared. Check it again shortly.':action==='approve'?'Approved. Your design is locked for printing.':action==='swap'?'Artwork updated. Review a new product preview before approving.':'Your product preview is ready to review.')}
 catch(e){message(e.message);button.disabled=false}
}
async function deleteRecast(){
 if(!confirm('Delete this unpaid Recast and its private uploads? This cannot be undone.'))return;
 try{const r=await fetch(`/api/recast/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}`,{method:'DELETE'});const d=await r.json();if(!r.ok)throw Error(d.error||'Delete failed.');localStorage.removeItem('recast_last_request');card.innerHTML='<p>Recast deleted.</p>'}catch(e){message(e.message)}
}
load();
