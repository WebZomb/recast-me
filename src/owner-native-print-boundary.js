// The three existing private native-print GETs must remain byte-exact.
// Public/customer images STILL pass through securePreviews and its watermark.
// No new storage permission, file selector, approval, task or publication route.
import {secureApplication as securePreviews} from './preview-security.js';
import {smallGiftOwnerReview} from './shop-small-gift-qa.js';
import {requireAdmin} from './workflow.js';
import {privateJson} from './commerce-store.js';
const nativePaths=new Set([
 '/api/shop/small-gift-review/christmas-village-golden-retriever-coaster-4pack/print',
 '/api/shop/small-gift-review/christmas-village-golden-retriever-magnet-3pack/print',
 '/api/shop/small-gift-review/christmas-village-golden-retriever-sticker-sheet-six/print'
]);
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
   // Applying a public watermark here would corrupt the expected SHA and turn
   // the transparent sticker PNG into JPEG. Do not resize or re-encode it.
   return new Response(response.body,{status:response.status,headers});
  }
 };
}
