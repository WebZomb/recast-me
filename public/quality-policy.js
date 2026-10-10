// Display policy only. The server independently enforces credits and Standard access.
export function fallbackState(snapshot,credits,mode='high'){
  const known=Boolean(credits?.enabled&&Number.isFinite(credits.remaining));
  const exhausted=known&&credits.remaining<=0;
  const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const reset=date(credits?.resetAt);
  const outage=Boolean(known&&!exhausted&&snapshot?.standardOutageAvailable===true);
  const boughtStandard=Boolean(known&&Number(credits.purchasedStandard||0)>0);
  const show=exhausted||outage||boughtStandard;
  const standardTotal=Number(credits?.standardEffectiveRemaining??credits?.standardRemaining??0);
  const standardExhausted=Boolean(show&&standardTotal<=0);
  const standardReady=Boolean(show&&!standardExhausted&&snapshot?.local?.ready&&snapshot?.modes?.quick?.ready&&standardTotal>0);
  let message=exhausted
    ?'High Quality is used up.'+(reset?' Resets '+reset+'.':' Come back when it resets.')+(standardTotal>0?' You can try Standard (lower detail).':'')
    :outage
      ?'High Quality is unavailable. Standard uses a different Cloudflare model: weaker likeness, and it may also fail. You can wait or try it.'
      :boughtStandard
        ?'Your Standard credits are ready. Images may have less detail than High Quality.'
        :'';
  if(standardExhausted){
    message=exhausted
      ?'All free previews are used up.'+(reset?' High Quality resets '+reset+'.':'')+' Come back later or use a saved picture.'
      :'High Quality is unavailable, and Standard is used up. Try again later.';
  }
  return {show,exhausted,outage,standardExhausted,standardReady,message,
    returnToHigh:mode==='quick'&&!exhausted&&!outage&&!boughtStandard};
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

// The primary screen only needs remaining credits. Exact reset and purchase
// entitlements remain available in the optional details drawer via creditSummary.
export function creditHeadline(credits){
  if(!credits?.enabled)return '';
  if(credits.initialized===false)return 'Checking your previews…';
  const safe=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
  const high=Number.isFinite(Number(credits.remaining))?safe(credits.remaining):safe(credits.free)+safe(credits.bonus)+safe(credits.purchasedHigh);
  const standard=safe(credits.standardEffectiveRemaining??credits.standardRemaining);
  return 'High Quality: '+high+' left  ·  Standard: '+standard+' left';
}

// A cooldown permits a deliberate retry; it is not a successful health probe.
export function recoveryUnverified(health){return Boolean(health?.ready&&health?.lastResult==='failed'&&['capacity','quota','timeout','unavailable'].includes(health.lastReason));}
