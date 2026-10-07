import test from 'node:test';
import assert from 'node:assert/strict';
import {FULFILLMENT} from '../src/entry.js';

test('existing approved gift SKUs are mapped to concrete Printful variants',()=>{
 const expected={
  'RECAST-STICKER-3X3':10163,
  'RECAST-PILLOW-14':4530,'RECAST-PILLOW-16':4531,'RECAST-PILLOW-18':4532,'RECAST-PILLOW-22':4534,
  'RECAST-JOURNAL-HC':12141,'RECAST-TOTE-BLACK':4533,
  'RECAST-PUZZLE-252':13431,'RECAST-PUZZLE-520':13432,
  'RECAST-CASE-IP14':17612,'RECAST-CASE-IP14PLUS':17613,'RECAST-CASE-IP14PRO':17614,'RECAST-CASE-IP14PM':17615,
  'RECAST-CASE-IP15':17616,'RECAST-CASE-IP15PRO':17618,'RECAST-CASE-IP15PM':17619,
  'RECAST-CASE-IP16':20290,'RECAST-CASE-IP16PRO':20292
 };
 for(const [sku,id] of Object.entries(expected)){
  assert.ok(FULFILLMENT[sku],sku);
  assert.equal(FULFILLMENT[sku].printfulVariantId,id,sku);
  assert.ok(FULFILLMENT[sku].preferredPlacement,sku);
  assert.ok(FULFILLMENT[sku].orderFileType,sku);
 }
});

test('unverified phone-case SKUs stay outside fulfillment',()=>{
 for(const sku of ['RECAST-CASE-IP15PLUS','RECAST-CASE-IP16PLUS','RECAST-CASE-IP16PM','RECAST-CASE-IP17','RECAST-CASE-S23','RECAST-CASE-S25ULTRA']) assert.equal(FULFILLMENT[sku],undefined,sku);
});
