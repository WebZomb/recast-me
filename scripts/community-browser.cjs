const {chromium,webkit}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve('public');
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(root,pathname==='/'?'index.html':pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return}res.setHeader('content-type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  fs.mkdirSync('rm050-browser-results',{recursive:true});
  for(const [engineName,engine] of Object.entries({chromium,webkit})){
  browser=await engine.launch({headless:true});
  for(const {width,native} of [...[320,393,768,1280].map(width=>({width,native:false})),{width:393,native:true}]){
   const page=await browser.newPage({viewport:{width,height:900}});const errors=[],failedRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
   const label=`${engineName}-${width}${native?'-native':''}`;
   await page.addInitScript(({native})=>{
    // Reproduce the installed shell: unsupported JS confirmations return Cancel.
    window.confirmCalls=0;window.confirm=()=>{window.confirmCalls++;return false};
    if(native)Object.defineProperty(window,'webkit',{value:{messageHandlers:{recastPreview:{postMessage:async()=>({})}}},configurable:true});
   },{native});
   const origin=`http://127.0.0.1:${server.address().port}`;
   // WebKit also routes locally-created blob previews; they are not external traffic.
   await page.route('**/*',route=>{const url=route.request().url();return url.startsWith(origin+'/')||url.startsWith('blob:'+origin+'/')||url.startsWith('data:')?route.continue():route.abort()});
   let blocked=false,reportCalls=0,blockCalls=0,failReport=true,failBlock=true;
   await page.route('**/api/community*',route=>route.fulfill({json:{ok:true,posts:blocked?[]:Array.from({length:25},(_,i)=>({id:String(i).padStart(32,'0'),styleId:'royal',styleName:'Royal',hearts:i,liked:i===0,image:'/assets/world-royal-v18.webp'}))}}));
   await page.route('**/api/community/*/report',route=>{assert.equal(route.request().method(),'POST');reportCalls++;return route.fulfill({status:failReport?503:200,json:failReport?{ok:false,error:'Test report retry'}:{ok:true}})});
   await page.route('**/api/community/*/block',route=>{assert.equal(route.request().method(),'POST');blockCalls++;if(!failBlock)blocked=true;return route.fulfill({status:failBlock?503:200,json:failBlock?{ok:false,error:'Test block retry'}:{ok:true}})});
   await page.goto(`http://127.0.0.1:${server.address().port}/community.html`,{waitUntil:'networkidle'});
   await page.waitForSelector('.community-card');
   assert.equal(await page.locator('.community-card').count(),20);
   assert.equal(await page.getByRole('button',{name:'Heart Royal',exact:true}).first().getAttribute('aria-pressed'),'true');
   assert.match(await page.getByRole('button',{name:'Heart Royal',exact:true}).first().textContent(),/♥/);
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.getByRole('button',{name:'Heart Royal',exact:true}).first().getAttribute('aria-pressed'),'true');
   assert.deepEqual(await page.locator('.recast-mobile-nav span').allTextContents(),native?[]:['Create','My Recasts','My Orders','Specials','Community']);
   if(native)assert.equal(await page.locator('.community-help-link').count(),0);
   else assert.equal(await page.locator('.community-help-link').getAttribute('href'),'/guide.html');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.match(await page.locator('.community-card .primary').first().getAttribute('href'),/^\/\?style=royal&community=1#start$/);
   await page.getByRole('button',{name:'Load more'}).click();assert.equal(await page.locator('.community-card').count(),25);
   await page.getByRole('button',{name:'☆ Save',exact:true}).first().click();
   assert.equal(await page.getByRole('button',{name:'★ Saved',exact:true}).count(),1);
   const report=page.getByRole('button',{name:'Report',exact:true}).first();
   const block=page.locator('.community-card').first().getByRole('button',{name:'Block contributor',exact:true});
   const dialog=page.locator('.community-confirm-dialog');
   await report.click();await dialog.waitFor({state:'visible'});
   assert.equal(await page.getByRole('dialog',{name:'Report this picture?',exact:true}).count(),1);
   assert.equal(await dialog.getByRole('button',{name:'Cancel',exact:true}).evaluate(el=>el===document.activeElement),true);
   assert.equal(await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.scrollWidth<=el.clientWidth}),true);
   // Even a repeated programmatic activation must not stack a second confirmation.
   await report.evaluate(el=>el.click());assert.equal(await dialog.count(),1);
   await page.screenshot({path:`rm050-browser-results/community-report-${label}.png`});
   await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await dialog.waitFor({state:'detached'});
   assert.equal(reportCalls,0);assert.equal(await report.isEnabled(),true);
   assert.equal(await report.evaluate(el=>el===document.activeElement),true);
   await report.click();await dialog.waitFor({state:'visible'});await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(reportCalls,0);
   await report.click();await dialog.getByRole('button',{name:'Send report',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#community-status').textContent==='Test report retry');
   assert.equal(reportCalls,1);assert.equal(await report.isEnabled(),true);
   failReport=false;await report.click();await dialog.getByRole('button',{name:'Send report',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#community-status').textContent==='Report sent to the owner for review.');
   assert.equal(reportCalls,2);assert.equal(await report.isDisabled(),true);
   await block.click();await dialog.waitFor({state:'visible'});
   assert.equal(await page.getByRole('dialog',{name:'Block this contributor?',exact:true}).count(),1);
   assert.match(await dialog.textContent(),/private pictures and orders stay available/);
   assert.equal(await dialog.locator('button').evaluateAll(elements=>elements.every(el=>el.getBoundingClientRect().height>=44)),true);
   await page.screenshot({path:`rm050-browser-results/community-block-${label}.png`});
   await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await dialog.waitFor({state:'detached'});assert.equal(blockCalls,0);assert.equal(blocked,false);
   await block.click();await dialog.waitFor({state:'visible'});await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});assert.equal(blockCalls,0);
   await block.click();await dialog.getByRole('button',{name:'Block contributor',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#community-status').textContent==='Test block retry');
   assert.equal(blockCalls,1);assert.equal(blocked,false);assert.equal(await block.isEnabled(),true);
   failBlock=false;await block.click();await dialog.getByRole('button',{name:'Block contributor',exact:true}).click();
   await page.waitForFunction(()=>document.querySelectorAll('.community-card').length===0);
   assert.equal(blockCalls,2);assert.equal(blocked,true);assert.equal(await page.evaluate(()=>window.confirmCalls),0);
   await page.getByRole('button',{name:'Manage my shared Recasts'}).click();await page.getByRole('button',{name:'Done',exact:true}).click();
   await page.evaluate(async()=>{const {shareWithCommunity}=await import('/community-share.js');shareWithCommunity({requestId:'RC-TEST-123456',accessToken:'test-only'})});
   assert.equal(await page.getByRole('button',{name:'Submit for review'}).isDisabled(),true);
   await page.locator('.community-dialog input').check();assert.equal(await page.getByRole('button',{name:'Submit for review'}).isDisabled(),false);
   const fit=await page.locator('.community-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth});assert.equal(fit,true);
   await page.screenshot({path:`rm050-browser-results/community-${label}.png`});
   console.log('PASS customer Community dialogs, cancellation, retry, success, and consent',label);
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
   try{await page.waitForFunction(()=>!document.querySelector('#community-review-posts button').disabled)}catch(error){
    await page.screenshot({path:`rm050-browser-results/admin-community-failure-${label}.png`});
    console.error('Owner preview diagnostic',label,JSON.stringify({failedRequests,errors,state:await page.locator('#community-review-posts').evaluate(el=>({text:el.textContent,image:[...el.querySelectorAll('img')].map(img=>({src:img.src,complete:img.complete,width:img.naturalWidth}))}))}));throw error;
   }
   assert.equal(await page.locator('#community-pending').textContent(),'1');
   await page.getByRole('button',{name:'Approve',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#community-pending').textContent==='0');
   assert.equal(await page.evaluate(()=>window.reviewCalls[0].body.status),'approved');
   await page.getByRole('button',{name:'Reject / hide',exact:true}).click();
   await page.waitForFunction(()=>window.reviewCalls.length===2);
   assert.equal(await page.evaluate(()=>window.reviewCalls[1].body.status),'rejected');
   assert.equal(await page.locator('[data-panel="community"]').evaluate(el=>el.scrollWidth>el.clientWidth),false);
   await page.screenshot({path:`rm050-browser-results/admin-community-${label}.png`});
   await page.evaluate(()=>window.reviewPanel.clear());assert.equal(await page.locator('.community-review-card').count(),0);
   assert.deepEqual(errors,[]);console.log('PASS community confirmations and owner review',label);await page.close();
  }
  await browser.close();browser=null;
  }
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
