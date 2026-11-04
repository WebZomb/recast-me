import {read,fault,hash} from './commerce-store.js';
export async function digestBytes(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function verifiedPremadePrint(env,approval,{checkBytes=true}={}){
 const file=approval?.premadePrint;
 // Transparent sheets retain cut gaps. PNG permission is restricted to the
 // existing version-8 six-picture sticker composer, not arbitrary uploads.
 const png=file?.mime==='image/png'&&approval.sku==='RECAST-STICKER-PACK'&&approval.design?.product==='Sticker Sheet'&&approval.design?.version===8&&approval.design?.layout==='six-pictures';
 const ext=png?'png':'jpg';
 const validPath=typeof file?.key==='string'&&/^shop\/printfiles\/[a-z0-9-]{1,100}\/[a-f0-9]{64}\.(jpg|png)$/.test(file.key)&&file.key.endsWith('/'+file.sha256+'.'+ext);
 if(!file||!validPath||!/^[a-f0-9]{64}$/.test(file.sha256||'')||(!png&&file.mime!=='image/jpeg')||file.sku!==approval.sku||file.sourceHash!==approval.sourceHash||file.proofHash!==approval.proofHash||file.placementHash!==await hash(JSON.stringify(approval.position)))throw fault('premade_print_unavailable','This finished gift needs a print-file review before checkout.',409);
 const meta=await read(env,`requests/${approval.requestId}/request.json`);
 if(meta?.source!=='premade-catalog'||!meta.catalogRightsConfirmedAt||meta.catalogMasterHash!==file.artworkRevision)throw fault('premade_print_unavailable','This design is not approved catalog stock.',409);
 if(checkBytes){
  const obj=await env.ARTWORK.get(file.key);
  if(!obj)throw fault('premade_print_changed','The approved print file could not be verified.',409);
  const bytes=new Uint8Array(await obj.arrayBuffer());
  if(await digestBytes(bytes)!==file.sha256||(png&&(bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71||bytes[4]!==13||bytes[5]!==10||bytes[6]!==26||bytes[7]!==10)))throw fault('premade_print_changed','The approved print file could not be verified.',409);
 }
 return {finalKey:file.key,finalHash:file.sha256,finalMime:file.mime,finishMethod:'premade-locked-v1'};
}
