import test from 'node:test';import assert from 'node:assert/strict';
import router from '../src/router.js';import {setup,ID,TOKEN,CLEAN,MARKED} from './security-helpers.mjs';
import {recommendedCheckoutDesign,hash} from '../src/commerce-store.js';import {FULFILLMENT} from '../src/entry.js';
const sku='RECAST-MUG-11OZ';
async function fixture(t,{badCatalog=false}={}){
 const calls=[];t.mock.method(globalThis,'fetch',async(url,options={})=>{url=String(url);calls.push({url,method:options.method||'GET'});
 if(url.includes('/oauth/'))return Response.json({access_token:'fake',expires_in:3600});
 if(url.includes('/graphql'))return Response.json({data:{products:{nodes:[{id:'p',title:'Custom Recast Mug',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/1',title:'11 oz',sku,price:'24.99'}]}}]}}});
 if(url.includes('/v2/catalog-variants/1320'))return Response.json({data:{id:1320,catalog_product_id:badCatalog?999:19}});
 if(url.endsWith('/printfiles/19'))return Response.json({result:{printfiles:[{printfile_id:43,width:2700,height:1050}],variant_printfiles:[{variant_id:1320,placements:{default:43}}]}});
 throw Error('Unexpected external operation '+url);
 });
 const env=await setup({SHOPIFY_SHOP:'test',SHOPIFY_CLIENT_ID:'test',SHOPIFY_CLIENT_SECRET:'test',PRINTFUL_API_TOKEN:'fake'});
 const design=recommendedCheckoutDesign(FULFILLMENT[sku]);
 const body={requestId:ID,accessToken:TOKEN,sku,design,skipMockup:true,confirmDesign:true,confirmArtwork:true};
 const post=(overrides={})=>router.fetch(new Request('https://recast.test/api/checkout-link',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,...overrides})}),env,{});
 return {env,post,design,calls};
}
test('recommended checkout skips supplier mockup and freezes exact artwork, verified layout and watermarked proof',async t=>{
 const {env,post,design,calls}=await fixture(t);const response=await post(),data=await response.json();assert.equal(response.status,200,JSON.stringify(data));
 const props=JSON.parse(Buffer.from(new URL(data.checkoutUrl).searchParams.get('properties'),'base64url').toString());
 assert.match(props['Recast Design'],/product mockup skipped/);const token=props['_Recast Preapproval'];
 const approval=await(await env.ARTWORK.get(`commerce/preapprovals/${token}.json`)).json();assert.equal(approval.approvalMode,'recommended-no-mockup');assert.deepEqual(approval.design,design);assert.equal(approval.sourceHash,await hash(CLEAN.toString('base64')));assert.equal(await(await env.ARTWORK.get(approval.snapshotKey)).text(),CLEAN.toString('base64'));assert.equal(approval.position.area_width,2700);
 assert.ok(calls.some(c=>c.url.includes('/printfiles/')));assert.ok(!calls.some(c=>/create-task|mockup-tasks|queue.fal|\/orders/.test(c.url)));
 const record=await(await env.ARTWORK.get(`mockups/${ID}/${sku}/${approval.mockupId}/task.json`)).json();assert.equal(record.status,'prepared');assert.equal(record.taskKey,undefined);
 const proof=await router.fetch(new Request(props['Approved Preview']),env,{});const html=await proof.text();assert.match(html,/skipped the product mockup/);assert.match(html,/not a product mockup/);
 const image=await router.fetch(new Request(`https://recast.test/api/approved-preview/${token}/0`),env,{});assert.deepEqual(Buffer.from(await image.arrayBuffer()),MARKED);
 await env.ARTWORK.put(`requests/${ID}/preview.b64`,'changed');assert.equal(await(await env.ARTWORK.get(approval.snapshotKey)).text(),CLEAN.toString('base64'));
});
test('fast path rejects missing artwork consent, custom design and wrong artwork token before supplier preparation',async t=>{
 const {post,design,calls}=await fixture(t);
 for(const changes of [{confirmArtwork:false},{confirmDesign:false},{design:{...design,scale:95}},{accessToken:'wrong'}]){const response=await post(changes);assert.ok(response.status>=400)}
 assert.ok(!calls.some(c=>c.url.includes('printful')));
});
test('catalog mismatch fails closed and does not freeze an approval or create an order',async t=>{
 const {env,post,calls}=await fixture(t,{badCatalog:true});assert.equal((await post()).status,503);assert.equal((await env.ARTWORK.list({prefix:'commerce/preapprovals/'})).objects.length,0);assert.ok(!calls.some(c=>c.method==='POST'&&c.url.includes('printful')));
});
test('server recommended presets match special current print formats',()=>{
 const pick=product=>recommendedCheckoutDesign({product});assert.equal(pick('Canvas').scale,90);assert.equal(pick('Canvas').layout,'fit');assert.equal(pick('Hoodie').finish,'soft');assert.equal(pick('Hoodie').version,6);assert.equal(pick('Phone Case').version,7);assert.equal(pick('Sticker Sheet').version,8);assert.equal(pick('Mug').scale,110);assert.equal(pick('Mug').spacing,'close');assert.equal(pick('Blanket').scale,110);assert.equal(pick('Puzzle').orientation,'portrait');
});
