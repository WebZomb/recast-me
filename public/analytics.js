// Recast's optional, first-party, aggregate site measurements (no third-party SDK).
// Never include customer photos, IPs, private URLs/tokens, email, full referrers,
// or typed text in the analytics event. Honor browser privacy signals.
(() => {
  const enabled=['recastmeai.com','www.recastmeai.com','recast-me.sergz24.workers.dev'].includes(location.hostname);
  const pagePath=location.pathname.replace(/\.html$/,'');
  const page=({'/':'home','/credits':'credits','/order':'order','/support':'support','/privacy':'privacy'})[pagePath];
  const visitorKey='recast_analytics_visitor_v1',sessionKey='recast_analytics_session_v1',optOutKey='recast_analytics_opt_out';
  const DAY=86400000,SESSION=30*60000,VISITOR=30*DAY;
  const pages=new Set(['home','credits','order','support','privacy']);
  const types=new Set(['creator_started','photo_added','adventure_selected','render_started','render_succeeded','render_failed','product_preview','checkout_clicked','credit_checkout','credit_redeemed']);
  const sourceNames=new Set(['direct','internal','google','bing','search','instagram','facebook','tiktok','youtube','x','pinterest','email','other']);
  const randomId=()=>[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const safeRead=(storage,key)=>{try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}};
  const safeWrite=(storage,key,value)=>{try{storage.setItem(key,JSON.stringify(value));return true}catch{return false}};
  const optedOut=()=>{
    try{if(localStorage.getItem(optOutKey)==='1')return true}catch{return true}
    return navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';
  };
  const slug=value=>/^[a-z0-9][a-z0-9_-]{0,31}$/.test(String(value||'').toLowerCase())?String(value).toLowerCase():'';
  const classify=(source)=>{
    const value=String(source||'').toLowerCase().replace(/^www\./,'');
    if(!value)return 'direct';
    if(value.includes('instagram'))return 'instagram';
    if(value.includes('facebook')||value.includes('fb.com'))return 'facebook';
    if(value.includes('tiktok'))return 'tiktok';
    if(value.includes('youtube')||value==='youtu.be')return 'youtube';
    if(value==='x'||value==='twitter'||value.includes('twitter.com')||value==='x.com')return 'x';
    if(value.includes('pinterest'))return 'pinterest';
    if(value.includes('google'))return 'google';
    if(value.includes('bing'))return 'bing';
    if(value==='email'||value==='newsletter')return 'email';
    if(value==='organic'||value==='search'||value==='duckduckgo.com'||value==='yahoo.com')return 'search';
    if(value.includes('recastmeai.com')||value.includes('recast-me.sergz24.workers.dev'))return 'internal';
    return 'other';
  };
  const attribution=()=>{
    const params=new URLSearchParams(location.search);
    const utm=slug(params.get('utm_source'));
    let source=classify(utm);
    if(!utm){
      try{const ref=new URL(document.referrer);source=classify(ref.hostname)}catch{source='direct'}
    }
    if(!sourceNames.has(source))source='other';
    return {source,campaign:slug(params.get('utm_campaign'))};
  };
  const setup=()=>{
    if(!enabled||!pages.has(page)||optedOut())return null;
    const now=Date.now();
    let visitor=safeRead(localStorage,visitorKey);
    if(!visitor||!/^[a-f0-9]{32}$/.test(visitor.id||'')||!Number.isFinite(visitor.until)||visitor.until<=now){
      visitor={id:randomId(),until:now+VISITOR};
      if(!safeWrite(localStorage,visitorKey,visitor))return null;
    }
    let session=safeRead(sessionStorage,sessionKey),fresh=false;
    if(!session||!/^[a-f0-9]{32}$/.test(session.id||'')||!Number.isFinite(session.until)||session.until<=now){
      session={id:randomId(),until:now+SESSION,landingSent:false,...attribution()};fresh=true;
    }else session.until=now+SESSION;
    if(!safeWrite(sessionStorage,sessionKey,session))return null;
    return {visitor,session,fresh};
  };
  let identity=setup();
  function send(type,extra={}){
    if(!identity||optedOut())return;
    if(type!=='visit'&&type!=='page_view'&&!types.has(type))return;
    const safeAdventure=type==='adventure_selected'?slug(extra.adventure):'';
    const body=JSON.stringify({type,visitorId:identity.visitor.id,sessionId:identity.session.id,
      path:page,source:identity.session.source,campaign:identity.session.campaign,
      ...(safeAdventure?{adventure:safeAdventure}:{})});
    fetch('/api/analytics/event',{method:'POST',headers:{'content-type':'application/json','x-recast-request':'1'},
      body,keepalive:true,credentials:'omit',cache:'no-store'}).catch(()=>{});
  }
  window.recastTrack=(type,extra={})=>{if(types.has(type))send(type,extra)};
  if(identity){
    const type=identity.session.landingSent?'page_view':'visit';
    identity.session.landingSent=true;
    safeWrite(sessionStorage,sessionKey,identity.session);
    send(type);
    if(page==='home'){
      document.addEventListener('click',event=>{
        const element=event.target.closest?.('[data-go-step="1"],.style-card');
        if(!element)return;
        if(element.matches('[data-go-step="1"]'))send('creator_started');
        else if(element.matches('.style-card'))send('adventure_selected',{adventure:element.dataset.style});
      },{capture:true,passive:true});
      document.querySelector('#style')?.addEventListener('change',event=>send('adventure_selected',{adventure:event.target.value}));
      document.querySelector('#photos')?.addEventListener('change',event=>{
        if(event.target.files?.length)send('photo_added');
      });
    }
  }
  const optOut=document.querySelector('#analytics-opt-out');
  if(optOut){
    try{optOut.textContent=localStorage.getItem(optOutKey)==='1'?'Optional analytics disabled':'Disable optional site analytics for this browser'}catch{}
    optOut.addEventListener('click',()=>{
      try{localStorage.setItem(optOutKey,'1');localStorage.removeItem(visitorKey);sessionStorage.removeItem(sessionKey)}catch{}
      identity=null;optOut.textContent='Optional analytics disabled';
      const status=document.querySelector('#analytics-opt-out-status');if(status)status.textContent='This browser will no longer send optional Recast site analytics.';
    });
  }
})();
