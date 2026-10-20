const sources={environment:'Environment setting',default:'Source default',code:'Fixed in code',invalid_environment_fallback:'Invalid setting — fallback applied',invalid_environment:'Invalid setting — check configuration'};
export function initOwnerCapacity(api){
  const root=document.getElementById('capacity-rows'),status=document.getElementById('capacity-status'),note=document.getElementById('capacity-note');
  let generation=0;
  const element=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
  async function load(){
    const current=++generation;
    root.replaceChildren();note.textContent='';status.textContent='Checking additional capacity…';
    try{
      const data=await api('/api/admin/capacity');if(current!==generation)return;
      status.textContent=`Snapshot ${new Date(data.checkedAt).toLocaleString()} · resets ${new Date(data.resetAt).toLocaleString()} (midnight UTC)`;
      for(const row of data.rows){
        const card=element('article','');card.className='glass capacity-card';
        const limit=row.limit===null?'unknown':String(row.limit);
        card.append(element('h4',row.label),element('strong',`${row.used===null?'Unknown':row.used} / ${limit}`));
        card.append(element('p',row.remaining===null?'Remaining capacity unknown':`${row.remaining} remaining`));
        card.append(element('small',`${row.scope} · ${sources[row.source]||'Unknown source'}`));
        if(row.used===null)card.append(element('p',row.usageStatus==='not_recorded'?'No counter recorded for this UTC day.':'Counter unavailable or invalid; do not assume unused capacity.'));
        if(row.enabled!==undefined)card.append(element('p',row.enabled?'Enabled in configuration':'Disabled or paused in configuration'));
        if(row.configured===false)card.append(element('p','Screening credentials are not configured.'));
        card.append(element('p',row.note));root.append(card);
      }
      note.textContent=data.note;
    }catch{if(current===generation){root.replaceChildren();note.textContent='';status.textContent='Capacity unavailable. Sign in or retry; previous values are not current.';}}
  }
  document.getElementById('refresh-capacity').addEventListener('click',load);
  function clear(){generation++;root.replaceChildren();status.textContent='';note.textContent='';}
  return {load,clear};
}
