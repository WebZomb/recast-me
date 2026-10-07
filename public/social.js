const id=new URLSearchParams(location.search).get('share')||'';
const status=document.querySelector('#request-id'),error=document.querySelector('#share-error');
async function openRecast(){
  if(!/^[a-f0-9]{40}$/.test(id))throw new Error('Open the link under your Recast picture to view your artwork.');
  const response=await fetch(`/api/social/${id}`),artwork=await response.json();
  if(!response.ok||!artwork.ok)throw new Error(artwork.error||'This Recast is unavailable.');
  document.querySelector('#share-title').textContent=`Your ${artwork.styleName} Recast.`;
  const image=document.querySelector('#share-image');image.src=artwork.image;image.hidden=false;
  status.textContent=`Artwork ID: ${artwork.requestId}`;
  // Purchase-only share capability: never expose the owner's source/recovery token.
  window.__recastActiveRequest={requestId:artwork.requestId,shareId:id};
  document.dispatchEvent(new CustomEvent('recast-artwork-selected'));
}
openRecast().catch(e=>{error.textContent=e.message;status.textContent='';});
