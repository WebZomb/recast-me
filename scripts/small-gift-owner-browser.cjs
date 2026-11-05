// All publication responses and images here are fixtures. No live credentials,
// real catalog writes, purchases, customer orders or supplier requests.
const {webkit,chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
(async()=>{
 const engine=process.env.RECAST_BROWSER==='chromium'?'chromium':'webkit';
 const browser=await (engine==='chromium'?chromium:webkit).launch();
 const root=path.resolve('public'),sample=fs.readFileSync(path.join(root,'shop-assets/christmas-golden-artwork.png'));
 const fileHash=crypto.createHash('sha256').update(sample).digest('hex');
 const id='christmas-village-golden-retriever-sticker-sheet-six',base='/api/shop/small-gift-review',publish='/api/admin/small-gifts/publish';
 try{for(const width of [320,393,1280]){
  const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage();
  const errors=[];let reads=0,foreignToken=0,nativeReads=0,writes=0,published=false,corrupt=false;
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   // WebKit routes blob URLs too. They are private in-memory image bytes,
   // not external hosts, and must be decoded by the browser normally.
   if(url.protocol==='blob:')return route.continue();
   if(url.hostname==='cdn.shopify.com'){
    if(req.headers().authorization)foreignToken++;
    return route.fulfill({contentType:'image/png',body:sample});
   }
   if(url.hostname!=='recast.test')return route.fulfill({status:404});
   if(url.pathname===publish){
    assert.equal(req.method(),'POST');assert.equal(req.headers().authorization,'Bearer owner-fixture');
    assert.equal(req.headers()['x-recast-request'],'1');
    assert.deepEqual(req.postDataJSON(),{id,reviewSignature:'a'.repeat(64),printFileHash:fileHash,sourceRevision:'b'.repeat(64),confirm:'PUBLISH_THIS_REVIEWED_PRINT_FILE'});
    writes++;published=true;
    return route.fulfill({json:{ok:true,id,published:true,alreadyPublished:false,storePath:'/shop-sticker-sheets',paymentCreated:false,productionSubmitted:false}});
   }
   if(req.method()!=='GET')throw Error('Unexpected commerce or supplier operation '+url.pathname);
   if(url.pathname.startsWith(base)){
    if(req.headers().authorization!=='Bearer owner-fixture')return route.fulfill({status:401,json:{ok:false}});
    if(url.pathname===base){reads++;return route.fulfill({json:{ok:true,readOnly:true,originalArtwork:'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/original.png',items:[{id,sku:'RECAST-STICKER-PACK',title:'Christmas six-picture sticker sheet',status:published?'published':'ready_for_review',checkoutEnabled:published,mime:'image/png',printSize:{width:1750,height:2482},reviewSignature:'a'.repeat(64),printFileHash:corrupt?'0'.repeat(64):fileHash,sourceRevision:'b'.repeat(64),cleanPrintUrl:base+'/'+id+'/print',supplierPictures:[{title:'Manufacturer proof',url:'https://recast.test/api/mockup/image/RC-SHOP-GOLDEN-RETRIEVER-V1/RECAST-STICKER-PACK/0?token=proof-fixture'}]}]}});}
    if(url.pathname===base+'/'+id+'/print'){nativeReads++;return route.fulfill({contentType:'image/png',body:sample});}
    return route.fulfill({status:404});
   }
   if(url.pathname.startsWith('/api/mockup/image/')){if(req.headers().authorization)foreignToken++;return route.fulfill({contentType:'image/png',body:sample});}
   const file=path.resolve(root,'.'+url.pathname);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
   return route.fulfill({contentType:url.pathname.endsWith('.html')?'text/html':url.pathname.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync(file)});
  });
  await page.goto('https://recast.test/admin-small-gifts.html');
  assert.equal(reads,0);assert.equal(await page.locator('#review-login').isVisible(),true);
  await page.locator('#review-token').fill('owner-fixture');
  await page.getByRole('button',{name:'Open private review'}).click();
  await page.waitForFunction(()=>document.querySelector('#review-status').textContent.includes('1 native print files'));
  assert.equal(nativeReads,1);assert.equal(foreignToken,0);assert.equal(writes,0);
  assert.equal(await page.locator('.gift-review .review-image').count(),2);
  assert.equal(await page.locator('.gift-review img[src^="blob:"]').count(),1);
  assert.equal(await page.locator('#review-token').inputValue(),'');
  const button=page.getByRole('button',{name:'Publish reviewed design',exact:true});
  assert.equal(await button.isDisabled(),true,'Loaded files alone never authorize publication');
  await page.locator('.publication-review-check input').check();
  assert.equal(await button.isEnabled(),true);assert.equal(writes,0);
  page.once('dialog',dialog=>dialog.dismiss());await button.click();
  assert.equal(writes,0,'Cancel leaves catalog unchanged');
  page.once('dialog',dialog=>dialog.accept());await button.click();
  await page.waitForFunction(()=>document.querySelector('.availability').textContent.includes('Add to Cart enabled'));
  assert.equal(writes,1);assert.equal(await page.locator('a.published-store-link').getAttribute('href'),'/shop-sticker-sheets');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.getByRole('button',{name:'Refresh files'}).click();
  await page.waitForFunction(()=>Boolean(document.querySelector('a.published-store-link')));
  assert.equal(writes,1,'Refresh is read-only and does not repeat publication');
  assert.equal(await page.getByRole('button',{name:'Publish reviewed design',exact:true}).count(),0);
  await page.getByRole('button',{name:'Lock review'}).click();
  assert.equal(await page.locator('#gift-reviews img').count(),0);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('recast_admin_token')),null);
  assert.equal(await page.locator('#review-login').isVisible(),true);
  // Altered native-file SHA keeps confirmation and publishing disabled.
  published=false;corrupt=true;
  await page.locator('#review-token').fill('owner-fixture');await page.getByRole('button',{name:'Open private review'}).click();
  await page.waitForFunction(()=>document.querySelector('.publication-status')?.textContent.includes('could not be verified'));
  assert.equal(await page.locator('.publication-review-check input').isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Publish reviewed design',exact:true}).isDisabled(),true);
  assert.equal(writes,1);assert.equal(foreignToken,0);assert.deepEqual(errors,[]);
  console.log('PASS owner-only exact-file publication, consent, cancellation, corrupt-file hold and lock',engine,width);
  await context.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
