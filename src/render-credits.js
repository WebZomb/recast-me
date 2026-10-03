import {change,read,hash,randomToken,fault,sameOrigin,privateJson} from './commerce-store.js';
const COOKIE='__Host-recast-credit';
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
  if(!ip||!env.CREDIT_IP_SALT||String(env.CREDIT_IP_SALT).length<32)throw fault('credits_config','Free previews are awaiting setup by the owner.',503);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.CREDIT_IP_SALT),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip)))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
export async function creditBalance(env,wallet){
  const current=await read(env,walletKey(wallet.id));
  const trial=await read(env,trialKey(wallet.network));
  const free=Math.max(0,3-Number(trial?.used||0));
  const bonus=Object.values(current?.orders||{}).reduce((n,o)=>n+(o.revoked?0:Math.max(0,5-o.used)),0);
  return {free,bonus,remaining:free+bonus};
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
  return privateJson({ok:true,enabled:true,initialized:Boolean(wallet),...(wallet?await creditBalance(env,wallet):{}),freeAllowance:3,purchaseBonus:5,
    policy:'Three starter previews; shared-network abuse limits apply. Five bonus previews per verified paid order. Failed previews restore your credit. Site availability limits apply.'},200,cookie);
}
export async function bindCustomerCredits(request,env){
  if(!creditsEnabled(env))return env;
  const wallet=await walletFor(request,env);
  if(!wallet)throw fault('credits_required','Please reload to prepare your free previews.',401);
  return {...env,RECAST_CREDIT_WALLET:wallet};
}
export async function reserveCustomerRender(env){
  const wallet=env.RECAST_CREDIT_WALLET;
  if(!creditsEnabled(env)||!wallet)return; // owner/social still pass the global budget and call caps
  const ticket=randomToken();
  // Reserve while running; restore customer credit if a protected preview fails.
  // Provider spending reservations are never refunded automatically.
  try{
    await change(env,trialKey(wallet.network),{used:0},v=>{
      if(!Number.isSafeInteger(v.used)||v.used<0)throw fault('credits_storage','The preview allowance needs review.',503);
      if(v.used>=3)throw fault('trial_exhausted','Starter attempts used.',429);
      v.used++;v.active ||= {};v.active[ticket]=true;return v;
    });return {key:trialKey(wallet.network),ticket};
  }catch(e){if(e.code!=='trial_exhausted')throw e}
  let orderKey;
  await change(env,walletKey(wallet.id),null,v=>{
    if(!v)throw fault('credits_required','Please reload to prepare your previews.',401);
    if(Object.values(v.orders||{}).some(o=>!Number.isSafeInteger(o.used)||o.used<0||o.used>5))throw fault('credits_storage','The purchase credit balance needs review.',503);
    orderKey=Object.keys(v.orders||{}).find(k=>!v.orders[k].revoked&&v.orders[k].used<5);
    const order=v.orders?.[orderKey];
    if(!order)throw fault('render_credits_used','Your preview attempts are used. A paid order adds five more, and physical orders wait for your design approval.',429);
    order.used++;order.active ||= {};order.active[ticket]=true;return v;
  });
  return {key:walletKey(wallet.id),orderKey,ticket};
}
export async function settleCustomerRender(env,reservation,success){
  if(!reservation)return;
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
    if(!v.walletId&&eligible&&walletId)v.walletId=walletId;
    v.updatedAt=order.updatedAt||'';v.eligible=eligible;return v;
  });
  if(state.walletId)await change(env,walletKey(state.walletId),null,v=>{
    if(!v)throw fault('credits_storage','The purchase credit account needs review.',503);
    v.orders ||= {};
    const previous=v.orders[key];
    v.orders[key]={...previous,used:previous?.used||0,revoked:Boolean(previous?.revoked||state.revoked||!state.eligible)};
    return v;
  });
  return state;
}
