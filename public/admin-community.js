const form=document.querySelector('#review-login'),status=document.querySelector('#review-status'),grid=document.querySelector('#review-posts');let token='',urls=[];
async function api(path,body){const response=await fetch(path,{method:body?'POST':'GET',headers:{authorization:`Bearer ${token}`,'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Owner access required.');return data}
async function load(){
 status.textContent='Loading…';urls.forEach(URL.revokeObjectURL);urls=[];grid.replaceChildren();
 try{
  const {posts}=await api('/api/admin/community');status.textContent=`${posts.length}/300 retained posts · ${posts.filter(p=>p.status==='pending').length}/50 awaiting review. Pending and reported posts first. Remove old rejected posts to free capacity.`;
  for(const post of posts.sort((a,b)=>(b.reports||0)-(a.reports||0)||(a.status==='pending'?-1:1))){
   const card=document.createElement('article');card.className='community-card';const image=document.createElement('img');image.alt=post.styleName;
   const response=await fetch(post.image,{headers:{authorization:`Bearer ${token}`},cache:'no-store'});if(response.ok){image.src=URL.createObjectURL(await response.blob());urls.push(image.src)}
   const body=document.createElement('div');body.className='community-card-body';const title=document.createElement('h2');title.textContent=post.styleName;const info=document.createElement('p');info.textContent=`${post.status} · ${post.reports} reports`;body.append(title,info);
   for(const [label,action,value] of [['Approve','review','approved'],['Reject / hide','review','rejected'],['Delete','remove',null]]){
    const button=document.createElement('button');button.textContent=label;button.onclick=async()=>{if(action==='remove'&&!confirm('Permanently remove this community post?'))return;button.disabled=true;try{await api(`/api/admin/community/${post.id}/${action}`,value?{status:value}:{});await load()}catch(e){status.textContent=e.message;button.disabled=false}};body.append(button);
   }
   card.append(image,body);grid.append(card);
  }
 }catch(e){status.textContent=e.message}
}
form.onsubmit=e=>{e.preventDefault();token=document.querySelector('#review-token').value;document.querySelector('#review-token').value='';load()};
window.addEventListener('pagehide',()=>{urls.forEach(URL.revokeObjectURL);token=''});
