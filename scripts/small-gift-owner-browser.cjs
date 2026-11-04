const {webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await webkit.launch();
 const root=path.resolve('public'),sample=fs.readFileSync(path.join(root,'shop-assets/christmas-golden-artwork.png'));
 const id='christmas-village-golden-retriever-sticker-sheet-six',base='/api/shop/small-gift-review';
 try{for(const width of [393,1280]){
  const context=await browser.newContext({viewport:{width,height:850}}),page=await context.newPage();
  const errors=[];let reads=0,foreignToken=0,nativeReads=0;
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.hostname==='cdn.shopify.com'){
    if(req.headers().authorization)foreignToken++;
    return route.fulfill({contentType:'image/png',body:sample});
   }
   if(url.hostname!=='recast.test')return route.fulfill({status:404});
   if(req.method()!=='GET')throw Error('Review must never write to commerce');
   if(url.pathname.startsWith(base)){
    if(req.headers().authorization!=='Bearer owner-fixture')return route.fulfill({status:401,json:{ok:false}});
    if(url.pathname===base){reads++;return route.fulfill({json:{ok:true,readOnly:true,originalArtwork:'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/original.png',items:[{id,sku:'RECAST-STICKER-PACK',title:'Christmas six-picture sticker sheet',status:'ready_for_review',checkoutEnabled:false,mime:'image/png',printSize:{width:1750,height:2482},reviewSignature:'a'.repeat(64),cleanPrintUrl:base+'/'+id+'/print',supplierPictures:[{title:'Manufacturer proof',url:'https://recast.test/api/mockup/image/RC-SHOP-GOLDEN-RETRIEVER-V1/RECAST-STICKER-PACK/0?token=proof-fixture'}]}]}});}
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
  assert.equal(nativeReads,1);assert.equal(foreignToken,0);
  assert.equal(await page.locator('.gift-review .review-image').count(),2);
  assert.equal(await page.locator('.gift-review img[src^="blob:"]').count(),1);
  assert.equal(await page.locator('#review-token').inputValue(),'');
  assert.equal(await page.getByRole('button',{name:/approve|publish|buy|production/i}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.getByRole('button',{name:'Lock review'}).click();
  assert.equal(await page.locator('#gift-reviews img').count(),0);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('recast_admin_token')),null);
  assert.equal(await page.locator('#review-login').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS authenticated native file review and lock',width);
  await context.close();
 }}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
