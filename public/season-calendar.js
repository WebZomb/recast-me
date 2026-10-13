/* Recast Me seasonal discovery. US gift-shopping calendar, local browser dates,
   no promotional discount promises or automatic commerce/credit changes. */
const yearDate=(year,month,day)=>new Date(year,month-1,day,12);
const nthWeekday=(year,month,weekday,n)=>{
  const first=yearDate(year,month,1);
  const shift=(weekday-first.getDay()+7)%7;
  return yearDate(year,month,1+shift+7*(n-1));
};
const endOfMonth=(year,month)=>new Date(year,month,0,12);
const lastMonday=(year,month)=>{
  const last=endOfMonth(year,month);
  return yearDate(year,month,last.getDate()-(last.getDay()+6)%7);
};
export function annualGiftEvents(year){
 const thanks=nthWeekday(year,11,4,4);
 const blackFriday=yearDate(year,11,thanks.getDate()+1);
 const cyberMonday=yearDate(year,11,thanks.getDate()+4);
 const events=[
  {id:'valentine',title:"Valentine’s Day",date:yearDate(year,2,14),icon:'♡',kind:'heart',style:'valentine',lead:'A portrait of your favorite person, couple, or furry Valentine.',gift:'Framed portraits · Mugs · Keepsakes'},
  {id:'pet-day',title:'National Pet Day',date:yearDate(year,4,11),icon:'✦',kind:'pets',style:'storybook',lead:'Celebrate the pet who makes your everyday brighter.',gift:'Pet portraits · Blankets · Mugs'},
  {id:'mothers-day',title:"Mother’s Day",date:nthWeekday(year,5,0,2),icon:'♡',kind:'family',style:'royal',lead:'Turn a family moment into something she can keep.',gift:'Framed art · Personalized blankets'},
  {id:'graduation',title:'Graduation Season',date:yearDate(year,5,15),icon:'✧',kind:'family',style:'royal',lead:'Make a once-in-a-lifetime milestone into keepsake art.',gift:'Framed posters · Journals · Mugs'},
  {id:'fathers-day',title:"Father’s Day",date:nthWeekday(year,6,0,3),icon:'✦',kind:'family',style:'game',lead:'For dads, grandpas, and the legends in your life.',gift:'Mugs · Posters · T-shirts'},
  {id:'dog-day',title:'International Dog Day',date:yearDate(year,8,26),icon:'✧',kind:'pets',style:'storybook',lead:'A whole new adventure starring your best friend.',gift:'Dog portraits · Cozy blankets'},
  {id:'halloween',title:'Halloween',date:yearDate(year,10,31),icon:'✦',kind:'halloween',style:'halloween',lead:'Spooky-cute portraits, playful costumes and magical worlds.',gift:'Magical pet portraits · Halloween mugs'},
  {id:'thanksgiving',title:'Thanksgiving',date:thanks,icon:'✦',kind:'autumn',style:'royal',lead:'Celebrate family, friends and the pets around the table.',gift:'Family portraits · Cozy home gifts'},
  {id:'black-friday',title:'Holiday Gift Shopping',date:blackFriday,icon:'✧',kind:'winter',style:'christmas',lead:'Get a head start on meaningful handmade-to-order gifts.',gift:'Mugs · Blankets · Framed artwork'},
  {id:'cyber-monday',title:'Gift Planning Week',date:cyberMonday,icon:'✧',kind:'winter',style:'christmas',lead:'Pick a photo, choose a style and plan your gifts early.',gift:'Photo gifts for everyone'},
  {id:'christmas',title:'Christmas',date:yearDate(year,12,25),icon:'✦',kind:'winter',style:'christmas',lead:'Give a favorite memory a little holiday magic.',gift:'Christmas pet portraits · Cozy gifts'},
  {id:'new-year',title:'New Year',date:yearDate(year+1,1,1),icon:'✧',kind:'winter',style:'birthday',lead:'A fresh year, a whole new adventure.',gift:'Framed art · Personal keepsakes'}
 ];
 return events.sort((a,b)=>a.date-b.date);
}
export function upcomingGiftEvents(now=new Date(),count=6){
 const start=yearDate(now.getFullYear(),1,1);
 void start;
 const near=[...annualGiftEvents(now.getFullYear()),...annualGiftEvents(now.getFullYear()+1),...annualGiftEvents(now.getFullYear()+2)];
 // An occasion remains browsable on the actual day, but expires the following day.
 const today=yearDate(now.getFullYear(),now.getMonth()+1,now.getDate());
 return near.filter(x=>x.date>=today).sort((a,b)=>a.date-b.date).slice(0,count);
}
export function seasonalSpotlight(now=new Date()){
 const today=yearDate(now.getFullYear(),now.getMonth()+1,now.getDate());
 const y=now.getFullYear(),october=yearDate(y,10,1),halloween=yearDate(y,11,1);
 if(today>=october&&today<halloween)return {
   id:'halloween',name:'Halloween',theme:'halloween',badge:'HALLOWEEN MAGIC',
   title:'Make Halloween unforgettable.',intro:'From spooky-cute pet portraits to magical family adventures, bring your favorite photo to a whole new world.',
   hero:'/assets/recast-halloween-hero-v163.webp',style:'halloween',
   secondaryTitle:'A little spooky. A lot of you.',secondaryCopy:'Turn your best friend into a tiny vampire, a magical wizard or a moonlit legend. Pick your favorite, then preview it on a gift.'
 };
 const next=upcomingGiftEvents(now,1)[0];
 if(!next)return null;
 const winter=['christmas','black-friday','cyber-monday','new-year'].includes(next.id);
 const autumn=next.id==='thanksgiving';
 return {
   id:next.id,name:next.title,theme:winter?'winter':autumn?'autumn':'everyday',
   badge:winter?'HOLIDAY MAGIC':autumn?'AUTUMN MOMENTS':'MAKE A MEMORY',
   title:winter?'Make this season magical.':autumn?'Give thanks with a favorite memory.':'Your favorite photo. Their favorite gift.',
   intro:next.lead+' Create an adventure and preview it on something personal.',
   hero:winter?'/assets/recast-christmas-hero-v163.webp':autumn?'/assets/recast-halloween-gifts-v163.webp':'/assets/world-royal-v18.webp',
   style:next.style,
   secondaryTitle:'Make it uniquely theirs.',
   secondaryCopy:'Choose a photo of your pet, partner or family, find the perfect look and put it on a personalized gift.'
 };
}
export function daysToEvent(event,now=new Date()){
 const today=yearDate(now.getFullYear(),now.getMonth()+1,now.getDate());
 return Math.max(0,Math.round((event.date-today)/86400000));
}
export function eventDateLabel(date){
 return date.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
