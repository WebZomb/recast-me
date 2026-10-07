/* Raster verification with Sharp as a local reference compositor.
 * Does not call Cloudflare or test segmentation model quality.
 */
const sharp=require(process.env.SHARP_MODULE||'sharp');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const {composeProductLayout}=await import('../src/commerce-store.js');
 const {prepareApparelArtwork}=await import('../src/apparel-finish.js');
 const {watermarkProductSource}=await import('../src/preview-security.js');
 const {Bucket}=await import('../tests/security-helpers.mjs');
 const out=path.resolve('rm052-pixel-results');fs.mkdirSync(out,{recursive:true});
 const width=640,height=400,raw=Buffer.alloc(width*height*4),cutout=Buffer.alloc(width*height*4);
 // Deterministic public test graphic only; never a customer photo.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,subject=(x-320)**2+(y-205)**2<120**2;
  raw[i]=subject?240:30;raw[i+1]=subject?135:100+Math.round(y/3);raw[i+2]=subject?70:210;raw[i+3]=255;
  if(subject)raw.copy(cutout,i,i,i+4);
 }
 const input=await sharp(raw,{raw:{width,height,channels:4}}).png().toBuffer();
 const segmentFixture=await sharp(cutout,{raw:{width,height,channels:4}}).png().toBuffer();
 const calls=[];
 const IMAGES={
  async info(stream){const bytes=Buffer.from(await new Response(stream).arrayBuffer());const m=await sharp(bytes).metadata();return {width:m.width,height:m.height}},
  input(stream){
   const initial=new Response(stream).arrayBuffer().then(b=>Buffer.from(b)),ops=[];
   const chain={
    transform(options){ops.push(['transform',options]);calls.push(['transform',options]);return chain},
    draw(overlay,options={}){ops.push(['draw',overlay,options]);calls.push(['draw',options]);return chain},
    async render(){
     let bytes=await initial;
     for(const [op,a,b] of ops){
      if(op==='transform'){
       if(a.segment){bytes=segmentFixture;continue}
       if(a.border)throw new Error('Unsupported border operation used');
       if(a.width||a.height)bytes=await sharp(bytes).resize({width:a.width,height:a.height,fit:a.fit==='squeeze'?'fill':a.fit==='scale-down'?'inside':a.fit==='contain'?'inside':a.fit,withoutEnlargement:a.fit==='scale-down',background:a.background||{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
      }else{
       let overlay=await a.render();
       if(b.opacity!==undefined){const {data,info}=await sharp(overlay).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=3;i<data.length;i+=4)data[i]=Math.round(data[i]*b.opacity);overlay=await sharp(data,{raw:info}).png().toBuffer()}
       const options={input:overlay,blend:b.composite||'over',left:b.left||0,top:b.top||0};if(b.repeat)options.tile=true;
       bytes=await sharp(bytes).ensureAlpha().composite([options]).png().toBuffer();
      }
     }
     return bytes;
    },
    async output(options){
      let bytes=await chain.render();
      bytes=options.format==='image/jpeg'
        ?await sharp(bytes).flatten({background:'#fff'}).jpeg({quality:options.quality||90}).toBuffer()
        :await sharp(bytes).png().toBuffer();
      return {response:()=>new Response(bytes,{headers:{'content-type':options.format}})};
    }
   };
   return chain;
  }
 };
 const env={IMAGES,ARTWORK:new Bucket()},map={product:'Hoodie'},area={width:4500,height:5400},report={referenceCompositor:'Sharp',segmentation:'fixture only; provider not called',checks:[]};
 for(const finish of ['soft','rectangle','cutout']){
  if(finish==='cutout')await prepareApparelArtwork(env,input,finish,{allowCreate:true});
  const result=await composeProductLayout(env,input,{width,height},area,map,{finish,scale:85},1200);
  fs.writeFileSync(path.join(out,finish+'.png'),result.bytes);
  const pixels=await sharp(result.bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(pixels.info.width,1200);assert.equal(pixels.info.height,1440);assert.equal(pixels.info.channels,4);
  const alpha=(x,y)=>pixels.data[(y*1200+x)*4+3];
  assert.equal(alpha(0,0),0);assert.equal(alpha(1199,1439),0);assert.equal(alpha(600,720),255);
  let opaque=0,transparent=0,partial=0;for(let i=3;i<pixels.data.length;i+=4){if(pixels.data[i]===0)transparent++;else if(pixels.data[i]===255)opaque++;else partial++}
  assert.ok(opaque>10000&&transparent>10000);
  if(finish==='soft')assert.equal(partial,0,'halftone alpha is binary, not soft grayscale');
  const marked=await watermarkProductSource(env,result.bytes,'image/png');
  const markedPixels=await sharp(marked).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(markedPixels.info.width,1200);assert.equal(markedPixels.info.height,1440);
  for(let i=3;i<pixels.data.length;i+=4)assert.equal(markedPixels.data[i],pixels.data[i],'watermark must not add an opaque print box');
  assert.notDeepEqual(Buffer.from(marked),Buffer.from(result.bytes),'protected supplier proof differs from clean print file');
  const onBlack=await sharp({create:{width:1200,height:1440,channels:3,background:'#181818'}}).composite([{input:Buffer.from(result.bytes)}]).png().toBuffer();fs.writeFileSync(path.join(out,finish+'-on-fabric.png'),onBlack);
  report.checks.push({finish,width:1200,height:1440,opaque,transparent,partial,protectedAlphaUnchanged:true});
 }
 assert.equal(calls.filter(([op,a])=>op==='transform'&&a.segment).length,1);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
