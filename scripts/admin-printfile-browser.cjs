// Isolated UI fixture: no real Printful API, admin auth, orders or paid actions.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const engine=process.env.RECAST_BROWSER==='webkit'?'webkit':'chromium';
 const browser=await (engine==='webkit'?webkit:chromium).launch(
  engine==='webkit'?{}:process.env.RECAST_CHROMIUM_PATH?{executablePath:process.env.RECAST_CHROMIUM_PATH}:{});
 try{for(const width of [320,393,1280]){
  const context=await browser.newContext({viewport:{width,height:830}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  let calls=0,forbidden=0;
  const fixture='<meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/admin-printfile-audit.css?v=1"><button type="button" data-tab="ready-made-qa">Ready-Made QA</button><h2>Printful print-area readiness</h2><button id="printfile-audit-refresh">Refresh print areas</button><p id="printfile-audit-status"></p><div id="printfile-audit-list"></div><script type="module" src="/admin-printfile-audit.js?v=1"></script>';
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url()),p=u.pathname;
   if(u.hostname!=='recast.test')return route.fulfill({status:404});
   if(route.request().method()!=='GET'){forbidden++;return route.fulfill({status:405});}
   if(p==='/ui.html')return route.fulfill({contentType:'text/html',body:fixture});
   if(p==='/api/shop/printfile-audit'){
    calls++;
    return route.fulfill({json:{ok:true,products:[
     {product:'Coaster 4-Pack',status:'complete',variants:[{sku:'RECAST-COASTER-SET',area:{width:1122,height:1122,dpi:300},status:'supplier_proof_still_required',fullPixelsMeetSupplierArea:true}]},
     {product:'Blanket',status:calls>1?'complete':'not_started',variants:calls>1?[{sku:'RECAST-BLANKET-50X60',area:{width:7500,height:9000,dpi:150},status:'higher_resolution_master_needed',fullPixelsMeetSupplierArea:false}]:[]},
     {product:'Canvas',status:'needs_review',code:'supplier_template_missing',variants:[]}
    ]}});
   }
   const file=path.resolve('public','.'+p);
   if(!file.startsWith(path.resolve('public')+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
   return route.fulfill({contentType:p.endsWith('.css')?'text/css':'application/javascript',body:fs.readFileSync(file)});
  });
  await page.goto('https://recast.test/ui.html');
  await page.getByRole('button',{name:'Ready-Made QA'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.printfile-audit-item').length===3);
  assert.match(await page.locator('#printfile-audit-status').innerText(),/1 of 3 product templates checked/);
  assert.equal(await page.locator('.printfile-audit-item').count(),3);
  await page.locator('.printfile-audit-item').first().locator('summary').click();
  assert.match(await page.locator('.printfile-audit-item').first().innerText(),/1122 × 1122 px/);
  assert.match(await page.locator('.printfile-audit-item').first().innerText(),/proof still required/i);
  assert.equal(await page.getByRole('button',{name:/Add to cart|Buy now|Approve product|Send to Printful/}).count(),0);
  await page.getByRole('button',{name:'Refresh print areas'}).click();
  await page.waitForFunction(()=>document.getElementById('printfile-audit-status').textContent.includes('2 of 3'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No phone overflow');
  assert.equal(forbidden,0);
  assert.deepEqual(errors,[]);
  console.log('PASS non-mug Printful template status UI',engine,width);
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
