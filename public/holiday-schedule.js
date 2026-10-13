import {annualGiftEvents} from './season-calendar.js';
export const holidayDefaults=()=>annualGiftEvents(2026).map(event=>({id:event.id,enabled:event.id==='halloween',leadDays:21,start:'',end:'',priority:event.id==='halloween'?100:50}));
export function easternDay(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const value=key=>parts.find(x=>x.type===key).value;
 return `${value('year')}-${value('month')}-${value('day')}`;
}
const day=date=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const stamp=(year,md)=>`${year}-${md}`;
export function activeHoliday(rows,now=new Date()){
 const today=easternDay(now),year=Number(today.slice(0,4)),matches=[];
 for(const y of [year-1,year,year+1])for(const event of annualGiftEvents(y)){
  const rule=rows.find(row=>row.id===event.id);if(!rule?.enabled)continue;
  const eventYear=event.date.getFullYear();
  const lead=new Date(event.date);lead.setDate(lead.getDate()-rule.leadDays);
  const end=rule.end?stamp(eventYear,rule.end):day(event.date);
  let start=rule.start?stamp(eventYear,rule.start):day(lead);
  if(start>end&&rule.start)start=stamp(eventYear-1,rule.start);
  if(today>=start&&today<=end)matches.push({id:event.id,title:event.title,style:event.style,date:day(event.date),start,end,priority:rule.priority});
 }
 return matches.sort((a,b)=>b.priority-a.priority||a.date.localeCompare(b.date)||a.id.localeCompare(b.id))[0]||null;
}
