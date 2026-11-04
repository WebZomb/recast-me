import {groupShopOffers} from './shop-model.js?v=4';
import {SHOP_COLLECTIONS} from './shop-collections.js?v=1';
import {initialize,addPremade,openCart} from './basket.js?v=3';
const $=s=>document.querySelector(s);
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
const productNames={mug:'Mugs',blanket:'Blankets',canvas:'Canvas',tumbler:'Tumblers',pillow:'Pillows',hoodie:'Hoodies',tee:'T-shirts',poster:'Posters',frame:'Framed prints',journal:'Journals',coaster:'Coasters',magnet:'Magnets',sticker:'Stickers'};
let adding=false;
let salesForApproved=new Map(),approvedOffers=[],allGalleryDesigns=[];
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
function button(text,fn){const el=node('button',text);el.type='button';el.addEventListener('click',fn);return el;}
function salesImage(offer){const source=salesForApproved.get(offer.designId+'|'+offer.artworkRevision);if(source)return source;return offer.designId==='christmas-golden-retriever-winter-lights'&&offer.product==='mug'&&offer.artworkRevision==='a003e979d4a1c2056d37f9c23610399dd83ed82ec0f85cde8733f99fbd1ff0a2'?({'golden-winter-lights-mug-11oz':'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-christmas-golden-winter-lights-festive-sales-v2-20261103.webp?v=1793757067','golden-winter-lights-mug-15oz':'/shop-assets/golden-mug-15oz-sales.webp'}[offer.id]||null):null;}
async function add(offer,control){
 if(adding)return;adding=true;control.disabled=true;const label=control.textContent;control.textContent='Adding…';$('#shop-announcement').textContent='';
 try{await addPremade(offer);$('#product-detail').close();$('#shop-announcement').textContent='Added to your cart.';}
 catch(error){$('#shop-announcement').textContent=error.message;}
 finally{control.disabled=false;control.textContent=label;adding=false;}
}

function detailViews({scene,artwork,proof11,proof15},initial,details){
 const tabs=$('#detail-views'),img=$('#detail-image'),label=$('#detail-variant');
 tabs.replaceChildren();
 const views=[
  {id:'scene',name:'Mug scene',url:scene,description:'Decorated mug illustration — not a supplier proof'},
  {id:'artwork',name:'Artwork',url:artwork,description:'Original artwork — the pet design to be printed'},
  {id:'proof11',name:'Actual 11 oz',url:proof11,description:'11 oz — verified Printful supplier preview'},
  {id:'proof15',name:'Actual 15 oz',url:proof15,description:'15 oz — verified Printful supplier preview'}
 ];
 const available=views.find(x=>x.id===initial&&x.url)||views.find(x=>x.url);
 const controls=new Map();
 function choose(view){
  if(!view?.url)return;
  img.src=view.url;img.alt=details.title+' — '+view.description;
  label.textContent=view.description+(details.variantText?' · '+details.variantText:'');
  for(const [id,el] of controls)el.setAttribute('aria-pressed',String(id===view.id));
 }
 for(const v of views){
  const b=button(v.name,v.url?()=>choose(v):()=>{});
  b.className='detail-view-option';b.disabled=!v.url;
  if(!v.url){b.textContent=v.name+' pending';b.title=v.name+' requires a verified Printful preview';}
  b.setAttribute('aria-pressed','false');tabs.append(b);controls.set(v.id,b);
 }
 choose(available);
}
function verifiedDesignOffers(designId,revision){
 return approvedOffers.filter(o=>o.product==='mug'&&o.designId===designId&&o.artworkRevision===revision&&o.status==='verified'&&o.proof?.approved===true);
}
function findSupplierPreviews(designId,revision){
 const offers=verifiedDesignOffers(designId,revision);
 const pick=needle=>offers.find(o=>String(o.variantLabel||'').includes(needle));
 const url=o=>o?.productPreviewUrl||o?.mockupUrl||null;
 return {proof11:url(pick('11 oz')),proof15:url(pick('15 oz'))};
}
function showProduct(offer){
 const design=allGalleryDesigns.find(d=>d.designId===offer.designId&&d.artworkRevision===offer.artworkRevision);
 const art=design?.artworkImage||(offer.designId==='christmas-golden-retriever-winter-lights'?'/shop-assets/christmas-golden-artwork.png':null);
 const sources={scene:design?.salesImage||salesImage(offer),artwork:art,...findSupplierPreviews(offer.designId,offer.artworkRevision)};
 $('#detail-title').textContent=design?.title||offer.title;
 detailViews(sources,String(offer.variantLabel).includes('15 oz')?'proof15':'proof11',{title:offer.title,variantText:offer.variantLabel});
 $('#detail-price').textContent=money(offer.priceCents);
 $('#detail-add').hidden=false;$('#detail-add').onclick=()=>add(offer,$('#detail-add'));
 $('#product-detail').showModal();
}
function showPreview(design,showingArtwork){
 const sources={scene:design.salesImage||null,artwork:design.artworkImage,...findSupplierPreviews(design.designId,design.artworkRevision)};
 $('#detail-title').textContent=design.title;
 detailViews(sources,showingArtwork?'artwork':'scene',{title:design.title});
 $('#detail-price').textContent='Printful preview pending · not yet available to buy';
 $('#detail-add').hidden=true;$('#detail-add').onclick=null;$('#product-detail').showModal();
}
function previewCard(design){
 const card=node('article',null,'concept-product'),visual=node('div',null,'product-visual');
 card.dataset.designId=design.id;card.dataset.offerStatus='preview';
 const img=node('img');img.loading='lazy';img.decoding='async';img.width=600;img.height=600;
 const badge=node('span',null,'image-caption'),details=node('div',null,'details');
 const title=node('h3',design.title),note=node('p','Print preview pending · Not yet available to buy','preview-note');
 const sizes=node('p','11 oz and 15 oz planned','preview-size');
 const mugScene=design.salesImage||null;
 let showingArtwork=!mugScene;
 const toggle=button('',()=>{showingArtwork=!showingArtwork;updateImage();});
 const expand=button('View 4 options',()=>showPreview(design,showingArtwork));
 const actions=node('div',null,'preview-actions');actions.append(toggle,expand);
 function updateImage(){
  img.src=showingArtwork||!mugScene?design.artworkImage:mugScene;
  img.alt=design.title+(showingArtwork?' — original artwork':' — decorated mug illustration, not supplier proof');
  badge.textContent=showingArtwork?'Original artwork':'Mug illustration';
  toggle.textContent=showingArtwork?'See mug':'See artwork';
  toggle.disabled=!mugScene;
  if(!mugScene)toggle.title='Mug scene pending; original artwork is shown';
 }
 img.onerror=()=>{img.alt='Preview temporarily unavailable — try the other view';};
 visual.append(img,badge);details.append(title,note,sizes,actions);card.append(visual,details);updateImage();
 return card;
}
function card(variants){
 let selected=variants[0];const card=node('article',null,'product'),visual=node('div',null,'product-visual'),img=node('img');
 img.loading='lazy';img.width=600;img.height=600;
 const badge=node('span',null,'image-caption'),details=node('div',null,'details');
 const title=node('h3',selected.designId?.startsWith('christmas-village-')?selected.breed+' · Christmas Village':selected.breed||selected.title),price=node('strong');
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
 approvedOffers=offers;allGalleryDesigns=previews;
 salesForApproved=new Map(previews.filter(d=>d.salesImage).map(d=>[d.designId+'|'+d.artworkRevision,d.salesImage]));
 const availableDesigns=new Set(offers.map(o=>o.designId+'|'+o.artworkRevision));
 previews=previews.filter(d=>!availableDesigns.has(d.designId+'|'+d.artworkRevision));
 const groups=groupShopOffers(offers),types=[...new Set([...groups.map(v=>v[0].product),...previews.map(v=>v.product)])];
 const order=Object.keys(productNames);types.sort((a,b)=>(order.indexOf(a)<0?99:order.indexOf(a))-(order.indexOf(b)<0?99:order.indexOf(b)));
 $('#products').replaceChildren();
 $('#product-nav').replaceChildren(...SHOP_COLLECTIONS.map(collection=>{
  const link=node('a',collection.label);
  link.href=collection.url;
  if(collection.slug==='mugs')link.setAttribute('aria-current','page');
  return link;
 }));
 $('#empty').hidden=groups.length>0||previews.length>0;
 types.forEach((type,index)=>{
  const section=node('section',null,'product-section');section.id='product-'+index;
  const heading=node('h2',productNames[type]||type);section.append(heading);
  for(const [pet,label] of [['dog','Dog favorites'],['cat','Cat favorites'],['other','More to love']]){
   const items=groups.filter(v=>v[0].product===type&&(pet==='other'?!['dog','cat'].includes(v[0].pet):v[0].pet===pet));
   const pending=previews.filter(v=>v.product===type&&(pet==='other'?!['dog','cat'].includes(v.pet):v.pet===pet));
   if(!items.length&&!pending.length)continue;
   const grid=node('div',null,'products');
   // Keep the close-up Christmas Village collection together first.
   // The approved original Golden Retriever then introduces the full-scene classics.
   const closeups=pending.filter(d=>d.collection!=='classic-christmas');
   const classics=pending.filter(d=>d.collection==='classic-christmas');
   grid.append(...closeups.map(previewCard),...items.map(card),...classics.map(previewCard));
   section.append(node('h3',label,'pet-heading'),grid);
  }
  $('#products').append(section);
 });
}
$('#close-detail').onclick=()=>$('#product-detail').close();$('#open-cart').onclick=openCart;
let previews=[];
const catalogRequest=fetch('/api/shop/catalog',{cache:'no-store'});
try{
 const response=await fetch('/shop-gallery.json',{cache:'no-cache'});
 if(response.ok){
  const data=await response.json();
  if(data.version===1&&Array.isArray(data.designs))previews=data.designs.filter(d=>d&&d.status==='preview'&&d.product==='mug'&&['dog','cat'].includes(d.pet)&&typeof d.title==='string'&&typeof d.breed==='string'&&String(d.artworkImage).startsWith('https://cdn.shopify.com/')&&(!d.salesImage||String(d.salesImage).startsWith('https://cdn.shopify.com/')));
 }
}catch{/* The verified shop remains available if the artwork preview gallery is offline. */}
try{const response=await catalogRequest;const data=await response.json();if(!response.ok||data.version!==1||!Array.isArray(data.offers))throw Error('Catalog unavailable');render(data.offers,previews);}
catch{$('#empty').hidden=false;$('#empty h2').textContent='The shop is temporarily unavailable.';$('#empty p').textContent='Please refresh to try again.';}
await initialize({launcher:'#open-cart'});
