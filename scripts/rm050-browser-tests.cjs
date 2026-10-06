// Local-source browser regression. Every network request is intercepted: no live account/provider writes.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('public'),out=path.resolve('rm050-browser-results');fs.mkdirSync(out,{recursive:true});
const ready={ok:true,local:{ready:true},modes:{high:{ready:true,state:'ready'},quick:{ready:true,state:'ready'}}};
const policy={highDaily:3,standardDaily:5,purchaseBonus:3,websiteCalls:70,socialCalls:100,budgetCents:500,paused:false};
(async()=>{
 const report={type:'Mocked APIs and image placeholders; not a live provider or visual-art acceptance test',checks:[],failures:[]};
 for(const [engine,width] of [[webkit,393],[chromium,320],[chromium,1440]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const state={remaining:3,free:3,bonus:0,standardRemaining:5,busy:false,settings:{...policy},revision:0,saved:[]},errors=[];
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),p=url.pathname;
   if(url.hostname!=='recast.test'){
    if(request.resourceType()==='image')return route.fulfill({body:fs.readFileSync(path.join(root,'assets/world-game-v18.webp')),contentType:'image/webp'});
    return route.abort();
   }
   if(!p.startsWith('/api/')){
    const file=path.resolve(root,'.'+(p==='/'?'/index.html':p));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'not found'});
    const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
    return route.fulfill({body:fs.readFileSync(file),contentType:mime});
   }
   let d={ok:true};
   if(p==='/api/render-credits')d={...d,enabled:true,initialized:true,freeAllowance:3,standardAllowance:5,purchaseBonus:3,resetAt:'2026-10-07T20:00:00Z',standardResetAt:'2026-10-07T20:00:00Z',...Object.fromEntries(['remaining','free','bonus','standardRemaining'].map(k=>[k,state[k]]))};
   else if(p==='/api/request/RC-TEST0001-ABCDEF/preview')d={ok:true,watermarked:true,image:'data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/world-game-v18.webp')).toString('base64')};
   else if(p==='/api/public-config')d.turnstileSiteKey=null;
   else if(p==='/api/render-readiness'){d=structuredClone(ready);d.modes.high.ready=!state.busy;}
   else if(p==='/api/model-status')d={ok:true,modes:{high:{label:'High Quality',model:'dev'},quick:{label:'Standard',model:'klein9'}},availability:ready};
   else if(p==='/api/checkout-options')d.products=[{title:'Custom Recast Mug',status:'ACTIVE',variants:[{sku:'RECAST-MUG-11OZ',variantTitle:'11 oz',price:'24.99'}]}];
   else if(p==='/api/admin/status')Object.assign(d,{jobs:{total:1,awaiting:1},trends:{review:0},xRequests:0,connections:{printful:true,admin:true},generationErrors:{total:0,recent:0},automation:{}});
   else if(p==='/api/admin/jobs')Object.assign(d,{jobs:[{id:'fixture',orderName:'#TEST',product:'Mug',sku:'TEST',requestId:'TEST',status:'owner_release_review',ownerReleaseError:'<img onerror="alert(1)">',quantity:1,digital:false}],cursor:null});
   else if(p==='/api/admin/social')d.requests=[];
   else if(p==='/api/admin/trends')d.trends=[];
   else if(p==='/api/admin/generation-errors')d.errors=[];
   else if(p==='/api/admin/render-readiness')Object.assign(d,{render:{lastResult:'not tested',checkedAt:null},social:{}});
   else if(p==='/api/admin/owner-settings'){
    if(request.method()==='POST'){const body=request.postDataJSON();state.settings=body.values;state.revision++;state.saved.push(body);}
    Object.assign(d,{revision:state.revision,values:state.settings,history:[],usage:{day:'2026-10-06',websiteCalls:0,highCalls:0,standardCalls:0,socialCalls:0,reservedCents:0},connections:{creditsEnabled:true,socialEnabled:false,botProtection:false},engines:{high:'dev',standard:'klein9',social:'klein4'},note:'Test fixture'});
   }else if(!['GET','HEAD'].includes(request.method())){errors.push('Unexpected write '+p);return route.abort();}
   return route.fulfill({json:d});
  });
  await context.addInitScript(()=>localStorage.setItem('recast_last_request',JSON.stringify({requestId:'RC-TEST0001-ABCDEF',accessToken:'fixture-token'})));
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(12000);
  try{
   await page.goto('http://recast.test/',{waitUntil:'networkidle'});
   assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   assert.equal((await page.locator('#render-credits').textContent()).includes('Standard:'),false);
   await page.locator('.product-design-controls').waitFor({state:'attached'});assert.equal(await page.locator('.product-design-controls').count(),1);
   assert.equal(await page.locator('[data-design-layout]').isHidden(),true);
   await page.locator('.product-design-controls summary').click();assert.equal(await page.locator('[data-design-layout]').isVisible(),true);
   await page.locator('[data-reset-design]').click();assert.equal(await page.locator('[data-design-layout]').isHidden(),true);
   state.busy=true;await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   Object.assign(state,{busy:false,remaining:0,free:0});await page.reload({waitUntil:'networkidle'});
   await page.locator('[data-create-step="0"] [data-go-step="1"]').click();
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   await page.locator('[data-create-step="1"] [data-go-step="2"]').click();
   assert.equal(await page.locator('#quality-fallback').isVisible(),true);
   assert.match(await page.locator('#quality-fallback-reason').textContent(),/3 bonus High Quality/);
   await page.locator('#choose-standard').click();assert.equal(await page.locator('input[name="qualityMode"][value="quick"]').isChecked(),true);
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-customer.png`)});
   Object.assign(state,{remaining:3,bonus:3});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(500);
   assert.equal(await page.locator('input[name="qualityMode"][value="high"]').isChecked(),true);assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   await page.goto('http://recast.test/admin.html',{waitUntil:'networkidle'});
   await page.locator('#admin-token').fill('fixture-not-a-real-secret');await page.locator('#admin-login button').click();await page.waitForTimeout(300);
   await page.locator('[data-tab="limits"]').click();assert.equal(await page.locator('[name="purchaseBonus"]').inputValue(),'3');
   await page.locator('[name="highDaily"]').fill('2');await page.locator('#owner-settings-form [type="submit"]').click();await page.waitForTimeout(200);
   assert.equal(state.saved.at(-1).values.highDaily,2);
   page.on('dialog',d=>d.accept());await page.locator('[name="budgetCents"]').fill('6.00');await page.locator('#owner-settings-form [type="submit"]').click();await page.waitForTimeout(200);
   assert.equal(state.saved.at(-1).confirm,'INCREASE_LIMITS');
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-admin.png`)});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'admin overflow');assert.deepEqual(errors,[]);
   report.checks.push({engine:engine.name(),width,hqOnly:true,outageHidesStandard:true,exhaustionWarning:true,bonusReturnsToHQ:true,collapsedEditsAndReset:true,adminSettingsSave:true,higherBudgetConfirmed:true,pageErrors:errors});
  }catch(e){report.failures.push({engine:engine.name(),width,error:e.stack,pageErrors:errors});await page.screenshot({path:path.join(out,`${engine.name()}-${width}-failure.png`)}).catch(()=>{});}
  await browser.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
