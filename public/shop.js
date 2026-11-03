import {groupShopOffers} from './shop-model.js?v=4';
import {initialize,addPremade,openCart} from './basket.js?v=2';
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
 $('#detail-add').onclick=()=>add(offer,$('#detail-add'));$('#product-detail').showModal();
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
function render(offers){
 const groups=groupShopOffers(offers),types=[...new Set(groups.map(v=>v[0].product))];
 const order=Object.keys(productNames);types.sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)));
 $('#products').replaceChildren();$('#product-nav').replaceChildren();$('#empty').hidden=groups.length>0;
 types.forEach((type,index)=>{
  const section=node('section',null,'product-section');section.id='product-'+index;
  const heading=node('h2',productNames[type]||type);section.append(heading);
  const link=node('a',productNames[type]||type);link.href='#'+section.id;$('#product-nav').append(link);
  for(const [pet,label] of [['dog','Dog favorites'],['cat','Cat favorites'],['other','More to love']]){
   const items=groups.filter(v=>v[0].product===type&&(pet==='other'?!['dog','cat'].includes(v[0].pet):v[0].pet===pet));
   if(!items.length)continue;
   const grid=node('div',null,'products');grid.append(...items.map(card));section.append(node('h3',label,'pet-heading'),grid);
  }
  $('#products').append(section);
 });
}
$('#close-detail').onclick=()=>$('#product-detail').close();$('#open-cart').onclick=openCart;
try{const response=await fetch('/api/shop/catalog',{cache:'no-store'});const data=await response.json();if(!response.ok||data.version!==1||!Array.isArray(data.offers))throw Error('Catalog unavailable');render(data.offers);}
catch{$('#empty').hidden=false;$('#empty h2').textContent='The shop is temporarily unavailable.';$('#empty p').textContent='Please refresh to try again.';}
await initialize({launcher:'#open-cart'});
