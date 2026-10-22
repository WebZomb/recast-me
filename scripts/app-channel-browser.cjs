// Source-only app/browser regression. All requests, uploads and checkout destinations
// are intercepted; no customer data, real render, purchase or provider operation occurs.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('public'),out=path.resolve('rm050-browser-results');
const origin='http://recast.test',requestId='RC-TEST0001-ABCDEF',accessToken='fixture-private-artwork-token';
const fixture=fs.readFileSync(path.join(root,'assets/world-game-v18.webp'));
const image='data:image/webp;base64,'+fixture.toString('base64');
const protectedImage='data:image/jpeg;base64,'+fs.readFileSync(path.join(root,'assets/product-mug-v09.jpg')).toString('base64');
const products=[
 {title:'Custom Recast Mug',status:'ACTIVE',variants:[{sku:'RECAST-MUG-11OZ',variantTitle:'11 oz',price:'24.99'}]},
 {title:'HD Digital Recast',status:'ACTIVE',variants:[{sku:'RECAST-DIGITAL-HD',variantTitle:'HD file',price:'4.99'}]},
 {title:'Recast Pack',status:'ACTIVE',variants:[{sku:'RECAST-DIGITAL-PACK',variantTitle:'Digital pack',price:'9.99'}]}
];
const safari='Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1';
const iosWebView='Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const androidChrome='Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const androidWebView='Mozilla/5.0 (Linux; Android 15; Pixel 9 Build/AP3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36';
const cases=[
 {name:'desktop-web',width:1280,platform:null},
 {name:'mobile-safari',width:393,userAgent:safari,platform:null},
 {name:'mobile-chrome',width:393,userAgent:androidChrome,platform:null},
 {name:'ios-bridge',width:393,bridge:'ios',platform:'ios'},
 {name:'ios-webview',width:320,userAgent:iosWebView,platform:'ios'},
 {name:'android-webview',width:320,userAgent:androidWebView,platform:'android'},
 {name:'android-bridge',width:393,bridge:'android',platform:'android'}
];
function installBridge(platform){
 if(platform==='ios')Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{recastPreview:{postMessage:async value=>{window.__savedPreviews.push(value);return {ok:true,reusable:true};}}}}});
 if(platform==='android')window.RecastApp={platform:'android'};
}
async function installFixtures(context,state){
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),p=url.pathname;
  if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
  if(url.origin!==origin){
   if(url.hostname==='shop.test'){state.destinations.push(request.url());return route.fulfill({contentType:'text/html',body:'<h1>Mocked secure physical checkout</h1>'});}
   if(request.resourceType()==='image')return route.fulfill({contentType:'image/webp',body:fixture});
   return route.abort();
  }
  if(p==='/checkout-harness.html')return route.fulfill({contentType:'text/html',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><div id="request-id">Artwork ID: ${requestId}</div><div id="product-grid"></div><canvas id="preview-canvas" width="10" height="10"></canvas><script type="module" src="/checkout.js"></script>`});
  if(p.startsWith('/api/')){
   state.api.push({path:p,method:request.method(),platform:request.headers()['x-recast-app-platform']||null});
   let data={ok:true};
   if(p==='/api/checkout-options')data.products=products; // Deliberately includes digital rows, even in apps.
   else if(p==='/api/seasonal-products')data.products=products.map(product=>({name:product.title.replace(/^Custom Recast /,''),price:Number(product.variants[0].price),sku:product.variants[0].sku}));
   else if(p==='/api/seasonal-campaign')data={ok:true,active:{id:'halloween',title:'Halloween',style:'halloween',date:'2026-10-31',start:'2026-10-10',end:'2026-10-31'},offer:null};
   else if(p==='/api/checkout-link'){
    const body=request.postDataJSON();state.checkouts.push({body,platform:request.headers()['x-recast-app-platform']||null});
    data.checkoutUrl='https://shop.test/checkout/'+body.sku;
   }else if(p==='/api/original-photo')data={ok:true,persisted:true,watermarked:true,requestId,accessToken,image,createdAt:'2026-10-21T12:00:00Z'};
   else if(p===`/api/request/${requestId}/preview`)data={ok:true,watermarked:true,image:protectedImage};
   else if(p===`/api/request/${requestId}`)data.request={requestId,styleName:'Original photo',styleId:'original',subjectType:'photo',qualityMode:'original'};
   else if(p==='/api/render-credits')data={ok:true,enabled:false,initialized:true,remaining:3,standardRemaining:5};
   else if(p==='/api/credit-packs/catalog')data={ok:true,enabled:false,packs:[]};
   else if(p==='/api/render-readiness'||p==='/api/model-status')data={ok:true,local:{ready:true},modes:{high:{ready:true,state:'ready'},quick:{ready:true,state:'ready'}}};
   else if(p==='/api/public-config')data.turnstileSiteKey=null;
   else if(p==='/api/order-status')data={ok:true,creditsEnabled:false,request:{requestId,paid:true,orderName:'#TEST',digitalEntitlement:'RECAST-DIGITAL-HD'},jobs:[{id:'fixture-mug',product:'Mug',sku:'RECAST-MUG-11OZ',digital:false,status:'shipped',printfulStatus:'fulfilled',trackingReady:true,trackingNumber:'TEST-TRACKING',trackingUrl:'https://tracking.test/fixture',carrier:'Test carrier'}]};
   else if(p.startsWith('/api/order-design/')&&p.endsWith('/preview'))return route.fulfill({contentType:'image/webp',body:fixture});
   else if(!['GET','HEAD'].includes(request.method())){state.errors.push('Unexpected write '+request.method()+' '+p);return route.fulfill({status:503,json:{ok:false,error:'Unexpected mocked request'}});}
   return route.fulfill({json:data});
  }
  const pathname=p==='/'?'/index.html':p;
  let file=path.resolve(root,'.'+pathname);
  if(!path.extname(file)&&fs.existsSync(file+'.html'))file+='.html';
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Fixture file not found'});
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
  return route.fulfill({body:fs.readFileSync(file),contentType:mime});
 });
}
async function checkFit(page,description){
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,description+' must fit the viewport');
}
async function prepareArtwork(page){
 await page.locator('#choose-original-photo').click();
 await page.locator('#original-photo').setInputFiles({name:'fixture.webp',mimeType:'image/webp',buffer:fixture});
 await page.locator('#original-consent').check();
 await page.locator('#original-photo-form button[type="submit"]').click();
 await page.locator('#product-grid.checkout-catalog [data-product-title="Custom Recast Mug"]').waitFor();
}
async function runCase(browser,engineName,config){
 const label=engineName+'-'+config.name,state={api:[],checkouts:[],destinations:[],errors:[]};
 const context=await browser.newContext({viewport:{width:config.width,height:900},userAgent:config.userAgent,reducedMotion:'reduce',serviceWorkers:'block'});
 await context.addInitScript(({bridge})=>{
  window.__savedPreviews=[];window.__previewShares=[];
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
  Object.defineProperty(navigator,'share',{configurable:true,value:async value=>{window.__previewShares.push({files:value.files.map(file=>file.name)});}});
  if(bridge==='ios')Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{recastPreview:{postMessage:async value=>{window.__savedPreviews.push(value);return {ok:true,reusable:true};}}}}});
  if(bridge==='android')window.RecastApp={platform:'android'};
 },{bridge:config.bridge});
 await installFixtures(context,state);
 const page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',error=>state.errors.push(error.message));
 try{
  await page.goto(origin+'/',{waitUntil:'networkidle'});
  await page.locator('#product-grid .product').first().waitFor();
  const staticNames=await page.locator('#product-grid .product strong').allTextContents();
  for(const name of ['HD Digital Recast','Recast Pack'])assert.equal(staticNames.includes(name),!config.platform,label+' static catalog: '+name);
  assert.ok(staticNames.includes('Mug'),label+' keeps physical merchandising');
  await checkFit(page,label+' landing');
  await prepareArtwork(page);
  for(const name of ['HD Digital Recast','Recast Pack'])assert.equal(await page.locator(`[data-product-title="${name}"]`).count(),config.platform?0:1,label+' selected-artwork catalog: '+name);
  assert.equal(state.api.find(call=>call.path==='/api/checkout-options')?.platform,config.platform,label+' sends its app channel on catalog requests');
  await checkFit(page,label+' product catalog');
  await page.locator('#save-native-preview').click();
  await page.waitForFunction(()=>document.querySelector('#preview-export-status').textContent.includes('Saved'));
  if(config.bridge==='ios')assert.equal(await page.evaluate(()=>window.__savedPreviews.length),1,label+' preserves native preview saving');
  await page.locator('#share-preview').click();
  await page.waitForFunction(()=>window.__previewShares.length===1);
  assert.match((await page.evaluate(()=>window.__previewShares[0])).files[0],/\.(png|jpg|jpeg|webp)$/i,label+' shares a free preview file');
  await page.locator('[data-product-title="Custom Recast Mug"]').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(out,'app-channel-catalog-'+label+'.png')});
  await page.locator('[data-product-title="Custom Recast Mug"] .recast-buy-now').click();
  await page.locator('.fast-review').waitFor();
  await checkFit(page,label+' physical review');
  await page.locator('[data-fast-confirm]').click();
  await page.waitForURL('https://shop.test/checkout/RECAST-MUG-11OZ');
  assert.equal(state.checkouts.length,1,label+' makes one physical checkout request');
  assert.equal(state.checkouts[0].body.sku,'RECAST-MUG-11OZ');
  assert.equal(state.checkouts[0].platform,config.platform,label+' sends app channel at physical checkout');
  assert.equal(state.destinations.length,1,label+' retains the mocked merchant checkout handoff');
  await page.goto(`${origin}/order.html?requestId=${requestId}&token=${accessToken}`,{waitUntil:'networkidle'});
  await page.locator('.order-item').waitFor();
  assert.equal(await page.getByRole('link',{name:'Download purchased artwork',exact:true}).count(),config.platform?0:1,label+' paid download visibility');
  assert.equal(await page.getByRole('link',{name:'Track shipment →',exact:true}).count(),1,label+' physical order tracking');
  assert.equal(state.api.find(call=>call.path==='/api/order-status')?.platform,config.platform,label+' sends channel when loading orders');
  await checkFit(page,label+' order details');
  await page.goto(origin+'/specials.html',{waitUntil:'networkidle'});
  await page.locator('.season-shop-card').first().waitFor();
  const seasonalNames=await page.locator('.season-shop-card h3').allTextContents();
  for(const name of ['HD Digital Recast','Recast Pack'])assert.equal(seasonalNames.includes(name),!config.platform,label+' seasonal catalog: '+name);
  assert.ok(seasonalNames.includes('Mug'),label+' seasonal physical product remains');
  assert.equal(state.api.find(call=>call.path==='/api/seasonal-products')?.platform,config.platform,label+' seasonal catalog sends app channel');
  await checkFit(page,label+' Specials');
  await page.goto(origin+'/support.html',{waitUntil:'networkidle'});
  const digitalCopy=page.getByText(/Digital purchases are delivered to the buyer/);
  assert.equal(await digitalCopy.count()?await digitalCopy.isVisible():false,!config.platform,label+' support digital copy visibility');
  await checkFit(page,label+' support');
  await page.goto(origin+'/privacy.html',{waitUntil:'networkidle'});
  assert.equal(await page.locator('[data-website-digital-copy]').isVisible(),!config.platform,label+' privacy digital copy visibility');
  assert.deepEqual(state.errors,[],label+' has no script errors or unexpected writes');
  console.log('PASS',label,'catalog, free preview save/share, physical checkout, order access and layout');
 }catch(error){
  await page.screenshot({path:path.join(out,'app-channel-failed-'+label+'.png')}).catch(()=>{});
  throw new Error(label+': '+error.message+'; page errors: '+JSON.stringify(state.errors),{cause:error});
 }finally{await context.close();}
}
async function staleCardCase(browser,engineName,platform){
 const context=await browser.newContext({viewport:{width:393,height:900},serviceWorkers:'block'}),state={api:[],checkouts:[],destinations:[],errors:[]};
 await installFixtures(context,state);
 await context.addInitScript(({requestId,accessToken})=>{window.__savedPreviews=[];localStorage.setItem('recast_last_request',JSON.stringify({requestId,accessToken}));},{requestId,accessToken});
 const page=await context.newPage();page.on('pageerror',error=>state.errors.push(error.message));page.setDefaultTimeout(12000);
 try{
  await page.goto(origin+'/checkout-harness.html',{waitUntil:'networkidle'});
  const buy=page.locator('[data-product-title="HD Digital Recast"] .recast-buy');await buy.waitFor();
  await page.evaluate(installBridge,platform);
  await buy.click();
  await page.waitForFunction(()=>!document.querySelector('[data-product-title="HD Digital Recast"]'));
  assert.equal(state.checkouts.length,0,'A stale digital card cannot open '+platform+' checkout');
  assert.equal(state.api.filter(call=>call.path==='/api/checkout-options').at(-1).platform,platform,'Stale catalog reload sends the new app channel');
  assert.deepEqual(state.errors,[]);
  console.log('PASS',engineName,platform,'stale digital card is filtered before any checkout request');
 }finally{await context.close();}
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const engines=process.env.RECAST_CHROMIUM_ONLY==='1'?{chromium}:{chromium,webkit};
 for(const [engineName,engine]of Object.entries(engines)){
  const browser=await engine.launch(engineName==='chromium'&&process.env.RECAST_CHROMIUM_EXECUTABLE?{executablePath:process.env.RECAST_CHROMIUM_EXECUTABLE}:{});
  try{for(const config of cases)await runCase(browser,engineName,config);for(const platform of ['ios','android'])await staleCardCase(browser,engineName,platform);}
  finally{await browser.close();}
 }
 console.log('PASS all app/website channel checks. APIs/images/merchant checkout were mocked; no native binary or real payment was exercised.');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
