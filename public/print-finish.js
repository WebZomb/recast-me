const $=s=>document.querySelector(s);
let activeId='',busy=false,states={};
function controls(){for(const b of document.querySelectorAll('[data-mode]'))b.disabled=busy||!activeId||!$('#consent').checked||(states[b.dataset.mode]&&states[b.dataset.mode]!=='not_started');}
function render(data){
  for(const c of data.candidates){
    states[c.mode]=c.status;
    const info=$(`[data-info="${c.mode}"]`),view=$(`[data-view="${c.mode}"]`);view.replaceChildren();
    info.textContent=c.status==='succeeded'?`${c.width} × ${c.height} · ${(c.elapsedMs/1000).toFixed(1)}s · watermarked`:c.message||c.status.replaceAll('_',' ');
    if(c.preview&&c.watermarked){const img=new Image();img.alt=`${c.mode} — watermarked 2× comparison`;img.src=c.preview;view.append(img);}
  }
  controls();
}
async function load(mode){
  busy=true;controls();$('#status').textContent=mode?'Preparing this finish. Keep this page open; refreshing will not automatically retry.':'Loading saved comparisons…';
  try{
    const response=await fetch('/api/admin/print-finish'+(mode?'':`?requestId=${encodeURIComponent(activeId)}`),{
      method:mode?'POST':'GET',headers:{authorization:`Bearer ${$('#token').value}`,...(mode?{'content-type':'application/json'}:{})},
      ...(mode?{body:JSON.stringify({requestId:activeId,mode,confirmBillable:$('#consent').checked})}:{})});
    const data=await response.json();if(!response.ok)throw Error(data.error||'Comparison unavailable.');
    render(data);$('#status').textContent='Saved comparison loaded. Inspect the face, coat markings, edges and fine details.';
  }catch(e){$('#status').textContent=e.message+' Use Load saved comparison to check status before trying again.';if(mode)states[mode]='unknown';}
  finally{busy=false;controls();}
}
$('#lookup').addEventListener('submit',e=>{e.preventDefault();if(busy)return;activeId=$('#artwork').value.trim();states={};for(const v of document.querySelectorAll('[data-view]'))v.replaceChildren();load();});
for(const b of document.querySelectorAll('[data-mode]'))b.addEventListener('click',()=>{if(!b.disabled)load(b.dataset.mode)});
$('#consent').addEventListener('change',controls);
$('#zoom').addEventListener('change',()=>{for(const v of document.querySelectorAll('.zoom'))v.classList.toggle('actual',$('#zoom').checked)});
