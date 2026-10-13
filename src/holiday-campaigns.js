import {holidayDefaults,activeHoliday} from '../public/holiday-schedule.js';
import {read,change,equal,fault,sameOrigin,privateJson} from './commerce-store.js';
export const HOLIDAY_KEY='system/holiday-campaigns-v1.json';
export function validateHolidays(rows){
 const defaults=holidayDefaults();
 if(!Array.isArray(rows)||rows.length!==defaults.length)throw fault('holidays_invalid','Reload the complete holiday schedule.',400);
 const ids=new Set();
 return rows.map(row=>{
  if(!defaults.some(x=>x.id===row.id)||ids.has(row.id))throw fault('holidays_invalid','Unknown or repeated holiday.',400);ids.add(row.id);
  if(typeof row.enabled!=='boolean'||!Number.isInteger(row.leadDays)||row.leadDays<0||row.leadDays>90||!Number.isInteger(row.priority)||row.priority<0||row.priority>999)throw fault('holidays_invalid','Use 0–90 lead days and a priority from 0–999.',400);
  for(const key of ['start','end']){
   const value=row[key];
   if(value==='')continue;
   if(typeof value!=='string'||!/^\d{2}-\d{2}$/.test(value))throw fault('holidays_invalid','Dates must use MM-DD, or be blank.',400);
   const date=new Date(`2024-${value}T12:00:00Z`);
   if(!Number.isFinite(+date)||date.toISOString().slice(5,10)!==value)throw fault('holidays_invalid','Enter a real calendar date.',400);
  }
  return {id:row.id,enabled:row.enabled,leadDays:row.leadDays,start:row.start,end:row.end,priority:row.priority};
 });
}
export async function holidaySettings(env){
 const saved=await read(env,HOLIDAY_KEY);
 return saved?{...saved,rows:validateHolidays(saved.rows)}:{revision:0,rows:holidayDefaults()};
}
// Shopify readback on 2026-10-13 verified all buyers/items, no minimum or usage limit.
// Marketing dates recur yearly; this verified commerce offer deliberately does not.
export function holidayOffer(active,now=new Date()){
 if(active?.id!=='halloween'||+now<Date.parse('2026-10-10T04:00:00Z')||+now>=Date.parse('2026-11-01T04:00:00Z'))return null;
 return {code:'RECASTHALLOWEEN10',percent:10,endsAt:'2026-11-01T04:00:00Z',label:'10% off all products',terms:'Through October 31, 2026 (Eastern). Discount applies to products; shipping and taxes are calculated at checkout.'};
}
export async function currentCampaign(env,now=new Date()){
 const settings=await holidaySettings(env),active=activeHoliday(settings.rows,now);
 return {active,offer:holidayOffer(active,now)};
}
export async function applyHolidayDiscount(url,env,now=new Date()){
 // Promotion storage failure must never break a valid approved checkout.
 try{const {offer}=await currentCampaign(env,now);if(offer){const link=new URL(url);link.searchParams.set('discount',offer.code);return link.href;}}catch{}
 return url;
}
export async function holidayRoutes(request,env){
 const path=new URL(request.url).pathname;
 if(!['/api/seasonal-campaign','/api/admin/holiday-schedule'].includes(path))return null;
 try{
  if(path==='/api/seasonal-campaign'){
   if(request.method!=='GET')return privateJson({ok:false},405);
   return privateJson({ok:true,...await currentCampaign(env)});
  }
  if(!equal(request.headers.get('authorization'),`Bearer ${env.ADMIN_TOKEN||''}`)||!env.ADMIN_TOKEN)throw fault('unauthorized','Owner authorization required.',401);
  if(request.method==='GET')return privateJson({ok:true,...await holidaySettings(env),...await currentCampaign(env)});
  if(request.method!=='POST')return privateJson({ok:false},405);
  sameOrigin(request);
  const raw=await request.text();if(raw.length>8192)throw fault('holidays_invalid','Schedule is too large.',413);
  let body;try{body=JSON.parse(raw)}catch{throw fault('holidays_invalid','Invalid schedule.',400)}
  const rows=validateHolidays(body.rows);
  if(!Number.isInteger(body.revision)||body.revision<0)throw fault('holidays_invalid','Reload before saving.',400);
  const saved=await change(env,HOLIDAY_KEY,{revision:0,rows:holidayDefaults()},old=>{
   if(old.revision!==body.revision)throw fault('holidays_conflict','Another tab changed this schedule. Reload before saving.',409);
   return {revision:old.revision+1,rows,updatedAt:new Date().toISOString()};
  });
  return privateJson({ok:true,...saved});
 }catch(error){return privateJson({ok:false,error:error.message},error.status||503)}
}
