// RM112: REAL production Credits & Gifts browser/checkout-entry audit.
// No payment, order, render, user account, discount, admin authentication, or gift redemption.
// A single POST to the public /render-credits endpoint may create a fresh, empty visitor wallet.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base='https://recastmeai.com',shop='https://b2wnfu-7g.myshopify.com';
const product='recast-me-daily-reset-3-hq-5-standard';
const out=path.resolve('audit-results','credits');
const report={test:'RM112 live site check WITHOUT any charge/order/render',at:new Date().toISOString(),sha:process.env.GITHUB_SHA||null,checks:[],browsers:[],checkoutEntry:null,failures:[],limitations:[
 'The real $2.99 Shopify payment, Shopify order custom attributes, credit fulfillment and refund reversal cannot be confirmed without a completed payment.',
 'Owner-only checkout button cannot be accessed in this audit without an owner token; no token is read or requested.'
]};
const T=15000;
function record(name,ok,details={}){report.checks.push({name,ok,...details});if(!ok)report.failures.push(name+(details.reason?': '+details.reason:''))}
async function get(url){return fetch(url,{redirect:'follow',cache:'no-store',signal:AbortSignal.timeout(20000),headers:{'user-agent':'RecastMe/1.0 public launch audit'}})}
async function preflight(){
 const results=await Promise.allSettled([
  get(base+'/credits.html'),get(base+'/credits.js?v=2'),
  get(base+'/credits.css?v=1'),get(base+'/api/credit-packs/catalog'),
  get(shop+'/products/'+product+'.js')
 ]);
 for(let i=0;i<results.length;i++){
  const result=results[i];
  if(result.status!=='fulfilled'){record('GET '+['credits page','credit JS','credit styles','credit catalog','Shopify unlisted product'][i],false,{reason:String(result.reason).slice(0,240)});continue;}
  const response=result.value;
  const text=await response.text();
  record('GET '+['credits page','credit JS','credit styles','credit catalog','Shopify unlisted product'][i],response.ok,{status:response.status,location:response.url,bodyBytes:text.length,reason:response.ok?'':'HTTP '+response.status});
  if(i===0)record('Credit page has redemption and order status',text.includes('id="redeem-credit-form"')&&text.includes('id="credit-purchase-list"'));
  if(i===1)record('Only owner test checkout UI present',text.includes("testReady&&p.id==='reset'&&mode==='self'")&&text.includes('OWNER TEST · Pay $2.99'));
  if(i===3&&response.ok){
   try{
    const j=JSON.parse(text),packs=Object.fromEntries((j.packs||[]).map(p=>[p.id,p]));
    record('Public credit pack sale remains OFF',j.enabled===true&&j.salesEnabled===false&&j.ownerTestEnabled===true,{enabled:j.enabled,salesEnabled:j.salesEnabled,ownerTestEnabled:j.ownerTestEnabled});
    record('Seven correctly priced credit packs',Object.keys(packs).length===7&&packs.reset?.priceCents===299&&packs.hq10?.priceCents===499&&packs.hq20?.priceCents===899&&packs.hq50?.priceCents===1999&&packs.std10?.priceCents===299&&packs.std20?.priceCents===549&&packs.std50?.priceCents===1199,{packages:Object.keys(packs).length});
   }catch(e){record('Credit catalog parses',false,{reason:e.message})}
  }
  if(i===4&&response.ok){
   try{const p=JSON.parse(text);record('Shopify reset product is 299 cents and available',p.variants?.some(v=>Number(v.price)===299&&v.available!==false),{variantIds:p.variants?.map(v=>v.id),available:p.available,title:p.title});}
   catch(e){record('Shopify reset product parses',false,{reason:e.message})}
  }
 }
}
async function security(){
 let response;
 try{
  response=await fetch(base+'/api/credit-packs/checkout',{method:'POST',signal:AbortSignal.timeout(15000),headers:{'content-type':'application/json','x-recast-request':'1',origin:base},body:JSON.stringify({packId:'reset',mode:'self'})});
  const j=await response.json();record('Anonymous purchase is BLOCKED before checkout',response.status===503&&j.code==='credit_checkout_disabled',{status:response.status,error:j.code});
 }catch(e){record('Anonymous purchase is BLOCKED before checkout',false,{reason:e.message})}
 try{
  response=await get(base+'/api/admin/credit-codes');record('Owner redemption history refuses anonymous visitors',response.status===401,{status:response.status});
 }catch(e){record('Owner redemption history refuses anonymous visitors',false,{reason:e.message})}
}
async function browse(engine,width,height){
 const browser=await engine.launch(),context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[],requests=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.url().startsWith(base+'/api/')&&!['GET','HEAD'].includes(r.method()))requests.push({method:r.method(),path:new URL(r.url()).pathname})});
 page.on('response',r=>{if(r.url().startsWith(base+'/')&&r.status()>=400)failed.push({status:r.status(),path:new URL(r.url()).pathname})});
 const id=engine.name()+'-'+width;
 try{
  const resp=await page.goto(base+'/credits.html?rm112-audit=1',{waitUntil:'domcontentloaded',timeout:35000});
  assert.equal(resp.status(),200);
  await page.waitForFunction(()=>document.querySelectorAll('#credit-pack-grid .pack').length===7,null,{timeout:30000});
  await page.locator('#redeem-credit-code').waitFor({state:'visible',timeout:T});
  const details=await page.evaluate(()=>{
   const root=document.documentElement,panels=[...document.querySelectorAll('#credit-pack-grid .pack')];
   return {title:document.title,clientWidth:innerWidth,scrollWidth:root.scrollWidth,
     packs:panels.map(x=>({name:x.querySelector('h3')?.textContent,price:x.querySelector('.price')?.textContent,
       buttons:[...x.querySelectorAll('button')].map(b=>({text:b.textContent,disabled:b.disabled}))})),
     balance:document.querySelector('#my-credit-balance')?.textContent,
     notice:document.querySelector('#sales-status')?.textContent,
     redeemVisible:!!document.querySelector('#redeem-credit-form'),
     historyVisible:!!document.querySelector('#credit-purchase-list')};
  });
  const onlyDisabled=details.packs.every(p=>p.buttons.every(b=>b.disabled));
  record(id+' anonymous visitor only sees disabled credit-pack purchase buttons',onlyDisabled,{visiblePacks:details.packs.length,notice:details.notice?.slice(0,180)});
  record(id+' responsive layout has no horizontal overflow',details.scrollWidth<=width+2,{scrollWidth:details.scrollWidth,width});
  record(id+' no uncaught page errors',errors.length===0,{errors});
  await page.screenshot({path:path.join(out,id+'-credits.png'),fullPage:true});
  report.browsers.push({id,details,apiWrites:requests,failedResponses:failed});
 }catch(e){record(id+' public credit page browser navigation',false,{reason:e.stack?.slice(0,1100)||e.message});await page.screenshot({path:path.join(out,id+'-error.png'),fullPage:true}).catch(()=>{});}
 finally{await browser.close()}
}
async function storefrontCheckoutEntry(){
 // Open a real Shopify cart permalink with a SYNTHETIC claim.
 // Do NOT submit customer/payment details, approve a charge or place any order.
 const b=await chromium.launch(),context=await b.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e.message).slice(0,180)));
 const fake='RM112-NONPAYING-CART-CHECK-NO-ORDER';
 const url=new URL(shop+'/cart/67762889818356:1');
 url.searchParams.set('attributes[Recast Credit Claim]',fake);
 url.searchParams.set('ref','recast-rm112-readonly-audit');
 try{
  const response=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForTimeout(3000);
  const title=await page.title(),body=await page.locator('body').innerText({timeout:10000}).catch(()=>'');
  // The checkout's country dropdown contains hundreds of entries before the
  // order summary, so do not truncate before looking for the price/product.
  const markers={reset:/Recast Me|Daily Reset|3 HQ|5 Standard/i.test(body),price:/\$?2[.,]99/.test(body),password:/store password|store coming soon/i.test(title+' '+body)};
  report.checkoutEntry={initial:shop+'/cart/<reset-variant>:1',responseStatus:response?.status(),finalUrl:page.url().split('?')[0],title,markers,bodyLength:body.length,productContext:(body.match(/.{0,90}(?:Recast Me|Daily Reset|\$?2[.,]99).{0,90}/im)||[])[0]||'',bodySample:body.slice(0,750),jsErrors:errors};
  await page.screenshot({path:path.join(out,'shopify-reset-checkout-entry.png'),fullPage:false}).catch(()=>{});
  record('Real Shopify cart/checkout entry for $2.99 reset loads',Boolean(response?.ok()&&markers.reset&&!markers.password),{status:response?.status(),title,finalUrl:page.url().split('?')[0],markers});
 }catch(e){
  report.checkoutEntry={error:String(e.message).slice(0,300)};
  record('Real Shopify cart/checkout entry for $2.99 reset loads',false,{reason:String(e.message).slice(0,300)});
 }finally{await b.close()}
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 await preflight();await security();
 await browse(webkit,393,852);await browse(chromium,1440,900);
 await storefrontCheckoutEntry();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log('RM112_LIVE_CREDITS_REPORT\n'+JSON.stringify(report,null,2));
 if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error('Fatal RM112 audit:',e);process.exitCode=1});
