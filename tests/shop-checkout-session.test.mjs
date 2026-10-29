import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutShopBag,approvedShopLine,verifyCreatedCart} from '../src/shop-checkout-session.js';
const revision='a'.repeat(64),printFileHash='b'.repeat(64),placementHash='c'.repeat(64);
const offer={id:'dog-mug',pet:'dog',sku:'mug',status:'verified',priceCents:2500,currency:'USD',variantId:'gid://shopify/ProductVariant/123',artworkRevision:revision,artworkKey:'shop/masters/dog.png',mockupUrl:'https://example.com/mockup.jpg',proof:{provider:'printful',approved:true,artworkRevision:revision,printfulVariantId:1,printFileHash,placementHash,taskId:'task',checkedAt:'2026-10-29'}};
function setup(){
 const records=new Map();let calls=0;
 const input={attemptId:'e'.repeat(32),lines:[{offerId:offer.id,revision,quantity:1}]};
 const dependencies={catalog:{version:1,offers:[offer]},fulfillment:{mug:{printfulVariantId:1}},
 readVariant:async id=>({id,status:'ACTIVE',availableForSale:true,currency:'USD',sku:'mug',priceCents:2500,quantityAvailable:null}),
 readMaster:async()=>({sha256:revision,printReady:true,safetyApproved:true}),readProof:async()=>({...offer.proof,mockupUrl:offer.mockupUrl}),
 readApproval:async line=>({offerId:line.offerId,artworkRevision:revision,sku:'mug',token:'d'.repeat(48),previewToken:'d'.repeat(48),requestId:'RC-PREMADE-1234',printFileHash,placementHash,proofTaskId:'task',proofHash:'f'.repeat(64),mockupId:'mockup-1',design:{layout:'wrap'},snapshotVerified:true}),
 store:{get:async key=>records.has(key)?{json:async()=>JSON.parse(records.get(key))}:null,put:async(key,value,options)=>{if(options?.onlyIf && records.has(key))return null;records.set(key,value);return {}; }},
 allowedCheckoutHosts:['example.myshopify.com'],
 createCart:async lines=>{calls++;return {id:'cart-1',checkoutUrl:'https://example.myshopify.com/checkouts/test',hasNextPage:false,lines,currency:'USD',subtotalCents:2500};}};
 return {input,dependencies,calls:()=>calls,records};
}
test('double click and replay create only one checkout with exact per-line artwork attributes',async()=>{
 const {input,dependencies,calls}=setup();const results=await Promise.allSettled([checkoutShopBag(input,dependencies),checkoutShopBag(input,dependencies)]);
 assert.equal(calls(),1);assert.ok(results.some(r=>r.status==='fulfilled'));
 const result=await checkoutShopBag(input,dependencies);assert.equal(result.cartId,'cart-1');assert.equal(calls(),1);
});
test('changed bag under same attempt and uncertain provider never auto-create another cart',async()=>{
 const s=setup();await checkoutShopBag(s.input,s.dependencies);s.input.lines[0].quantity=2;await assert.rejects(()=>checkoutShopBag(s.input,s.dependencies),{code:'bag_changed'});assert.equal(s.calls(),1);
 const t=setup();let calls=0;t.dependencies.createCart=async()=>{calls++;throw new Error('timeout');};await assert.rejects(()=>checkoutShopBag(t.input,t.dependencies),{code:'checkout_pending'});await assert.rejects(()=>checkoutShopBag(t.input,t.dependencies),{code:'checkout_pending'});assert.equal(calls,1);
});
test('approval mismatches cannot reach payment provider',async()=>{
 const s=setup(),read=s.dependencies.readApproval;s.dependencies.readApproval=async line=>({...await read(line),artworkRevision:'x'});
 await assert.rejects(()=>checkoutShopBag(s.input,s.dependencies),{code:'approval_unavailable'});assert.equal(s.calls(),0);
});
test('provider subtotal, quantity, attributes and URL must exactly match before redirect',async()=>{
 const s=setup();let captured;s.dependencies.createCart=async lines=>{captured=lines;return {id:'c',hasNextPage:false,lines,subtotalCents:2500,currency:'USD',checkoutUrl:'https://example.myshopify.com/checkouts/test'};};await checkoutShopBag(s.input,s.dependencies);
 const cart={id:'c',hasNextPage:false,lines:captured,subtotalCents:2500,currency:'USD',checkoutUrl:'https://example.myshopify.com/checkouts/test'};
 for(const change of [{subtotalCents:1},{checkoutUrl:'https://evil.example/'},{lines:[{...captured[0],quantity:2}]},{lines:[{...captured[0],attributes:[]}]},{hasNextPage:true}])assert.throws(()=>verifyCreatedCart({...cart,...change},captured,{subtotalCents:2500,allowedCheckoutHosts:s.dependencies.allowedCheckoutHosts}));
});
