// Reuse the control center's owner authentication; never persist another token.
export function initCommunityReview(api,headers){
 const status=document.querySelector('#community-review-status'),grid=document.querySelector('#community-review-posts'),badge=document.querySelector('#community-pending');
 let generation=0,urls=[];
 function clear(){generation++;urls.forEach(URL.revokeObjectURL);urls=[];grid.replaceChildren();status.textContent='';badge.textContent='—'}
 async function load(){
  clear();const current=generation;status.textContent='Loading submissions…';
  try{
   const {posts}=await api('/api/admin/community');if(current!==generation)return;
   badge.textContent=String(posts.filter(p=>p.status==='pending').length);
   status.textContent=posts.length?`${badge.textContent}/50 awaiting review · ${posts.length}/300 retained posts. Pending and reported posts first.`:'No community submissions yet.';
   const ordered=[...posts].sort((a,b)=>Number(b.status==='pending')-Number(a.status==='pending')||(b.reports||0)-(a.reports||0));
   for(const post of ordered){
    const card=document.createElement('article');card.className='community-review-card';
    const image=document.createElement('img');image.alt=`${post.styleName} — watermarked submission`;
    const body=document.createElement('div');body.className='community-review-body';
    const title=document.createElement('h3');title.textContent=post.styleName;
    const info=document.createElement('p');info.textContent=`${post.status}${post.blocked?' · contributor blocked':''} · ${post.reports||0} reports`;
    const actions=document.createElement('div');actions.className='community-review-actions';
    for(const [label,action,value] of [['Approve','review','approved'],['Reject / hide','review','rejected'],['Delete','remove',null],[post.blocked?'Unblock contributor':'Block contributor',post.blocked?'unban':'ban',null]]){
     const button=document.createElement('button');button.type='button';button.textContent=label;if(value==='approved')button.disabled=true;
     button.onclick=async()=>{
      if(current!==generation)return;
      if(action==='ban'&&!confirm('Block this contributor from Community and hide all their posts? Private artwork and orders are unchanged.'))return;
      if(action==='remove'&&!confirm('Permanently delete this community post? Private artwork and orders are not deleted.'))return;
      actions.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await api(`/api/admin/community/${post.id}/${action}`,{method:'POST',body:value?{status:value}:{}});if(current===generation)await load()}
      catch(e){if(current!==generation)return;status.textContent=e.message;actions.querySelectorAll('button').forEach(b=>b.disabled=false)}
     };actions.append(button);
    }
    body.append(title,info,actions);card.append(image,body);grid.append(card);
    // Fetch only same-origin images using the existing owner credential.
    const src=new URL(post.image,location.origin);
    if(src.origin!==location.origin){info.textContent+=' · Preview unavailable';continue}
    fetch(src.href,{headers:headers(),cache:'no-store'}).then(async response=>{
     if(!response.ok)throw Error('Preview unavailable');const blob=await response.blob();if(current!==generation)return;
     const url=URL.createObjectURL(blob);urls.push(url);image.src=url;image.onload=()=>{if(current===generation)actions.firstElementChild.disabled=false};
    }).catch(()=>{if(current===generation)info.textContent+=' · Preview unavailable';});
   }
  }catch(e){if(current!==generation)return;status.textContent=`Could not load community submissions: ${e.message}`;badge.textContent='!'}
 }
 document.querySelector('#community-refresh').onclick=load;
 window.addEventListener('pagehide',clear);
 return {load,clear};
}
