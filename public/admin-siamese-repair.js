const endpoint='/api/admin/shop-source-repair/siamese';
const status=document.querySelector('#source-repair-status'),grid=document.querySelector('#source-repair-items'),original=document.querySelector('#source-repair-original');
const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
let current=null,busy=false;
async function request(body){
 const token=sessionStorage.getItem('recast_admin_token')||'';
 if(!token)throw Error('Unlock the existing Recast Control Center in this browser tab first. Keep the admin token private.');
 const response=await fetch(endpoint,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',redirect:'error'});
 const data=await response.json();
 if(!response.ok||!data.ok)throw Error(data.error||'The saved repair status needs review.');
 return data;
}
function render(){
 grid.replaceChildren();
 for(const item of current?.items||[]){
  const card=el('section');card.className='repair-card';card.append(el('h2',item.title),el('p','Saved status: '+String(item.status).replaceAll('_',' ')));
  if(item.attempt)card.append(el('p','Attempt record: '+String(item.attempt).replaceAll('_',' ')));
  const button=el('button',item.sku==='RECAST-MUG-11OZ'?'Prepare first 11 oz supplier preview':'Prepare first 15 oz supplier preview');button.type='button';
  button.disabled=busy||item.status!=='needs_review'||Boolean(item.attempt);
  button.addEventListener('click',async()=>{
   if(busy||button.disabled)return;
   const message='Recover the exact approved Siamese original if missing, run its required content check, and prepare ONE first supplier preview for '+item.title+'? Original records stay preserved. This does not publish, charge, or send a printing order.';
   if(!confirm(message))return;
   busy=true;render();status.textContent='Checking the original source and recording the first-preview request…';
   try{
    const result=await request({sku:item.sku,sourceRevision:current.source.sha256,confirmFirstPreview:true});
    status.textContent='Saved '+result.id+': '+result.status+'. Supplier images and the clean print file still require visual approval before sale.';
   }catch(error){status.textContent=error.message+' No automatic repeat will be sent.';}
   finally{busy=false;try{current=await request();render();}catch{/* Keep the honest result already displayed. */}}
  });
  card.append(button);grid.append(card);
 }
}
async function refresh(){
 if(busy)return;
 try{
  current=await request();original.replaceChildren();
  const url=new URL(current.source.asset);
  if(url.protocol!=='https:'||url.hostname!=='cdn.shopify.com'||!url.pathname.startsWith('/s/files/1/0854/3810/3796/files/'))throw Error('Unexpected original artwork origin.');
  const image=el('img');image.src=url.href;image.alt='Original approved Siamese Christmas Village illustration';image.referrerPolicy='no-referrer';original.append(image,el('figcaption','Exact approved original — no replacement image will be generated.'));
  status.textContent=current.source.metadataVerified?'Original source metadata is verified. Only a size without a prior supplier attempt can be prepared.':'The recorded missing source can be recovered only after all pre-provider failure checks pass.';
  render();
 }catch(error){status.textContent=error.message;grid.replaceChildren();original.replaceChildren();}
}
document.querySelector('#source-repair-refresh').addEventListener('click',refresh);
window.addEventListener('pagehide',()=>{original.replaceChildren();grid.replaceChildren();current=null;});
refresh();
