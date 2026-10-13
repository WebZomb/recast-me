// RM165: the disclosure label always describes the visible panel, not a past click.
// Presentation only: no photo changes, rendering, credits, or checkout requests.
export function bindStylesDismissal({panel,trigger,select,setOpen,doc=document,Observer=globalThis.MutationObserver}){
  const inside=node=>Boolean(node&&(panel.contains(node)||trigger.contains(node)));
  const sync=()=>{
    const open=!panel.hidden;
    trigger.setAttribute('aria-expanded',String(open));
    const label=trigger.querySelector('[data-more-label]');
    if(label)label.textContent=open?'Fewer Styles ↑':'More Styles ↓';
  };
  const outside=event=>{if(!panel.hidden&&!inside(event.target)){setOpen(false);sync();}};
  const escape=event=>{
    if(event.key!=='Escape'||panel.hidden)return;
    event.preventDefault();setOpen(false);sync();trigger.focus({preventScroll:true});
  };
  const selected=()=>{
    // The custom-description field is a sibling, so it remains available.
    // Preserve the chosen select value and all existing change handlers.
    setOpen(false);sync();
  };
  doc.addEventListener('pointerdown',outside,true);
  doc.addEventListener('click',outside,true); // Also covers synthetic/assistive clicks.
  doc.addEventListener('focusin',outside,true); // Keyboard navigation out of the panel.
  doc.addEventListener('keydown',escape,true);
  select.addEventListener('change',selected);
  const observer=Observer?new Observer(sync):null;
  observer?.observe(panel,{attributes:true,attributeFilter:['hidden']});
  sync();
  return ()=>{
    doc.removeEventListener('pointerdown',outside,true);
    doc.removeEventListener('click',outside,true);
    doc.removeEventListener('focusin',outside,true);
    doc.removeEventListener('keydown',escape,true);
    select.removeEventListener('change',selected);
    observer?.disconnect();
  };
}
