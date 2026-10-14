import {annualGiftEvents} from './season-calendar.js';
export function initHolidaySchedule(api,notify){
 const form=document.getElementById('holiday-schedule-form'),grid=document.getElementById('holiday-schedule-fields'),status=document.getElementById('holiday-schedule-status');
 let current=null,dirty=false;
 form.addEventListener('input',()=>{dirty=true});
 const names=new Map(annualGiftEvents(2026).map(x=>[x.id,x.title]));
 function fill(data){
  grid.replaceChildren();
  for(const row of data.rows){
   const group=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=names.get(row.id);group.append(legend);group.dataset.holiday=row.id;
   for(const [key,title,type] of [['enabled','Show this occasion','checkbox'],['leadDays','Days before occasion','number'],['start','Start override (MM-DD)','text'],['end','End override (MM-DD)','text'],['priority','Priority (higher wins)','number']]){
    const label=document.createElement('label'),input=document.createElement('input');input.name=row.id+'-'+key;input.type=type;
    if(type==='checkbox')input.checked=row[key];else input.value=row[key];
    if(type==='number'){input.min=0;input.max=key==='leadDays'?90:999;input.required=true;}
    if(type==='text'){input.placeholder='Automatic';input.pattern='[0-9]{2}-[0-9]{2}';input.maxLength=5;}
    label.append(title,input);group.append(label);
   }
   grid.append(group);
  }
  current=data;dirty=false;
  status.textContent=data.active?`Showing ${data.active.title}: ${data.active.start} through ${data.active.end}.`:'No holiday is active. Specials shows everyday gift inspiration.';
  document.getElementById('holiday-offer-status').textContent=data.offer?`${data.offer.label}. ${data.offer.terms}`:(data.active&&!data.checkoutReady?'Seasonal discount paused: the Recast Me Fulfillment Shopify app needs write_draft_orders permission for fixed, style-qualified checkouts.':'No seasonal checkout offer is active.');
 }
 async function load(force=false){if(!force&&!form.closest('details').open)return;const data=await api('/api/admin/holiday-schedule');if(!dirty||force)fill(data);return data;}
 form.closest('details').addEventListener('toggle',()=>{if(form.closest('details').open)load().catch(error=>{status.textContent=error.message});});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!current)return;
  const button=form.querySelector('[type=submit]');button.disabled=true;
  try{
   const rows=current.rows.map(row=>{
    const value=key=>form.elements.namedItem(row.id+'-'+key);
    return {id:row.id,enabled:value('enabled').checked,leadDays:Number(value('leadDays').value),start:value('start').value.trim(),end:value('end').value.trim(),priority:Number(value('priority').value)};
   });
   await api('/api/admin/holiday-schedule',{method:'POST',body:{revision:current.revision,rows}});await load(true);notify('Holiday schedule saved.');
  }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 });
 document.getElementById('reload-holiday-schedule').addEventListener('click',()=>{
  if(dirty&&!confirm('Discard unsaved holiday edits?'))return;
  load(true).catch(error=>{status.textContent=error.message});
 });
 return {load,clear(){current=null;dirty=false;grid.replaceChildren();status.textContent='';document.getElementById('holiday-offer-status').textContent='';}};
}
