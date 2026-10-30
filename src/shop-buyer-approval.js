import {read,hash,fault} from './commerce-store.js';
// A public catalog proof must never become a shared order-access capability.
// Every basket owner receives a distinct immutable approval and proof token.
export async function clonePremadeApproval(env,identity,offer,original){
 const token=(await hash(JSON.stringify(['premade-buyer-v1',identity.ownerId,identity.basketId,offer.id,offer.artworkRevision,original.token]))).slice(0,48);
 const buyerScope=await hash(JSON.stringify([identity.ownerId,identity.basketId]));
 const key=`commerce/preapprovals/${token}.json`,old=await read(env,key);
 if(old){if(old.catalogSourceApproval!==original.token||old.buyerScope!==buyerScope||old.sourceHash!==original.sourceHash||old.proofHash!==original.proofHash)throw fault('shop_approval_changed','Your saved gift approval needs review.',409);return old;}
 const sourcePreview=await read(env,`commerce/checkout-previews/${original.token}.json`);
 if(!sourcePreview)throw fault('shop_preview_missing','The finished gift preview is unavailable.',503);
 const files=['.jpg',...(sourcePreview.views||[]).slice(0,3).map(v=>'/view-'+v.index+'.jpg')];
 for(const suffix of new Set(files)){
  const object=await env.ARTWORK.get(`commerce/checkout-previews/${original.token}${suffix}`);
  if(!object)throw fault('shop_preview_missing','The finished gift preview is unavailable.',503);
  await env.ARTWORK.put(`commerce/checkout-previews/${token}${suffix}`,object.body,{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'image/jpeg',cacheControl:'private, no-store'}});
 }
 const origin=String(env.LIVE_APP_URL||env.PUBLIC_APP_URL||new URL(offer.mockupUrl).origin).replace(/\/$/,'');
 const images=(sourcePreview.views||[]).slice(0,3).map(v=>({title:v.title||'Product preview',url:`${origin}/api/approved-preview/${token}/${v.index}`}));
 const clone={...original,token,previewToken:token,images,buyerScope,catalogSourceApproval:original.token,catalogOfferId:offer.id,catalogRevision:offer.artworkRevision};
 await env.ARTWORK.put(`commerce/checkout-previews/${token}.json`,JSON.stringify({...sourcePreview,token,buyerScope,catalogOfferId:offer.id}),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 const written=await env.ARTWORK.put(key,JSON.stringify(clone),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 if(written)return clone;
 const saved=await read(env,key);if(saved?.buyerScope!==buyerScope||saved?.catalogSourceApproval!==original.token)throw fault('shop_approval_pending','The gift approval needs to be checked.',409);return saved;
}
