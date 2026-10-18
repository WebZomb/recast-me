// All traffic intercepted. No live customer, provider, payment or order calls.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch();
 try{for(const width of [320,393,1280]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  const state={basketId:'fixture',revision:0,appliedActions:[],lines:[]},commands=[];let loseResponse=true;
  await context.route('**/*',async route=>{
   const p=new URL(route.request().url()).pathname,body=route.request().postDataJSON();
   if(p==='/')return route.fulfill({contentType:'text/html',body:'<div id="product-grid"></div><div id="review"><div class="final-review-actions"></div><p class="final-review-error" hidden></p></div><script type="module">import * as b from "/basket.js";window.b=b;await b.initialize();window.ready=true;</script>'});
   if(p==='/basket.js')return route.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.resolve('public/basket.js'))});
   let data={ok:true};
   if(p==='/api/basket/status')data.enabled=true;
   else if(p==='/api/basket/session'){}
   else if(p==='/api/basket/approve')data.approvalToken='a'.repeat(48);
   else if(p==='/api/basket')data.basket=state;
   else if(p==='/api/basket/action'){
    const c=body.command;commands.push(c);
    if(!state.appliedActions.includes(c.actionId)){
     if(c.type==='add')state.lines.push({lineId:c.lineId,quantity:1,artworkId:'ART-TEST',sku:'RECAST-MUG-11OZ',product:'Mug'});
     if(c.type==='quantity')state.lines.find(l=>l.lineId===c.lineId).quantity=c.quantity;
     if(c.type==='remove')state.lines=state.lines.filter(l=>l.lineId!==c.lineId);
     state.revision++;state.appliedActions.push(c.actionId);
    }
    if(loseResponse){loseResponse=false;return route.abort();}data.basket=state;
   }else if(p==='/api/basket/checkout')return route.fulfill({status:503,json:{ok:false,error:'Your items are saved. Checkout needs review.'}});
   else return route.abort();
   return route.fulfill({json:data});
  });
  await page.goto('https://recast.test/');await page.waitForFunction(()=>window.ready);
  await page.evaluate(()=>window.b.addReviewAction(document.querySelector('#review'),{requestId:'ART-TEST',accessToken:'fixture'},()=>({sku:'RECAST-MUG-11OZ'}),()=>{}));
  await page.getByRole('button',{name:'Approve & add to basket'}).click();await page.waitForFunction(()=>!document.querySelector('.final-review-error').hidden);
  await page.locator('[data-basket-open]').click();
  await page.getByRole('button',{name:'Continue to checkout',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('[data-basket-checkout]').disabled);
  assert.equal(state.lines.length,1);assert.equal(commands.length,1);
  await page.getByRole('combobox').selectOption('3');await page.waitForFunction(()=>document.querySelector('[data-basket-open]').textContent==='Basket (3)');
  await page.getByRole('button',{name:'Continue to checkout',exact:true}).click();await page.getByText('Your items are saved. Checkout needs review.',{exact:true}).waitFor();
  assert.equal(state.lines[0].quantity,3);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('dialog').evaluate(e=>e.getBoundingClientRect().width<=innerWidth),true);
  fs.mkdirSync('rm050-browser-results',{recursive:true});await page.screenshot({path:`rm050-browser-results/basket-${width}.png`});
  await page.getByRole('button',{name:'Remove',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-basket-open]').textContent==='Basket (0)');
  assert.equal(state.lines.length,0);await context.close();console.log('PASS basket lost-response recovery, quantity/remove, checkout failure and fit at '+width);
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
