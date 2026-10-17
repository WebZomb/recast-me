// Local-source browser regression. Every network request is intercepted: no live account/provider writes.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('public'),out=path.resolve('rm050-browser-results');fs.mkdirSync(out,{recursive:true});
const ready={ok:true,local:{ready:true},modes:{high:{ready:true,state:'ready'},quick:{ready:true,state:'ready'}}};
const policy={highDaily:3,standardDaily:5,purchaseBonus:3,websiteCalls:70,socialCalls:100,budgetCents:500,paused:false};
(async()=>{
 const report={type:'Mocked APIs and image placeholders; not a live provider or visual-art acceptance test',checks:[],failures:[]};
 for(const [engine,width] of (process.env.RECAST_CHROMIUM_ONLY==='1'?[[chromium,320],[chromium,1440]]:[[webkit,393],[chromium,320],[chromium,1440]])){
  const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const state={remaining:3,free:3,bonus:0,standardRemaining:5,busy:false,hqOutage:false,quickDown:false,settings:{...policy},revision:0,saved:[],checkouts:[],mockups:[],previewReads:[]},errors=[];
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url()),p=url.pathname;
   // WebKit can route local blob images; never replace generated pixels with CDN fixtures.
   if(url.protocol==='blob:'||url.protocol==='data:')return route.continue();
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
   else if(/^\/api\/request\/RC-TEST000[1-6]-ABCDEF\/preview$/.test(p)){state.previewReads.push(p);d={ok:true,watermarked:true,image:'data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/world-game-v18.webp')).toString('base64')};}
   else if(p==='/api/subject-detection')d={subject:state.detectedSubject||'auto'};
   else if(p==='/api/public-config')d.turnstileSiteKey=null;
   else if(p==='/api/render-readiness'){d=structuredClone(ready);d.modes.high.ready=!state.busy&&!state.hqOutage;d.modes.high.reason=state.hqOutage?'unavailable':null;d.modes.quick.ready=!state.quickDown;d.standardOutageAvailable=state.hqOutage&&!state.quickDown;}
   else if(p==='/api/model-status')d={ok:true,modes:{high:{label:'High Quality',model:'dev'},quick:{label:'Standard',model:'klein9'}},availability:ready};
   else if(p==='/api/checkout-options')d.products=[{title:'Custom Recast Mug',status:'ACTIVE',variants:[{sku:'RECAST-MUG-11OZ',variantTitle:'11 oz',price:'24.99'}]}];
   else if(p==='/api/checkout-link'){state.checkouts.push(request.postDataJSON());return route.fulfill({status:503,json:{ok:false,error:'Test checkout unavailable — your artwork is saved.'}});}
   else if(p==='/api/mockup/create'){state.mockups.push(request.postDataJSON());await new Promise(r=>setTimeout(r,800));d={ok:true,mockupId:'fixture-mockup'};}
   else if(p==='/api/mockup/status')d={ok:true,status:'completed',images:[{title:'Front',url:'http://recast.test/assets/world-game-v18.webp'}]};
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
   // RM160: regression for the previously EMPTY mobile glass panel. An old
   // site-wide !important rule hid every non-CTA nav link under 980px.
   const visibleDock=await page.evaluate(()=>{
     const dock=document.querySelector('nav.recast-mobile-nav');
     if(!dock)return null;
     const parent=dock.parentElement;
     const links=[...dock.querySelectorAll('a')];
     return {
       inHeader:parent?.classList?.contains('site-header')||false,
       dockStyle:getComputedStyle(dock).display,
       children:links.map(a=>{
         const s=getComputedStyle(a),r=a.getBoundingClientRect();
         return {text:a.textContent.trim(),display:s.display,visible:s.visibility,opacity:s.opacity,
                 area:r.width*r.height,withinViewport:r.left>=0&&r.right<=innerWidth+1}
       }),
       horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2
     };
   });
   assert.ok(visibleDock,'The website navigation dock must exist');
   assert.equal(visibleDock.children.length,5,'There must be five visible buttons including Specials');
   assert.deepEqual(visibleDock.children.map(x=>x.text),['Create','My Recasts','My Orders','Specials','Guide']);
   assert.ok(visibleDock.children.every(x=>x.display!=='none'&&x.visible==='visible'&&x.opacity!=='0'&&x.area>=500&&x.withinViewport),
     'All five black buttons must be visible and tappable '+JSON.stringify(visibleDock));
   assert.equal(visibleDock.inHeader,width>=1060,'Desktop glass dock must live in the header, phone dock at the bottom');
   assert.equal(visibleDock.horizontalOverflow,false,'The glass dock must not cause horizontal overflow');
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm160-glass-nav.png`)});
   assert.equal(await page.locator('#product-grid').evaluate(e=>getComputedStyle(e).display),'grid','Checkout catalog must not inherit the block-style landing carousel');
   await page.locator('.site-header .nav-cta').click();
   // A customer unfamiliar with AI must see both paths immediately, not a
   // buried "no AI" accordion after all the adventure and consent controls.
   const aiChoice=page.locator('#choose-create-ai'),originalChoice=page.locator('#choose-original-photo');
   assert.equal(await aiChoice.isVisible(),true,'AI creation is a large first choice');
   assert.equal(await originalChoice.isVisible(),true,'Original-photo option is equally visible up front');
   assert.equal(await originalChoice.getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('#photo-shopping-outage').isHidden(),true);
   await page.locator('[data-use-original]').click();
   assert.equal(await originalChoice.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#recast-form').isHidden(),true,'Hide unrelated AI controls when original is chosen');
   assert.equal(await page.locator('#original-photo-form').isVisible(),true,'Original upload and consent become immediate');
   assert.equal(await page.locator('#original-photo').count(),1,'Reuse the existing private upload; never duplicate it');
   assert.equal(await page.locator('#original-consent').count(),1,'One original-photo consent');
   assert.match(await page.locator('#original-photo-form button[type="submit"]').textContent(),/Continue with My Photo/);
   await aiChoice.click();
   assert.equal(await originalChoice.getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('#original-photo-form').isHidden(),true);
   assert.equal(await page.locator('#recast-form').isVisible(),true,'Returning to AI preserves the wizard');
   assert.equal(await page.locator('.creation-progress button').count(),2,'Only Photos and Style are required');
   assert.equal(await page.locator('[data-create-step="1"]').isVisible(),true,'Upload comes first with no Who step');
   assert.equal(await page.locator('#subject').inputValue(),'auto','Image editor recognizes the photo content by default');
   assert.equal(await page.locator('#photo-subject-details').getAttribute('open'),null,'Advanced group options are collapsed');
   // Customer should never have to identify their pet/person; only a complex
   // group photo can opt into manual hints, then return to automatic mode.
   await page.locator('#photos').setInputFiles([
    path.join(root,'assets/jack-russell-source-v18.webp'),
    path.join(root,'assets/dog-original-v17.webp')
   ]);
   assert.equal(await page.locator('.reference-label').count(),0,'Two photos are automatic by default');
   assert.match(await page.locator('#photo-include-summary').textContent(),/Automatic/);
   assert.equal(await page.locator('#change-photo-subject').count(),1,'One inclusion disclosure');
   assert.equal(await page.getByText('Choose who to include (optional)',{exact:true}).count(),0);
   await page.locator('#change-photo-subject').focus();
   await page.keyboard.press('Enter');
   await page.locator('#select-photo-faces').click();
   await page.locator('.focus-surface').first().click({position:{x:40,y:40}});
   assert.equal(await page.locator('.face-marker').count(),1);
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm124-faces.png`),fullPage:false});
   await page.locator('[data-focus-done]').click();
   assert.match(await page.locator('#select-photo-faces').textContent(),/Change selected faces/);
   await page.locator('[data-subject-choice="person and pet"]').click();
   assert.equal(await page.locator('.reference-label').count(),2,'Optional labels only appear when group help is requested');
   await page.locator('#change-photo-subject').click();
   await page.locator('[data-subject-choice="auto"]').click();
   assert.equal(await page.locator('.reference-label').count(),0,'Manual choice can be undone without losing photos');
   assert.equal(await page.locator('#photos').evaluate(x=>x.files.length),2);
   // A second picker selection must REPLACE the old photos, not silently
   // turn a new dog portrait into a dog + stale person/car multi-subject render.
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   assert.equal(await page.locator('#photos').evaluate(x=>x.files.length),1,'New upload must replace previously selected photos');
   assert.equal(await page.locator('.photo-thumbnail').count(),1,'Only the new photo can appear in the preview');
   assert.equal(await page.locator('#subject').inputValue(),'auto');
   assert.match(await page.locator('#select-photo-faces').textContent(),/Select specific faces/);
   // Deliberately selected multi-photo references still work in one operation.
   await page.locator('#photos').setInputFiles([
    path.join(root,'assets/jack-russell-source-v18.webp'),
    path.join(root,'assets/dog-original-v17.webp')
   ]);
   assert.equal(await page.locator('#photos').evaluate(x=>x.files.length),2,'Explicit two-photo selection still works');

   assert.equal(await page.locator('#all-worlds-group').isHidden(),true,'Advanced worlds are optional by default');
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
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 5 left/,'Keep both balances readable at a glance');
   await page.locator('.product-design-controls').waitFor({state:'attached'});assert.equal(await page.locator('.product-design-controls').count(),1);
   assert.equal(await page.locator('[data-design-layout]').isHidden(),true);
   await page.locator('.product-design-controls summary').click();assert.equal(await page.locator('[data-design-layout]').isVisible(),true);
   await page.locator('[data-reset-design]').click();assert.equal(await page.locator('[data-design-layout]').isHidden(),true);
   state.busy=true;await page.reload({waitUntil:'networkidle'});assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   Object.assign(state,{busy:false,remaining:0,free:0,standardRemaining:4});await page.reload({waitUntil:'networkidle'});
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   assert.equal(await page.locator('.reference-label').count(),0,'No hard-coded Your pet label for single uploads');
   assert.equal(await page.locator('#subject').inputValue(),'auto');
   await page.locator('[data-create-step="1"] [data-go-step="2"]').click();
   assert.equal(await page.locator('#all-worlds-group').isHidden(),true);
   assert.equal(await page.locator('#surprise-world').isVisible(),true,'Surprise me is a clear alternative');
   await page.waitForFunction(()=>document.querySelector('#photo-thumbnails img')?.naturalWidth>0);
   assert.ok(await page.locator('#photo-thumbnails img').first().evaluate(img=>Math.max(img.naturalWidth,img.naturalHeight)<=480),'Upload display retains a small copy');
   await page.locator('.adventure-extra-actions').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm141-style-cards.png`)});
   for(const [selector,asset] of [['#surprise-world','recast-surprise-cinematic-v160.webp'],['#more-adventures','recast-discover-cinematic-v160.webp']]){
    assert.equal(await page.locator(selector+' img').count(),1,'Each discovery control has a unique illustrated scene');
    assert.match(await page.locator(selector+' img').first().getAttribute('src'),new RegExp(asset.replaceAll('.','\\.')));
    assert.ok(await page.locator(selector).evaluate(button=>{const a=button.getBoundingClientRect(),b=button.parentElement.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1}),'Discovery card fits its container');
    assert.ok((await page.locator(selector).boundingBox()).height>=145,'Discovery card has a large tap target');
   }
   assert.match(await page.locator('[data-surprise-count]').textContent(),/Random pick · 47 styles/);
   assert.match(await page.locator('[data-style-count]').textContent(),/Explore 48 styles/);
   assert.equal(await page.locator('.discovery-art-v160').count(),2,'Cinematic illustrated portal and mystery scene appear');
   for(const img of await page.locator('#adventure-choices img').all()){
    assert.ok(await img.evaluate(el=>{const a=el.getBoundingClientRect(),b=el.parentElement.getBoundingClientRect();return Math.abs(a.top-b.top-2)<1&&Math.abs(a.width-(b.width-4))<1&&getComputedStyle(el).objectFit==='cover'}),'Featured images fill card edge to edge');
   }
   await page.locator('#surprise-world').click();
   assert.match(await page.locator('#adventure-selection-status').textContent(),/Selected: /,'Surprise mode always shows the chosen adventure');
   await page.locator('#more-adventures').click();
   assert.equal(await page.locator('#all-worlds-group').isVisible(),true,'All 48 adventures remain reachable on demand');
   assert.equal(await page.locator('#more-adventures').getAttribute('aria-expanded'),'true');
   await page.locator('#more-adventures').click();
   assert.equal(await page.locator('#all-worlds-group').isHidden(),true,'A long list can be closed again');
   assert.equal(await page.locator('#quality-fallback').isVisible(),true);
   assert.match(await page.locator('#quality-fallback-reason').textContent(),/High Quality is used up/);
   assert.equal(await page.locator('#generate-button').isHidden(),true,'Hide dead HQ CTA while offering Standard');
   assert.equal(await page.locator('#render-availability').isHidden(),true,'Do not repeat HQ exhaustion as separate banner');
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 4 left/,'Show Standard remaining while eligible');
   assert.match(await page.locator('#render-credits-details').textContent(),/Standard: 4 of 5 daily previews left \(1 used\)/,'Exact counts and resets remain available under details');
   await page.locator('#choose-standard').click();assert.equal(await page.locator('input[name="qualityMode"][value="quick"]').isChecked(),true);
   assert.equal(await page.locator('#generate-button').isVisible(),true,'Opting into Standard reveals the create action');
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-customer.png`)});
   // Real owner case: both free allowances used; show a reset notice rather
   // than presenting a Standard CTA that cannot be clicked.
   Object.assign(state,{standardRemaining:0});
   await page.reload({waitUntil:'networkidle'});
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   assert.equal(await page.locator('.reference-label').count(),0,'No hard-coded Your pet label for single uploads');
   assert.equal(await page.locator('#subject').inputValue(),'auto');
   await page.locator('[data-create-step="1"] [data-go-step="2"]').click();
   assert.equal(await page.locator('#choose-standard').isHidden(),true,'Spent Standard should never look actionable');
   assert.equal(await page.locator('#standard-limit-status').isHidden(),true,'Avoid duplicate zero-credits notice');
   assert.match(await page.locator('#render-credits-details').textContent(),/Standard: 0 of 5 daily previews left/);
   assert.equal(await page.locator('#generate-button').isHidden(),true,'No dead action after all credits are used');
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 0 left/);
   Object.assign(state,{remaining:3,bonus:3,standardRemaining:4});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(500);
   assert.equal(await page.locator('input[name="qualityMode"][value="high"]').isChecked(),true);assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   // HQ providers are genuinely unavailable, but Standard's separate Cloudflare
   // model is not known to be down: explicit warning and explicit customer opt-in.
   Object.assign(state,{hqOutage:true,quickDown:false,remaining:3,free:3,bonus:0,standardRemaining:4});
   // A quality change refreshes the readiness API immediately, without
   // resetting the two-step photo-first creator (a reload hides this panel).
   await page.locator('input[name="qualityMode"][value="high"]').dispatchEvent('change');
   await page.waitForFunction(()=>!document.querySelector('#quality-fallback').hidden);
   assert.equal(await page.locator('#quality-fallback').isVisible(),true);
   assert.match(await page.locator('#quality-fallback-reason').textContent(),/High Quality is unavailable/);
   assert.match(await page.locator('#photo-shopping-outage').textContent(),/High Quality AI is temporarily unavailable/);
   assert.match(await page.locator('#render-credits').textContent(),/Standard: 4 left/,'Approved outage also displays Standard credits');
   await page.locator('#choose-standard').click();
   assert.equal(await page.locator('input[name="qualityMode"][value="quick"]').isChecked(),true);
   assert.equal(await page.locator('#generate-button').isEnabled(),true);
   // When any approved HQ host recovers, restore HQ by default without a Standard render.
   Object.assign(state,{hqOutage:false});
   await page.locator('input[name="qualityMode"][value="quick"]').dispatchEvent('change');
   await page.waitForFunction(()=>document.querySelector('input[name="qualityMode"][value="high"]').checked&&document.querySelector('#quality-fallback').hidden);
   assert.equal(await page.locator('input[name="qualityMode"][value="high"]').isChecked(),true);
   assert.equal(await page.locator('#quality-fallback').isHidden(),true);
   assert.equal(await page.locator('#photo-shopping-outage').isHidden(),true,'Outage callout clears after recovery');
   Object.assign(state,{hqOutage:false,quickDown:false,remaining:3,free:3,bonus:3});
   // Fast path still presents the exact selected artwork, and does not ask Printful for a mockup.
   await page.evaluate(()=>{window.__recastActiveRequest={requestId:'RC-TEST0001-ABCDEF',accessToken:'fixture-token'};const c=document.querySelector('#preview-canvas');c.width=400;c.height=500;c.getContext('2d').fillRect(0,0,400,500);document.dispatchEvent(new Event('recast-artwork-selected'));});
   const fast=page.locator('.recast-buy-now').first();await fast.waitFor({state:'visible'});
   assert.doesNotMatch(await page.locator('#product-grid').textContent(),/Estimated/);
   await fast.click();assert.equal(await page.locator('.fast-artwork img').count(),1);
   await page.locator('.final-review-panel').evaluate(el=>el.scrollTop=0);
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm124-fast.png`),fullPage:false});
   await page.locator('[data-fast-confirm]').click();await page.locator('.final-review-error:not([hidden])').waitFor();
   assert.equal(state.checkouts.length,1);assert.equal(state.mockups.length,0);assert.equal(state.checkouts[0].skipMockup,true);assert.equal(state.checkouts[0].confirmArtwork,true);assert.equal(state.checkouts[0].requestId,'RC-TEST0001-ABCDEF');
   assert.equal(await page.locator('[data-fast-confirm]').isEnabled(),true,'Failed checkout can retry without losing artwork');
   await page.keyboard.press('Escape');
   await page.locator('.product-design-controls > summary').first().click();
   assert.equal(await page.locator('[data-design-scale]').first().isHidden(),true,'Full mug panels have no ineffective size slider');
   await page.locator('[data-design-spacing]').first().selectOption('standard');
   await page.locator('[data-design-scale]').first().fill('100');
   assert.equal(await fast.isDisabled(),true,'Custom placement requires preview');await page.locator('[data-reset-design]').first().click();assert.equal(await fast.isEnabled(),true);
   await page.locator('.product-preview-action').first().click();
   assert.match(await page.locator('.product-preview-loading:not([hidden]) p').textContent(),/Estimated 20–45 seconds.*keep scrolling/);
   assert.equal(await page.locator('.product-mockup-note').filter({hasText:/Estimated/}).count(),0);
   await page.locator('.real-mockup-ready').waitFor({timeout:20000});
   assert.equal(state.mockups.length,1);assert.equal(await fast.isHidden(),true);await page.locator('.recast-buy').first().click();assert.match(await page.locator('#recast-review-title').textContent(),/Check your design/);
   await page.locator('[data-final-confirm]').click();await page.locator('.final-review-error:not([hidden])').waitFor();assert.equal(state.checkouts.length,2);assert.equal(state.checkouts[1].mockupId,'fixture-mockup');assert.equal(state.checkouts[1].skipMockup,undefined);
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm124-review.png`),fullPage:false});
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
   assert.equal(await page.locator('#engine').inputValue(),'nano-banana');
   assert.equal(await page.locator('#recipe').inputValue(),'concise');
   assert.equal(await page.locator('#subject').count(),0,'Model Lab uses automatic subject recognition');
   const demo=await page.locator('#reference').evaluate(input=>({count:input.files?.length,name:input.files?.[0]?.name,size:input.files?.[0]?.size}));
   assert.equal(demo.count,1);assert.match(demo.name,/jack-russell/i);assert.ok(demo.size>1000);
   assert.match(await page.locator('#status').textContent(),/Demo dog loaded/);
   // Saved history stays available without fetching all six images at startup.
   await page.evaluate(()=>localStorage.setItem('recast_recent_versions_v12',JSON.stringify(
     [1,2,3,4,5,6].map(n=>({requestId:`RC-TEST000${n}-ABCDEF`,accessToken:'fixture-token',styleName:'Saved test',createdAt:'2026-10-11T12:00:00Z'}))
   )));
   state.previewReads=[];
   await page.goto('http://recast.test/',{waitUntil:'networkidle'});
   assert.equal(state.previewReads.length,1,'Only active saved preview loads at startup');
   for(let i=0;i<6;i++){
     const card=page.locator(`[data-version-index="${i}"]`);
     await card.scrollIntoViewIfNeeded();
     await page.waitForFunction(index=>document.querySelector(`[data-version-index="${index}"] img`)?.naturalWidth>0,i,{timeout:12000});
   }
   assert.equal(new Set(state.previewReads).size,6,'Every saved version loads when approached');
   await page.locator('[data-version-index="5"] [data-history-action="use"]').click();
   await page.waitForFunction(()=>window.__recastActiveRequest?.requestId==='RC-TEST0006-ABCDEF');
   assert.deepEqual(errors,[]);

   // The live-upload suggestion is visible and editable; no extra wizard step.
   state.detectedSubject='pet';
   await page.goto('http://recast.test/',{waitUntil:'networkidle'});
   await page.locator('.site-header .nav-cta').click();
   await page.locator('#photos').setInputFiles(path.join(root,'assets/jack-russell-source-v18.webp'));
   await page.waitForFunction(()=>document.querySelector('#subject').value==='pet');
   assert.match(await page.locator('#photo-include-summary').textContent(),/Pets only/);
   assert.match(await page.locator('#subject-detection-status').textContent(),/Suggested/);
   await page.locator('#change-photo-subject').click();
   await page.locator('[data-subject-choice="person and pet"]').click();
   assert.equal(await page.locator('#subject').inputValue(),'person and pet');
   assert.match(await page.locator('#subject-detection-status').textContent(),/Your selection/);
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm140-subject.png`)});
   assert.deepEqual(errors,[]);

   // New static discovery page must remain readable without the creator app.
   await page.goto('http://recast.test/gift-ideas.html',{waitUntil:'networkidle'});
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://recastmeai.com/gift-ideas');
   const giftWidth=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(giftWidth.scroll<=giftWidth.width+1,'Gift guide horizontal overflow '+JSON.stringify(giftWidth));
   assert.equal(await page.locator('a[href="/#start"]').count(),4,'Gift guide includes the new Create tab alongside the original CTAs');
   await page.screenshot({path:path.join(out,`${engine.name()}-${width}-rm150-gift-guide.png`),fullPage:true});
   assert.deepEqual(errors,[]);
   report.checks.push({engine:engine.name(),width,hqOnly:true,outageHidesStandard:true,exhaustionWarning:true,bonusReturnsToHQ:true,collapsedEditsAndReset:true,adminSettingsSave:true,higherBudgetConfirmed:true,modelLabDemoDog:true,pageErrors:errors});
  }catch(e){report.failures.push({engine:engine.name(),width,error:e.stack,pageErrors:errors});await page.screenshot({path:path.join(out,`${engine.name()}-${width}-failure.png`)}).catch(()=>{});}
  await browser.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
