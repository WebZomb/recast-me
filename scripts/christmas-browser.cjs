const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public'),out=path.resolve('rm050-browser-results/christmas');fs.mkdirSync(out,{recursive:true});
 const {seasonalProducts}=await import('../public/seasonal-products.js');
 const products={ok:true,products:seasonalProducts.map(p=>({name:p.name==='Tough Phone Case'?'Phone Case':p.name,price:Number(p.price.match(/[\d.]+/)[0]),sku:'RECAST-'+p.name.replace(/[^A-Z]/gi,'').toUpperCase()}))};
 const executable=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(x=>fs.existsSync(x));
 const engine=process.env.RECAST_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{headless:true}:{headless:true,executablePath:executable});
 try{
  for(const width of [320,393,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});
   const page=await context.newPage();let activeChristmasOffer=false;
   await page.addInitScript(()=>{const OriginalDate=Date;const timestamp=Date.UTC(2026,9,30,17);window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[timestamp]));}static now(){return timestamp;}};});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://recastmeai.com/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==='/api/seasonal-campaign')return route.fulfill({json:activeChristmasOffer?
     {ok:true,active:{id:'christmas',title:'Christmas',date:'2026-12-25',style:'christmas'},offer:{id:'christmas',name:'Christmas',style:'christmas',percent:10,terms:'Eligible Christmas artwork only.'},checkoutReady:true}:
     {ok:true,active:{id:'halloween',title:'Halloween',date:'2026-10-31',style:'halloween'},offer:{id:'halloween',name:'Halloween',percent:10},checkoutReady:true}});
    if(u.pathname==='/api/seasonal-products')return route.fulfill({json:products});
    if(u.pathname==='/api/basket/status')return route.fulfill({json:{ok:true,enabled:true}});
    if(u.pathname==='/api/basket')return route.fulfill({json:{ok:true,basket:{revision:0,lines:[],canEdit:true}}});
    if(u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});
    let file=path.join(root,u.pathname==='/'?'index.html':u.pathname.replace(/^\//,''));
    if(!path.extname(file))file+='.html';
    if(!file.startsWith(root)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
    return route.fulfill({body:fs.readFileSync(file),contentType:type});
   });
   await page.route('**/*cloudflareinsights*',r=>r.abort());
   for(const name of ['specials','christmas-gifts']){
    await page.goto('https://recastmeai.com/'+name+'.html',{waitUntil:'networkidle',timeout:60000});
    await page.waitForFunction(()=>document.querySelectorAll('.season-shop-card').length===18);
    assert.match(await page.locator('#season-title').innerText(),/Christmas/);
    assert.match(await page.locator('#season-primary-cta').getAttribute('href'),/style=christmas/);
    assert.equal(await page.locator('.season-shop-card-christmas').count(),16);
    assert.equal(await page.locator('.season-shop-card').count(),18);
    assert.equal(await page.locator('.season-shop-card').last().locator('h3').innerText(),'Recast Pack');
    assert.equal(await page.locator('.season-shop-card').last().locator('.season-shop-sale').count(),0);
    assert.equal(await page.locator('.season-shop-card h3').first().innerText(),'Mug');
    assert.equal(await page.locator('.season-shop-card[data-christmas-product="poster"]').count(),1);
    assert.equal(await page.locator('[data-season-offer]:visible').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width+' '+name);
    assert.equal(await page.locator('#season-hero-image').evaluate(x=>x.complete&&x.naturalWidth>0),true);
    await page.locator('.basket-launcher').waitFor();
    if(width<=760){
      const brand=await page.locator('.site-header .brand').boundingBox(),cart=await page.locator('.basket-launcher').boundingBox();
      assert.ok(brand.x+brand.width<=cart.x,'Brand and cart must not overlap');
      assert.ok(cart.height>=44,'Cart touch target');
      assert.equal(await page.locator('.site-header .nav-cta').isVisible(),false);
    }
    await page.screenshot({path:path.join(out,engine+'-'+name+'-header-'+width+'.png')});
    const poster=page.locator('.season-shop-card[data-christmas-product="poster"]');
    await poster.scrollIntoViewIfNeeded();
    await poster.locator('.season-christmas-product-image').evaluate(x=>x.decode());
    assert.equal(await poster.locator('.season-christmas-product-image').evaluate(x=>x.complete&&x.naturalWidth>0),true);
    assert.match(await poster.locator('.season-christmas-product-image').getAttribute('alt'),/Illustrative Christmas/);
    assert.match(await poster.locator('.season-christmas-product-image').getAttribute('alt'),/Christmas Poster design/);
    for(const product of ['mug','pillow','puzzle','blanket','poster','hoodie','frame','canvas','tshirt','tumbler','sticker','case','journal','tote','magnet','coaster']){
      const image=page.locator('.season-christmas-product-image[src="/assets/christmas-'+product+'-20261101.webp"]');
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(img=>img.decode());
      assert.match(await image.getAttribute('src'),new RegExp('christmas-'+product+'-20261101'));
    }
    const posterHref=await poster.locator('.season-shop-body a').getAttribute('href'),url=new URL(posterHref,'https://recastmeai.com');
    assert.equal(url.searchParams.get('style'),'christmas');
    assert.equal(url.searchParams.get('gift'),'RECAST-POSTER');
    assert.equal(url.searchParams.get('utm_campaign'),'christmas_2026');
    assert.equal(url.hash,'#start');
    assert.match(await page.title(),/Christmas/);
    await poster.screenshot({path:path.join(out,engine+'-'+name+'-'+width+'.png')});
    console.log('PASS',name,width,'Christmas cards');
   }
   if(width===393){
    activeChristmasOffer=true;
    await page.goto('https://recastmeai.com/christmas-gifts.html',{waitUntil:'networkidle',timeout:60000});
    await page.waitForFunction(()=>document.querySelectorAll('.season-shop-card').length===18);
    assert.equal(await page.locator('.season-shop-sale').count(),16);
    assert.equal(await page.locator('.season-shop-card-christmas').count(),16);
    assert.equal(await page.locator('.season-shop-card').count(),18);
    const mug=page.locator('.season-shop-card[data-christmas-product="mug"]');
    assert.match(await mug.locator('.season-shop-price').innerText(),/\$22\.49/);
    assert.match(await mug.locator('.season-shop-price').innerText(),/Christmas-style artwork only/);
    assert.match(await page.locator('#season-shop-status').innerText(),/not unchanged original photos/);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Christmas sale overflow');
    assert.deepEqual(errors,[]);
    console.log('PASS',engine,'live Christmas sale price, transparent eligibility and mobile layout');
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
