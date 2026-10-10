// Durable, per-browser purchase and redemption ledger. No extra service or account.
// Free shared-network allowances remain in render-credits.js.
import {change,read,hash,randomToken,fault} from './commerce-store.js';

export const CREDIT_PACKS=Object.freeze({
  reset:{sku:'RECAST-CREDIT-RESET-24H',title:'24-hour refill · 3 HQ + 5 Standard',type:'reset',high:3,standard:5,priceCents:299,variantId:'67762889818356'},
  hq10:{sku:'RECAST-CREDIT-HQ-10',title:'+10 High Quality',type:'high',high:10,standard:0,priceCents:499,variantId:'67762890277108'},
  hq20:{sku:'RECAST-CREDIT-HQ-20',title:'+20 High Quality',type:'high',high:20,standard:0,priceCents:899,variantId:'67762890309876'},
  hq50:{sku:'RECAST-CREDIT-HQ-50',title:'+50 High Quality',type:'high',high:50,standard:0,priceCents:1999,variantId:'67762890342644'},
  std10:{sku:'RECAST-CREDIT-STD-10',title:'+10 Standard',type:'standard',high:0,standard:10,priceCents:299,variantId:'67762892144884'},
  std20:{sku:'RECAST-CREDIT-STD-20',title:'+20 Standard',type:'standard',high:0,standard:20,priceCents:549,variantId:'67762892177652'},
  std50:{sku:'RECAST-CREDIT-STD-50',title:'+50 Standard',type:'standard',high:0,standard:50,priceCents:1199,variantId:'67762892210420'}
});
export const PACK_FOR_SKU=Object.freeze(Object.fromEntries(Object.entries(CREDIT_PACKS).map(([id,p])=>[p.sku,{id,...p}])));
const DAY=86400000;
const walletKey=id=>'commerce/credits/wallets/'+id+'.json';
const codeKey=id=>'commerce/credits/codes/'+id+'.json';
const empty=()=>({grants:{},redemptions:{},reset:null});
const safeCode=input=>String(input||'').trim().toUpperCase().replace(/\s/g,'');
const formatCode=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const chars=crypto.getRandomValues(new Uint8Array(20));const raw=[...chars].map(n=>alphabet[n%alphabet.length]).join('');return 'RC-'+raw.match(/.{1,5}/g).join('-')};
function validCode(code){if(!/^RC-(?:[A-HJ-NP-Z2-9]{5}-){3}[A-HJ-NP-Z2-9]{5}$/.test(code))throw fault('credit_code_invalid','Enter a valid Recast credit code.',400)}
const validWallet=id=>{if(!/^[a-f0-9]{64}$/.test(String(id||'')))throw fault('wallet_missing','Open Recast Me in the browser where you created your credits.',401);return id};
const packFor=id=>{const p=CREDIT_PACKS[id];if(!p)throw fault('pack_invalid','This credit package is unavailable.',400);return p};
function activeReset(state,now=Date.now()){const r=state?.reset;return r&&!r.revoked&&r.resetAt>now?r:null}
export async function extraCreditBalance(env,walletId,now=Date.now()){
  const state=await read(env,walletKey(validWallet(walletId)))||empty();
  let purchasedHigh=0,purchasedStandard=0;
  for(const grant of Object.values(state.grants||{})){
    if(grant.revoked)continue;
    if(!Number.isSafeInteger(grant.total)||!Number.isSafeInteger(grant.used)||grant.total<0||grant.total>50||grant.used<0||grant.used>grant.total)throw fault('credits_storage','Purchased credits need review.',503);
    if(grant.type==='high')purchasedHigh+=grant.total-grant.used;
    if(grant.type==='standard')purchasedStandard+=grant.total-grant.used;
  }
  const r=activeReset(state,now);
  return {purchasedHigh,purchasedStandard,resetWindow:r?{high:Math.max(0,3-r.highUsed),standard:Math.max(0,5-r.standardUsed),resetAt:new Date(r.resetAt).toISOString()}:null};
}
export async function newCreditCode(env,{packId,source='owner',orderId=null,lineId=null,exactCode=null,expiresAt=null}){
  const p=packFor(packId),code=exactCode||formatCode();validCode(code);
  const id=await hash(code),record={id,last4:code.slice(-4),packId,source,orderId,lineId,issuedAt:new Date().toISOString(),expiresAt,redeemedWallet:null,redeemedAt:null,revokedAt:null};
  const existing=await change(env,codeKey(id),null,old=>{
    if(old?.id){if(source==='shopify'&&old.source==='shopify'&&old.orderId===orderId&&old.lineId===lineId&&old.packId===packId)return undefined;throw fault('code_conflict','This redemption code is already assigned.',409)}
    return record;
  });
  return {code,id,record:existing,p};
}
// A code is bound to only one wallet before a grant is applied. If writing the
// wallet then fails, the same wallet can safely retry; others cannot steal it.
export async function redeemCreditCode(env,codeInput,walletId,now=Date.now()){
  const code=safeCode(codeInput);validCode(code);validWallet(walletId);
  const id=await hash(code),key=codeKey(id);
  const current=await change(env,key,null,old=>{
    if(!old)throw fault('credit_code_missing','This code was not found or is not yet activated by a verified payment.',404);
    if(old.revokedAt)throw fault('credit_code_revoked','This code is no longer valid. Contact support if you purchased it.',409);
    if(old.expiresAt&&Date.parse(old.expiresAt)<=now)throw fault('credit_code_expired','This promotional code has expired.',409);
    if(old.redeemedWallet&&old.redeemedWallet!==walletId)throw fault('credit_code_used','This code has already been redeemed.',409);
    if(old.redeemedWallet===walletId)return undefined;
    return {...old,redeemedWallet:walletId,redeemedAt:new Date(now).toISOString()};
  });
  const p=packFor(current.packId);
  await change(env,walletKey(walletId),empty(),v=>{
    v.grants||={};v.redemptions||={};
    if(v.redemptions[id])return undefined; // Idempotent across retries and order sync.
    if(p.type==='reset'){
      if(v.reset&&Object.keys(v.reset.active||{}).length)throw fault('render_active','Wait for your current render to finish before activating a new daily refill.',409);
      v.reset={sourceCodeId:id,highUsed:0,standardUsed:0,active:{},resetAt:now+DAY,startedAt:new Date(now).toISOString(),revoked:false};
    }else{
      v.grants[id]={type:p.type,total:p.type==='high'?p.high:p.standard,used:0,active:{},issuedAt:new Date(now).toISOString(),revoked:false};
    }
    v.redemptions[id]={packId:current.packId,redeemedAt:new Date(now).toISOString()};
    return v;
  });
  // Payment refunds can race the two-key code/wallet transition. Reconcile a
  // revocation again after applying a grant so a late redeem never survives it.
  const latest=await read(env,key);
  if(latest?.revokedAt){await revokeCreditCode(env,id,'race_with_revocation',now);throw fault('credit_code_revoked','This code was revoked. Contact support.',409)}
  return {ok:true,packId:current.packId,title:p.title,alreadyRedeemed:Boolean(current.redeemedAt&&current.redeemedWallet),id};
}
export async function revokeCreditCode(env,id,reason='owner',now=Date.now()){
  if(!/^[a-f0-9]{64}$/.test(String(id||'')))throw fault('code_invalid','Invalid code reference.',400);
  const record=await change(env,codeKey(id),null,v=>{
    if(!v)throw fault('code_missing','This code does not exist.',404);
    if(v.revokedAt)return undefined;
    return {...v,revokedAt:new Date(now).toISOString(),revokeReason:reason};
  });
  if(record.redeemedWallet){
    await change(env,walletKey(record.redeemedWallet),empty(),v=>{
      if(v.grants?.[id])v.grants[id].revoked=true;
      if(v.reset?.sourceCodeId===id)v.reset.revoked=true;
      return v;
    });
  }
  return {id,revoked:true,redeemed:Boolean(record.redeemedWallet)};
}
export async function reserveExtraCredit(env,walletId,type,now=Date.now(),{purchasedOnly=false}={}){
  validWallet(walletId);
  if(!['high','standard'].includes(type))throw fault('credits_type','Unknown preview type.',400);
  const key=walletKey(walletId),ticket=randomToken();let selected=null;
  await change(env,key,empty(),v=>{
    // A failed CAS attempt must not leave a stale reservation ticket behind.
    selected=null;
    const r=activeReset(v,now),usedKey=type==='high'?'highUsed':'standardUsed',allowance=type==='high'?3:5;
    // The refill is a fresh *personal* daily period. It doesn't reset the
    // shared-network free budget for any other user on the same Wi-Fi.
    if(!purchasedOnly&&r&&r[usedKey]<allowance){
      r[usedKey]++;r.active||={};r.active[ticket]=type;
      selected={key,ticket,source:'reset',codeId:r.sourceCodeId,type};return v;
    }
    const grants=Object.entries(v.grants||{}).filter(([id,g])=>!g.revoked&&g.type===type&&g.used<g.total)
      .sort((a,b)=>String(a[1].issuedAt).localeCompare(String(b[1].issuedAt)));
    const found=grants[0];if(!found)return undefined;
    found[1].used++;found[1].active||={};found[1].active[ticket]=true;
    selected={key,ticket,source:'grant',codeId:found[0],type};return v;
  });
  return selected;
}
export async function settleExtraCredit(env,reservation,success){
  if(!reservation)return;
  await change(env,reservation.key,empty(),v=>{
    if(reservation.source==='reset'){
      const r=v.reset;if(r?.sourceCodeId!==reservation.codeId||!r.active?.[reservation.ticket])return undefined;
      delete r.active[reservation.ticket];
      if(!success)r[reservation.type==='high'?'highUsed':'standardUsed']=Math.max(0,r[reservation.type==='high'?'highUsed':'standardUsed']-1);
    }else{
      const g=v.grants?.[reservation.codeId];if(!g?.active?.[reservation.ticket])return undefined;
      delete g.active[reservation.ticket];if(!success)g.used=Math.max(0,g.used-1);
    }
    return v;
  });
}
export async function listCreditCodes(env,limit=50){
  const page=await env.ARTWORK?.list({prefix:'commerce/credits/codes/',limit:Math.min(200,Math.max(1,limit))});
  const rows=[];
  for(const object of page?.objects||[]){const v=await read(env,object.key);if(v)rows.push({id:v.id,last4:v.last4,packId:v.packId,source:v.source,issuedAt:v.issuedAt,redeemedAt:v.redeemedAt,revokedAt:v.revokedAt,orderId:v.orderId||null});}
  rows.sort((a,b)=>String(b.issuedAt).localeCompare(String(a.issuedAt)));
  return {items:rows.slice(0,limit),more:Boolean(page?.truncated)};
}
