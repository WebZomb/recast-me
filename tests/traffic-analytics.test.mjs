import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bucket} from './security-helpers.mjs';
import {trafficRoutes,analyticsSummary} from '../src/traffic-analytics.js';
import router from '../src/router.js';
const env=()=>({ARTWORK:new Bucket(),ADMIN_TOKEN:'test-owner-key',SITE_ANALYTICS_ENABLED:'true'});
const client={
 visitorId:'0123456789abcdef0123456789abcdef',
 sessionId:'123456789abcdef0123456789abcdef0',
 type:'visit',path:'home',source:'direct'
};
const friend={
 visitorId:'fedcba9876543210fedcba9876543210',
 sessionId:'abcdef0123456789abcdef0123456789',
 type:'visit',path:'credits',source:'instagram',campaign:'halloween'
};
function makeEvent(body=client,headers={}){
 const request=new Request('https://recast.test/api/analytics/event',{method:'POST',
  headers:{'x-recast-request':'1','content-type':'application/json','origin':'https://recast.test',
   'user-agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
   ...headers},body:JSON.stringify(body)});
 request.cf={country:'US'};return request;
}
const admin=(days=7,token='test-owner-key')=>new Request('https://recast.test/api/admin/traffic?days='+days,{headers:{authorization:'Bearer '+token}});
test('Empty site metrics show zeros rather than fake visitor or sales counts',async()=>{
 const d=await analyticsSummary(env(),7);
 assert.equal(d.ok,true);assert.equal(d.totals.visitors,0);assert.equal(d.totals.sessions,0);
 assert.equal(d.totals.pageViews,0);assert.equal(d.totals.checkoutClicks,0);assert.equal(d.timeline.length,7);
 assert.deepEqual(d.sources,[]);assert.deepEqual(d.campaigns,[]);
});
test('Private dashboard requires the existing admin secret; public writer needs same-origin',async()=>{
 const e=env();
 assert.equal((await trafficRoutes(admin(7,'wrong'),e)).status,401);
 assert.equal((await trafficRoutes(admin(),e)).status,200);
 assert.equal((await trafficRoutes(admin(2),e)).status,400);
 assert.equal((await trafficRoutes(makeEvent(client,{'origin':'https://bad.example'}),e)).status,403);
 assert.equal((await trafficRoutes(makeEvent(client,{'x-recast-request':'bad'}),e)).status,403);
 assert.equal((await e.ARTWORK.list({prefix:'analytics/site-v1/'})).objects.length,0);
});
test('Visitors, sessions, source and funnel events aggregate without storing individual browser IDs',async()=>{
 const e=env();
 for(const body of [
  client,{...client,type:'page_view',path:'credits'},
  {...client,type:'creator_started'},{...client,type:'photo_added'},
  {...client,type:'adventure_selected',adventure:'halloween'},
  {...client,type:'render_started'},{...client,type:'render_succeeded'},
  {...client,type:'product_preview'},{...client,type:'checkout_clicked'},
  friend,{...friend,type:'page_view',path:'credits'},
  {...friend,type:'credit_redeemed'}
 ]){
  const response=await trafficRoutes(makeEvent(body),e);
  assert.equal(response.status,202);assert.equal((await response.json()).recorded,true);
 }
 const d=await analyticsSummary(e,1);
 assert.equal(d.totals.visitors,2);assert.equal(d.totals.sessions,2);
 assert.equal(d.totals.pageViews,4);assert.equal(d.totals.creatorStarts,1);
 assert.equal(d.totals.photosAdded,1);assert.equal(d.totals.renderAttempts,1);
 assert.equal(d.totals.renderSuccesses,1);assert.equal(d.totals.productPreviews,1);
 assert.equal(d.totals.checkoutClicks,1);assert.equal(d.totals.redemptions,1);
 assert.equal(d.totals.adventuresPicked,1);
 assert.deepEqual(d.sources.map(x=>x.name).sort(),['direct','instagram']);
 assert.deepEqual(d.campaigns.map(x=>x.name),['halloween']);
 assert.equal(d.devices[0].name,'mobile');assert.equal(d.countries[0].name,'US');
 assert.equal(d.topPages.find(x=>x.name==='credits').count,3);
 const list=await e.ARTWORK.list({prefix:'analytics/site-v1/'});
 assert.ok(list.objects.length>=1);
 for(const item of list.objects){
  const raw=await (await e.ARTWORK.get(item.key)).text();
  assert.doesNotMatch(raw,/0123456789abcdef0123456789abcdef|fedcba9876543210fedcba9876543210|123456789abcdef0123456789abcdef0/);
  assert.doesNotMatch(raw,/https:\/\/|@|emailAddress|notesField|rawPhotoData|accessToken|requestId/);
 }
});
test('Approximate uniques merge across days without counting the same browser twice',async()=>{
 const e=env();await trafficRoutes(makeEvent(client),e);
 const existing=(await e.ARTWORK.list({prefix:'analytics/site-v1/'})).objects;
 assert.equal(existing.length,1);
 const obj=await e.ARTWORK.get(existing[0].key),snapshot=await obj.json();
 const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
 const shard=existing[0].key.split('/').at(-1);
 await e.ARTWORK.put('analytics/site-v1/'+yesterday+'/'+shard,JSON.stringify(snapshot));
 const d=await analyticsSummary(e,7);
 assert.equal(d.totals.visitors,1);
 assert.equal(d.totals.sessions,1);
 assert.equal(d.totals.pageViews,2,'each day's actual page views are still additive');
});
test('Do Not Track, GPC and recognizable bots never create analytics records',async()=>{
 const e=env();
 for(const headers of [
  {'dnt':'1'},
  {'sec-gpc':'1'},
  {'user-agent':'Googlebot/2.1'},
  {'user-agent':'Mozilla/5.0 HeadlessChrome/102.0'}
 ]){
  const response=await trafficRoutes(makeEvent(client,headers),e);
  assert.equal(response.status,202);assert.equal((await response.json()).recorded,false);
 }
 assert.equal((await e.ARTWORK.list({prefix:'analytics/site-v1/'})).objects.length,0);
});
test('Invalid, giant or data-bearing tracker payloads cannot poison metrics',async()=>{
 const e=env();
 for(const body of [
  {...client,type:'purchase_complete'},
  {...client,type:'visit',path:'order.html?token=secret'},
  {...client,type:'adventure_selected',adventure:'<script>alert(1)</script>'},
  {...client,type:'visit',campaign:'visit@customer.email'},
  {...client,visitorId:'test'},
  {...client,source:'http://untrusted.example/secret'}
 ]){
  const response=await trafficRoutes(makeEvent(body),e);
  assert.equal(response.status,400);
 }
 const large=new Request('https://recast.test/api/analytics/event',{method:'POST',
  headers:{'x-recast-request':'1','origin':'https://recast.test','content-type':'application/json'},
  body:JSON.stringify({...client,extra:'a'.repeat(1200)})});
 assert.equal((await trafficRoutes(large,e)).status,413);
 assert.equal((await e.ARTWORK.list({prefix:'analytics/site-v1/'})).objects.length,0);
});
test('Feature disabled is no-op and existing secured Router protects aggregate API',async()=>{
 const e=env();e.SITE_ANALYTICS_ENABLED='false';
 const off=await trafficRoutes(makeEvent(client),e);
 assert.equal(off.status,202);assert.equal((await off.json()).recorded,false);
 assert.equal((await e.ARTWORK.list({prefix:'analytics/site-v1/'})).objects.length,0);
 e.SITE_ANALYTICS_ENABLED='true';
 const response=await router.fetch(makeEvent(client),e,{});
 assert.equal(response.status,202);
 const unauthorized=await router.fetch(admin(7,'wrong'),e,{});
 assert.equal(unauthorized.status,401);
 const good=await router.fetch(admin(7),e,{});
 assert.equal(good.status,200);
 assert.equal((await good.json()).totals.visitors,1);
});
test('Privacy disclosure, opt-out, source categories and UI funnel instrumentation remain in release',()=>{
 const publicFile=name=>readFileSync(new URL('../public/'+name,import.meta.url),'utf8');
 const tracker=publicFile('analytics.js'),privacy=publicFile('privacy.html');
 assert.match(tracker,/globalPrivacyControl/);assert.match(tracker,/doNotTrack/);
 assert.match(tracker,/recast_analytics_opt_out/);
 assert.doesNotMatch(tracker,/location\.href|document\.cookie|sendBeacon|gtag|fbq\(/);
 assert.match(privacy,/Optional website analytics/);
 assert.match(privacy,/id="analytics-opt-out"/);
 assert.match(publicFile('index.html'),/analytics\.js\?v=1/);
 assert.match(publicFile('credits.html'),/analytics\.js\?v=1/);
 assert.match(publicFile('admin.html'),/data-panel="traffic"/);
 assert.match(publicFile('admin.js'),/initOwnerTraffic/);
 assert.match(publicFile('app.js'),/recastTrack\?\.\('render_succeeded'\)/);
 assert.match(publicFile('checkout.js'),/recastTrack\?\.\('checkout_clicked'\)/);
});
