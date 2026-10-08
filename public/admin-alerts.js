export function initOwnerAlerts(api,notify){
 const form=document.querySelector('#alert-settings-form');let current=null,dirty=false;
 const status=document.querySelector('#alert-settings-status');
 const message=r=>!r?'No attempts yet.':`${r.status==='accepted'?'Accepted by provider (delivery not confirmed)':r.status==='unknown'?'Result unknown — inspect the provider before retrying':r.status==='rejected'?'Provider rejected the message':r.status==='blocked'?'Sending blocked — check settings or daily limit':r.status} · ${r.at||''}`;
 form.addEventListener('input',()=>{dirty=true});
 async function load(force=false){
  const d=await api('/api/admin/alert-settings');
  for(const c of ['email','sms']){
   document.querySelector('#alert-'+c+'-ready').textContent=(d.setup?.[c]||(d.readiness[c]?'Delivery service configured. Send a test to verify receipt.':'Delivery service not connected. You can save your destination now.'))+(!d.values[c==='email'?'emailEnabled':'smsEnabled']?' Enable this channel and save to use its test button.':'');
   document.querySelector('#alert-'+c+'-last').textContent=message(d.last?.[c]);
   document.querySelector('#test-alert-'+c).disabled=!d.readiness[c]||!d.values[c==='email'?'emailEnabled':'smsEnabled'];
  }
  if(!dirty||force){current=d;for(const [k,v] of Object.entries(d.values)){const input=form.elements.namedItem(k);if(typeof v==='boolean')input.checked=v;else input.value=v;}dirty=false;}
 }
 form.addEventListener('submit',async e=>{e.preventDefault();if(!current)return;const button=form.querySelector('[type=submit]');button.disabled=true;
  try{const values={};for(const [k,v] of Object.entries(current.values)){const input=form.elements.namedItem(k);values[k]=typeof v==='boolean'?input.checked:k==='dailyLimit'?Number(input.value):input.value;}
   await api('/api/admin/alert-settings',{method:'POST',body:{revision:current.revision,values}});await load(true);status.textContent='Saved. Enabled channels send automatically once their delivery service is connected.';notify('Alert settings saved.');
  }catch(error){status.textContent=error.message;notify(error.message)}finally{button.disabled=false}
 });
 for(const c of ['email','sms'])document.querySelector('#test-alert-'+c).onclick=async()=>{
  if(dirty){notify('Save your changes before sending a test.');return;}
  if(!confirm(`Send one test ${c==='email'?'email':'text message'} to your saved destination? Provider charges may apply.`))return;
  const button=document.querySelector('#test-alert-'+c);button.disabled=true;
  try{const d=await api('/api/admin/alert-test',{method:'POST',body:{channel:c,confirm:'SEND_TEST_ALERT'}});status.textContent=message(d.result);await load();}catch(e){status.textContent=e.message}finally{await load().catch(()=>{});}
 };
 document.querySelector('#reload-alert-settings').onclick=()=>{if(dirty&&!confirm('Discard unsaved alert changes?'))return;load(true).catch(e=>notify(e.message))};
 return {load,clear(){current=null;dirty=false;form.reset();status.textContent='';for(const c of ['email','sms'])document.querySelector('#alert-'+c+'-last').textContent='';}};
}
