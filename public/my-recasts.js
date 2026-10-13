import {savedRecasts,removeRecast,productLink,COLLECTION_LIMIT} from './recast-collection.js?v=1';
import {privateRecastLink} from './recast-history.js';
import {protectedPreviewFile} from './preview-export.js';

const list=document.querySelector('#library-grid');
const status=document.querySelector('#library-status');
const el=(tag,className,copy)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(copy!==undefined)node.textContent=copy;
  return node;
};
function privateOrderLink(item){
  const params=new URLSearchParams({requestId:item.requestId,token:item.accessToken});
  return '/order.html?'+params.toString();
}
function protectedPreviewLink(item){
  return privateRecastLink(location.origin,item);
}
async function shareWatermarked(item,button,message){
  if(button.disabled)return;
  button.disabled=true;button.textContent='Preparing preview…';
  message.textContent='Preparing your protected watermarked picture…';
  try{
    // Only the server-flattened, WATERMARKED JPEG may be shared or downloaded.
    const result=await protectedPreviewFile(item);
    const files=[result.file];
    if(navigator.canShare?.({files})){
      try{
        await navigator.share({files,title:'My Recast',text:'Made with @RecastMeAi'});
        message.textContent='Watermarked preview shared. Your private link stays private.';
      }catch(error){
        if(error?.name==='AbortError'){message.textContent='Sharing canceled. Your picture is still here.';return;}
        // Some embedded browsers cannot share files; fall back to watermarked download.
        downloadPreview(result.file);
        message.textContent='Watermarked preview download started. Your private link stays private.';
      }
    }else{
      downloadPreview(result.file);
      message.textContent='Watermarked preview download started. Your private link stays private.';
    }
  }catch(error){
    message.textContent=error?.message||'Could not prepare the watermarked preview.';
  }finally{button.disabled=false;button.textContent='Share preview';}
}
function downloadPreview(file){
  const url=URL.createObjectURL(file);
  const link=document.createElement('a');link.href=url;link.download=file.name;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function copyText(value,message,label){
  try{
    await navigator.clipboard.writeText(value);
    message.textContent=label+' copied. Keep private artwork links to yourself.';
  }catch{
    // Clipboard permissions sometimes fail in embedded browsers. Make a field
    // selectable only after the user explicitly chooses to copy their private link.
    const field=el('input','library-copy-fallback');
    field.value=value;field.readOnly=true;field.setAttribute('aria-label','Select and copy '+label);
    message.replaceChildren(el('span','','Copy this private value: '),field);
    field.focus();field.select();
  }
}
function render(){
  list.replaceChildren();
  const rows=savedRecasts();
  status.textContent=rows.length+' of '+COLLECTION_LIMIT+' favorites saved in this browser.';
  if(!rows.length){
    list.append(el('p','library-empty','No saved favorites yet. Create a picture and tap Save beneath its preview.'));
    return;
  }
  for(const item of rows){
    const card=el('article','library-card');
    const thumb=el('div','library-thumb');
    const imageLink=el('a','library-preview-link');
    imageLink.href=protectedPreviewLink(item);
    imageLink.setAttribute('aria-label','Open saved '+(item.styleName||'Recast')+' watermarked preview');
    const placeholder=el('p','library-image-status','Loading protected preview…');
    imageLink.append(placeholder);thumb.append(imageLink);
    const details=el('div','library-copy');
    const name=el('h2','',item.styleName||'Saved Recast');
    const id=el('small','artwork-code',item.requestId);
    id.title='Individual artwork reference';
    const actions=el('div','library-actions');
    const use=el('a','button primary','Use on a Product →');
    use.href=productLink(item);
    use.setAttribute('aria-label','Use saved artwork '+item.requestId+' on a product without creating it again');
    const options=el('details','library-more-options');
    const toggle=el('summary','','More options');
    const panel=el('div','library-more-panel');
    const note=el('p','library-action-status');
    note.setAttribute('role','status');note.setAttribute('aria-live','polite');

    const share=el('button','library-more-action','Share preview');
    share.type='button';
    share.addEventListener('click',()=>shareWatermarked(item,share,note));

    const open=el('a','library-more-action','Open saved picture');
    open.href=protectedPreviewLink(item);

    const copyLink=el('button','library-more-action','Copy private link');
    copyLink.type='button';
    copyLink.addEventListener('click',()=>copyText(protectedPreviewLink(item),note,'Private link'));

    const copyID=el('button','library-more-action','Copy Artwork ID');
    copyID.type='button';
    copyID.addEventListener('click',()=>copyText(item.requestId,note,'Artwork ID'));

    const privacy=el('a','library-more-action','Artwork & privacy');
    privacy.href=privateOrderLink(item);
    privacy.setAttribute('rel','noreferrer');

    const remove=el('button','library-more-action library-remove-button','Remove from favorites');
    remove.type='button';
    remove.addEventListener('click',()=>{
      if(confirm('Remove this favorite from this browser? Paid orders are not affected.')){
        removeRecast(item.requestId);render();
      }
    });
    panel.append(share,open,copyLink,copyID,privacy,remove,note);
    options.append(toggle,panel);
    actions.append(use,options);
    details.append(name,id,actions);
    card.append(thumb,details);
    list.append(card);

    const loadPreview=()=>{
      const params=new URLSearchParams({token:item.accessToken});
      fetch('/api/request/'+encodeURIComponent(item.requestId)+'/preview?'+params,{
        cache:'no-store',referrerPolicy:'no-referrer'
      }).then(r=>r.ok?r.json():Promise.reject(Error('unavailable'))).then(body=>{
        if(!card.isConnected)return;
        if(!body?.ok||body.watermarked!==true||
           !String(body.image||'').startsWith('data:image/'))throw Error('invalid');
        const img=el('img');
        img.src=body.image;
        img.alt='Watermarked '+(item.styleName||'Recast')+' portrait';
        img.loading='lazy';img.decoding='async';
        imageLink.replaceChildren(img);
      }).catch(()=>{
        if(card.isConnected)placeholder.textContent='Preview unavailable. Your private artwork may have expired or been deleted.';
      });
    };
    if('IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{
        if(!entries[0]?.isIntersecting)return;
        observer.disconnect();loadPreview();
      },{rootMargin:'120px'});
      observer.observe(thumb);
    }else loadPreview();
  }
}
render();
