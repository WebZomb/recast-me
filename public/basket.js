const ID='recast_basket_id_v1',PENDING='recast_basket_pending_v1';
let basket=null,basketId=null,pending=null,enabled=false,busy=false,panel=null,status=null,list=null,initializing=null;
const EDIT_LIMIT='Your basket has reached its edit limit. Your items are saved. You can check out as shown or contact support to change them.';
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
async function api(path,body){
 const r=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',headers:{'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await r.json();if(!r.ok||!data.ok){const e=Error(data.error||'Your cart is temporarily unavailable.');e.code=data.code;throw e;}return data;
}
function identify(){
 try{basketId=localStorage.getItem(ID);if(!basketId){basketId=crypto.randomUUID();localStorage.setItem(ID,basketId);}pending=JSON.parse(localStorage.getItem(PENDING)||'null');}
 catch{throw Error('This browser could not recover your saved cart. Allow website storage and refresh before adding an item.');}
}
function button(text,action){const el=node('button',text);el.type='button';el.className='button ghost';el.onclick=action;return el;}
function savePending(value){localStorage.setItem(PENDING,JSON.stringify(value));pending=value;}
async function refresh(){
 basket=(await api('/api/basket?id='+encodeURIComponent(basketId))).basket;
 if(pending&&basket.appliedActions.includes(pending.command.actionId))savePending(null);
 render();return basket;
}
async function run(action){
 if(busy)return;ensurePanel();busy=true;status.textContent='Saving your cart…';render();
 try{await action();status.textContent='Your cart is saved.';}catch(error){status.textContent=error.message;}
 finally{busy=false;render();}
}
async function sendPending(){
 if(!pending)return;
 try{basket=(await api('/api/basket/action',pending)).basket;savePending(null);}
 catch(error){
  if(['revision_conflict','line_missing','basket_product_changed','basket_approval','shop_offer_unavailable','action_limit','line_limit'].includes(error.code)){savePending(null);await refresh();}
  throw error;
 }
}
async function mutate(type,lineId,quantity){
 identify();await refresh();if(pending)throw Error('Check the unfinished save before changing another item.');
 savePending({basketId,command:{type,actionId:crypto.randomUUID(),expectedRevision:basket.revision,lineId,...(type==='quantity'?{quantity}:{})}});
 await sendPending();
}
function render(){
 const count=basket?.lines.reduce((n,l)=>n+l.quantity,0)||0;
 for(const launcher of document.querySelectorAll('[data-basket-open]'))launcher.textContent='Cart ('+count+')';
 const badge=document.getElementById('bag-count');if(badge)badge.textContent=String(count);
 window.dispatchEvent(new CustomEvent('recast:cart-change',{detail:{count}}));
 if(!list)return;list.replaceChildren();
 for(const line of basket?.lines||[]){
  const item=node('article',undefined,'basket-line');
  if(line.thumbnail){const img=node('img');img.src=line.thumbnail;img.alt=(line.sourceKind==='premade'?'Ready-made gift: ':'Your approved design: ')+(line.title||line.product);img.className='basket-thumb';img.loading='lazy';img.onerror=()=>{img.hidden=true;};item.append(img);}
  const content=node('div',undefined,'basket-line-content');content.append(node('small',line.sourceKind==='premade'?'READY-MADE DESIGN':'YOUR APPROVED RECAST','basket-kind'),node('strong',line.title||line.product),node('p',line.variantLabel||line.sku));
  if(Number.isSafeInteger(line.unitPriceCents))content.append(node('p',money(line.unitPriceCents)+' each','basket-unit-price'));
  content.append(node('small','Artwork '+line.artworkId,'basket-artwork'));
  const controls=node('div',undefined,'basket-line-controls'),label=node('label','Quantity '),select=node('select');select.setAttribute('aria-label','Quantity for '+line.product+' '+line.artworkId);
  for(let q=1;q<=10;q++){const option=node('option',String(q));option.value=String(q);select.append(option);}select.value=String(line.quantity);
  select.disabled=busy||!!pending||basket.canEdit===false;select.onchange=()=>run(()=>mutate('quantity',line.lineId,Number(select.value)));label.append(select);
  const remove=button('Remove',()=>run(()=>mutate('remove',line.lineId)));remove.disabled=busy||!!pending||basket.canEdit===false;
  controls.append(label,remove);if(Number.isSafeInteger(line.lineTotalCents))controls.append(node('strong',money(line.lineTotalCents),'basket-line-total'));
  content.append(controls);item.append(content);list.append(item);
 }
 if(!basket?.lines.length)list.append(node('p','Your cart is empty. Add a finished pet gift or choose a product for your own Recast.'));
 const retry=panel.querySelector('[data-basket-retry]');retry.hidden=!pending;retry.disabled=busy;
 panel.querySelector('[data-basket-limit]').hidden=basket?.canEdit!==false;
 panel.querySelector('[data-basket-checkout]').disabled=busy||!!pending||!basket?.lines.length||basket.canCheckout===false;
 panel.querySelector('[data-basket-subtotal]').textContent=Number.isSafeInteger(basket?.subtotalCents)?money(basket.subtotalCents):basket?.lines.length?'Confirmed at checkout':money(0);
}
function ensurePanel(){
 if(panel)return;
 panel=node('dialog',undefined,'recast-basket');panel.setAttribute('aria-labelledby','basket-title');
 const heading=node('header',undefined,'basket-heading'),title=node('h2','Your cart');title.id='basket-title';const close=button('✕',()=>panel.close());close.setAttribute('aria-label','Close cart');heading.append(title,close);
 list=node('div');status=node('p');status.setAttribute('role','status');
 const note=node('p','Ready-made gifts and your own Recasts, together. Every item keeps its exact approved artwork and placement.');
 const limit=node('p',EDIT_LIMIT);limit.dataset.basketLimit='';limit.hidden=true;
 const subtotal=node('p',undefined,'basket-total');subtotal.append(node('span','Subtotal'));const amount=node('strong','$0.00');amount.dataset.basketSubtotal='';subtotal.append(amount);
 const delivery=node('p','Shipping and taxes are calculated at checkout. Made to order; check the delivery estimate before paying.','basket-delivery');
 const continueButton=button('Continue shopping',()=>panel.close()),reload=button('Refresh cart',()=>run(refresh));
 const retry=button('Check unfinished save',()=>run(async()=>{await refresh();await sendPending();}));retry.dataset.basketRetry='';
 const checkout=button('Checkout',()=>run(async()=>{
  await refresh();if(pending)throw Error('Check the unfinished save first.');
  const result=await api('/api/basket/checkout',{basketId,revision:basket.revision});
  // Navigating away is not payment confirmation; never erase a saved cart here.
  location.assign(result.checkoutUrl);
 }));checkout.dataset.basketCheckout='';checkout.className='button primary';
 const actions=node('div',undefined,'basket-actions');actions.append(checkout,continueButton,reload,retry);
 panel.append(heading,note,limit,list,subtotal,delivery,status,actions);document.body.append(panel);
 if(!document.querySelector('link[data-basket-css]')){const css=node('link');css.rel='stylesheet';css.href='/basket.css?v=1';css.dataset.basketCss='';document.head.append(css);}
}
export function openCart(){
 if(!enabled){const announcement=document.getElementById('shop-announcement');if(announcement)announcement.textContent='The cart is not available yet.';return;}
 ensurePanel();if(!panel.open)panel.showModal();render();
 run(async()=>{identify();try{await refresh();}catch(e){if(e.code==='basket_session'&&!pending){basket=null;status.textContent='Choose a gift or open your own Recast to start shopping.';render();return;}throw e;}});
}
export async function initialize({launcher}={}){
 if(!initializing)initializing=(async()=>{try{enabled=(await api('/api/basket/status')).enabled===true;if(enabled)identify();}catch{enabled=false;}return enabled;})();
 await initializing;if(!enabled)return false;
 if(!document.querySelector('link[data-basket-css],link[href^="/basket.css"]')){const css=node('link');css.rel='stylesheet';css.href='/basket.css?v=1';css.dataset.basketCss='';document.head.append(css);}
 const target=launcher?document.querySelector(launcher):null;
 if(target){target.onclick=openCart;target.dataset.basketOpen='';target.setAttribute('aria-haspopup','dialog');}
 else if(!document.querySelector('[data-basket-open]')){
  const launch=button('Open cart',openCart);launch.dataset.basketOpen='';launch.setAttribute('aria-haspopup','dialog');launch.classList.add('basket-launcher');
  const header=document.querySelector('.site-header,.library-header,.header');if(header)header.append(launch);else document.querySelector('#product-grid')?.before(launch);
 }
 try{await refresh();}catch{/* No cart session exists until the first approved item is selected. */}
 return true;
}
export async function addPremade(offer){
 if(!await initialize())throw Error('The cart is being prepared. Please try again later.');
 identify();await api('/api/basket/session',{offerId:offer.id,revision:offer.artworkRevision});await refresh();
 if(pending)throw Error('Open your cart and check its unfinished save first.');
 if(basket.canEdit===false)throw Error(EDIT_LIMIT);
 const approval=await api('/api/basket/premade',{basketId,offerId:offer.id,revision:offer.artworkRevision});
 savePending({basketId,approvalToken:approval.approvalToken,command:{type:'add',actionId:crypto.randomUUID(),expectedRevision:basket.revision,lineId:crypto.randomUUID(),quantity:1}});
 await sendPending();render();openCart();
}
export function addReviewAction(modal,req,getApproval,closeReview){
 if(!enabled||req.shareId)return;
 const actions=modal.querySelector('.final-review-actions');if(!actions)return;
 const add=button('Approve & add to cart',async()=>{
  if(add.disabled)return;add.disabled=true;const error=modal.querySelector('.final-review-error');
  try{
   identify();const designApproval=getApproval();await api('/api/basket/session',{requestId:req.requestId,accessToken:req.accessToken});await refresh();
   if(pending)throw Error('Open your cart and check its unfinished save first.');if(basket.canEdit===false)throw Error(EDIT_LIMIT);
   const approval=await api('/api/basket/approve',{basketId,designApproval});
   savePending({basketId,approvalToken:approval.approvalToken,command:{type:'add',actionId:crypto.randomUUID(),expectedRevision:basket.revision,lineId:crypto.randomUUID(),quantity:1}});
   await sendPending();closeReview();openCart();
  }catch(cause){error.textContent=cause.message;error.hidden=false;}finally{add.disabled=false;}
 });actions.prepend(add);
}
window.addEventListener('storage',event=>{if(enabled&&[ID,PENDING].includes(event.key)){try{identify();refresh().catch(()=>{});}catch{}}});
window.addEventListener('pageshow',()=>{if(enabled&&basketId)refresh().catch(()=>{});});
