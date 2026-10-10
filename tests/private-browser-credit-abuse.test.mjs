import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {
  creditRoute, walletFor, creditBalance, reserveCustomerRender,
  settleCustomerRender, reconcileOrderCredits
} from '../src/render-credits.js';

// No external provider, account, e-mail, charge, or actual image is contacted.
// This regression uses the existing R2-backed anonymous wallet contract.
const URL_ROOT='https://recast.test/api/render-credits';
const NETWORK='198.51.100.111';
const enabled=()=>({
  ARTWORK:new Bucket(),
  RENDER_CREDITS_ENABLED:'true',
  RENDER_CREDITS_STORAGE_SALT:'true',
  HQ_FREE_ALLOWANCE:'3',
  STANDARD_FREE_ALLOWANCE:'5',
  PURCHASE_BONUS:'3'
});
async function session(env,ip=NETWORK,cookie=null) {
  const req=new Request(URL_ROOT,{
    method:'POST',headers:{
      origin:'https://recast.test',
      'x-recast-request':'1',
      'cf-connecting-ip':ip,
      ...(cookie?{cookie}:{})
    }
  });
  const response=await creditRoute(req,env);
  assert.equal(response.status,200,'Wallet bootstrap must be valid');
  const minted=response.headers.get('set-cookie')?.split(';')[0]||cookie;
  assert.match(minted,/^__Host-recast-credit=[a-f0-9]{64}$/);
  const wallet=await walletFor(new Request(URL_ROOT,{headers:{cookie:minted}}),env);
  assert.ok(wallet?.id);
  return {cookie:minted,wallet,ip};
}
async function credit(env,who,now=Date.now()) {
  return creditBalance(env,who.wallet,now);
}
async function reserve(env,who,kind='high',succeeded=true,now=Date.now()) {
  const guarded={...env,RECAST_CREDIT_WALLET:who.wallet,RECAST_RENDER_MODE:kind};
  const ticket=await reserveCustomerRender(guarded,now);
  assert.ok(ticket?.ticket);
  await settleCustomerRender(guarded,ticket,succeeded);
  return ticket;
}

test('new Private Browsing cookie on the SAME IP shares the existing 3 HQ attempts',async()=>{
  const env=enabled(),normal=await session(env);
  assert.equal((await credit(env,normal)).remaining,3);

  await reserve(env,normal);
  const incognito=await session(env);
  assert.notEqual(normal.cookie,incognito.cookie,'Private browsing gets a new random wallet cookie');
  assert.notEqual(normal.wallet.id,incognito.wallet.id);
  assert.equal(normal.wallet.network,incognito.wallet.network,'Shared network must have the same salted ID');
  assert.equal((await credit(env,incognito)).free,2);

  await reserve(env,incognito);
  assert.equal((await credit(env,normal)).free,1);
  await reserve(env,normal);
  assert.equal((await credit(env,normal)).remaining,0);
  assert.equal((await credit(env,incognito)).remaining,0);

  const anotherPrivateTab=await session(env);
  assert.equal((await credit(env,anotherPrivateTab)).remaining,0);
  await assert.rejects(reserve(env,anotherPrivateTab),e=>e?.code==='render_credits_used');
  const sharedTrial=await env.ARTWORK.get('commerce/trials/'+normal.wallet.network+'.json');
  assert.equal((await sharedTrial.json()).used,3);
});
test('Standard allowances are also shared across new private browser wallets on one IP',async()=>{
  const env=enabled(),normal=await session(env);
  for(let i=0;i<3;i++)await reserve(env,normal,'high');
  const privateBrowser=await session(env);
  assert.equal((await credit(env,privateBrowser)).remaining,0);
  for(let i=0;i<4;i++)await reserve(env,privateBrowser,'quick');
  assert.equal((await credit(env,normal)).standardRemaining,1);
  await reserve(env,normal,'quick');
  const nextPrivate=await session(env);
  assert.equal((await credit(env,nextPrivate)).standardRemaining,0);
  await assert.rejects(reserve(env,nextPrivate,'quick'),e=>e?.code==='standard_credits_used');
});
test('failed HQ generation restores the same network allowance across private sessions',async()=>{
  const env=enabled(),normal=await session(env),privateBrowser=await session(env);
  await reserve(env,normal,'high',false);
  assert.equal((await credit(env,normal)).remaining,3);
  assert.equal((await credit(env,privateBrowser)).remaining,3);
  await reserve(env,privateBrowser,'high',true);
  assert.equal((await credit(env,normal)).remaining,2);
});
test('purchased bonus HQ renders stay bound to the buying wallet, not other private browsers',async()=>{
  const env=enabled(),normal=await session(env),privateBrowser=await session(env);
  for(let i=0;i<3;i++)await reserve(env,normal);
  const order={id:'gid://shopify/Order/PRIVATE-BROWSER-TEST',displayFinancialStatus:'PAID',updatedAt:'2026-10-09T20:00:00.000Z',test:false};
  await reconcileOrderCredits(env,order,normal.wallet.id);
  assert.equal((await credit(env,normal)).bonus,3);
  assert.equal((await credit(env,privateBrowser)).bonus,0);
  await assert.rejects(reserve(env,privateBrowser),e=>e?.code==='render_credits_used');
  await reserve(env,normal);
  assert.equal((await credit(env,normal)).bonus,2);
});
test('changing public IP remains an anonymous-identity limitation, not a Private mode fix',async()=>{
  const env=enabled(),normal=await session(env,'198.51.100.111');
  for(let i=0;i<3;i++)await reserve(env,normal);
  const otherNetwork=await session(env,'198.51.100.112');
  assert.notEqual(normal.wallet.network,otherNetwork.wallet.network);
  assert.equal((await credit(env,otherNetwork)).remaining,3,
    'Network IP changes cannot be reliably linked without sign-in or verification');
});
test('network key salt persists privately and the client never receives its value',async()=>{
  const env=enabled(),normal=await session(env),privateBrowser=await session(env);
  assert.equal(normal.wallet.network,privateBrowser.wallet.network);
  const obj=await env.ARTWORK.get('commerce/private/network-salt.json');
  const salt=(await obj.json()).salt;
  assert.ok(salt.length>=32);
  const publicResponse=await creditRoute(new Request(URL_ROOT,{headers:{cookie:normal.cookie}}),env);
  assert.equal(publicResponse.status,200);
  const text=await publicResponse.text();
  assert.ok(!text.includes(salt));
  assert.ok(!text.includes(normal.wallet.network));
  assert.ok(!text.includes(normal.cookie.slice('__Host-recast-credit='.length)));
  const publicData=JSON.parse(text);
  assert.equal(publicData.enabled,true);
  assert.equal(publicData.remaining,3);
});
