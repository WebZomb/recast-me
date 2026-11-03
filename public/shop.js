import {groupShopOffers} from './shop-model.js?v=4';
import {initialize,addPremade,openCart} from './basket.js?v=3';
const $=s=>document.querySelector(s);
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
const productNames={mug:'Mugs',blanket:'Blankets',canvas:'Canvas',tumbler:'Tumblers',pillow:'Pillows',hoodie:'Hoodies',tee:'T-shirts',poster:'Posters',frame:'Framed prints',journal:'Journals',coaster:'Coasters',magnet:'Magnets',sticker:'Stickers'};
let adding=false;
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
function button(text,fn){const el=node('button',text);el.type='button';el.addEventListener('click',fn);return el;}
function salesImage(offer){return offer.designId==='christmas-golden-retriever-winter-lights'&&offer.product==='mug'&&offer.artworkRevision==='a003e979d4a1c2056d37f9c23610399dd83ed82ec0f85cde8733f99fbd1ff0a2'?({'golden-winter-lights-mug-11oz':'/shop-assets/golden-mug-sales.webp','golden-winter-lights-mug-15oz':'/shop-assets/golden-mug-15oz-sales.webp'}[offer.id]||null):null;}
async function add(offer,control){
 if(adding)return;adding=true;control.disabled=true;const label=control.textContent;control.textContent='Adding…';$('#shop-announcement').textContent='';
 try{await addPremade(offer);$('#product-detail').close();$('#shop-announcement').textContent='Added to your cart.';}
 catch(error){$('#shop-announcement').textContent=error.message;}
 finally{control.disabled=false;control.textContent=label;adding=false;}
}
function showProduct(offer){
 $('#detail-title').textContent=offer.breed+' · '+(productNames[offer.product]||offer.product);
 $('#detail-image').src=offer.productPreviewUrl||offer.mockupUrl;$('#detail-image').alt=offer.title+' — actual supplier preview';
 $('#detail-variant').textContent=offer.variantLabel;$('#detail-price').textContent=money(offer.priceCents);
 $('#detail-add').hidden=false;$('#detail-add').onclick=()=>add(offer,$('#detail-add'));$('#product-detail').showModal();
}
function showPreview(design,showingArtwork){
 $('#detail-title').textContent=design.breed+' · Christmas Village';
 $('#detail-image').src=showingArtwork?design.artworkImage:design.salesImage;
 $('#detail-image').alt=design.title+(showingArtwork?' — original face artwork':' — decorated mug sales illustration');
 $('#detail-variant').textContent=showingArtwork?'Original artwork — face close-up':'Lifestyle mug illustration — not a Printful proof';
 $('#detail-price').textContent='Print preview pending';
 $('#detail-add').hidden=true;$('#detail-add').onclick=null;$('#product-detail').showModal();
}
function previewCard(design){
 const card=node('article',null,'concept-product'),visual=node('div',null,'product-visual');
 card.dataset.designId=design.id;card.dataset.offerStatus='preview';
 const img=node('img');img.loading='lazy';img.decoding='async';img.width=600;img.height=600;
 const badge=node('span','Decorated mug illustration','image-caption'),details=node('div',null,'details');
 const title=node('h3',design.breed+' · Christmas Village');
 const note=node('p','Print preview pending · Not yet available to buy','preview-note');
 const sizes=node('p','11 oz and 15 oz planned','preview-size');
 let showingArtwork=false;
 const toggle=button('See artwork',()=>{
  showingArtwork=!showingArtwork;
  img.src=showingArtwork?design.artworkImage:design.salesImage;
  img.alt=design.title+(showingArtwork?' — face artwork':' — decorated mug illustration');
  badge.textContent=showingArtwork?'Face artwork':'Decorated mug illustration';
  toggle.textContent=showingArtwork?'See mug':'See artwork';
 });
 const expand=button('View larger',()=>showPreview(design,showingArtwork));
 const actions=node('div',null,'preview-actions');actions.append(toggle,expand);
 img.src=design.salesImage;img.alt=design.title+' — illustrated mug setting, not supplier proof';
 img.onerror=()=>{img.alt='Preview image temporarily unavailable';};
 visual.append(img,badge);details.append(title,note,sizes,actions);card.append(visual,details);
 return card;
}
function card(variants){
 let selected=variants[0];const card=node('article',null,'product'),visual=node('div',null,'product-visual'),img=node('img');
 img.loading='lazy';img.width=600;img.height=600;
 const badge=node('span',null,'image-caption'),details=node('div',null,'details');
 const title=node('h3',selected.breed||selected.title),price=node('strong');
 const size=node('select');size.setAttribute('aria-label','Size for '+selected.title);
 for(const offer of variants)size.add(new Option(offer.variantLabel,offer.id));
 const buy=button('Add to cart',()=>add(selected,buy));buy.className='primary';
 const real=button('See real product',()=>showProduct(selected));real.className='real-product';
 function update(){const sales=salesImage(selected);img.src=sales||selected.productPreviewUrl||selected.mockupUrl;img.alt=selected.title+(sales?' — sales illustration':' — real product preview');badge.textContent=sales?'Illustration':'Product preview';price.textContent=money(selected.priceCents);buy.disabled=false;}
 size.onchange=()=>{selected=variants.find(o=>o.id===size.value);update();};
 img.onerror=()=>{img.alt='Image unavailable — see real product';};
 visual.append(img,badge);details.append(title,price,size,real,buy);card.append(visual,details);update();return card;
}
function render(offers,previews=[]){
 const groups=groupShopOffers(offers),types=[...new Set([...groups.map(v=>v[0].product),...previews.map(v=>v.product)])];
 const order=Object.keys(productNames);types.sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)));
 $('#products').replaceChildren();$('#product-nav').replaceChildren();$('#empty').hidden=groups.length>0||previews.length>0;
 types.forEach((type,index)=>{
  const section=node('section',null,'product-section');section.id='product-'+index;
  const heading=node('h2',productNames[type]||type);section.append(heading);
  const link=node('a',productNames[type]||type);link.href='#'+section.id;$('#product-nav').append(link);
  for(const [pet,label] of [['dog','Dog favorites'],['cat','Cat favorites'],['other','More to love']]){
   const items=groups.filter(v=>v[0].product===type&&(pet==='other'?!['dog','cat'].includes(v[0].pet):v[0].pet===pet));
   const pending=previews.filter(v=>v.product===type&&(pet==='other'?!['dog','cat'].includes(v.pet):v.pet===pet));
   if(!items.length&&!pending.length)continue;
   const grid=node('div',null,'products');grid.append(...items.map(card),...pending.map(previewCard));section.append(node('h3',label,'pet-heading'),grid);
  }
  $('#products').append(section);
 });
}
$('#close-detail').onclick=()=>$('#product-detail').close();$('#open-cart').onclick=openCart;
let previews=[];
try{
 const response=await fetch('/shop-gallery.json',{cache:'no-cache'});
 if(response.ok){
  const data=await response.json();
  if(data.version===1&&Array.isArray(data.designs))previews=data.designs.filter(d=>d&&d.status==='preview'&&d.product==='mug'&&['dog','cat'].includes(d.pet)&&typeof d.breed==='string'&&String(d.artworkImage).startsWith('https://cdn.shopify.com/')&&String(d.salesImage).startsWith('https://cdn.shopify.com/'));
 }
}catch{/* The verified shop remains available if the artwork preview gallery is offline. */}
try{const response=await fetch('/api/shop/catalog',{cache:'no-store'});const data=await response.json();if(!response.ok||data.version!==1||!Array.isArray(data.offers))throw Error('Catalog unavailable');render(data.offers,previews);}
catch{$('#empty').hidden=false;$('#empty h2').textContent='The shop is temporarily unavailable.';$('#empty p').textContent='Please refresh to try again.';}
await initialize({launcher:'#open-cart'});
