// Private Recast traffic dashboard, using only the existing admin bearer login.
// No charting SDK or additional account. Server returns aggregate category data.
export function initOwnerTraffic(api){
 const root=document.querySelector('[data-panel="traffic"]');
 if(!root)return {load:async()=>{},clear:()=>{}};
 const $=id=>root.querySelector('#'+id);
 const labels={home:'Home / Creator',credits:'Credits & Gifts',order:'Saved Order Status',support:'Support',privacy:'Privacy'};
 let range=7,loaded=false;
 const n=value=>Number(value||0).toLocaleString();
 function ranking(id,rows){
  const target=$(id);if(!target)return;
  target.replaceChildren();
  const all=(rows||[]).filter(row=>Number(row.count)>0);
  if(!all.length){const p=document.createElement('p');p.className='muted';p.textContent='No activity measured yet.';target.append(p);return}
  const max=Math.max(1,...all.map(x=>x.count));
  for(const row of all){
   const item=document.createElement('div');item.className='traffic-rank-row';
   const top=document.createElement('div');top.className='traffic-rank-title';
   const name=document.createElement('span');name.textContent=labels[row.name]||row.name.replace(/-/g,' ').replace(/^./,s=>s.toUpperCase());
   const value=document.createElement('strong');value.textContent=n(row.count);
   top.append(name,value);
   const bar=document.createElement('div');bar.className='traffic-rank-track';
   const inner=document.createElement('span');inner.style.width=Math.max(3,Math.round(row.count/max*100))+'%';bar.append(inner);
   item.append(top,bar);target.append(item);
  }
 }
 function drawTimeline(rows){
  const target=$('traffic-timeline');target.replaceChildren();
  const history=rows||[],peak=Math.max(1,...history.map(p=>p.pageViews||0));
  for(const point of history){
   const day=document.createElement('div');day.className='traffic-day';day.title=point.date+' UTC · '+n(point.pageViews)+' page views · '+n(point.visitors)+' estimated visitors';
   const value=document.createElement('span');value.className='traffic-day-value';value.textContent=n(point.pageViews);
   const bar=document.createElement('div');bar.className='traffic-day-track';
   const fill=document.createElement('span');fill.className='traffic-day-fill';
   fill.style.height=(point.pageViews?Math.max(5,Math.round(point.pageViews/peak*100)):0)+'%';bar.append(fill);
   const date=document.createElement('small');date.textContent=point.date.slice(5).replace('-','/');
   day.append(value,bar,date);target.append(day);
  }
 }
 function setText(id,value){const el=$(id);if(el)el.textContent=value}
 function show(data){
  const t=data.totals||{};
  setText('traffic-visitors',n(t.visitors));
  setText('traffic-sessions',n(t.sessions));
  setText('traffic-pageviews',n(t.pageViews));
  setText('traffic-create-starts',n(t.creatorStarts));
  setText('traffic-successful-renders',n(t.renderSuccesses));
  setText('traffic-checkouts',n(t.checkoutClicks));
  setText('traffic-funnel-text',[
    ['Opened creator',t.creatorStarts],['Added photos',t.photosAdded],
    ['Started an AI preview',t.renderAttempts],['Preview ready',t.renderSuccesses],
    ['Preview failed',t.renderFailures],['Viewed a real product mockup',t.productPreviews],
    ['Clicked Shopify checkout',t.checkoutClicks],['Clicked credit-pack checkout',t.creditCheckoutClicks],
    ['Redeemed gift/support code',t.redemptions]
  ].map(([title,count])=>title+': '+n(count)).join('\n'));
  drawTimeline(data.timeline);
  ranking('traffic-sources',data.sources);ranking('traffic-pages',data.topPages);
  ranking('traffic-devices',data.devices);ranking('traffic-countries',data.countries);
  ranking('traffic-campaigns',data.campaigns);ranking('traffic-adventures',data.adventures);
  setText('traffic-last-updated','Updated '+new Date().toLocaleString()+' · '+(data.days===1?'Today':data.days+' days')+' · UTC date boundaries.');
  const overview=document.querySelector('#stat-visitors');
  if(overview)overview.textContent=n(t.visitors);
  const overviewLabel=document.querySelector('#stat-visitors-note');
  if(overviewLabel)overviewLabel.textContent='Estimated unique browsers · '+(data.days===1?'today':data.days+' days');
 }
 async function load(){
  const status=$('traffic-fetch-status');
  status.textContent='Loading private first-party traffic…';
  try{
   const data=await api('/api/admin/traffic?days='+range);
   show(data);loaded=true;
   status.textContent='Site visits and actions are counted from when this feature went live. No historical visitor data can be backfilled.';
  }catch(error){
   status.textContent='Traffic stats unavailable: '+error.message;
   if(!loaded){setText('traffic-visitors','—');setText('traffic-sessions','—')}
  }
 }
 root.querySelectorAll('[data-traffic-days]').forEach(button=>{
  button.addEventListener('click',()=>{
   range=Number(button.dataset.trafficDays);
   root.querySelectorAll('[data-traffic-days]').forEach(b=>{
    const selected=Number(b.dataset.trafficDays)===range;
    b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));
   });
   load().catch(()=>{});
  });
 });
 $('traffic-reload')?.addEventListener('click',()=>load().catch(()=>{}));
 return {load,clear(){
  loaded=false;
  root.querySelectorAll('[data-traffic-secret]').forEach(node=>node.textContent='—');
  $('traffic-timeline')?.replaceChildren();
  for(const id of ['traffic-sources','traffic-pages','traffic-devices','traffic-countries','traffic-campaigns','traffic-adventures'])$(id)?.replaceChildren();
  setText('traffic-fetch-status','');
  const card=document.querySelector('#stat-visitors');if(card)card.textContent='—';
 }};
}
