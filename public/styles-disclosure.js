// RM165: the disclosure label always describes the visible panel, not a past click.
// Presentation only: no photo changes, rendering, credits, or checkout requests.
export function bindStylesDismissal({panel,trigger,select,setOpen,doc=document,Observer=globalThis.MutationObserver}){
  let pointing=false;
  const inside=node=>Boolean(node&&(panel.contains(node)||trigger.contains(node)));
  const sync=()=>{
    const open=!panel.hidden;
    trigger.setAttribute('aria-expanded',String(open));
    const label=trigger.querySelector('[data-more-label]');
    if(label)label.textContent=open?'Fewer Styles ↑':'More Styles ↓';
  };
  const outside=event=>{if(!panel.hidden&&!inside(event.target)){setOpen(false);sync();}};
  // Wait for click, not pointerdown: collapsing early can move another link
  // under the finger before pointerup. Pointer-driven focus waits for that click.
  const pointerStart=()=>{pointing=true;};
  const pointerEnd=()=>{pointing=false;};
  const clicked=event=>{pointing=false;outside(event);};
  const focused=event=>{if(!pointing)outside(event);};
  const keydown=event=>{
    pointing=false;
    if(event.key!=='Escape'||panel.hidden)return;
    event.preventDefault();setOpen(false);sync();trigger.focus({preventScroll:true});
  };
  const selected=()=>{
    // The custom-description field is a sibling, so it remains available.
    // Preserve the chosen select value and all existing change handlers.
    setOpen(false);sync();
  };
  const listeners=[['pointerdown',pointerStart],['pointerup',pointerEnd],
    ['pointercancel',pointerEnd],['click',clicked],['focusin',focused],['keydown',keydown]];
  for(const [type,handler] of listeners)doc.addEventListener(type,handler,true);
  select.addEventListener('change',selected);
  const observer=Observer?new Observer(sync):null;
  observer?.observe(panel,{attributes:true,attributeFilter:['hidden']});
  sync();
  return ()=>{
    for(const [type,handler] of listeners)doc.removeEventListener(type,handler,true);
    select.removeEventListener('change',selected);
    observer?.disconnect();
  };
}
