import test from 'node:test';
import assert from 'node:assert/strict';
import {linkedMug} from '../public/shop-model.js';
const offer={id:'one',product:'mug',status:'verified',priceCents:2000,currency:'USD',artworkRevision:'a',proof:{approved:true,provider:'printful',artworkRevision:'a'},mockupUrl:'https://example.org/mug',variantId:'v',productPreviewUrl:'https://example.org/mug/0'};
test('shared links resolve the exact approved variant alongside campaign parameters',()=>{assert.equal(linkedMug([offer], '?utm_source=facebook&gift=one'),offer);for(const query of ['','?gift=unknown']) assert.equal(linkedMug([offer],query),null)});
test('stale, missing or unapproved artwork cannot open a purchase preview',()=>{for(const change of [{artworkRevision:'b'},{proof:{...offer.proof,approved:false}},{product:'blanket'},{productPreviewUrl:null}])assert.equal(linkedMug([{...offer,...change}],'?gift=one'),null)});
