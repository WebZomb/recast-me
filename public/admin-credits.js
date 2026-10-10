// Owner-only credit code issue / audit / revocation; keep actual codes private.
export function initOwnerCredits(api,notify){
 const root=document.querySelector('[data-panel="credits"]');
 if(!root)return {load:async()=>{},clear:()=>{}};
 const form=root.querySelector('#credit-issue-form'),result=root.querySelector('#issued-code'),history=root.querySelector('#credit-code-history'),status=root.querySelector('#credit-admin-status');
 const packageNames={reset:'24-hour refill · 3 HQ + 5 Standard',hq10:'10 High Quality',hq20:'20 High Quality',hq50:'50 High Quality',std10:'10 Standard',std20:'20 Standard',std50:'50 Standard'};
 const text=(selector,value)=>{const x=root.querySelector(selector);if(x)x.textContent=value};
 const load=async()=>{
  try{const r=await api('/api/admin/credit-codes');history.replaceChildren();
   for(const row of r.items||[]){
    const article=document.createElement('article');article.className='glass op-card';
    const title=document.createElement('strong');title.textContent=(packageNames[row.packId]||row.packId)+' · …'+row.last4;
    const desc=document.createElement('p');desc.className='muted';
    desc.textContent=(row.revokedAt?'Revoked · '+row.revokedAt:row.redeemedAt?'Redeemed · '+row.redeemedAt:'Not redeemed')+' · '+(row.source==='owner'?'Owner gift':'Verified Shopify purchase')+' · issued '+row.issuedAt;
    article.append(title,desc);
    if(!row.revokedAt&&!row.redeemedAt&&row.source==='owner'){
      const button=document.createElement('button');button.type='button';button.className='danger';button.textContent='Revoke unused code';
      button.addEventListener('click',async()=>{
        if(!confirm('Revoke this unused owner-issued code? It cannot be redeemed afterward.'))return;
        button.disabled=true;
        try{await api('/api/admin/credit-codes/revoke',{method:'POST',body:{id:row.id,confirm:'REVOKE_CODE'}});notify('Code revoked.');await load()}
        catch(e){status.textContent=e.message;button.disabled=false}
      });article.append(button);
    }
    history.append(article);
   }
   if(!r.items?.length)history.textContent='No credit codes have been issued yet.';
   if(r.more)text('#credit-admin-status','Showing the latest code records. Older codes are preserved but not listed.');
  }catch(e){history.textContent=e.message}
 };
 form.addEventListener('submit',async event=>{
   event.preventDefault();
   const button=form.querySelector('[type="submit"]'),packId=form.elements.namedItem('packId').value,raw=form.elements.namedItem('expiresDays').value;
   const payload={packId};if(raw)payload.expiresDays=Number(raw);
   button.disabled=true;result.replaceChildren();status.textContent='Issuing unique private code…';
   try{
     const r=await api('/api/admin/credit-codes',{method:'POST',body:payload});
     const code=document.createElement('code');code.className='code-text';code.textContent=r.code;
     const copy=document.createElement('button');copy.type='button';copy.textContent='Copy code to share';
     copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(r.code);copy.textContent='Copied!'}catch{copy.textContent='Select and copy the code above'}});
     result.append(code,copy);status.textContent='Code created. Copy it now; the dashboard will only show its last four characters afterward.';
     await load();
   }catch(e){status.textContent=e.message}finally{button.disabled=false}
 });
 root.querySelector('#credit-codes-refresh')?.addEventListener('click',load);
 return {load,clear:()=>{result.replaceChildren();status.textContent='';history.replaceChildren()}};
}
