const byId=id=>document.getElementById(id);
const packs=byId('credit-pack-grid'),balance=byId('my-credit-balance'),status=byId('sales-status');
const historyKey='recast_credit_purchase_claims_v1';
const titleMap={reset:'Daily reset · 3 HQ + 5 Standard',hq10:'10 High Quality',hq20:'20 High Quality',hq50:'50 High Quality',std10:'10 Standard',std20:'20 Standard',std50:'50 Standard'};
const money=n=>'$'+(Number(n)/100).toFixed(2);
async function api(path,{method='GET',body}={}){
 const r=await fetch(path,{method,headers:{'x-recast-request':'1',...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const result=await r.json().catch(()=>({}));if(!r.ok||result.ok===false)throw Error(result.error||'Credits are temporarily unavailable.');return result;
}
function recorded(){try{const value=JSON.parse(localStorage.getItem(historyKey)||'[]');return Array.isArray(value)?value.filter(x=>/^[a-f0-9]{64}$/.test(x)).slice(0,15):[]}catch{return []}}
function saveClaim(token){const arr=[token,...recorded().filter(x=>x!==token)].slice(0,15);localStorage.setItem(historyKey,JSON.stringify(arr))}
function el(name,classes='',text=''){const e=document.createElement(name);if(classes)e.className=classes;e.textContent=text;return e}
async function refreshBalance(){
 try{const v=await api('/api/render-credits',{method:'POST'});if(!v.enabled)throw Error('The credit wallet is not active.');
 balance.textContent='High Quality: '+v.free+' of '+v.freeAllowance+' daily left'+(v.bonus?' + '+v.bonus+' merchandise bonus':'')+(v.purchasedHigh?' + '+v.purchasedHigh+' purchased HQ':'')+'\nStandard: '+v.standardRemaining+' of '+v.standardAllowance+' daily left'+(v.purchasedStandard?' + '+v.purchasedStandard+' purchased Standard':'')+'\nDaily reset times: HQ '+local(v.resetAt)+' · Standard '+local(v.standardResetAt);
 }catch(e){balance.textContent=e.message}
}
const local=iso=>iso&&Number.isFinite(Date.parse(iso))?new Date(iso).toLocaleString():'unavailable';
async function loadPacks(){
 const catalog=await api('/api/credit-packs/catalog');
 status.textContent=catalog.salesEnabled?'Payments are handled securely by our existing Shopify checkout.':catalog.enabled?'Redemption codes are available. Paid packs are being checked before launch.':'Paid packs and redemption codes are being prepared. No purchase is available yet.';
 packs.replaceChildren();
 for(const p of catalog.packs||[]){
  const card=el('article','pack'+(p.id==='reset'?' featured':'')),heading=el('h3','',p.title),price=el('div','price',money(p.priceCents));
  const desc=el('p','',p.type==='reset'?'3 High Quality and 5 Standard, available for 24 hours after redemption. A new reset replaces your existing reset.':p.type==='high'?'High Quality credits never expire.': 'Standard credits never expire. Lower-detail previews.');
  const actions=el('div','pack-actions');
  for(const [mode,label] of [['self','Buy for myself'],['gift','Send as a gift']]){
   const button=el('button','buy-button',catalog.salesEnabled?label:'Coming soon');button.type='button';button.disabled=!catalog.salesEnabled;
   button.addEventListener('click',async()=>{button.disabled=true;status.textContent='Preparing your Shopify checkout…';try{
    const v=await api('/api/credit-packs/checkout',{method:'POST',body:{packId:p.id,mode}});
    saveClaim(v.claimToken);location.assign(v.checkoutUrl);
   }catch(e){status.textContent=e.message;button.disabled=false}});
   actions.append(button);
  }
  card.append(heading,price,desc,actions);packs.append(card);
 }
}
async function checkPurchases(){
 const view=byId('credit-purchase-list');view.replaceChildren();const tokens=recorded();
 if(!tokens.length){view.textContent='No recent credit purchases recorded in this browser.';return}
 for(const token of tokens){
  const card=el('article','purchase');card.append(el('strong','','Checking purchase…'));view.append(card);
  try{
   const p=await api('/api/credit-packs/purchase',{method:'POST',body:{claimToken:token}});
   card.replaceChildren();card.append(el('strong','',p.titleMap||titleMap[p.packId]||p.title));
   const copy=p.status==='paid'?(p.mode==='gift'?'Your gift code is ready. Copy it and share privately.':'Your credits were automatically applied to your wallet.'):'Payment not verified yet. Come back after checkout and check again.';
   card.append(el('p',p.status==='awaiting_payment'?'warn':'',p.status==='refunded'?'Payment reversed. Unspent credits have been revoked.':copy));
   if(p.issuedCode){
    card.append(el('code','code-text',p.issuedCode));
    const btn=el('button','minor-button','Copy gift code');btn.type='button';btn.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(p.issuedCode);btn.textContent='Copied!'}catch{btn.textContent='Select and copy the code above'}});card.append(btn);
    const linkButton=el('button','minor-button','Copy gift link');linkButton.type='button';linkButton.addEventListener('click',async()=>{
      const link=new URL('/credits.html',location.origin);link.searchParams.set('code',p.issuedCode);
      try{await navigator.clipboard.writeText(link.href);linkButton.textContent='Gift link copied!'}
      catch{linkButton.textContent='Copy the code above and share it privately.'}
    });card.append(linkButton);
   }
  }catch(e){card.replaceChildren();card.append(el('p','warn',e.message))}
 }
 await refreshBalance();
}
byId('refresh-credit-balance').addEventListener('click',refreshBalance);
byId('check-credit-orders').addEventListener('click',checkPurchases);
byId('redeem-credit-form').addEventListener('submit',async event=>{
 event.preventDefault();const notice=byId('redeem-credit-status'),button=event.currentTarget.querySelector('button');
 button.disabled=true;notice.textContent='Checking your code…';
 try{const v=await api('/api/credit-packs/redeem',{method:'POST',body:{code:byId('redeem-credit-code').value}});
 notice.textContent='Success! '+(titleMap[v.packId]||v.title)+' added to this browser’s credit wallet.';byId('redeem-credit-code').value='';await refreshBalance();
 }catch(e){notice.textContent=e.message}finally{button.disabled=false}
});
const params=new URLSearchParams(location.search);if(params.has('code'))byId('redeem-credit-code').value=params.get('code').slice(0,35);
await refreshBalance();await loadPacks().catch(e=>status.textContent=e.message);await checkPurchases();
