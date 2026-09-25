const id=new URLSearchParams(location.search).get('share')||'';
const status=document.querySelector('#share-status');
const error=document.querySelector('#share-error');
const endpoint=`/api/social/${encodeURIComponent(id)}`;
async function read(path,options){const r=await fetch(path,options);const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Unable to open this Recast.');return d;}
async function openRecast(){
  if(!/^[a-f0-9]{40}$/.test(id))throw new Error('Open the link under your Recast picture to view your artwork.');
  const artwork=await read(endpoint);
  document.querySelector('#share-title').textContent=`Your ${artwork.styleName} Recast.`;
  const image=document.querySelector('#share-image');image.src=artwork.image;image.hidden=false;
  status.textContent=`Artwork ID: ${artwork.requestId}`;
  const catalog=await read(`${endpoint}/products`);
  const products=catalog.products.filter(p=>p.status==='ACTIVE');
  if(!products.length){error.textContent='Your artwork is saved. Purchase options are not open yet—please check back.';return;}
  products.sort((a,b)=>rank(a.title)-rank(b.title));
  const list=document.querySelector('#share-products');
  for(const product of products){
    if(!product.variants.length)continue;
    const card=document.createElement('article');card.className='share-product';
    const title=document.createElement('h3');title.textContent=product.title;
    const select=document.createElement('select');select.setAttribute('aria-label',`${product.title} size or option`);
    for(const v of product.variants){const option=document.createElement('option');option.value=v.sku;option.textContent=`${v.variantTitle} — $${Number(v.price).toFixed(2)}`;select.append(option);}
    const buy=document.createElement('button');buy.textContent='Choose this';
    buy.onclick=async()=>{buy.disabled=true;buy.textContent='Opening checkout…';error.textContent='';try{const d=await read(`${endpoint}/checkout`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sku:select.value})});location.assign(d.checkoutUrl);}catch(e){error.textContent=e.message;buy.disabled=false;buy.textContent='Try checkout again';}};
    card.append(title,select,buy);list.append(card);
  }
}
function rank(title){return /poster/i.test(title)?0:/mug/i.test(title)?1:/digital/i.test(title)?2:3;}
openRecast().catch(e=>{error.textContent=e.message;status.textContent='';});
