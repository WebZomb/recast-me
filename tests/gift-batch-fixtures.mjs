import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {giftMaster,SMALL_GIFTS} from '../src/shop-gift-definitions.js';
import {FULFILLMENT} from '../src/entry.js';
import {hash,recommendedCheckoutDesign,stickerSheetBoxes} from '../src/commerce-store.js';
export async function nativeGiftFixture(item){
 const source=giftMaster(item),env={ADMIN_TOKEN:'owner-test-only',PREMADE_SMALL_GIFT_RELEASE_ENABLED:'true',PREMADE_GIFT_BATCH_ENABLED:'true',ARTWORK:new Bucket(),IMAGES:{info:async()=>({width:1254,height:1254})}};
 const put=(key,value)=>env.ARTWORK.put(key,JSON.stringify(value));
 const design=recommendedCheckoutDesign(FULFILLMENT[item.sku]);
 const sourceBytes=new Uint8Array(160);sourceBytes.set([137,80,78,71,13,10,26,10]);sourceBytes.set(new TextEncoder().encode(source.sha256),12);
 const encoded=btoa(String.fromCharCode(...sourceBytes)),sourceHash=await hash(encoded),proofHash=await hash(encoded+'|'+JSON.stringify(design));
 const token=(await hash(item.id)).slice(0,48),snapshotKey='commerce/snapshots/'+source.id+'.b64';
 const position={area_width:item.width,area_height:item.height,width:item.width,height:item.height,top:0,left:0};
 const record={token,requestId:source.requestId,sku:item.sku,mockupId:'fixture-native-v1',approvalMode:'product-mockup',sourceHash,proofHash,position,design,snapshotKey,previewToken:token,approvedAt:'2026-11-05T00:00:00Z'};
 await put(`requests/${source.requestId}/request.json`,{requestId:source.requestId,source:'premade-catalog',catalogDesignId:source.id,catalogMasterHash:source.sha256,catalogRightsConfirmedAt:'2026-11-03T00:00:00Z',contentSafety:{status:'approved'},accessToken:'fixture-private-'+source.id,width:1254,height:1254,previewMime:'image/png'});
 for(const template of SMALL_GIFTS)await put(`shop/preparation/printfile-audit/v1/${template.catalogId}.json`,{status:'complete',productId:template.catalogId,variants:[{sku:template.sku,area:{width:template.width,height:template.height,dpi:300}}]});
 const pilot={status:'ready_for_review',mockupId:record.mockupId,design};
 const task={status:'completed',requestId:source.requestId,sku:item.sku,mockupId:record.mockupId,taskKey:'fixture-task-'+item.id,printfulVariantId:item.variantId,sourceHash:proofHash,position,design,images:[{title:'Supplier fixture',url:`https://recastmeai.com/api/mockup/image/${source.requestId}/${item.sku}/0?token=fixture-only`}]};
 await put(`mockups/${source.requestId}/${item.sku}/${record.mockupId}/task.json`,task);
 await env.ARTWORK.put(snapshotKey,encoded);await put(`commerce/preapprovals/${token}.json`,record);
 const prepare=async request=>{
  const input=await request.json();assert.equal(input.requestId,source.requestId);assert.equal(input.sku,item.sku);assert.equal(input.mockupId,pilot.mockupId);assert.equal(input.skipMockup,undefined);
  return {checkoutApproval:record,row:{variantId:'gid://shopify/ProductVariant/123456',price:'24.99'},approvedPreview:{imageUrl:'https://recastmeai.com/api/approved-preview/'+token,images:task.images}};
 };
 const compose=async(_env,_bytes,_info,area,map,choice,width)=>{
  assert.equal(area.width,item.width);assert.equal(width,item.width);assert.equal(map.printfulVariantId,item.variantId);assert.deepEqual(choice,design);
  const bytes=new Uint8Array(160);bytes.set(item.mime==='image/png'?[137,80,78,71,13,10,26,10]:[255,216,255]);bytes.set(new TextEncoder().encode(source.sha256),12);
  return {bytes,mime:item.mime,outputSize:{width:item.width,height:item.height},...(item.mime==='image/png'?{artworkBoxes:stickerSheetBoxes({width:1254,height:1254},item.width,item.height)}:{})};
 };
 return {env,put,source,pilot,record,task,prepare,compose};
}
