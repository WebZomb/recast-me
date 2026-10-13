import {groupGenerationErrors,filterGenerationErrors} from './generation-dashboard.js?v=1';
// Admin-only UI. Technical payloads are opt-in and never sent to the customer.
export function initGenerationDashboard({list,summary,filter,more}){
 let groups=[],shown=5;
 const el=(tag,className,textValue)=>{
   const node=document.createElement(tag);
   if(className)node.className=className;
   if(textValue!==undefined)node.textContent=textValue;
   return node;
 };
 function display(){
   const filtered=filterGenerationErrors(groups,filter?.value||'');
   list.replaceChildren();
   if(!filtered.length)list.append(el('p','diagnostic-empty',
     groups.length?'No recent failures match this filter.':'No stored generation errors in this snapshot.'));
   for(const item of filtered.slice(0,shown)){
     const card=el('article','glass op-card diagnostic-card');
     const head=el('div','diagnostic-heading'),title=el('div','diagnostic-title');
     title.append(el('strong','diagnostic-code',item.reference||'Generation error'),
       el('div','diagnostic-reason',item.summary));
     const quality=item.qualityMode==='high'?'High Quality':item.qualityMode==='quick'?'Standard':item.qualityMode;
     head.append(title,el('span','diagnostic-pill',quality));
     const date=Date.parse(item.occurredAt||'');
     const detail=[Number.isFinite(date)?new Date(date).toLocaleString():'Time unavailable',item.stage];
     if(item.repeats>1)detail.push(item.repeats+' related records');
     card.append(head,el('div','diagnostic-meta',detail.join(' · ')));
     if(item.providerNote)card.append(el('p','diagnostic-explanation',item.providerNote));
     const actions=el('div','diagnostic-actions');
     if(item.reference){
       const copy=el('button','', 'Copy support ID');
       copy.type='button';copy.setAttribute('aria-label','Copy reference '+item.reference);
       copy.addEventListener('click',async()=>{
         try{await navigator.clipboard.writeText(item.reference);copy.textContent='✓ Copied';}
         catch{copy.textContent='Copy unavailable · '+item.reference;}
       });
       actions.append(copy);
     }
     const raw=el('details','diagnostic-technical');
     const toggle=el('summary','','Technical details (owner only)');
     const pre=el('pre','',JSON.stringify(item.records.slice(0,3),null,2));
     raw.append(toggle,pre);card.append(actions,raw);list.append(card);
   }
   summary.textContent='Showing '+Math.min(shown,filtered.length)+' of '+filtered.length+' grouped failures'
     +(filtered.length<groups.length?' · filtered from '+groups.length:'')+'.';
   more.hidden=filtered.length<=shown;
   if(!more.hidden)more.textContent='Show 5 more errors ↓';
 }
 filter.addEventListener('input',()=>{shown=5;display()});
 more.addEventListener('click',()=>{shown+=5;display()});
 return {render(entries){groups=groupGenerationErrors(entries);shown=5;display()}};
}
