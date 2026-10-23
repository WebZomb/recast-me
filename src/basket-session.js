import {sameOrigin,hash,randomToken,privateJson,fault} from './commerce-store.js';
import {authorizedArtwork} from './order-approval.js';
import {createBasket} from './basket-state.js';
const COOKIE='__Host-recast-basket';
function cookie(request){
 const values=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(COOKIE+'='));
 if(values.length>1)throw fault('basket_session','Reopen your basket in the original browser.',401);
 const token=values[0]?.slice(COOKIE.length+1);
 if(token&&!/^[a-f0-9]{64}$/.test(token))throw fault('basket_session','Reopen your basket in the original browser.',401);
 return token;
}
async function session(request,env){
 const token=cookie(request);if(!token)return null;
 const id=await hash(token),object=await env.ARTWORK.get(`commerce/basket-sessions/${id}.json`);
 const record=object?await object.json():null;
 if(!record||record.ownerId!==id||!Number.isFinite(Date.parse(record.createdAt)))throw fault('basket_session','Your basket session needs review. Your saved pictures are unchanged.',401);
 return id;
}
export async function initializeBasketSession(request,env,body){
 sameOrigin(request);
 if(await session(request,env))return privateJson({ok:true});
 // A valid saved-artwork capability is required before creating private storage.
 // This works for original photos without creating a render-credit wallet.
 await authorizedArtwork(env,body.requestId,body.accessToken);
 const token=randomToken(),ownerId=await hash(token);
 const result=await env.ARTWORK.put(`commerce/basket-sessions/${ownerId}.json`,JSON.stringify({ownerId,createdAt:new Date().toISOString()}),{onlyIf:new Headers({'If-None-Match':'*'}),httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
 if(!result?.etag)throw fault('basket_session','Your basket could not be opened. Please try again.',503);
 return privateJson({ok:true},200,{'set-cookie':`${COOKIE}=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=31536000`});
}
export async function basketSessionIdentity(request,env,basketId){
 sameOrigin(request);createBasket({basketId,ownerId:'validation'});
 const ownerId=await session(request,env);
 if(!ownerId)throw fault('basket_session','Open a saved picture to start your basket.',401);
 return {ownerId,basketId};
}
