/* Owner diagnostics formatting. Never read customer photos or expose this outside admin. */
const readable={
  protected_edit:'Protected image edit rejected',
  timeout:'Image generation timed out',
  capacity:'Image provider was busy',
  unavailable:'Image provider temporarily unavailable',
  moderation:'Provider safety review blocked this request',
  quota:'Rendering capacity reached',
  provider_error:'Provider returned an error',
  storage:'Saving the artwork failed',
  failed:'Generation did not complete'
};
const clean=value=>String(value??'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,280);
const stamp=v=>Number.isFinite(Date.parse(String(v||'')))?Date.parse(v):0;
export function diagnosticSummary(item){
  const reason=clean(item?.reason || item?.code || 'failed');
  return readable[reason.toLowerCase()]||reason.replaceAll('_',' ').replace(/^./,m=>m.toUpperCase())||'Generation did not complete';
}
export function groupGenerationErrors(entries=[]){
  if(!Array.isArray(entries))return[];
  const groups=new Map();
  for(const item of entries.slice(0,250)){
    if(!item||typeof item!=='object')continue;
    const ref=clean(item.diagnosticId||item.diagnosticID||'');
    const identity=/^GEN-[A-Za-z0-9-]{5,60}$/.test(ref)?ref:
      clean(item.attemptId||item.clientAttemptId||'')||'unknown-'+groups.size;
    const time=clean(item.updatedAt||item.failedAt||item.createdAt||item.at||'');
    const existing=groups.get(identity);
    if(existing){
      existing.repeats+=1;
      existing.records.push(item);
      if(stamp(time)>stamp(existing.occurredAt))existing.occurredAt=time;
      // The detailed diagnostic record may arrive separately after the attempt.
      if(item.providerMessage||item.reason&&!existing.reason)existing.cause=item;
    }else{
      groups.set(identity,{
        id:identity,reference:/^GEN-[A-Za-z0-9-]{5,60}$/.test(ref)?ref:null,
        occurredAt:time,cause:item,repeats:1,records:[item]
      });
    }
  }
  return [...groups.values()].map(group=>{
    const source=group.cause||{};
    const example=group.records.find(row=>row?.providerMessage)||source;
    return {...group,
      qualityMode:clean(source.qualityMode||example.qualityMode||'unknown'),
      stage:clean(source.stage||example.stage||'generation'),
      reason:clean(source.reason||example.reason||'failed'),
      summary:diagnosticSummary(source.reason?source:example),
      providerNote:clean(example.providerMessage||'')
    };
  }).sort((a,b)=>stamp(b.occurredAt)-stamp(a.occurredAt));
}
export function filterGenerationErrors(groups,needle=''){
  const term=clean(needle).toLowerCase();
  if(!term)return groups;
  return groups.filter(row=>[row.id,row.reason,row.summary,row.qualityMode,row.stage,row.providerNote]
     .some(field=>String(field||'').toLowerCase().includes(term)));
}
