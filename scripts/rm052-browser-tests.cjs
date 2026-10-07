/* Exact application DOM with intercepted providers. No photos, rendering, orders or checkout writes. */
const pw=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('public'),out=path.resolve('rm052-browser-results');fs.mkdirSync(out,{recursive:true});
const products=[['Poster','RECAST-POSTER-12X16'],['Canvas','RECAST-CANVAS-12X16'],['Blanket','RECAST-BLANKET-50X60'],['Mug','RECAST-MUG-11OZ'],['Hoodie','RECAST-HOODIE-S'],['Framed Poster','RECAST-FRAMED-12X16'],['T-Shirt','RECAST-TSHIRT-S'],['Tumbler','RECAST-TUMBLER-20OZ'],['Magnet 3-Pack','RECAST-MAGNET-3PK'],['Coaster 4-Pack','RECAST-COASTER-4PK']];
const assets=['poster','canvas','blanket','mug','hoodie','desk-frame','tshirt','tumbler','magnet','coaster'];
const local=Boolean(process.env.PLAYWRIGHT_EXECUTABLE);
const scenarios=local?[[pw.chromium,320],[pw.chromium,393],[pw.chromium,1440]]:[[pw.webkit,393],[pw.chromium,320],[pw.chromium,1440]];
(async()=>{
 const report={mocked:true,liveProvidersTested:false,checks:[],failures:[]};
 for(const [engine,width] of scenarios){
  const browser=await engine.launch(local?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE,args:['--no-sandbox']}:{});
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const writes=[],errors=[],designs={};
  await context.route('**/*',async route=>{
   const r=route.request(),u=new URL(r.url()),p=u.pathname;
   if(u.hostname!=='recast.test'){if(r.resourceType()==='image')return route.fulfill({body:fs.readFileSync(path.join(root,'assets/world-game-v18.webp')),contentType:'image/webp'});return route.abort();}
   if(p.startsWith('/api/mockup/image/')){
    const sku=p.split('/')[4],index=products.findIndex(x=>x[1]===sku);
    return route.fulfill({body:fs.readFileSync(path.join(root,`assets/product-${assets[index>=0?index:0]}-v16.webp`)),contentType:'image/webp'});
   }
   if(!p.startsWith('/api/')){
    const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'missing'});
    return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});
   }
   let data={ok:true};
   if(p==='/api/render-credits')data={ok:true,enabled:true,initialized:true,remaining:3,free:3,bonus:0,standardRemaining:5};
   else if(p==='/api/render-readiness')data={ok:true,local:{ready:true},modes:{high:{ready:true,state:'ready'},quick:{ready:true,state:'ready'}}};
   else if(p==='/api/model-status')data={ok:true,modes:{high:{label:'High Quality',model:'fixture'},quick:{label:'Standard',model:'fixture'}}};
   else if(p.endsWith('/preview'))data={ok:true,watermarked:true,image:'data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/world-game-v18.webp')).toString('base64')};
   else if(p==='/api/checkout-options')data={ok:true,products:products.map(([name,sku])=>({title:'Custom Recast '+name,status:'ACTIVE',variants:[{sku,variantTitle:name==='Hoodie'||name==='T-Shirt'?'S':'12×16',price:'29.99'},{sku:sku+'-ALT',variantTitle:name==='Hoodie'||name==='T-Shirt'?'M':'16×20',price:'39.99'}]}))};
   else if(p==='/api/mockup/create'){
    const body=r.postDataJSON();writes.push({path:p,...body});designs[body.sku]=body.design;
    data={ok:true,mockupId:'fixture-'+body.sku,status:'pending'};
   }else if(p==='/api/mockup/status'){
    const sku=u.searchParams.get('sku'),apparel=['Hoodie','T-Shirt'].includes(designs[sku]?.product);
    data={ok:true,status:'completed',images:[{title:'Front',url:`http://recast.test/api/mockup/image/${sku}/front`,group:'Flat'},...(!apparel?[{title:'Room',url:`http://recast.test/api/mockup/image/${sku}/room`,group:'Lifestyle'}]:[])]};
   }else if(r.method()!=='GET'&&p!=='/api/render-credits'){errors.push('Unexpected write '+p);return route.abort()}
   return route.fulfill({json:data});
  });
  if(!local)await context.addInitScript(()=>{
   localStorage.setItem('recast_last_request',JSON.stringify({requestId:'RC-TEST0001-ABCDEF',accessToken:'fixture-token'}));
   const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms>=2500?1:ms,...args);
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
  try{
   if(local){
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head><base href="http://recast.test/">').replace(/<script[^>]*>[\s\S]*?<\/script>/g,'');
    await page.setContent(html,{waitUntil:'networkidle'});
    await page.evaluate(()=>{
      window.__recastActiveRequest={requestId:'RC-TEST0001-ABCDEF',accessToken:'fixture-token'};
      document.querySelector('#request-id').textContent='Artwork ID: RC-TEST0001-ABCDEF';
      const URLClass=window.URL;window.URL=class extends URLClass{constructor(input,base){super(input,base==='null'?'http://recast.test':base)}};
      const originalFetch=window.fetch;window.fetch=(url,options)=>originalFetch(new URL(url,'http://recast.test').href,options);
      const original=window.setTimeout;window.setTimeout=(fn,ms,...args)=>original(fn,ms>=2500?1:ms,...args);
    });
    await page.addScriptTag({content:fs.readFileSync(path.join(root,'checkout.js'),'utf8')});
   }else await page.goto('http://recast.test/',{waitUntil:'networkidle'});
   await page.locator('#product-grid.checkout-catalog .product').last().waitFor();
   assert.equal(await page.locator('#product-grid .product').count(),10);
   assert.equal(await page.locator('.product-design-controls[open]').count(),0);
   const poster=page.locator('[data-product-title="Custom Recast Poster"]'),hoodie=page.locator('[data-product-title="Custom Recast Hoodie"]');
   for(const card of [poster,hoodie]){
    await card.locator('.product-preview-action').click();await card.locator('.recast-buy').waitFor({state:'visible'});
   }
   assert.equal(writes.find(w=>w.sku==='RECAST-HOODIE-S').design.finish,'soft');
   assert.equal(await poster.locator('.mockup-view-chip[aria-pressed="true"]').textContent(),'Front');
   assert.equal(await hoodie.locator('.product-preview-action').evaluate(e=>e.getBoundingClientRect().width<e.parentElement.getBoundingClientRect().width*.75),true,'compact ready badge');
   await hoodie.locator('.recast-buy').click();await page.locator('.recast-final-review').waitFor();assert.match(await page.locator('.final-review-summary').textContent(),/transparent dot fade/);await page.locator('.final-review-x').click();
   await hoodie.locator('.product-design-controls summary').click();await hoodie.locator('[data-design-finish]').selectOption('rectangle');
   assert.equal(await hoodie.locator('.recast-buy').isHidden(),true,'new finish invalidates reviewed proof');
   assert.equal(await hoodie.locator('[data-design-layout]').isHidden(),true);
   assert.equal(await hoodie.locator('[data-design-scale]').getAttribute('max'),'100');
   await hoodie.locator('.product-preview-action').click();await hoodie.locator('.recast-buy').waitFor({state:'visible'});
   assert.equal(writes.at(-1).design.finish,'rectangle');
   await hoodie.locator('[data-reset-design]').click();assert.equal(await hoodie.locator('.recast-buy').isHidden(),true);assert.equal(await hoodie.locator('[data-design-finish]').inputValue(),'soft');
   for(const card of await page.locator('#product-grid .product').all()){
     await card.scrollIntoViewIfNeeded();
     await card.locator('.product-art img').evaluate(img=>img.complete?Promise.resolve():new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('fixture image failed'));}));
     assert.ok(await card.locator('.product-art img').evaluate(img=>img.naturalWidth>0));
   }
   const metrics=await page.locator('#product-grid .product').evaluateAll(cards=>cards.map(card=>{const box=card.querySelector('.product-art'),img=box.querySelector('img'),b=box.getBoundingClientRect(),i=img.getBoundingClientRect(),css=getComputedStyle(img);return {title:card.dataset.productTitle,box:{x:b.x,y:b.y,w:b.width,h:b.height},image:{x:i.x,y:i.y,w:i.width,h:i.height},fit:css.objectFit,transform:css.transform}}));
   for(const m of metrics){assert.equal(m.fit,'contain');assert.equal(m.transform,'none');assert.ok(m.image.y>=m.box.y-1&&m.image.y+m.image.h<=m.box.y+m.box.h+1,m.title+' clipped');assert.ok(m.image.x>=m.box.x-1&&m.image.x+m.image.w<=m.box.x+m.box.w+1,m.title+' too wide')}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow');
   await poster.screenshot({path:path.join(out,`${engine.name()}-${width}-poster.png`)});await hoodie.screenshot({path:path.join(out,`${engine.name()}-${width}-hoodie.png`)});
   assert.deepEqual(errors,[]);assert.ok(writes.every(w=>w.path==='/api/mockup/create'));
   report.checks.push({engine:engine.name(),width,cards:metrics,sceneBlendDefault:true,softFinishInvalidates:true,productCloseupDefault:true,exactProofGates:true,writes:writes.length,errors});
  }catch(e){report.failures.push({engine:engine.name(),width,error:e.stack,errors});await page.screenshot({path:path.join(out,`${engine.name()}-${width}-failure.png`),fullPage:true}).catch(()=>{})}
  await browser.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
