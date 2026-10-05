import test from 'node:test';import assert from 'node:assert/strict';
import router from '../src/router.js';import {setup,ID,TOKEN} from './security-helpers.mjs';
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
