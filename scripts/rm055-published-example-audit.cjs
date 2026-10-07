const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webkit,chromium}=require('playwright');
const base='https://recastmeai.com',out=path.resolve('rm055-published-example-audit');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const results=[];
 for(const [engine,width,height] of [[webkit,393,852],[chromium,1440,1000]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),blocked=[];
  await context.route('**/*',r=>['GET','HEAD','OPTIONS'].includes(r.request().method())?r.continue():(blocked.push(r.request().method()),r.abort()));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?rm055-review='+Date.now(),{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelectorAll('#product-grid .product[data-example-verified="true"]').length===7,{},{timeout:60000});
  const examples=await page.locator('#product-grid .product[data-example-verified="true"]').evaluateAll(rows=>rows.map(row=>({sku:row.dataset.exampleSku,image:row.querySelector('img').src,caption:row.querySelector('.example-design-label').textContent})));
  assert.equal(examples.length,7);assert.equal(new Set(examples.map(x=>x.image)).size,7);assert.equal(errors.length,0);assert.equal(blocked.length,0);
  await page.locator('#product-grid .product[data-example-sku="RECAST-HOODIE-S"]').scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,engine.name()+'-'+width+'-hoodie.png')});
  await page.locator('#product-grid .product[data-example-sku="RECAST-FRAME-12X16"]').scrollIntoViewIfNeeded();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,engine.name()+'-'+width+'-frame.png')});
  results.push({engine:engine.name(),width,examples,errors,blocked});await browser.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({at:new Date().toISOString(),readOnly:true,results},null,2));console.log('Seven exact supplier samples verified on WebKit and Chromium.');
})().catch(e=>{console.error(e);process.exitCode=1});
