// Local-only browser fixtures: no provider tasks, no customer cart or payments.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const root=path.resolve('public'),gallery=JSON.parse(fs.readFileSync(path.join(root,'shop-gallery.json'),'utf8'));
 const engine=process.env.RECAST_BROWSER==='webkit'?'webkit':'chromium',browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{}:process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH}:{});
 const sample=fs.readFileSync(path.join(root,'shop-assets/christmas-golden-artwork.png'));
 const out=path.resolve('shop-category-browser-results');fs.mkdirSync(out,{recursive:true});
 try{
  for(const width of [320,393,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   let approved=false;
   await context.route('**/*',async route=>{
    const uri=new URL(route.request().url()),p=uri.pathname;
    if(uri.hostname==='cdn.shopify.com')return route.fulfill({status:200,contentType:'image/png',body:sample});
    if(uri.hostname!=='recast.test')return route.fulfill({status:204});
    let data={ok:true};
    if(p==='/api/shop/catalog'){
     const d=gallery.designs[0];
     const proof={provider:'printful',approved:true,artworkRevision:d.artworkRevision,printFileHash:'a'.repeat(64),placementHash:'b'.repeat(64)};
     const offer={id:'fixture-blanket',title:'Golden Retriever Christmas Blanket',product:'blanket',designId:d.designId,artworkRevision:d.artworkRevision,
      variantLabel:'50 × 60 in',pet:d.pet,breed:d.breed,currency:'USD',priceCents:7499,status:'verified',
      variantId:'gid://shopify/ProductVariant/fixture',proof,mockupUrl:'https://recast.test/shop-assets/christmas-golden-artwork.png'};
     data={ok:true,version:1,offers:approved?[offer]:[]};
    }else if(p==='/api/basket/status')data.enabled=true;
    else if(p==='/api/basket/session'){}
    else if(p==='/api/basket')data.basket={basketId:'test',revision:0,canEdit:true,appliedActions:[],currency:'USD',subtotalCents:0,lines:[],canCheckout:false};
    else if(p.startsWith('/api/'))return route.fulfill({json:{ok:false,error:'Fixture disables external commerce'}});
    else {
     let file=path.resolve(root,'.'+p);if(!path.extname(file))file+='.html';
     if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
     const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json'};
     return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
    }
    return route.fulfill({json:data});
   });
   await page.goto('https://recast.test/shop-blankets.html');
   await page.waitForFunction(()=>document.querySelectorAll('.collection-card').length===35);
   assert.equal(await page.locator('h1').innerText(),'Christmas Blankets');
   assert.equal(await page.locator('#collection-dog .collection-card').count(),22);
   assert.equal(await page.locator('#collection-cat .collection-card').count(),13);
   assert.equal(await page.locator('.collection-card[data-offer-status="verified"]').count(),0);
   assert.equal(await page.getByRole('button',{name:'Add to cart'}).count(),0,'No approved blanket = no add action');
   assert.equal(await page.locator('#collection-nav a').count(),16);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No horizontal layout overflow at '+width);
   await page.locator('.collection-card').first().getByRole('button',{name:'See artwork'}).click();
   assert.equal(await page.locator('#collection-detail').isVisible(),true);
   assert.equal(await page.locator('#collection-detail-add').isVisible(),false);
   assert.equal(await page.getByRole('button',{name:'Real Printful pending'}).isDisabled(),true);
   assert.equal(await page.locator('#collection-detail-concept .collection-preview').getAttribute('data-preview-size'),'50 × 60 in');
   const shortRatio=await page.locator('#collection-detail-concept .collection-artwork').evaluate(el=>Number.parseFloat(getComputedStyle(el).aspectRatio));
   assert.ok(Math.abs(shortRatio-5/6)<0.02,'The actual 50×60 blanket outline needs the right proportions');
   await page.getByRole('button',{name:'Layout 60 × 80 in'}).click();
   assert.equal(await page.locator('#collection-detail-concept .collection-preview').getAttribute('data-preview-size'),'60 × 80 in');
   const tallRatio=await page.locator('#collection-detail-concept .collection-artwork').evaluate(el=>Number.parseFloat(getComputedStyle(el).aspectRatio));
   assert.ok(Math.abs(tallRatio-3/4)<0.02,'The actual 60×80 blanket outline needs the right proportions');
   await page.getByRole('button',{name:'Original artwork'}).click();
   assert.equal(await page.locator('#collection-detail-image').isVisible(),true);
   assert.equal(await page.locator('#collection-detail-concept').isVisible(),false);
   assert.equal(await page.locator('#collection-detail-add').isVisible(),false);
   await page.locator('#close-collection-detail').click();
   await page.evaluate(()=>window.scrollTo(0,0));
   await page.screenshot({path:path.join(out,`${engine}-blankets-${width}.png`)});
   if(width===393){
    const additional=['pillows','canvas','tumblers','hoodies','t-shirts','tote-bags','phone-cases','sticker-sheets','posters','framed-prints','journals','coaster-sets','magnet-sets','puzzles'];
    for(const slug of additional){
     await page.goto('https://recast.test/shop-'+slug+'.html');
     await page.waitForFunction(()=>document.querySelectorAll('.collection-card').length===35);
     assert.equal(await page.locator('.collection-card-image > img').count(),35,'All '+slug+' cards show original artwork or verified photos');
     assert.equal(await page.locator('.collection-card-image .collection-preview').count(),0,'No CSS silhouette masquerades as a product card');
     assert.equal(await page.locator('.christmas-shop-switch a[href="/specials.html"]').count(),1,'Original Christmas collection remains accessible');
     assert.equal(await page.getByRole('button',{name:'Add to cart'}).count(),0,'Unapproved '+slug+' concepts cannot be purchased');
     if(['pillows','canvas'].includes(slug)){
      const card=page.locator('.collection-card').first();
      assert.match(await card.locator('img').getAttribute('src'),/golden-village-/);
      await card.getByRole('button',{name:'View gift'}).click();
      assert.equal(await page.getByRole('button',{name:'Sales illustration',exact:true}).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('#collection-detail-add').isVisible(),false);
      assert.match(await page.locator('#collection-detail-image').getAttribute('src'),/golden-village-/);
      await page.getByRole('button',{name:'Original artwork',exact:true}).click();
      assert.match(await page.locator('#collection-detail-image').getAttribute('src'),/cdn.shopify.com/);
      await page.locator('#close-collection-detail').click();
     }

     assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No '+slug+' phone overflow');
     if(['pillows','tumblers','hoodies','phone-cases'].includes(slug)){
      await page.locator('.collection-card').first().scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`${engine}-${slug}-393.png`)});
     }
    }
    await page.goto('https://recast.test/shop.html');
    await page.waitForFunction(()=>document.querySelectorAll('.concept-product').length===35);
    assert.equal(await page.locator('#product-nav a[href="/shop-blankets.html"]').count(),1);
    assert.equal(await page.locator('#product-nav a').count(),16);
    assert.equal(await page.locator('#product-nav a[href="/shop-stickers.html"]').count(),0,'Retired individual stickers must not be offered as a future collection');
   }
   approved=true;
   await page.goto('https://recast.test/shop-blankets.html');
   await page.waitForFunction(()=>document.querySelectorAll('.collection-card').length===35);
   assert.equal(await page.locator('.collection-card[data-offer-status="verified"]').count(),1,'Only exact approved design turns buyable');
   assert.equal(await page.locator('.collection-card[data-offer-status="preview"]').count(),34);
   assert.equal(await page.getByRole('button',{name:'Add to cart'}).count(),1);
   assert.equal(await page.locator('.collection-card[data-offer-status="verified"] .collection-price').innerText(),'$74.99');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   assert.deepEqual(errors,[]);
   console.log('PASS category browsing and supplier proof-only buyability',engine,width);
   await context.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
