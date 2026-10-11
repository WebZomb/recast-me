// Production UI with isolated mock responses: no real render, order or X post.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[],calls=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(process.env.RECAST_LOCAL_CHECKOUT==='1')await page.route('**/*',route=>{
   const url=new URL(route.request().url());if(url.hostname!=='recastmeai.com')return route.abort();
   const path=require('node:path'),root=path.resolve('public'),file=path.resolve(root,'.'+url.pathname);
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Local test: unavailable'});
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream'});
  });
  const share='a'.repeat(40),requestId='RC-DEMO0001-ABCDEF';
  await page.route('**/api/social/**',async route=>{
   const req=route.request(),u=new URL(req.url());calls.push({path:u.pathname,method:req.method()});
   const action=u.pathname.split('/')[4];
   let data;
   if(!action)data={ok:true,requestId,styleName:'Original photo',image:'/api/social/'+share+'/image'};
   else if(action==='image')return route.fulfill({contentType:'image/webp',body:fs.readFileSync('public/assets/product-mug-v16.webp')});
   else if(action==='products')data={ok:true,products:[{title:'Custom Recast Mug',status:'ACTIVE',variants:[{sku:'RECAST-MUG-11OZ',variantTitle:'11 oz',price:'24.99'}]}]};
   else if(action==='mockup-create'){
    const body=req.postDataJSON();if(body.accessToken)throw new Error('Owner credential leaked');
    data={ok:true,mockupId:'mock-proof'};
   }else if(action==='mockup-status')data={ok:true,status:'completed',images:[{title:'Front',url:'/assets/product-mug-v16.webp'}]};
   else if(action==='checkout'){
    const body=req.postDataJSON();if(body.accessToken)throw new Error('Owner credential leaked');
    if(body.skipMockup){if(!body.confirmArtwork||!body.confirmDesign||!body.design)throw new Error('Missing fast approval evidence');return route.fulfill({status:503,json:{ok:false,error:'Mock checkout failure; no purchase.'}});}
    if(body.confirmDesign!==true||body.mockupId!=='mock-proof'||!body.design)throw new Error('Missing approval evidence');
    data={ok:true,checkoutUrl:'https://recastmeai.com/support.html?test-checkout=1'};
   }else throw new Error('Unexpected endpoint '+action);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  // Any old direct checkout API use would escape the purchase-only bridge.
  await page.route('**/api/checkout-link',()=>{throw new Error('Wrong checkout route');});
  await page.goto('https://recastmeai.com/recast.html?share='+share);
  await page.getByRole('button',{name:'Buy now',exact:true}).click();
  await page.locator('.fast-artwork img').waitFor();
  await page.locator('[data-fast-confirm]').click();
  await page.locator('.final-review-error:not([hidden])').waitFor();
  if(calls.some(c=>c.path.endsWith('/mockup-create')))throw new Error('Fast checkout requested a mockup');
  await page.locator('button[data-final-close]').click();
  await page.locator('.product-preview-action').click();
  const waiting=page.locator('.product-preview-loading');
  await waiting.waitFor({state:'visible'});
  if(!await page.locator('.product-preview-action').isDisabled())throw new Error('Preview allows repeated clicks');
  if(await page.locator('.recast-buy').isVisible())throw new Error('Checkout visible before preview');
  await page.locator('.product-preview-action').evaluate(button=>button.click());
  await page.waitForTimeout(1100);
  if(!/elapsed/.test(await waiting.innerText()))throw new Error('Missing elapsed status');
  await page.getByRole('button',{name:'Continue to final review',exact:true}).click({timeout:30000});
  if(await waiting.isVisible())throw new Error('Loading panel did not clear');
  if(calls.filter(c=>c.path.endsWith('/mockup-create')).length!==1)throw new Error('Duplicate preview request');
  const modal=page.getByRole('dialog');
  await modal.waitFor();
  const note=modal.locator('details.final-review-note');
  if(await note.count()!==1)throw new Error('Expandable gift/print details missing');
  if(await note.evaluate(el=>el.open))throw new Error('Long print advice should be collapsed by default');
  await note.locator('summary').click();
  const text=await modal.innerText();
  if(!text.includes('Enter their name and shipping address')||!text.includes(requestId)||!text.includes("watermark won't print"))throw new Error('Gift, watermark or artwork context missing');
  fs.mkdirSync('audit-results',{recursive:true});
  await page.screenshot({path:'audit-results/social-final-review.png',fullPage:true});
  await page.getByRole('button',{name:'Confirm design & checkout',exact:true}).click();
  await page.waitForURL(url => /^\/support(?:\.html)?$/.test(url.pathname) && url.searchParams.get('test-checkout') === '1');
  if(errors.length)throw new Error(errors.join(';'));
  fs.writeFileSync('audit-results/social-purchase-audit.json',JSON.stringify({mocked:true,orders:0,xPosts:0,calls,errors},null,2));
  console.log('Social purchase-only bridge → product preview → final approval → checkout UI passed. Mocked commerce; no purchase.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
