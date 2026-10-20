import {change,read,hash,sameOrigin,privateJson,fault,equal} from './commerce-store.js';
const KEY='community/v1/index.json';
const ID=/^[a-f0-9]{32}$/;
const clean=row=>({id:row.id,styleId:row.styleId,styleName:row.styleName,createdAt:row.createdAt,hearts:row.voters.length,image:`/api/community/${row.id}/image`});
// Signed, HttpOnly identity preserves the original network vote across network changes.
// This is anonymous deduplication, not proof of a unique person across devices.
async function heartIdentity(request,env) {
 if(!env.ADMIN_TOKEN)return null;
 const ip=request.headers.get('cf-connecting-ip');if(!ip)return null;
 const sign=async value=>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.ADMIN_TOKEN),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('community-heart-v1:'+value)))].map(b=>b.toString(16).padStart(2,'0')).join('');
 };
 const cookie=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-recast-heart='))?.slice(20);
 if(cookie&&/^[a-f0-9]{32}\.[a-f0-9]{64}$/.test(cookie)){
  const [id,signature]=cookie.split('.');if(equal(signature,await sign(id)))return {id};
 }
 const id=(await hash(`${env.ADMIN_TOKEN}:community:${ip}`)).slice(0,32);
 return {id,cookie:`__Host-recast-heart=${id}.${await sign(id)}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=31536000`};
}
export function selectCommunity(rows,mode='new',now=Date.now()) {
 const approved=rows.filter(r=>r.status==='approved');
 const pool=mode==='popular'?approved.filter(r=>Date.parse(r.createdAt)>now-30*86400000):approved;
 return pool.sort((a,b)=>mode==='popular'?(b.voters.length-a.voters.length||b.createdAt.localeCompare(a.createdAt)):b.createdAt.localeCompare(a.createdAt)).slice(0,100).map(clean);
}
export async function communityRoutes(request,env,{authorize,preview,admin}) {
 const u=new URL(request.url),path=u.pathname;
 if(!path.startsWith('/api/community')&&!path.startsWith('/api/admin/community'))return null;
 try {
  const isAdmin=path.startsWith('/api/admin/community');
  const identity=!isAdmin?await heartIdentity(request,env):null;
  const reply=data=>privateJson(data,200,identity?.cookie?{'set-cookie':identity.cookie}:{});
  if(isAdmin)admin(request,env);
  if(!env.ARTWORK)throw fault('unavailable','Community is temporarily unavailable.',503);
  const mutate=fn=>change(env,KEY,{rows:[]},state=>{fn(state.rows,state);if(JSON.stringify(state).length>4000000)throw fault('capacity','Community is at capacity. Please try again later.',503);return state});
  if(request.method!=='GET') {
   sameOrigin(request);
   if(!isAdmin){
    if(!env.SUBJECT_RATE_LIMITER?.limit)throw fault('unavailable','Community sharing is temporarily unavailable.',503);
    const ip=request.headers.get('cf-connecting-ip');
    if(!ip)throw fault('unavailable','Please try again from the website.',403);
    if(!(await env.SUBJECT_RATE_LIMITER.limit({key:`community:${ip}`})).success)throw fault('rate','Please wait a minute before trying again.',429);
   }
  }
  let state=await read(env,KEY)||{rows:[]};
  const sources=row=>[row.submitter,row.networkSubmitter].filter(Boolean);
  const banned=(row,s=state)=>sources(row).some(id=>(s.blockedSubmitters||[]).includes(id));
  const hidden=row=>banned(row)||sources(row).some(id=>(state.viewerBlocks?.[identity?.id]||[]).includes(id));
  if(path==='/api/community'&&request.method==='GET') {
   const mode=u.searchParams.get('sort')==='popular'?'popular':'new';
   const ids=u.searchParams.get('ids');
   const visible=state.rows.filter(r=>!hidden(r));
   const rows=ids?visible.filter(r=>r.status==='approved'&&ids.split(',').slice(0,100).includes(r.id)).map(clean):selectCommunity(visible,mode);
   return reply({ok:true,posts:rows.map(post=>({...post,liked:!!identity&&state.rows.find(r=>r.id===post.id).voters.includes(identity.id)}))});
  }
  if(path==='/api/admin/community'&&request.method==='GET')return privateJson({ok:true,posts:state.rows.map(r=>({...clean(r),status:r.status,blocked:banned(r),reports:r.reports||0,image:`/api/admin/community/${r.id}/image`}))});
  if(request.method==='GET') {
   const m=path.match(/^\/api\/(?:admin\/)?community\/([a-f0-9]{32})\/image$/);
   const row=m&&state.rows.find(r=>r.id===m[1]&&(isAdmin||(r.status==='approved'&&!hidden(r))));
   if(!row)return privateJson({error:'Image unavailable.'},404);
   const image=await env.ARTWORK.get(`community/v1/images/${row.id}.jpg`);
   if(!image)return privateJson({error:'Image unavailable.'},404);
   return new Response(image.body,{headers:{'content-type':'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }
  if(Number(request.headers.get('content-length'))>4096)throw fault('size','Request too large.',413);
  const text=await request.text();if(text.length>4096)throw fault('size','Request too large.',413);
  let body;try{body=JSON.parse(text)}catch{throw fault('body','Invalid request.',400)}
  if(path==='/api/community/submit'&&request.method==='POST') {
   if(body.consent!==true)throw fault('consent','Please confirm permission to share publicly.',400);
   if(!/^RC-[A-Z0-9-]{8,60}$/.test(body.requestId||''))throw fault('id','Choose a saved Recast.',400);
   const meta=await authorize(env,body.requestId,body.accessToken);
   if(!/^[a-z0-9-]{1,60}$/.test(meta.styleId||'')||['custom','original','original-photo'].includes(meta.styleId))throw fault('style','Community currently supports preset Recast styles. Your private photo stays in My Recasts.',400);
   if(!env.ADMIN_TOKEN)throw fault('unavailable','Community sharing is temporarily unavailable.',503);
   if(!identity)throw fault('identity','Please reload Community before sharing.',403);
   const networkSubmitter=(await hash(`${env.ADMIN_TOKEN}:community-submit:${request.headers.get('cf-connecting-ip')}`)).slice(0,32);
   const submitter=(await hash(`${env.ADMIN_TOKEN}:community-author:${identity.id}`)).slice(0,32);
   if(banned({submitter,networkSubmitter}))throw fault('blocked','Community sharing is blocked for this contributor. Contact support if you believe this is a mistake.',403);
   const today=new Date().toISOString().slice(0,10);
   const existing=state.rows.find(r=>r.requestId===body.requestId);
   if(existing)return privateJson({ok:true,id:existing.id,status:existing.status});
   if(state.rows.length>=300||state.rows.filter(r=>r.status==='pending').length>=50)throw fault('queue','The community review queue is full. Please try again later.',503);
   // Generated on the server from the authenticated artwork, never client image bytes.
   const bytes=await preview(env,body.requestId);
   const id=crypto.randomUUID().replaceAll('-','');
   await env.ARTWORK.put(`community/v1/images/${id}.jpg`,bytes,{httpMetadata:{contentType:'image/jpeg'}});
   let selected=id;
   try {await mutate((rows,current)=>{
    if(banned({submitter,networkSubmitter},current))throw fault('blocked','Community sharing is blocked for this contributor.',403);
    selected=id; // Reset attempt-local result when a conditional write retries.
    const duplicate=rows.find(r=>r.requestId===body.requestId);
    if(duplicate){selected=duplicate.id;return}
    if(rows.filter(r=>(r.submitter===submitter||r.submitter===networkSubmitter||r.networkSubmitter===networkSubmitter)&&r.createdAt.startsWith(today)).length>=5)throw fault('daily','You can submit up to five Recasts per network each day. Please try again tomorrow.',429);
    if(rows.length>=300||rows.filter(r=>r.status==='pending').length>=50)throw fault('queue','The community review queue is full.',503);
    rows.push({id,submitter,networkSubmitter,consentVersion:1,requestId:body.requestId,styleId:meta.styleId,styleName:String(meta.styleName||'Recast').slice(0,80),createdAt:new Date().toISOString(),status:'pending',voters:[],reporters:[],reports:0});
   })}catch(e){await env.ARTWORK.delete(`community/v1/images/${id}.jpg`);throw e}
   if(selected!==id)await env.ARTWORK.delete(`community/v1/images/${id}.jpg`);
   return reply({ok:true,id:selected,status:state.rows.find(r=>r.id===selected)?.status||'pending'});
  }
  const match=path.match(/^\/api\/(?:admin\/)?community\/([a-f0-9]{32})\/(heart|report|remove|review|block|ban|unban)$/);
  if(!match||!ID.test(match[1])||request.method!=='POST')return privateJson({error:'Not found.'},404);
  const [,id,action]=match;
  const row=state.rows.find(r=>r.id===id);if(!row)throw fault('missing','This post is no longer available.',404);
  if(action==='ban'||action==='unban'){
   if(!isAdmin)throw fault('auth','Owner review required.',403);
   await mutate((rows,current)=>{
    const target=rows.find(r=>r.id===id);if(!target)throw fault('missing','Post removed.',404);
    const ids=sources(target);const blocked=new Set(current.blockedSubmitters||[]);
    for(const source of ids){if(action==='ban')blocked.add(source);else blocked.delete(source)}
    if(blocked.size>2000)throw fault('capacity','Contributor block list is at capacity. Contact support.',503);
    current.blockedSubmitters=[...blocked];
    // Unblocking never automatically republishes previously hidden content.
    if(action==='ban')for(const post of rows)if(sources(post).some(x=>blocked.has(x)))post.status='rejected';
   });
  }else if(action==='block'){
   if(isAdmin||!identity)throw fault('identity','Please reload Community before blocking.',403);
   if(row.status!=='approved'||banned(row))throw fault('missing','Post unavailable.',404);
   await mutate((rows,current)=>{
    const target=rows.find(r=>r.id===id);if(!target||target.status!=='approved')throw fault('missing','Post unavailable.',404);
    const map=current.viewerBlocks||(current.viewerBlocks={});
    if(!map[identity.id]&&Object.keys(map).length>=5000)throw fault('capacity','Blocking is temporarily at capacity. Please report this post.',503);
    const blocked=new Set(map[identity.id]||[]);sources(target).forEach(source=>blocked.add(source));
    if(blocked.size>600)throw fault('capacity','Your block list is full. Please contact support.',503);
    map[identity.id]=[...blocked];
   });
  }else if(action==='review'){
   if(!isAdmin)throw fault('auth','Owner review required.',403);
   if(!['approved','rejected'].includes(body.status))throw fault('status','Choose approve or reject.',400);
   await mutate((rows,current)=>{const r=rows.find(r=>r.id===id);if(!r)throw fault('missing','Post removed.',404);if(r.status==='removed')throw fault('missing','The picture was removed. Only the contributor block reference remains.',404);if(body.status==='approved'&&banned(r,current))throw fault('blocked','Unblock this contributor before reviewing their posts.',409);r.status=body.status});
  }else if(action==='remove'){
   if(!isAdmin)await authorize(env,row.requestId,body.accessToken);
   await mutate((rows,current)=>{const i=rows.findIndex(r=>r.id===id);if(i>=0){if(banned(rows[i],current))rows[i].status='removed';else rows.splice(i,1)}});
   await env.ARTWORK.delete(`community/v1/images/${id}.jpg`);
  }else{
   if(row.status!=='approved')throw fault('missing','This post is no longer available.',404);
   if(!env.ADMIN_TOKEN)throw fault('unavailable','Community reactions are temporarily unavailable.',503);
   const voter=action==='heart'?identity?.id:(await hash(`${env.ADMIN_TOKEN}:community:${request.headers.get('cf-connecting-ip')}`)).slice(0,32);
   if(!voter)throw fault('identity','Please reload Community before reacting.',403);
   await mutate(rows=>{
    const r=rows.find(r=>r.id===id);if(!r||r.status!=='approved')throw fault('missing','Post unavailable.',404);
    const key=action==='heart'?'voters':'reporters';
    if(action==='heart'&&body.active===false)r.voters=r.voters.filter(v=>v!==voter);
    else if(!r[key].includes(voter)){
     if(r[key].length>=2000)throw fault('capacity','Reactions are temporarily at capacity.',503);
     r[key].push(voter);
    }
    if(action==='report')r.reports=r.reporters.length;
   });
  }
  return reply({ok:true});
 }catch(e){return privateJson({ok:false,error:e.status?e.message:'Community is temporarily unavailable. Please try again.'},e.status||503)}
}
