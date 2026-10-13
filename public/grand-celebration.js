/* Recast Me grand purchase moment — visual-only. Never verifies payments or issues credits.
   Call only with server-verified paid order data or explicitly with demo=true. */
const ICON = 'https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recastmeai-approved-orbit-icon-v1.png?v=1791313742&width=300';
let active = null;
function haptic(){
  try { window.webkit?.messageHandlers?.recastHaptic?.postMessage('success'); } catch {}
}
function element(tag, className, textValue){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(textValue!==undefined)node.textContent=textValue;
  return node;
}
function particles(){
  // Deliberately deterministic so every replay feels choreographed.
  const wrap=element('div','rg-particles');
  wrap.setAttribute('aria-hidden','true');
  for(let i=0;i<44;i++){
    const spin=i*2.399963229728653;
    const radius=125+(i%8)*34;
    const dot=element('i','rg-particle '+(i%7===0?'rg-particle-star':''));
    dot.style.setProperty('--tx',Math.round(Math.cos(spin)*radius)+'px');
    dot.style.setProperty('--ty',Math.round(Math.sin(spin)*radius-16)+'px');
    dot.style.setProperty('--twist',String(280+(i*39)%540)+'deg');
    dot.style.setProperty('--delay',String(0.20+(i%9)*0.048)+'s');
    dot.style.setProperty('--spark-color',['#33eaf7','#be49ff','#ff6bd9','#8fffee','#fbd47e'][i%5]);
    wrap.append(dot);
  }
  return wrap;
}
const SKY=`
  <div class="rg-backdrop"></div>
  <section class="rg-card" role="dialog" aria-modal="true"
     aria-labelledby="rg-grand-title" aria-describedby="rg-grand-subtitle" tabindex="-1">
    <div class="rg-cosmos" aria-hidden="true">
      <div class="rg-aurora rg-aurora-one"></div><div class="rg-aurora rg-aurora-two"></div>
      <div class="rg-sunburst"></div><div class="rg-lightbeam rg-beam-a"></div>
      <div class="rg-lightbeam rg-beam-b"></div><div class="rg-lightbeam rg-beam-c"></div>
      <div class="rg-lightbeam rg-beam-d"></div><div class="rg-edge-shine"></div>
    </div>
    <button type="button" class="rg-close" aria-label="Close celebration">×</button>
    <div class="rg-content">
      <div class="rg-emblem" aria-hidden="true">
        <span class="rg-orbit rg-orbit-one"></span><span class="rg-orbit rg-orbit-two"></span>
        <span class="rg-orbit rg-orbit-three"></span>
        <span class="rg-logo-disc"><span class="rg-monogram">RM</span>
          <img class="rg-brand-icon" alt="" loading="eager" decoding="async">
        </span>
        <span class="rg-flare rg-flare-one"></span><span class="rg-flare rg-flare-two"></span>
      </div>
      <p class="rg-kicker"><span aria-hidden="true">✦</span> RECAST ME MAGIC <span aria-hidden="true">✦</span></p>
      <h2 class="rg-title" id="rg-grand-title">CONGRATULATIONS!</h2>
      <p class="rg-subtitle" id="rg-grand-subtitle">Your creation is becoming something real.</p>
      <p class="rg-order-pill"></p>
      <div class="rg-reward">
        <span class="rg-reward-shimmer" aria-hidden="true"></span>
        <span class="rg-reward-sparkle" aria-hidden="true">✦</span>
        <span class="rg-reward-label"></span>
        <strong class="rg-reward-headline"></strong>
        <span class="rg-reward-details"></span>
      </div>
      <div class="rg-actions">
        <a class="rg-action rg-action-primary" href="/my-orders.html"><span>View my order &amp; tracking</span><span aria-hidden="true">→</span></a>
        <a class="rg-action rg-action-secondary" href="/#start"><span>Make another Recast</span><span aria-hidden="true">✦</span></a>
        <button type="button" class="rg-replay"><span aria-hidden="true">↻</span> Replay the magic</button>
      </div>
      <p class="rg-footnote">Tracking appears after shipment. You can return to My Orders anytime.</p>
    </div>
  </section>
`;
export function showGrandCelebration(options={}){
  const {orderName='',products='',orderHref='/my-orders.html',
    added=0,bonusMessage='',demo=false,onOrder=null,onCreate=null}=options;
  if(active)active.close();
  const previous=document.activeElement;
  const beforeOverflow=document.body.style.overflow;
  const root=element('div','rg-overlay');
  root.innerHTML=SKY;
  const panel=root.querySelector('.rg-card');
  const background=panel.querySelector('.rg-cosmos');
  background.append(particles());
  const logo=panel.querySelector('.rg-brand-icon');
  logo.addEventListener('load',()=>panel.querySelector('.rg-logo-disc')?.classList.add('rg-icon-loaded'),{once:true});
  logo.src=ICON;
  const orderText=String(orderName||'').trim().slice(0,60);
  const productText=String(products||'Personalized gift').trim().slice(0,130);
  panel.querySelector('.rg-subtitle').textContent=demo
    ? 'See what a Recast Me purchase can feel like.'
    : 'Your '+productText+' is becoming something real.';
  panel.querySelector('.rg-order-pill').textContent=demo
    ? '✦ INTERACTIVE DEMO · NO REAL ORDER'
    : '✓ '+(orderText||'Your order')+' confirmed';
  const label=panel.querySelector('.rg-reward-label');
  const headline=panel.querySelector('.rg-reward-headline');
  const details=panel.querySelector('.rg-reward-details');
  const count=Number.isFinite(Number(added))?Math.max(0,Math.floor(Number(added))):0;
  if(demo){
    label.textContent='SAMPLE REWARD REVEAL';
    headline.textContent='+3 HQ RECASTS';
    details.textContent='A preview of the bonus moment. No credits are added.';
  }else if(count>0){
    label.textContent='BONUS UNLOCKED';
    headline.textContent='+'+count+' HQ '+(count===1?'RECAST':'RECASTS');
    details.textContent='More High Quality adventures are ready to create!';
  }else{
    label.textContent='YOUR NEXT ADVENTURE';
    headline.textContent='KEEP THE MAGIC GOING';
    details.textContent=String(bonusMessage||'Your order is confirmed. Check My Orders for updates.').slice(0,260);
    panel.querySelector('.rg-reward').classList.add('rg-reward-quiet');
  }
  const order=panel.querySelector('.rg-action-primary');
  const destination=new URL(String(orderHref||'/my-orders.html'),location.origin);
  order.href=destination.origin===location.origin?destination.href:'/my-orders.html';
  order.querySelector('span:first-child').textContent=demo?'See example order & tracking':'View my order & tracking';
  let reduced=false;
  try{reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch{}
  if(reduced)root.classList.add('rg-reduced');
  const replay=()=>{
    root.classList.remove('rg-playing');
    void panel.offsetWidth;
    root.classList.add('rg-playing');
    if(!reduced)haptic();
  };
  const close=()=>{
    if(active?.root!==root)return;
    active=null;
    root.remove();
    document.body.style.overflow=beforeOverflow;
    document.removeEventListener('keydown',onKey);
    if(previous?.isConnected&&typeof previous.focus==='function')previous.focus({preventScroll:true});
  };
  const onKey=(event)=>{
    if(event.key==='Escape'){event.preventDefault();close();return;}
    if(event.key!=='Tab')return;
    const focusables=[...panel.querySelectorAll('a[href],button:not([disabled])')];
    if(!focusables.length)return;
    const first=focusables[0],last=focusables[focusables.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  panel.querySelector('.rg-close').addEventListener('click',close);
  root.querySelector('.rg-backdrop').addEventListener('click',close);
  panel.querySelector('.rg-replay').addEventListener('click',replay);
  order.addEventListener('click',(event)=>{
    if(typeof onOrder==='function'){event.preventDefault();close();onOrder();}
  });
  panel.querySelector('.rg-action-secondary').addEventListener('click',(event)=>{
    if(typeof onCreate==='function'){event.preventDefault();close();onCreate();}
  });
  document.addEventListener('keydown',onKey);
  document.body.append(root);
  document.body.style.overflow='hidden';
  active={root,close,replay};
  panel.querySelector('.rg-close').focus({preventScroll:true});
  replay();
  return {close,replay};
}
