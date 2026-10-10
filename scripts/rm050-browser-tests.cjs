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
  const state={remaining:3,free:3,bonus:0,standardRemaining:5,busy:false,hqOutage:false,quickDown:false,settings:{...policy},revision:0,saved:[]},errors=[];
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
   else if(p==='/api/render-readiness'){d=structuredClone(ready);d.modes.high.ready=!state.busy&&!state.hqOutage;d.modes.high.reason=state.hqOutage?'unavailable':null;d.modes.quick.ready=!state.quickDown;d.standardOutageAvailable=state.hqOutage&&!state.quickDown;}
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
   assert.equal(await page.locator('#render-time-hint').count(),0,'Only the waiting screen contains the time estimate');
   const timerStyles=await page.evaluate(()=>{
    const loader=document.querySelector('#loading');
    loader.classList.remove('hidden');loader.classList.add('render-wait-active');
    const info=['#generation-clock','.render-clock-icon'].map(selector=>{
      const el=loader.querySelector(selector),computed=getComputedStyle(el),box=el.getBoundingClientRect();
      return {animation:computed.animationName,transform:computed.transform,border:computed.borderTopWidth,width:box.width,height:box.height};
    });
    loader.classList.remove('render-wait-active');loader.classList.add('hidden');
    return info;
   });
   for(const part of timerStyles){
     assert.equal(part.animation,'none','Elapsed time and clock icon must never spin');
     assert.equal(part.transform,'none','Elapsed timer must be stationary');
     assert.equal(part.border,'0px','Elapsed timer must not inherit spinner rings');
     assert.ok(part.width>0&&part.height<35,'Timer typography must be a readable single line');
   }
   assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 5 of 5 daily previews left \(0 used\)/,'Show Standard allowance before it unlocks');
   await page.locator('.product-design-controls').waitFor({state:'attached'});assert.equal(await page.locator('.product-design-controls').count(),1);
   assert.equal(await page.locator('[data-design-layout]').isHidden(),true);
   await page.locator('.product-design-controls summary').click();assert.equal(await page.locator('[data-design-layout]').isVisible(),true);
   await page.locator('[data-reset-design]').click();assert.equal(await page.locator('[data-design-layout]').isHidden(),true);
   state.busy=true;await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   Object.assign(state,{busy:false,remaining:0,free:0,standardRemaining:4});await page.reload({waitUntil:'networkidle'});
   await page.locator('[data-create-step="0"] [data-go-step="1"]').click();
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   await page.locator('[data-create-step="1"] [data-go-step="2"]').click();
   assert.equal(await page.locator('#quality-fallback').isVisible(),true);
   assert.match(await page.locator('#quality-fallback-reason').textContent(),/3 bonus High Quality/);
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 4 of 5 daily previews left \(1 used\)/,'Show Standard allowance and used count while eligible');
   assert.equal(await page.locator('#render-credits').evaluate(node=>getComputedStyle(node).whiteSpace),'pre-line','Separate credit balances should be readable on mobile');
   await page.locator('#choose-standard').click();assert.equal(await page.locator('input[name="qualityMode"][value="quick"]').isChecked(),true);
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-customer.png`)});
   // Real owner case: both free allowances used; show a reset notice rather
   // than presenting a Standard CTA that cannot be clicked.
   Object.assign(state,{standardRemaining:0});
   await page.reload({waitUntil:'networkidle'});
   await page.locator('[data-create-step="0"] [data-go-step="1"]').click();
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   await page.locator('[data-create-step="1"] [data-go-step="2"]').click();
   assert.equal(await page.locator('#choose-standard').isHidden(),true,'Spent Standard should never look actionable');
   assert.equal(await page.locator('#standard-limit-status').isVisible(),true,'Show a conspicuous Standard reset notice');
   assert.match(await page.locator('#standard-limit-status').textContent(),/Standard used up — 0 of 5 left/);
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 0 of 5 daily previews left \(5 used\)/);
   Object.assign(state,{remaining:3,bonus:3,standardRemaining:4});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(500);
   assert.equal(await page.locator('input[name="qualityMode"][value="high"]').isChecked(),true);assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   // HQ providers are genuinely unavailable, but Standard's separate Cloudflare
   // model is not known to be down: explicit warning and explicit customer opt-in.
   Object.assign(state,{hqOutage:true,quickDown:false,remaining:3,free:3,bonus:0,standardRemaining:4});
   // A quality change refreshes the readiness API immediately, without
   // resetting the three-step creation wizard (a reload hides this panel).
   await page.locator('input[name="qualityMode"][value="high"]').dispatchEvent('change');
   await page.waitForFunction(()=>!document.querySelector('#quality-fallback').hidden);
   assert.equal(await page.locator('#quality-fallback').isVisible(),true);
   assert.match(await page.locator('#quality-fallback-reason').textContent(),/different Cloudflare model/);
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 4 of 5 daily previews left \(1 used\)/,'Approved outage also displays Standard credits');
   await page.locator('#choose-standard').click();
   assert.equal(await page.locator('input[name="qualityMode"][value="quick"]').isChecked(),true);
   assert.equal(await page.locator('#generate-button').isEnabled(),true);
   // When any approved HQ host recovers, restore HQ by default without a Standard render.
   Object.assign(state,{hqOutage:false});
   await page.locator('input[name="qualityMode"][value="quick"]').dispatchEvent('change');
   await page.waitForFunction(()=>document.querySelector('input[name="qualityMode"][value="high"]').checked&&document.querySelector('#quality-fallback').hidden);
   assert.equal(await page.locator('input[name="qualityMode"][value="high"]').isChecked(),true);
   assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   Object.assign(state,{hqOutage:false,quickDown:false,remaining:3,free:3,bonus:3});
   await page.goto('http://recast.test/admin.html',{waitUntil:'networkidle'});
   await page.locator('#admin-token').fill('fixture-not-a-real-secret');await page.locator('#admin-login button').click();await page.waitForTimeout(300);
   // With nine admin sections, all mobile tabs must remain real tappable targets,
   // without widening the 320px screen or hiding Analytics offscreen.
   async function tapAdminTab(value){
     const tab=page.locator('[data-tab="'+value+'"]');
     await tab.evaluate(node=>node.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));
     const target=await tab.evaluate(node=>{
       const rect=node.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
       const hit=document.elementFromPoint(x,y);
       return {x,y,hit:Boolean(hit&&(hit===node||node.contains(hit)))};
     });
     assert.ok(target.hit,'Admin '+value+' tab must receive a real mobile pointer click');
     await page.mouse.click(target.x,target.y);
   }
   await tapAdminTab('traffic');
   assert.equal(await page.locator('[data-panel="traffic"]').isVisible(),true);
   await tapAdminTab('limits');assert.equal(await page.locator('[name="purchaseBonus"]').inputValue(),'3');
   await page.locator('[name="highDaily"]').fill('2');
   const saveOwner=page.locator('#owner-settings-form [type="submit"]');
   // WebKit intermittently never considers this button "stable" after a long
   // mobile scroll. Verify the pointer hit target, then send a real mouse click
   // instead of a synthetic DOM form.submit() or disabling the assertion.
   async function saveByPointer(){
    await saveOwner.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
    const target=await saveOwner.evaluate(node=>{
      const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
      const hit=document.elementFromPoint(x,y);
      return {x,y,visible:r.width>0&&r.height>0,receivesPointer:Boolean(hit&&(hit===node||node.contains(hit)))};
    });
    assert.ok(target.visible&&target.receivesPointer,'Save settings button must be a visible mobile pointer target');
    await page.mouse.click(target.x,target.y);await page.waitForTimeout(300);
   }
   await saveByPointer();
   assert.equal(state.saved.at(-1).values.highDaily,2);
   page.on('dialog',d=>d.accept());await page.locator('[name="budgetCents"]').fill('6.00');await saveByPointer();
   assert.equal(state.saved.at(-1).confirm,'INCREASE_LIMITS');
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-admin.png`)});
   const adminOverflow=await page.evaluate(()=>{
    const width=innerWidth,scrollWidth=document.documentElement.scrollWidth;
    const offenders=[...document.querySelectorAll('body *')].filter(el=>{
      const computed=getComputedStyle(el),r=el.getBoundingClientRect();
      if(computed.display==='none'||computed.position==='fixed'||computed.visibility==='hidden')return false;
      return r.width>0&&r.right>width+2;
    }).slice(0,14).map(el=>{
      const r=el.getBoundingClientRect();return {selector:el.id?'#'+el.id:(el.tagName.toLowerCase()+'.'+String(el.className).slice(0,50)),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)};
    });
    return {width,scrollWidth,offenders};
   });
   assert.ok(adminOverflow.scrollWidth<=adminOverflow.width+1,'admin overflow '+JSON.stringify(adminOverflow));assert.deepEqual(errors,[]);
   await page.goto('http://recast.test/model-lab.html',{waitUntil:'networkidle'});
   // WebKit's stability heuristic can time out on a moving button despite
   // it being an actual pointer target. Assert hit-testing and click the
   // visible button with a real pointer event, as in the admin flow above.
   const demoButton=page.locator('#use-demo-dog');
   await demoButton.evaluate(node=>node.scrollIntoView({block:'center',behavior:'instant'}));
   const demoTarget=await demoButton.evaluate(node=>{
     const r=node.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
     const hit=document.elementFromPoint(x,y);
     return {x,y,visible:r.width>0&&r.height>0,receivesPointer:Boolean(hit&&(hit===node||node.contains(hit)))};
   });
   assert.ok(demoTarget.visible&&demoTarget.receivesPointer,'Demo dog button must be a visible mobile pointer target');
   await page.mouse.click(demoTarget.x,demoTarget.y);
   // The button loads a public WebP asynchronously; clicking ends before fetch.
   // Wait for the actual completion message before asserting selected controls.
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Demo dog loaded'),null,{timeout:15000});
   assert.equal(await page.locator('#host').inputValue(),'fal');
   assert.equal(await page.locator('#engine').inputValue(),'dev');
   assert.equal(await page.locator('#subject').inputValue(),'pet');
   const demo=await page.locator('#reference').evaluate(input=>({count:input.files?.length,name:input.files?.[0]?.name,size:input.files?.[0]?.size}));
   assert.equal(demo.count,1);assert.match(demo.name,/jack-russell/i);assert.ok(demo.size>1000);
   assert.match(await page.locator('#status').textContent(),/Demo dog loaded/);
   assert.deepEqual(errors,[]);

   report.checks.push({engine:engine.name(),width,hqOnly:true,outageHidesStandard:true,exhaustionWarning:true,bonusReturnsToHQ:true,collapsedEditsAndReset:true,adminSettingsSave:true,higherBudgetConfirmed:true,modelLabDemoDog:true,pageErrors:errors});
  }catch(e){report.failures.push({engine:engine.name(),width,error:e.stack,pageErrors:errors});await page.screenshot({path:path.join(out,`${engine.name()}-${width}-failure.png`)}).catch(()=>{});}
  await browser.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
