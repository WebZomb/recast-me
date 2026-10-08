// Bounded owner-authorized preview verification using existing public demo artwork only.
// No upload, AI inference, checkout, order, or production endpoint is allowed.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),base='https://recastmeai.com',out=path.join(root,process.env.RECAST_CHECK_REV==='room2'?'rm060-preview-check-room2':'rm060-preview-check');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function call(route,options={}){const u=new URL(route,base),method=options.method||'GET';if(u.origin!==base||method==='POST'&&u.pathname!=='/api/mockup/create'||!['GET','POST'].includes(method))throw Error('Disallowed endpoint');return fetch(u,{...options,redirect:'error',signal:AbortSignal.timeout(45000),headers:{origin:base,'x-recast-request':'1',...options.headers}})}
(async()=>{
 if(process.env.RECAST_CHECK!=='PUBLIC_DEMOS_ONLY')throw Error('Explicit public-demo verification required');
 const {FULFILLMENT}=await import('../src/entry.js');
 const asset=fs.readFileSync(path.join(root,'public/assets/dog-space-v17.webp')),digest=crypto.createHash('sha256').update(asset).digest('hex'),art=JSON.parse(fs.readFileSync(path.join(root,'rm057-showcase/.private-'+digest.slice(0,12)+'.json')));
 const valid=['RECAST-BLANKET-50X60','RECAST-BLANKET-60X80','RECAST-CANVAS-12X16','RECAST-CANVAS-24X36','RECAST-POSTER-12X16','RECAST-POSTER-24X36',...Object.keys(FULFILLMENT).filter(s=>/^RECAST-(MUG-11OZ|TUMBLER-20OZ|FRAME-12X16|HOODIE-M|TEE-M|MAGNET-SET|COASTER-SET|STICKER-3X3|CASE-IP14PM|PILLOW-14|JOURNAL-HC|PUZZLE-252|TOTE-BLACK)$/.test(s))];
 const skus=process.argv.slice(2);if(!skus.length||skus.some(s=>!valid.includes(s)||!FULFILLMENT[s]))throw Error('Unsupported SKU');
 fs.mkdirSync(out,{recursive:true});const rp=path.join(out,'report.json'),report=fs.existsSync(rp)?JSON.parse(fs.readFileSync(rp)):{sourceAsset:'public/assets/dog-space-v17.webp',sourceHash:digest,aiCalls:0,orderCalls:0,examples:{},failures:[]};
 for(const sku of skus){
  if(report.examples[sku])continue;
  const map=FULFILLMENT[sku],product=map.product,drink=['Mug','Tumbler'].includes(product),apparel=['Hoodie','T-Shirt'].includes(product),cover=['Poster','Framed Poster','Puzzle','Magnet 3-Pack','Coaster 4-Pack'].includes(product);
  const design={version:['Hardcover Journal','Phone Case'].includes(product)?7:6,product,layout:drink?'two-sided':cover?'cover':'fit',fill:apparel?'transparent':cover?'full-bleed':'ambient',x:'center',scale:product==='Mug'?110:product==='Tumbler'?108:product==='Canvas'?90:product==='Blanket'?92:100,spacing:'standard',...(['Poster','Canvas','Framed Poster','Puzzle'].includes(product)?{orientation:'portrait'}:{}),...(apparel?{finish:'soft'}:{})};
  try{
   const p=path.join(out,'.private-'+sku+'.json');let task;
   if(fs.existsSync(p))task=JSON.parse(fs.readFileSync(p));else{const r=await call('/api/mockup/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:art.requestId,accessToken:art.accessToken,sku,design,presentation:'room-v1'})});task=await r.json();if(!r.ok||!task.ok)throw Error([task.stage,task.reason,task.error].filter(Boolean).join(' · '));fs.writeFileSync(p,JSON.stringify(task),{mode:0o600})}
   let d;for(let i=0;i<20;i++){const q=new URLSearchParams({requestId:art.requestId,token:art.accessToken,sku,mockup:task.mockupId}),r=await call('/api/mockup/status?'+q);d=await r.json();if(d.status==='failed'||!r.ok&&r.status!==202)throw Error(d.error||'Preview failed');if(d.status==='completed')break;await pause(7000)}
   if(d?.status!=='completed')throw Error('Pending: do not create another task');
   if(d.variantIdentity?.id!==map.printfulVariantId||!d.position)throw Error('Identity/geometry missing');
   const files=[];for(const [i,img] of d.images.entries()){const r=await call(img.url),b=Buffer.from(await r.arrayBuffer());if(!r.ok||b[0]!==255||b[1]!==216)throw Error('Invalid image');const file=sku.toLowerCase()+'-'+i+'.jpg';fs.writeFileSync(path.join(out,file),b);files.push({file,title:img.title,group:img.group})}
   report.examples[sku]={sku,product,design:d.design,position:d.position,variantIdentity:d.variantIdentity,files,status:'supplier-generated-needs-visual-review',checkedAt:new Date().toISOString()};report.failures=report.failures.filter(x=>x.sku!==sku);console.log(sku+': '+files.map(f=>f.group+' / '+f.title).join('; '));
  }catch(e){const error=e.message.replace(/([?&](?:token|key)=)[^&\s]+/gi,'$1[redacted]');report.failures.push({sku,error});console.log(sku+': '+error)}
  fs.writeFileSync(rp,JSON.stringify(report,null,2));
 }
})().catch(e=>{console.error(e.message);process.exitCode=1});
