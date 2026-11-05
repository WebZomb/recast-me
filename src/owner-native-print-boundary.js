// Native print inspection is restricted to the fixed approved-artwork registry.
// Public/customer images STILL pass through securePreviews and its watermark.
// No arbitrary storage path, query credential or unauthenticated image access.
import {secureApplication as securePreviews} from './preview-security.js';
import {smallGiftOwnerReview} from './shop-small-gift-qa.js';
import {ALL_SMALL_GIFTS} from './shop-gift-definitions.js';
import {requireAdmin} from './workflow.js';
import {privateJson} from './commerce-store.js';
const nativePaths=new Set(ALL_SMALL_GIFTS.map(item=>'/api/shop/small-gift-review/'+item.id+'/print'));
export function isOwnerNativePrintPath(request){
 return request.method==='GET'&&nativePaths.has(new URL(request.url).pathname);
}
export function secureApplication(application){
 const secured=securePreviews(application);
 return {
  ...secured,
  async fetch(request,env,ctx){
   if(!isOwnerNativePrintPath(request))return secured.fetch(request,env,ctx);
   // Authorization precedes ALL private reads. The existing owner route then
   // validates exact SKU/source/revision/preapproval/supplier task/placement,
   // review signature AND native-file SHA before returning the immutable bytes.
   try{requireAdmin(request,env);}
   catch{return privateJson({ok:false,error:'Owner authorization required.'},401);}
   const response=await smallGiftOwnerReview(request,env);
   if(!response)return privateJson({ok:false,error:'Unknown private print review.'},404);
   const headers=new Headers(response.headers);
   headers.set('cache-control','private, no-store, no-transform');
   headers.set('referrer-policy','no-referrer');
   headers.set('x-content-type-options','nosniff');
   headers.set('x-robots-tag','noindex, nofollow');
   // Re-encoding would corrupt the inspected SHA and transparent sticker PNG.
   return new Response(response.body,{status:response.status,headers});
  }
 };
}
