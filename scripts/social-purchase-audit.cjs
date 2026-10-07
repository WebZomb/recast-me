// Production UI with isolated mock responses: no real render, order or X post.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:393,height:852}}),errors=[],calls=[];
  page.on('pageerror',e=>errors.push(e.message));
  const share='a'.repeat(40),requestId='RC-DEMO0001-ABCDEF';
  await page.route('**/api/social/**',async route=>{
   const req=route.request(),u=new URL(req.url());calls.push({path:u.pathname,method:req.method()});
   const action=u.pathname.split('/')[4];
   let data;
   if(!action)data={ok:true,requestId,styleName:'Original photo',image:'/assets/product-mug-v16.webp'};
   else if(action==='products')data={ok:true,products:[{title:'Custom Recast Mug',status:'ACTIVE',variants:[{sku:'RECAST-MUG-11OZ',variantTitle:'11 oz',price:'24.99'}]}]};
   else if(action==='mockup-create'){
    const body=req.postDataJSON();if(body.accessToken)throw new Error('Owner credential leaked');
    data={ok:true,mockupId:'mock-proof'};
   }else if(action==='mockup-status')data={ok:true,status:'completed',images:[{title:'Front',url:'/assets/product-mug-v16.webp'}]};
   else if(action==='checkout'){
    const body=req.postDataJSON();if(body.confirmDesign!==true||body.mockupId!=='mock-proof'||!body.design)throw new Error('Missing approval evidence');
    data={ok:true,checkoutUrl:'https://recastmeai.com/support.html?test-checkout=1'};
   }else throw new Error('Unexpected endpoint '+action);
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  // Any old direct checkout API use would escape the purchase-only bridge.
  await page.route('**/api/checkout-link',()=>{throw new Error('Wrong checkout route');});
  await page.goto('https://recastmeai.com/recast.html?share='+share);
  await page.getByRole('button',{name:'Preview my product',exact:true}).click();
  await page.getByRole('button',{name:'Continue to final review',exact:true}).click({timeout:30000});
  await page.getByRole('dialog').waitFor();
  const text=await page.getByRole('dialog').innerText();
  if(!text.includes('Sending a gift?')||!text.includes(requestId))throw new Error('Gift/artwork context missing');
  fs.mkdirSync('audit-results',{recursive:true});
  await page.screenshot({path:'audit-results/social-final-review.png',fullPage:true});
  await page.getByRole('button',{name:'Confirm design & checkout',exact:true}).click();
  await page.waitForURL(url => /^\/support(?:\.html)?$/.test(url.pathname) && url.searchParams.get('test-checkout') === '1');
  if(errors.length)throw new Error(errors.join(';'));
  fs.writeFileSync('audit-results/social-purchase-audit.json',JSON.stringify({mocked:true,orders:0,xPosts:0,calls,errors},null,2));
  console.log('Social purchase-only bridge → product preview → final approval → checkout UI passed. Mocked commerce; no purchase.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
