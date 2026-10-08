// No token is exported by this module. All requests use the existing authenticated client.
export function initOwnerSettings(api,notify){
  const root=document.querySelector('#owner-settings'),form=document.querySelector('#owner-settings-form');
  let current=null,dirty=false;
  form.addEventListener('input',()=>{dirty=true});
  const text=(id,value)=>{document.getElementById(id).textContent=value};
  function fill(data){
    for(const [key,value] of Object.entries(data.values)){
      const input=form.elements.namedItem(key);if(!input)continue;
      if(key==='paused')input.checked=value;
      else input.value=key==='budgetCents'?(value/100).toFixed(2):String(value);
    }
    dirty=false;
  }
  async function load(force=false){
    const data=await api('/api/admin/owner-settings');
    text('usage-website',`${data.usage.websiteCalls} / ${data.values.websiteCalls}`);
    text('usage-modes',`${data.usage.highCalls} HQ · ${data.usage.standardCalls} Standard${data.usage.unclassifiedCalls?` · ${data.usage.unclassifiedCalls} earlier/unclassified`:''}`);
    text('usage-social',`${data.usage.socialCalls} / ${data.values.socialCalls}`);
    text('usage-reserved',`$${(data.usage.reservedCents/100).toFixed(2)} / $${(data.values.budgetCents/100).toFixed(2)}`);
    text('usage-day',`Reserved render attempts today (${data.usage.day}, UTC). Includes retries and later safeguard failures, not billed-call totals. Reserved spending is not the invoice.`);
    text('owner-policy-status',`${data.values.paused?'Image creation paused':'Image creation enabled'} · ${data.connections.creditsEnabled?'Customer credits active':'Customer credits need activation'} · ${data.connections.socialEnabled?'X automation active':'X automation off'} · ${data.connections.botProtection?'Bot challenge configured':'Bot challenge not configured'}`);
    text('owner-engines',Object.entries(data.engines).map(([k,v])=>`${k==='high'?'High Quality':k==='standard'?'Standard':'X'}: ${v||'not configured'}`).join('\n'));
    text('owner-settings-history',(data.history||[]).map(h=>`${h.at} · revision ${h.revision}\n${Object.entries(h.after).filter(([k,v])=>h.before?.[k]!==v).map(([k,v])=>`${k}: ${h.before?.[k]} → ${v}`).join(', ')}`).join('\n\n')||'No dashboard changes yet.');
    text('owner-settings-note',data.note);
    // Never erase an in-progress edit or silently replace its revision token.
    if(!dirty||force){current=data;fill(data);}
    return data;
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(!current)return;
    const button=form.querySelector('[type=submit]');button.disabled=true;text('owner-settings-save-status','');
    try{
      const values={};for(const key of Object.keys(current.values)){
        const input=form.elements.namedItem(key);
        values[key]=key==='paused'?input.checked:key==='budgetCents'?Math.round(Number(input.value)*100):Number(input.value);
      }
      const increased=['budgetCents','websiteCalls','socialCalls'].some(k=>values[k]>current.values[k]);
      if(increased&&!confirm(`Raise these limits? The AI reservation budget will be $${(values.budgetCents/100).toFixed(2)} per UTC day, with ${values.websiteCalls} website calls and ${values.socialCalls} X calls. This may allow more paid AI usage. Other service costs are separate.`))return;
      await api('/api/admin/owner-settings',{method:'POST',body:{revision:current.revision,values,...(increased?{confirm:'INCREASE_LIMITS'}:{})}});
      await load(true);notify('Settings saved. Existing purchase credits and print orders are unchanged.');
    }catch(e){text('owner-settings-save-status',e.message);notify(e.message)}finally{button.disabled=false}
  });
  document.querySelector('#reload-owner-settings').addEventListener('click',()=>{
    if(dirty&&!confirm('Discard your unsaved settings and reload?'))return;
    load(true).catch(e=>notify(e.message));
  });
  document.querySelector('#reset-my-renders').addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;
    try{const data=await api('/api/admin/reset-my-renders',{method:'POST',body:{}});text('reset-my-renders-status',data.message)}
    catch(e){text('reset-my-renders-status',e.message)}finally{button.disabled=false}
  });
  function clear(){current=null;dirty=false;form.reset();root.querySelectorAll('[data-private-setting]').forEach(el=>el.textContent='');}
  return {load,clear};
}
