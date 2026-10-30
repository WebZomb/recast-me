const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public'),out=path.resolve('../RecastChristmasShop20261030-evidence');fs.mkdirSync(out,{recursive:true});
 const productResponse=await fetch('https://recastmeai.com/api/seasonal-products',{signal:AbortSignal.timeout(20000)});if(!productResponse.ok)throw Error('live catalog read failed');const products=await productResponse.json();
 const executable=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(x=>fs.existsSync(x));
 const browser=await chromium.launch({headless:true,executablePath:executable});
 try{for(const width of [320,393,768,1280]){
   const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1});const page=await context.newPage();await page.addInitScript(()=>{const OriginalDate=Date;const timestamp=Date.UTC(2026,9,30,17);window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[timestamp]));}static now(){return timestamp;}};});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://recastmeai.com/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==='/api/seasonal-campaign')return route.fulfill({json:{ok:true,active:{id:'halloween',title:'Halloween',date:'2026-10-31',style:'halloween'},offer:{id:'halloween',name:'Halloween',percent:10},checkoutReady:true}});
    if(u.pathname==='/api/seasonal-products')return route.fulfill({json:products});
    if(u.pathname.startsWith('/api/'))return route.fulfill({json:{ok:true}});
    let file=path.join(root,u.pathname==='/'?'index.html':u.pathname.replace(/^\//,''));if(!path.extname(file))file+='.html';
    if(!file.startsWith(root)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
    const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'}[path.extname(file)]||'application/octet-stream';
    return route.fulfill({body:fs.readFileSync(file),contentType:type});
   });
   await page.route('**/*cloudflareinsights*',r=>r.abort());
   for(const name of ['specials','christmas-gifts']){
    await page.goto('https://recastmeai.com/'+name+'.html',{waitUntil:'networkidle',timeout:60000});
    await page.waitForFunction(()=>document.querySelectorAll('.season-shop-card').length>=16);
    assert.match(await page.locator('#season-title').innerText(),/Christmas/);
    assert.match(await page.locator('#season-primary-cta').getAttribute('href'),/style=christmas/);
    assert.equal(await page.locator('[data-season-offer]:visible').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'overflow '+width+' '+name);
    assert.equal(await page.locator('#season-hero-image').evaluate(x=>x.complete&&x.naturalWidth>0),true);
    assert.match(await page.title(),/Christmas/);assert.deepEqual(errors,[]);
    await page.screenshot({path:path.join(out,name+'-'+width+'.png'),fullPage:false});
    console.log('PASS',name,width,'cards',await page.locator('.season-shop-card').count());
   }
   await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
