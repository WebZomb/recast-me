import {shopPreparationStatus} from './shop-seed.js';
import {shopExpansionStatus} from './shop-expansion.js';
import {coasterPilotRoute,coasterPilotOwnerProof} from './shop-coaster-pilot.js';
import {magnetPilotRoute,magnetPilotOwnerProof} from './shop-magnet-pilot.js';
import {stickerSheetPilotRoute,stickerSheetPilotOwnerProof} from './shop-sticker-sheet-pilot.js';
import {printfileAuditRoute} from './shop-printfile-audit.js';
import {smallGiftReleaseStatus} from './shop-small-gift-release.js';
import {giftBatchStatus} from './shop-gift-batch.js';
import {smallGiftOwnerReview} from './shop-small-gift-qa.js';
import {smallGiftOwnerPublish} from './shop-small-gift-publish.js';
import {privateJson} from './commerce-store.js';
import {publicShopCatalog} from './shop-catalog-store.js';
export async function shopRoutes(request,env){
 const path=new URL(request.url).pathname;
 const ownerPublication=await smallGiftOwnerPublish(request,env);
 if(ownerPublication)return ownerPublication;
 const ownerReview=await smallGiftOwnerReview(request,env);
 if(ownerReview)return ownerReview;
 if(!['/api/shop/catalog','/api/shop/preparation','/api/shop/expansion','/api/shop/coaster-pilot','/api/shop/coaster-pilot/qa','/api/shop/printfile-audit','/api/shop/magnet-pilot','/api/shop/magnet-pilot/qa','/api/shop/sticker-sheet-pilot','/api/shop/sticker-sheet-pilot/qa','/api/shop/small-gifts','/api/shop/gift-batch'].includes(path))return null;
 if(request.method!=='GET')return privateJson({ok:false},405);
 if(path==='/api/shop/gift-batch'){const response=privateJson({ok:true,...await giftBatchStatus(env)});response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/small-gifts'){const response=privateJson({ok:true,...await smallGiftReleaseStatus(env)});response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/preparation'){const response=privateJson({ok:true,...await shopPreparationStatus(env)});response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/expansion'){const response=privateJson({ok:true,...await shopExpansionStatus(env)});response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/coaster-pilot'){const response=await coasterPilotRoute(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/printfile-audit'){const response=await printfileAuditRoute(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/coaster-pilot/qa'){const response=await coasterPilotOwnerProof(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/magnet-pilot'){const response=await magnetPilotRoute(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/magnet-pilot/qa'){const response=await magnetPilotOwnerProof(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/sticker-sheet-pilot'){const response=await stickerSheetPilotRoute(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 if(path==='/api/shop/sticker-sheet-pilot/qa'){const response=await stickerSheetPilotOwnerProof(request,env);response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 try{return privateJson({ok:true,...await publicShopCatalog(env,{product:new URL(request.url).searchParams.get('product')})});}catch{return privateJson({ok:false,error:'The gift collection is temporarily unavailable.'},503);}
}
