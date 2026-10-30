import {renderSeasonalProducts} from './seasonal-products.js?v=167';
import {christmasCampaign} from './christmas-feature.js?v=1';
import {seasonalSpotlight,upcomingGiftEvents,daysToEvent,eventDateLabel} from './season-calendar.js?v=166';
let campaign={active:null,offer:null};
try{const response=await fetch('/api/seasonal-campaign',{cache:'no-store'});if(response.ok)campaign=await response.json();}catch{}
const now=new Date();
campaign=christmasCampaign(campaign,{fixed:document.body.dataset.fixedCollection==='christmas',now});
const spot=seasonalSpotlight(now,campaign.active||null);
if(spot?.id==='christmas'){spot.badge='CHRISTMAS MAGIC';spot.title='Make Christmas unforgettable.';spot.intro='Give their favorite face a little Christmas magic. Create festive artwork, then preview it on a gift they can keep.';}
const by=id=>document.getElementById(id);
const put=(id,value)=>{const el=by(id);if(el)el.textContent=value};
const src=(id,value)=>{const image=by(id);if(!image)return;image.src=value;image.alt=value.includes('christmas')?'Illustrated Christmas gift inspiration with festive holiday artwork':value.includes('halloween')?'Illustrated Halloween gift inspiration':value.includes('royal')?'Illustrative royal-style Recast artwork':'Illustrative fantasy-style Recast artwork';};
const href=(id,value)=>{const el=by(id);if(el)el.href=value};
const el=(tag,cls,value)=>{
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(value!==undefined)node.textContent=value;
  return node;
};
function updateHero(){
  if(!spot)return;
  document.body.dataset.season=spot.theme;
  put('season-kicker','✦  '+spot.badge);
  const title=by('season-title');
  if(title){
    title.replaceChildren();
    if(spot.id==='halloween'){
      title.append('Make Halloween ');
      title.append(el('span','season-gradient-word','unforgettable.'));
    }else{
      const words=spot.title.split(' ');
      const last=words.splice(-1).join(' ');
      title.append(words.join(' ')+' ');
      title.append(el('span','season-gradient-word',last));
    }
  }
  put('season-hero-copy',spot.intro);
  src('season-hero-image',spot.hero);
  const mainLink='/?style='+encodeURIComponent(spot.style)+'#start';
  put('season-primary-cta',spot.id==='halloween'?'Make a Halloween Recast →':'Make a '+spot.name+' Recast →');
  href('season-primary-cta',mainLink);
  const featured=campaign.active?{title:campaign.active.title,date:new Date(campaign.active.date+'T12:00:00')}:upcomingGiftEvents(now,1)[0],days=featured?daysToEvent(featured,now):0;
  const dayCopy=spot.id==='halloween'?
    'Halloween is October 31'+(days===0?' — today is the day!':'.'):
    (featured?.title||'Your next occasion')+' '+(featured?eventDateLabel(featured.date):'')+(days===0?' is here!':'.');
  put('season-date-note',dayCopy+' Personalized gifts are made to order; check estimated delivery at checkout.');
  if(spot.id==='halloween')return;
  const shopLink=document.querySelector('a[href="#season-shop"]');if(shopLink)shopLink.textContent='Explore personalized gifts ✦';
  for(const link of document.querySelectorAll('a[href="/?style=halloween#start"]'))link.href=mainLink;
  put('season-marquee','✦  YOUR FAVORITE PHOTO     ✦     A WHOLE NEW WORLD     ✦     PERSONAL GIFTS     ✦     MADE WITH MAGIC  ✦');
  put('season-styles-title','Give their favorite memory a new world.');
  put('season-styles-copy',spot.secondaryCopy);
  put('season-product-title',spot.id==='christmas'?'The Christmas gift they’ll actually keep.':'Make a personal gift they’ll want to keep.');
  put('season-product-copy','Choose an adventure featuring someone you love, then preview that exact Recast on mugs, cozy blankets, framed artwork and more. Adjust placement if you want; the preview watermark will not print.');
  put('season-secondary-title',spot.secondaryTitle);
  put('season-secondary-copy',spot.secondaryCopy);
  const anchors=document.querySelectorAll('.season-idea-card > a');
  const codes=['one','two','three'];
  if(spot.theme==='winter'){
    src('season-card-one-image','/assets/recast-christmas-hero-v163.webp');
    src('season-card-two-image','/assets/world-royal-v18.webp');
    src('season-card-three-image','/assets/world-fantasy-v18.webp');
    src('season-gift-image','/assets/recast-christmas-hero-v163.webp');
    src('season-secondary-image','/assets/recast-christmas-hero-v163.webp');
    put('season-image-label','PERSONAL HOLIDAY MAGIC');
    const labels=[
      ['HOLIDAY LIGHTS','Cozy holiday magic','Twinkling lights, snowy villages and everyone you love.','christmas'],
      ['TIMELESS PORTRAITS','Royal memories','Give your favorite person a portrait fit for a story.','royal'],
      ['WHIMSICAL WORLDS','Storybook adventures','A magical world for your favorite faces and furry friends.','storybook']
    ];
    for(let i=0;i<labels.length;i++){
      const [badge,title,description,style]=labels[i],link='/?style='+style+'#start',id='season-card-'+codes[i];
      put(id+'-badge',badge);put(id+'-title',title);put(id+'-description',description);
      put(id+'-link','Choose '+title+' →');href(id+'-link',link);
      if(anchors[i]){anchors[i].href=link;anchors[i].setAttribute('aria-label','Create '+title.toLowerCase());}
    }
  }else{
    src('season-card-one-image','/assets/world-royal-v18.webp');
    src('season-card-two-image','/assets/world-fantasy-v18.webp');
    src('season-card-three-image','/assets/world-game-card-v181.webp');
    src('season-gift-image',spot.theme==='autumn'?'/assets/recast-halloween-gifts-v163.webp':'/assets/world-royal-v18.webp');
    src('season-secondary-image',spot.theme==='autumn'?'/assets/recast-halloween-gifts-v163.webp':'/assets/world-fantasy-v18.webp');
    put('season-image-label','YOUR FAVORITE MEMORY • MADE TO KEEP');
    const labels=[
      ['TIMELESS PORTRAITS','Royal memories','A picture of your favorite person, beautifully reimagined.','royal'],
      ['WHIMSICAL WORLDS','Storybook magic','Let them star in a one-of-a-kind adventure.','storybook'],
      ['BOLD ADVENTURES','Game world stars','Epic new scenes starring your pet or favorite people.','game']
    ];
    for(let i=0;i<labels.length;i++){
      const [badge,title,description,style]=labels[i],link='/?style='+style+'#start',id='season-card-'+codes[i];
      put(id+'-badge',badge);put(id+'-title',title);put(id+'-description',description);
      put(id+'-link','Choose '+title+' →');href(id+'-link',link);
      if(anchors[i]){anchors[i].href=link;anchors[i].setAttribute('aria-label','Create '+title.toLowerCase());}
    }
  }
}
function fillCalendar(){
  const events=upcomingGiftEvents(now,6);
  const grid=by('season-calendar-grid');
  if(!grid)return;
  const cards=[];
  for(const event of events){
    const card=el('article','season-event-card');
    const kicker=el('div','season-event-kicker');
    kicker.append(el('span','',event.icon+' '+(daysToEvent(event,now)===0?'TODAY':'COMING UP')),
      el('span','',eventDateLabel(event.date).toUpperCase()));
    const h=el('h3','',event.title);
    const p=el('p','',event.lead);
    const link=el('a','','Create this look →');
    link.href='/?style='+encodeURIComponent(event.style)+'#start';
    link.setAttribute('aria-label','Choose '+event.title+' personalized photo gift style');
    card.append(kicker,h,p,link);
    cards.push(card);
  }
  grid.replaceChildren(...cards);
}
updateHero();
fillCalendar();

if(campaign.offer){
 for(const banner of document.querySelectorAll('[data-season-offer]')){
  banner.hidden=false;
  const headline=document.createElement('strong');headline.textContent='10%';headline.className='season-offer-number';
  const copy=document.createElement('span');copy.className='season-offer-copy';
  const eyebrow=document.createElement('small');eyebrow.textContent='A LITTLE SEASONAL MAGIC';
  const title=document.createElement('b');title.textContent='OFF YOUR '+campaign.offer.name.toUpperCase()+' GIFTS';
  const detail=document.createElement('span');detail.textContent='Choose the '+(campaign.offer.style==='birthday'?'Birthday / celebration':campaign.offer.name)+' filter. Your saving appears automatically at checkout.';
  copy.append(eyebrow,title,detail);banner.append(headline,copy);
 }
 const terms=document.getElementById('season-offer-terms');terms.textContent=campaign.offer.terms;terms.hidden=false;
}

renderSeasonalProducts(campaign);
