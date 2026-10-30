// Local route fixtures: no provider calls, purchases or owner configuration writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('public'),out=path.resolve('rm050-browser-results/seasonal');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const {holidayDefaults}=await import('../public/holiday-schedule.js');
 const {seasonalProducts}=await import('../public/seasonal-products.js');
 const {holidayOffer}=await import('../src/holiday-campaigns.js');
 const campaign={active:{id:'halloween',title:'Halloween',style:'halloween',date:'2026-10-31',start:'2026-10-10',end:'2026-10-31'},offer:holidayOffer({id:'halloween'},new Date('2026-10-13T20:00:00Z'))};
 const products=seasonalProducts.map(p=>({name:p.name==='Tough Phone Case'?'Phone Case':p.name,price:Number(p.price.match(/[\d.]+/)[0]),sku:'RECAST-'+p.name.replace(/[^A-Z]/gi,'').toUpperCase()}));
 const browser=await chromium.launch(process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH,args:["--no-sandbox","--disable-gpu","--no-zygote"]}:{});const report=[];
 for(const width of [320,393,768,1280]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});let saved=null;const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Keep this Halloween fixture independent of the real calendar and the Christmas launch.
  await page.addInitScript(()=>{const OriginalDate=Date;const timestamp=Date.UTC(2026,9,13,20);window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[timestamp]));}static now(){return timestamp;}};});
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname!=='recast.test')return route.fulfill({status:204});
   if(url.pathname==='/api/seasonal-campaign')return route.fulfill({json:{ok:true,...campaign}});
   if(url.pathname==='/api/seasonal-products')return route.fulfill({json:{ok:true,products}});
   if(url.pathname==='/api/admin/holiday-schedule'){
    if(route.request().method()==='POST')saved=route.request().postDataJSON();
    return route.fulfill({json:{ok:true,revision:saved?1:0,rows:saved?.rows||holidayDefaults(),...campaign}});
   }
   if(url.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});
   const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+'/')||!fs.existsSync(file))return route.fulfill({status:404});
   const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
   return route.fulfill({body:fs.readFileSync(file),contentType:mime[path.extname(file)]||'application/octet-stream'});
  });
  await page.goto('http://recast.test/specials.html');await page.locator('.season-shop-card').last().waitFor();
  assert.equal(await page.locator('.season-shop-card').count(),18);
  assert.equal(await page.locator('[data-season-offer]:visible').count(),3);
  assert.equal(await page.locator('.season-shop-sale').count(),18);
  assert.equal(await page.locator('.season-shop-price').first().innerText().then(t=>t.includes('$26.99')),true);
  await page.evaluate(async()=>{for(const img of [...document.images].filter(img=>new URL(img.src).hostname==='recast.test')){img.loading='eager';await img.decode();}});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(out,'specials-'+width+'.png'),fullPage:true});
  await page.screenshot({path:path.join(out,'hero-'+width+'.png')});
  // Exercise actual standalone owner form module with mocked authenticated client.
  await page.goto('http://recast.test/admin.html');
  await page.evaluate(async()=>{
   document.querySelectorAll('script').forEach(x=>x.remove());
   document.getElementById('dashboard').classList.remove('hidden');
   document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));
   document.getElementById('owner-settings').classList.add('active');
   document.getElementById('holiday-schedule').open=true;
  });
  // Existing admin initialization owns the form; force loading through toggle.
  await page.locator('#holiday-schedule').evaluate(x=>{x.open=false;x.open=true});
  await page.locator('[name="halloween-priority"]').waitFor();
  await page.locator('[name="halloween-priority"]').fill('125');
  await page.locator('#holiday-schedule-form [type=submit]').click();
  await page.waitForFunction(()=>document.getElementById('toast').textContent==='Holiday schedule saved.');
  assert.equal(saved.rows.find(x=>x.id==='halloween').priority,125);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);report.push({width,cards:18,banners:3,ownerSave:true,overflow:false,errors});await page.close();
 }
 await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});
