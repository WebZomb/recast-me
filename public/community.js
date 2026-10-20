import {communityAction,readLocal,OWNED} from './community-share.js';
const FAVORITES='recast_community_favorites_v1',HEARTS='recast_community_hearts_v1';
const grid=document.querySelector('#community-grid'),status=document.querySelector('#community-status'),more=document.querySelector('#community-more');
let posts=[],shown=0,sort='new',loadVersion=0;
function toggleLocal(key,id){const old=readLocal(key);const next=old.includes(id)?old.filter(x=>x!==id):[id,...old].slice(0,100);localStorage.setItem(key,JSON.stringify(next));return next.includes(id)}
function card(post){
 const root=document.createElement('article');root.className='community-card';
 const img=document.createElement('img');img.src=post.image;img.alt=`Community Recast in ${post.styleName} style`;img.loading='lazy';
 const body=document.createElement('div');body.className='community-card-body';
 const title=document.createElement('h2');title.textContent=post.styleName;
 const actions=document.createElement('div');actions.className='community-card-actions';
 const heart=document.createElement('button');let liked=readLocal(HEARTS).includes(post.id);heart.textContent=`♡ ${post.hearts}`;heart.setAttribute('aria-label',`Heart ${post.styleName}`);heart.setAttribute('aria-pressed',liked);
 heart.onclick=async()=>{heart.disabled=true;try{await communityAction(`/api/community/${post.id}/heart`,{active:!liked});toggleLocal(HEARTS,post.id);await load()}catch(e){status.textContent=e.message}finally{heart.disabled=false}};
 const save=document.createElement('button');save.textContent=readLocal(FAVORITES).includes(post.id)?'★ Saved':'☆ Save';save.setAttribute('aria-pressed',readLocal(FAVORITES).includes(post.id));
 save.onclick=()=>{try{const active=toggleLocal(FAVORITES,post.id);save.textContent=active?'★ Saved':'☆ Save';save.setAttribute('aria-pressed',active);status.textContent=active?'Saved to Community favorites in this browser.':'Removed from Community favorites.';if(sort==='saved')load()}catch{status.textContent='Your browser could not save this favorite.'}};
 actions.append(heart,save);
 const use=document.createElement('a');use.className='button primary';use.href=`/?style=${encodeURIComponent(post.styleId)}&community=1#start`;use.textContent='Try this style →';
 const report=document.createElement('button');report.className='report';report.textContent='Report';
 report.onclick=async()=>{if(!confirm('Report this picture for a privacy, permission or content concern?'))return;report.disabled=true;try{await communityAction(`/api/community/${post.id}/report`,{});status.textContent='Report sent to the owner for review.'}catch(e){status.textContent=e.message;report.disabled=false}};
 body.append(title,actions,use,report);root.append(img,body);return root;
}
function renderMore(){const batch=posts.slice(shown,shown+20);grid.append(...batch.map(card));shown+=batch.length;more.hidden=shown>=posts.length}
async function load(){
 const sequence=++loadVersion;status.textContent='Loading community…';more.hidden=true;
 try{
  const ids=readLocal(FAVORITES);
  const path=sort==='saved'?`/api/community?ids=${encodeURIComponent(ids.join(','))}`:`/api/community?sort=${sort}`;
  const response=await fetch(path,{cache:'no-store'});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Community could not load.');
  if(sequence!==loadVersion)return;
  posts=sort==='saved'&&!ids.length?[]:data.posts;shown=0;grid.replaceChildren();renderMore();
  status.textContent=posts.length?'':sort==='saved'?'No saved community designs yet. Removed posts will no longer appear here.':'Be among the first to share a Recast. Approved posts will appear here.';
 }catch(e){if(sequence!==loadVersion)return;grid.replaceChildren();status.textContent=e.message}
}
more.onclick=renderMore;
for(const button of document.querySelectorAll('[data-sort]'))button.onclick=()=>{sort=button.dataset.sort;document.querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',b===button));document.querySelector('#community-description').textContent=sort==='popular'?'Top 100 by hearts among designs shared in the last 30 days.':sort==='saved'?'Your community inspiration, separate from My Recasts.':'The latest 100 approved community Recasts.';load()};
document.querySelector('#community-owned').onclick=()=>{
 const dialog=document.createElement('dialog');dialog.className='community-dialog';dialog.setAttribute('aria-label','Manage shared Recasts');
 const heading=document.createElement('h2');heading.textContent='My shared Recasts';dialog.append(heading);
 const note=document.createElement('p');note.textContent='Shared from this browser, including submissions awaiting review. Removing a post stops its display here; copies already saved by others cannot be recalled.';dialog.append(note);
 for(const item of readLocal(OWNED)){
  const row=document.createElement('div');row.className='community-owned-row';const label=document.createElement('span');label.textContent=item.requestId;
  const remove=document.createElement('button');remove.textContent='Remove my post';
  remove.onclick=async()=>{remove.disabled=true;try{await communityAction(`/api/community/${item.id}/remove`,{accessToken:item.accessToken});localStorage.setItem(OWNED,JSON.stringify(readLocal(OWNED).filter(x=>x.id!==item.id)));row.remove();load()}catch(e){note.textContent=e.message;remove.disabled=false}};
  row.append(label,remove);dialog.append(row);
 }
 const close=document.createElement('button');close.textContent='Done';close.onclick=()=>dialog.close();dialog.append(close);dialog.addEventListener('close',()=>dialog.remove());document.body.append(dialog);dialog.showModal();
};
load();
