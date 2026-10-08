import {change, hash, read} from './commerce-store.js';
const prefix='commerce/order-issues/';
export async function orderIssueId(orderId,lineId='order'){return hash(`${orderId}:${lineId}`)}
export async function recordOrderIssue(env,order,line,code,message){
  const id=await orderIssueId(order.id,line?.id),stamp=new Date().toISOString();
  // Operational references only: no customer details, artwork URLs or capabilities.
  await change(env,`${prefix}${id}.json`,null,old=>({id,orderId:order.id,orderName:order.name,lineId:line?.id||null,sku:line?.sku||null,code,message,status:'open',createdAt:old?.createdAt||stamp,updatedAt:stamp,occurrences:(old?.occurrences||0)+1}));
  return id;
}
export async function resolveOrderIssue(env,orderId,lineId){
  const key=`${prefix}${await orderIssueId(orderId,lineId)}.json`;
  await change(env,key,null,old=>old?.status==='open'?{...old,status:'resolved',resolvedAt:new Date().toISOString()}:undefined);
}
export async function loadOrderIssue(env,id){return /^[a-f0-9]{64}$/.test(id)?read(env,`${prefix}${id}.json`):null}
export async function listOrderIssues(env,cursor){
  const page=await env.ARTWORK.list({prefix,limit:100,...(cursor?{cursor}:{})});
  const issues=(await Promise.all(page.objects.map(o=>read(env,o.key)))).filter(Boolean);
  return {issues,cursor:page.truncated?page.cursor:null};
}
export function orderRecoveryAdvice(job){
  const advice=[];
  if(['failed','onhold'].includes(job.printfulStatus)||job.status==='printful_failed')advice.push('Open the existing Printful order and read its hold/payment reason. Resolve that issue there, then use Update Printful status. Do not create a replacement order.');
  if(job.lastPrintfulSyncError)advice.push('Printful status could not be checked. Use Update Printful status after the connection is restored; a timeout does not prove the order failed.');
  if(job.shopifyFulfillmentError||job.shopifyTagError)advice.push('Printing and Shopify updates are separate. Check Shopify permissions and fulfillment routing, then Update Printful status. Do not resubmit production.');
  if(job.autoPrintFailedAt&&!job.printfulOrderId&&!job.sentToProductionAt)advice.push('Inspect the Printful diagnostic first. Use the guarded recovery action only when offered; any recovered draft must be inspected before release.');
  if(job.status==='product_layout_review')advice.push('The reviewed layout or preview is missing. Recover the original purchase design and obtain approval; do not substitute a different image or product.');
  if(job.status==='payment_hold')advice.push('Review payment, refund or cancellation in Shopify. If Printful already accepted this order, check its cancellation options separately.');
  return advice;
}
