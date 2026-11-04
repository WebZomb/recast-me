// Entirely mocked product-review panel. NO live admin secrets, provider requests,
// purchases, customer data or print approvals are accessed.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const engine=process.env.RECAST_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{}:process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH}:{});
 const root=path.resolve('public');
 const gallery=JSON.parse(fs.readFileSync(path.join(root,'shop-gallery.json'),'utf8'));
 const d=gallery.designs[0];
 const picture='https://recast.test/api/mockup/image/RC-SHOP-GOLDEN-RETRIEVER-V1/RECAST-STICKER-PACK/0?token=protected-fixture-only';
 const html=`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
 <link rel="stylesheet" href="/admin-sticker-sheet-qa.css?v=1">
 <h2>Ready-Made QA</h2><p id="sticker-sheet-proof-status"></p>
 <button id="sticker-sheet-proof-refresh">Refresh sticker sheet proof</button>
 <div id="sticker-sheet-proof-grid" class="sticker-sheet-proof-grid"></div>
 <script type="module">
 import {initStickerSheetReview} from '/admin-sticker-sheet-qa.js?v=1';
 window.denied=false; window.requests=[];
 const api=async path=>{
  window.requests.push(path);
  if(path==='/api/shop/sticker-sheet-pilot')return {ok:true,status:'ready_for_review',providerViewCount:2};
  if(path==='/api/shop/sticker-sheet-pilot/qa'){
   if(window.denied)throw new Error('Owner authorization required.');
   return {ok:true,designId:${JSON.stringify(d.designId)},artworkRevision:${JSON.stringify(d.artworkRevision)},checkoutEnabled:false,
    supplierPictures:[{title:'Supplier real front',url:${JSON.stringify(picture)}},{title:'Untrusted',url:'https://untrusted.example/preview?token=no'}]};
  }
  throw Error('Unexpected API '+path);
 };
 window.qa=initStickerSheetReview(api);
 await window.qa.load();
 window.ready=true;
 </script>`;
 const img=fs.readFileSync(path.resolve(root,'shop-assets/christmas-golden-artwork.png'));
 try{
  for(const width of [393,1280]){
   const ctx=await browser.newContext({viewport:{width,height:850}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await ctx.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='cdn.shopify.com')return route.fulfill({status:200,contentType:'image/png',body:img});
    if(url.hostname!=='recast.test')return route.fulfill({status:404});
    if(url.pathname==='/sticker-sheet-test.html')return route.fulfill({contentType:'text/html',body:html});
    if(url.pathname==='/shop-gallery.json')return route.fulfill({json:gallery});
    if(url.pathname==='/api/mockup/image/RC-SHOP-GOLDEN-RETRIEVER-V1/RECAST-STICKER-PACK/0')return route.fulfill({status:200,contentType:'image/png',body:img});
    const file=path.resolve(root,'.'+url.pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
    return route.fulfill({contentType:url.pathname.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync(file)});
   });
   await page.goto('https://recast.test/sticker-sheet-test.html');
   await page.waitForFunction(()=>window.ready);
   assert.equal(await page.locator('#sticker-sheet-proof-grid figure').count(),2,'Original image and one approved same-origin supplier image only');
   assert.match(await page.locator('#sticker-sheet-proof-status').innerText(),/1 real Printful sticker sheet views received/);
   assert.equal(await page.locator('button').count(),1,'Read-only QA cannot approve products or submit an order');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.locator('#sticker-sheet-proof-refresh').click();
   await page.waitForFunction(()=>document.querySelectorAll('#sticker-sheet-proof-grid figure').length===2);
   await page.evaluate(()=>window.qa.clear());
   assert.equal(await page.locator('#sticker-sheet-proof-grid figure').count(),0,'Locked owner tab clears signed supplier proof URLs');
   await page.evaluate(()=>{window.denied=true;return window.qa.load()});
   assert.match(await page.locator('#sticker-sheet-proof-status').innerText(),/Owner authorization required/);
   assert.equal(await page.locator('#sticker-sheet-proof-grid img').count(),0);
   assert.deepEqual(errors,[]);
   console.log('PASS owner sticker sheet supplier images, origin filtering, session lock',engine,width);
   await ctx.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
