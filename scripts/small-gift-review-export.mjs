// Read-only production QA export: known public-commercial catalog art only.
// Never export raw R2 records, customer images, access tokens or credentials.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const requestId='RC-SHOP-GOLDEN-RETRIEVER-V1';
const definitions=[
 ['coaster','RECAST-COASTER-SET','christmas-village-golden-retriever-coaster-4pack','shop/preparation/coasters/v1/golden-retriever-4pack.json'],
 ['magnet','RECAST-MAGNET-SET','christmas-village-golden-retriever-magnet-3pack','shop/preparation/magnets/v1/golden-retriever-3pack.json'],
 ['sheet','RECAST-STICKER-PACK','christmas-village-golden-retriever-sticker-sheet-six','shop/preparation/sticker-sheets/v1/golden-retriever-six.json']
];
if(!process.env.CLOUDFLARE_API_TOKEN||!process.env.CLOUDFLARE_ACCOUNT_ID)throw Error('Authorized production storage access is required.');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'recast-proof-private-'));
const output=path.resolve('small-gift-review-evidence');fs.mkdirSync(output,{recursive:true});
let sequence=0;
const digest=b=>createHash('sha256').update(b).digest('hex');
function object(key,{optional=false}={}){
 const target=path.join(temp,String(++sequence));
 try{
  execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','get','recast-me-artwork/'+key,'--remote','--file',target],{stdio:'pipe',timeout:45000,env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false'}});
  return fs.readFileSync(target);
 }catch{if(optional)return null;throw Error('Could not read the authorized commercial QA object.');}
}
const json=(key,options)=>{const bytes=object(key,options);return bytes?JSON.parse(bytes.toString('utf8')):null;};
async function image(url,file,kind){
 const u=new URL(url);
 if(kind==='source'){
  if(u.protocol!=='https:'||u.hostname!=='cdn.shopify.com'||!u.pathname.startsWith('/s/files/1/0854/3810/3796/files/'))throw Error('Source does not belong to the approved commercial artwork library.');
 }else if(u.origin!=='https://recastmeai.com'||!u.pathname.startsWith('/api/mockup/image/'+requestId+'/')&&!u.pathname.startsWith('/api/approved-preview/'))throw Error('Supplier proof origin rejected.');
 const res=await fetch(u,{redirect:'manual',signal:AbortSignal.timeout(30000)});
 if(!res.ok||res.status!==200||!/^image\/(png|jpeg|webp)/.test(res.headers.get('content-type')||''))throw Error('The saved manufacturer image could not be downloaded.');
 const b=Buffer.from(await res.arrayBuffer());
 if(b.length<100||b.length>18000000)throw Error('Unexpected supplier picture size.');
 fs.writeFileSync(path.join(output,file),b);
 return {file,sha256:digest(b),bytes:b.length};
}
const report={readOnly:true,checkoutChanged:false,original:null,items:[]};
try{
 const gallery=JSON.parse(fs.readFileSync('public/shop-gallery.json','utf8'));
 const original=gallery.designs.find(d=>d.designId==='christmas-village-golden-retriever');
 if(!original||!/^[a-f0-9]{64}$/.test(original.artworkRevision))throw Error('Commercial source identity missing.');
 report.original=await image(original.artworkImage,'original.png','source');
 if(report.original.sha256!==original.artworkRevision)throw Error('Original artwork does not match pinned source revision.');
 for(const [name,sku,id,stateKey] of definitions){
  const item={id,sku,status:'unavailable',pictures:[]};report.items.push(item);
  const pilot=json(stateKey);
  if(pilot?.status!=='ready_for_review'||!/^[a-zA-Z0-9._-]{1,180}$/.test(pilot.mockupId||'')){item.status=pilot?.status||'no_supplier_proof';continue;}
  const task=json(`mockups/${requestId}/${sku}/${pilot.mockupId}/task.json`);
  if(task?.status!=='completed'||task.sku!==sku||task.requestId!==requestId||task.mockupId!==pilot.mockupId||!Array.isArray(task.images))throw Error('Saved manufacturer task identity mismatch.');
  for(const [i,view] of task.images.slice(0,4).entries())item.pictures.push(await image(view.url,name+'-supplier-'+i+'.png','proof'));
  const state=json('shop/preparation/small-gifts/v1/'+id+'.json',{optional:true});
  item.status=state?.status||'printfile_not_prepared';item.code=state?.code||null;
  if(state?.offer){
   const offer=state.offer;
   if(offer.requestId!==requestId||offer.sku!==sku||offer.artworkRevision!==original.artworkRevision)throw Error('Frozen gift draft identity mismatch.');
   const token=offer.approvalToken;
   if(!/^[a-f0-9]{48}$/.test(token||''))throw Error('Frozen approval reference invalid.');
   const approval=json('commerce/preapprovals/'+token+'.json');
   const file=approval?.premadePrint;
   if(!file||!file.key.startsWith('shop/printfiles/'+id+'/')||!/^shop\/printfiles\/[a-z0-9-]+\/[a-f0-9]{64}\.(jpg|png)$/.test(file.key))throw Error('Production print file identity missing.');
   const bytes=object(file.key);
   if(digest(bytes)!==file.sha256)throw Error('Production print file hash changed.');
   const filename=name+'-clean-print.'+(file.mime==='image/png'?'png':'jpg');
   fs.writeFileSync(path.join(output,filename),bytes);
   item.printFile={file:filename,sha256:file.sha256,mime:file.mime,size:state.printSize};
   item.reviewSignature=state.reviewSignature;
   item.priceCents=offer.priceCents;
   item.sourceRevision=offer.artworkRevision;
   item.placement=approval.position;
   item.design=approval.design;
  }
 }
 fs.writeFileSync(path.join(output,'review.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({exported:report.items.map(x=>({id:x.id,status:x.status,pictures:x.pictures.length,printFile:!!x.printFile,code:x.code})),noCustomerData:true,noProductionOrders:true}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
