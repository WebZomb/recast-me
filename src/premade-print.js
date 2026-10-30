import {read,fault,hash} from './commerce-store.js';
export async function digestBytes(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function verifiedPremadePrint(env,approval,{checkBytes=true}={}){
 const file=approval?.premadePrint;
 if(!file||!/^shop\/printfiles\/[a-z0-9-]{1,100}\/[a-f0-9]{64}\.jpg$/.test(file.key||'')||!/^[a-f0-9]{64}$/.test(file.sha256||'')||!file.key.endsWith('/'+file.sha256+'.jpg')||file.mime!=='image/jpeg'||file.sku!==approval.sku||file.sourceHash!==approval.sourceHash||file.proofHash!==approval.proofHash||file.placementHash!==await hash(JSON.stringify(approval.position)))throw fault('premade_print_unavailable','This finished gift needs a print-file review before checkout.',409);
 const meta=await read(env,`requests/${approval.requestId}/request.json`);
 if(meta?.source!=='premade-catalog'||!meta.catalogRightsConfirmedAt||meta.catalogMasterHash!==file.artworkRevision)throw fault('premade_print_unavailable','This design is not approved catalog stock.',409);
 if(checkBytes){const obj=await env.ARTWORK.get(file.key);if(!obj||await digestBytes(await obj.arrayBuffer())!==file.sha256)throw fault('premade_print_changed','The approved print file could not be verified.',409);}
 return {finalKey:file.key,finalHash:file.sha256,finalMime:file.mime,finishMethod:'premade-locked-v1'};
}
