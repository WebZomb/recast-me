import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import router from '../src/router.js';import {setup,ID,TOKEN,CLEAN,MARKED} from './security-helpers.mjs';import {hash} from '../src/commerce-store.js';
test('approved preview pages are routed through the Worker before SPA fallback',()=>{
 const wrangler=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');
 assert.match(wrangler,/"run_worker_first"\s*:\s*\[[^\]]*"\/api\/\*"[^\]]*"\/proof\/\*"/s);
});

test('catalog loads with product permission alone and owner diagnostics remain protected',async()=>{
 const saved=globalThis.fetch;const queries=[];
 globalThis.fetch=async(url,opts)=>{
  if(String(url).includes('/oauth/'))return Response.json({access_token:'test-only',expires_in:3600});
  const q=JSON.parse(opts.body).query;queries.push(q);
  if(/\borders\s*\(/.test(q))return Response.json({errors:[{message:'orders access denied'}]});
  return Response.json({data:{products:{nodes:[{id:'p',title:'Custom Recast Mug',handle:'mug',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/1',title:'11 oz',sku:'RECAST-MUG-11OZ',price:'24.99'}]}}]}}});
 };
 try{const env=await setup({SHOPIFY_SHOP:'test',SHOPIFY_CLIENT_ID:'test',SHOPIFY_CLIENT_SECRET:'test'});
 const r=await router.fetch(new Request(`https://recast.test/api/checkout-options?requestId=${ID}&token=${TOKEN}`),env,{});const d=await r.json();assert.equal(r.status,200);assert.equal(d.products[0].variants[0].sku,'RECAST-MUG-11OZ');assert.equal(queries.length,1);assert.doesNotMatch(queries[0],/\borders\s*\(/);
 const denied=await router.fetch(new Request('https://recast.test/api/admin/commerce-check'),env,{});assert.equal(denied.status,401);
 }finally{globalThis.fetch=saved;}
});


test('checkout requires the exact completed product proof and carries hidden production metadata',async()=>{
 const saved=globalThis.fetch;
 globalThis.fetch=async(url,opts={})=>{
  if(String(url).includes('/oauth/'))return Response.json({access_token:'test-only',expires_in:3600});
  const q=JSON.parse(opts.body).query;
  return Response.json({data:{products:{nodes:[{id:'p',title:'Custom Recast Mug',handle:'mug',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/1',title:'11 oz',sku:'RECAST-MUG-11OZ',price:'24.99'}]}}]}}});
 };
 try{
  const env=await setup({SHOPIFY_SHOP:'test',SHOPIFY_CLIENT_ID:'test',SHOPIFY_CLIENT_SECRET:'test'});
  const design={version:3,layout:'single',background:'scene-fill',x:'center',scale:92,spacing:'standard'},mockupId='v3-single-scene-fill-center-92-standard';
  const proofHash=await hash(CLEAN.toString('base64')+'|'+JSON.stringify(design));
  await env.ARTWORK.put(`mockups/${ID}/RECAST-MUG-11OZ/${mockupId}/task.json`,JSON.stringify({requestId:ID,sku:'RECAST-MUG-11OZ',mockupId,status:'completed',sourceHash:proofHash,design,images:[{title:'default',url:'private-0'},{title:'Handle on Left',url:'private-1'},{title:'Front view',url:'private-2'}]}));
  for(let i=0;i<3;i++)await env.ARTWORK.put(`mockups/${ID}/RECAST-MUG-11OZ/${mockupId}/image-${i}.jpg`,CLEAN,{httpMetadata:{contentType:'image/jpeg'}});
  const post=body=>router.fetch(new Request('https://recast.test/api/checkout-link',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env,{});
  const ok=await post({requestId:ID,accessToken:TOKEN,sku:'RECAST-MUG-11OZ',mockupId,design});
  const data=await ok.json();assert.equal(ok.status,200,data.error);assert.equal(data.ok,true);
  const props=new URL(data.checkoutUrl).searchParams.get('properties');
  const decoded=JSON.parse(Buffer.from(props.replace(/-/g,'+').replace(/_/g,'/'),'base64').toString());
  assert.equal(decoded['_Recast Proof'],proofHash);assert.equal(decoded['_Recast Mockup'],mockupId);assert.equal(decoded['Recast Layout'],'One image');
  assert.match(decoded['Recast Print Safeguard'],/Not sent to production/i);assert.match(decoded['Recast Next Step'],/Track this Recast/i);
  assert.match(decoded['Approved Preview'],/^https:\/\/recast\.test\/proof\/[a-f0-9]{48}$/);assert.match(decoded['_Recast Preview Token'],/^[a-f0-9]{48}$/);
  const page=await router.fetch(new Request(decoded['Approved Preview']),env,{});assert.equal(page.status,200);const html=await page.text();
  assert.match(html,/ORDER CONFIRMED/);assert.match(html,/not sent to production yet/i);assert.match(html,/Track this Recast \/ downloads/);assert.match(html,/3D view/);assert.match(html,/Handle left/);assert.match(html,/Front view/);
  assert.equal((html.match(/class="angle"/g)||[]).length,3);
  for(let i=0;i<3;i++){const image=await router.fetch(new Request(`https://recast.test/api/approved-preview/${decoded['_Recast Preview Token']}/${i}`),env,{});assert.equal(image.status,200);assert.deepEqual(Buffer.from(await image.arrayBuffer()),MARKED);}
  const primary=await router.fetch(new Request(`https://recast.test/api/approved-preview/${decoded['_Recast Preview Token']}`),env,{});assert.equal(primary.status,200);
  const stale=await post({requestId:ID,accessToken:TOKEN,sku:'RECAST-MUG-11OZ',mockupId,design:{...design,scale:100}});
  assert.equal(stale.status,409);assert.match((await stale.json()).error,/changed|fresh/i);
 }finally{globalThis.fetch=saved;}
});
