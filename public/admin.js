import {initOwnerAlerts} from './admin-alerts.js?v=rm068';
import {initOwnerSettings} from './admin-settings.js?v=rm075-250';
import {initOwnerCredits} from './admin-credits.js?v=rm1101';
import {attachPrintfulDiagnostic} from './printful-diagnostics.js?v=rm0505';
const deploymentLabel=document.querySelector('#deployment-identity');
if(deploymentLabel)deploymentLabel.textContent=`${['recastmeai.com','recast-me.sergz24.workers.dev'].includes(location.hostname)?'Production':'Preview / alternate host'} · ${location.hostname} · RM-069 launch setup`;
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const tokenKey='recast_admin_token';let token=sessionStorage.getItem(tokenKey)||'';
function headers(json=false){return{'x-recast-request':'1',Authorization:`Bearer ${token}`,...(json?{'content-type':'application/json'}:{})}}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.add('hidden'),4500)}
async function api(path,{method='GET',body}={}){const r=await fetch(path,{method,headers:headers(body!==undefined),body:body!==undefined?JSON.stringify(body):undefined});const data=await r.json().catch(()=>({}));if(!r.ok||data.ok===false)throw new Error(data.error||`Request failed (${r.status})`);return data}
const ownerSettings=initOwnerSettings(api,toast);
const ownerCredits=initOwnerCredits(api,toast);
const ownerAlerts=initOwnerAlerts(api,toast);
function statusPill(status){const v=String(status||'unknown');const kind=/submitted|ready|completed|paid/i.test(v)?'good':/hold|review|await|needs|draft/i.test(v)?'warn':/fail|error|reject/i.test(v)?'bad':'';return `<span class="pill ${kind}">${escapeText(v.replaceAll('_',' '))}</span>`}
function empty(text){return `<div class="empty">${text}</div>`}
function escapeText(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function loadRenderReadiness(){
  const d=await api('/api/admin/render-readiness');
  const root=document.querySelector('#render-readiness');
  root.replaceChildren();
  const title=document.createElement('h3');title.textContent='Image rendering and X readiness';
  const note=document.createElement('p');note.textContent=d.render.reason==='quota'?'Cloudflare rejected the last render because its shared free AI allowance is exhausted. Enable Workers Paid in Cloudflare billing, then try a real photo again. Deploying an update or changing a visitor limit will not lift provider error 3036.':`Last render: ${d.render.lastResult||'not verified'}. Binding presence alone does not prove the model can render.`;
  const last=document.createElement('p');last.textContent=`Last check: ${d.render.checkedAt||'none'} · Allowances: see Limits & usage`;
  const social=document.createElement('p');social.textContent=Object.entries(d.social).map(([k,v])=>`${k}: ${v?'ready':'not ready'}`).join(' · ');
  root.append(title,note,last,social);
  for(const item of d.setup||[]){
    const card=document.createElement('article');card.className='glass op-card';
    const heading=document.createElement('h3');heading.textContent=item.name;
    const state=document.createElement('p');state.textContent=item.state;
    const steps=document.createElement('ol');
    for(const text of item.steps){const step=document.createElement('li');step.textContent=text;steps.append(step);}
    card.append(heading,state,steps);root.append(card);
  }
}

async function loadStatus(){const d=await api('/api/admin/status');$('#stat-jobs').textContent=d.jobs.total;$('#stat-awaiting').textContent=`${d.jobs.awaiting} jobs awaiting action · ${d.orderIssues?.openInSnapshot||0}${d.orderIssues?.more?'+':''} order issues`;$('#stat-trends').textContent=d.trends.review;$('#stat-x').textContent=d.xRequests;$('#stat-x-connection').textContent=d.connections.x?'X credentials connected':'Bot disabled until connected';$('#stat-printful').textContent=d.connections.printful?'Connected':'Not ready';$('#stat-generation').textContent=d.generationErrors?.total??0;$('#stat-generation-recent').textContent=`${d.generationErrors?.recent??0} in the last 24h`;$('#system-list').innerHTML=[`<article class="glass system-item"><div class="connection"><i class="dot ${d.contentModeration?.ready?'good':'off'}"></i><strong>Photo content screening</strong></div><span class="muted">${d.contentModeration?.ready?'Configured · live verification required':d.contentModeration?.enabled?'Enabled but missing credentials · requests stop':'Not enabled · public launch blocker'}</span></article>`,...Object.entries(d.connections).filter(([k])=>k!=='admin').map(([k,v])=>`<article class="glass system-item"><div class="connection"><i class="dot ${v?'good':'off'}"></i><strong>${k[0].toUpperCase()+k.slice(1)}</strong></div><span class="muted">${v?'Configured · not yet tested':'Not configured'}</span></article>`),...Object.entries(d.automation||{}).map(([k,v])=>`<article class="glass system-item"><div class="connection"><i class="dot ${v?'good':'off'}"></i><strong>${k}</strong></div><span class="muted">${v?'Enabled':'Safely off'}</span></article>`)].join('')}
async function loadGenerationErrors(){
 const d=await api('/api/admin/generation-errors'),list=$('#generation-errors-list');list.replaceChildren();
 if(!d.errors.length){list.textContent='No stored generation errors in this snapshot.';return;}
 for(const item of d.errors){const card=document.createElement('article');card.className='glass op-card';const h=document.createElement('h3');h.textContent=item.diagnosticId||item.reason||'Generation error';const pre=document.createElement('pre');pre.style.whiteSpace='pre-wrap';pre.style.overflowWrap='anywhere';pre.textContent=JSON.stringify(item,null,2);card.append(h,pre);list.append(card);}
}
let jobsCursor=null,shownJobs=0;
async function loadJobs(more=false){
 const d=await api('/api/admin/jobs'+(more&&jobsCursor?'?cursor='+encodeURIComponent(jobsCursor):'')),list=$('#jobs-list');
 if(!more){list.replaceChildren();shownJobs=0;}jobsCursor=d.cursor||null;
 if(!d.jobs.length&&!more)list.innerHTML=empty('No fulfillment jobs yet. Paid Recast orders appear after a sync.');
 for(const j of d.jobs){
  const article=document.createElement('article');article.className='glass op-card';
  article.innerHTML=`<div class="op-title">${escapeText(j.orderName||j.id)} · ${escapeText(j.product||j.sku)}</div><div class="op-meta">${statusPill(j.status)}<span class="pill">${escapeText(j.sku)}</span></div><p>Artwork ${escapeText(j.requestId)} · Quantity ${escapeText(j.quantity||1)}${j.printfulOrderId?' · Printful #'+escapeText(j.printfulOrderId):''}</p><p class="muted">${escapeText(j.holdReason||j.ownerReleaseError||(j.autoPrintError?((j.autoPrintStage?j.autoPrintStage+': ':'')+j.autoPrintError):'')||j.lastPrintfulSyncError||j.shopifyFulfillmentError||j.shopifyTagError||'')}</p>`;
  const actions=document.createElement('div');actions.className='op-actions';
  for(const [action,label,show] of [['recover-print-file','Recover print file & create held draft',j.preapprovedCheckout&&j.autoPrintFailedAt&&!j.printfulOrderId&&!j.sentToProductionAt],['approve-art','Approve artwork',!j.artApprovedAt],['finalize-art','Prepare high-res print',j.artApprovedAt&&!j.digital&&!j.printReadyAt],['create-draft','Create Printful draft',j.printReadyAt&&!j.printfulOrderId&&!j.digital],['release-recovered-draft','Approve inspected draft & send to production',j.status==='on_hold'&&Boolean(j.recoveredPrintfulDraftAt)&&Boolean(j.printfulOrderId)&&!j.sentToProductionAt],['send-production','Send to production',j.printfulOrderId&&!j.sentToProductionAt&&j.status!=='on_hold'],['hold','Hold',true]]){
   if(!show)continue;const button=document.createElement('button');button.textContent=label;button.type='button';button.className=['send-production','release-recovered-draft'].includes(action)?'danger':'secondary';button.onclick=()=>jobAction(j.id,action);actions.append(button);
  }
  for(const advice of j.recoveryAdvice||[]){const p=document.createElement('p');p.textContent=advice;article.append(p);}
  article.append(actions);attachPrintfulDiagnostic(article,j,api);list.append(article);shownJobs++;
 }
 $('#more-jobs').hidden=!jobsCursor;$('#jobs-page-status').textContent=`Showing ${shownJobs} stored jobs${jobsCursor?' — more available':' — end of list'}. Summary cards use a bounded snapshot, not lifetime totals.`;
}
$('#more-jobs').onclick=()=>loadJobs(true).catch(e=>toast(e.message));
async function loadSocial(){const d=await api('/api/admin/social');$('#social-list').innerHTML=d.requests.length?d.requests.map(x=>`<article class="glass op-card"><div class="op-title">X mention ${escapeText(x.tweetId)}</div><div class="op-meta">${statusPill(x.replyStatus)}<span class="pill">${escapeText(x.authorId||'unknown user')}</span></div><div class="op-body">${escapeText(x.requestText)}<br><span class="muted">${escapeText(x.link)}${x.error?`<br>${escapeText(x.error)}`:''}${x.retryAt?`<br>Next attempt: ${escapeText(x.retryAt)}`:''}${x.replyStatus==='delivery_unknown'?'<br>Check the original X thread before taking any further action; automatic resend is paused to prevent duplicates.':''}</span></div></article>`).join(''):empty('No X requests yet. Connect X API access and approval to begin.')}
async function loadTrends(){const d=await api('/api/admin/trends');const rows=d.trends.filter(x=>x.status==='review'||x.decision==='needs-human-approval');$('#trends-list').innerHTML=rows.length?rows.map(x=>`<article class="glass op-card"><div class="op-top"><div><div class="op-title">${escapeText(x.name)}</div><div class="op-meta">${statusPill(x.status)}<span class="pill">Rank ${escapeText(x.rank||'—')}</span><span class="pill">${escapeText(x.source||'')}</span></div></div></div><div class="op-body">Held for human review; it will not be auto-published or auto-productized.</div><div class="op-actions"><button data-trend="${escapeText(x.id)}" data-trend-action="approve">Approve idea</button><button class="danger" data-trend="${escapeText(x.id)}" data-trend-action="reject">Reject</button></div></article>`).join(''):empty('Nothing needs your approval right now.');$$('[data-trend]').forEach(b=>b.onclick=()=>trendAction(b.dataset.trend,b.dataset.trendAction))}
async function refresh(){try{await Promise.all([loadStatus(),loadJobs(),loadOrderIssues(),loadSocial(),loadTrends(),loadGenerationErrors(),loadRenderReadiness(),ownerSettings.load(),ownerCredits.load(),ownerAlerts.load()])}catch(e){if(/authorization/i.test(e.message)){lock();$('#login-error').textContent=e.message;$('#login-error').classList.remove('hidden')}else toast(e.message)}}
async function jobAction(id,action){try{let body={};if(action==='recover-print-file'){if(!confirm('Retry clean print-file preparation once using the exact approved design, then create one Printful draft held for inspection. This does not submit paid production. Continue?'))return;body={confirm:'RECOVER_PRINT_FILE'}}if(action==='send-production'){if(!confirm('This will submit the Printful draft for paid production. Continue?'))return;body={confirm:'SEND_TO_PRODUCTION'}}if(action==='release-recovered-draft'){if(!confirm('You inspected this recovered Printful draft. Recast will re-check the exact draft and paid Shopify order, then submit it to paid production. Continue?'))return;body={confirm:'SEND_INSPECTED_RECOVERED_DRAFT'}}if(action==='hold'){const reason=prompt('Reason for hold?','Manual review');if(reason===null)return;body={reason}}await api(`/api/admin/job/${encodeURIComponent(id)}/${action}`,{method:'POST',body});toast(['send-production','release-recovered-draft'].includes(action)?'Submitted to Printful production.':'Job updated.');await Promise.all([loadStatus(),loadJobs()])}catch(e){toast(e.message)}}
async function trendAction(id,action){try{await api(`/api/admin/trend/${encodeURIComponent(id)}/${action}`,{method:'POST',body:{}});toast(action==='approve'?'Trend idea approved.':'Trend idea rejected.');await Promise.all([loadStatus(),loadTrends()])}catch(e){toast(e.message)}}
function unlock(){sessionStorage.setItem(tokenKey,token);$('#login-card').classList.add('hidden');$('#dashboard').classList.remove('hidden');refresh()}
function lock(){ownerAlerts.clear();ownerSettings.clear();ownerCredits.clear();sessionStorage.removeItem(tokenKey);token='';$('#dashboard').classList.add('hidden');$('#login-card').classList.remove('hidden');$('#admin-token').value=''}
$('#admin-login').onsubmit=e=>{e.preventDefault();token=$('#admin-token').value.trim();if(token)unlock()};$('#lock-admin').onclick=lock;$('#refresh-all').onclick=refresh;
const syncPrintfulButton=document.createElement('button');syncPrintfulButton.textContent='Update Printful status';$('#sync-orders').after(syncPrintfulButton);syncPrintfulButton.onclick=async()=>{syncPrintfulButton.disabled=true;try{const d=await api('/api/admin/sync-printful',{method:'POST',body:{}});toast(`Printful status updated · ${d.updated||0} orders. No production submitted.`);await refresh()}catch(e){toast(e.message)}finally{syncPrintfulButton.disabled=false}};
const scopeButton=document.createElement('button');scopeButton.textContent='Check Shopify permissions';syncPrintfulButton.after(scopeButton);const scopeResult=document.createElement('pre');scopeResult.style.whiteSpace='pre-wrap';scopeButton.after(scopeResult);scopeButton.onclick=async()=>{scopeButton.disabled=true;try{const d=await api('/api/admin/shopify-permissions');scopeResult.textContent=`Shopify app: ${d.app||'Unknown'}\nGranted permissions:\n${d.scopes.join('\n')}`;}catch(e){scopeResult.textContent=e.message}finally{scopeButton.disabled=false}};
$('#sync-orders').onclick=async()=>{try{const d=await api('/api/admin/sync-orders',{method:'POST',body:{}});toast(`Order sync complete · ${d.created||0} new jobs.`);refresh()}catch(e){toast(e.message)}};
$('#poll-x').onclick=async()=>{try{const d=await api('/api/admin/poll-x',{method:'POST',body:{}});toast(d.disabled?'X bot needs configuration.':d.busy?'X requests are already processing.':`X checked · ${d.found||0} new requests · ${d.processed||0} jobs processed.`);refresh()}catch(e){toast(e.message)}};
$('#scan-trends').onclick=async()=>{try{const d=await api('/api/admin/scan-trends',{method:'POST',body:{}});toast(d.disabled?'Trend scanner is disabled.':`Trend scan saved ${d.saved||0} ideas.`);refresh()}catch(e){toast(e.message)}};
$$('.admin-tabs button').forEach(b=>b.onclick=()=>{$$('.admin-tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===b.dataset.tab))});
if(token)unlock();

let recoveryCursor=null,recoveryRange=null;
const recoveryDateParam=new URLSearchParams(location.search).get('recoverDate');const recoveryDate=recoveryDateParam?new Date(recoveryDateParam+'T12:00:00'):new Date();$('#recovery-date').value=`${recoveryDate.getFullYear()}-${String(recoveryDate.getMonth()+1).padStart(2,'0')}-${String(recoveryDate.getDate()).padStart(2,'0')}`;
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
$('#verify-new-products').onclick=async()=>{const el=$('#new-products-result');el.textContent='Checking approved product candidates against Printful…';try{const d=await api('/api/admin/product-candidates');el.textContent=JSON.stringify(d.products,null,2);toast('Product candidate check complete. No order or production was created.')}catch(e){el.textContent=e.message}};

$('#verify-tumbler').onclick=async()=>{const el=$('#new-products-result');el.textContent='Reading tumbler catalog…';try{const d=await api('/api/admin/product-candidates?product=tumbler');el.textContent=JSON.stringify(d.products,null,2)}catch(e){el.textContent=e.message}};

$('#inspect-preview-catalog').onclick=async()=>{const el=$('#new-products-result');el.textContent='Reading supplier preview catalog…';try{const d=await api('/api/admin/product-candidates?sku='+encodeURIComponent($('#inspect-preview-sku').value.trim()));el.textContent=JSON.stringify(d.products,null,2)}catch(e){el.textContent=e.message}};

let issueCursor=null;
async function loadOrderIssues(more=false){
 const d=await api('/api/admin/order-issues'+(more&&issueCursor?'?cursor='+encodeURIComponent(issueCursor):''));
 const list=$('#order-issues-list');if(!more)list.replaceChildren();issueCursor=d.cursor||null;
 const phases=Object.entries(d.sync||{}).filter(([key,value])=>key!=='lastRun'&&value?.ok===false).map(([key,value])=>key+': '+(value.error||'failed'));
 $('#order-audit-health').textContent=d.audit?.lastRun?'Last automatic/backfill audit: '+new Date(d.audit.lastRun).toLocaleString()+(d.audit.more?' · additional pages pending.':'.'):'A daily audit will check the last 30 days for missed orders.';
 const last=d.sync?.lastRun,stale=!last||Date.now()-Date.parse(last)>30*60000;
 $('#order-sync-health').textContent=!d.enabled?'Automatic order sync is disabled.':phases.length?'Automatic sync needs attention: '+phases.join(' · '):stale?'Automatic sync has no recent successful check. Inspect the scheduler and connections.':'Last automatic check: '+new Date(last).toLocaleString()+'. Check individual orders for any holds.';
 for(const issue of d.issues.filter(x=>x.status==='open')){
  const card=document.createElement('article');card.className='glass op-card';
  const h=document.createElement('h4');h.textContent=(issue.orderName||'Order')+' · '+(issue.sku||'Order review');
  const p=document.createElement('p');p.textContent=issue.message;
  const button=document.createElement('button');button.textContent='Recheck original order';button.onclick=async()=>{button.disabled=true;try{const result=await api('/api/admin/order-issue/'+encodeURIComponent(issue.id)+'/recheck',{method:'POST',body:{}});toast(result.issue?.status==='resolved'?'Issue resolved. Any newly recovered job is held for inspection.':'This order still needs attention. No production submitted.');await Promise.all([loadOrderIssues(),loadJobs(),loadStatus()]);}catch(e){toast(e.message)}finally{button.disabled=false}};
  card.append(h,p,button);list.append(card);
 }
 if(!list.children.length)list.textContent=d.cursor?'No open issues on this page. Load more records to continue checking.':'No open issues in the loaded records. Use the 30-day check to find previously skipped orders.';
 $('#more-order-issues').hidden=!issueCursor;
}
$('#more-order-issues').onclick=()=>loadOrderIssues(true).catch(e=>toast(e.message));
$('#audit-orders').onclick=async()=>{const button=$('#audit-orders');button.disabled=true;try{const d=await api('/api/admin/audit-orders',{method:'POST',body:{}});button.textContent=d.more?'Continue checking older orders':'Check last 30 days for missing orders';toast(`${d.created||0} recovered jobs held · ${d.issues||0} issues found${d.more?' · more orders remain':''}. No production submitted.`);await Promise.all([loadOrderIssues(),loadJobs(),loadStatus()]);}catch(e){toast(e.message)}finally{button.disabled=false}};
setInterval(()=>{if(token&&!document.hidden)loadOrderIssues().catch(()=>{$('#order-sync-health').textContent='Could not refresh order alerts. Check your connection and reload.';});},60000);
