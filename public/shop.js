import {nativeAppPlatform} from './app-channel.js?v=1';
if(nativeAppPlatform())document.querySelector('nav.bottom')?.remove();
import {PETS,currentOccasion,matches,readyOffer,readShopFilters,shopFilterQuery} from './shop-model.js';
import {initialize,addPremade,openCart} from './basket.js?v=2';
const $=s=>document.querySelector(s),form=$('#filters');
let offers=[],occasion=currentOccasion(),adding=false;
if(!['christmas','everyday'].includes(occasion))occasion='everyday';
const initial=readShopFilters(location.search,document.body.dataset.collection||occasion);occasion=initial.occasion;
const money=c=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(c/100);
function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
function button(text,fn){const el=node('button',text);el.type='button';el.addEventListener('click',fn);return el;}
function breeds(){const selected=form.elements.breed.value;form.elements.breed.replaceChildren(new Option('All breeds & looks','all'));const pet=form.elements.pet.value;for(const breed of pet==='all'?Object.values(PETS).flat():PETS[pet])form.elements.breed.add(new Option(breed,breed));if([...form.elements.breed.options].some(o=>o.value===selected))form.elements.breed.value=selected;}
async function add(offer,control){
 if(adding)return;adding=true;control.disabled=true;const label=control.textContent;control.textContent='Adding…';$('#shop-announcement').textContent='Saving your finished gift…';
 try{await addPremade(offer);$('#product-detail').close();$('#shop-announcement').textContent=offer.title+' added to your cart.';}
 catch(error){$('#shop-announcement').textContent=error.message;}
 finally{control.disabled=false;control.textContent=label;adding=false;}
}
function render(){
 const filters={...Object.fromEntries(new FormData(form)),occasion};history.replaceState(null,'',`${location.pathname}?${shopFilterQuery({...filters,sort:$('#sort').value})}${location.hash}`);
 const found=offers.filter(o=>matches(o,filters));const sort=$('#sort').value;if(sort!=='featured')found.sort((a,b)=>sort==='price-low'?a.priceCents-b.priceCents:b.priceCents-a.priceCents);
 $('#products').replaceChildren();$('#result-count').textContent=`${found.length} ready-made ${found.length===1?'gift':'gifts'}`;$('#empty').hidden=found.length>0;
 for(const tab of document.querySelectorAll('[data-occasion]'))tab.setAttribute('aria-pressed',String(tab.dataset.occasion===occasion));
 if(offers.length&&!found.length){$('#empty h3').textContent='No gifts match these filters yet.';$('#empty p').textContent='Try another breed, product or collection.';}
 for(const offer of found){
  const card=node('article',null,'product'),img=node('img');img.src=offer.mockupUrl;img.alt=offer.title+' — exact finished product preview';img.loading='lazy';
  const details=node('div',null,'details');details.append(node('h3',offer.title),node('p',`${offer.breed} · ${offer.variantLabel||offer.product}`),node('strong',money(offer.priceCents)));
  const buy=button('Add to cart',()=>add(offer,buy));buy.className='primary';details.append(buy,button('View details',()=>showDetail(offer)));
  img.onerror=()=>{buy.disabled=true;img.alt='Product preview unavailable';};
  const view=button('',()=>showDetail(offer));view.className='image-button';view.setAttribute('aria-label','View '+offer.title);view.append(img);card.append(view,details);$('#products').append(card);
 }
}
function showDetail(offer){$('#detail-title').textContent=offer.title;$('#detail-image').src=offer.mockupUrl;$('#detail-image').alt=offer.title+' finished product preview';$('#detail-variant').textContent=offer.variantLabel||offer.product;$('#detail-price').textContent=money(offer.priceCents);$('#detail-add').onclick=()=>add(offer,$('#detail-add'));$('#product-detail').showModal();}
$('#close-detail').onclick=()=>$('#product-detail').close();$('#sort').onchange=render;$('#open-cart').onclick=openCart;
form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',e=>{if(e.target.name==='pet')breeds();render();});
for(const tab of document.querySelectorAll('[data-occasion]'))tab.onclick=()=>{occasion=tab.dataset.occasion;render();};
$('#reset').onclick=()=>{form.reset();breeds();occasion='all';render();};
form.elements.pet.value=initial.pet;breeds();for(const name of ['breed','product','search'])form.elements[name].value=initial[name];$('#sort').value=initial.sort;
try{const response=await fetch('/api/shop/catalog',{cache:'no-store'});const data=await response.json();if(!response.ok||data.version!==1||!Array.isArray(data.offers))throw Error('Catalog unavailable');offers=data.offers.filter(readyOffer);}
catch{$('#empty h3').textContent='The collection could not load.';$('#empty p').textContent='Please refresh this page to try again.';}
render();await initialize({launcher:'#open-cart'});
