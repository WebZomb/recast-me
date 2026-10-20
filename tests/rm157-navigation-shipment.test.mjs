import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {publicShipmentTracking} from '../src/shipment-tracking.js';
const read=path=>fs.readFileSync(path,'utf8');

test('in-production Printful placeholder must not show a broken carrier tracking link',()=>{
 const job={status:'in_printful_production',trackingNumber:'9400111206213999999999',
   trackingUrl:'https://myorders.co/placeholder',carrier:'Printful'};
 const result=publicShipmentTracking(job);
 assert.equal(result.trackingReady,false);
 assert.equal(result.trackingUrl,null);
 assert.equal(result.trackingNumber,null);
});
test('genuine shipped and partly shipped orders have carrier tracking only with a valid number',()=>{
 for(const status of ['shipped','partially_shipped']){
  const valid=publicShipmentTracking({status,trackingNumber:'9400111206213999999999',
   trackingUrl:'https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111206213999999999',
   carrier:'USPS'});
  assert.equal(valid.trackingReady,true);
  assert.equal(valid.trackingNumber,'9400111206213999999999');
  assert.match(valid.trackingUrl,/^https:\/\/tools\.usps\.com\//);
 }
 assert.equal(publicShipmentTracking({status:'shipped',trackingUrl:'https://tracking.usps.com/x'}).trackingReady,false);
});
test('shipment tracker rejects unsafe, non-web and non-shipment tracking references',()=>{
 const urls=['http://carrier.com/track','javascript:alert(1)',
  'https://user:secret@carrier.com/path','https://127.0.0.1/track','https://192.168.1.4/track',
  'https://localhost/track','https://carrier.local/track','not-a-url'];
 for(const url of urls){
  const result=publicShipmentTracking({status:'shipped',trackingNumber:'1234567890123',trackingUrl:url});
  assert.equal(result.trackingReady,false,'bad link '+url);
  assert.equal(result.trackingUrl,null);
 }
});
test('customer API, order list and order details jointly refuse premature tracking links',()=>{
 const backend=read('src/workflow.js'),orders=read('public/my-orders.js'),detail=read('public/order.js');
 assert.match(backend,/requireRequest\(env,requestId,token\)/);
 assert.match(backend,/\.\.\.publicShipmentTracking\(j\)/);
 assert.match(orders,/job\.trackingReady === true/);
 assert.match(orders,/\['shipped','partially_shipped'\]/);
 assert.match(orders,/Carrier tracking will appear here after your item ships/);
 assert.match(detail,/j\.trackingReady===true/);
 assert.match(detail,/Tracking will appear after your order ships/);
});
test('four website destinations are accessible while the native app retains its own tabs',()=>{
 const nav=read('public/mobile-bottom-nav.js'),html=read('public/index.html');
 const labels=['Create','My Recasts','My Orders','Specials','Community'];
 for(const label of labels)assert.match(nav,new RegExp("label:'"+label+"'"));
 assert.match(nav,/window\.webkit\?\.messageHandlers\?\.recastPreview/);
 assert.doesNotMatch(nav,/recast-legacy-orders-pill/);
 for(const page of ['index.html','my-orders.html','my-recasts.html','order.html','purchase-demo.html']){
  assert.match(read('public/'+page),/mobile-bottom-nav\.js\?v=165/,page);
 }
 assert.ok(!html.includes('View saved Recasts (up to 20)'));
 assert.doesNotMatch(html,/class="preview-more"/);
 assert.match(html,/id="save-native-preview"/);
 assert.match(html,/id="share-preview"/);
 assert.match(html,/class="preview-quick-actions"/);
 assert.match(html,/href="#shop">Put It on a Product/);
});
test('verified celebration is larger, accessible and the demo remains no-charge',()=>{
 const css=read('public/order-experience.css'),demo=read('public/purchase-demo.html'),
  experience=read('public/order-experience.js'),
  grand=read('public/grand-celebration.js'),
  grandCSS=read('public/grand-celebration.css');
 assert.match(css,/width:min\(100%,560px\)/);
 assert.match(css,/min-height:min\(690px/);
 assert.match(css,/\.celebration-close\{position:absolute/);
 assert.match(experience,/showGrandCelebration/);
 assert.match(grand,/for\(let i=0;i<44;i\+\+\)/);
 assert.match(grand,/aria-modal="true"/);
 assert.match(grand,/rg-replay/);
 assert.match(grandCSS,/prefers-reduced-motion:reduce/);
 assert.match(demo,/NO PURCHASE · NO REAL CREDITS/);
 assert.match(demo,/min-height:min\(690px/);
 assert.doesNotMatch(demo,/\/api\/checkout-link|\/api\/order-bonus/);
});
