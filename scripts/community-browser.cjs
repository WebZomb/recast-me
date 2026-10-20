const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public');
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('content-type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true});fs.mkdirSync('rm050-browser-results',{recursive:true});
  for(const width of [320,393,768,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
   await page.route('**/api/community*',route=>route.fulfill({json:{ok:true,posts:Array.from({length:25},(_,i)=>({id:String(i).padStart(32,'0'),styleId:'royal',styleName:'Royal',hearts:i,image:'/assets/world-royal-v18.webp'}))}}));
   await page.goto(`http://127.0.0.1:${server.address().port}/community.html`,{waitUntil:'networkidle'});
   await page.waitForSelector('.community-card');
   assert.equal(await page.locator('.community-card').count(),20);
   assert.deepEqual(await page.locator('.recast-mobile-nav span').allTextContents(),['Create','My Recasts','My Orders','Specials','Community']);
   assert.equal(await page.locator('.community-help-link').getAttribute('href'),'/guide.html');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.match(await page.locator('.community-card .primary').first().getAttribute('href'),/^\/\?style=royal&community=1#start$/);
   await page.getByRole('button',{name:'Load more'}).click();assert.equal(await page.locator('.community-card').count(),25);
   await page.getByRole('button',{name:'☆ Save',exact:true}).first().click();
   assert.equal(await page.getByRole('button',{name:'★ Saved',exact:true}).count(),1);
   await page.getByRole('button',{name:'Manage my shared Recasts'}).click();await page.getByRole('button',{name:'Done',exact:true}).click();
   await page.evaluate(async()=>{const {shareWithCommunity}=await import('/community-share.js');shareWithCommunity({requestId:'RC-TEST-123456',accessToken:'test-only'})});
   assert.equal(await page.getByRole('button',{name:'Submit for review'}).isDisabled(),true);
   await page.locator('.community-dialog input').check();assert.equal(await page.getByRole('button',{name:'Submit for review'}).isDisabled(),false);
   const fit=await page.locator('.community-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth});assert.equal(fit,true);
   await page.screenshot({path:`rm050-browser-results/community-${width}.png`});
   assert.deepEqual(errors,[]);console.log('PASS community',width);await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
