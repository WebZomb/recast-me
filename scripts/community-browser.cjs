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
   // Owner panel harness uses the actual admin markup and module with fixture data.
   await page.route('**/admin.js*',r=>r.fulfill({contentType:'text/javascript',body:''}));
   await page.goto(`http://127.0.0.1:${server.address().port}/admin.html`);
   await page.evaluate(async()=>{
    document.querySelector('#dashboard').classList.remove('hidden');
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel==='community'));
    window.reviewCalls=[];let state='pending';
    const {initCommunityReview}=await import('/admin-community-panel.js');
    window.reviewPanel=initCommunityReview(async(path,options)=>{
     if(options){window.reviewCalls.push({path,...options});state=options.body.status}
     return {posts:[{id:'test-post',styleName:'Royal',status:state,reports:0,image:'/assets/world-royal-v18.webp'}]};
    },()=>({'x-recast-request':'1'}));await window.reviewPanel.load();
   });
   await page.waitForFunction(()=>!document.querySelector('#community-review-posts button').disabled);
   assert.equal(await page.locator('#community-pending').textContent(),'1');
   await page.getByRole('button',{name:'Approve',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#community-pending').textContent==='0');
   assert.equal(await page.evaluate(()=>window.reviewCalls[0].body.status),'approved');
   await page.getByRole('button',{name:'Reject / hide',exact:true}).click();
   await page.waitForFunction(()=>window.reviewCalls.length===2);
   assert.equal(await page.evaluate(()=>window.reviewCalls[1].body.status),'rejected');
   assert.equal(await page.locator('[data-panel="community"]').evaluate(el=>el.scrollWidth>el.clientWidth),false);
   await page.screenshot({path:`rm050-browser-results/admin-community-${width}.png`});
   await page.evaluate(()=>window.reviewPanel.clear());assert.equal(await page.locator('.community-review-card').count(),0);
   assert.deepEqual(errors,[]);console.log('PASS community and owner review',width);await page.close();
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
