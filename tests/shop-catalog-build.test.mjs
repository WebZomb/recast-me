import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCatalog} from '../scripts/build-shop-catalog.mjs';
import fs from 'node:fs';
test('planned designs never appear as purchasable catalog offers',()=>{const result=buildCatalog({version:1,offers:[{id:'draft',status:'planned'}]},{});assert.deepEqual(result,{version:1,checkoutEnabled:false,offers:[]});assert.throws(()=>buildCatalog({version:1,offers:[{id:'draft',status:'verified'}]},{}));});
test('launch assortment covers 18 pets without people or invented available inventory',()=>{const {designs}=JSON.parse(fs.readFileSync(new URL('../catalog/shop/design-plan.json',import.meta.url)));assert.equal(designs.length,54);assert.equal(new Set(designs.map(x=>x.breed)).size,18);assert.equal(new Set(designs.map(x=>x.id)).size,54);assert.ok(designs.every(x=>['dog','cat'].includes(x.pet)&&x.status==='planned'&&x.candidateSkus.length===4));});
