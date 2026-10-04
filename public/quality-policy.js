// Presentation only: the server enforces balances and shared spending safeguards.
export function fallbackState(snapshot,credits,mode='high'){
  const exhausted=Boolean(credits?.enabled&&credits.remaining<=0);
  const health=snapshot?.modes?.high;
  const outage=Boolean(health&&!health.ready);
  const show=exhausted||outage||mode==='quick';
  const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):null;
  const reset=date(credits?.resetAt);
  let message=exhausted?`Your High Quality allowance is used. ${reset?'Free renders return '+reset+'.':'Check back for your next allowance.'} An eligible paid order adds ${credits?.purchaseBonus??5} High Quality renders.`
    :outage?`High Quality is ${health.reason==='capacity'?'busy':health.reason==='timeout'?'cooling down after a timeout':health.reason==='quota'?'paused by shared provider capacity':'temporarily unavailable'}. Your photos and choices are saved on this page.`
    :mode==='quick'?'You selected Standard. You can return to High Quality before creating.':'';
  const standardReady=Boolean(show&&snapshot?.local?.ready&&snapshot?.modes?.quick?.ready&&(!credits?.enabled||credits.standardRemaining>0));
  if(show&&credits?.enabled&&credits.standardRemaining<=0)message+=` Your Standard allowance is also used.${date(credits.standardResetAt)?' It returns '+date(credits.standardResetAt)+'.':''}`;
  if(show)message+=' Both options depend on site availability and the shared spending limit. Purchases do not bypass these limits.';
  return {show,exhausted,standardReady,message};
}
