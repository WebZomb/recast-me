const {chromium,webkit}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public');
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 fs.mkdirSync('shop-browser-results',{recursive:true});
 try{for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{for(const width of [320,393,768,1280]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
 await page.goto(origin+'/christmas.html',{waitUntil:'networkidle'});
 assert.equal(await page.locator('.product').count(),0);assert.equal(await page.locator('[data-occasion="christmas"]').getAttribute('aria-pressed'),'true');
 await page.screenshot({path:`shop-browser-results/christmas-${name}-${width}.png`,fullPage:true});
 const fixture={id:'test-dog',title:'Test dog mug',pet:'dog',breed:'Golden Retriever',product:'mug',occasion:'christmas',status:'verified',priceCents:2500,currency:'USD',artworkRevision:'v1',variantId:'123',variantLabel:'11 oz',mockupUrl:origin.replace('http:','https:')+'/test.png',proof:{provider:'printful',approved:true,artworkRevision:'v1'}};
 // Isolated fixtures exercise UI only. No fixture is shipped or supplier-approved.
 await page.route('**/test.png',r=>r.fulfill({contentType:'image/png',body:fs.readFileSync('public/shop-assets/christmas-golden-artwork.png')}));
 await page.route('**/shop-catalog.json',r=>r.fulfill({json:{version:1,offers:[fixture,{...fixture,id:'test-cat',title:'Test cat mug',pet:'cat',breed:'Calico'}]}}));
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('.product').count(),2);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('[name="pet"]').selectOption('cat');assert.equal(await page.locator('.product').count(),1);
 await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('[name="pet"]').inputValue(),'cat');
 await page.getByRole('button',{name:'Add to bag',exact:true}).click();assert.equal(await page.locator('#bag-count').textContent(),'1');
 assert.equal(await page.locator('#subtotal').textContent(),'$25.00');await page.getByRole('button',{name:'Increase quantity of Test cat mug'}).click();assert.equal(await page.locator('#subtotal').textContent(),'$50.00');
 assert.equal(await page.getByRole('button',{name:'Checkout coming soon'}).isDisabled(),true);
 await page.getByRole('button',{name:'Continue shopping'}).click();await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#bag-count').textContent(),'2');
 await page.getByRole('button',{name:/^Bag/}).click();await page.getByRole('button',{name:'Remove',exact:true}).click();assert.equal(await page.locator('#subtotal').textContent(),'$0.00');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'View details',exact:true}).click();assert.equal(await page.locator('#product-detail').isVisible(),true);await page.keyboard.press('Escape');
 assert.deepEqual(errors,[]);console.log(`${name} ${width}: empty catalog, URL filters, cart persistence, quantities, removal, detail and overflow passed`);await page.close();
 }}finally{await browser.close();}
 }}finally{server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
