// Local-only browser regression: no real provider call, photo upload, or secret.
const assert=require('node:assert/strict');
const http=require('node:http');const fs=require('node:fs');const path=require('node:path');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'../public');
let submitted;
const server=http.createServer(async(req,res)=>{
 if(req.method==='POST'&&req.url.startsWith('/api/admin/model-test?')){
  try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const form=await new Response(Buffer.concat(chunks),{headers:{'content-type':req.headers['content-type']}}).formData();submitted={url:req.url,form,authorization:req.headers.authorization};
  res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,image:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',modelUsed:'fal-ai/nano-banana/edit',providerUsed:'fal',promptVersion:'owner-identity-edit-v1'}));}catch(error){res.writeHead(500).end(JSON.stringify({error:error.message}))}return;
 }
 const name=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!name.startsWith(root+path.sep)){res.writeHead(403).end();return}try{res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(name))}catch{res.writeHead(404).end()}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const scenarios=process.env.RECAST_CHROMIUM_ONLY==='1'?[[chromium,393],[chromium,320]]:[[webkit,393],[chromium,320]];
 try{for(const [engine,width] of scenarios){
 const browser=await engine.launch();try{
 const page=await browser.newPage({viewport:{width,height:852}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/model-lab.html');
 assert.equal(await page.locator('#subject').count(),0);
 assert.ok(!/\b(pet|dog|puppy|person)\b/i.test(await page.locator('#direction').inputValue()),'Default direction does not tell the model the subject type');
 const b64=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=1600;c.getContext('2d').fillRect(0,0,1200,1600);return c.toDataURL('image/png').split(',')[1]});
 await page.locator('#reference').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')});await page.locator('#token').fill('mock-owner-token');
 let expectedResults=0;
 for(const choice of ['qwen-protected','fill-protected','nano-banana','dev-edit','dev','klein9']){
  await page.locator('#engine').selectOption(choice);await page.evaluate(()=>document.querySelector('#status').textContent='');await page.locator('#run').click();await page.waitForFunction(count=>document.querySelectorAll('#results article').length===Math.min(count,4)&&document.querySelector('#status').textContent.startsWith('Comparison ready'),++expectedResults);
  assert.match(submitted.url,new RegExp('model='+choice+'$'));assert.equal(submitted.authorization,'Bearer mock-owner-token');assert.equal(submitted.form.get('subject'),'auto');
  const quick=choice==='klein9';assert.equal(submitted.form.get('ownerProvider'),quick?'cloudflare':'fal');assert.equal(submitted.form.get('qualityMode'),quick?'quick':'high');
  const dimensions=async file=>page.evaluate(async encoded=>{const blob=await(await fetch('data:image/jpeg;base64,'+encoded)).blob();const image=await createImageBitmap(blob);return [image.width,image.height]},Buffer.from(await file.arrayBuffer()).toString('base64'));
  assert.deepEqual(await dimensions(submitted.form.get('image_0')),[375,500]);
  if(quick)assert.equal(submitted.form.get('hq_image_0'),null);else assert.deepEqual(await dimensions(submitted.form.get('hq_image_0')),[768,1024]);
 }
 assert.equal(await page.locator('#original').isVisible(),true);assert.equal(await page.locator('#results article').count(),4);assert.deepEqual(errors,[]);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No mobile horizontal overflow');
 console.log(engine.name()+' '+width+'px: original preview, six choices, HQ1024/CF500, one local mock submission per click, no JS errors PASS');
 }finally{await browser.close()}}
 }finally{await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
