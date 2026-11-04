import {SHOP_COLLECTIONS,collectionBySlug,collectionDesigns,categoryOffers} from './shop-collections.js?v=1';
import {readyOffer} from './shop-model.js?v=4';
import {initialize,addPremade,openCart} from './basket.js?v=3';

const $=selector=>document.querySelector(selector);
const item=($('body')?.dataset?.collection||'').toLowerCase();
const collection=collectionBySlug(item);
const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const btn=(label,action,cls)=>{const n=el('button',cls,label);n.type='button';n.addEventListener('click',action);return n;};
const shortTitle=d=>d.title.replace(/\s+(Christmas Village )?Mug$/i,'').replace(/\s+Mug$/i,'');
const safeUrl=url=>typeof url==='string'&&/^https:\/\//.test(url)?url:null;
const viewImage=(url,alt)=>{const i=el('img');i.src=url;i.alt=alt;i.loading='lazy';i.decoding='async';i.width=480;i.height=480;return i;};
let isAdding=false,selectedOffer=null;
const artworkFor=d=>d.artworkImage;
function verifiedByDesign(offers,design){
 return offers.filter(o=>o.designId===design.designId&&o.artworkRevision===design.artworkRevision&&readyOffer(o));
}
function displayPreview(visual,design){
 const preview=el('div','collection-preview '+(item==='blankets'?'collection-preview--blanket':''));
 if(item==='blankets')preview.style.setProperty('--recast-art','url("'+artworkFor(design)+'")');
 const artwork=el('div','collection-artwork');
 artwork.append(viewImage(artworkFor(design),shortTitle(design)+' original Christmas pet artwork'));
 preview.append(artwork);
 if(item==='blankets'){
  const hem=el('span','collection-hem');
  hem.setAttribute('aria-hidden','true');
  preview.append(hem);
 }
 const label=el('span','collection-preview-label',item==='blankets'?'Illustrative blanket layout':'Original artwork');
 preview.append(label);
 preview.title=item==='blankets'?'Concept composition only; not a Printful-approved blanket mockup':'Art concept. Real product preview not yet verified.';
 visual.replaceChildren(preview);
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
 const image=$('#collection-detail-image');image.src=url;image.alt=alt;
 $('#collection-detail-description').textContent=label;
}
function detail(design,offers,selected){
 selectedOffer=selected||offers[0]||null;
 const title=shortTitle(design);
 $('#collection-detail-title').textContent=title+' '+collection.label;
 const options=$('#collection-detail-views');options.replaceChildren();
 const price=$('#collection-detail-price'),add=$('#collection-detail-add');
 const art=artworkFor(design),artBtn=btn('Original artwork',()=>chooseDetailPhoto(art,'Original artwork — product-specific proof still required',title+' source artwork'),'detail-view-option');
 options.append(artBtn);
 if(offers.length){
  for(const o of offers){
   const src=safeUrl(o.productPreviewUrl)||safeUrl(o.mockupUrl);
   if(!src)continue;
   options.append(btn('Real '+o.variantLabel,()=>{
    selectedOffer=o;
    chooseDetailPhoto(src,'Verified Printful '+collection.label+' — '+o.variantLabel,o.title+' real supplier preview');
    price.textContent=money(o.priceCents);add.hidden=false;
   },'detail-view-option'));
  }
  const photo=selectedOffer&&(safeUrl(selectedOffer.productPreviewUrl)||safeUrl(selectedOffer.mockupUrl));
  if(photo)chooseDetailPhoto(photo,'Verified Printful '+collection.label+' — '+selectedOffer.variantLabel,title+' actual supplier preview');
  else chooseDetailPhoto(art,'Original artwork — supplier image unavailable',title+' source artwork');
  price.textContent=money(selectedOffer.priceCents);add.hidden=false;
 }else{
  const pending=btn('Actual '+collection.label+' pending',()=>{},'detail-view-option');
  pending.disabled=true;pending.title='Available only after a real product and print file are approved';
  options.append(pending);
  chooseDetailPhoto(art,'Original artwork. No real '+collection.label.toLowerCase()+' supplier preview has been approved for this design.',title+' source artwork');
  price.textContent='Print preview pending · not available to buy';
  add.hidden=true;
 }
 $('#collection-detail').showModal();
}
async function add(offer,control){
 if(isAdding||!readyOffer(offer))return;
 isAdding=true;control.disabled=true;const before=control.textContent;control.textContent='Adding…';
 try{
  await addPremade(offer);
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
 const note=el('p','collection-card-note',offer?'Verified product · ready to buy':'Coming soon · real product preview pending');
 const actions=el('div','collection-card-actions');
 const show=btn(offer?'See real product':'See artwork',()=>detail(design,offers,offer),'collection-secondary');
 actions.append(show);
 if(offer){
  const price=el('strong','collection-price',money(offer.priceCents));
  const size=el('select','collection-size');size.setAttribute('aria-label','Choose '+collection.label+' size for '+shortTitle(design));
  for(const o of offers){const option=el('option',null,o.variantLabel);option.value=o.id;size.add(option);}
  const buy=btn('Add to cart',()=>add(offer,buy),'collection-primary');
  size.addEventListener('change',()=>{
   offer=offers.find(o=>o.id===size.value)||offers[0];
   price.textContent=money(offer.priceCents);
   photoPreview(visual,offer);
  });
  if(!photoPreview(visual,offer))displayPreview(visual,design);
  info.append(name,note,price,size,actions,buy);
 }else{
  info.append(name,note,actions);
 }
 article.append(visual,info);
 return article;
}
function renderCatalog(gallery,offers){
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
 $('#collection-availability').textContent=unique.size
  ?unique.size+' designs have verified supplier photos and are ready to buy. Others are still being prepared.'
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
 $('#close-collection-detail').addEventListener('click',()=>$('#collection-detail').close());
 $('#collection-detail-add').addEventListener('click',()=>{if(selectedOffer)add(selectedOffer,$('#collection-detail-add'));});
 $('#open-cart').addEventListener('click',openCart);
 const [gallery,catalog]=await Promise.all([
  fetch('/shop-gallery.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),
  fetch('/api/shop/catalog',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
 ]);
 renderCatalog(gallery,catalog?.version===1?catalog.offers:[]);
 await initialize({launcher:'#open-cart'});
}
