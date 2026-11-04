import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {COASTER_PILOT,runCoasterPilot,coasterPilotStatus} from '../src/shop-coaster-pilot.js';
import {EXPANSION_DESIGNS} from '../src/shop-expansion.js';
import {shopRoutes} from '../src/shop-routes.js';
import {FULFILLMENT} from '../src/entry.js';

const approved=EXPANSION_DESIGNS[0];
const key='shop/preparation/coasters/v1/golden-retriever-4pack.json';
const sourceKey=`requests/${approved.requestId}/request.json`;
const allowlistToken='private-source-token-never-expose';
function env(){return {PREMADE_COASTER_PILOT_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{}};}
async function prepare(e,{rights=true,matching=true}={}){
 await e.ARTWORK.put(sourceKey,JSON.stringify({
  source:'premade-catalog',
  catalogDesignId:approved.id,
  catalogMasterHash:matching?approved.sha256:'f'.repeat(64),
  catalogRightsConfirmedAt:rights?'2026-11-04T01:00:00Z':null,
  contentSafety:{status:'approved'},accessToken:allowlistToken,
  requestId:approved.requestId,width:1254,height:1254,previewMime:'image/png'
 }));
 await e.ARTWORK.put('shop/catalog/v1.json',JSON.stringify({version:1,offers:[{
  id:'village-golden-retriever-mug-11oz',designId:approved.id,artworkRevision:approved.sha256,
  requestId:approved.requestId,product:'mug',status:'verified',proof:{provider:'printful',approved:true}
 }]}));
 return e;
}
test('one coaster pilot is immutable, product mapped, and not publicly purchasable',async()=>{
 assert.equal(COASTER_PILOT.designId,approved.id);
 assert.equal(COASTER_PILOT.artworkRevision,approved.sha256);
 assert.equal(COASTER_PILOT.sku,'RECAST-COASTER-SET');
 assert.equal(FULFILLMENT[COASTER_PILOT.sku].product,'Coaster 4-Pack');
 assert.equal(FULFILLMENT[COASTER_PILOT.sku].printfulVariantId,15662);
 const e=env();e.PREMADE_COASTER_PILOT_ENABLED='false';
 assert.deepEqual(await runCoasterPilot(e),{enabled:false});
 assert.equal(e.ARTWORK.objects.size,0);
 const status=await coasterPilotStatus(e);
 assert.deepEqual([status.enabled,status.status,status.checkoutEnabled,status.automaticApproval],[false,'not_started',false,false]);
});
test('unapproved or altered artwork never starts a provider task',async()=>{
 for(const source of [{rights:false},{matching:false},{}]){
  let creates=0,rates=0;
  const e=env();if(Object.keys(source).length)await prepare(e,source);
  const r=await runCoasterPilot(e,{create:async()=>{creates++;throw Error('Must not call Printful')},rate:async()=>{rates++;return true;}});
  assert.equal(r.status,'needs_review');
  assert.equal(r.created,0);
  assert.equal(creates,0);assert.equal(rates,0);
  assert.equal((await coasterPilotStatus(e)).checkoutEnabled,false);
  assert.equal((await e.ARTWORK.get(key)).etag!==undefined,true);
 }
});
test('single supplier preview canary creates one task and later polls same job without duplicate creation',async()=>{
 const e=await prepare(env());
 let created=0,rated=0,polled=0;
 const create=async(request)=>{
  created++;
  assert.equal(request.method,'POST');
  assert.equal(new URL(request.url).pathname,'/api/mockup/create');
  const payload=await request.json();
  assert.equal(payload.sku,'RECAST-COASTER-SET');
  assert.equal(payload.requestId,approved.requestId);
  assert.equal(payload.accessToken,allowlistToken);
  assert.equal(payload.design.product,'Coaster 4-Pack');
  return Response.json({ok:true,status:'pending',mockupId:'v6-coaster-4pack-mockup'});
 };
 const rate=async()=>{rated++;return true;};
 let r=await runCoasterPilot(e,{create,rate});
 assert.deepEqual(r,{enabled:true,status:'pending_preview',created:1});
 assert.equal(created,1);assert.equal(rated,1);
 let poll=async(request)=>{
  polled++;
  const u=new URL(request.url);
  assert.equal(u.searchParams.get('sku'),'RECAST-COASTER-SET');
  assert.equal(u.searchParams.get('requestId'),approved.requestId);
  assert.equal(u.searchParams.get('token'),allowlistToken);
  assert.equal(u.searchParams.get('mockup'),'v6-coaster-4pack-mockup');
  return Response.json(polled===1?{ok:true,status:'pending'}:{
   ok:true,status:'completed',images:[{title:'Printful front',url:'https://recast.test/proof/private-token'}]
  });
 };
 r=await runCoasterPilot(e,{create,poll,rate});
 assert.equal(r.status,'pending_preview');assert.equal(created,1);assert.equal(polled,1);
 r=await runCoasterPilot(e,{create,poll,rate});
 assert.equal(r.status,'ready_for_review');assert.equal(created,1);assert.equal(polled,2);
 r=await runCoasterPilot(e,{create,poll,rate});
 assert.equal(r.status,'ready_for_review');assert.equal(created,1);assert.equal(polled,2);
 const publicStatus=await coasterPilotStatus(e);
 assert.equal(publicStatus.providerViewCount,1);
 assert.equal(publicStatus.checkoutEnabled,false);
 assert.equal(publicStatus.automaticApproval,false);
 assert.doesNotMatch(JSON.stringify(publicStatus),/private-token|private-source-token-never-expose|mockupId|taskKey|approvedArtwork/);
 const saved=await (await e.ARTWORK.get(key)).json();
 assert.equal(saved.manualApprovalRequired,true);
 assert.equal(await e.ARTWORK.get('shop/catalog/v1.json')!==null,true);
 const readOnly=await shopRoutes(new Request('https://recast.test/api/shop/coaster-pilot'),e);
 assert.equal(readOnly.status,200);
 assert.equal(readOnly.headers.get('x-robots-tag'),'noindex, nofollow');
 const data=await readOnly.json();
 assert.equal(data.status,'ready_for_review');
 assert.equal(data.checkoutEnabled,false);
 const post=await shopRoutes(new Request('https://recast.test/api/shop/coaster-pilot',{method:'POST'}),e);
 assert.equal(post.status,405);
});
test('provider create failures stop permanently for manual reconciliation without new tasks',async()=>{
 const e=await prepare(env());let calls=0;
 const create=async()=>{calls++;throw new Error('Provider accepted and lost response')};
 let x=await runCoasterPilot(e,{create,rate:async()=>true});
 assert.equal(x.status,'needs_review');assert.equal(calls,1);
 x=await runCoasterPilot(e,{create,rate:async()=>true});
 assert.equal(x.status,'needs_review');assert.equal(calls,1);
 const stored=await (await e.ARTWORK.get(key)).json();
 assert.equal(stored.code,'coaster_provider_needs_review');
 assert.equal(stored.status,'needs_review');
 assert.doesNotMatch(JSON.stringify(await coasterPilotStatus(e)),/Provider accepted|response lost/);
});
test('global Printful rate exhaustion defers without provider call, claim or source rewrite',async()=>{
 const e=await prepare(env());
 let calls=0;
 const before=e.ARTWORK.objects.size;
 const res=await runCoasterPilot(e,{rate:async()=>false,create:async()=>{calls++;}});
 assert.equal(res.status,'rate_limited');
 assert.equal(calls,0);
 assert.equal(e.ARTWORK.objects.size,before);
 assert.equal((await coasterPilotStatus(e)).status,'not_started');
});
test('ambiguous creating_preview claim never retries provider, and failed polls remain held',async()=>{
 const e=await prepare(env()),created=0;
 await e.ARTWORK.put(key,JSON.stringify({id:COASTER_PILOT.id,status:'creating_preview',startedAt:'2026-11-04T00:00:00Z'}));
 const res=await runCoasterPilot(e,{create:async()=>{throw Error('should not retry')}});
 assert.equal(res.status,'creating_preview');assert.equal(res.created,0);
});

test('manufacturer proof links require the owner bearer secret and never leak in public status',async()=>{
 const e=await prepare(env());e.ADMIN_TOKEN='owner-token-for-test-only';
 const mockupId='coaster-preview-one';
 await e.ARTWORK.put(key,JSON.stringify({id:COASTER_PILOT.id,status:'ready_for_review',mockupId,providerViewCount:1}));
 const privateImage=`https://recastmeai.com/api/mockup/image/${encodeURIComponent(approved.requestId)}/RECAST-COASTER-SET/0?token=single-use-supplier-view`;
 await e.ARTWORK.put(`mockups/${approved.requestId}/RECAST-COASTER-SET/${mockupId}/task.json`,JSON.stringify({
  status:'completed',requestId:approved.requestId,sku:'RECAST-COASTER-SET',mockupId,
  images:[{title:'Product side view',url:privateImage},{title:'Untrusted',url:'https://unsafe.example/mockup?token=private'}]
 }));
 const unauth=await shopRoutes(new Request('https://recast.test/api/shop/coaster-pilot/qa'),e);
 assert.equal(unauth.status,401);
 assert.doesNotMatch(await unauth.text(),/single-use-supplier-view|Product side view|owner-token-for-test-only/);
 const wrong=await shopRoutes(new Request('https://recast.test/api/shop/coaster-pilot/qa',{headers:{authorization:'Bearer incorrect'}}),e);
 assert.equal(wrong.status,401);
 const valid=await shopRoutes(new Request('https://recast.test/api/shop/coaster-pilot/qa',{headers:{authorization:'Bearer owner-token-for-test-only'}}),e);
 assert.equal(valid.status,200);
 assert.equal(valid.headers.get('x-robots-tag'),'noindex, nofollow');
 const d=await valid.json();
 assert.deepEqual(d.supplierPictures,[{title:'Product side view',url:privateImage}]);
 assert.equal(d.checkoutEnabled,false);
 assert.equal(d.automaticApproval,false);
 assert.equal(d.reviewStatus,'manual_review_required');
 const publicStatus=await shopRoutes(new Request('https://recast.test/api/shop/coaster-pilot'),e);
 assert.equal(publicStatus.status,200);
 assert.doesNotMatch(await publicStatus.text(),/single-use-supplier-view|mockupId|owner-token-for-test-only/);
});
