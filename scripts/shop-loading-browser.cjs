// Delayed/failed read-only catalog fixtures; no external commerce or providers.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public'),out=path.resolve('shop-loading-browser-results');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch(process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH}:{});
 try{for(const width of [320,393,1280])for(const pagePath of ['/shop.html','/shop-coaster-sets.html']){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let release,requests=0;let gate=new Promise(resolve=>release=resolve);
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   if(u.hostname!=='recast.test')return route.fulfill({status:204});
   if(p==='/api/shop/catalog'){requests++;await gate;return route.fulfill({status:requests===1?503:200,json:requests===1?{ok:false}:{ok:true,version:1,offers:[]}});}
   if(p==='/api/basket/status')return route.fulfill({json:{ok:true,enabled:false}});
   if(p.startsWith('/api/'))throw Error('Unexpected mutation '+p);
   let f=path.resolve(root,'.'+p);if(!path.extname(f))f+='.html';
   if(!f.startsWith(root+path.sep)||!fs.existsSync(f))return route.fulfill({status:404});
   const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
   return route.fulfill({contentType:mime[path.extname(f)]||'application/octet-stream',body:fs.readFileSync(f)});
  });
  await page.goto('https://recast.test'+pagePath);
  await page.waitForFunction(()=>document.querySelectorAll('.concept-product,.collection-card').length===35);
  assert.equal(requests,1);assert.equal(await page.locator('#shop-loading').isVisible(),true,'Browse cards render before the live response');
  assert.equal(await page.locator('#shop-loading progress').isVisible(),true);assert.equal(await page.locator('#shop-loading progress').getAttribute('value'),null,'No invented percentage');
  assert.equal(await page.getByRole('button',{name:'Add to cart',exact:true}).count(),0,'Pending catalog never enables purchase');
  if(pagePath.includes('coaster')){await page.locator('.collection-card').first().scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.collection-card img').naturalWidth>0);}
  await page.locator('#shop-loading').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${pagePath.includes('coaster')?'coasters':'mugs'}-${width}-loading.png`)});
  release();await page.getByRole('button',{name:'Try again',exact:true}).waitFor();
  assert.equal(await page.locator('.concept-product,.collection-card').count(),35,'A failed check keeps the gallery visible');
  gate=new Promise(resolve=>release=resolve);await page.getByRole('button',{name:'Try again',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#shop-loading').getAttribute('aria-busy')==='true');release();
  await page.locator('#shop-loading').waitFor({state:'hidden'});assert.equal(requests,2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);
  console.log('PASS immediate artwork, honest loading, failed check and safe manual retry',pagePath,width);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
