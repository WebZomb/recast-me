// Explicitly read-only public browser audit. Never send uploads, renders or purchases.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const base='https://recast-me.sergz24.workers.dev';
const out=path.join(process.env.GITHUB_WORKSPACE||process.cwd(),'audit-results');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const report={commit:process.env.GITHUB_SHA,at:new Date().toISOString(),readOnly:true,health:[],pages:[],browsers:[],failures:[]};
  // A source commit is not a deployment: check the real HTML marker before testing.
  let deployed=false;
  for(let attempt=0;attempt<8;attempt++){
    try{const r=await fetch(base+'/?launch-audit='+Date.now(),{signal:AbortSignal.timeout(20000)});deployed=r.ok&&(await r.text()).includes('data-launch-build="RM-049.1"');}catch{}
    if(deployed)break;await pause(15000);
  }
  report.deployed=deployed;
  if(!deployed)report.failures.push('Expected RM-049.1 is not deployed on production.');
  for(const p of ['/api/model-status','/api/render-readiness','/api/public-config','/api/printful-health']){
    try{const r=await fetch(base+p,{signal:AbortSignal.timeout(25000)});const type=r.headers.get('content-type')||'';const body=type.includes('json')?await r.json():{contentType:type};report.health.push({path:p,status:r.status,body});}catch(e){report.health.push({path:p,error:e.message});}
  }
  for(const p of ['/privacy.html','/order.html','/launch-v49.css?v=249']){
    try{const r=await fetch(base+p,{signal:AbortSignal.timeout(20000)});report.pages.push({path:p,status:r.status,contentType:r.headers.get('content-type')});if(!r.ok)report.failures.push(p+' unavailable');}catch(e){report.pages.push({path:p,error:e.message});report.failures.push(p+' inaccessible');}
  }
  for(const [engine,width,height] of [[webkit,393,852],[chromium,320,740],[chromium,768,1024],[chromium,1440,1000]]){
    const browser=await engine.launch();const name=engine.name()+'-'+width;
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
    const blocked=[],errors=[],failed=[];
    await context.route('**/*',async route=>{const r=route.request();if(!['GET','HEAD','OPTIONS'].includes(r.method())){blocked.push({method:r.method(),path:new URL(r.url()).pathname});return route.abort('blockedbyclient');}return route.continue();});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),path:new URL(r.url()).pathname});});
    try{
      const response=await page.goto(base+'/?launch-audit='+Date.now(),{waitUntil:'networkidle',timeout:45000});
      // Test-only eager decoding verifies off-screen rail items without changing the site.
      await page.evaluate(async()=>{const imgs=[...document.images];imgs.forEach(i=>i.loading='eager');await Promise.race([Promise.all(imgs.map(i=>i.decode().catch(()=>null))),new Promise(r=>setTimeout(r,10000))]);});
      await page.screenshot({path:out+'/'+name+'-top.png'});
      const metrics=await page.evaluate(()=>{
        const rect=s=>{const n=document.querySelector(s);if(!n)return null;const b=n.getBoundingClientRect(),c=getComputedStyle(n);return {x:b.x,y:b.y,width:b.width,height:b.height,display:c.display,background:c.backgroundImage};};
        const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
        return {build:document.body.dataset.launchBuild,title:document.title,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,hero:rect('.hero'),flow:rect('.hero-live-flow'),product:rect('.hero-live-product'),header:rect('.site-header'),styles:[...document.querySelectorAll('link[rel=stylesheet]')].map(x=>x.getAttribute('href')),products:document.querySelectorAll('#product-grid .product').length,worlds:document.querySelectorAll('#style-grid .style-card').length,brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>({src:i.getAttribute('src'),alt:i.alt})),pendingImages:[...document.images].filter(i=>!i.complete).map(i=>i.getAttribute('src')),duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),badAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1)))};
      });
      await page.locator('.hero').screenshot({path:out+'/'+name+'-hero.png'});
      await page.locator('.hero-secondary-cta').click();await pause(300);
      const shopReached=await page.evaluate(()=>{const b=document.querySelector('#shop').getBoundingClientRect();return b.top<innerHeight&&b.bottom>0});
      await page.screenshot({path:out+'/'+name+'-shop.png'});
      await page.locator('.site-header .nav-cta').click();await pause(300);
      const firstStep=await page.locator('[data-create-step="0"]').isVisible();
      await page.locator('[data-create-step="0"] [data-go-step="1"]').click();
      const photoStep=await page.locator('[data-create-step="1"]').isVisible();
      await page.locator('[data-create-step="1"] [data-go-step="2"]').click();
      const emptyPhotoBlocked=await page.locator('[data-create-step="1"]').isVisible();
      await page.screenshot({path:out+'/'+name+'-create.png'});
      report.browsers.push({name,http:response.status(),metrics,shopReached,firstStep,photoStep,emptyPhotoBlocked,errors,failed,blocked});
      if(metrics.build!=='RM-049.1')report.failures.push(name+': wrong production build');
      if(metrics.scrollWidth>width+1)report.failures.push(name+': horizontal page overflow');
      if(metrics.products!==12)report.failures.push(name+': missing product cards');
      if(metrics.badAnchors.length||metrics.duplicateIds.length||metrics.brokenImages.length)report.failures.push(name+': broken content structure or images');
      if(!shopReached||!firstStep||!photoStep||!emptyPhotoBlocked||errors.length)report.failures.push(name+': browsing/wizard failure');
      if(metrics.product.x<0||metrics.product.x+metrics.product.width>width+1)report.failures.push(name+': hero product exceeds viewport');
    }catch(e){report.browsers.push({name,error:e.message,errors,failed,blocked});report.failures.push(name+': '+e.message);}
    await browser.close();
  }
  const config=report.health.find(x=>x.path==='/api/public-config')?.body;
  const model=report.health.find(x=>x.path==='/api/model-status')?.body;
  report.launchGates={botProtectionConfigured:!!config?.turnstileSiteKey,aiCallLimitConfigured:!!model?.renderControls?.configured,liveGenerationTested:false,paidCheckoutTested:false,privateFulfillmentJobInspected:false};
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  console.log('RECAST_AUDIT_REPORT\n'+JSON.stringify(report,null,2));
  if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
