import {change,read,hash,randomToken,fault,sameOrigin,privateJson} from './commerce-store.js';
import {extraCreditBalance,reserveExtraCredit,settleExtraCredit} from './credit-ledger.js';
const WINDOW_MS=86400000;
const windowState=(v,now)=>!v?.resetAt||now>=v.resetAt?{used:0,active:{},resetAt:now+WINDOW_MS}:v;
const standardKey=id=>`commerce/standard/${id}.json`;
const COOKIE='__Host-recast-credit';
const allowance=(env,key,fallback)=>{
  const raw=env[key]??fallback,n=Number(raw);
  if(!Number.isSafeInteger(n)||n<0||n>100)throw fault('credits_config','The preview allowance needs owner review.',503);
  return n;
};
const highLimit=env=>allowance(env,'HQ_FREE_ALLOWANCE',3);
const standardLimit=env=>allowance(env,'STANDARD_FREE_ALLOWANCE',5);
const purchaseAmount=env=>allowance(env,'PURCHASE_BONUS',3);
const granted=order=>{
  const n=order?.amount??5; // Preserve previously promised legacy five-credit grants.
  if(!Number.isSafeInteger(n)||n<0||n>100)throw fault('credits_storage','Purchase credits need review.',503);
  return n;
};
export const creditsEnabled=env=>env.RENDER_CREDITS_ENABLED==='true';
const walletKey=id=>`commerce/wallets/${id}.json`;
const trialKey=id=>`commerce/trials/${id}.json`;
export async function walletFor(request,env){
  const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(!/^[a-f0-9]{64}$/.test(token||''))return null;
  const id=await hash(token),wallet=await read(env,walletKey(id));
  return wallet ? {...wallet,id} : null;
}
async function networkKey(request,env){
  const ip=request.headers.get('cf-connecting-ip');
  let salt=env.CREDIT_IP_SALT;
  if(!salt&&env.RENDER_CREDITS_STORAGE_SALT==='true'){
    // Created by POST only, in private R2; never returned to browsers or diagnostics.
    const stored=await change(env,'commerce/private/network-salt.json',{salt:randomToken()},v=>v);
    salt=stored?.salt;
  }
  if(!ip||String(salt||'').length<32)throw fault('credits_config','Free previews are awaiting setup by the owner.',503);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(salt),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function creditBalance(env,wallet,now=Date.now()){
  const current=await read(env,walletKey(wallet.id));
  const trial=await read(env,trialKey(wallet.network));
  const daily=windowState(trial,now);
  const standard=windowState(await read(env,standardKey(wallet.network)),now);
  const extra=await extraCreditBalance(env,wallet.id,now);
  // The purchased 24-hour refill replaces this browser's current FREE window,
  // without resetting the shared-network budget for other people on the Wi-Fi.
  const free=extra.resetWindow?extra.resetWindow.high:Math.max(0,highLimit(env)-Number(daily.used||0));
  const standardRemaining=extra.resetWindow?extra.resetWindow.standard:Math.max(0,standardLimit(env)-standard.used);
  const bonus=Object.values(current?.orders||{}).reduce((n,o)=>n+(o.revoked?0:Math.max(0,granted(o)-o.used)),0);
  return {free,bonus,purchasedHigh:extra.purchasedHigh,purchasedStandard:extra.purchasedStandard,
    remaining:free+bonus+extra.purchasedHigh,standardRemaining,standardEffectiveRemaining:standardRemaining+extra.purchasedStandard,
    resetActive:Boolean(extra.resetWindow),
    resetAt:extra.resetWindow?.resetAt||new Date(daily.resetAt).toISOString(),
    standardResetAt:extra.resetWindow?.resetAt||new Date(standard.resetAt).toISOString()};
}
export async function creditRoute(request,env){
  if(new URL(request.url).pathname!=='/api/render-credits')return null;
  if(!['GET','POST'].includes(request.method))return privateJson({ok:false},405);
  if(!creditsEnabled(env))return privateJson({ok:true,enabled:false});
  let wallet=await walletFor(request,env),cookie={};
  if(request.method==='POST'){
    sameOrigin(request);
    if(!wallet){
      const token=randomToken(),id=await hash(token),network=await networkKey(request,env);
      wallet={id,network,orders:{},createdAt:new Date().toISOString()};
      await change(env,walletKey(id),wallet,()=>wallet);
      cookie={'set-cookie':`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=31536000`};
    }
  }
  return privateJson({ok:true,enabled:true,initialized:Boolean(wallet),...(wallet?await creditBalance(env,wallet):{}),freeAllowance:highLimit(env),standardAllowance:standardLimit(env),purchaseBonus:purchaseAmount(env),
    policy:`${highLimit(env)} High Quality previews per 24 hours. After High Quality is used, ${standardLimit(env)} Standard previews are available. Each verified paid Recast order adds ${purchaseAmount(env)} bonus High Quality previews for future creations, once per order. Shared-network and site limits apply. Failed previews restore your credit.`},200,cookie);
}
export async function bindCustomerCredits(request,env){
  if(!creditsEnabled(env))return env;
  const wallet=await walletFor(request,env);
  if(!wallet)throw fault('credits_required','Please reload to prepare your free previews.',401);
  return {...env,RECAST_CREDIT_WALLET:wallet};
}
export async function reserveCustomerRender(env,now=Date.now()){
  const wallet=env.RECAST_CREDIT_WALLET;
  if(!creditsEnabled(env)||!wallet)return; // owner/social still pass the global budget and call caps
  const ticket=randomToken();
  if(env.RECAST_RENDER_MODE==='quick'){
    const balance=await creditBalance(env,wallet,now);
    // Purchased Standard can be selected regardless of remaining HQ credits;
    // free Standard stays locked until the free HQ and merchandise bonus run out.
    if(balance.purchasedStandard>0){
      const ticket=await reserveExtraCredit(env,wallet.id,'standard',now);
      if(ticket)return ticket;
    }
    if(balance.free+balance.bonus>0&&env.RECAST_STANDARD_OUTAGE_APPROVED!=='true')throw fault('standard_locked','High Quality starter previews are available. Free Standard unlocks when starter and merchandise bonus previews are used, or during a verified outage.',409);
    if(balance.resetActive){
      const ticket=await reserveExtraCredit(env,wallet.id,'standard',now);
      if(ticket)return ticket;
      throw fault('standard_credits_used','Your 24-hour Standard refill is used. Wait for its reset or redeem more credits.',429);
    }
    const key=standardKey(wallet.network);
    await change(env,key,{used:0},previous=>{
      const v=windowState(previous,now);
      if(!Number.isSafeInteger(v.used)||v.used<0)throw fault('credits_storage','The Standard allowance needs review.',503);
      if(v.used>=standardLimit(env))throw fault('standard_credits_used','Your Standard preview allowance is used. Wait for its 24-hour reset.',429);
      v.used++;v.active ||= {};v.active[ticket]=true;return v;
    });
    return {key,ticket};
  }
  // A purchased reset provides an independent 24-hour personal High Quality
  // allowance. Never consume the old shared-network free window during it.
  const balance=await creditBalance(env,wallet,now);
  if(balance.resetActive){
    const ticket=await reserveExtraCredit(env,wallet.id,'high',now);
    if(ticket)return ticket;
  }else{
  // Reserve while running; restore customer credit if a protected preview fails.
  // Provider spending reservations are never refunded automatically.
  try{
    await change(env,trialKey(wallet.network),{used:0},previous=>{
      const v=windowState(previous,now);
      if(!Number.isSafeInteger(v.used)||v.used<0)throw fault('credits_storage','The preview allowance needs review.',503);
      if(v.used>=highLimit(env))throw fault('trial_exhausted','Starter attempts used.',429);
      v.used++;v.active ||= {};v.active[ticket]=true;return v;
    });return {key:trialKey(wallet.network),ticket};
  }catch(e){if(e.code!=='trial_exhausted')throw e}
  }
  // Keep the existing three-per-merch-order bonus; do not erase older grants.
  if(balance.bonus<=0&&balance.purchasedHigh>0){
    const ticket=await reserveExtraCredit(env,wallet.id,'high',now);
    if(ticket)return ticket;
  }
  let orderKey;
  try{await change(env,walletKey(wallet.id),null,v=>{
    if(!v)throw fault('credits_required','Please reload to prepare your previews.',401);
    if(Object.values(v.orders||{}).some(o=>!Number.isSafeInteger(o.used)||o.used<0||o.used>granted(o)))throw fault('credits_storage','The purchase credit balance needs review.',503);
    orderKey=Object.keys(v.orders||{}).find(k=>!v.orders[k].revoked&&v.orders[k].used<granted(v.orders[k]));
    const order=v.orders?.[orderKey];
    if(!order)throw fault('render_credits_used',`Your High Quality allowance is used. An eligible paid order adds ${purchaseAmount(env)} bonus High Quality previews for future creations, or wait for your 24-hour reset.`,429);
    order.used++;order.active ||= {};order.active[ticket]=true;return v;
  });return {key:walletKey(wallet.id),orderKey,ticket};
  }catch(error){
    // Purchased High Quality is available independently of old merch bonuses,
    // even if a stored order has no remaining credit.
    if(error.code==='render_credits_used'&&balance.purchasedHigh>0){
      const extra=await reserveExtraCredit(env,wallet.id,'high',now);if(extra)return extra;
    }
    throw error;
  }
}
export async function settleCustomerRender(env,reservation,success){
  if(!reservation)return;
  if(reservation.source)return settleExtraCredit(env,reservation,success);
  await change(env,reservation.key,null,v=>{
    const balance=reservation.orderKey?v?.orders?.[reservation.orderKey]:v;
    if(!balance?.active?.[reservation.ticket])return undefined;
    delete balance.active[reservation.ticket];
    if(!success)balance.used=Math.max(0,balance.used-1);
    return v;
  });
}
export const orderEligible=(order,env)=>order?.displayFinancialStatus==='PAID'&&!order.cancelledAt&&(!order.test||env.ALLOW_TEST_ORDER_CREDITS==='true');
// Shopify is the only source of payment truth. Never grant from a success URL.
export async function reconcileOrderCredits(env,order,walletId=null){
  if(!creditsEnabled(env))return null;
  const key=await hash(order.id),eligible=orderEligible(order,env);
  const state=await change(env,`commerce/orders/${key}.json`,{walletId:null,revoked:false,updatedAt:''},v=>{
    if(v.updatedAt>order.updatedAt)return undefined;
    if(v.walletId&&!eligible)v.revoked=true; // revocation is permanent for this purchase
    if(!v.walletId&&eligible&&walletId){v.walletId=walletId;v.grantAmount=purchaseAmount(env);}
    v.updatedAt=order.updatedAt||'';v.eligible=eligible;return v;
  });
  if(state.walletId)await change(env,walletKey(state.walletId),null,v=>{
    if(!v)throw fault('credits_storage','The purchase credit account needs review.',503);
    v.orders ||= {};
    const previous=v.orders[key];
    v.orders[key]={...previous,amount:previous?granted(previous):(state.grantAmount??5),used:previous?.used||0,revoked:Boolean(previous?.revoked||state.revoked||!state.eligible)};
    return v;
  });
  return state;
}
