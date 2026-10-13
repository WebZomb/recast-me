import {savedRecasts,removeRecast,productLink,COLLECTION_LIMIT} from './recast-collection.js?v=1';
const list=document.querySelector('#library-grid');
const status=document.querySelector('#library-status');
function render(){
 list.replaceChildren();
 const rows=savedRecasts();
 status.textContent=rows.length+' of '+COLLECTION_LIMIT+' favorites saved on this browser.';
 if(!rows.length){const p=document.createElement('p');p.className='library-empty';p.textContent='No saved favorites yet. Create a picture, then choose “Save to My Recasts” under More options.';list.append(p);return}
 for(const item of rows){
  const card=document.createElement('article');card.className='library-card';
  const thumb=document.createElement('div');thumb.className='library-thumb';
  const placeholder=document.createElement('p');placeholder.textContent='Loading protected preview…';thumb.append(placeholder);
  const details=document.createElement('div');details.className='library-copy';
  const name=document.createElement('h2');name.textContent=item.styleName||'Saved Recast';
  const id=document.createElement('small');id.textContent=item.requestId;
  const actions=document.createElement('div');actions.className='library-actions';
  const use=document.createElement('a');use.className='button primary';use.href=productLink(item);use.textContent='Put on a product →';
  const remove=document.createElement('button');remove.type='button';remove.className='button ghost';remove.textContent='Remove from favorites';
  remove.addEventListener('click',()=>{if(confirm('Remove this favorite shortcut from this browser? Existing paid orders remain.')){removeRecast(item.requestId);render()}});
  actions.append(use,remove);details.append(name,id,actions);card.append(thumb,details);list.append(card);
  // Only the owner of the private link can retrieve the protected watermarked preview.
  const observer=new IntersectionObserver(entries=>{
   if(!entries[0]?.isIntersecting)return;
   observer.disconnect();
   const params=new URLSearchParams({token:item.accessToken});
   fetch('/api/request/'+encodeURIComponent(item.requestId)+'/preview?'+params,{cache:'no-store',referrerPolicy:'no-referrer'})
    .then(r=>r.ok?r.json():Promise.reject(Error('unavailable'))).then(body=>{
      if(!card.isConnected)return;
      if(!body?.ok||body.watermarked!==true||!String(body.image||'').startsWith('data:image/'))throw Error('invalid');
      const img=document.createElement('img');img.src=body.image;img.alt='Watermarked '+(item.styleName||'Recast')+' portrait';
      thumb.replaceChildren(img);
    }).catch(()=>{if(card.isConnected)placeholder.textContent='Picture not available. Your private server link may have expired or been deleted.'});
  },{rootMargin:'120px'});
  observer.observe(thumb);
 }
}
render();
