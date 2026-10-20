export const OWNED='recast_community_owned_v1';
export function readLocal(key){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return []}}
export async function communityAction(path,body){
 const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json','x-recast-request':'1'},body:JSON.stringify(body)});
 const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Please try again.');return d;
}
export function shareWithCommunity(version){
 const dialog=document.createElement('dialog');dialog.className='community-dialog';
 dialog.setAttribute('aria-label','Share with community');
 const title=document.createElement('h2');title.textContent='Share your Recast?';
 const info=document.createElement('p');info.textContent='Your watermarked picture will be publicly visible after review (up to five submissions per network per day). Others can try the same preset style with their own photo. This does not allow them to order gifts with your private artwork. Public pictures can still be copied or saved.';
 const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';
 label.append(check,document.createTextNode('I have permission from everyone pictured and the right to share this image publicly.'));
 const message=document.createElement('p');message.setAttribute('role','status');
 const send=document.createElement('button');send.textContent='Submit for review';send.className='primary';send.disabled=true;
 check.onchange=()=>send.disabled=!check.checked;
 const cancel=document.createElement('button');cancel.textContent='Cancel';cancel.onclick=()=>dialog.close();
 send.onclick=async()=>{
  send.disabled=true;
  try{
   // Test storage before publishing so the owner can retain a removal capability.
   const owned=readLocal(OWNED);localStorage.setItem(OWNED,JSON.stringify(owned));
   const result=await communityAction('/api/community/submit',{requestId:version.requestId,accessToken:version.accessToken,consent:check.checked});
   localStorage.setItem(OWNED,JSON.stringify([{id:result.id,requestId:version.requestId,accessToken:version.accessToken},...owned.filter(x=>x.id!==result.id)].slice(0,300)));
   message.textContent=result.status==='approved'?'Already shared with the community.':result.status==='rejected'?'This submission was not approved. Manage or remove it on the Community page.':'Submitted for review. It is not public yet. Manage or remove it on the Community page.';
   cancel.textContent='Done';send.hidden=true;
  }catch(e){message.textContent=e.message;send.disabled=!check.checked;}
 };
 dialog.append(title,info,label,message,send,cancel);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
