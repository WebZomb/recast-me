import {prepareCheckout,flattenShopifyProducts,FULFILLMENT} from './entry.js';
import {shopifyCatalog} from './index.js';
import {sameOrigin,privateJson,hash,fault} from './commerce-store.js';
import {checkStoredArtwork} from './content-safety.js';
import {basketSessionIdentity,initializeBasketSession} from './basket-session.js';
import {readStoredBasket,mutateStoredBasket} from './basket-storage.js';
import {basketConfigured,beginBasketCheckout} from './basket-checkout.js';
import {BASKET_LIMITS} from './basket-state.js';
const validToken=token=>typeof token==='string'&&/^[a-f0-9]{48}$/.test(token);
const bindingKey=async(identity,token)=>'commerce/basket-approvals/v1/'+await hash(JSON.stringify([identity.ownerId,token]))+'.json';
async function read(env,key){const object=await env.ARTWORK.get(key);return object?await object.json():null;}
export async function resolveBasketApproval(env,identity,token,catalog){
 if(!validToken(token))throw fault('basket_approval','Review this product again.',409);
 const bound=await read(env,await bindingKey(identity,token));
 const record=await read(env,`commerce/preapprovals/${token}.json`);
 if(!bound||!record||bound.ownerId!==identity.ownerId||bound.recordHash!==await hash(JSON.stringify(record)))throw fault('basket_approval','Review this product again before checkout.',409);
 const rows=flattenShopifyProducts(catalog||await shopifyCatalog(env));
 const row=rows.find(r=>r.sku===record.sku&&r.status==='ACTIVE'&&!r.digital);
 if(!row||row.variantId.split('/').pop()!==bound.approval.variantId)throw fault('basket_product_changed','This product has changed. Remove it and review the current product before adding it again.',409);
 const meta=await read(env,`requests/${record.requestId}/request.json`);
 if(!meta)throw fault('basket_artwork_missing','This artwork is unavailable. Remove this item or reopen the saved picture.',409);
 await checkStoredArtwork(env,meta);
 const source=await env.ARTWORK.get(record.snapshotKey);
 if(!source||await hash(await source.text())!==record.sourceHash)throw fault('basket_artwork_changed','This saved design needs review before checkout.',409);
 return {...bound,row};
}
export function basketProjection(state){
 return {basketId:state.basketId,revision:state.revision,canEdit:state.actions.length<BASKET_LIMITS.actions,appliedActions:state.actions.map(a=>a.actionId),lines:state.lines.map(line=>({lineId:line.lineId,quantity:line.quantity,
  artworkId:line.approval.artworkId,sku:line.approval.sku,product:FULFILLMENT[line.approval.sku]?.product||'Product'}))};
}
async function bodyOf(request){
 const text=await request.text();if(text.length>16384)throw fault('basket_request','Request too large.',413);
 try{return JSON.parse(text);}catch{throw fault('basket_request','Invalid basket request.',400);}
}
export async function basketRoutes(request,env,ctx){
 const path=new URL(request.url).pathname;
 if(!path.startsWith('/api/basket'))return null;
 if(path==='/api/basket/status'&&request.method==='GET')return privateJson({ok:true,enabled:basketConfigured(env)});
 if(!basketConfigured(env))return privateJson({ok:false,error:'The basket is being prepared. You can still buy products individually.',code:'basket_configuration'},503);
 try{
  sameOrigin(request);
  if(!['GET','POST'].includes(request.method))return privateJson({ok:false},405);
  const body=request.method==='POST'?await bodyOf(request):{};
  if(path==='/api/basket/session'&&request.method==='POST')return initializeBasketSession(request,env,body);
  const basketId=request.method==='GET'?new URL(request.url).searchParams.get('id'):body.basketId;
  const identity=await basketSessionIdentity(request,env,basketId);
  if(path==='/api/basket'&&request.method==='GET'){
   const {state}=await readStoredBasket(env.ARTWORK,identity);return privateJson({ok:true,basket:basketProjection(state)});
  }
  if(path==='/api/basket/approve'&&request.method==='POST'){
   if(FULFILLMENT[body.designApproval?.sku]?.digital)throw fault('basket_physical_only','Buy digital downloads individually.',409);
   const prepared=await prepareCheckout(new Request(request.url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body.designApproval)}),env,ctx);
   if(prepared instanceof Response)return prepared;
   const record=prepared.checkoutApproval;
   if(!record)throw fault('basket_approval','Review a physical product first.',409);
   const approval={artworkId:prepared.requestId,sku:prepared.sku,variantId:prepared.numericId,approvalToken:record.token,proofHash:record.proofHash};
   const bound={ownerId:identity.ownerId,recordHash:await hash(JSON.stringify(record)),approval,properties:prepared.properties};
   await env.ARTWORK.put(await bindingKey(identity,record.token),JSON.stringify(bound),{httpMetadata:{contentType:'application/json',cacheControl:'private, no-store'}});
   return privateJson({ok:true,approvalToken:record.token});
  }
  if(path==='/api/basket/action'&&request.method==='POST'){
   const approved=body.command?.type==='add'?await resolveBasketApproval(env,identity,body.approvalToken):null;
   const result=await mutateStoredBasket(env.ARTWORK,identity,body.command,approved?.approval);
   return privateJson({ok:true,basket:basketProjection(result.state),replayed:result.replayed});
  }
  if(path==='/api/basket/checkout'&&request.method==='POST'){
   const {state}=await readStoredBasket(env.ARTWORK,identity);
   if(body.revision!==state.revision)throw fault('basket_changed','Your basket changed. Review it before checkout.',409);
   const catalog=await shopifyCatalog(env),lines=[];
   for(const line of state.lines){
    const checked=await resolveBasketApproval(env,identity,line.approval.approvalToken,catalog);
    if(JSON.stringify(checked.approval)!==JSON.stringify(line.approval))throw fault('basket_approval','Review this product again.',409);
    lines.push({merchandiseId:checked.row.variantId,quantity:line.quantity,
     attributes:Object.entries({...checked.properties,'_Recast Basket Line':line.lineId}).map(([key,value])=>({key,value:String(value)}))});
   }
   return privateJson({ok:true,...await beginBasketCheckout(env,identity,state,lines)});
  }
  return privateJson({ok:false,error:'Not found'},404);
 }catch(error){
  const messages={revision_conflict:'Your basket changed in another tab. Refresh it before trying again.',basket_commit_unknown:'Your items may already be saved. Refresh the basket before trying again.',action_conflict:'This action changed. Refresh your basket.',basket_storage_conflict:'Your basket changed in another tab. Refresh it.',action_limit:'Your basket has reached its edit limit. Your items are saved. You can check out as shown or contact support to change them.',line_limit:'Your basket is full. Remove an item before adding another, or check out with the items already saved.'};
  return privateJson({ok:false,error:messages[error.code]||(error.status?error.message:'Your basket is temporarily unavailable. Your saved artwork is unchanged.'),code:error.code||'basket_unavailable'},error.status||409);
 }
}
