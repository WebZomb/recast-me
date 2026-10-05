const deploymentLabel=document.querySelector('#deployment-identity');
if(deploymentLabel)deploymentLabel.textContent=`${location.hostname==='recast-me.sergz24.workers.dev'?'Production':'Preview / alternate host'} · ${location.hostname} · RM-022`;
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const tokenKey='recast_admin_token';let token=sessionStorage.getItem(tokenKey)||'';
function headers(json=false){return{Authorization:`Bearer ${token}`,...(json?{'content-type':'application/json'}:{})}}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),4500)}
async function api(path,{method='GET',body}={}){const r=await fetch(path,{method,headers:headers(body!==undefined),body:body!==undefined?JSON.stringify(body):undefined});const data=await r.json().catch(()=>({}));if(!r.ok||data.ok===false)throw new Error(data.error||`Request failed (${r.status})`);return data}
function statusPill(status){const v=String(status||'unknown');const kind=/submitted|ready|completed|paid/i.test(v)?'good':/hold|review|await|needs|draft/i.test(v)?'warn':/fail|error|reject/i.test(v)?'bad':'';return `<span class="pill ${kind}">${v.replaceAll('_',' ')}</span>`}
function empty(text){return `<div class="empty">${text}</div>`}
function escapeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadRenderReadiness(){
  const d=await api('/api/admin/render-readiness');
  const root=document.querySelector('#render-readiness');
  root.replaceChildren();
  const title=document.createElement('h3');title.textContent='Image rendering and X readiness';
  const note=document.createElement('p');note.textContent=d.render.reason==='quota'?'Cloudflare rejected the last render because its shared free AI allowance is exhausted. Enable Workers Paid in Cloudflare billing, then try a real photo again. Deploying an update or changing a visitor limit will not lift provider error 3036.':`Last render: ${d.render.lastResult||'not verified'}. Binding presence alone does not prove the model can render.`;
  const last=document.createElement('p');last.textContent=`Last check: ${d.render.checkedAt||'none'} · Customer daily cap: none configured`;
  const social=document.createElement('p');social.textContent=Object.entries(d.social).map(([k,v])=>`${k}: ${v?'ready':'not ready'}`).join(' · ');
  root.append(title,note,last,social);
}

async function loadStatus(){const d=await api('/api/admin/status');$('#stat-jobs').textContent=d.jobs.total;$('#stat-awaiting').textContent=`${d.jobs.awaiting} awaiting action`;$('#stat-trends').textContent=d.trends.review;$('#stat-x').textContent=d.xRequests;$('#stat-x-connection').textContent=d.connections.x?'X credentials connected':'Bot disabled until connected';$('#stat-printful').textContent=d.connections.printful?'Connected':'Not ready';$('#stat-generation').textContent=d.generationErrors?.total??0;$('#stat-generation-recent').textContent=`${d.generationErrors?.recent??0} in the last 24h`;$('#system-list').innerHTML=[...Object.entries(d.connections).filter(([k])=>k!=='admin').map(([k,v])=>`<article class="glass system-item"><div class="connection"><i class="dot ${v?'good':'off'}"></i><strong>${k[0].toUpperCase()+k.slice(1)}</strong></div><span class="muted">${v?'Configured · not yet tested':'Not configured'}</span></article>`),...Object.entries(d.automation||{}).map(([k,v])=>`<article class="glass system-item"><div class="connection"><i class="dot ${v?'good':'off'}"></i><strong>${k}</strong></div><span class="muted">${v?'Enabled':'Safely off'}</span></article>`)].join('')}
async function loadGenerationErrors(){const d=await api('/api/admin/generation-errors');const list=$('#generation-errors-list');if(!d.errors.length){list.innerHTML=empty('No generation errors have been recorded since v1.0.1.');return}list.innerHTML=d.errors.map(x=>`<article class="glass op-card"><div class="op-top"><div><div class="op-title">${x.diagnosticId||'Generation error'}</div><div class="op-meta">${statusPill(x.reason)}${x.providerCode?`<span class="pill">Provider ${x.providerCode}</span>`:''}<span class="pill">${x.stage||'unknown stage'}</span></div></div><div class="muted">${x.createdAt?new Date(x.createdAt).toLocaleString():''}</div></div><div class="op-body">Primary: ${x.primary||'—'}<br>Fallback: ${x.fallback||'—'}${x.providerMessage?`<br><span class="muted">${String(x.providerMessage).replaceAll('<','&lt;').replaceAll('>','&gt;')}</span>`:''}</div></article>`).join('')}
async function loadJobs(){const d=await api('/api/admin/jobs');const list=$('#jobs-list');if(!d.jobs.length){list.innerHTML=empty('No fulfillment jobs yet. Paid Recast orders will appear here after a sync.');return}list.innerHTML=d.jobs.map(j=>`<article class="glass op-card"><div class="op-top"><div><div class="op-title">${j.orderName||j.id} · ${j.product||j.sku}</div><div class="op-meta">${statusPill(j.status)}<span class="pill">${j.sku}</span><span class="pill">Artwork ${j.requestId}</span></div></div><div class="muted">${j.createdAt?new Date(j.createdAt).toLocaleString():''}</div></div><div class="op-body">${j.digital?'Digital fulfillment':'Physical production'} · Qty ${j.quantity||1}${j.printfulOrderId?` · Printful #${j.printfulOrderId}`:''}</div><div class="op-actions">${!j.artApprovedAt?`<button data-job="${j.id}" data-action="approve-art">Approve artwork</button>`:''}${j.artApprovedAt&&!j.digital&&!j.printReadyAt?`<button data-job="${j.id}" data-action="finalize-art">Prepare high-res print</button>`:''}${j.printReadyAt&&!j.printfulOrderId&&!j.digital?`<button data-job="${j.id}" data-action="create-draft">Create Printful draft</button>`:''}${j.printfulOrderId&&!j.sentToProductionAt?`<button class="danger" data-job="${j.id}" data-action="send-production">Send to production</button>`:''}<button class="secondary" data-job="${j.id}" data-action="hold">Hold</button></div></article>`).join('');$$('[data-job]').forEach(b=>b.onclick=()=>jobAction(b.dataset.job,b.dataset.action))}
async function loadSocial(){const d=await api('/api/admin/social');$('#social-list').innerHTML=d.requests.length?d.requests.map(x=>`<article class="glass op-card"><div class="op-title">X mention ${escapeText(x.tweetId)}</div><div class="op-meta">${statusPill(x.replyStatus)}<span class="pill">${escapeText(x.authorId||'unknown user')}</span></div><div class="op-body">${escapeText(x.requestText)}<br><span class="muted">${escapeText(x.link)}${x.error?`<br>${escapeText(x.error)}`:''}${x.retryAt?`<br>Next attempt: ${escapeText(x.retryAt)}`:''}${x.replyStatus==='delivery_unknown'?'<br>Check the original X thread before taking any further action; automatic resend is paused to prevent duplicates.':''}</span></div></article>`).join(''):empty('No X requests yet. Connect X API access and approval to begin.')}
async function loadTrends(){const d=await api('/api/admin/trends');const rows=d.trends.filter(x=>x.status==='review'||x.decision==='needs-human-approval');$('#trends-list').innerHTML=rows.length?rows.map(x=>`<article class="glass op-card"><div class="op-top"><div><div class="op-title">${x.name}</div><div class="op-meta">${statusPill(x.status)}<span class="pill">Rank ${x.rank||'—'}</span><span class="pill">${x.source||''}</span></div></div></div><div class="op-body">Held for human review; it will not be auto-published or auto-productized.</div><div class="op-actions"><button data-trend="${x.id}" data-trend-action="approve">Approve idea</button><button class="danger" data-trend="${x.id}" data-trend-action="reject">Reject</button></div></article>`).join(''):empty('Nothing needs your approval right now.');$$('[data-trend]').forEach(b=>b.onclick=()=>trendAction(b.dataset.trend,b.dataset.trendAction))}
async function refresh(){try{await Promise.all([loadStatus(),loadJobs(),loadSocial(),loadTrends(),loadGenerationErrors(),loadRenderReadiness()])}catch(e){if(/authorization/i.test(e.message)){lock();$('#login-error').textContent=e.message;$('#login-error').classList.remove('hidden')}else toast(e.message)}}
async function jobAction(id,action){try{let body={};if(action==='send-production'){if(!confirm('This will submit the Printful draft for paid production. Continue?'))return;body={confirm:'SEND_TO_PRODUCTION'}}if(action==='hold'){const reason=prompt('Reason for hold?','Manual review');if(reason===null)return;body={reason}}await api(`/api/admin/job/${encodeURIComponent(id)}/${action}`,{method:'POST',body});toast(action==='send-production'?'Submitted to Printful production.':'Job updated.');await Promise.all([loadStatus(),loadJobs()])}catch(e){toast(e.message)}}
async function trendAction(id,action){try{await api(`/api/admin/trend/${encodeURIComponent(id)}/${action}`,{method:'POST',body:{}});toast(action==='approve'?'Trend idea approved.':'Trend idea rejected.');await Promise.all([loadStatus(),loadTrends()])}catch(e){toast(e.message)}}
function unlock(){sessionStorage.setItem(tokenKey,token);$('#login-card').classList.add('hidden');$('#dashboard').classList.remove('hidden');refresh()}
function lock(){sessionStorage.removeItem(tokenKey);token='';$('#dashboard').classList.add('hidden');$('#login-card').classList.remove('hidden');$('#admin-token').value=''}
$('#admin-login').onsubmit=e=>{e.preventDefault();token=$('#admin-token').value.trim();if(token)unlock()};$('#lock-admin').onclick=lock;$('#refresh-all').onclick=refresh;
$('#sync-orders').onclick=async()=>{try{const d=await api('/api/admin/sync-orders',{method:'POST',body:{}});toast(`Order sync complete · ${d.created||0} new jobs.`);refresh()}catch(e){toast(e.message)}};
$('#poll-x').onclick=async()=>{try{const d=await api('/api/admin/poll-x',{method:'POST',body:{}});toast(d.disabled?'X bot needs configuration.':d.busy?'X requests are already processing.':`X checked · ${d.found||0} new requests · ${d.processed||0} jobs processed.`);refresh()}catch(e){toast(e.message)}};
$('#scan-trends').onclick=async()=>{try{const d=await api('/api/admin/scan-trends',{method:'POST',body:{}});toast(d.disabled?'Trend scanner is disabled.':`Trend scan saved ${d.saved||0} ideas.`);refresh()}catch(e){toast(e.message)}};
$$('.admin-tabs button').forEach(b=>b.onclick=()=>{$$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===b.dataset.tab))});
if(token)unlock();

let recoveryCursor=null,recoveryRange=null;
const recoveryDate=new Date();$('#recovery-date').value=`${recoveryDate.getFullYear()}-${String(recoveryDate.getMonth()+1).padStart(2,'0')}-${String(recoveryDate.getDate()).padStart(2,'0')}`;
async function findArtwork(more=false){
  const button=more?$('#more-artwork'):$('#find-artwork');button.disabled=true;
  try{
    if(!more){const start=new Date($('#recovery-date').value+'T00:00:00'),end=new Date(start);end.setDate(end.getDate()+1);recoveryRange={from:start.toISOString(),to:end.toISOString()};recoveryCursor=null;$('#recovery-list').replaceChildren();}
    const query=new URLSearchParams(recoveryRange);if(recoveryCursor)query.set('cursor',recoveryCursor);
    const data=await api('/api/admin/artwork-recovery?'+query);recoveryCursor=data.cursor;
    for(const item of data.items){
      const card=document.createElement('article');card.className='glass op-card';
      const heading=document.createElement('h3');heading.textContent=`${item.styleName||'Saved artwork'} · ${new Date(item.createdAt).toLocaleString()}`;
      const id=document.createElement('p');id.textContent=item.requestId;
      const view=document.createElement('button');view.type='button';view.textContent='View saved preview';
      view.onclick=async()=>{view.disabled=true;try{
        const saved=await api('/api/admin/artwork-recovery/'+encodeURIComponent(item.requestId));
        if(!saved.watermarked)throw new Error('Protected preview unavailable');
        const img=document.createElement('img');img.src=saved.image;img.alt='Saved watermarked artwork';img.style.cssText='width:100%;max-width:380px;height:auto;display:block';
        const params=new URLSearchParams({recast:saved.requestId,key:saved.accessToken});
        const live=document.createElement('a');const liveUrl=new URL('/',saved.liveBase||location.origin);liveUrl.hash=params;live.href=liveUrl.href;live.textContent='Use this exact artwork on LIVE shop';live.className='button';
        const here=document.createElement('a');const hereUrl=new URL('/',location.origin);hereUrl.hash=params;here.href=hereUrl.href;here.textContent='Restore in this environment';here.className='button secondary';
        const note=document.createElement('p');note.className='muted';note.textContent='LIVE shop keeps this exact saved Artwork ID and does not generate a new image.';
        card.append(img,live,here,note);view.remove();
      }catch(e){view.disabled=false;toast(e.message)}};
      card.append(heading,id,view);$('#recovery-list').append(card);
    }
    $('#more-artwork').hidden=!recoveryCursor;
    $('#recovery-status').textContent=recoveryCursor?'More stored records are available. Search next records if your picture is not listed yet.':'Search complete. If your picture is absent, check its original date and deployment.';
  }catch(e){$('#recovery-status').textContent=e.message;}finally{button.disabled=false;}
}
$('#find-artwork').onclick=()=>findArtwork();$('#more-artwork').onclick=()=>findArtwork(true);
$('#find-diagnostic').onclick=async()=>{try{const data=await api('/api/admin/generation-diagnostic?id='+encodeURIComponent($('#diagnostic-reference').value.trim()));$('#diagnostic-result').textContent=JSON.stringify(data.diagnostic,null,2);}catch(e){$('#diagnostic-result').textContent=e.message;}};
$('#lock-admin').addEventListener('click',()=>{$('#recovery-list').replaceChildren();$('#diagnostic-result').textContent='';});

$('#check-commerce').onclick=async()=>{const el=$('#commerce-result');el.textContent='Checking product connection…';try{el.textContent=JSON.stringify(await api('/api/admin/commerce-check'),null,2)}catch(e){el.textContent=e.message}};
