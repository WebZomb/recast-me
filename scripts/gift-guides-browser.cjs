const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve('public');
const pages = ['pet-portrait-gifts','original-photo-gifts','personalized-photo-blankets','dog-photo-gifts','cat-photo-gifts','christmas-photo-gifts'];
(async()=>{
 const server=http.createServer((req,res)=>{
  let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=path.join(root,name==='/'?'index.html':name);
  if(!path.extname(file))file+='.html';
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.png':'image/png'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true});
 try{
  fs.mkdirSync('rm050-browser-results',{recursive:true});
  for(const width of [320,393,1280]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
   for(const slug of pages){
    const response=await page.goto(`http://127.0.0.1:${server.address().port}/${slug}`,{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    const button=page.locator('.order-hero .gift-guide-cta');
    assert.equal(await button.getAttribute('href'),'/#start');
    const style=await button.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return {background:s.backgroundImage,height:r.height,left:r.left,right:r.right,font:parseFloat(s.fontSize),width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth};});
    assert.match(style.background,/linear-gradient/);assert.ok(style.height>=72&&style.font>=20);assert.ok(style.left>=0&&style.right<=style.width);assert.equal(style.overflow,false);
    await page.screenshot({path:`rm050-browser-results/gift-${slug}-${width}.png`});
    console.log('PASS',slug,width,style.height,style.background);
   }
   await page.close();
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
