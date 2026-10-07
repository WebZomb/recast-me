/* One explicitly authorized merchandising pass. No AI generation, checkout links,
 * payments, order drafts or production calls. Uses only the owner's existing public
 * superhero-and-dog asset. Fails at Turnstile rather than bypassing it.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base='https://recastmeai.com',out=path.resolve('rm055-public-examples');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const defs=[['Hoodie','RECAST-HOODIE-S'],['T-Shirt','RECAST-TEE-S'],['Poster','RECAST-POSTER-12X16'],['Canvas','RECAST-CANVAS-12X16'],['Framed Poster','RECAST-FRAME-12X16'],['Mug','RECAST-MUG-11OZ'],['Blanket','RECAST-BLANKET-50X60'],['Tumbler','RECAST-TUMBLER-20OZ'],['Magnet 3-Pack','RECAST-MAGNET-SET'],['Coaster 4-Pack','RECAST-COASTER-SET']];
function designFor(product){const d={version:6,product,layout:'cover',fill:'full-bleed',x:'center',scale:100,spacing:'standard'};if(['Hoodie','T-Shirt'].includes(product))Object.assign(d,{layout:'fit',fill:'transparent',finish:'soft'});if(['Mug','Tumbler'].includes(product))Object.assign(d,{layout:'two-sided',fill:'ambient',scale:product==='Mug'?110:108});if(['Poster','Canvas','Framed Poster'].includes(product))d.orientation='portrait';return d}
async function call(relative,options={}){
 const u=new URL(relative,base),method=options.method||'GET';
 if(u.origin!==base)throw Error('Unexpected origin');
 if(method==='POST'&&!['/api/original-photo','/api/mockup/create'].includes(u.pathname))throw Error('Forbidden write route');
 if(method!=='POST'&&!['GET','HEAD'].includes(method))throw Error('Forbidden method');
 return fetch(u,{...options,redirect:'error',signal:AbortSignal.timeout(45000),headers:{'x-recast-request':'1',origin:base,...options.headers}});
}
(async()=>{
 if(process.env.RECAST_PUBLIC_EXAMPLES!=='APPROVED_PUBLIC_ART_ONLY')throw Error('Explicit public-example switch required');
 if(Number(process.env.GITHUB_RUN_ATTEMPT||1)!==1)throw Error('Do not automatically repeat sample creation after a timeout');
 fs.mkdirSync(out,{recursive:true});
 const report={commit:process.env.GITHUB_SHA,startedAt:new Date().toISOString(),publicArtwork:'public/assets/hero-your-world-v08.webp',aiGenerationCalls:0,checkoutCalls:0,productionCalls:0,examples:{},failures:[]};
 const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));save();
 let deployed=false;
 const expected=sha(fs.readFileSync('public/checkout.js'));
 for(let i=0;i<16;i++){
  try{const r=await call('/checkout.js?rm055='+Date.now());if(r.ok&&sha(Buffer.from(await r.arrayBuffer()))===expected){deployed=true;break}}catch{}
  await delay(15000);
 }
 if(!deployed)throw Error('Exact validated checkout source has not reached production; no upload attempted');
 const config=await(await call('/api/public-config')).json();if(config.turnstileSiteKey)throw Error('Human security check configured; owner must prepare examples in browser');
 const bytes=fs.readFileSync('public/assets/hero-your-world-v08.webp');report.sourceHash=sha(bytes);
 const form=new FormData();form.set('photo',new Blob([bytes],{type:'image/webp'}),'recast-approved-public-example.webp');form.set('consent','yes');form.set('turnstileToken','');
 const upload=await call('/api/original-photo',{method:'POST',body:form}),art=await upload.json();
 if(!upload.ok||!art.ok||!art.accessToken||!art.requestId)throw Error('Public source upload failed: '+(art.error||upload.status));
 console.log('::add-mask::'+art.accessToken);console.log('::add-mask::'+art.requestId);
 const qs=new URLSearchParams({requestId:art.requestId,token:art.accessToken});
 const options=await(await call('/api/checkout-options?'+qs)).json();
 if(!options.ok)throw Error('Verified checkout catalog unavailable');
 for(const [product,sku] of defs){
  try{
   const variant=options.products?.filter(p=>p.status==='ACTIVE').flatMap(p=>p.variants||[]).find(v=>v.sku===sku);if(!variant)throw Error('SKU not in active mapped checkout catalog');
   const design=designFor(product),start=await call('/api/mockup/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:art.requestId,accessToken:art.accessToken,sku,design})}),task=await start.json();
   if(!start.ok||!task.ok)throw Error([task.reason,task.stage,task.error].filter(Boolean).join(' · '));
   let result=null;
   for(let i=0;i<18;i++){
    await delay(10000);
    const q=new URLSearchParams({...Object.fromEntries(qs),sku,mockup:task.mockupId});const res=await call('/api/mockup/status?'+q);const data=await res.json();
    if(data.status==='failed'||(!res.ok&&res.status!==202))throw Error(data.error||'Provider preview failed');
    if(data.status==='completed'){result=data;break}
   }
   if(!result)throw Error('Preview timed out; do not automatically create another task');
   if(!result.variantIdentity||result.variantIdentity.id!==variant.printfulVariantId)throw Error('Supplier variant identity not verified');
   if(result.design?.version!==6||!result.position||!result.images?.length)throw Error('Exact geometry/proof is missing');
   const images=result.images.slice(0,4),files=[];
   for(let i=0;i<images.length;i++){
    const u=new URL(images[i].url);if(u.origin!==base||!u.pathname.startsWith('/api/mockup/image/'))throw Error('Unexpected image route');
    const res=await call(u.href),jpg=Buffer.from(await res.arrayBuffer());if(!res.ok||jpg[0]!==255||jpg[1]!==216||jpg.length<1000)throw Error('Invalid supplier preview image');
    const file=sku.toLowerCase()+'-'+i+'.jpg';fs.writeFileSync(path.join(out,file),jpg);files.push({file,title:images[i].title,group:images[i].group,sha256:sha(jpg)});
   }
   report.examples[sku]={sku,product,variantLabel:variant.variantTitle,status:'provider-generated-needs-visual-review',sourceHash:report.sourceHash,design:result.design,position:result.position,variantIdentity:result.variantIdentity,files,generatedAt:new Date().toISOString()};
   console.log(product+': provider-generated; '+variant.variantTitle+'; '+files.length+' views');
  }catch(e){report.failures.push({product,sku,error:String(e.message).replace(/([?&](?:token|key|access_token)=)[^&\s]+/gi,'$1[redacted]')});console.log(product+': held for review')}
  save();await delay(3000);
 }
 report.finishedAt=new Date().toISOString();save();
 console.log(JSON.stringify({generated:Object.keys(report.examples).length,held:report.failures.length,aiGenerationCalls:0,checkoutCalls:0,productionCalls:0}));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'blocked.txt'),e.message);console.error(e.message);process.exitCode=1});
