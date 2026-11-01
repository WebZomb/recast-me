const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const child=spawn('node',['node_modules/wrangler/bin/wrangler.js','dev','--local','--port','8799'],{stdio:['ignore','pipe','pipe'],env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
 let browser;let log='';child.stdout.on('data',x=>log+=x);child.stderr.on('data',x=>log+=x);
 try{
  const base='http://127.0.0.1:8799';let ready=false;
  for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
  assert.ok(ready,'Local Worker did not start');
  for(const path of ['/','/guide','/shop','/christmas','/christmas-gifts','/specials','/my-orders','/my-recasts','/recast','/order','/support','/privacy'])assert.equal((await fetch(base+path)).status,200,path);
  for(const path of ['/definitely-missing-seo-check','/assets/missing-seo-check.png','/nested/missing']){const r=await fetch(base+path);assert.equal(r.status,404,path);assert.match(await r.text(),/PAGE NOT FOUND/);}
  assert.equal((await fetch(base+'/api/definitely-missing')).status,404);
  assert.equal((await fetch(base+'/proof/not-a-token')).status,404);
  for(const path of ['/specials.html','/christmas-gifts.html']){const r=await fetch(base+path);assert.equal(r.status,200);assert.ok(!r.url.endsWith('.html'));assert.ok((await r.text()).includes('href="https://recastmeai.com'+path.replace('.html','')+'"'));}
  for(const route of ['/shop','/christmas']){
    const html=await (await fetch(base+route)).text();
    assert.match(html,/name="robots" content="index,follow"/,'Public verified premade Shop must be indexable: '+route);
    assert.match(html,new RegExp('rel="canonical" href="https://recastmeai.com'+route+'"'));
  }
  for(const route of ['/my-orders','/my-recasts']){
    const html=await (await fetch(base+route)).text();
    assert.match(html,/noindex/,'Private customer pages stay unindexed');
  }
  browser=await chromium.launch({headless:true});fs.mkdirSync('rm050-browser-results',{recursive:true});
  for(const width of [320,393,1280]){const page=await browser.newPage({viewport:{width,height:850}});const response=await page.goto(base+'/definitely-missing-seo-check');assert.equal(response.status(),404);assert.equal(await page.locator('h1').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));for(const a of await page.locator('nav a').all())assert.ok((await a.boundingBox()).height>=44);await page.screenshot({path:`rm050-browser-results/seo-404-${width}.png`});await page.close();}
  console.log('SEO routes, private exclusions and 404 mobile layouts PASS');
 }catch(e){console.error(log.slice(-2000));throw e;}finally{if(browser)await browser.close();child.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1});
