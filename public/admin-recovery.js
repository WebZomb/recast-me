export function initRecoveryCenter(api,notify){
 const root=document.createElement('section');root.className='glass op-card';root.id='recovery-center';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 const title=el('h3','Quick checks & recovery'),note=el('p','Check the affected step, then use its recovery control. Unknown means unverified, not healthy.');
 const status=el('p'),cards=el('div');status.setAttribute('role','status');cards.className='recovery-grid';
 const actions=el('div');actions.className='op-actions';
 const button=(label,run)=>{const b=el('button',label);b.type='button';b.onclick=async()=>{b.disabled=true;try{await run();}catch(e){notify(e.message);}finally{b.disabled=false;}};actions.append(b);return b;};
 const tab=name=>{document.querySelector(`[data-tab="${name}"]`)?.click();};
 button('Refresh checks',load);
 button('Pause new AI pictures',async()=>{
  if(!confirm('Pause new AI picture creation? Saved artwork shopping stays available. Spending limits and order processing stay unchanged.'))return;
  const state=await api('/api/admin/owner-settings');
  await api('/api/admin/owner-settings',{method:'POST',body:{revision:state.revision,values:{...state.values,paused:true}}});
  notify('New AI picture creation paused. Review Limits & usage to resume.');await load();
 });
 button('Review limits / resume',()=>tab('limits'));
 button('Review held orders',()=>tab('orders'));
 button('Alert setup & test',()=>tab('alerts'));
 button('Artwork recovery',()=>{tab('recovery');document.querySelector('#recovery-list')?.scrollIntoView({block:'center'});});
 button('Check shopping links',async()=>{
  status.textContent='Checking public shopping pages…';
  for(const path of ['/','/gallery','/orders','/specials','/guide']){
   let result='Unavailable';try{const r=await fetch(path,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});result=r.ok?'Responded '+r.status:'HTTP '+r.status;await r.body?.cancel();}catch{}
   const p=el('p',path+' — '+result);cards.append(p);
  }
  status.textContent='Page responses checked. This does not verify buttons, checkout payment or delivery.';
 });
 root.append(title,note,status,actions,cards);
 document.querySelector('[data-panel="system"] .panel-heading')?.after(root);
 const style=el('style');style.textContent='#recovery-center .recovery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:12px}#recovery-center .recovery-check{border:1px solid #49425f;border-radius:14px;padding:14px;overflow-wrap:anywhere}#recovery-center button{min-height:44px;white-space:normal}';document.head.append(style);
 let generation=0;
 document.querySelector('[data-tab="system"]')?.addEventListener('click',()=>load().catch(e=>notify(e.message)));
 document.querySelector('#lock-admin')?.addEventListener('click',()=>{generation++;cards.replaceChildren();status.textContent='';});
 async function load(){
  const run=++generation;cards.replaceChildren();status.textContent='Checking saved system status…';
  const checks=[['Limits','/api/admin/owner-settings',d=>`${d.values.paused?'AI pictures paused':'AI pictures enabled'}. Website calls ${d.usage.websiteCalls}/${d.values.websiteCalls}; reserved budget $${(d.usage.reservedCents/100).toFixed(2)}/$${(d.values.budgetCents/100).toFixed(2)}. Reservations are not provider billing.`],
   ['Screening & upload capacity','/api/admin/capacity',d=>(d.rows||[]).map(r=>`${r.label}: ${r.used??'unknown'}/${r.limit??'unknown'} (${r.scope})`).join('\n')],
   ['Basket checkout attempts','/api/admin/basket-attempts',d=>`${d.items.filter(i=>i.status!=='ready').length} need review in this ${d.more?'partial ':''}snapshot. ${d.note}`]];
  await Promise.allSettled(checks.map(async([title,path,describe])=>{
   let text,data;try{data=await api(path);text=describe(data);}catch{text='Unavailable / not verified. Open the related controls to inspect setup; no automatic reset was performed.';}
   if(run!==generation)return;const card=el('article');card.className='recovery-check';card.append(el('strong',title),el('p',text));cards.append(card);
   if(path==='/api/admin/basket-attempts')for(const item of data?.items||[]){
    if(item.status==='ready')continue;
    const details=el('details'),summary=el('summary',(item.startedAt||'Unknown time')+' · '+item.status);
    details.append(summary,el('p','Reference: '+item.reference),el('p',item.guidance));card.append(details);
   }
  }));
  if(run===generation)status.textContent='Checked '+new Date().toLocaleString()+'. Live provider balances and delivered alerts require separate verification.';
 }
 return {load,clear(){generation++;cards.replaceChildren();status.textContent='';}};
}
