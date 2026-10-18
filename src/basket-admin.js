import {privateJson,sameOrigin} from './commerce-store.js';
// Never return owner/session IDs, artwork, attributes, cart IDs or checkout URLs.
export async function basketAdminRoute(request,env,{requireAdmin}){
 if(new URL(request.url).pathname!=='/api/admin/basket-attempts')return null;
 try{
  requireAdmin(request,env);sameOrigin(request);
  if(request.method!=='GET')return privateJson({ok:false},405);
  const prefix='commerce/basket-checkouts/v1/',page=await env.ARTWORK.list({prefix,limit:50});
  const items=[];
  for(const object of page.objects||[]){
   const reference=object.key.slice(prefix.length).replace(/\.json$/,'');
   if(!/^[a-f0-9]{64}$/.test(reference))continue;
   try{
    const stored=await env.ARTWORK.get(object.key),row=stored?await stored.json():null;
    items.push({reference,status:row?.status==='ready'?'ready':'needs_review',revision:Number.isSafeInteger(row?.revision)?row.revision:null,
     startedAt:typeof row?.startedAt==='string'?row.startedAt:null,
     guidance:row?.status==='ready'?'Saved checkout confirmed. The customer can reopen it from the same basket. Payment is not verified here.':'Checkout outcome is uncertain. Preserve this record and inspect Shopify before any recovery. No automatic retry is allowed.'});
   }catch{items.push({reference,status:'unavailable',guidance:'The saved attempt could not be read. Restore storage access before retrying.'});}
  }
  return privateJson({ok:true,checkedAt:new Date().toISOString(),items,more:page.truncated===true,
   note:'First 50 saved attempts, not all orders or a payment report. Refresh only rereads saved records; it never creates carts, orders or production requests.'});
 }catch(e){return privateJson({ok:false,error:e.status===401?'Admin authorization required.':'Basket recovery records are temporarily unavailable.'},e.status||503);}
}
