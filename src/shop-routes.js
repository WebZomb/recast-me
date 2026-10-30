import {shopPreparationStatus} from './shop-seed.js';
import {privateJson} from './commerce-store.js';
import {publicShopCatalog} from './shop-catalog-store.js';
export async function shopRoutes(request,env){
 const path=new URL(request.url).pathname;
 if(!['/api/shop/catalog','/api/shop/preparation'].includes(path))return null;
 if(request.method!=='GET')return privateJson({ok:false},405);
 if(path==='/api/shop/preparation'){const response=privateJson({ok:true,...await shopPreparationStatus(env)});response.headers.set('x-robots-tag','noindex, nofollow');return response;}
 try{return privateJson({ok:true,...await publicShopCatalog(env)});}catch{return privateJson({ok:false,error:'The gift collection is temporarily unavailable.'},503);}
}
