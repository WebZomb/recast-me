import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PETS,currentOccasion,matches,readyOffer,restoreCart,changeQuantity,subtotal} from '../public/shop-model.js';
const offer = {id:'golden-mug',title:'Golden Christmas',pet:'dog',breed:'Golden Retriever',product:'Mug',occasion:'christmas',status:'verified',priceCents:2599,currency:'USD',artworkRevision:'v1',variantId:'123',mockupUrl:'https://example.com/proof.jpg',proof:{provider:'printful',approved:true,artworkRevision:'v1'}};
test('only exact supplier-approved artwork is eligible',()=>{
 assert.ok(readyOffer(offer));
 for(const mutation of [{status:'concept'},{priceCents:0},{mockupUrl:'javascript:alert(1)'},{proof:{provider:'generated',approved:true,artworkRevision:'v1'}},{artworkRevision:'v2'}]) assert.equal(readyOffer({...offer,...mutation}),false);
});
test('restore removes retired, changed, malformed and unknown items and caps duplicates',()=>{
 assert.deepEqual(restoreCart([{offerId:'golden-mug',revision:'v1',quantity:18},{offerId:'golden-mug',revision:'v1',quantity:9},{offerId:'fake',revision:'v1',quantity:1},{offerId:'golden-mug',revision:'v2',quantity:1}], [offer]),[{offerId:'golden-mug',revision:'v1',quantity:20}]);
 assert.deepEqual(restoreCart({},[offer]),[]);
});
test('distinct artwork offers on same physical variant stay separate',()=>{
 const second={...offer,id:'tabby-mug',artworkRevision:'cat-v1',proof:{...offer.proof,artworkRevision:'cat-v1'}};
 let cart=changeQuantity([],offer,2);cart=changeQuantity(cart,second,1);
 assert.equal(cart.length,2);assert.equal(subtotal(cart,[offer,second]),7797);
 assert.equal(changeQuantity(cart,offer,-2).length,1);
 assert.throws(()=>changeQuantity([],{...offer,status:'concept'},1));
});
test('Christmas boundaries follow Eastern date',()=>{
 assert.equal(currentOccasion(new Date('2026-10-27T03:59:00Z')),'everyday');
 assert.equal(currentOccasion(new Date('2026-10-27T04:00:00Z')),'christmas');
 assert.equal(currentOccasion(new Date('2026-12-26T05:00:00Z')),'everyday');
});
test('filters intersect, and all agreed pets are represented',()=>{
 assert.equal(PETS.dog.length,12);assert.equal(PETS.cat.length,6);
 assert.ok(matches(offer,{pet:'dog',search:'golden',occasion:'christmas'}));
 assert.equal(matches(offer,{pet:'cat'}),false);
});
