// Display policy only. The server independently enforces credits and Standard access.
export function fallbackState(snapshot,credits,mode='high'){
  const known=Boolean(credits?.enabled&&Number.isFinite(credits.remaining));
  const exhausted=known&&credits.remaining<=0;
  const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const reset=date(credits?.resetAt),bonus=credits?.purchaseBonus??3;
  const show=exhausted; // Provider outages and a stale selection do not unlock Standard.
  let message=show?`You’ve used your High Quality previews for now. You can try Standard, but it may have less detail or a weaker likeness. Not happy with it? ${reset?'High Quality refreshes '+reset+'.':'Come back after your daily reset.'} Or buy an item with a design you already love to get ${bonus} bonus High Quality previews for your next Recast.`:'';
  const standardReady=Boolean(show&&snapshot?.local?.ready&&snapshot?.modes?.quick?.ready&&credits.standardRemaining>0);
  if(show&&credits.standardRemaining<=0)message+=` Your Standard previews are also used.${date(credits.standardResetAt)?' They refresh '+date(credits.standardResetAt)+'.':''}`;
  if(show)message+=' Credits do not change an order already confirmed for printing or bypass site availability limits.';
  return {show,exhausted,standardReady,message,returnToHigh:mode==='quick'&&!exhausted};
}
export function creditSummary(credits){
  if(!credits?.enabled)return '';
  const daily=Number(credits.free||0),bonus=Number(credits.bonus||0);
  const reset=credits.resetAt&&Number.isFinite(Date.parse(credits.resetAt))?new Date(credits.resetAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  return `High Quality: ${daily} of ${credits.freeAllowance??3} daily previews left${bonus?` + ${bonus} purchase credits`:''}.${reset?' Refreshes '+reset+'.':''}${credits.remaining<=0?` Standard: ${credits.standardRemaining??0} left.`:''}`;
}

// A cooldown permits a deliberate retry; it is not a successful health probe.
export function recoveryUnverified(health){return Boolean(health?.ready&&health?.lastResult==='failed'&&['capacity','quota','timeout','unavailable'].includes(health.lastReason));}
