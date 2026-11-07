// Fully mocked owner UI. No live credentials, supplier requests or purchases.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{
 const engine=process.env.RECAST_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{}:process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH}:{});
 const {EXPANSION_DESIGNS}=await import('../src/shop-expansion.js');
 const {giftsForArtwork,GIFT_COLLECTION_PATHS}=await import('../src/shop-gift-definitions.js');
 const sources=EXPANSION_DESIGNS.slice(0,3),root=path.resolve('public');
 const image=fs.readFileSync(path.join(root,'shop-assets/christmas-golden-artwork.png'));
 const digest=crypto.createHash('sha256').update(image).digest('hex');
 const out=path.resolve('gift-batch-browser-results');fs.mkdirSync(out,{recursive:true});
 try{for(const width of [320,393,1280]){
  const context=await browser.newContext({viewport:{width,height:852}}),page=await context.newPage();
  const errors=[],published=new Set(giftsForArtwork(sources[0].id).map(x=>x.id));let posts=0,leakedAuth=0;
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(()=>sessionStorage.setItem('recast_admin_token','fixture-owner-session'));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),p=url.pathname;
   // WebKit routes locally created blob images through this test interceptor.
   // Let the browser decode its own native file; it is not a network resource.
   if(url.protocol==='blob:')return route.continue();
   if(url.hostname==='cdn.shopify.com'){
    if(request.headers().authorization)leakedAuth++;
    return route.fulfill({contentType:'image/png',body:image});
   }
   if(url.hostname!=='recast.test')return route.fulfill({status:404});
   if(p.startsWith('/api/mockup/image/')){
    if(request.headers().authorization)leakedAuth++;
    return route.fulfill({contentType:'image/png',body:image});
   }
   if(p==='/api/shop/gift-batch')return route.fulfill({json:{ok:true,totalProducts:106,published:published.size,readyForReview:6,needsReview:0,designs:sources.map(source=>({id:source.id,title:source.breed+' Christmas Village',items:giftsForArtwork(source.id).map(item=>({id:item.id,checkoutEnabled:published.has(item.id),printFileReady:true}))}))}});
   if(p==='/api/shop/small-gift-review'){
    assert.equal(request.headers().authorization,'Bearer fixture-owner-session');
    const source=sources.find(s=>s.id===(url.searchParams.get('design')||sources[0].id));
    if(!source)return route.fulfill({status:404,json:{ok:false}});
    const items=giftsForArtwork(source.id).map(item=>({...item,status:published.has(item.id)?'published':'ready_for_review',storePath:GIFT_COLLECTION_PATHS[item.product],checkoutEnabled:published.has(item.id),priceCents:2499,reviewSignature:'c'.repeat(64),printFileHash:digest,sourceRevision:source.sha256,mime:'image/png',printSize:{width:item.width,height:item.height},cleanPrintUrl:'/api/shop/small-gift-review/'+item.id+'/print',supplierPictures:[0,1].map(index=>({title:'Supplier fixture '+index,url:'https://recast.test/api/mockup/image/'+source.requestId+'/'+item.sku+'/'+index+'?token=fixture-only'}))}));
    return route.fulfill({json:{ok:true,readOnly:true,sourceDesign:source.id,sourceRequestId:source.requestId,originalArtwork:source.asset,items}});
   }
   if(/^\/api\/shop\/small-gift-review\/[a-z0-9-]+\/print$/.test(p)){
    assert.equal(request.headers().authorization,'Bearer fixture-owner-session');
    return route.fulfill({contentType:'image/png',body:image});
   }
   if(p==='/api/admin/small-gifts/publish'){
    assert.equal(request.method(),'POST');assert.equal(request.headers().authorization,'Bearer fixture-owner-session');
    const input=request.postDataJSON(),source=sources[1],item=giftsForArtwork(source.id)[0];
    assert.equal(input.id,item.id);assert.equal(input.sourceRevision,source.sha256);assert.equal(input.printFileHash,digest);assert.equal(input.confirm,'PUBLISH_THIS_REVIEWED_PRINT_FILE');
    posts++;published.add(item.id);return route.fulfill({json:{ok:true,id:item.id,published:true,storePath:GIFT_COLLECTION_PATHS[item.product],paymentCreated:false,productionSubmitted:false}});
   }
   const file=path.resolve(root,'.'+(p==='/admin-small-gifts'?'/admin-small-gifts.html':p));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
   return route.fulfill({contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync(file)});
  });
  await page.goto('https://recast.test/admin-small-gifts');
  await page.waitForFunction(()=>document.querySelector('#review-status').textContent.startsWith('4 native'));
  assert.equal(await page.locator('.gift-review').count(),4);assert.equal(posts,0);
  assert.equal(await page.locator('.gift-review').last().getByRole('link',{name:'View this product collection'}).getAttribute('href'),'/shop-stickers');
  await page.locator('#gift-design-select').selectOption(sources[1].id);
  await page.waitForFunction(id=>document.querySelector('.gift-review')?.dataset.giftId.startsWith(id),sources[1].id);
  await page.waitForFunction(()=>document.querySelectorAll('.publication-review-check input:not(:disabled)').length===3);
  const first=page.locator('.gift-review').first();
  assert.match(await first.locator('h2').innerText(),/Labrador/);
  assert.equal(await first.getByRole('button',{name:'Publish reviewed design'}).isDisabled(),true);
  assert.equal(await page.locator('#original-source img').getAttribute('src'),sources[1].asset);
  const picturePaths=await first.locator('.review-grid img').evaluateAll(imgs=>imgs.map(i=>i.getAttribute('src')));
  assert.ok(picturePaths.slice(0,2).every(u=>u.includes(sources[1].requestId)));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:path.join(out,engine+'-breed-review-'+width+'.png')});
  await first.getByRole('checkbox').check();
  page.once('dialog',async dialog=>{assert.match(dialog.message(),/Publish Labrador Retriever Christmas Village Coaster Set/);await dialog.accept();});
  await first.getByRole('button',{name:'Publish reviewed design'}).click();
  await page.waitForFunction(()=>document.querySelector('.gift-review .availability').textContent.includes('Add to Cart enabled'));
  assert.equal(posts,1);assert.equal(await page.locator('.publish-reviewed-gift').filter({hasText:'Published'}).count(),1);
  await page.locator('#gift-next-ready').click();
  await page.waitForFunction(id=>document.querySelector('.gift-review')?.dataset.giftId.startsWith(id),sources[2].id);
  assert.equal(posts,1,'Selecting another breed must not publish it');
  await page.locator('#lock-review').click();
  assert.equal(await page.locator('#gift-reviews img').count(),0);assert.equal(await page.locator('#original-source img').count(),0);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('recast_admin_token')),null);
  assert.equal(leakedAuth,0);assert.deepEqual(errors,[]);
  console.log('PASS mocked breed selection, native hashes, one explicit publication, no auth leakage',engine,width);
  await context.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
