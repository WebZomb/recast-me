import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {annualGiftEvents,upcomingGiftEvents,seasonalSpotlight,daysToEvent,eventDateLabel} from '../public/season-calendar.js';
const read=path=>fs.readFileSync(path,'utf8');

test('Halloween spotlight is selected automatically in October, with a real Halloween style deep link',()=>{
 const now=new Date(2026,9,13,12);
 const active=seasonalSpotlight(now);
 assert.equal(active.id,'halloween');
 assert.equal(active.theme,'halloween');
 assert.equal(active.style,'halloween');
 assert.equal(active.hero,'/assets/recast-halloween-hero-v163.webp');
 const first=upcomingGiftEvents(now,2);
 assert.deepEqual(first.map(x=>x.id),['halloween','thanksgiving']);
 assert.equal(eventDateLabel(first[0].date),'Oct 31');
 assert.equal(daysToEvent(first[0],now),18);
});
test('after Halloween the spotlight advances to Thanksgiving and then Christmas',()=>{
 const thanksgiving=seasonalSpotlight(new Date(2026,10,2,12));
 assert.equal(thanksgiving.id,'thanksgiving');
 assert.equal(thanksgiving.theme,'autumn');
 const christmas=seasonalSpotlight(new Date(2026,11,8,12));
 assert.equal(christmas.id,'christmas');
 assert.equal(christmas.theme,'winter');
 assert.equal(christmas.style,'christmas');
});
test('US Thanksgiving and movable Mothers and Fathers Days are calculated for each year',()=>{
 const events2026=annualGiftEvents(2026);
 const lookup=id=>events2026.find(x=>x.id===id).date.toISOString().slice(0,10);
 assert.equal(lookup('halloween'),'2026-10-31');
 assert.equal(lookup('thanksgiving'),'2026-11-26');
 assert.equal(lookup('black-friday'),'2026-11-27');
 assert.equal(lookup('cyber-monday'),'2026-11-30');
 assert.equal(lookup('christmas'),'2026-12-25');
 assert.equal(lookup('mothers-day'),'2026-05-10');
 assert.equal(lookup('fathers-day'),'2026-06-21');
 const next=annualGiftEvents(2027);
 assert.equal(next.find(x=>x.id==='thanksgiving').date.getDate(),25);
 assert.equal(next.find(x=>x.id==='mothers-day').date.getDate(),9);
});
test('seasonal page is indexable, themed to the bottom and honest about made-to-order shipping',()=>{
 const html=read('public/specials.html'),css=read('public/seasonal-specials-v163.css'),code=read('public/seasonal-specials-v163.js');
 assert.match(html,/Halloween Magic &amp; Seasonal Photo Gifts/);
 assert.match(html,/rel="canonical" href="https:\/\/recastmeai.com\/specials.html"/);
 assert.match(html,/data-season="halloween"/);
 assert.match(html,/id="season-hero-image"/);
 assert.match(html,/id="season-gift-image"/);
 assert.match(html,/id="season-card-one-image"/);
 assert.match(html,/id="season-secondary-image"/);
 assert.match(html,/id="upcoming-holidays"/);
 assert.match(html,/id="season-ending-title"/);
 assert.match(html,/Halloween is October 31/);
 assert.match(html,/check estimated delivery at checkout/);
 assert.match(html,/Shipping times vary|shipping times vary|holiday arrival is not guaranteed/i);
 assert.match(code,/upcomingGiftEvents\(now,6\)/);
 assert.match(css,/\.season-spooky-sky/);
 assert.match(css,/\.season-bats/);
 assert.match(css,/\.season-ending/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(html,/\$\d+ off|coupon|% OFF|guaranteed arrival|limited.*discount/i);
});
test('all illustrated holiday assets exist and are reasonably optimized',()=>{
 for(const name of ['recast-halloween-hero-v163.webp','recast-halloween-gifts-v163.webp',
                    'recast-halloween-ideas-v163.webp','recast-christmas-hero-v163.webp']){
   const a=fs.readFileSync('public/assets/'+name);
   assert.ok(a.length>100000&&a.length<700000,name+' size');
   assert.equal(a.subarray(0,4).toString(),'RIFF');
   assert.equal(a.subarray(8,12).toString(),'WEBP');
 }
 assert.match(read('public/assets/recast-season-bats-v163.svg'),/<svg/);
});
test('Specials tab is between My Orders and Guide on web without a second native tab bar',()=>{
 const nav=read('public/mobile-bottom-nav.js');
 const labels=["label:'Create'","label:'My Recasts'","label:'My Orders'","label:'Specials'","label:'Guide'"];
 const positions=labels.map(x=>nav.indexOf(x));
 assert.ok(positions.every(x=>x>=0));
 assert.ok(positions.every((x,i)=>i===0||x>positions[i-1]));
 assert.match(nav,/dock\.children\.length !== 5/);
 assert.match(nav,/if \(window\.webkit\?\.messageHandlers\?\.recastPreview\) return/);
 assert.match(read('public/mobile-bottom-nav.css'),/repeat\(5,minmax\(0,1fr\)\)/);
 for(const page of ['specials.html','index.html','my-recasts.html','my-orders.html','guide.html',
                    'gift-ideas.html','privacy.html','support.html','order.html','purchase-demo.html']){
   assert.match(read('public/'+page),/mobile-bottom-nav\.js\?v=163/,page);
 }
});
test('finished preview offers only compact Save and Share while extra tools live in My Recasts',()=>{
 const html=read('public/index.html'),app=read('public/app.js'),gallery=read('public/my-recasts.js');
 assert.equal((html.match(/id="save-native-preview"/g)||[]).length,1);
 assert.equal((html.match(/id="share-preview"/g)||[]).length,1);
 assert.match(html,/class="preview-quick-actions"/);
 assert.match(html,/id="preview-canvas"/);
 assert.doesNotMatch(html,/class="preview-more"|id="copy-recast-link"|id="artwork-manage-link"/);
 assert.match(app,/saveRecast\(/);
 assert.match(app,/messageHandlers\.recastPreview\.postMessage/);
 assert.match(gallery,/protectedPreviewFile\(item\)/);
 assert.match(gallery,/Share preview/);
 assert.match(gallery,/Copy private link/);
 assert.match(gallery,/Copy Artwork ID/);
 assert.match(gallery,/Artwork & privacy/);
 assert.match(gallery,/Use on a Product/);
 assert.doesNotMatch(gallery,/\/api\/render|\/api\/order-bonus|\/api\/checkout-link/);
});
