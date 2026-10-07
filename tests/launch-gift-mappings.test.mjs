import test from 'node:test';
import assert from 'node:assert/strict';
import {FULFILLMENT} from '../src/entry.js';
import {productPlacements,productionFiles,productPrintfile} from '../src/commerce-store.js';
// Exact identities observed in the authenticated Printful catalog, 2026-10-07.
test('new gift SKUs match actual supplier products, sizes and phone models',()=>{
 const cases={IP14:16240,IP14PLUS:16242,IP14PRO:16241,IP14PM:16243,IP15:17616,IP15PRO:17618,IP15PM:17619,IP16:20290,IP16PRO:20292};
 for(const [name,id] of Object.entries(cases)){const m=FULFILLMENT['RECAST-CASE-'+name];assert.equal(m.printfulProductId,181);assert.equal(m.printfulVariantId,id);}
 for(const [size,id] of Object.entries({14:49853,16:49854,18:4532,22:11075})){const m=FULFILLMENT['RECAST-PILLOW-'+size];assert.equal(m.printfulProductId,83);assert.equal(m.printfulVariantId,id);}
 for(const [sku,p,v] of [['RECAST-STICKER-3X3',358,10163],['RECAST-JOURNAL-HC',867,22658],['RECAST-TOTE-BLACK',84,4533],['RECAST-PUZZLE-252',534,13431],['RECAST-PUZZLE-520',534,13432]]){assert.equal(FULFILLMENT[sku].printfulProductId,p);assert.equal(FULFILLMENT[sku].printfulVariantId,v);}
 assert.equal(FULFILLMENT['RECAST-TOTE-BLACK'].preferredPlacement,'default');assert.equal(FULFILLMENT['RECAST-TOTE-BLACK'].orderFileType,'default');
});
test('pillow preview and production use identical art on both verified print areas',()=>{
 const map=FULFILLMENT['RECAST-PILLOW-14'],design={version:6,product:'Pillow'};
 const catalog={printfiles:[{printfile_id:1701,width:2250,height:2250}],variant_printfiles:[{variant_id:49853,placements:{front:1701,back:1701}}]};
 assert.deepEqual(productPlacements(map,design),['front','back']);assert.deepEqual(productPrintfile(catalog,49853,'front'),productPrintfile(catalog,49853,'back'));
 const position={area_width:2250,area_height:2250,width:2250,height:2250,left:0,top:0};
 assert.deepEqual(productionFiles(map,design,'https://recast.test/approved-clean',position),['front','back'].map(type=>({type,url:'https://recast.test/approved-clean',position})));
 assert.deepEqual(productPlacements(map,{version:4}),['front']);
 assert.equal(productionFiles(FULFILLMENT['RECAST-MUG-11OZ'],{version:6},'url',position).length,1);
});
