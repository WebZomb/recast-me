// Display policy only. The server independently enforces credits and Standard access.
export function fallbackState(snapshot,credits,mode='high'){
  const known=Boolean(credits?.enabled&&Number.isFinite(credits.remaining));
  const exhausted=known&&credits.remaining<=0;
  const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const reset=date(credits?.resetAt),bonus=credits?.purchaseBonus??3;
  const outage=Boolean(known&&!exhausted&&snapshot?.standardOutageAvailable===true);
  const show=exhausted||outage; // Outage eligibility is calculated server-side, not inferred from a browser timer.
  let message=outage
    ?'High Quality is temporarily unavailable on the approved rendering routes. You can choose Standard, which uses a different Cloudflare model, but it may also fail if Cloudflare is having problems. Standard may have less detail or a weaker likeness. This is optional: you can wait for High Quality. A successful Standard preview uses only a Standard credit and keeps your High Quality credits.'
    :exhausted?`You’ve used your High Quality previews for now. You can try Standard, but it may have less detail or a weaker likeness. Not happy with it? ${reset?'High Quality refreshes '+reset+'.':'Come back after your daily reset.'} Or buy an item with a design you already love to get ${bonus} bonus High Quality previews for your next Recast.`:'';
  const standardReady=Boolean(show&&snapshot?.local?.ready&&snapshot?.modes?.quick?.ready&&credits.standardRemaining>0);
  if(show&&credits.standardRemaining<=0)message+=` Your Standard previews are also used.${date(credits.standardResetAt)?' They refresh '+date(credits.standardResetAt)+'.':''}`;
  if(show)message+=' Credits do not change an order already confirmed for printing or bypass site availability limits.';
  return {show,exhausted,outage,standardReady,message,returnToHigh:mode==='quick'&&!exhausted&&!outage};
}
// The customer balance is read-only; the server still controls allowances and access.
export function creditSummary(credits,showStandard=false){
  if(!credits?.enabled)return '';
  if(credits.initialized===false)return 'Preparing your preview allowances…';
  const count=(value,fallback)=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):fallback;
  const reset=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const highAllowance=count(credits.freeAllowance,3);
  const free=Math.min(highAllowance,count(credits.free,0));
  const bonus=count(credits.bonus,0);
  const highReset=reset(credits.resetAt);
  const lines=[`High Quality: ${free} of ${highAllowance} daily previews left (${highAllowance-free} used)${bonus?` + ${bonus} purchase credits`:''}.${highReset?' Refreshes '+highReset+'.':''}`];
  // Only announce Standard when HQ is depleted or an approved HQ-outage fallback
  // has been offered. Displaying a balance never unlocks the Standard engine.
  if(showStandard||Number(credits.remaining)<=0){
    const standardAllowance=count(credits.standardAllowance,5);
    const standardLeft=Math.min(standardAllowance,count(credits.standardRemaining,standardAllowance));
    const standardReset=reset(credits.standardResetAt);
    lines.push(`Standard: ${standardLeft} of ${standardAllowance} daily previews left (${standardAllowance-standardLeft} used).${standardReset?' Refreshes '+standardReset+'.':''}${Number(credits.remaining)>0?' Offered only while High Quality is unavailable.':''}`);
  }
  return lines.join('\n');
}

// A cooldown permits a deliberate retry; it is not a successful health probe.
export function recoveryUnverified(health){return Boolean(health?.ready&&health?.lastResult==='failed'&&['capacity','quota','timeout','unavailable'].includes(health.lastReason));}
