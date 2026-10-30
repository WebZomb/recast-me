import {test} from 'node:test';
import assert from 'node:assert/strict';
import {prepareShopBag} from '../src/shop-checkout-preflight.js';
const hash='a'.repeat(64),fileHash='b'.repeat(64),placement='c'.repeat(64);
const offer={id:'dog-mug',pet:'dog',sku:'mug',status:'verified',priceCents:2500,currency:'USD',variantId:'gid://shopify/ProductVariant/123',artworkRevision:hash,artworkKey:'shop/masters/dog.png',mockupUrl:'https://example.com/mockup.jpg',proof:{provider:'printful',approved:true,artworkRevision:hash,printfulVariantId:1,printFileHash:fileHash,placementHash:placement,taskId:'task',checkedAt:'2026-10-29'}};
const input=()=>({lines:[{offerId:offer.id,revision:hash,quantity:2}],catalog:{version:1,offers:[offer]},fulfillment:{mug:{printfulVariantId:1}},readVariant:async id=>({id,status:'ACTIVE',availableForSale:true,currency:'USD',sku:'mug',priceCents:2500,quantityAvailable:null}),readMaster:async()=>({sha256:hash,printReady:true,safetyApproved:true}),readProof:async()=>({...offer.proof,mockupUrl:offer.mockupUrl})});
test('preflight preserves separate approved designs on same variant and aggregates stock demand',async()=>{
 const args=input();args.catalog.offers.push({...offer,id:'second-mug'});args.lines.push({offerId:'second-mug',revision:hash,quantity:2});let reads=0;
 const base=args.readVariant;args.readVariant=async id=>{reads++;return {...await base(id),quantityAvailable:4};};
 const result=await prepareShopBag(args);assert.equal(reads,1);assert.equal(result.lines.length,2);assert.equal(result.subtotalCents,10000);
 args.readVariant=async id=>({...await base(id),quantityAvailable:3});await assert.rejects(()=>prepareShopBag(args),{code:'quantity_unavailable'});
});
test('changed live price or SKU cannot proceed with stale displayed price',async()=>{
 for(const [change,code] of [[{priceCents:2600},'price_changed'],[{sku:'other'},'variant_changed'],[{availableForSale:false},'unavailable']]){
 const args=input(),base=args.readVariant;args.readVariant=async id=>({...await base(id),...change});await assert.rejects(()=>prepareShopBag(args),{code});}
});
test('unapproved or changed master and supplier proof stop checkout preparation',async()=>{
 for(const change of [{sha256:fileHash},{printReady:false},{safetyApproved:false}]){const args=input(),base=args.readMaster;args.readMaster=async()=>({...await base(),...change});await assert.rejects(()=>prepareShopBag(args),{code:'artwork_unavailable'});}
 for(const change of [{placementHash:fileHash},{printFileHash:hash},{printfulVariantId:2},{mockupUrl:'https://example.com/different.jpg'},{approved:false}]){const args=input(),base=args.readProof;args.readProof=async()=>({...await base(),...change});await assert.rejects(()=>prepareShopBag(args),{code:'proof_changed'});}
});
