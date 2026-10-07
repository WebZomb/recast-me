import {change,read,hash,equal,randomToken,fault,sameOrigin,privateJson,composeMugLayout,composeProductLayout} from './commerce-store.js';
const designKey=id=>`commerce/designs/${id}.json`;
const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9._-]{1,180}$/.test(v);
async function authorizedOrderCapability(env,requestId,body){
  if(body?.proofToken){
    const token=String(body.proofToken||"");
    if(!/^[a-f0-9]{48}$/.test(token))throw fault('order_access','Use the private order link for this order.',403);
    const preview=await read(env,`commerce/checkout-previews/${token}.json`);
    if(!preview||preview.requestId!==requestId)throw fault('order_access','Use the private order link for this order.',403);
    return true;
  }
  await authorizedArtwork(env,requestId,body?.token);
  return true;
}
export async function authorizedArtwork(env,id,token){
  if(!validId(id))throw fault('bad_artwork','Invalid artwork.',400);
  const meta=await read(env,`requests/${id}/request.json`);
  if(!meta||!equal(meta.accessToken,token))throw fault('artwork_access','Use the private link for this artwork.',403);
  return meta;
}
async function source(env,id){
  const obj=await env.ARTWORK.get(`requests/${id}/preview.b64`);
  if(!obj)throw fault('artwork_missing','The selected artwork is unavailable.',404);
  const b64=await obj.text();return {b64,sourceHash:await hash(b64)};
}
export async function designFor(env,job){
  return await read(env,designKey(job.id)) || {revision:0,selectedRequestId:job.requestId,approvedAt:null,proof:null};
}
export function publicDesign(design){return {revision:design.revision,selectedRequestId:design.selectedRequestId,approvedAt:design.approvedAt||null,proof:design.proof?{images:design.proof.images}:null}}
function editable(job,d,revision){
  if(job.digital)throw fault('physical_only','Digital downloads keep the artwork purchased.',400);
  if(job.printfulOrderId||job.sentToProductionAt||d.approvedAt)throw fault('design_locked','This design is already locked for printing.');
  if(job.status==='on_hold')throw fault('order_on_hold','This order needs an owner review before changes.');
  if(d.revision!==revision)throw fault('stale_design','The design changed in another tab. Refresh before approving.');
}
export async function approvedDesign(env,job){
  const d=await designFor(env,job);
  if(!d.approvedAt||!d.snapshotKey||!d.sourceHash||!d.proof)throw fault('customer_approval_required','The customer must review the product preview and approve the design first.');
  return d;
}
export async function customerDesignAction(request,env,id,action,services){
  sameOrigin(request);
  if(!validId(id))throw fault('bad_order','Invalid order.',400);
  const job=await read(env,`jobs/${id}.json`);
  if(!job)throw fault('order_missing','Order not found.',404);
  const body=await request.json();
  await authorizedOrderCapability(env,job.requestId,body);
  await services.verifyPaid(env,job);
  const initial=await designFor(env,job),revision=Number(body.revision);
  editable(job,initial,revision);
  if(action==='swap'){
    await authorizedArtwork(env,body.selectedRequestId,body.selectedAccessToken);
    // Own copy: deleting an unpaid candidate cannot erase the selected order art.
    const src=await source(env,body.selectedRequestId);
    const copy=`commerce/artwork/${await hash(id)}/${src.sourceHash}.b64`;
    await env.ARTWORK.put(copy,src.b64,{onlyIf:new Headers({'If-None-Match':'*'})});
    const d=await change(env,designKey(id),initial,v=>{editable(job,v,revision);return {...v,selectedRequestId:body.selectedRequestId,sourceHash:src.sourceHash,snapshotKey:copy,proof:null,revision:v.revision+1}});
    return privateJson({ok:true,design:publicDesign(d)});
  }
  if(action==='proof'){
    const meta=await read(env,`requests/${initial.selectedRequestId}/request.json`);
    if(!meta)throw fault('artwork_missing','The selected artwork is unavailable.',404);
    const src=await source(env,initial.selectedRequestId);
    const result=await services.proof(request,env,job,meta);
    if(result.status!=='completed')return privateJson({ok:true,status:result.status,waitSeconds:10});
    if(!result.images?.length)throw fault('proof_missing','The product preview is not ready yet.');
    const snapshotKey=`commerce/artwork/${await hash(id)}/${src.sourceHash}.b64`;
    await env.ARTWORK.put(snapshotKey,src.b64,{onlyIf:new Headers({'If-None-Match':'*'})});
    const d=await change(env,designKey(id),initial,v=>{
      editable(job,v,revision);
      return {...v,sourceHash:src.sourceHash,snapshotKey,proof:{images:result.images,position:result.position,design:result.design||job.productDesign||null,sku:job.sku,quantity:job.quantity,sourceHash:src.sourceHash},revision:v.revision+1};
    });
    return privateJson({ok:true,status:'completed',design:publicDesign(d)});
  }
  if(action==='approve'){
    if(body.confirm!=='APPROVE_FOR_PRINT')throw fault('approval_required','Confirm your design before printing.');
    const d=await change(env,designKey(id),initial,v=>{
      editable(job,v,revision);
      if(!v.proof||v.proof.sku!==job.sku||v.proof.quantity!==job.quantity||v.proof.sourceHash!==v.sourceHash||!v.snapshotKey)throw fault('proof_required','Review the product preview for this design first.');
      if(job.productDesignRequired&&JSON.stringify(v.proof.design||null)!==JSON.stringify(job.productDesign||null))throw fault('proof_layout_changed','The reviewed product layout no longer matches the purchased layout.');
      return {...v,approvedAt:new Date().toISOString(),printToken:randomToken(),revision:v.revision+1};
    });
    return privateJson({ok:true,design:publicDesign(d)});
  }
  throw fault('unknown_action','Unknown design action.',404);
}
export async function printDesignFile(request,env,job,verifyPaid){
  const d=await approvedDesign(env,job);
  if(!equal(d.printToken,new URL(request.url).searchParams.get('token')))return new Response('Not found',{status:404});
  await verifyPaid(env,job);
  if(!d.finalKey||!d.finalHash)throw fault('print_not_ready','Print file not ready.',404);
  const object=await env.ARTWORK.get(d.finalKey);
  if(!object)throw fault('print_not_ready','Print file not ready.',404);
  return new Response(object.body,{headers:{'content-type':d.finalMime||'image/jpeg','cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
}
export async function finishApprovedDesign(env,job){
  const d=await approvedDesign(env,job);
  if(d.finalKey)return d;
  const stored=await env.ARTWORK.get(d.snapshotKey);
  if(!stored)throw fault('artwork_missing','Approved artwork missing.',404);
  const b64=await stored.text();
  if(await hash(b64)!==d.sourceHash)throw fault('artwork_changed','Approved artwork integrity check failed.',503);
  const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
  if(!env.IMAGES)throw fault('images_required','Print finishing needs Cloudflare Images.',503);
  // Durable claim: timeout/crash requires review, never a silent billable retry.
  const claim=`commerce/finishes/${await hash(job.id)}/${d.sourceHash}.claim`;
  const claimed=await env.ARTWORK.put(claim,'started',{onlyIf:new Headers({'If-None-Match':'*'})});
  if(!claimed)throw fault('finish_in_progress','Print finishing has already started. Check its saved result before retrying.');
  let finalBytes,finalMime='image/jpeg',finishMethod='preserve-interpolate';
  const area={width:Number(d.proof?.position?.area_width),height:Number(d.proof?.position?.area_height)};
  const design=d.proof?.design||job.productDesign||null;
  if(design&&Number(design.version)>=4){
    if(!(area.width>0&&area.height>0))throw fault('proof_placement_missing','The approved product layout is missing its print area.',503);
    const info=await env.IMAGES.info(new Blob([bytes]).stream());
    const composed=await composeProductLayout(env,bytes,info,area,{product:job.product},design,4096);
    finalBytes=composed.bytes;finalMime=composed.mime||'image/jpeg';finishMethod=[5,6].includes(Number(design.version))&&design.finish?'apparel-v'+design.version+'-clean-'+design.finish:'product-layout-v'+design.version+'-clean';
  }else if(job.product==='Mug'&&design?.background==='scene-fill'){
    if(!(area.width>0&&area.height>0))throw fault('proof_placement_missing','The approved mug layout is missing its print area.',503);
    const info=await env.IMAGES.info(new Blob([bytes]).stream());
    const composed=await composeMugLayout(env,bytes,info,area,design,4096);
    finalBytes=composed.bytes;finishMethod='mug-layout-v3-clean';
  }else{
    const out=await env.IMAGES.input(new Blob([bytes]).stream()).transform({width:4096,fit:'scale-up',upscale:'interpolate'}).output({format:'image/jpeg',quality:95});
    const response=await out.response();
    if(!response.ok)throw fault('finish_failed','Print finishing did not complete.',502);
    finalBytes=new Uint8Array(await response.arrayBuffer());
  }
  if(finalMime==='image/png'?![137,80,78,71,13,10,26,10].every((n,i)=>finalBytes[i]===n):(finalBytes[0]!==255||finalBytes[1]!==216||finalBytes[2]!==255))throw fault('finish_invalid','Print finishing returned an invalid image.',502);
  const finalHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',finalBytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  const finalKey=`commerce/finishes/${await hash(job.id)}/${finalHash}.${finalMime==='image/png'?'png':'jpg'}`;
  await env.ARTWORK.put(finalKey,finalBytes,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:finalMime}});
  return change(env,designKey(job.id),null,v=>{
    if(v?.sourceHash!==d.sourceHash||v?.approvedAt!==d.approvedAt)throw fault('design_changed','Approved design changed unexpectedly.',503);
    return {...v,finalKey,finalHash,finalMime,finishMethod,finishedAt:new Date().toISOString()};
  });
}
