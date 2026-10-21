import {communityAction,readLocal,OWNED} from './community-share.js';
const FAVORITES='recast_community_favorites_v1';
const grid=document.querySelector('#community-grid'),status=document.querySelector('#community-status'),more=document.querySelector('#community-more');
let posts=[],shown=0,sort='new',loadVersion=0;
let confirmationDialog=null;
// WKWebView cancels window.confirm() when the native shell has no confirm delegate.
// Keep these controls in the page so installed apps and browsers use the same UI.
function confirmCommunityAction(title,message,actionLabel){
 if(confirmationDialog)return Promise.resolve(false);
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');dialog.className='community-dialog community-confirm-dialog';
  dialog.setAttribute('aria-labelledby','community-confirm-title');dialog.setAttribute('aria-describedby','community-confirm-message');
  const heading=document.createElement('h2');heading.id='community-confirm-title';heading.textContent=title;
  const description=document.createElement('p');description.id='community-confirm-message';description.textContent=message;
  const actions=document.createElement('div');actions.className='community-confirm-actions';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel';cancel.autofocus=true;cancel.onclick=()=>dialog.close();
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent=actionLabel;confirm.onclick=()=>dialog.close('confirmed');
  const previousFocus=document.activeElement;
  const finish=confirmed=>{confirmationDialog=null;dialog.remove();if(previousFocus?.isConnected)previousFocus.focus();resolve(confirmed)};
  dialog.addEventListener('close',()=>finish(dialog.returnValue==='confirmed'),{once:true});
  actions.append(cancel,confirm);dialog.append(heading,description,actions);confirmationDialog=dialog;document.body.append(dialog);
  try{dialog.showModal()}catch{finish(false);status.textContent='The confirmation could not open. Please reload Community and try again.'}
 });
}
function showActionStatus(message){status.textContent=message;status.focus()}
function toggleLocal(key,id){const old=readLocal(key);const next=old.includes(id)?old.filter(x=>x!==id):[id,...old].slice(0,100);localStorage.setItem(key,JSON.stringify(next));return next.includes(id)}
function card(post){
 const root=document.createElement('article');root.className='community-card';
 const img=document.createElement('img');img.src=post.image;img.alt=`Community Recast in ${post.styleName} style`;img.loading='lazy';
 const body=document.createElement('div');body.className='community-card-body';
 const title=document.createElement('h2');title.textContent=post.styleName;
 const actions=document.createElement('div');actions.className='community-card-actions';
 const heart=document.createElement('button');const liked=post.liked===true;heart.textContent=`${liked?'♥':'♡'} ${post.hearts}`;heart.setAttribute('aria-label',`Heart ${post.styleName}`);heart.setAttribute('aria-pressed',liked);
 heart.onclick=async()=>{heart.disabled=true;try{await communityAction(`/api/community/${post.id}/heart`,{active:!liked});await load()}catch(e){status.textContent=e.message}finally{heart.disabled=false}};
 const save=document.createElement('button');save.textContent=readLocal(FAVORITES).includes(post.id)?'★ Saved':'☆ Save';save.setAttribute('aria-pressed',readLocal(FAVORITES).includes(post.id));
 save.onclick=()=>{try{const active=toggleLocal(FAVORITES,post.id);save.textContent=active?'★ Saved':'☆ Save';save.setAttribute('aria-pressed',active);status.textContent=active?'Saved to Community favorites in this browser.':'Removed from Community favorites.';if(sort==='saved')load()}catch{status.textContent='Your browser could not save this favorite.'}};
 actions.append(heart,save);
 const use=document.createElement('a');use.className='button primary';use.href=`/?style=${encodeURIComponent(post.styleId)}&community=1#start`;use.textContent='Try this style →';
 const report=document.createElement('button');report.className='report';report.textContent='Report';
 report.onclick=async()=>{if(!await confirmCommunityAction('Report this picture?','Send this picture to the owner for review of a privacy, permission or content concern.','Send report'))return;report.disabled=true;try{await communityAction(`/api/community/${post.id}/report`,{});showActionStatus('Report sent to the owner for review.')}catch(e){report.disabled=false;showActionStatus(e.message)}};
 const block=document.createElement('button');block.className='report';block.textContent='Block contributor';
 block.onclick=async()=>{if(!await confirmCommunityAction('Block this contributor?','Hide this contributor’s Community posts from your view. Posts from a shared network may also be hidden. Your private pictures and orders stay available.','Block contributor'))return;block.disabled=true;try{await communityAction(`/api/community/${post.id}/block`,{});await load();showActionStatus('Contributor blocked. Their posts are hidden from your Community view.')}catch(e){block.disabled=false;showActionStatus(e.message)}};
 body.append(title,actions,use,report,block);root.append(img,body);return root;
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
