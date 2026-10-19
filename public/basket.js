const ID='recast_basket_id_v1',PENDING='recast_basket_pending_v1';
let basket=null,basketId=null,pending=null,enabled=false,busy=false,panel=null,status=null,list=null;
const EDIT_LIMIT='Your basket has reached its edit limit. Your items are saved. You can check out as shown or contact support to change them.';
const node=(tag,text)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
async function api(path,body){
 const r=await fetch(path,{method:body?'POST':'GET',headers:{'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const data=await r.json();if(!r.ok||!data.ok){const e=Error(data.error||'Your basket is temporarily unavailable.');e.code=data.code;throw e;}return data;
}
function identify(){
 basketId=localStorage.getItem(ID);
 if(!basketId){basketId=crypto.randomUUID();localStorage.setItem(ID,basketId);}
 pending=JSON.parse(localStorage.getItem(PENDING)||'null');
}
function button(text,action){const el=node('button',text);el.type='button';el.className='button ghost';el.onclick=action;return el;}
function savePending(value){localStorage.setItem(PENDING,JSON.stringify(value));pending=value;}
async function refresh(){
 basket=(await api('/api/basket?id='+encodeURIComponent(basketId))).basket;
 if(pending&&basket.appliedActions.includes(pending.command.actionId))savePending(null);
 render();
}
async function run(action){
 if(busy)return;busy=true;status.textContent='Saving your basket…';render();
 try{await action();status.textContent='Your basket is saved.';}catch(error){status.textContent=error.message;}
 finally{busy=false;render();}
}
async function sendPending(){
 if(!pending)return;
 try{basket=(await api('/api/basket/action',pending)).basket;savePending(null);}
 catch(error){
  // Limit errors are definitive rejections, not uncertain saves. Keep the
  // saved basket and its checkout usable; never discard ambiguous operations.
  if(['revision_conflict','line_missing','basket_product_changed','basket_approval','action_limit','line_limit'].includes(error.code)){savePending(null);await refresh();}
  throw error;
 }
}
async function mutate(type,lineId,quantity){
 await refresh();if(pending)throw Error('Check the unfinished save before changing another item.');
 savePending({basketId,command:{type,actionId:crypto.randomUUID(),expectedRevision:basket.revision,lineId,...(type==='quantity'?{quantity}:{})}});
 await sendPending();
}
function render(){
 if(!list)return;list.replaceChildren();
 for(const line of basket?.lines||[]){
  const item=node('article');item.className='basket-line';
  item.append(node('strong',line.product),node('p',line.sku),node('small','Artwork '+line.artworkId));
  const label=node('label','Quantity '),select=node('select');select.setAttribute('aria-label','Quantity for '+line.product+' '+line.artworkId);
  for(let q=1;q<=10;q++){const option=node('option',String(q));option.value=String(q);select.append(option);}select.value=String(line.quantity);
  select.disabled=busy||!!pending||basket.canEdit===false;select.onchange=()=>run(()=>mutate('quantity',line.lineId,Number(select.value)));label.append(select);
  const remove=button('Remove',()=>run(()=>mutate('remove',line.lineId)));remove.disabled=busy||!!pending||basket.canEdit===false;
  item.append(label,remove);list.append(item);
 }
 if(!basket?.lines.length)list.append(node('p','Your basket is empty. Open a saved picture and choose a product.'));
 const retry=panel.querySelector('[data-basket-retry]');retry.hidden=!pending;retry.disabled=busy;
 const limit=panel.querySelector('[data-basket-limit]');limit.hidden=basket?.canEdit!==false;
 panel.querySelector('[data-basket-checkout]').disabled=busy||!!pending||!basket?.lines.length;
 const launcher=document.querySelector('[data-basket-open]');if(launcher)launcher.textContent='Basket ('+(basket?.lines.reduce((n,l)=>n+l.quantity,0)||0)+')';
}
function open(){
 if(!panel){
  panel=node('dialog');panel.className='recast-basket';panel.setAttribute('aria-labelledby','basket-title');
  const title=node('h2','Your basket');title.id='basket-title';list=node('div');status=node('p');status.setAttribute('role','status');
  const note=node('p','Each item keeps its approved artwork and placement. Prices, shipping and taxes are confirmed at checkout.');
  const limit=node('p',EDIT_LIMIT);limit.dataset.basketLimit='';limit.hidden=true;
  const continueButton=button('Continue shopping',()=>panel.close());
  const reload=button('Refresh basket',()=>run(refresh));
  const retry=button('Check unfinished save',()=>run(async()=>{await refresh();await sendPending();}));retry.dataset.basketRetry='';
  const checkout=button('Continue to checkout',()=>run(async()=>{
   await refresh();if(pending)throw Error('Check the unfinished save first.');
   const result=await api('/api/basket/checkout',{basketId,revision:basket.revision});
   // Do not clear the saved basket when navigating away or on a failed response.
   location.assign(result.checkoutUrl);
  }));checkout.dataset.basketCheckout='';checkout.className='button primary';
  panel.append(title,note,limit,list,status,retry,reload,continueButton,checkout);document.body.append(panel);
  const style=node('style');style.textContent='.recast-basket{background:#0c1023;color:#f6f7ff;border:1px solid #6d55b0;border-radius:22px;width:min(560px,calc(100vw - 32px));max-height:85dvh;box-sizing:border-box;padding:24px;overflow:auto}.recast-basket::backdrop{background:#030510c9}.recast-basket button,.recast-basket select{min-height:44px;margin:6px;max-width:100%}.basket-line{border-top:1px solid #48415e;padding:18px 0;overflow-wrap:anywhere}.basket-line small{display:block;margin-bottom:12px}.basket-line p{font-size:13px;color:#c8c3dc}.recast-basket h2{margin-top:0}.recast-basket>p{line-height:1.5}.basket-launcher{margin:12px 0}';document.head.append(style);
 }
 panel.showModal();render();run(refresh);
}
export async function initialize(){
 enabled=(await api('/api/basket/status')).enabled===true;
 if(!enabled)return;
 identify();
 const launcher=button('Open basket',open);launcher.dataset.basketOpen='';launcher.classList.add('basket-launcher');
 document.querySelector('#product-grid')?.before(launcher);
}
export function addReviewAction(modal,req,getApproval,closeReview){
 if(!enabled||req.shareId)return; // Shared-artwork review retains existing checkout.
 const actions=modal.querySelector('.final-review-actions');if(!actions)return;
 const add=button('Approve & add to basket',async()=>{
  if(add.disabled)return;add.disabled=true;
  const error=modal.querySelector('.final-review-error');
  try{
   identify();const designApproval=getApproval();
   await api('/api/basket/session',{requestId:req.requestId,accessToken:req.accessToken});
   await refresh();
   if(pending)throw Error('Open your basket and check its unfinished save first.');
   if(basket.canEdit===false)throw Error(EDIT_LIMIT);
   const approval=await api('/api/basket/approve',{basketId,designApproval});
   savePending({basketId,approvalToken:approval.approvalToken,command:{type:'add',actionId:crypto.randomUUID(),expectedRevision:basket.revision,lineId:crypto.randomUUID(),quantity:1}});
   await sendPending();closeReview();open();
  }catch(cause){error.textContent=cause.message;error.hidden=false;}finally{add.disabled=false;}
 });actions.append(add);
}
