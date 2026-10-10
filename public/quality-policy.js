// Display policy only. The server independently enforces credits and Standard access.
export function fallbackState(snapshot,credits,mode='high'){
  const known=Boolean(credits?.enabled&&Number.isFinite(credits.remaining));
  const exhausted=known&&credits.remaining<=0;
  const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const reset=date(credits?.resetAt),bonus=credits?.purchaseBonus??3;
  const outage=Boolean(known&&!exhausted&&snapshot?.standardOutageAvailable===true);
  const boughtStandard=Boolean(known&&Number(credits.purchasedStandard||0)>0);
  const show=exhausted||outage||boughtStandard; // Paying for Standard unlocks that purchased balance only.
  let message=boughtStandard&&!exhausted&&!outage
    ?'You have purchased Standard credits. Standard may have lower detail or likeness than High Quality; choose it when you want to use those credits.'
    :outage
    ?'High Quality is temporarily unavailable on the approved rendering routes. You can choose Standard, which uses a different Cloudflare model, but it may also fail if Cloudflare is having problems. Standard may have less detail or a weaker likeness. This is optional: you can wait for High Quality. A successful Standard preview uses only a Standard credit and keeps your High Quality credits.'
    :exhausted?`You’ve used your High Quality previews for now. You can try Standard, but it may have less detail or a weaker likeness. Not happy with it? ${reset?'High Quality refreshes '+reset+'.':'Come back after your daily reset.'} Or buy an item with a design you already love to get ${bonus} bonus High Quality previews for your next Recast.`:'';
  const standardTotal=Number(credits?.standardEffectiveRemaining??credits?.standardRemaining??0);
  const standardExhausted=Boolean(show&&standardTotal<=0);
  const standardReady=Boolean(show&&!standardExhausted&&snapshot?.local?.ready&&snapshot?.modes?.quick?.ready&&standardTotal>0);
  if(standardExhausted){
    const standardReset=date(credits.standardResetAt);
    message=exhausted
      ?`Both your free High Quality and Standard preview allowances are used up. ${reset?'High Quality refreshes '+reset+'.':'High Quality refreshes after its daily window.'} ${standardReset?'Standard refreshes '+standardReset+'.':'Standard refreshes after its separate daily window.'} You can still choose a product with a saved Recast. A purchase of an item you already love grants ${bonus} bonus High Quality previews for your next Recast.`
      :`High Quality is temporarily unavailable and your Standard previews are used up. ${standardReset?'Standard refreshes '+standardReset+'.':'Check the Standard reset time above.'} You can wait for High Quality to recover.`;
  }
  if(show)message+=' Credits do not change an order already confirmed for printing or bypass site availability limits.';
  return {show,exhausted,outage,standardExhausted,standardReady,message,returnToHigh:mode==='quick'&&!exhausted&&!outage&&!boughtStandard};
}
// The customer balance is read-only; the server still controls allowances and access.
export function creditSummary(credits,showStandard=false){
  if(!credits?.enabled)return '';
  if(credits.initialized===false)return 'Preparing your preview allowances…';
  const count=(value,fallback)=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):fallback;
  const reset=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const highAllowance=count(credits.freeAllowance,3);
  const free=Math.min(highAllowance,count(credits.free,0));
  const bonus=count(credits.bonus,0),purchasedHigh=count(credits.purchasedHigh,0),purchasedStandard=count(credits.purchasedStandard,0);
  const highReset=reset(credits.resetAt);
  const lines=[`High Quality: ${free} of ${highAllowance} daily previews left (${highAllowance-free} used)${bonus?` + ${bonus} merchandise bonus`:''}${purchasedHigh?` + ${purchasedHigh} purchased HQ`:''}.${highReset?' Refreshes '+highReset+'.':''}`];
  // Always display both balances, including Standard while locked; visibility
  // never unlocks the server-side Standard engine or changes existing credits.
  {
    const standardAllowance=count(credits.standardAllowance,5);
    const standardLeft=Math.min(standardAllowance,count(credits.standardRemaining,standardAllowance));
    const standardReset=reset(credits.standardResetAt);
    const standardLock=Number(credits.remaining)>0&&!purchasedStandard ? (showStandard?' Offered while High Quality is unavailable.':' Free Standard unlocks after High Quality is used (or during an approved High Quality outage).') : '';
    lines.push(`Standard: ${standardLeft} of ${standardAllowance} daily previews left (${standardAllowance-standardLeft} used)${purchasedStandard?` + ${purchasedStandard} purchased Standard`:''}.${standardReset?' Refreshes '+standardReset+'.':''}${standardLock}`);
  }
  return lines.join('\n');
}

// A cooldown permits a deliberate retry; it is not a successful health probe.
export function recoveryUnverified(health){return Boolean(health?.ready&&health?.lastResult==='failed'&&['capacity','quota','timeout','unavailable'].includes(health.lastReason));}
