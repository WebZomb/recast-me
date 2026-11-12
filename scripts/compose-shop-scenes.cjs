/* Exact-source marketing compositing. No image generation, print-file mutation or supplier calls. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('sharp'); // Offline build tool; install sharp@0.34.4 separately, not in production.
const repo=path.resolve(__dirname,'..'),root=process.env.RECAST_SCENE_WORKSPACE,SIZE=1254;
if(!root||!path.isAbsolute(root))throw Error('Set RECAST_SCENE_WORKSPACE to an absolute offline workspace containing originals/<designId>.png');
const gallery=JSON.parse(fs.readFileSync(path.join(repo,'public/shop-gallery.json'),'utf8')).designs;
const qa=path.join(root,'qa'),out=path.join(repo,'public/shop-assets/complete-scenes');fs.mkdirSync(out,{recursive:true});fs.mkdirSync(qa,{recursive:true});
const rect=(x,y,w,h,r=0.04)=>({quad:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],radius:r});
const configs={
 'coaster-sets':{base:'shop-assets/sales/golden-village-coaster-sets-20261109.webp',faces:[
 {quad:[[44,134],[339,134],[345,401],[40,401]],radius:0.09},
 {quad:[[358,134],[642,134],[665,400],[359,400]],radius:0.09},
 {quad:[[47,425],[355,425],[385,714],[50,714]],radius:0.09},
 {quad:[[382,425],[704,425],[743,713],[403,713]],radius:0.09}]},
 'magnet-sets':{base:'shop-assets/sales/golden-village-magnet-sets-20261109.webp',faces:[rect(201,99,287,292,0.045),rect(521,252,288,293,0.045),rect(209,464,290,293,0.045)]},
 'sticker-sheets':{base:'shop-assets/sales/golden-village-sticker-sheets-20261109.webp',faces:[rect(183,46,259,250,0.062),rect(457,46,257,250,0.062),rect(183,309,259,250,0.062),rect(457,309,258,251,0.062),rect(183,572,259,250,0.062),rect(457,572,258,250,0.062)]}
};
Object.assign(configs,require('./shop-scene-templates.cjs'));
// Solve an eight-parameter destination-to-source projective mapping.
function solve(A,b){const n=b.length;A=A.map((r,i)=>[...r,b[i]]);for(let col=0;col<n;col++){let k=col;for(let j=col+1;j<n;j++)if(Math.abs(A[j][col])>Math.abs(A[k][col]))k=j;[A[col],A[k]]=[A[k],A[col]];const d=A[col][col];if(Math.abs(d)<1e-12)throw Error('Degenerate product face');for(let j=col;j<=n;j++)A[col][j]/=d;for(let i=0;i<n;i++)if(i!==col){const f=A[i][col];for(let j=col;j<=n;j++)A[i][j]-=f*A[col][j];}}return A.map(r=>r[n]);}
function homography(q){const A=[],b=[],src=[[0,0],[1,0],[1,1],[0,1]];q.forEach(([x,y],i)=>{const [u,v]=src[i];A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)});return solve(A,b);}

function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))yes=!yes;}return yes;}
function interpolate(t,points){t=Math.max(0,Math.min(1,t));for(let i=1;i<points.length;i++)if(t<=points[i][0]){const [a,x]=points[i-1],[b,y]=points[i];return x+(y-x)*(t-a)/(b-a);}return points.at(-1)[1];}
function shapePoint(type,u,v){
 if(type==='pillow'){const l=94+62*Math.sin(Math.PI*v)+24*v,r=819-60*Math.sin(Math.PI*v)+30*v,t=91+44*Math.sin(Math.PI*u),b=748-8*u-18*Math.sin(Math.PI*u);return [l+(r-l)*u,t+(b-t)*v];}
 if(type==='blanket'){const l=interpolate(v,[[0,74],[.1,71],[.225,74],[.365,76],[.5,52],[.64,24],[.78,19],[.92,4],[1,0]]),r=interpolate(v,[[0,784],[.1,805],[.225,827],[.365,852],[.5,880],[.64,888],[.78,888],[.92,889],[1,900]]),t=86+3*Math.sin(14*Math.PI*u),b=795+33*u+9*Math.sin(10*Math.PI*u)+5*Math.cos(17*Math.PI*u);return [l+(r-l)*u,t+(b-t)*v];}
 if(type==='tumbler'){const l=250+50*v,r=650-48*v,t=123+13*Math.sin(Math.PI*u),b=827+25*Math.sin(Math.PI*u);return [l+(r-l)*u,t+(b-t)*v];}
 throw Error('Unknown surface '+type);
}
function inverseShape(type,x,y,bounds){let u=(x-bounds[0])/(bounds[2]-bounds[0]),v=(y-bounds[1])/(bounds[3]-bounds[1]);for(let i=0;i<6;i++){const p=shapePoint(type,u,v),pu=shapePoint(type,u+.0001,v),pv=shapePoint(type,u,v+.0001),a=(pu[0]-p[0])/.0001,b=(pv[0]-p[0])/.0001,c=(pu[1]-p[1])/.0001,d=(pv[1]-p[1])/.0001,det=a*d-b*c;if(Math.abs(det)<1e-8)break;const dx=p[0]-x,dy=p[1]-y;u-=(d*dx-b*dy)/det;v-=(-c*dx+a*dy)/det;if(Math.abs(dx)+Math.abs(dy)<.05)break;}return [u,v];}
function roundHole(x,y,h){const cx=h.x+h.w/2,cy=h.y+h.h/2,dx=Math.max(Math.abs(x-cx)-(h.w/2-h.r),0),dy=Math.max(Math.abs(y-cy)-(h.h/2-h.r),0);return Math.abs(x-cx)<=h.w/2&&Math.abs(y-cy)<=h.h/2&&Math.hypot(dx,dy)<=h.r;}
function buildMap(face){
 const ratio=SIZE/900,q=face.quad?.map(p=>p.map(v=>v*ratio)),h=q?homography(q):null,bounds=face.bounds||[Math.min(...face.quad.map(p=>p[0])),Math.min(...face.quad.map(p=>p[1])),Math.max(...face.quad.map(p=>p[0])),Math.max(...face.quad.map(p=>p[1]))];
 const x0=Math.max(0,Math.floor(bounds[0]*ratio)),x1=Math.min(SIZE-1,Math.ceil(bounds[2]*ratio)),y0=Math.max(0,Math.floor(bounds[1]*ratio)),y1=Math.min(SIZE-1,Math.ceil(bounds[3]*ratio));const indices=[],coords=[],alphas=[],shades=[],radii=face.radii||[face.radius||0,face.radius||0],edge=Math.min(x1-x0,y1-y0);
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
  const px=(x+.5)/ratio,py=(y+.5)/ratio;if(face.holes?.some(poly=>inside(px,py,poly))||face.roundHoles?.some(r=>roundHole(px,py,r)))continue;
  let u,v;if(h){const den=h[6]*(x+.5)+h[7]*(y+.5)+1;u=(h[0]*(x+.5)+h[1]*(y+.5)+h[2])/den;v=(h[3]*(x+.5)+h[4]*(y+.5)+h[5])/den;}else [u,v]=inverseShape(face.shape,px,py,bounds);
  const extended=face.shape==='blanket';if(!Number.isFinite(u)||u<(extended?-.01:0)||u>(extended?1.01:1)||v<(extended?-.009:0)||v>(extended?1.028:1))continue;
  const [rx,ry]=radii;let a=1;if(rx&&ry){const dx=Math.max(rx-u,0,u-(1-rx))/rx,dy=Math.max(ry-v,0,v-(1-ry))/ry;a=Math.min(1,Math.max(0,(1-Math.hypot(dx,dy))*Math.min(rx,ry)*edge+.5));}
  if(face.fade){const d=Math.min(u,1-u,v,1-v),rough=.006*(Math.sin(x*1.7+y*.9)+Math.sin(x*.37-y*1.9));a*=Math.max(0,Math.min(1,(d+rough)/face.fade));}
  if(a<=0)continue;
  let shade=face.shade||1;if(face.shape==='blanket'&&(u<0||u>1||v<0||v>1))shade*=.78;
  if(face.fabric)shade*=.95+.04*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+.006*Math.sin(x*1.8)*Math.cos(y*1.7);
  if(face.shape==='pillow')shade*=.97+.03*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
  if(face.shape==='blanket'){const fold=Math.sin(18*Math.PI*u+3*v),g=(p,w)=>Math.exp(-(((u-p)/w)**2)),creases=.18*g(.035,.014)+.13*g(.105,.018)+.17*g(.43,.022)+.15*g(.965,.024);shade*=.99-creases*Math.exp(-v*3.8)+.04*Math.sin(18*Math.PI*u+3*v)*Math.exp(-v*3)+.06*Math.sin(16*Math.PI*u)*Math.max(0,(v-.82)/.18);u+=.011*fold*Math.sin(Math.PI*u)*Math.sin(Math.PI*v);}
  if(face.cylinder){shade*=.81+.19*Math.sqrt(Math.max(0,1-(2*u-1)**2));u=.5+Math.asin(Math.max(-1,Math.min(1,2*u-1)))/Math.PI;}
  if(face.puzzle){const ux=u*18,vy=v*14,xf=ux-Math.floor(ux),yf=vy-Math.floor(vy),tab=t=>t>.32&&t<.68?.16*Math.sin(Math.PI*(t-.32)/.36):0;const dv=Math.abs(ux-Math.round(ux)-((Math.round(ux)+Math.floor(vy))%2?1:-1)*tab(yf))*edge/18,dh=Math.abs(vy-Math.round(vy)-((Math.floor(ux)+Math.round(vy))%2?1:-1)*tab(xf))*edge/14,dist=Math.min(dv,dh);if(dist<.7)shade*=.64;else if(dist<1.4)shade*=1.09;}
  if(face.fitArtwork){u=.5+(u-.5)*face.fitArtwork;u=u<0?-u:u>1?2-u:u;}
  if(face.coverRatio){const ar=face.coverRatio;if(ar<1)u=.5+(u-.5)*ar;else v=.5+(v-.5)/ar;}
  if(face.uvRect){const [l,t,w,hh]=face.uvRect;u=l+u*w;v=t+v*hh;}
  indices.push((y*SIZE+x)*3);coords.push(u,v);alphas.push(a);shades.push(shade);
 }
 return {indices:Uint32Array.from(indices),coords:Float32Array.from(coords),alphas:Float32Array.from(alphas),shades:Float32Array.from(shades)};
}
async function prepareBase(file,cfg){const original=await sharp(file).resize(SIZE,SIZE).removeAlpha().raw().toBuffer(),base=Buffer.from(original),sc=SIZE/900;for(const patch of cfg.clean||[]){const [x,y,w,h]=patch.rect.map(v=>Math.round(v*sc)),[sx,sy,sw,sh]=patch.sample.map(v=>Math.round(v*sc));const pixels=await sharp(original,{raw:{width:SIZE,height:SIZE,channels:3}}).extract({left:sx,top:sy,width:sw,height:sh}).resize(w,h).raw().toBuffer();for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){if(patch.exclude&&inside((x+xx)/sc,(y+yy)/sc,patch.exclude))continue;const a=Math.min(1,Math.min(xx+1,yy+1,w-xx,h-yy)/(patch.feather*sc)),i=((y+yy)*SIZE+x+xx)*3,j=(yy*w+xx)*3;for(let c=0;c<3;c++)base[i+c]=Math.round(base[i+c]*(1-a)+pixels[j+c]*a);}}
 return {base,original};}
function composite(base,source,maps,verticalOffset=0,phoneSafeSource=null){
 const result=Buffer.from(base);
 for(const m of maps)for(let k=0;k<m.indices.length;k++){
  const idx=m.indices[k];let su=m.coords[k*2],sv=m.coords[k*2+1]+verticalOffset,input=source;
  if(phoneSafeSource){su=.5+(su-.5)*1.08;sv=(sv-.20)*1.08;if(sv<0)sv=Math.min(.06,-sv*.25);}
  const u=Math.min(SIZE-1,Math.max(0,su*(SIZE-1))),v=Math.min(SIZE-1,Math.max(0,sv*(SIZE-1))),x=Math.floor(u),y=Math.floor(v),x2=Math.min(SIZE-1,x+1),y2=Math.min(SIZE-1,y+1),tx=u-x,ty=v-y,a=m.alphas[k],shade=m.shades[k];
  for(let c=0;c<3;c++){const val=((input[(y*SIZE+x)*3+c]*(1-tx)+input[(y*SIZE+x2)*3+c]*tx)*(1-ty)+(input[(y2*SIZE+x)*3+c]*(1-tx)+input[(y2*SIZE+x2)*3+c]*tx)*ty)*shade;result[idx+c]=Math.min(255,Math.max(0,Math.round(val*a+result[idx+c]*(1-a))));}
 }
 return result;
}
function restore(result,original,polygons){const sc=SIZE/900;for(const poly of polygons||[]){const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);for(let y=Math.max(0,Math.floor(Math.min(...ys)*sc));y<Math.min(SIZE,Math.ceil(Math.max(...ys)*sc));y++)for(let x=Math.max(0,Math.floor(Math.min(...xs)*sc));x<Math.min(SIZE,Math.ceil(Math.max(...xs)*sc));x++)if(inside(x/sc,y/sc,poly)){const i=(y*SIZE+x)*3;result[i]=original[i];result[i+1]=original[i+1];result[i+2]=original[i+2];}}}
async function main(){const sample=process.argv.includes('--sample'), ids=sample?['christmas-village-siamese-cat','christmas-archive-white-persian-rose','christmas-archive-ragdoll-ice-palace']:gallery.map(d=>d.designId),manifest=[];
 for(const [collection,cfg] of Object.entries(configs)){if(process.argv.find(a=>a.startsWith('--only='))&&collection!==process.argv.find(a=>a.startsWith('--only=')).slice(7))continue;if(process.argv.includes('--extra-only')&&['coaster-sets','magnet-sets','sticker-sheets'].includes(collection))continue;const {base,original}=await prepareBase(path.join(repo,'public',cfg.base),cfg),maps=cfg.faces.map(buildMap);for(const id of ids){const d=gallery.find(x=>x.designId===id),sourceFile=path.join(root,'originals',id+'.png'),bytes=fs.readFileSync(sourceFile),source=await sharp(bytes).resize(SIZE,SIZE).removeAlpha().raw().toBuffer(),softSource=collection==='phone-cases'&&id.startsWith('christmas-archive-')?await sharp(bytes).resize(SIZE,SIZE).blur(24).removeAlpha().raw().toBuffer():null,pixels=composite(base,source,maps,0,softSource),stem=id+'-'+collection+'-v1';restore(pixels,original,cfg.restore);const target=path.join(out,stem+'.webp'),thumb=path.join(out,stem+'-640.webp');await sharp(pixels,{raw:{width:SIZE,height:SIZE,channels:3}}).webp({quality:88,effort:5}).toFile(target);await sharp(pixels,{raw:{width:SIZE,height:SIZE,channels:3}}).resize(640,640).webp({quality:84,effort:5}).toFile(thumb);if(sample)await sharp(pixels,{raw:{width:SIZE,height:SIZE,channels:3}}).resize(750,750).jpeg({quality:92}).toFile(path.join(qa,id+'-'+collection+'.jpg'));manifest.push({collection,designId:d.designId,artworkRevision:d.artworkRevision,url:'/shop-assets/complete-scenes/'+stem+'.webp',thumbnailUrl:'/shop-assets/complete-scenes/'+stem+'-640.webp',sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),template:cfg.base,printedSurfaces:cfg.faces.length});console.log('Rendered',manifest.length,id,collection);}}
 const manifestPath=path.join(root,sample?'sample-manifest.json':'render-manifest.json');let saved=manifest;if(!sample&&process.argv.some(a=>a.startsWith('--only='))&&fs.existsSync(manifestPath)){const combined=new Map(JSON.parse(fs.readFileSync(manifestPath,'utf8')).map(e=>[e.designId+'|'+e.collection,e]));for(const e of manifest)combined.set(e.designId+'|'+e.collection,e);saved=[...combined.values()];}fs.writeFileSync(manifestPath,JSON.stringify(saved,null,2));console.log('DONE',manifest.length,'saved coverage',saved.length);
}
main().catch(e=>{console.error(e);process.exitCode=1});
