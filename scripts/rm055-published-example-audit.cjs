const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit,chromium}=require('playwright');
const base='https://recastmeai.com',out=path.resolve('rm055-published-example-audit');
const results=[];
const report=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({at:new Date().toISOString(),readOnly:true,results},null,2));
// An assertion must not leave a browser child alive and stall a release audit.
const watchdog=setTimeout(()=>{console.error('Read-only example audit exceeded 150 seconds.');process.exit(1)},150000);watchdog.unref();
(async()=>{
 fs.mkdirSync(out,{recursive:true});let failed=false;
 for(const [engine,width,height] of [[webkit,393,852],[chromium,1440,1000]]){
  const browser=await engine.launch({timeout:30000});let page;
  const record={engine:engine.name(),width,examples:[],errors:[],blocked:[]};results.push(record);
  try{
   const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
   await context.route('**/*',r=>['GET','HEAD','OPTIONS'].includes(r.request().method())?r.continue():(record.blocked.push(r.request().method()),r.abort()));
   page=await context.newPage();page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(30000);
   page.on('pageerror',e=>record.errors.push(e.message));
   page.on('response',r=>{if(r.url().includes('/catalog-examples.json'))record.manifestStatus=r.status()});
   await page.goto(base+'/?rm055-review='+Date.now(),{waitUntil:'networkidle'});
   await page.waitForFunction(()=>document.querySelectorAll('#product-grid .product').length===18,{},{timeout:20000});
   record.examples=await page.locator('#product-grid .product').evaluateAll(rows=>rows.map(row=>({sku:row.dataset.exampleSku,image:row.querySelector('img').src,caption:row.querySelector('.example-design-label')?.textContent||'',verified:row.dataset.exampleVerified||false})));
   assert.equal(record.examples.length,18);assert.equal(new Set(record.examples.map(x=>x.image)).size,18);assert.equal(record.errors.length,0);
   for(const row of record.examples.filter(x=>x.sku)){assert.equal(row.verified,false);assert.match(row.caption,/Style illustration/);}
   for(const [sku,label] of [['RECAST-HOODIE-S','hoodie'],['RECAST-FRAME-12X16','frame']]){
    const card=page.locator('#product-grid .product[data-example-sku="'+sku+'"]');
    await card.scrollIntoViewIfNeeded({timeout:8000});
    // WebKit can abort decode while a lazy image switches from placeholder to src.
    // Assert loaded pixels on the current element instead of treating that race as a broken image.
    await page.waitForFunction(sku=>{const img=document.querySelector('#product-grid .product[data-example-sku="'+sku+'"] img');return img?.complete&&img.naturalWidth>0},sku,{timeout:12000});
    await page.screenshot({path:path.join(out,engine.name()+'-'+width+'-'+label+'.png'),timeout:10000});
   }
  }catch(e){
   failed=true;record.error=e.message;
   if(page){
    record.diagnostic=await page.evaluate(()=>({scripts:[...document.scripts].map(n=>n.src),build:document.body.dataset.launchBuild,examples:[...document.querySelectorAll('#product-grid .product')].map(n=>({sku:n.dataset.exampleSku,verified:n.dataset.exampleVerified,caption:n.querySelector('.example-design-label')?.textContent,image:n.querySelector('img')?.getAttribute('src'),display:getComputedStyle(n).display}))})).catch(()=>null);
    await page.screenshot({path:path.join(out,engine.name()+'-'+width+'-failure.png'),timeout:5000}).catch(()=>{});
   }
   console.error(engine.name()+': '+e.message);
  }finally{await browser.close();report()}
 }
 clearTimeout(watchdog);
 if(failed)process.exitCode=1;else console.log('Eighteen curated product illustrations verified on WebKit and Chromium; personalized supplier proofs remain a separate check.');
})().catch(e=>{console.error(e);if(fs.existsSync(out))report();process.exit(1)});
