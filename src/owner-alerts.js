// Owner destinations stay in private R2. Provider credentials are deployment secrets.
import {change,read,hash,fault,sameOrigin,privateJson} from './commerce-store.js';
import {gmailReady,sendGmailAlert} from './gmail-alerts.js';
const SETTINGS='system/owner-alert-settings.json';
const defaults={email:'',phone:'',emailEnabled:false,smsEnabled:false,orderErrors:true,systemErrors:true,newOrders:false,dailyLimit:10,consent:false};
// Alerts never include customers, addresses, artwork links, raw exceptions or tokens.

const safeOrderName=value=>/^#[A-Za-z0-9-]{1,28}$/.test(String(value||''))?value:'an order';
const safeCode=value=>/^[a-z][a-z0-9_-]{0,42}$/.test(String(value||''))?value:'needs_review';
export function describeOwnerAlert(event){
 if(event.type==='order issue')return 'Order '+safeOrderName(event.orderName)+': '+safeCode(event.code).replaceAll('_',' ')+' — check Orders > Order alerts & recovery.';
 if(event.type==='order needs attention'){
  const reason=/^(on_hold|payment_hold|owner_release_review|auto_print_review|printful_failed|product_layout_review)$/.test(event.status||'')
   ? String(event.status).replaceAll('_',' '):event.shopifyFulfillmentError?'Shopify fulfillment update failed':event.shopifyTagError?'Shopify status tag update failed':event.lastPrintfulSyncError?'Printful status could not be checked':'order requires review';
  return 'Order '+safeOrderName(event.orderName)+': '+reason+' — inspect its existing production job.';
 }
 if(event.type==='sync connection problem')return 'Sync check: '+safeCode(event.phase).replaceAll('_',' ')+' — open Control Center > Orders.';
 if(event.type==='new order')return 'New order '+safeOrderName(event.orderName)+' — check Orders.';
 return 'An operational check needs review in Control Center.';
}
function ownerAlertCopy(events, count, test=false){
 if(test)return {subject:'Recast Me test alert',text:'Recast Me test alert. Open your Control Center to manage alerts.'};
 const lines=events.slice(0,6).map((event,index)=>String(index+1)+'. '+describeOwnerAlert(event));
 const more=count>lines.length?'\n+'+String(count-lines.length)+' additional check(s) in Control Center.':'';
 const title=events[0]?describeOwnerAlert(events[0]).split(' — ')[0].slice(0,90):'issue to review';
 return {subject:count===1?'Recast Me: '+title:'Recast Me: '+count+' issues to review',
  text:'Recast Me: '+count+' alert(s) need review.\n\n'+(lines.length?lines.join('\n'):'Open Control Center to inspect your latest operations.')+more+'\n\nControl Center: https://recastmeai.com/admin.html\n\nThis is the issue at alert time, and it may have recovered. Do not reorder purchases or submit production twice. Recheck the original order.'};
}

export function validateAlertSettings(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!Object.hasOwn(defaults,k)))throw fault('alert_settings','Reload the alert settings form.',400);
  const values={...defaults,...raw};
  if(typeof values.email!=='string'||typeof values.phone!=='string')throw fault('alert_destination','Enter an email address or international phone number.',400);
  values.email=values.email.trim();values.phone=values.phone.trim().replace(/[ ()-]/g,'');
  if(values.email&&(!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(values.email)||values.email.length>254))throw fault('alert_email','Enter one valid email address.',400);
  if(values.phone&&!/^\+[1-9]\d{7,14}$/.test(values.phone))throw fault('alert_phone','Use a phone number with country code, such as +12125551234.',400);
  for(const k of ['emailEnabled','smsEnabled','orderErrors','systemErrors','newOrders','consent'])if(typeof values[k]!=='boolean')throw fault('alert_settings','Invalid alert option.',400);
  if(!Number.isInteger(values.dailyLimit)||values.dailyLimit<1||values.dailyLimit>50)throw fault('alert_limit','Choose 1 to 50 messages per channel per UTC day.',400);
  if(values.emailEnabled&&!values.email||values.smsEnabled&&!values.phone)throw fault('alert_destination','Add a destination for each enabled channel.',400);
  if((values.emailEnabled||values.smsEnabled)&&!values.consent)throw fault('alert_consent','Confirm that these destinations belong to you or that you have permission.',400);
  return values;
}
export function emailProvider(env){return env.ALERT_EMAIL_PROVIDER==='gmail'?'gmail':'resend'}
export function alertSetup(env){
 const ready=alertReadiness(env);
 return {email:ready.email?'Sender configured. Send a test and confirm receipt.':emailProvider(env)==='gmail'?'Gmail needs its sender address and app password in Cloudflare before you can send a test.':'Email sender is not connected. Configure Gmail or Resend in Cloudflare first.',sms:ready.sms?'Text sender configured. Send a test and confirm receipt.':'Texts need a connected Twilio sender before you can send a test.'};
}
export function alertReadiness(env){return {email:emailProvider(env)==='gmail'?gmailReady(env):Boolean(env.ALERT_RESEND_API_KEY&&env.ALERT_EMAIL_FROM),sms:Boolean(/^AC[a-f0-9]{32}$/i.test(env.ALERT_TWILIO_ACCOUNT_SID||'')&&env.ALERT_TWILIO_AUTH_TOKEN&&/^\+[1-9]\d{7,14}$/.test(env.ALERT_SMS_FROM||''))}}
export async function alertSettings(env){const old=await read(env,SETTINGS);return old?{...old,values:validateAlertSettings(old.values)}:{revision:0,values:{...defaults},updatedAt:null}}
async function page(env,prefix,cursor){const p=await env.ARTWORK.list({prefix,limit:50,...(cursor?{cursor}:{})});return {rows:(await Promise.all(p.objects.map(o=>read(env,o.key)))).filter(Boolean),cursor:p.truncated?p.cursor:null}}
async function collect(env,values){
 const old=await read(env,'system/alert-scan-cursors.json')||{};
 const [issues,jobs,sync]=await Promise.all([page(env,'commerce/order-issues/',old.issues),page(env,'jobs/',old.jobs),read(env,'system/commerce-sync.json')]);
 const events=[];
 if(values.orderErrors){
  for(const i of issues.rows)if(i.status==='open')events.push({id:'issue:'+i.id+':'+i.code,type:'order issue',orderName:i.orderName,code:i.code});
  for(const j of jobs.rows)if(/hold|review|failed|product_layout/.test(j.status||'')||j.shopifyFulfillmentError||j.shopifyTagError||j.lastPrintfulSyncError)events.push({id:'job:'+j.id+':'+j.status+':'+Boolean(j.shopifyFulfillmentError)+':'+Boolean(j.shopifyTagError)+':'+Boolean(j.lastPrintfulSyncError),type:'order needs attention',orderName:j.orderName,status:j.status,shopifyFulfillmentError:Boolean(j.shopifyFulfillmentError),shopifyTagError:Boolean(j.shopifyTagError),lastPrintfulSyncError:Boolean(j.lastPrintfulSyncError)});
 }
 if(values.newOrders)for(const j of jobs.rows)if(Date.now()-Date.parse(j.createdAt)<86400000)events.push({id:'new:'+j.id,type:'new order',orderName:j.orderName});
 if(values.systemErrors)for(const [phase,result] of Object.entries(sync||{}))if(phase!=='lastRun'&&phase!=='alerts'&&result?.ok===false)events.push({id:'sync:'+phase,type:'sync connection problem',phase});
 // An outage of this Worker itself needs independent uptime monitoring.
 return {events,cursors:{issues:issues.cursor,jobs:jobs.cursor}};
}
async function reserveMessage(env,channel,limit){
 const key=`commerce/alerts/budgets/${new Date().toISOString().slice(0,10)}-${channel}.json`;
 await change(env,key,{used:0},row=>{if(row.used>=limit)throw fault('alert_limit','Daily alert limit reached.',429);return {used:row.used+1}});
}
export async function deliverOwnerAlert(env,state,channel,eventIds,{test=false,events=[]}={}){
 const v=state.values,ready=alertReadiness(env),destination=channel==='email'?v.email:v.phone;
 if(!['email','sms'].includes(channel)||!ready[channel])throw fault('alert_provider','Delivery service is not connected for this channel.',503);
 if(!v.consent||!destination||!v[channel==='email'?'emailEnabled':'smsEnabled'])throw fault('alert_disabled','Save and enable this channel with recipient permission first.',409);
 const day=new Date().toISOString().slice(0,10);
 const identity=await hash(`${channel}|${destination}|${day}|${test?'test:'+Math.floor(Date.now()/60000):eventIds.slice().sort().join('|')}`);
 const key=`commerce/alerts/deliveries/${identity}.json`,stamp=new Date().toISOString();
 const claim=await env.ARTWORK.put(key,JSON.stringify({channel,status:'attempting',at:stamp,test}),{onlyIf:new Headers({'If-None-Match':'*'})});
 if(!claim)return {channel,status:'already_attempted'};
 const brief=test?[]:events.slice(0,10).map(e=>describeOwnerAlert(e));
 let result={channel,status:'unknown',at:stamp,test,summary:brief,alertCount:eventIds.length};
 try{
  await reserveMessage(env,channel,v.dailyLimit);
  const fresh=await alertSettings(env);
  if(fresh.revision!==state.revision)throw fault('alert_changed','Settings changed before sending; refresh and try again.',409);
  // No customer details, artwork IDs, private tokens or raw exception text leave Recast.
  const {text,subject}=ownerAlertCopy(events,eventIds.length,test);
  let response;
  if(channel==='email'&&emailProvider(env)==='gmail'){
   result={...result,...await sendGmailAlert(env,{to:destination,subject,text,identity})};
  }else if(channel==='email')response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.ALERT_RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':identity},body:JSON.stringify({from:env.ALERT_EMAIL_FROM,to:[destination],subject,text}),signal:AbortSignal.timeout(15000)});
  else response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.ALERT_TWILIO_ACCOUNT_SID}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+btoa(env.ALERT_TWILIO_ACCOUNT_SID+':'+env.ALERT_TWILIO_AUTH_TOKEN),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({From:env.ALERT_SMS_FROM,To:destination,Body:text}),signal:AbortSignal.timeout(15000)});
  if(response&&!response.ok){result={...result,status:'rejected',httpStatus:response.status};}
  else if(response){const data=await response.json();result={...result,status:channel==='sms'&&['failed','undelivered'].includes(data.status)?'rejected':data.id||data.sid?'accepted':'unknown',providerId:data.id||data.sid||null};}
 }catch(error){result={...result,status:error.code?.startsWith('alert_')?'blocked':'unknown',reason:error.code?.startsWith('alert_')?error.code:'connection_result_unknown'};}
 await env.ARTWORK.put(key,JSON.stringify(result));await env.ARTWORK.put(`system/alert-last-${channel}.json`,JSON.stringify(result));
 return result;
}
export async function sendOwnerAlerts(env){
 if(!env.ARTWORK)return {ok:false,error:'Alert storage unavailable'};
 const state=await alertSettings(env),v=state.values,ready=alertReadiness(env);
 if(!v.emailEnabled&&!v.smsEnabled)return {ok:true,disabled:true};
 const channels=['email','sms'].filter(c=>v[c==='email'?'emailEnabled':'smsEnabled']);
 const {events,cursors}=await collect(env,v);const outcomes=[];
 for(const channel of channels){
  if(!ready[channel]){outcomes.push({channel,status:'not_configured'});continue;}
  // Per-event daily acknowledgements avoid resending the same issue when the batch changes.
  const destination=channel==='email'?v.email:v.phone,day=new Date().toISOString().slice(0,10),pending=[];
  for(const event of events){const key=`commerce/alerts/seen/${await hash(channel+'|'+destination+'|'+day+'|'+event.id)}.json`;if(!await env.ARTWORK.head(key))pending.push({...event,key});}
  if(pending.length){const result=await deliverOwnerAlert(env,state,channel,pending.map(e=>e.id),{events:pending});outcomes.push(result);if(['accepted','unknown','already_attempted'].includes(result.status))for(const e of pending)await env.ARTWORK.put(e.key,JSON.stringify({at:new Date().toISOString(),status:result.status}));}
 }
 await env.ARTWORK.put('system/alert-scan-cursors.json',JSON.stringify(cursors));
 const result={ok:outcomes.every(o=>['accepted','already_attempted'].includes(o.status)),checkedAt:new Date().toISOString(),outcomes};
 await env.ARTWORK.put('system/owner-alert-dispatch.json',JSON.stringify(result));return result;
}
export async function ownerAlertRoute(request,env,requireAdmin){
 const p=new URL(request.url).pathname;if(!['/api/admin/alert-settings','/api/admin/alert-test'].includes(p))return null;
 try{
  requireAdmin(request,env);
  if(p.endsWith('alert-settings')&&request.method==='GET')return privateJson({ok:true,...await alertSettings(env),readiness:alertReadiness(env),setup:alertSetup(env),emailProvider:emailProvider(env),last:{email:await read(env,'system/alert-last-email.json'),sms:await read(env,'system/alert-last-sms.json')},dispatch:await read(env,'system/owner-alert-dispatch.json')});
  if(request.method!=='POST')return privateJson({ok:false,error:'Method not allowed'},405);
  sameOrigin(request);const raw=await request.text();if(raw.length>4096)throw fault('alert_settings','Request too large.',413);let body;try{body=JSON.parse(raw)}catch{throw fault('alert_settings','Invalid settings JSON.',400)}
  if(p.endsWith('alert-test')){
   if(body.confirm!=='SEND_TEST_ALERT')throw fault('alert_confirm','Confirm sending a test alert.',409);
   const result=await deliverOwnerAlert(env,await alertSettings(env),body.channel,[],{test:true});return privateJson({ok:true,result});
  }
  const values=validateAlertSettings(body.values);
  if(!Number.isInteger(body.revision)||body.revision<0)throw fault('alert_settings','Reload before saving.',400);
  const saved=await change(env,SETTINGS,{revision:0,values:defaults},old=>{if(old.revision!==body.revision)throw fault('alert_conflict','Alert settings changed in another tab. Reload before saving.',409);return {revision:old.revision+1,values,updatedAt:new Date().toISOString()}});
  return privateJson({ok:true,...saved,readiness:alertReadiness(env)});
 }catch(e){return privateJson({ok:false,error:e.message,code:e.code},e.status||503)}
}
