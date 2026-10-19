import test from 'node:test';
import assert from 'node:assert/strict';
import router from '../src/router.js';
import {setup,ID,TOKEN} from './security-helpers.mjs';
import {recommendedCheckoutDesign} from '../src/commerce-store.js';
import {FULFILLMENT} from '../src/entry.js';
const sku='RECAST-MUG-11OZ';
async function fixture(t){
 const calls=[],control={failCart:false,wrongQuantity:false,variant:'1',savedCart:null};
 t.mock.method(globalThis,'fetch',async(url,options={})=>{
  url=String(url);let body={};try{body=JSON.parse(options.body);}catch{}calls.push({url,body});
  if(url.includes('/oauth/'))return Response.json({access_token:'fixture',expires_in:3600});
  if(body.query?.includes('query RecastBasketRefresh'))return Response.json({data:{cart:control.savedCart}});
  if(body.query?.includes('mutation RecastBasket(')){
   if(control.failCart)throw Error('remote timeout');
   control.savedCart={id:'gid://shopify/Cart/test?key=PRIVATE',checkoutUrl:'https://test.myshopify.com/checkouts/test',lines:{pageInfo:{hasNextPage:false},nodes:body.variables.input.lines.map((l,i)=>({id:'line'+i,quantity:control.wrongQuantity?99:l.quantity,attributes:l.attributes,merchandise:{id:l.merchandiseId}}))}};
   return Response.json({data:{cartCreate:{cart:control.savedCart,userErrors:[],warnings:[]}}});
  }
  if(url.includes('/graphql'))return Response.json({data:{products:{nodes:[{id:'p',title:'Custom Recast Mug',status:'ACTIVE',variants:{nodes:[{id:'gid://shopify/ProductVariant/'+control.variant,title:'11 oz',sku,price:'24.99'}]}}]}}});
  if(url.includes('/v2/catalog-variants/1320'))return Response.json({data:{id:1320,catalog_product_id:19}});
  if(url.endsWith('/printfiles/19'))return Response.json({result:{printfiles:[{printfile_id:43,width:2700,height:1050}],variant_printfiles:[{variant_id:1320,placements:{default:43}}]}});
  throw Error('Unexpected operation '+url);
 });
 const env=await setup({BASKET_ENABLED:'true',SHOPIFY_STOREFRONT_TOKEN:'fixture',SHOPIFY_SHOP:'test.myshopify.com',SHOPIFY_CLIENT_ID:'fixture',SHOPIFY_CLIENT_SECRET:'fixture',PRINTFUL_API_TOKEN:'fixture'});
 let cookie='';
 async function call(path,body,extra={}){
  const response=await router.fetch(new Request('https://recast.test'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-recast-request':'1',cookie,...extra},body:body?JSON.stringify(body):undefined}),env,{});
  return {response,data:await response.json()};
 }
 const session=await call('/api/basket/session',{requestId:ID,accessToken:TOKEN});
 assert.equal(session.response.status,200,JSON.stringify(session.data));cookie=session.response.headers.get('set-cookie').split(';')[0];
 const designApproval={requestId:ID,accessToken:TOKEN,sku,design:recommendedCheckoutDesign(FULFILLMENT[sku]),skipMockup:true,confirmDesign:true,confirmArtwork:true};
 const approval=()=>call('/api/basket/approve',{basketId:'basket',designApproval});
 async function add(lineId='one',revision=0){const a=await approval();assert.equal(a.response.status,200,JSON.stringify(a.data));return call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'add-'+lineId,lineId,expectedRevision:revision,quantity:1}});}
 return {env,call,add,approval,calls,control,cookie,designApproval};
}
test('original-photo capable session, two separate approved lines, quantity/remove and checkout exact attributes',async t=>{
 const f=await fixture(t);assert.equal((await f.add()).response.status,200);assert.equal((await f.add('two',1)).response.status,200);
 let r=await f.call('/api/basket/action',{basketId:'basket',command:{type:'quantity',lineId:'one',actionId:'q',expectedRevision:2,quantity:2}});assert.equal(r.data.basket.lines[0].quantity,2);
 r=await f.call('/api/basket/checkout',{basketId:'basket',revision:3});assert.equal(r.response.status,200,JSON.stringify(r.data));
 const cart=f.calls.find(c=>c.body.query?.includes('mutation RecastBasket(')).body.variables.input;
 assert.equal(cart.lines.length,2);assert.equal(cart.lines[0].quantity,2);
 for(const line of cart.lines)for(const key of ['Artwork ID','_Recast Design','_Recast Proof','_Recast Mockup','_Recast Preview Token','_Recast Preapproval','_Recast Basket Line'])assert.ok(line.attributes.find(a=>a.key===key));
 assert.notEqual(cart.lines[0].attributes.at(-1).value,cart.lines[1].attributes.at(-1).value);
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:3})).data.reused,true);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('mutation RecastBasket(')).length,1);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('query RecastBasketRefresh')).length,1);
 const projection=(await f.call('/api/basket?id=basket')).data;assert.equal(projection.basket.lines.length,2);assert.doesNotMatch(JSON.stringify(projection),/approvalToken|proofHash|ownerId|PRIVATE|accessToken/);
 assert.equal((await f.call('/api/basket/action',{basketId:'basket',command:{type:'remove',lineId:'two',actionId:'r',expectedRevision:3}})).data.basket.lines.length,1);
 assert.equal([...f.env.ARTWORK.objects.keys()].some(k=>k.includes('/wallets/')),false);
});
test('ambiguous remote response locks all subsequent checkout attempts, even after a basket edit',async t=>{
 const f=await fixture(t);await f.add();f.control.failCart=true;
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).response.status,503);
 await f.add('two',1);
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:2})).response.status,503);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('RecastBasket')).length,1);
 assert.equal((await f.call('/api/basket?id=basket')).data.basket.lines.length,2);
});
test('supplier cart line mismatch is never handed to the buyer',async t=>{
 const f=await fixture(t);await f.add();f.control.wrongQuantity=true;
 const r=await f.call('/api/basket/checkout',{basketId:'basket',revision:1});assert.equal(r.response.status,503);assert.equal(r.data.checkoutUrl,undefined);
});
test('catalog variant changes block checkout instead of silently changing products',async t=>{
 const f=await fixture(t);await f.add();f.control.variant='2';
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).data.code,'basket_product_changed');
 assert.equal(f.calls.filter(c=>c.body.query?.includes('RecastBasket')).length,0);
});
test('foreign-origin and missing session cannot read or change a basket',async t=>{
 const f=await fixture(t);await f.add();
 assert.ok((await f.call('/api/basket?id=basket',null,{origin:'https://evil.test'})).response.status>=400);
 assert.equal((await f.call('/api/basket?id=basket',null,{cookie:''})).response.status,401);
 assert.equal((await f.call('/api/basket/session',{requestId:ID,accessToken:'wrong'},{cookie:''})).response.status,403);
});
test('another legitimate browser session cannot reuse the first browser approval',async t=>{
 const f=await fixture(t),a=await f.approval();
 const second=await f.call('/api/basket/session',{requestId:ID,accessToken:TOKEN},{cookie:''});
 const cookie=second.response.headers.get('set-cookie').split(';')[0];
 const r=await f.call('/api/basket/action',{basketId:'basket',approvalToken:a.data.approvalToken,command:{type:'add',actionId:'x',lineId:'x',expectedRevision:0,quantity:1}},{cookie});
 assert.equal(r.data.code,'basket_approval');
});
test('modified frozen artwork fails integrity verification before checkout',async t=>{
 const f=await fixture(t);await f.add();const key=[...f.env.ARTWORK.objects.keys()].find(k=>k.startsWith('commerce/preapprovals/')&&k.endsWith('/source.b64'));
 await f.env.ARTWORK.put(key,'changed');
 assert.equal((await f.call('/api/basket/checkout',{basketId:'basket',revision:1})).data.code,'basket_artwork_changed');
});
test('disabled basket retains single-item checkout and does not show basket enabled',async t=>{
 const f=await fixture(t);f.env.BASKET_ENABLED='false';
 assert.equal((await f.call('/api/basket/status')).data.enabled,false);
 assert.equal((await f.call('/api/basket?id=basket')).response.status,503);
 assert.equal((await f.call('/api/checkout-link',f.designApproval)).response.status,200);
});
test('owner recovery view redacts all capabilities and never resubmits checkout',async t=>{
 const f=await fixture(t);await f.add();f.control.failCart=true;await f.call('/api/basket/checkout',{basketId:'basket',revision:1});
 assert.equal((await f.call('/api/admin/basket-attempts')).response.status,401);
 const r=await f.call('/api/admin/basket-attempts',null,{authorization:'Bearer owner-test-secret'});
 assert.equal(r.data.items[0].status,'needs_review');assert.doesNotMatch(JSON.stringify(r.data),/ownerId|approvalToken|PRIVATE|accessToken|attributes|cartId/);
 assert.equal(f.calls.filter(c=>c.body.query?.includes('RecastBasket')).length,1);
});
