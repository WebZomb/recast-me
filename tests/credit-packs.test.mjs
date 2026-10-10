import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {creditRoute,walletFor,creditBalance,reserveCustomerRender,settleCustomerRender} from '../src/render-credits.js';
import {newCreditCode,redeemCreditCode,revokeCreditCode,extraCreditBalance,CREDIT_PACKS,PACK_FOR_SKU} from '../src/credit-ledger.js';
import {creditPackRoutes,reconcilePaidCreditOrder,creditLineSku} from '../src/credit-packs.js';
import {reconcileShopifyOrder} from '../src/workflow.js';
import {read} from '../src/commerce-store.js';

const envFor=()=>({ARTWORK:new Bucket(),CREDIT_IP_SALT:'credit-test-salt-32-characters-long-at-least',RENDER_CREDITS_ENABLED:'true',CREDIT_PACKS_ENABLED:'true',CREDIT_SALES_ENABLED:'true',SHOPIFY_SHOP:'example-recast-store',ADMIN_TOKEN:'test-only-secret'});
async function makeWallet(env,ip='192.0.2.11'){
 const req=new Request('https://recast.test/api/render-credits',{method:'POST',headers:{'cf-connecting-ip':ip,'x-recast-request':'1'}});
 const response=await creditRoute(req,env);assert.equal(response.status,200);
 const cookie=response.headers.get('set-cookie').split(';')[0],wallet=await walletFor(new Request('https://recast.test/',{headers:{cookie}}),env);
 return {wallet,cookie};
}
const req=(p,method='GET',body=null,headers={})=>new Request('https://recast.test'+p,{method,
 headers:{'x-recast-request':'1',...(body?{'content-type':'application/json'}:{}),...headers},
 ...(body?{body:JSON.stringify(body)}:{})});
const ownerReq=(p,method='GET',body=null,headers={})=>req(p,method,body,{authorization:'Bearer test-only-secret',...headers});
const issuedOrder=(packId,claimToken,{financialStatus='PAID',lineId='gid://shopify/LineItem/101',orderId='gid://shopify/Order/1001',quantity=1,variantId=null}={})=>{
 const pack=CREDIT_PACKS[packId];
 return {id:orderId,name:'#1001',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),displayFinancialStatus:financialStatus,
 cancelledAt:null,test:false,customAttributes:[{key:'_Recast Credit Claim',value:claimToken}],lineItems:{pageInfo:{hasNextPage:false},
 nodes:[{id:lineId,sku:pack.sku,quantity,name:pack.title,variant:{id:'gid://shopify/ProductVariant/'+(variantId||pack.variantId)},customAttributes:[]}]},tags:[]};
};
test('all seven planned packages and exact Shopify SKUs/prices are read-only catalog data',()=>{
 assert.equal(Object.keys(CREDIT_PACKS).length,7);
 assert.deepEqual(Object.values(CREDIT_PACKS).map(p=>p.priceCents),[299,499,899,1999,299,549,1199]);
 assert.equal(Object.keys(PACK_FOR_SKU).length,7);
 assert.equal(creditLineSku('RECAST-CREDIT-HQ-20'),true);
 assert.equal(creditLineSku('RECAST-MUG-11OZ'),false);
});
test('feature and sales gates prevent checkout before activation, with no storage mutation',async()=>{
 const env=envFor();env.CREDIT_SALES_ENABLED='false';
 const response=await creditPackRoutes(req('/api/credit-packs/checkout','POST',{packId:'hq10',mode:'self'}),env);
 assert.equal(response.status,503);
 assert.equal((await response.json()).code,'credit_checkout_disabled');
 assert.equal((await env.ARTWORK.list({prefix:'commerce/credits/intents/'})).objects.length,0);
 const catalog=await (await creditPackRoutes(req('/api/credit-packs/catalog'),env)).json();
 assert.equal(catalog.salesEnabled,false);
});
test('admin codes require authentication, same-origin writes and show full code only once',async()=>{
 const env=envFor();const w=await makeWallet(env);
 const noAdmin=await creditPackRoutes(req('/api/admin/credit-codes','POST',{packId:'std10'}),env);assert.equal(noAdmin.status,401);
 const x=await creditPackRoutes(ownerReq('/api/admin/credit-codes','POST',{packId:'std10'},{origin:'https://evil.test'}),env);
 assert.equal(x.status,403);
 const response=await creditPackRoutes(ownerReq('/api/admin/credit-codes','POST',{packId:'std10'}),env);
 assert.equal(response.status,200);const issued=await response.json();assert.match(issued.code,/^RC-(?:[A-HJ-NP-Z2-9]{5}-){3}[A-HJ-NP-Z2-9]{5}$/);
 const list=await (await creditPackRoutes(ownerReq('/api/admin/credit-codes'),env)).json();
 assert.equal(list.items.length,1);assert.equal(list.items[0].packId,'std10');
 assert.equal(JSON.stringify(list).includes(issued.code),false,'full gift code never appears in owner history');
 const redemption=await creditPackRoutes(req('/api/credit-packs/redeem','POST',{code:issued.code},{cookie:w.cookie}),env);
 assert.equal(redemption.status,200);assert.equal((await redemption.json()).balance.purchasedStandard,10);
});
test('redeemed codes cannot be stolen by a second wallet or double-granted in one wallet',async()=>{
 const env=envFor(),a=await makeWallet(env),b=await makeWallet(env,'198.51.100.22');
 const gift=await newCreditCode(env,{packId:'hq20'});
 await redeemCreditCode(env,gift.code,a.wallet.id);await redeemCreditCode(env,gift.code,a.wallet.id);
 assert.equal((await creditBalance(env,a.wallet)).purchasedHigh,20);
 await assert.rejects(redeemCreditCode(env,gift.code,b.wallet.id),e=>e.code==='credit_code_used');
 assert.equal((await creditBalance(env,b.wallet)).purchasedHigh,0);
});
test('purchased Standard can be used while free HQ remains; failed preview restores purchased Standard',async()=>{
 const env=envFor(),a=await makeWallet(env),gift=await newCreditCode(env,{packId:'std10'});
 await redeemCreditCode(env,gift.code,a.wallet.id);
 assert.equal((await creditBalance(env,a.wallet)).remaining,3);
 const standard={...env,RECAST_CREDIT_WALLET:a.wallet,RECAST_RENDER_MODE:'quick'};
 const ticket=await reserveCustomerRender(standard);assert.equal(ticket.source,'grant');
 assert.equal((await creditBalance(env,a.wallet)).purchasedStandard,9);
 await settleCustomerRender(env,ticket,false);await settleCustomerRender(env,ticket,false);
 assert.equal((await creditBalance(env,a.wallet)).purchasedStandard,10);
 const again=await reserveCustomerRender(standard);await settleCustomerRender(env,again,true);
 assert.equal((await creditBalance(env,a.wallet)).purchasedStandard,9);
 assert.equal((await creditBalance(env,a.wallet)).remaining,3);
});
test('a daily refill is personal, starts on redemption and does not reset other wallets on the same network',async()=>{
 const env=envFor(),a=await makeWallet(env),b=await makeWallet(env);
 const first={...env,RECAST_CREDIT_WALLET:a.wallet};
 for(let i=0;i<3;i++){const ticket=await reserveCustomerRender(first);await settleCustomerRender(env,ticket,true)}
 assert.equal((await creditBalance(env,b.wallet)).free,0);
 const code=await newCreditCode(env,{packId:'reset'});await redeemCreditCode(env,code.code,a.wallet.id);
 assert.equal((await creditBalance(env,a.wallet)).free,3);
 assert.equal((await creditBalance(env,a.wallet)).standardRemaining,5);
 assert.equal((await creditBalance(env,b.wallet)).free,0,'paid reset must not replenish another network user');
 const ticket=await reserveCustomerRender(first);assert.equal(ticket.source,'reset');
 await settleCustomerRender(env,ticket,true);assert.equal((await creditBalance(env,a.wallet)).free,2);
 const replay=await redeemCreditCode(env,code.code,a.wallet.id);assert.equal(replay.alreadyRedeemed,true);
 assert.equal((await creditBalance(env,a.wallet)).free,2,'replay cannot restart the 24-hour period');
});
test('paid Shopify checkout creates no free code and credits appear only after verified payment',async()=>{
 const env=envFor(),a=await makeWallet(env),b=await makeWallet(env,'203.0.113.30');
 const checkout=await creditPackRoutes(req('/api/credit-packs/checkout','POST',{packId:'hq10',mode:'self'},{cookie:a.cookie}),env);
 assert.equal(checkout.status,200);
 const info=await checkout.json();assert.match(info.checkoutUrl,/example-recast-store\.myshopify\.com\/cart\/67762890277108:1/);
 assert.equal(new URL(info.checkoutUrl).searchParams.get('attributes[_Recast Credit Claim]'),info.claimToken);
 const before=await (await creditPackRoutes(req('/api/credit-packs/purchase','POST',{claimToken:info.claimToken},{cookie:a.cookie}),env)).json();
 assert.equal(before.status,'awaiting_payment');assert.equal(before.issuedCode,null);
 const wrongBrowser=await creditPackRoutes(req('/api/credit-packs/purchase','POST',{claimToken:info.claimToken},{cookie:b.cookie}),env);assert.equal(wrongBrowser.status,404);
 const pending=issuedOrder('hq10',info.claimToken,{financialStatus:'PENDING'});
 assert.equal((await reconcilePaidCreditOrder(env,pending)).eligible,false);
 assert.equal((await creditBalance(env,a.wallet)).purchasedHigh,0);
 const paid=issuedOrder('hq10',info.claimToken);
 const result=await reconcilePaidCreditOrder(env,paid);assert.equal(result.eligible,true);assert.equal(result.mode,'self');
 await reconcilePaidCreditOrder(env,paid);
 assert.equal((await creditBalance(env,a.wallet)).purchasedHigh,10);
 const after=await (await creditPackRoutes(req('/api/credit-packs/purchase','POST',{claimToken:info.claimToken},{cookie:a.cookie}),env)).json();
 assert.equal(after.status,'paid');assert.equal(after.autoApplied,true);assert.equal(after.issuedCode,null);
 const jobs=await reconcileShopifyOrder(env,paid);assert.equal(jobs.created,0,'credit SKUs must never create Printful jobs');
 assert.equal((await env.ARTWORK.list({prefix:'jobs/'})).objects.length,0);
 const refunded={...paid,displayFinancialStatus:'REFUNDED'};
 await reconcilePaidCreditOrder(env,refunded);
 assert.equal((await creditBalance(env,a.wallet)).purchasedHigh,0);
 await assert.rejects(reconcilePaidCreditOrder(env,paid),/revoked|credit_code_revoked|no longer valid/i);
});
test('gift purchase only issues the gift code after payment; gift stays redeemable across recipients',async()=>{
 const env=envFor(),buyer=await makeWallet(env),friend=await makeWallet(env,'192.0.2.99');
 const intent=await (await creditPackRoutes(req('/api/credit-packs/checkout','POST',{packId:'std20',mode:'gift'},{cookie:buyer.cookie}),env)).json();
 let view=await (await creditPackRoutes(req('/api/credit-packs/purchase','POST',{claimToken:intent.claimToken},{cookie:buyer.cookie}),env)).json();
 assert.equal(view.issuedCode,null);
 await reconcilePaidCreditOrder(env,issuedOrder('std20',intent.claimToken));
 view=await (await creditPackRoutes(req('/api/credit-packs/purchase','POST',{claimToken:intent.claimToken},{cookie:buyer.cookie}),env)).json();
 assert.match(view.issuedCode,/^RC-/);
 assert.equal((await creditBalance(env,buyer.wallet)).purchasedStandard,0);
 await redeemCreditCode(env,view.issuedCode,friend.wallet.id);
 assert.equal((await creditBalance(env,friend.wallet)).purchasedStandard,20);
});
test('a mismatched SKU/variant, reused claim and forged unpaid order cannot grant credits',async()=>{
 const env=envFor(),a=await makeWallet(env);
 const intent=await (await creditPackRoutes(req('/api/credit-packs/checkout','POST',{packId:'hq50',mode:'self'},{cookie:a.cookie}),env)).json();
 await assert.rejects(reconcilePaidCreditOrder(env,issuedOrder('hq50',intent.claimToken,{variantId:'wrong'})),e=>e.code==='credit_claim_mismatch');
 await assert.rejects(reconcilePaidCreditOrder(env,issuedOrder('hq50',intent.claimToken,{quantity:2})),e=>e.code==='credit_order_review');
 await reconcilePaidCreditOrder(env,issuedOrder('hq50',intent.claimToken));
 await assert.rejects(reconcilePaidCreditOrder(env,issuedOrder('hq50',intent.claimToken,{orderId:'gid://shopify/Order/fake'})),e=>e.code==='credit_claim_reused');
 assert.equal((await creditBalance(env,a.wallet)).purchasedHigh,50);
});
test('an owner can revoke an unused promo code and remove remaining purchased credits after redemption',async()=>{
 const env=envFor(),a=await makeWallet(env);
 const gift=await newCreditCode(env,{packId:'hq10'});
 await redeemCreditCode(env,gift.code,a.wallet.id);
 const result=await revokeCreditCode(env,gift.id);
 assert.equal(result.revoked,true);
 assert.equal((await creditBalance(env,a.wallet)).purchasedHigh,0);
 await assert.rejects(redeemCreditCode(env,gift.code,a.wallet.id),e=>e.code==='credit_code_revoked');
 const code=await newCreditCode(env,{packId:'std10'});
 await revokeCreditCode(env,code.id);
 await assert.rejects(redeemCreditCode(env,code.code,a.wallet.id),e=>e.code==='credit_code_revoked');
});
