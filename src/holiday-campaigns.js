import {seasonalCheckoutReady,createSeasonalCheckout} from './seasonal-checkout.js';
import {holidayDefaults,activeHoliday,mergeHolidayRows,easternDay} from '../public/holiday-schedule.js';
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
 return saved?{...saved,rows:validateHolidays(mergeHolidayRows(saved.rows))}:{revision:0,rows:holidayDefaults()};
}
// Public offer metadata never contains a redeemable code. Eligibility is based
// on the private saved artwork, never the request body or its storefront URL.
export function holidayOffer(active,now=new Date()){
 if(!active||!['halloween','christmas','new-year','valentine'].includes(active.id))return null;
 const today=easternDay(now),year=Number(today.slice(0,4));
 const bounds={halloween:['10-10','11-01',4],christmas:['11-01','12-26',5],valentine:['01-08','02-15',5]};
 let start,end,hour;
 if(active.id==='new-year'){start=today.slice(5)>='12-26'?`${year}-12-26`:`${year-1}-12-26`;end=today.slice(5)>='12-26'?`${year+1}-01-08`:`${year}-01-08`;hour=5;}
 else {const dates=bounds[active.id];start=`${year}-${dates[0]}`;end=`${year}-${dates[1]}`;hour=dates[2];}
 if(today<start||today>=end)return null;
 const name={halloween:'Halloween',christmas:'Christmas','new-year':'New Year',valentine:'Valentine'}[active.id];
 const style={halloween:'halloween',christmas:'christmas','new-year':'birthday',valentine:'valentine'}[active.id];
 return {id:active.id,name,style,percent:10,endsAt:`${end}T0${hour}:00:00Z`,label:`10% off ${name} photo gifts`,terms:`Use the ${style==='birthday'?'Birthday / celebration':name} filter. Applied automatically to eligible products at checkout. Offer ends ${end} at 12:00 a.m. Eastern. Shipping and taxes are extra.`};
}
export function eligibleSeasonalArtwork(artwork,offer){return Boolean(offer&&artwork?.styleId===offer.style&&artwork?.source!=='original'&&artwork?.styleId!=='original');}
export async function currentCampaign(env,now=new Date()){
 const settings=await holidaySettings(env),active=activeHoliday(settings.rows,now),plannedOffer=holidayOffer(active,now);
 const checkoutReady=plannedOffer?await seasonalCheckoutReady(env):false;
 return {active,offer:checkoutReady?plannedOffer:null,checkoutReady};
}
export async function applyHolidayDiscount(url,env,now=new Date(),checkout={}){
 let offer;try{({offer}=await currentCampaign(env,now))}catch{return url;}
 if(!eligibleSeasonalArtwork(checkout.artwork,offer))return url;
 return createSeasonalCheckout(env,{...checkout,offer,now});
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
