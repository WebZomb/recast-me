// Supplier template facts for owner planning, never a purchase or print permission.
// Uses only sanitized cached Printful catalog data. No provider calls from browser.
const status=document.querySelector('#printfile-audit-status');
const list=document.querySelector('#printfile-audit-list');
const refresh=document.querySelector('#printfile-audit-refresh');
const tab=document.querySelector('[data-tab="ready-made-qa"]');
const el=(tag,className,text)=>{
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=String(text);
 return node;
};
// Same-tab navigation preserves the existing owner session without putting
// its token into a link. The destination separately authenticates every action.
const qaPanel=document.querySelector('[data-panel="ready-made-qa"]');
if(qaPanel&&!document.getElementById('small-gift-review-link')){
 const nav=el('p','muted'),link=el('a',null,'Review clean print files and publish finished gifts');
 link.id='small-gift-review-link';link.href='/admin-small-gifts';
 nav.append(link);qaPanel.prepend(nav);
}
const label=s=>({
 complete:'Supplier dimensions checked',not_started:'Awaiting catalog check',
 checking:'Checking template',needs_review:'Supplier template needs review',
 higher_resolution_master_needed:'Needs higher-resolution artwork',
 crop_or_fit_review_needed:'Needs layout and crop review',
 needs_template_review:'No verified print template',
 supplier_proof_still_required:'Source pixels fit · proof still required'
}[s]||'Needs review');
let last=0;
async function load(){
 if(!status||!list)return;
 const current=++last;
 status.textContent='Checking saved Printful print-area reports…';
 list.replaceChildren();
 try{
  const response=await fetch('/api/shop/printfile-audit',{cache:'no-store',credentials:'omit'});
  if(!response.ok)throw Error('Supplier print-area summary unavailable.');
  const report=await response.json();
  if(current!==last)return;
  if(!report?.ok||!Array.isArray(report.products))throw Error('Supplier print-area summary invalid.');
  const total=report.products.length;
  const checked=report.products.filter(p=>p.status==='complete').length;
  const blocked=report.products.filter(p=>p.status==='needs_review').length;
  status.textContent=checked+' of '+total+' product templates checked'
   +(blocked?' · '+blocked+' need supplier review':'')
   +'. These are size checks only; real Printful proofs and approved print files are still required.';
  for(const product of report.products){
   const details=el('details','printfile-audit-item');
   const heading=el('summary',null,String(product.product||'Product')+' · '+label(product.status));
   details.append(heading);
   const body=el('div','printfile-audit-body');
   if(product.status==='not_started'||product.status==='checking'){
    body.append(el('p',null,'This read-only supplier catalog check is scheduled. No orders or preview tasks are created.'));
   }else if(product.status==='needs_review'){
    body.append(el('p',null,'The supplier template is not verified. No product variant may be enabled from this result.'));
   }else{
    for(const v of product.variants||[]){
     const p=el('p','printfile-audit-variant');
     const native=v.area?String(v.area.width)+' × '+String(v.area.height)+' px · '+String(v.area.dpi)+' DPI':'Template unknown';
     p.textContent=String(v.sku||'')+' — '+native+' — '+label(v.status);
     body.append(p);
    }
   }
   details.append(body);list.append(details);
  }
 }catch(e){
  if(current!==last)return;
  status.textContent='The size checks are temporarily unavailable. Your shop, cart and saved product designs were not changed.';
 }
}
refresh?.addEventListener('click',load);
tab?.addEventListener('click',load);
