import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bucket} from './security-helpers.mjs';
import {runShopExpansion,shopExpansionStatus,EXPANSION_DESIGNS,EXPANSION_ITEMS,REVIEWED_EXPANSION_PROOFS} from '../src/shop-expansion.js';
import {shopRoutes} from '../src/shop-routes.js';

const manifest=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8'));

test('server-side Christmas mug designs match the exact pinned public art and both existing sizes',()=>{
 assert.equal(EXPANSION_DESIGNS.length,35);
 assert.equal(EXPANSION_ITEMS.length,70);
 assert.equal(new Set(EXPANSION_ITEMS.map(x=>x.id)).size,70);
 for(const design of EXPANSION_DESIGNS){
  const visual=manifest.designs.find(d=>d.designId===design.id);
  assert.ok(visual,'Every server-design must have a preview');
  assert.equal(design.asset,visual.artworkImage);
  assert.equal(design.sha256,visual.artworkRevision);
  assert.deepEqual([design.width,design.height],[1254,1254]);
  assert.match(design.requestId,/^RC-[A-Z0-9-]{8,60}$/);
  const variants=EXPANSION_ITEMS.filter(x=>x.designId===design.id);
  assert.deepEqual(variants.map(x=>x.sku),['RECAST-MUG-11OZ','RECAST-MUG-15OZ']);
 }
 assert.deepEqual(REVIEWED_EXPANSION_PROOFS,{
 'village-siamese-cat-mug-11oz':'88bec6f6685766c6fb593816df75004d24f3db309f2c55c9de75419a7d01a1d0',
 'village-siamese-cat-mug-15oz':'3894ecd0883074c96a052ef23b6aa1dec31aa289ab146c2a8dd0cb7b5b8be114',
  'village-golden-retriever-mug-11oz':'b114d98c685bd48caa8d0cedd9a890714fc4936273b1a4d85d75e9c36cc5669b',
  'village-golden-retriever-mug-15oz':'ef15ee055e30aeb1f121cec08a1e7200aed283f6d7e17985f51b56b32661049d',
 'village-labrador-retriever-mug-11oz':'859163145a6650e7e9e092047ada6d25077cf90a76837ac2ee1927e170ec5f33',
 'village-labrador-retriever-mug-15oz':'d571679afef663d389116bc51abbaf441eefc12981f74a0cd4e78e7e439de941',
 'village-german-shepherd-mug-11oz':'bcb075fd4fe0d8fdbe5b509b974013f3e931b8c064104676d614cc087ccdde85',
 'village-german-shepherd-mug-15oz':'a487bde8c62f69f0a942705f256d49e2a957663c3ddab82d019eac847a7f5c8d',
 'village-french-bulldog-mug-11oz':'a61b3871c29c252af5a485bde2e7b4b204232fd9ce6ce7f2268cadd5a5d131be',
 'village-french-bulldog-mug-15oz':'427f93b08b399626afd2db2c599960c200867b0bc3e6b9d051ff7502e20e119f',
 'village-beagle-mug-11oz':'f6f5094f66f6ac1122f96d8ec0d5d1b10047d4399f975a4f5739b23145304af2',
 'village-beagle-mug-15oz':'9c97106fbd086f851a23a8a1990892c97cc54cc32991a03f20f9c6bb5b4d2dea',
 'village-poodle-mug-11oz':'e94acc028ce9e0f9e4505530bbe3f68daf88a486f41e0e49601d99000982947a',
 'village-poodle-mug-15oz':'dd1deb81c0d364c56b8c901ce66024fdf0773b08ebc8802caf50ad3f2d1abf6f',
 'village-husky-mug-11oz':'1dded23da0468e08365a89384e5c9485e4142cc4f36c79dc2af6097c6ff77d36',
 'village-husky-mug-15oz':'87f50dc89f7050a7cacd474de2d0eed846c4f4cba598077aeff1ffca61ae363a',
 'village-orange-tabby-mug-11oz':'35f17e2c03f47a97902db01ff97b2a5049f9c3f8d7b5d487cd6cbe88cb1f5f24',
 'village-orange-tabby-mug-15oz':'0b2b5caf21625b213d492b4a024d3aed4fc7a734ebfa42e8ea018944f381dda4',
 'village-tuxedo-cat-mug-11oz':'c820ad43f05a6cd6b1e30325d9a58bae69fae04a17fc356d05374d90df314ca2',
 'village-tuxedo-cat-mug-15oz':'4a0d52ad627abf9d963bed195bba3187384c717c5a897921b1a44f800f724d78',
 'village-jack-russell-mug-11oz':'82e96b6a9248a835b43a35eb3d9b6b5d9dac74cd55c81e4aca4c0f46f9a4a256',
 'village-jack-russell-mug-15oz':'3b566030164e8bdcbef873507a831f503b3d6708f6b1bd97f8f3c2944aff200c',
 'village-chihuahua-mug-11oz':'fb8cdabc60e4bc3987a29016dc7a7a5f97a9f5ee72b1a7c54fb555b78f54cc0a',
 'village-chihuahua-mug-15oz':'adf1f48c405435d910e96cdd29bd62aa64a25033bc73cbe6cb2d7fd3b3d9be04',
 'village-dachshund-mug-11oz':'9c44e7e6fe5813a8ae3cab2306911a376703cc7fba668eb05a4f0e4c85d6db4f',
 'village-dachshund-mug-15oz':'5d4499268c13ad4dc4584667164999f52b3c081f7450b10708a29904870e9da4',
 'archive-poodle-lavender-mug-11oz':'454d9c2305c890db41a505c6c9958473aa1cbd8cc097c47ca855f5cca5060c2f',
 'archive-poodle-lavender-mug-15oz':'2aa6a7bcb4b9beb1d7ee7b66beed8acb59d17196412c068524f160d805a0e54c',
 'archive-british-shorthair-red-velvet-mug-11oz':'a05add9dd3fb8db94ba5542d9f613b3ba75b5ed4a9233b9d4112a31e51326955',
 'archive-british-shorthair-red-velvet-mug-15oz':'5cd680e16833bd44d67d6ff747dac258a3976ae5ff323a7420c9742ab4d15a0c',
 'archive-pointer-winter-woods-mug-11oz':'6c86a9a19c74a83d998b49516811f0f4d286b2b2078fa999bcc510b9102e82c2',
 'archive-pointer-winter-woods-mug-15oz':'2a9d5ee0901a57eda500f5d051266372dbb1eb7f286e0abfa7b4b253b3a564ad',
 'archive-abyssinian-evergreen-mug-11oz':'3b925ecd598e8f0f4bc2c4ffec1f78cd691c4bc8db987e86893732f1cd770b40',
 'archive-abyssinian-evergreen-mug-15oz':'cbe46b9637a5cb6a5628bcfee6daa4471eb2cec95cfe7d8fe704904647f0fe30',
 'archive-ragdoll-ice-palace-mug-11oz':'fd80d197219d06b5d7237e9f78c8d04f10414149b24aebd658f21d604e53e7be',
 'archive-ragdoll-ice-palace-mug-15oz':'80b098d2ae37e0727f345a831152c478e5dd496fb0e5e28ff0e8f5f0c632367d',
 'archive-beagle-santa-mail-mug-11oz':'cfbbc309ab78b13a20b7253e4b73f57f36acdec2bf637bd2e124a2457c8990e4',
 'archive-beagle-santa-mail-mug-15oz':'23c5cf5f9044d7d127a969d91c3147ff1e2e1d0b2bb5a31de026570d870478bc',
 'archive-maine-coon-snowfall-mug-11oz':'8830b74ec28d14c909046014d40c08b11824c22cae55436c6568e83d6487fc95',
 'archive-maine-coon-snowfall-mug-15oz':'96afffe35ce01aa3563a75b975721257c0552219701297f0e52ecc31df06c3ed',
 'archive-white-persian-rose-mug-11oz':'5263e732b73d2d852875c05734cd9d238f8051879651adbba2a73856bf4d3132',
 'archive-white-persian-rose-mug-15oz':'afe52fdca4dd791f5e49ee1a4f9f542c781c0baab90bb66a6fb636a217161753',
 'archive-english-bulldog-gifts-mug-11oz':'0f4b651c58fbdf86f68ea501d2dc6f8be15b59bd51bc56eac17c9b17b1ae47e6',
 'archive-english-bulldog-gifts-mug-15oz':'ef413280ebf23904d29e9f806d25858141f87b6dbde4359ef6d20ae7856944cc',
 'archive-silver-tabby-toy-train-mug-11oz':'afd6c188f76dad403cbb6cd6abd7f82942ae9ec13c64e25a577c91b3a77d7a0e',
 'archive-silver-tabby-toy-train-mug-15oz':'6bb51d9682142e3a4cfb5a5932f4044f754f425a0d7190b60b0750c2530b0b40',
 'archive-german-shepherd-snowy-street-mug-11oz':'f4b3693eb7bc4493efe53d1dcd348462658513376ebf8c6a74f664f7e8cb2ff0',
 'archive-german-shepherd-snowy-street-mug-15oz':'405f19fa8a981a352874e052e8221a1c8ede4d92349cc73d0fca0f0f11e388b2',
 'archive-russian-blue-midnight-mug-11oz':'e6c07fdc882e9faff54d820d8e1a969b6ce48bad77b77559b70aa71331ab300e',
 'archive-russian-blue-midnight-mug-15oz':'b2a13e4001e6ff391aa5c7d7b85106b4785a0504c0d20906242300bdc06b15a3',
 'archive-maine-coon-fireside-mug-11oz':'c862628a7345870165aa202d77c946c9b18ec7ece00adf2d08a66569cf4cbf2d',
 'archive-maine-coon-fireside-mug-15oz':'a072dd5e92d115f760faca1f56372d14452e8c53ae36b3ee490daa401e46860a',
 'archive-french-bulldog-toy-shop-mug-11oz':'54f683e681d1e31b158744024e88806b9accc57b05adb92175790b3f9b4dccdd',
 'archive-french-bulldog-toy-shop-mug-15oz':'417a373369302abf58f7c08b7deed33e2aacf8e065a004ad9cba513e1013f86d',
 'archive-chihuahua-holiday-gold-mug-11oz':'c65880590f7bb7047d5d6ab220e28a2ac680283cee7a99f092c36287593e6f6e',
 'archive-chihuahua-holiday-gold-mug-15oz':'946dede56c05b02af2ed0bc24353db2f3698ee92e751fbdb1e52ff88ac928fdd',
 'archive-orange-persian-cozy-fire-mug-11oz':'f7b804993e06e84dc92592ae202046c16cafc1ccba91691502c330812bd215ec',
 'archive-orange-persian-cozy-fire-mug-15oz':'b7608a03fdebe9e405a0fa2f51ab012bedd10ee867b766fe630b98881d1c3d91',
 'archive-chocolate-labrador-chalet-mug-11oz':'797e9ab77bae5306fef6859f27ce1498e2327d243fa3ded5d089ef438f875072',
 'archive-chocolate-labrador-chalet-mug-15oz':'e0e08a2e56a89aa12230e3d0fe96bb3a782f9882ea9bbf77a688fb696b9edfe1',
 'archive-dalmatian-christmas-engine-mug-11oz':'bdae32c0505869a0ffa3ce93de053af83bf3812554134861aa6987e5cf15d995',
 'archive-dalmatian-christmas-engine-mug-15oz':'dbed926e17633b9c666a201e78c919140bb51856511018465ae8d720d64a2eb8',
 'archive-sphynx-present-surprise-mug-11oz':'71aa69b76979742303906f606795667854e7cec8127da547bcf427f8b711af6c',
 'archive-sphynx-present-surprise-mug-15oz':'7992ad2b21433b2a89a947d2148b8c2242ae0f443ee151f4aacca272732a8a39',
 'archive-dachshund-gingerbread-village-mug-11oz':'566e159b8cbc7386428cb627cc5dc4e61486ba52b8b22aae279f6d3679d6fca0',
 'archive-dachshund-gingerbread-village-mug-15oz':'2b3d67b9b806e7f5e97ee50f1dd3606de82677959abe1d5a56f873c6696efa51',
 'archive-rottweiler-fireside-mug-11oz':'c8c427c00c1e28fdef40f28aff39ee9d7925462137aa55fb76901ce9a973bde4',
 'archive-rottweiler-fireside-mug-15oz':'b52f26308af8dbe34089fb8cd5ff1e4b3b5e7055dade39fa062ab599ffa89aed',
 'archive-jack-russell-snowy-sleigh-mug-11oz':'70b84a089652cf1227751030cd0b4c2e8fa73bcdeb1bc45255826957414b44e9',
 'archive-jack-russell-snowy-sleigh-mug-15oz':'3cdb21f5c6b0b517f92220a22f074023eb1f9ee7cc68dd096502f5c86b3a8c71'

 });
});

test('new supplier preparation is disabled by default and cannot be started by a public POST',async()=>{
 const env={ARTWORK:new Bucket()};
 assert.deepEqual(await runShopExpansion(env),{enabled:false});
 assert.equal(env.ARTWORK.objects.size,0);
 const status=await shopExpansionStatus(env);
 assert.equal(status.enabled,false);
 assert.ok(status.items.every(x=>x.status==='not_started'));
 assert.equal((await shopRoutes(new Request('https://recast.test/api/shop/expansion',{method:'POST'}),env)).status,405);
 assert.equal(env.ARTWORK.objects.size,0);
});

test('tampered remote artwork never creates a supplier preview or a purchasable offer',async t=>{
 let external=0;t.mock.method(globalThis,'fetch',async(_url,options)=>{assert.equal(options.redirect,'manual');external++;return new Response('not the pinned artwork');});
 const env={PREMADE_EXPANSION_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};
 const response=await runShopExpansion(env);
 assert.deepEqual(response,{enabled:true,created:0,polled:0,ready:0});
 const report=await shopExpansionStatus(env);
 assert.equal(report.items.filter(item=>item.status==='needs_review').length,2);
 assert.equal(report.items.filter(item=>item.status==='not_started').length,68);
 assert.equal(external,1,'Rate-limited source screening does not fan out across the catalog');
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
 assert.doesNotMatch(JSON.stringify(report),/accessToken|approvalToken|snapshotKey|PRINTFUL_API_TOKEN/);
});

import {safeExpansionFailureClass} from '../src/shop-expansion.js';
test('source error classification exposes only fixed safe words, never URLs, tokens or provider responses',()=>{
 assert.equal(safeExpansionFailureClass('TypeError: fetch failed to https://cdn.example/?token=sk-project-secret12345'), 'typeerror_fetch_failed');
 assert.equal(safeExpansionFailureClass('Cannot read properties of undefined (reading info)'), 'cannot_read_properties_of_undefined_reading_info');
 assert.equal(safeExpansionFailureClass('someuniqueusersecrettoken'), 'unclassified');
});

test('source redirect is explicitly rejected without a mockup or storefront publication',async t=>{
 let redirects=0;
 t.mock.method(globalThis,'fetch',async(_url,opts)=>{
  assert.equal(opts.redirect,'manual');redirects++;
  return new Response(null,{status:302,headers:{location:'https://untrusted.invalid/surprise.png'}});
 });
 const env={PREMADE_EXPANSION_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};
 const result=await runShopExpansion(env);
 assert.deepEqual(result,{enabled:true,created:0,polled:0,ready:0});
 const status=await shopExpansionStatus(env);
 assert.equal(redirects,1);
 assert.equal(status.items.filter(x=>x.status==='needs_review').length,2);
 assert.equal(status.items.filter(x=>x.status==='not_started').length,68);
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
});

import {approvedMugSourceMime,canaryDesignCount} from '../src/shop-expansion.js';
test('v3 canary limits number of mug designs and source types match bytes',()=>{
 assert.equal(approvedMugSourceMime(new Uint8Array([0xff,0xd8,0xff,0xe0])),'image/jpeg');
 assert.equal(approvedMugSourceMime(new Uint8Array([137,80,78,71,13,10,26,10])),'image/png');
 assert.throws(()=>approvedMugSourceMime(new Uint8Array([71,73,70,56])),e=>e.code==='seed_asset_format');
 assert.equal(canaryDesignCount({PREMADE_EXPANSION_CANARY_COUNT:'1'}),1);
 assert.equal(canaryDesignCount({PREMADE_EXPANSION_CANARY_COUNT:'35'}),35);
 assert.equal(canaryDesignCount({PREMADE_EXPANSION_CANARY_COUNT:'500'}),0);
});
test('one canary allows only its 2 SKUs, never creates supplier mockups on bad source',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async(_url,options)=>{
  assert.equal(options.redirect,'manual');calls++;return new Response('invalid asset');
 });
 const env={PREMADE_EXPANSION_ENABLED:'true',PREMADE_EXPANSION_CANARY_COUNT:'1',ARTWORK:new Bucket(),IMAGES:{}};
 await runShopExpansion(env);
 const status=await shopExpansionStatus(env);
 assert.equal(status.canaryDesigns,1);
 assert.equal(status.items.filter(x=>x.status==='needs_review').length,2);
 assert.equal(status.items.filter(x=>x.status==='not_started').length,68);
 assert.equal(calls,1);
 assert.equal(await env.ARTWORK.get('shop/catalog/v1.json'),null);
});

import {sourcePreviewBatchSize} from '../src/shop-expansion.js';
test('source preview batch bounds remain safe and explicit',()=>{
 assert.equal(sourcePreviewBatchSize({}),2);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'4'}),4);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'8'}),8);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'9'}),2);
 assert.equal(sourcePreviewBatchSize({PREMADE_EXPANSION_PREVIEW_BATCH_SIZE:'0'}),2);
});
test('35-design preview staging remains bounded and does not imply automatic sale approval',()=>{
 const settings=readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8');
 assert.match(settings,/"PREMADE_EXPANSION_CANARY_COUNT":\s*"35"/);
 assert.match(settings,/"PREMADE_EXPANSION_PREVIEW_BATCH_SIZE":\s*"2"/);
 assert.match(settings,/"PREMADE_EXPANSION_ENABLED":\s*"true"/);
 assert.equal(Object.keys(REVIEWED_EXPANSION_PROOFS).length,70);
 assert.equal(EXPANSION_ITEMS.length,70);
});

import {claimMugPreviewRateSlot} from '../src/shop-expansion.js';
test('two mocked Printful create tasks per rolling 65 seconds, stored across cron rounds',async()=>{
 const env={ARTWORK:new Bucket()};
 assert.equal(await claimMugPreviewRateSlot(env,1793740000000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740001000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740061000),false);
 assert.equal(await claimMugPreviewRateSlot(env,1793740066000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740067000),true);
 assert.equal(await claimMugPreviewRateSlot(env,1793740068000),false);
 const o=await env.ARTWORK.get('shop/preparation/v3/mockup-create-rate.json');
 assert.equal((await o.json()).timestamps.length,2);
});
test('corrupt rate history stays fail closed and submits no new preview task',async()=>{
 const env={ARTWORK:new Bucket()};
 await env.ARTWORK.put('shop/preparation/v3/mockup-create-rate.json','{"timestamps":"corrupted"}');
 assert.equal(await claimMugPreviewRateSlot(env,1793740000000),false);
});

test('corrupted supplier rate state prevents unbounded new source imports',async t=>{
 let external=0;
 t.mock.method(globalThis,'fetch',async()=>{external++;throw Error('Unexpected provider request');});
 const store=new Bucket();
 await store.put('shop/preparation/v3/mockup-create-rate.json','{"timestamps":"invalid"}');
 const env={PREMADE_EXPANSION_ENABLED:'true',PREMADE_EXPANSION_CANARY_COUNT:'35',ARTWORK:store,IMAGES:{}};
 const result=await runShopExpansion(env);
 assert.deepEqual(result,{enabled:true,created:0,polled:0,ready:0});
 assert.equal(external,0,'Do not import or screen art without available provider capacity');
 const report=await shopExpansionStatus(env);
 assert.equal(report.items.filter(x=>x.status==='not_started').length,70);
 assert.equal(await store.get('shop/catalog/v1.json'),null);
});
