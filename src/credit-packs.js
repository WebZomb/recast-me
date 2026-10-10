// Native Shopify checkout + Cloudflare R2 fulfillment. No new billing provider.
// Draft Shopify SKUs remain unbuyable until CREDIT_SALES_ENABLED=true.
import {change,read,hash,randomToken,fault,equal,sameOrigin,privateJson} from './commerce-store.js';
import {walletFor,creditBalance,creditsEnabled} from './render-credits.js';
import {CREDIT_PACKS,PACK_FOR_SKU,newCreditCode,redeemCreditCode,revokeCreditCode,listCreditCodes} from './credit-ledger.js';
const intentKey=id=>'commerce/credits/intents/'+id+'.json';
const active=env=>env.CREDIT_PACKS_ENABLED==='true';
const sales=env=>active(env)&&env.CREDIT_SALES_ENABLED==='true';
const owner=(request,env)=>{
  const auth=request.headers.get('authorization')||'';
  const token=auth.match(/^Bearer\s+(.+)$/i)?.[1]||request.headers.get('x-recast-admin');
  if(!env.ADMIN_TOKEN||!equal(token,env.ADMIN_TOKEN))throw fault('admin_required','Admin authorization required.',401);
};
const fromPack=id=>{const p=CREDIT_PACKS[id];if(!p)throw fault('pack_invalid','Choose a valid preview package.',400);return p};
const shopHost=env=>{const value=String(env.SHOPIFY_SHOP||'').replace(/\.myshopify\.com$/,'');if(!/^[a-z0-9-]{3,60}$/.test(value))throw fault('shop_unavailable','Credit checkout is temporarily unavailable.',503);return value+'.myshopify.com'};
const input=async request=>{
  if(Number(request.headers.get('content-length')||0)>2048)throw fault('request_too_large','Request is too large.',413);
  const text=await request.text();if(text.length>2048)throw fault('request_too_large','Request is too large.',413);
  try{return JSON.parse(text)}catch{throw fault('bad_request','Invalid request.',400)}
};
const codePattern=/^RC-(?:[A-HJ-NP-Z2-9]{5}-){3}[A-HJ-NP-Z2-9]{5}$/;
function privatePack(p,id){return {id,title:p.title,type:p.type,high:p.high,standard:p.standard,priceCents:p.priceCents}};
export function creditCatalog(env){return {ok:true,enabled:active(env),salesEnabled:sales(env),packs:Object.entries(CREDIT_PACKS).map(([id,p])=>privatePack(p,id))}}
export async function creditPackRoutes(request,env){
  const p=new URL(request.url).pathname;
  if(!p.startsWith('/api/credit-packs')&&!p.startsWith('/api/admin/credit-codes'))return null;
  try{
    if(p==='/api/credit-packs/catalog'&&request.method==='GET')return privateJson(creditCatalog(env));
    if(!active(env))return privateJson({ok:false,error:'Credits and gifts are being prepared. Existing previews are unchanged.',code:'packs_not_active'},503);
    if(p==='/api/credit-packs/redeem'&&request.method==='POST'){
      sameOrigin(request);
      const wallet=await walletFor(request,env);if(!wallet||!creditsEnabled(env))throw fault('wallet_missing','Open the creation page first to prepare your credit wallet.',401);
      const body=await input(request);
      const result=await redeemCreditCode(env,body.code,wallet.id);
      return privateJson({...result,balance:await creditBalance(env,wallet)});
    }
    if(p==='/api/credit-packs/checkout'&&request.method==='POST'){
      sameOrigin(request);
      if(!sales(env))throw fault('credit_checkout_disabled','Credit purchases are not available yet. No payment was taken.',503);
      const wallet=await walletFor(request,env);if(!wallet||!creditsEnabled(env))throw fault('wallet_missing','Open Recast Me in this browser to prepare your credits first.',401);
      const body=await input(request),packId=String(body.packId||''),pack=fromPack(packId);
      const mode=body.mode;if(!['self','gift'].includes(mode))throw fault('checkout_mode','Choose for yourself or as a gift.',400);
      const claimToken=randomToken(),id=await hash(claimToken),createdAt=new Date().toISOString();
      const code=await freshGiftCode(); // Secret stays private until Shopify actually confirms payment.
      const record={id,packId,sku:pack.sku,variantId:pack.variantId,mode,walletId:wallet.id,issuedCode:code,
        createdAt,expiresAt:Date.now()+2*86400000,boundOrderId:null,boundLineId:null,paidAt:null,revokedAt:null};
      await change(env,intentKey(id),null,old=>{if(old)throw fault('checkout_busy','Checkout request already exists.',409);return record});
      const url=new URL('https://'+shopHost(env)+'/cart/'+pack.variantId+':1');
      url.searchParams.set('attributes[_Recast Credit Claim]',claimToken);
      url.searchParams.set('ref','recast-me-credits');
      return privateJson({ok:true,claimToken,checkoutUrl:url.href,pack:privatePack(pack,packId),mode,notice:'Checkout through your existing Shopify store. Credits issue only after verified payment.'});
    }
    if(p==='/api/credit-packs/purchase'&&request.method==='POST'){
      sameOrigin(request);
      const wallet=await walletFor(request,env);if(!wallet)throw fault('wallet_missing','Use the same browser that started the purchase.',401);
      const body=await input(request),token=String(body.claimToken||'');
      if(!/^[a-f0-9]{64}$/.test(token))throw fault('purchase_reference','Invalid purchase reference.',400);
      const record=await read(env,intentKey(await hash(token)));
      if(!record||record.walletId!==wallet.id)throw fault('purchase_missing','Purchase not found in this browser. Contact support with your Shopify order number.',404);
      return privateJson({ok:true,status:record.revokedAt?'refunded':record.paidAt?'paid':'awaiting_payment',
        mode:record.mode,packId:record.packId,title:fromPack(record.packId).title,
        issuedCode:record.paidAt&&!record.revokedAt&&record.mode==='gift'?record.issuedCode:null,
        autoApplied:Boolean(record.paidAt&&record.mode==='self'&&!record.revokedAt),createdAt:record.createdAt});
    }
    if(p==='/api/admin/credit-codes'&&request.method==='GET'){
      owner(request,env);return privateJson({ok:true,...await listCreditCodes(env)});
    }
    if(p==='/api/admin/credit-codes'&&request.method==='POST'){
      owner(request,env);sameOrigin(request);
      const body=await input(request),packId=String(body.packId||'');fromPack(packId);
      const day=new Date().toISOString().slice(0,10);
      await change(env,'commerce/credits/admin-issuance/'+day+'.json',{used:0},v=>{
        if(!Number.isSafeInteger(v.used)||v.used>=100)throw fault('admin_code_limit','Daily code limit reached. Contact support before issuing more.',429);
        v.used++;return v;
      });
      const code=await newCreditCode(env,{packId,source:'owner',expiresAt:body.expiresDays===undefined?null:expiry(body.expiresDays)});
      return privateJson({ok:true,code:code.code,id:code.id,pack:privatePack(code.p,packId),
        message:'Copy this code now. For security, the full code is not shown again in admin history.'});
    }
    if(p==='/api/admin/credit-codes/revoke'&&request.method==='POST'){
      owner(request,env);sameOrigin(request);
      const body=await input(request);
      if(body.confirm!=='REVOKE_CODE')throw fault('confirm_required','Confirm code revocation.',400);
      const record=await read(env,'commerce/credits/codes/'+String(body.id||'')+'.json');
      if(!record||record.source!=='owner')throw fault('refund_review','Paid gift codes can only be revoked through verified Shopify refunds.',409);
      return privateJson({ok:true,...await revokeCreditCode(env,record.id,'owner')});
    }
    return privateJson({ok:false,error:'Method not allowed'},405);
  }catch(e){return privateJson({ok:false,error:e.message||'Credits are unavailable.',code:e.code||'credits_unavailable'},e.status||503)}
}
async function freshGiftCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(20));
  const raw=[...bytes].map(x=>alphabet[x%alphabet.length]).join('');
  return 'RC-'+raw.match(/.{1,5}/g).join('-');
}
function expiry(days){if(!Number.isInteger(days)||days<1||days>365)throw fault('expiry_invalid','Choose 1–365 days or no expiration.',400);return new Date(Date.now()+days*86400000).toISOString()}
function orderAttr(order,name){return (order.customAttributes||[]).find(x=>x.key===name)?.value||''}
export async function reconcilePaidCreditOrder(env,order){
  const lines=(order.lineItems?.nodes||[]).filter(l=>PACK_FOR_SKU[l.sku]);
  if(!lines.length)return {handled:false};
  // A hard stop for ambiguous, partial, multi-line or tampered purchases.
  if(lines.length!==1||lines[0].quantity!==1||order.lineItems?.pageInfo?.hasNextPage)throw fault('credit_order_review','Credit order needs owner review before issuing codes.',409);
  const line=lines[0],p=PACK_FOR_SKU[line.sku],token=orderAttr(order,'_Recast Credit Claim');
  if(!/^[a-f0-9]{64}$/.test(token))throw fault('credit_claim_missing','Paid credit order is missing its original checkout claim. Contact support for manual recovery.',409);
  const id=await hash(token),key=intentKey(id),intent=await read(env,key);
  if(!intent||intent.sku!==p.sku||intent.packId!==p.id||intent.variantId!==p.variantId||String(line.variant?.id||'').split('/').pop()!==p.variantId)
    throw fault('credit_claim_mismatch','Paid credit order did not match its verified checkout request. Owner review required.',409);
  if(intent.boundOrderId&&intent.boundOrderId!==order.id)throw fault('credit_claim_reused','A checkout claim cannot pay for multiple orders.',409);
  const eligible=order.displayFinancialStatus==='PAID'&&!order.cancelledAt&&!order.test;
  if(!eligible){
    const bound=await read(env,key);
    if(bound?.paidAt&&bound.boundOrderId===order.id){
      await revokeCreditCode(env,await hash(bound.issuedCode),'shopify_payment_revoked');
      await change(env,key,null,v=>({...v,revokedAt:new Date().toISOString()}));
    }
    return {handled:true,eligible:false,revoked:Boolean(bound?.paidAt)};
  }
  if(Date.now()>Number(intent.expiresAt)&&!intent.boundOrderId)throw fault('credit_claim_expired','Checkout claim expired. Contact support with the paid order receipt.',409);
  const stored=await change(env,key,null,v=>{
    if(!v||v.boundOrderId&&v.boundOrderId!==order.id)throw fault('credit_claim_reused','Checkout reference already used.',409);
    return {...v,boundOrderId:order.id,boundLineId:line.id};
  });
  await newCreditCode(env,{packId:p.id,source:'shopify',orderId:order.id,lineId:line.id,exactCode:stored.issuedCode});
  if(stored.mode==='self')await redeemCreditCode(env,stored.issuedCode,stored.walletId);
  await change(env,key,null,v=>({...v,paidAt:v.paidAt||new Date().toISOString()}));
  return {handled:true,eligible:true,mode:stored.mode,packId:p.id};
}
export const creditLineSku=sku=>Boolean(PACK_FOR_SKU[sku]);
