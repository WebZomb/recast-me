// Isolated UI fixtures only: no live supplier, cart, payment or customer writes.
const {chromium,webkit}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public'),engine=process.env.RECAST_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{}:process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH}:{});
 const output=path.resolve('rm050-browser-results/unified-shop');fs.mkdirSync(output,{recursive:true});
 try{for(const width of [320,393,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const revision='a'.repeat(64),proof={provider:'printful',approved:true,artworkRevision:revision,printFileHash:'b'.repeat(64),placementHash:'c'.repeat(64)};
  const offers=[{id:'golden-mug',designId:'golden',title:'Golden Retriever Winter Lights Mug',occasion:'christmas',pet:'dog',breed:'Golden Retriever',product:'mug',variantLabel:'White · 11 oz',priceCents:2499,currency:'USD',variantId:'gid://shopify/ProductVariant/1',artworkRevision:revision,status:'verified',proof,mockupUrl:'https://recast.test/shop-assets/christmas-golden-artwork.png'},{id:'cat-mug',designId:'cat',title:'Cat Christmas Mug',occasion:'christmas',pet:'cat',breed:'Orange tabby',product:'mug',variantLabel:'White · 11 oz',priceCents:2499,currency:'USD',variantId:'gid://shopify/ProductVariant/1',artworkRevision:revision,status:'verified',proof,mockupUrl:'https://recast.test/shop-assets/christmas-golden-artwork.png'}];
  offers.push({...offers[0],id:'golden-large',variantId:'gid://shopify/ProductVariant/2',variantLabel:'White · 15 oz',priceCents:2999});
  let state={basketId:'test',revision:0,canEdit:true,appliedActions:[],currency:'USD',subtotalCents:0,lines:[],canCheckout:false};const initialState=structuredClone(state),states=new Map(),bindings={};let counter=0,checkoutCalls=0,loseFirstAdd=width===393;const requestedOffers=[],requestCounts=new Map();
  const calculate=()=>{state.lines.forEach(l=>l.lineTotalCents=l.unitPriceCents*l.quantity);state.subtotalCents=state.lines.reduce((n,l)=>n+l.lineTotalCents,0);state.canCheckout=state.lines.length>0;};
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url()),p=url.pathname;if(url.hostname!=='recast.test')return route.fulfill({status:204});
   const body=route.request().method()==='POST'?route.request().postDataJSON():null;let data={ok:true};const requestKey=route.request().method()+' '+p;requestCounts.set(requestKey,(requestCounts.get(requestKey)||0)+1);
   if(p.startsWith('/api/basket')){const id=body?.basketId||url.searchParams.get('id');if(id){if(!states.has(id))states.set(id,{...structuredClone(initialState),basketId:id});state=states.get(id);}}
   if(p==='/api/shop/catalog')data={ok:true,version:1,offers};
   else if(p==='/api/basket/status'){data.enabled=true;data.premadeAddVersion=1;}
   else if(p==='/api/basket/session'){}
   else if(p==='/api/basket')data.basket=state;
   else if(p==='/api/basket/premade-add'){
    requestedOffers.push(body.offerId);const offer=offers.find(o=>o.id===body.offerId),c=body.command;
    if(!state.appliedActions.includes(c.actionId)){
     assert.equal(c.expectedRevision,state.revision);
     state.lines.push({sourceKind:'premade',artworkId:offer.designId,product:'Mug',title:offer.title,variantLabel:offer.variantLabel,sku:'RECAST-MUG-11OZ',unitPriceCents:offer.priceCents,thumbnail:offer.mockupUrl,lineId:c.lineId,quantity:c.quantity});
     state.revision++;state.appliedActions.push(c.actionId);calculate();
    }
    data.basket=state;
    if(loseFirstAdd){loseFirstAdd=false;return route.abort('failed');}
   }
   else if(p==='/api/basket/premade'){requestedOffers.push(body.offerId);const offer=offers.find(o=>o.id===body.offerId);const token=String(++counter).padStart(48,'0');bindings[token]={sourceKind:'premade',artworkId:offer.designId,product:'Mug',title:offer.title,variantLabel:offer.variantLabel,sku:'RECAST-MUG-11OZ',unitPriceCents:offer.priceCents,thumbnail:offer.mockupUrl};data.approvalToken=token;data.basketRevision=state.revision;data.canEdit=true;}
   else if(p==='/api/basket/approve'){const token=String(++counter).padStart(48,'0');bindings[token]={sourceKind:'custom',artworkId:'ART-CUSTOM',product:'Mug',title:'My own Recast mug',variantLabel:'White · 11 oz',sku:'RECAST-MUG-11OZ',unitPriceCents:2499,thumbnail:'/shop-assets/christmas-golden-artwork.png'};data.approvalToken=token;}
   else if(p==='/api/basket/action'){
    const c=body.command;if(!state.appliedActions.includes(c.actionId)){assert.equal(c.expectedRevision,state.revision,'Every edit still uses the authoritative revision');
     if(c.type==='add')state.lines.push({...bindings[body.approvalToken],lineId:c.lineId,quantity:c.quantity});
     if(c.type==='quantity')state.lines.find(l=>l.lineId===c.lineId).quantity=c.quantity;
     if(c.type==='remove')state.lines=state.lines.filter(l=>l.lineId!==c.lineId);
     state.revision++;state.appliedActions.push(c.actionId);calculate();
    }data.basket=state;
   }else if(p==='/api/basket/checkout'){checkoutCalls++;return route.fulfill({status:503,json:{ok:false,error:'Checkout paused in this isolated browser test. Your cart is saved.'}});}
   else if(p==='/custom-fixture.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><header class="site-header"></header><div id="review"><div class="final-review-actions"></div><p class="final-review-error" hidden></p></div><script type="module">import * as b from "/basket.js?v=3";await b.initialize();b.addReviewAction(document.querySelector("#review"),{requestId:"ART-CUSTOM",accessToken:"fixture"},()=>({sku:"RECAST-MUG-11OZ"}),()=>{});window.ready=true;</script>'});
   else if(p.startsWith('/api/'))return route.fulfill({json:{ok:true}});
   else{let file=path.resolve(root,'.'+p);if(!path.extname(file))file+='.html';if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});}
   return route.fulfill({json:data});
  });
  await page.goto('https://recast.test/shop.html');await page.waitForFunction(()=>document.querySelectorAll('.product').length===2&&document.querySelectorAll('.concept-product').length===35);
  const concept=page.locator('.concept-product').first();assert.equal(await concept.getAttribute('data-offer-status'),'preview');
  assert.equal(await concept.getByRole('button',{name:'Add to cart'}).count(),0,'Unapproved artwork must never create cart actions');
  const initialImage=await concept.locator('img').getAttribute('src');
  await concept.getByRole('button',{name:'See artwork'}).click();assert.notEqual(await concept.locator('img').getAttribute('src'),initialImage);
  await concept.getByRole('button',{name:'View 4 options'}).click();
  assert.equal(await page.locator('#detail-views button').count(),4);
  assert.equal(await page.locator('#detail-views button').nth(2).isDisabled(),true,'Pending 11 oz proof must not be presented as real');
  assert.equal(await page.locator('#detail-views button').nth(3).isDisabled(),true,'Pending 15 oz proof must not be presented as real');
  assert.match(await page.locator('#detail-variant').innerText(),/Original artwork/);
  assert.equal(await page.locator('#detail-add').isVisible(),false);
  await page.locator('#close-detail').click();
  await concept.getByRole('button',{name:'See mug'}).click();assert.equal(await concept.locator('img').getAttribute('src'),initialImage);

  const rottweiler=page.locator('.concept-product[data-design-id="archive-rottweiler-fireside"]');
  assert.equal(await rottweiler.count(),1,'Recovered Rottweiler fireplace art and decorated mug appear in the same shop');
  const noScene=page.locator('.concept-product[data-design-id="archive-maine-coon-fireside"]');
  assert.equal(await noScene.count(),1,'Previously missing Maine Coon styled mug now has its matching artwork and mug scene');
  await noScene.getByRole('button',{name:'View 4 options'}).click();
  assert.equal(await page.locator('#detail-views button').nth(0).isDisabled(),false,'Mug scene must now be available');
  assert.equal(await page.locator('#detail-views button').nth(2).isDisabled(),true,'An illustration must not impersonate an 11 oz supplier proof');
  await page.locator('#close-detail').click();
  assert.equal(await page.locator('dialog#cart').count(),0,'Do not keep a separate disabled premade bag');
  assert.equal(await page.locator('#filters').count(),0);
  await page.locator('.product').first().getByRole('combobox').selectOption('golden-large');
  assert.match(await page.locator('.product').first().innerText(),/29.99/);
  await page.getByRole('button',{name:'See real product',exact:true}).first().click();
  assert.match(await page.locator('#detail-variant').innerText(),/15 oz/);
  await page.locator('#close-detail').click();


  await page.getByRole('button',{name:'See real product',exact:true}).first().click();await page.locator('#product-detail').waitFor({state:'visible'});await page.locator('#close-detail').click();
  const beforeFirstAdd=requestCounts.get('GET /api/basket')||0;
  await page.locator('.product').first().getByRole('button',{name:'Add to cart',exact:true}).click();await page.locator('.recast-basket[open]').waitFor();
  if(width===393){
   const retry=page.getByRole('button',{name:'Check unfinished save',exact:true});await retry.waitFor();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('recast_basket_pending_v1')).kind),'premade-add');
   const sent=requestCounts.get('POST /api/basket/premade-add');await retry.click();
   await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===1);
   assert.equal(requestCounts.get('POST /api/basket/premade-add'),sent,'Lost response reconciles the committed action without adding again');
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('recast_basket_pending_v1'))),null);
  }
  await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===1);
  assert.equal((requestCounts.get('GET /api/basket')||0)-beforeFirstAdd,width===393?1:0,'Only explicit lost-response recovery needs a basket GET');
  assert.equal(requestedOffers[0],'golden-large');assert.equal(state.lines[0].sourceKind,'premade');assert.match(await page.locator('[data-basket-subtotal]').innerText(),/29.99/);
  await page.getByRole('button',{name:'Continue shopping',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.product').length===2);
  const beforeSecondAdd=requestCounts.get('GET /api/basket')||0;
  await page.locator('.product').nth(1).getByRole('button',{name:'Add to cart',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===2);assert.equal((requestCounts.get('GET /api/basket')||0)-beforeSecondAdd,0,'Second add must avoid an extra basket GET');await page.getByRole('button',{name:'Continue shopping',exact:true}).click();
  await page.goto('https://recast.test/custom-fixture.html');await page.waitForFunction(()=>window.ready);const beforeCustomAdd=requestCounts.get('GET /api/basket')||0;await page.getByRole('button',{name:'Approve & add to cart',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===3);assert.equal((requestCounts.get('GET /api/basket')||0)-beforeCustomAdd,1,'Custom add must avoid redundant refresh');
  assert.equal(requestCounts.get('POST /api/basket/premade-add'),2,'Two gifts use exactly two combined adds');assert.equal(requestCounts.get('POST /api/basket/premade')||0,0,'No separate approval round trip on capable Worker');assert.equal(state.lines.filter(l=>l.sourceKind==='premade').length,2);assert.equal(state.lines.filter(l=>l.sourceKind==='custom').length,1);assert.equal(state.subtotalCents,7997);
  await page.locator('.basket-line').last().getByRole('combobox').selectOption('2');await page.waitForFunction(()=>document.querySelector('[data-basket-open]').textContent==='Cart (4)');assert.equal(state.subtotalCents,10496);
  await page.getByRole('button',{name:'Checkout',exact:true}).click();await page.getByText('Checkout paused in this isolated browser test. Your cart is saved.',{exact:true}).waitFor();assert.equal(checkoutCalls,1);
  assert.equal(state.lines.length,3);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(output,`${engine}-mixed-cart-${width}.png`)});
  await page.getByRole('button',{name:'Continue shopping',exact:true}).click();await page.goto('https://recast.test/christmas.html');await page.waitForFunction(()=>document.querySelectorAll('.product').length===2&&document.querySelectorAll('.concept-product').length===35);await page.locator('#open-cart').click();await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===3);
  await page.locator('.basket-line').nth(1).getByRole('button',{name:'Remove',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===2);assert.equal(state.lines[0].artworkId,'golden');assert.equal(state.lines[1].artworkId,'ART-CUSTOM');
  await page.getByRole('button',{name:'Continue shopping',exact:true}).click();await page.screenshot({path:path.join(output,`${engine}-shop-${width}.png`)});
  await page.locator('#open-cart').click();await page.locator('.recast-basket[open]').waitFor();
  const savedId=await page.evaluate(()=>localStorage.getItem('recast_basket_id_v1'));
  await page.locator('.basket-saved-carts summary').click();await page.getByRole('button',{name:'Start separate cart',exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('recast_basket_id_v1')),savedId);
  await page.getByRole('button',{name:'Start empty cart',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===0);
  assert.notEqual(await page.evaluate(()=>localStorage.getItem('recast_basket_id_v1')),savedId);assert.equal(checkoutCalls,1);
  await page.locator('[data-saved-carts]').selectOption(savedId);await page.waitForFunction(()=>document.querySelectorAll('.basket-line').length===2);
  assert.equal(state.lines[0].artworkId,'golden');assert.equal(state.lines[1].artworkId,'ART-CUSTOM');assert.equal(checkoutCalls,1);
  assert.deepEqual(errors,[]);console.log('PASS unified premade + custom cart, product sections, distinct designs, quantity, removal, retained checkout and layout',engine,width);await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
