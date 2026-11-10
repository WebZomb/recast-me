import {shopLoading,readShopCatalog,browsingImage,trackImage,readShopGallery} from './shop-loading.js?v=1';
import {salesIllustration} from './shop-sales-illustrations.js?v=2';
import {createProductConcept,conceptSizeOptions} from './shop-product-concepts.js?v=1';
import {blanketPrintAudit} from './shop-print-readiness.js?v=1';
import {SHOP_COLLECTIONS,collectionBySlug,collectionDesigns,categoryOffers} from './shop-collections.js?v=2';
import {readyOffer} from './shop-model.js?v=4';
import {initialize,addPremade,openCart} from './basket.js?v=4';

const $=selector=>document.querySelector(selector);
const item=($('body')?.dataset?.collection||'').toLowerCase();
const collection=collectionBySlug(item);
const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const btn=(label,action,cls)=>{const n=el('button',cls,label);n.type='button';n.addEventListener('click',action);return n;};
const shortTitle=d=>d.title.replace(/\s+(Christmas Village )?Mug$/i,'').replace(/\s+Mug$/i,'');
const safeUrl=url=>typeof url==='string'&&/^https:\/\//.test(url)?url:null;
const viewImage=(url,alt)=>{const i=trackImage(el('img'));i.src=browsingImage(url);i.alt=alt;i.loading='lazy';i.decoding='async';i.width=480;i.height=480;return i;};
let isAdding=false,selectedOffer=null;
const artworkFor=d=>d.artworkImage;
function verifiedByDesign(offers,design){
 return offers.filter(o=>o.designId===design.designId&&o.artworkRevision===design.artworkRevision&&readyOffer(o));
}
function displayPreview(visual,design,{size}={}){
 const sales=salesIllustration(item,design);
 const img=viewImage(sales?.thumbnailUrl||sales?.url||artworkFor(design),shortTitle(design)+(sales?' — illustrated '+collection.label+' concept':' — original Christmas artwork'));
 visual.replaceChildren(img,el('span','collection-preview-label',sales?'Illustrated product concept':'Original Christmas artwork'));
 return Boolean(sales);
}
function photoPreview(visual,offer){
 const url=safeUrl(offer.productPreviewUrl)||safeUrl(offer.mockupUrl);
 if(!url)return false;
 const img=viewImage(url,offer.title+' — verified Printful product preview for '+offer.variantLabel);
 const badge=el('span','collection-preview-label','Real Printful preview');
 visual.replaceChildren(img,badge);
 return true;
}
function chooseDetailPhoto(url,label,alt){
 const concept=$('#collection-detail-concept');
 if(concept)concept.hidden=true;
 const image=$('#collection-detail-image');
 image.hidden=false;image.src=url;image.alt=alt;
 $('#collection-detail-description').textContent=label;
}
function showDetailConcept(design,size){
 const concept=$('#collection-detail-concept');
 concept.replaceChildren(createProductConcept(design,{slug:item,size,large:true}));
 concept.hidden=false;
 $('#collection-detail-image').hidden=true;
 const sizeText=item==='blankets'?' · '+size:'';
 $('#collection-detail-description').textContent='Design concept'+sizeText+' — this is not a manufacturer preview. Original art and print placement require approval before sale.';
}
function detail(design,offers,selected){
 selectedOffer=selected||offers[0]||null;
 const title=shortTitle(design);
 $('#collection-detail-title').textContent=title+' '+collection.label;
 const options=$('#collection-detail-views');options.replaceChildren();
 const price=$('#collection-detail-price'),add=$('#collection-detail-add');
 const controls=[];
 function control(label,action,{disabled=false}={}){
  const b=btn(label,()=>{
   if(disabled)return;
   action();
   controls.forEach(v=>v.setAttribute('aria-pressed',String(v===b)));
  },'detail-view-option');
  b.disabled=disabled;b.setAttribute('aria-pressed','false');options.append(b);controls.push(b);return b;
 }
 const art=artworkFor(design);
 const sales=salesIllustration(item,design);
 const salesButton=sales?control('Sales illustration',()=>chooseDetailPhoto(sales.url,'Illustrated product concept. Confirm final size and placement in the actual supplier preview before buying.',title+' illustrated '+collection.label)):null;
 const selectOriginal=()=>chooseDetailPhoto(art,'Original approved pet illustration. This original source is not necessarily a print-ready file for '+collection.label+'.',title+' original artwork');
 if(offers.length){
  let initial=null;
  for(const o of offers){
   const src=safeUrl(o.productPreviewUrl)||safeUrl(o.mockupUrl);
   if(!src)continue;
   const b=control('Actual '+o.variantLabel,()=>{
    selectedOffer=o;
    chooseDetailPhoto(src,'Real Printful '+collection.label+' proof — '+o.variantLabel,o.title+' actual supplier preview');
    price.textContent=money(o.priceCents);add.hidden=false;
   });
   if(o.id===selectedOffer?.id)initial=b;
  }
  control('Original artwork',selectOriginal);
  if(salesButton){salesButton.click();price.textContent=money(selectedOffer.priceCents);add.hidden=false;}
  else if(initial){initial.click();}
  else{selectOriginal();price.textContent=money(selectedOffer.priceCents);add.hidden=false;}
 }else{
  const sizes=conceptSizeOptions(item,collection.sizes);
  const optionsToShow=sizes.length?sizes:[null];
  let first=null;
  for(const size of optionsToShow){
   const b=control(size?'Layout '+size:'Illustrated concept',()=>showDetailConcept(design,size));
   if(!first)first=b;
  }
  control('Original artwork',selectOriginal);
  const pending=control('Real Printful pending',()=>{},{disabled:true});
  pending.title='An actual product-specific Printful proof has not been approved for this design.';
  price.textContent='Product-specific print file and supplier proof pending · not yet available to buy';
  add.hidden=true;add.onclick=null;
  (salesButton||first).click();
 }
 $('#collection-detail').showModal();
}
async function add(offer,control){
 if(isAdding||!readyOffer(offer))return;
 isAdding=true;control.disabled=true;const before=control.textContent;control.textContent='Adding…';
 try{
  await addPremade(offer,{onProgress:message=>{control.textContent=message;}});
  $('#collection-announcement').textContent='Added to cart.';
  if($('#collection-detail').open)$('#collection-detail').close();
 }catch(e){$('#collection-announcement').textContent=e?.message||'Could not add this item. Please try again.';}
 finally{isAdding=false;control.disabled=false;control.textContent=before;}
}
function card(design,allOffers){
 const offers=verifiedByDesign(allOffers,design);
 let offer=offers[0]||null;
 const article=el('article','collection-card'),visual=el('div','collection-card-image'),info=el('div','collection-card-info');
 article.dataset.designId=design.designId;
 article.dataset.offerStatus=offer?'verified':'preview';
 displayPreview(visual,design);
 const name=el('h3',null,shortTitle(design));
 const blanketCheck=item==='blankets'?blanketPrintAudit({width:design.artworkWidth,height:design.artworkHeight},'50 × 60 in'):null;
 const pendingMessage=blanketCheck&&!blanketCheck.fullBleedReady?'High-resolution blanket artwork in preparation':'Real product preview in preparation';
 const note=el('p','collection-card-note',offer?'Verified product · ready to buy':pendingMessage);
 const actions=el('div','collection-card-actions');
 const show=btn(salesIllustration(item,design)?'View gift':offer?'See real product':'See artwork',()=>detail(design,offers,offer),'collection-secondary');
 actions.append(show);
 if(offer){
  const price=el('strong','collection-price',money(offer.priceCents));
  const size=el('select','collection-size');size.setAttribute('aria-label','Choose '+collection.label+' size for '+shortTitle(design));
  for(const o of offers){const option=el('option',null,o.variantLabel);option.value=o.id;size.add(option);}
  const buy=btn('Add to cart',()=>add(offer,buy),'collection-primary');
  size.addEventListener('change',()=>{
   offer=offers.find(o=>o.id===size.value)||offers[0];
   price.textContent=money(offer.priceCents);
   if(!displayPreview(visual,design))photoPreview(visual,offer);
  });
  if(!salesIllustration(item,design)&&!photoPreview(visual,offer))displayPreview(visual,design);
  info.append(name,note,price,size,actions,buy);
 }else{
  info.append(name,note,actions);
 }
 article.append(visual,info);
 return article;
}
function renderCatalog(gallery,offers,{checking=false}={}){
 const designs=collectionDesigns(gallery?.designs);
 const verified=categoryOffers(offers,collection,designs);
 const count=el('span',null,designs.length+' holiday pet designs');
 $('#collection-count').replaceChildren(count);
 for(const pet of ['dog','cat']){
  const list=designs.filter(d=>d.pet===pet);
  const container=$('#collection-'+pet);container.replaceChildren(...list.map(d=>card(d,verified)));
  $('#collection-'+pet+'-count').textContent=list.length+' designs';
 }
 if(!designs.length){
  $('#collection-empty').hidden=false;
  $('#collection-empty').textContent='The artwork gallery is temporarily unavailable. Please check back soon.';
 }
 const unique=new Set(verified.map(o=>o.designId+'|'+o.artworkRevision));
 if(unique.size){
  $('#collection-description').textContent='Shop ready-made Christmas dog and cat '+collection.label.toLowerCase()+'. Choose your favorite design, view the actual product and add it to your cart.';
  $('#collection-sizes').textContent='Available options: '+[...new Set(verified.map(o=>o.variantLabel))].join(' · ');
  $('.collection-note strong').textContent='Christmas gifts, ready to choose';
  $('.collection-note p').textContent='The finished designs below include actual product previews. Choose a favorite and buy it as shown.';
 }
 $('#collection-availability').textContent=checking?'Checking current prices and availability…':unique.size
  ?unique.size+' designs are ready to buy.'+(unique.size<designs.length?' More designs are being prepared.':'')
  :'Artwork previews are available now. Real '+collection.label.toLowerCase()+' print previews and checkout will appear only after supplier approval.';
}
if(collection){
 $('#collection-title').textContent=collection.label;
 $('#collection-tagline').textContent=collection.tagline;
 $('#collection-description').textContent=collection.description;
 $('#collection-sizes').textContent='Planned options: '+collection.sizes.join(' · ');
 $('#collection-nav').replaceChildren(...SHOP_COLLECTIONS.map(c=>{
  const link=el('a',null,c.label);link.href=c.url;
  if(c.slug===collection.slug){link.setAttribute('aria-current','page');}
  return link;
 }));
 const stage=el('div','collection-detail-concept');stage.id='collection-detail-concept';stage.hidden=true;
 $('#collection-detail-image').before(stage);
 $('#close-collection-detail').addEventListener('click',()=>$('#collection-detail').close());
 $('#collection-detail-add').addEventListener('click',()=>{if(selectedOffer)add(selectedOffer,$('#collection-detail-add'));});
 $('#open-cart').onclick=openCart;
 const loading=shopLoading($('#shop-loading'));
 void initialize({launcher:'#open-cart'});

 let active=false;
 async function load(){
  if(active)return;active=true;loading.start(load);
  // Start the live check immediately, but never hold the artwork hostage to it.
  const catalogRequest=readShopCatalog('/api/shop/catalog?product='+encodeURIComponent(collection.offerType));
  const result=catalogRequest.then(catalog=>({catalog}),error=>({error}));
  const gallery=await readShopGallery();
  renderCatalog(gallery,[],{checking:true});document.body.dataset.shopPreview='true';
  const {catalog,error}=await result;
  if(error){loading.fail(load);}else{renderCatalog(gallery,catalog.offers);loading.finish();}
  active=false;
 }
 void load();
}
