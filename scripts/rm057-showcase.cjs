// Owner-requested public merchandising proofs; no generation, checkout or orders.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base='https://recastmeai.com',root=path.resolve(__dirname,'..'),out=path.join(root,'rm057-showcase');
const wait=ms=>new Promise(r=>setTimeout(r,ms)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const scenes=[
 ['world-halloween-v18.webp','Halloween pet',[['Mug','RECAST-MUG-11OZ'],['Coaster 4-Pack','RECAST-COASTER-SET']]],
 ['world-retro-v18.webp','Retro couple',[['Tumbler','RECAST-TUMBLER-20OZ'],['Pillow','RECAST-PILLOW-14']]],
 ['world-royal-v18.webp','Royal family',[['Blanket','RECAST-BLANKET-50X60'],['Puzzle','RECAST-PUZZLE-252']]],
 ['world-fantasy-v18.webp','Fantasy person + pet',[['Hoodie','RECAST-HOODIE-M'],['Tote Bag','RECAST-TOTE-BLACK']]],
 ['world-comic-v18.webp','Comic hero',[['T-Shirt','RECAST-TEE-M'],['Hardcover Journal','RECAST-JOURNAL-HC']]],
 ['dog-space-v17.webp','Space Explorer pet',[['Poster','RECAST-POSTER-12X16'],['Phone Case','RECAST-CASE-IP14PM']]],
 ['dog-royal-v17-fixed.webp','Royal pet',[['Framed Poster','RECAST-FRAME-12X16'],['Magnet 3-Pack','RECAST-MAGNET-SET']]],
 ['world-future-v18.webp','Future City car',[['Canvas','RECAST-CANVAS-12X16']]]
];
function designFor(product){
 const drink=['Mug','Tumbler'].includes(product),apparel=['Hoodie','T-Shirt'].includes(product);
 const cover=['Poster','Framed Poster','Puzzle','Magnet 3-Pack','Coaster 4-Pack'].includes(product);
 return {version:['Phone Case','Hardcover Journal'].includes(product)?7:6,product,layout:drink?'two-sided':cover?'cover':'fit',fill:apparel?'transparent':cover?'full-bleed':'ambient',x:'center',scale:product==='Mug'?110:product==='Tumbler'?108:product==='Canvas'?90:product==='Blanket'?92:100,spacing:'standard',...(apparel?{finish:'soft'}:{}),...(['Poster','Framed Poster'].includes(product)?{orientation:'portrait'}:{}),...(['Puzzle','Canvas'].includes(product)?{orientation:'landscape'}:{})};
}
async function call(route,options={}){
 const url=new URL(route,base),method=options.method||'GET';
 if(url.origin!==base||!['GET','POST'].includes(method)||method==='POST'&&!['/api/original-photo','/api/mockup/create'].includes(url.pathname))throw Error('Disallowed endpoint');
 return fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(45000),headers:{origin:base,'x-recast-request':'1',...options.headers}});
}
(async()=>{
 if(process.env.RECAST_SHOWCASE!=='OWNER_APPROVED_PUBLIC_ASSETS')throw Error('Explicit showcase flag required');
 if(fs.existsSync(out))throw Error('Existing run found; inspect results rather than repeat uploads');
 fs.mkdirSync(out);const report={startedAt:new Date().toISOString(),aiGenerationCalls:0,checkoutCalls:0,orderCalls:0,examples:{},failures:[]};
 const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));save();
 const config=await(await call('/api/public-config')).json();if(config.turnstileSiteKey)throw Error('Human check required; no bypass');
 for(const [asset,scene,products] of scenes){
  const bytes=fs.readFileSync(path.join(root,'public/assets',asset)),form=new FormData();form.set('photo',new Blob([bytes],{type:'image/webp'}),asset);form.set('consent','yes');
  const upload=await call('/api/original-photo',{method:'POST',body:form}),art=await upload.json();
  if(!upload.ok||!art.ok){report.failures.push({scene,error:art.error||upload.status});save();break;}
  // This private recovery file never belongs in git or a shared report.
  fs.writeFileSync(path.join(out,'.private-'+sha(bytes).slice(0,12)+'.json'),JSON.stringify(art),{mode:0o600});
  const q=new URLSearchParams({requestId:art.requestId,token:art.accessToken});
  const catalog=await(await call('/api/checkout-options?'+q)).json();
  for(const [product,sku] of products){
   try{
    const variant=catalog.products?.filter(p=>p.status==='ACTIVE').flatMap(p=>p.variants||[]).find(v=>v.sku===sku);if(!variant)throw Error('No active mapped variant');
    const design=designFor(product),res=await call('/api/mockup/create',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({requestId:art.requestId,accessToken:art.accessToken,sku,design})}),task=await res.json();
    if(!res.ok||!task.ok)throw Error([task.reason,task.stage,task.error].filter(Boolean).join(' · '));
    let result;
    for(let i=0;i<24;i++){
     await wait(7000);const pq=new URLSearchParams({...Object.fromEntries(q),sku,mockup:task.mockupId});const status=await call('/api/mockup/status?'+pq),data=await status.json();
     if(data.status==='failed'||(!status.ok&&status.status!==202))throw Error(data.error||'Provider failed');
     if(data.status==='completed'){result=data;break;}
    }
    if(!result)throw Error('Timed out; task not repeated');
    if(result.variantIdentity?.id!==variant.printfulVariantId||!result.position||!result.images?.length)throw Error('Exact supplier identity or geometry missing');
    const files=[];
    for(const [i,img] of result.images.slice(0,4).entries()){
     const u=new URL(img.url);if(u.origin!==base||!u.pathname.startsWith('/api/mockup/image/'))throw Error('Unexpected protected proof route');
     const r=await call(u.href),b=Buffer.from(await r.arrayBuffer());if(!r.ok||b[0]!==255||b[1]!==216)throw Error('Invalid preview');
     const file=sku.toLowerCase()+'-'+i+'.jpg';fs.writeFileSync(path.join(out,file),b);files.push({file,title:img.title,group:img.group,sha256:sha(b)});
    }
    report.examples[sku]={product,sku,scene,publicArtwork:'public/assets/'+asset,sourceHash:sha(bytes),variantLabel:variant.variantTitle,design:result.design,position:result.position,variantIdentity:result.variantIdentity,files,status:'provider-generated-needs-visual-review',generatedAt:new Date().toISOString()};
    console.log(product+': '+scene+'; '+files.length+' supplier views');
   }catch(e){report.failures.push({product,sku,scene,error:e.message.replace(/([?&](?:token|key)=)[^&\s]+/gi,'$1[redacted]')});console.log(product+': held; '+e.message.split('?')[0]);}
   save();
  }
 }
 report.finishedAt=new Date().toISOString();save();console.log('Completed '+Object.keys(report.examples).length+' products; held '+report.failures.length);
})().catch(e=>{console.error(e.message);process.exitCode=1});
