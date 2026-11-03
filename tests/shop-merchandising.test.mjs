import test from 'node:test';
import assert from 'node:assert/strict';
import {groupShopOffers} from '../public/shop-model.js';
import {preferredShopPreview} from '../src/shop-catalog-store.js';
const revision='a'.repeat(64);
const offer={id:'one',designId:'golden',product:'mug',artworkRevision:revision,status:'verified',priceCents:2499,currency:'USD',variantId:'one',mockupUrl:'https://example.com/api/approved-preview/abc',proof:{provider:'printful',approved:true,artworkRevision:revision}};
test('group size variants but preserve different designs, products, and artwork revisions',()=>{
 const large={...offer,id:'large',variantId:'two',priceCents:2999};
 const groups=groupShopOffers([large,offer,{...offer,id:'cat',designId:'cat'},{...offer,id:'blanket',product:'blanket'},{...offer,id:'new',artworkRevision:'b'.repeat(64),proof:{...offer.proof,artworkRevision:'b'.repeat(64)}}]);
 assert.equal(groups.length,4);assert.deepEqual(groups[0].map(o=>o.id),['one','large']);
 assert.equal(groupShopOffers([{...offer,designId:undefined},{...offer,id:'two',designId:undefined}]).length,2);
});
test('mug uses only an exact frozen side view; unknown or external image falls back',()=>{
 const side={title:'Handle on Left',url:offer.mockupUrl+'/0'};
 assert.equal(preferredShopPreview(offer,{images:[{title:'Front view',url:offer.mockupUrl+'/1'},side]}),side.url);
 for(const url of ['https://evil.test/0',offer.mockupUrl+'/0?x',offer.mockupUrl+'/../0'])assert.equal(preferredShopPreview(offer,{images:[{...side,url}]}),offer.mockupUrl);
 assert.equal(preferredShopPreview(offer,{}),offer.mockupUrl);
});
