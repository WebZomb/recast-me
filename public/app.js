import {mergeHistory,privateRecastLink,readRecastLink} from './recast-history.js';
import {initCreationWizard} from './creation-wizard.js';
import {fallbackState,creditSummary} from './quality-policy.js?v=250';
import {protectedPreviewFile} from './preview-export.js';
let creditInfo=null;
async function refreshCredits(initialize=false){
  const display=document.querySelector('#render-credits');
  try{
    const r=await fetch('/api/render-credits',{method:initialize?'POST':'GET',headers:{'x-recast-request':'1'}}),d=await r.json();
    if(!r.ok)throw new Error(d.userMessage||d.error||'Could not check your previews.');
    creditInfo=d;
    if(display){display.hidden=!d.enabled;display.textContent=d.enabled?creditSummary(d):'';}
    applyReadiness();
    return d;
  }catch(e){if(display){display.hidden=false;display.textContent=e.message}throw e}
}
refreshCredits(true).catch(()=>{});
try{
  const path=sessionStorage.getItem('recast_order_return');
  if(path&&path.startsWith('/order.html?')){const box=document.querySelector('#return-to-order');box.hidden=false;box.querySelector('a').href=path;}
}catch{}
const STYLES = [
["game","Game World","Cinematic city energy, dramatic light, bold illustrated realism.","/assets/world-game-card-v181.webp","Adventure portrait","Featured"],
["halloween","Halloween","Stylish costumes, moonlight, fog and pumpkins.","/assets/world-halloween-v18.webp","Halloween portrait","Featured"],
["retro","1980s","Neon color, film grain and authentic 1980s atmosphere.","/assets/world-retro-v18.webp","1980s portrait","Decades"],
["fantasy","Fantasy Warrior","Epic armor, ancient landscapes and cinematic fantasy light.","/assets/world-fantasy-v18.webp","Fantasy portrait","Featured"],
["royal","Royal","Regal portraiture, palace textures and rich ceremonial detail.","/assets/world-royal-v18.webp","Royal portrait","Featured"],
["future","Future City","Neon reflections, rain haze and an original high-tech world.","/assets/world-future-v18.webp","Future portrait","Featured"],
["comic","Comic Hero","Original graphic-novel energy, ink, halftone and motion.","/assets/world-comic-v18.webp","Comic portrait","Animation & Art"],
["space","Space Explorer","Original sci-fi portraiture, planets, spacecraft and epic scale.","/assets/world-space-v18.webp","Space portrait","Movies & Adventures"],
["animated-sitcom","Animated Sitcom","Original prime-time cartoon comedy with clean shapes and expressive faces.","/assets/world-comic-v18.webp","Animated portrait","Animation & Art"],
["cutout-comedy","Cutout Comedy","Original paper-cut comedy look with handmade texture and playful energy.","/assets/world-comic-v18.webp","Cutout portrait","Animation & Art"],
["anime","Anime Adventure","Original cinematic anime-inspired portrait with expressive linework and detailed backgrounds.","/assets/world-game-v18.webp","Anime portrait","Animation & Art"],
["storybook","Storybook","Warm painterly storybook illustration with whimsical scenery.","/assets/world-fantasy-v18.webp","Storybook portrait","Animation & Art"],
["football","Football Gameday","Stadium lights, original team colors and unbranded uniform styling.","/assets/world-game-v18.webp","Football portrait","Sports"],
["basketball","Basketball Arena","Courtside energy, arena lights and original unbranded jersey styling.","/assets/world-game-v18.webp","Basketball portrait","Sports"],
["baseball","Baseball Ballpark","Classic ballpark atmosphere and original unbranded uniform styling.","/assets/world-game-v18.webp","Baseball portrait","Sports"],
["soccer","Soccer Stadium","Match-night energy and original unbranded kit styling.","/assets/world-game-v18.webp","Soccer portrait","Sports"],
["seventies","1970s","Warm film color, period fashion and authentic 1970s atmosphere.","/assets/world-retro-v18.webp","1970s portrait","Decades"],
["nineties","1990s","Bold 1990s fashion, flash photography and colorful nostalgia.","/assets/world-retro-v18.webp","1990s portrait","Decades"],
["y2k","Y2K / 2000s","Glossy early-2000s pop styling, chrome and playful futuristic nostalgia.","/assets/world-future-v18.webp","Y2K portrait","Decades"],
["space-opera","Space Opera","Original galaxy-spanning cinema with spacecraft, alien skies and heroic sci-fi wardrobe.","/assets/world-space-v18.webp","Space opera portrait","Movies & Adventures"],
["wizard-academy","Wizard Academy","Original magical academy with robes, ancient halls and enchanted light.","/assets/world-fantasy-v18.webp","Wizard portrait","Movies & Adventures"],
["dinosaur-adventure","Dinosaur Adventure","Original prehistoric expedition with lush jungle and distant dinosaurs.","/assets/world-game-v18.webp","Dinosaur adventure portrait","Movies & Adventures"],
["spy-thriller","Spy Thriller","Elegant original secret-agent cinema with tailored wardrobe and city-night intrigue.","/assets/world-game-v18.webp","Spy portrait","Movies & Adventures"],
["western","Wild West","Original cinematic frontier portrait with period wardrobe and golden-hour dust.","/assets/world-retro-v18.webp","Western portrait","Movies & Adventures"],
["pirate","Pirate Adventure","Original high-seas adventure with period styling and dramatic ship-deck light.","/assets/world-fantasy-v18.webp","Pirate portrait","Movies & Adventures"],
["noir","Film Noir","Classic black-and-white detective cinema with dramatic shadows and timeless wardrobe.","/assets/world-retro-v18.webp","Noir portrait","Movies & Adventures"],
["christmas","Holiday Magic","Elegant seasonal décor, twinkle lights and cozy cinematic glow.","/assets/world-fantasy-v18.webp","Holiday portrait","Seasonal"],
["valentine","Valentine","Romantic premium portrait with refined pink-red light and flowers.","/assets/world-royal-v18.webp","Valentine portrait","Seasonal"],
["birthday","Birthday Celebration","Colorful premium celebration with tasteful balloons, confetti and studio light.","/assets/world-royal-v18.webp","Birthday portrait","Seasonal"]
];

const PRODUCT_CATALOG = [
  {name:"Poster",price:"from $29.99",asset:"poster",image:"/assets/product-poster-v16.webp",badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured"},
  {name:"Hoodie",price:"from $59.99",asset:"hoodie",image:"/assets/product-hoodie-v16.webp",badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured"},
  {name:"Framed Poster",price:"from $44.99",asset:"framed-poster",image:"/assets/product-desk-frame-v16.webp",badge:"DESK + WALL",pitch:"8×10 desk size or larger framed wall art — ready to display and gift.",tier:"featured"},
  {name:"Canvas",price:"from $69.99",asset:"canvas",image:"/assets/product-canvas-v16.webp",badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured"},

  {name:"T-Shirt",price:"from $34.99",asset:"tshirt",image:"/assets/product-tshirt-v16.webp",badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary"},
  {name:"Blanket",price:"from $74.99",asset:"blanket",image:"/assets/product-blanket-v16.webp",badge:"COZY PICK",pitch:"Big, soft, personal — especially good for pets and gifts.",tier:"secondary"},
  {name:"Mug",price:"from $24.99",asset:"mug",image:"/assets/product-mug-v16.webp",badge:"GIFTABLE",pitch:"A personalized gift that gets used every day.",tier:"secondary"},
  {name:"Tumbler",price:"$49.99",asset:"tumbler",image:"/assets/product-tumbler-v16.webp",badge:"TAKE IT WITH YOU",pitch:"Your Recast on a 20 oz everyday tumbler.",tier:"secondary"},
  {name:"Magnet 3-Pack",price:"$24.99",asset:"magnet",image:"/assets/product-magnet-v16.webp",badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary"},
  {name:"Coaster 4-Pack",price:"$39.99",asset:"coaster",image:"/assets/product-coaster-v16.webp",badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary"},

  {name:"HD Digital Recast",price:"$4.99",asset:"digital",image:"/assets/product-digital-v16.webp",badge:"DIGITAL ONLY",pitch:"Just want the clean artwork? Keep the high-resolution file without ordering merch.",tier:"digital"},
  {name:"Recast Pack",price:"$9.99",asset:"pack",image:"/assets/product-pack-v16.webp",badge:"DIGITAL PACK",pitch:"The complete digital set with high-resolution art plus useful crops and formats.",tier:"digital"}
];

const styleGrid = document.querySelector('#style-grid');
const styleSelect = document.querySelector('#style');

const HOME_STYLE_IDS=new Set(['game','halloween','fantasy','royal','future','space']);
styleGrid.innerHTML = STYLES.filter(([id])=>HOME_STYLE_IDS.has(id)).map(([id,name,copy,image,subject],i)=>`
  <article class="style-card" data-style="${id}" tabindex="0" role="button" aria-label="Choose ${name}">
    <div class="style-art"><img src="${image}" alt="${subject}" loading="lazy"></div>
    <span class="style-pick">CHOOSE</span>
    <div class="style-copy">
      <small>STYLE ${String(i+1).padStart(2,'0')}</small>
      <h3>${name}</h3>
      <p>${copy}</p>
    </div>
  </article>`).join('');

const STYLE_GROUP_ORDER=['Featured','Animation & Art','Sports','Decades','Movies & Adventures','Seasonal'];
styleSelect.innerHTML=STYLE_GROUP_ORDER.map(group=>{
 const options=STYLES.filter(x=>x[5]===group).map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
 return options?`<optgroup label="${group}">${options}</optgroup>`:'';
}).join('')+`<optgroup label="Make your own"><option value="custom">Custom World — describe anything</option></optgroup>`;
styleSelect.value='royal';

function chooseStyle(card){
  styleSelect.value=card.dataset.style;
  updateWorldFields();
  document.querySelectorAll('.style-card').forEach(c=>c.classList.toggle('selected',c===card));
  document.querySelector('#start').scrollIntoView({behavior:'smooth'});
}
document.querySelectorAll('.style-card').forEach(card=>{
  card.addEventListener('click',()=>chooseStyle(card));
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseStyle(card)}})
});

function merchCard(item,{featured=false}={}){
  const classes=['product',featured?'featured-product':'secondary-product'].filter(Boolean).join(' ');
  return `<div class="${classes}">
    <div class="product-art"><img src="${item.image || `/assets/product-${item.asset}-v09.jpg`}" alt="${item.name}" loading="lazy" decoding="async"></div>
    <div class="product-body">
      <span class="product-badge">${item.badge}</span>
      <strong>${item.name}</strong>
      <p class="product-pitch">${item.pitch}</p>
      <span class="price">${item.price}</span>
      <a class="shop-card-cta" href="#start">Create yours <span>→</span></a>
    </div>
  </div>`;
}

function renderStaticMerch(){
  const catalog=document.querySelector('#product-grid');
  if(catalog){
    catalog.classList.add('merch-catalog-shell','merch-home-all');
    catalog.innerHTML=`
      <div class="merch-home-track" aria-label="All Recast Me products">
        ${PRODUCT_CATALOG.map(x=>merchCard(x)).join('')}
      </div>
      <div class="merch-home-note">
        <span>ALL PRODUCTS</span>
        <p>Swipe through the full collection. After you choose a Recast, every product uses your exact Artwork ID and a real product preview before checkout.</p>
      </div>`;
  }
}
renderStaticMerch();

const params = new URLSearchParams(location.search);
if (params.get('debug')==='1') document.querySelector('#debug-status')?.classList.remove('hidden');
if (params.get('request')) {
  document.querySelector('#notes').value = params.get('request');
  document.querySelector('#prefill-note').textContent = `Loaded from your social request: “${params.get('request')}”`;
}
if (params.get('style') && (STYLES.some(x=>x[0]===params.get('style')) || params.get('style')==='custom')) styleSelect.value=params.get('style');
if(params.get('source')==='x'&&styleSelect.value==='custom')document.querySelector('#custom-world').value=params.get('request')||'';
function updateWorldFields(){
  const isCustom=styleSelect.value==='custom';
  const field=document.querySelector('#custom-world-field');
  const input=document.querySelector('#custom-world');
  field.hidden=!isCustom;
  input.disabled=false;
  input.required=isCustom;
  if(!isCustom)input.value=STYLES.find(s=>s[0]===styleSelect.value)?.[2]||'';
  document.querySelectorAll('.style-card').forEach(card=>card.classList.toggle('selected',card.dataset.style===styleSelect.value));
  document.dispatchEvent(new Event('recast-style-change'));
}
updateWorldFields();
document.querySelector('#custom-world').addEventListener('input',()=>{
  styleSelect.value='custom';
  updateWorldFields();
});

const photos = document.querySelector('#photos');
let photoURLs=[];
let selectedPhotoFiles=[];
function showSelectedPhotos(message=''){
  photoURLs.forEach(url=>URL.revokeObjectURL(url));photoURLs=[];
  const selected=[...photos.files];selectedPhotoFiles=selected;
  document.querySelector('#file-summary').textContent=message||(selected.length?`${selected.length} of 4 photos ready`:'No photos selected');
  const root=document.querySelector('#photo-thumbnails');root.replaceChildren();
  selected.forEach((file,index)=>{
    const tile=document.createElement('div');tile.className='photo-thumbnail';
    const img=document.createElement('img');const url=URL.createObjectURL(file);photoURLs.push(url);img.src=url;img.alt=`Selected photo ${index+1}`;
    const button=document.createElement('button');button.type='button';button.textContent='Remove';button.setAttribute('aria-label',`Remove photo ${index+1}`);
    button.addEventListener('click',()=>{const transfer=new DataTransfer();[...photos.files].filter((_,i)=>i!==index).forEach(f=>transfer.items.add(f));photos.files=transfer.files;showSelectedPhotos();});
    tile.append(img,button);root.append(tile);
  });
  document.dispatchEvent(new Event('recast-photos-change'));
}
const wizard=initCreationWizard({styles:STYLES,photos,subject:document.querySelector('#subject'),style:styleSelect,updateWorld:updateWorldFields,hasBranch:()=>Boolean(branchReference)});
photos.addEventListener('change',()=>{
  const original=[...selectedPhotoFiles];
  for(const file of photos.files)if(!original.some(old=>old.name===file.name&&old.size===file.size&&old.lastModified===file.lastModified))original.push(file);
  const transfer=new DataTransfer();original.slice(0,4).forEach(f=>transfer.items.add(f));photos.files=transfer.files;
  showSelectedPhotos(original.length>4?'Using the first 4 photos. Remove or replace any below.':'');
});
document.querySelector('#surprise-world').addEventListener('click',()=>{
  const choices=STYLES.filter(s=>s[0]!==styleSelect.value);const pick=choices[Math.floor(Math.random()*choices.length)];styleSelect.value=pick[0];updateWorldFields();
  document.querySelector('#world-choice-feedback').textContent=`Let’s try ${pick[1]}! Your subject description stays the same.`;
});

document.querySelectorAll('[data-idea-subject]').forEach(card=>{
  card.addEventListener('click',()=>{
    const subject=document.querySelector('#subject');
    if(subject){subject.value=card.dataset.ideaSubject||'person';subject.dispatchEvent(new Event('change'));}
    wizard.go(0);
    const note=document.querySelector('#notes');
    if(note)note.value=card.dataset.ideaNote||'';
    document.querySelector('#start')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
styleSelect.addEventListener('change',()=>{
  updateWorldFields();
  const custom=document.querySelector('#custom-world');
  if(styleSelect.value==='custom'&&custom&&!custom.value)custom.focus({preventScroll:true});
});


async function resizeFile(file,max=500){
  let bitmap;
  try{bitmap=await createImageBitmap(file)}catch{
    const url=URL.createObjectURL(file);
    try{bitmap=await new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('This photo could not be opened. Try a JPEG or PNG.'));img.src=url;
    })}finally{URL.revokeObjectURL(url)}
  }
  const scale=Math.min(1,max/Math.max(bitmap.width||bitmap.naturalWidth,bitmap.height||bitmap.naturalHeight));
  const w=Math.max(1,Math.round((bitmap.width||bitmap.naturalWidth)*scale)),h=Math.max(1,Math.round((bitmap.height||bitmap.naturalHeight)*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(bitmap,0,0,w,h);
  bitmap.close?.();
  return new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(new File([blob],(file.name||'reference').replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'})):reject(new Error('Could not prepare image.')),
    'image/jpeg',.88
  ));
}

async function renderWatermark(dataUrl){
  // Server output is already flattened with @RecastMeAi • PREVIEW.
  // Display those same protected pixels everywhere; never rely on a canvas-only mark.
  const img=new Image();img.src=dataUrl;await img.decode();
  const canvas=document.querySelector('#preview-canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  canvas.getContext('2d').drawImage(img,0,0);
}

function inferSubject(subject,notes){
  const text=String(notes||'').toLowerCase();
  if(subject==='person' && /\b(dog|puppy|pup|cat|kitten|pet|horse)\b/.test(text)) return 'person and pet';
  if(subject==='person' && /\b(car|truck|vehicle|motorcycle|bike)\b/.test(text)) return 'person and car';
  return subject;
}

let generationTimer=null;
function selectedQuality(){
  return document.querySelector('input[name="qualityMode"]:checked')?.value==='quick'?'quick':'high';
}
function qualityLabel(mode=selectedQuality()){
  return mode==='quick'?'Standard Preview':'High-Quality Preview';
}
function updateQualityUI(){
  const mode=selectedQuality();
  document.querySelectorAll('[data-quality-card]').forEach(card=>card.classList.toggle('selected',card.dataset.qualityCard===mode));
  const button=document.querySelector('#generate-button');
  if(button&&!generationInFlight)button.textContent=mode==='quick'?'Create Standard Preview':'Create High-Quality Preview';
  const copy=document.querySelector('#model-copy');
  if(copy)copy.textContent=mode==='quick'
    ? 'Standard Preview · detail and likeness may be lower than High Quality'
    : 'High-Quality Preview · best likeness, prompt accuracy, and detail';
}
document.querySelectorAll('input[name="qualityMode"]').forEach(input=>input.addEventListener('change',()=>{updateQualityUI();applyReadiness();refreshRenderAvailability();}));

function startGenerationUI(mode=selectedQuality()){
  const status=document.querySelector('#generation-status');
  const detail=document.querySelector('#generation-detail');
  const progress=document.querySelector('#generation-progress');
  const started=Date.now();
  if(status) status.textContent='Creating your '+qualityLabel(mode)+'…';
  if(detail) detail.textContent='High-quality artwork can take a few minutes. Keep this page open.';
  if(progress) progress.style.width='100%';
  clearInterval(generationTimer);
  generationTimer=setInterval(()=>{
    const seconds=Math.floor((Date.now()-started)/1000);
    if(detail) detail.textContent=`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} elapsed · Waiting for your artwork. Keep this page open.`;
  },1000);
}
function stopGenerationUI(success=false){
  clearInterval(generationTimer); generationTimer=null;
  const progress=document.querySelector('#generation-progress');
  if(progress) progress.style.width=success?'100%':'0%';
}
function friendlyGenerationError(data,error){
  const mode=data?.qualityMode||selectedQuality();
  const label=qualityLabel(mode);
  if(error?.name==='AbortError') return `${label} was still processing after several minutes, so this page stopped waiting. Keep this page open briefly and check Recent Versions before starting another attempt.`;
  if(data?.reviewRequired) return 'This request needs a quick human review before generation.';
  if(data?.code===3036 || data?.reason==='quota') return 'Recast Me has reached its shared AI capacity for today. This is a site-wide limit, not your personal render count. Your photo and settings are still here; nothing was charged.';
  if(data?.code===3030 || data?.reason==='moderation') return `${label} was declined by the image provider’s safety filter. This is not a busy-server message. Your saved pictures are still available; use an existing version or contact support with the reference below.`;
  if(data?.reason==='timeout') return `${label} timed out before the provider returned the artwork. Your photo and settings are still here — wait for Ready before trying again.`;
  if(data?.reason==='capacity') return `${label} received a confirmed busy response. Your photo and settings are still here — wait for Ready or choose another ready quality.`;
  if(data?.reason==='unavailable') return `${label} is temporarily unavailable. Your photo and settings are still here — wait for Ready before trying again.`;
  return data?.userMessage || `${label} did not finish this time. Your photo and settings are still here.`;
}

let readinessSnapshot=null;
function readinessFor(mode=selectedQuality()){return readinessSnapshot?.modes?.[mode]||null}
function readinessMessage(mode=selectedQuality()){
  const health=readinessFor(mode);
  if(!readinessSnapshot?.local?.ready)return 'Image creation is unavailable while Recast Me checks its required services.';
  if(!health)return 'Checking render readiness…';
  if(health.ready)return `${qualityLabel(mode)} · Ready`;
  if(health.reason==='quota')return `${qualityLabel(mode)} · Shared capacity paused`;
  if(health.reason==='timeout')return `${qualityLabel(mode)} · Previous attempt timed out — cooling down`;
  if(health.reason==='capacity')return `${qualityLabel(mode)} · Confirmed busy — cooling down`;
  if(health.reason==='unavailable')return `${qualityLabel(mode)} · Provider temporarily unavailable`;
  return `${qualityLabel(mode)} · Unavailable`;
}
function currentFallback(){return fallbackState(readinessSnapshot,creditInfo,selectedQuality())}
function updateFallback(){
  const state=currentFallback(),box=document.querySelector('#quality-fallback');
  if(box)box.hidden=!state.show;
  const reason=document.querySelector('#quality-fallback-reason');if(reason)reason.textContent=state.message;
  const standard=document.querySelector('#choose-standard');if(standard){standard.hidden=selectedQuality()==='quick';standard.disabled=!state.standardReady;}
  const high=document.querySelector('#choose-high');if(high)high.hidden=selectedQuality()!=='quick';
  const purchase=document.querySelector('#credit-purchase-link');if(purchase)purchase.hidden=!state.exhausted;
  return state;
}
for(const [id,mode] of [['choose-standard','quick'],['choose-high','high']])document.querySelector('#'+id)?.addEventListener('click',()=>{
  if(mode==='quick'&&!currentFallback().standardReady)return;
  document.querySelector(`input[name="qualityMode"][value="${mode}"]`).checked=true;
  updateQualityUI();applyReadiness();
});
function applyReadiness(){
  if(currentFallback().returnToHigh&&!generationInFlight){
    const high=document.querySelector('input[name="qualityMode"][value="high"]');if(high)high.checked=true;
    updateQualityUI();
  }
  const mode=selectedQuality(),health=readinessFor(mode),button=document.querySelector('#generate-button'),notice=document.querySelector('#render-availability');
  const fallback=updateFallback();
  const ready=Boolean(readinessSnapshot?.local?.ready&&health?.ready&&(mode==='quick'?fallback.standardReady:!fallback.exhausted));
  if(button&&!generationInFlight){button.disabled=!ready;button.textContent=ready?(mode==='quick'?'Create Standard Preview':'Create High-Quality Preview'):fallback.exhausted&&mode==='high'?'High Quality allowance used':'Checking availability…';}
  const copy=document.querySelector('#model-copy');if(copy)copy.textContent=readinessMessage(mode);
  const dot=document.querySelector('.quality-dot');if(dot)dot.dataset.state=ready?'ready':readinessSnapshot?.local?.ready?'waiting':'error';
  if(notice){notice.hidden=ready;notice.textContent=ready?'':fallback.exhausted&&mode==='high'?'High Quality allowance used. See your options below.':readinessMessage(mode)+' Your photo and settings stay here.';}
  return ready;
}
async function refreshRenderAvailability(){
  try{
    const response=await fetch('/api/render-readiness',{cache:'no-store',signal:AbortSignal.timeout(5000)});
    const data=await response.json();
    if(!data?.modes)throw new Error('invalid readiness response');
    readinessSnapshot=data;
    const ready=applyReadiness();
    syncRetryControls();
    return ready;
  }catch{readinessSnapshot=null;applyReadiness();syncRetryControls();return false;}
}
function syncRetryControls(){
  const retry=document.querySelector('#retry-generation');
  const switchMode=document.querySelector('#switch-quality-generation');
  const failed=readinessFor(lastAttemptQuality);
  if(retry&&!retry.classList.contains('hidden')){
    const ready=Boolean(readinessSnapshot?.local?.ready&&failed?.ready&&(lastAttemptQuality==='quick'?currentFallback().standardReady:!currentFallback().exhausted));
    retry.disabled=!ready;
    const waitText=failed?.reason==='timeout'
      ?`${qualityLabel(lastAttemptQuality)} timed out — checking readiness…`
      :failed?.reason==='unavailable'
      ?`${qualityLabel(lastAttemptQuality)} unavailable — checking…`
      :failed?.reason==='capacity'
      ?`${qualityLabel(lastAttemptQuality)} busy — checking…`
      :`${qualityLabel(lastAttemptQuality)} unavailable — checking…`;
    retry.textContent=ready?(lastAttemptQuality==='quick'?'Try Standard again':'Try High-Quality again'):waitText;
  }
  if(switchMode){
    const next=lastAttemptQuality==='quick'?'high':'quick',alternate=readinessFor(next);
    switchMode.hidden=next==='quick'&&!currentFallback().show;
    const ready=Boolean(readinessSnapshot?.local?.ready&&alternate?.ready&&(next==='quick'?currentFallback().standardReady:!currentFallback().exhausted));
    switchMode.disabled=!ready;
    switchMode.textContent=ready
      ?(next==='quick'?'Try Standard · lower detail and likeness':'Try High-Quality Preview')
      :(next==='quick'?'Standard Preview unavailable':'High Quality unavailable');
  }
}


let originalTurnstileToken="";
let originalTurnstileWidgetId=null;
let turnstileToken="";
let turnstileWidgetId=null;
let publicConfig={};
async function setupTurnstile(){
  try{
    const config=await fetch('/api/public-config').then(r=>r.json());publicConfig=config||{};
    if(!config?.turnstileSiteKey)return;
    const container=document.querySelector('#turnstile-container');container?.classList.remove('hidden');
    await new Promise((resolve,reject)=>{
      if(window.turnstile)return resolve();
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.defer=true;script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
    });
    originalTurnstileWidgetId=window.turnstile.render('#original-turnstile',{sitekey:config.turnstileSiteKey,theme:'dark',size:'flexible',callback:t=>{originalTurnstileToken=t;},'expired-callback':()=>{originalTurnstileToken=''}});
    turnstileWidgetId=window.turnstile.render('#turnstile-container',{sitekey:config.turnstileSiteKey,theme:'dark',size:'flexible',callback:t=>{turnstileToken=t;clearRecastError()},'expired-callback':()=>{turnstileToken=''}});
  }catch(error){console.warn('Turnstile setup skipped',error)}
}
function resetTurnstile(){
  if(window.turnstile&&turnstileWidgetId!==null){try{window.turnstile.reset(turnstileWidgetId)}catch{}}
  turnstileToken='';
}

function showRecastError(message){
  const el=document.querySelector('#recast-error');
  if(!el)return;
  el.textContent=message;
  el.classList.remove('hidden');
  el.classList.add('show');
}
function clearRecastError(){
  const el=document.querySelector('#recast-error');
  if(!el)return;
  el.textContent='';
  el.classList.remove('show');
  el.classList.add('hidden');
}
function clearPreviewCanvas(){
  const canvas=document.querySelector('#preview-canvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(ctx&&canvas.width&&canvas.height)ctx.clearRect(0,0,canvas.width,canvas.height);
}
function clearPreviewError(){
  document.querySelector('#preview-error')?.classList.add('hidden');
  const ref=document.querySelector('#preview-error-reference');
  if(ref){ref.textContent='';ref.classList.add('hidden')}
}
function showPreviewError(message,{diagnosticId='',retryable=true}={}){
  const box=document.querySelector('#preview-error');
  const copy=document.querySelector('#preview-error-message');
  const ref=document.querySelector('#preview-error-reference');
  const retry=document.querySelector('#retry-generation');
  const switchMode=document.querySelector('#switch-quality-generation');
  if(copy)copy.textContent=message;
  if(ref){
    if(diagnosticId){ref.textContent=`Support reference: ${diagnosticId}`;ref.classList.remove('hidden')}
    else{ref.textContent='';ref.classList.add('hidden')}
  }
  if(retry){retry.classList.toggle('hidden',retryable===false);retry.disabled=retryable===false;}
  if(switchMode)switchMode.classList.toggle('hidden',retryable===false);
  box?.classList.remove('hidden');
}


let hasSuccessfulPreview=false;
let generationInFlight=false;
let currentClientAttemptId="";
let lastSuccessfulPreviewMeta=null;
let lastSuccessfulImage=null;
let lastAttemptQuality='high';
const RECENT_VERSIONS_KEY='recast_recent_versions_v12';
let branchReference=null;
const previewCache=new Map();
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function readRecentVersions(){
  try{
    const rows=JSON.parse(localStorage.getItem(RECENT_VERSIONS_KEY)||'[]');
    return mergeHistory(rows,JSON.parse(localStorage.getItem('recast_last_request')||'null'));
  }catch{return[]}
}
function writeRecentVersions(rows){
  try{localStorage.setItem(RECENT_VERSIONS_KEY,JSON.stringify(rows.slice(0,4)))}catch{
    showRecastError('This browser cannot keep recent versions after you close it. Your current preview is still available.');
  }
}
function addRecentVersion(version){
  const rows=readRecentVersions().filter(x=>x?.requestId&&x.requestId!==version.requestId);
  rows.unshift(version);
  writeRecentVersions(rows.slice(0,4));
  renderRecentVersions().catch(console.warn);
}
function activeRequestFromVersion(version){
  window.__recastActiveRequest={requestId:version.requestId,accessToken:version.accessToken};
  try{localStorage.setItem('recast_last_request',JSON.stringify({
    requestId:version.requestId,
    accessToken:version.accessToken,
    style:version.styleName||version.style||'Recast',
    model:version.modelUsed||null,
    qualityMode:version.qualityMode||'high',
    createdAt:version.createdAt
  }))}catch{showRecastError('Browser storage is unavailable. Keep this tab open to choose products.')}
  document.dispatchEvent(new Event('recast-artwork-selected'));
}
async function fetchStoredPreview(version){
  if(previewCache.has(version.requestId))return previewCache.get(version.requestId);
  const pending=(async()=>{
  const url=new URL(`/api/request/${encodeURIComponent(version.requestId)}/preview`,location.origin);
  url.searchParams.set('token',version.accessToken);
  const response=await fetch(url);
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok||data.watermarked!==true||!data.image)throw new Error(data.error||'This saved version is unavailable.');
  return data.image;
  })();
  previewCache.set(version.requestId,pending);
  try{return await pending}catch(error){previewCache.delete(version.requestId);throw error}
}
async function activateRecentVersion(version,{scroll=true}={}){
  const image=await fetchStoredPreview(version);
  await renderWatermark(image);
  lastSuccessfulImage=image;
  const section=document.querySelector('#preview-section');
  const previewInfo=document.querySelector('.preview-info');
  const title=`${version.styleName||'Recast'} preview ready.`;
  const requestText=`Artwork ID: ${version.requestId} · selected from recent versions`;
  document.querySelector('#preview-title').textContent=title;
  document.querySelector('#request-id').textContent=requestText;
  section?.classList.remove('hidden');
  previewInfo?.classList.remove('hidden');
  clearPreviewError();
  document.querySelector('#preview-emergency-error')?.remove();
  hasSuccessfulPreview=true;
  lastSuccessfulPreviewMeta={
    title,requestText,requestId:version.requestId,accessToken:version.accessToken,
    qualityMode:version.qualityMode||'high'
  };
  activeRequestFromVersion(version);
  const orderLink=document.querySelector('#order-status-link');
  if(orderLink){
    orderLink.href=`/order.html?requestId=${encodeURIComponent(version.requestId)}&token=${encodeURIComponent(version.accessToken)}`;
    orderLink.classList.remove('hidden');
  }
  renderRecentVersions().catch(console.warn);
  if(scroll)section?.scrollIntoView({behavior:'smooth',block:'start'});
}
function setBranchReference(version){
  branchReference={
    requestId:version.requestId,
    accessToken:version.accessToken,
    styleId:version.styleId||'custom',
    styleName:version.styleName||'Recast',
    subjectType:version.subjectType||'person',
    customWorld:version.customWorld||'',
    notes:version.notes||'',
    qualityMode:version.qualityMode||'high'
  };
  wizard.go(0);
  const subject=document.querySelector('#subject');
  if(subject&&[...subject.options].some(o=>o.value===branchReference.subjectType))subject.value=branchReference.subjectType;
  if([...[styleSelect.options]].some(o=>o.value===branchReference.styleId))styleSelect.value=branchReference.styleId;
  document.querySelector('#custom-world').value=branchReference.customWorld;
  updateWorldFields();
  document.querySelector('#notes').value=branchReference.notes;
  subject?.dispatchEvent(new Event('change'));
  const radio=document.querySelector(`input[name="qualityMode"][value="high"]`);
  if(radio){radio.checked=true;updateQualityUI()}
  const note=document.querySelector('#branch-note');
  if(note){
    note.innerHTML=`<strong>Refining ${branchReference.styleName}</strong><span>We’ll use this successful Recast as a visual reference. Keep or re-add the original photo for the strongest likeness.</span><button type="button" id="clear-branch-reference">Clear</button>`;
    note.classList.remove('hidden');
    note.querySelector('#clear-branch-reference')?.addEventListener('click',clearBranchReference,{once:true});
  }
  document.querySelector('#start')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function clearBranchReference(){
  branchReference=null;
  const note=document.querySelector('#branch-note');
  if(note){note.textContent='';note.classList.add('hidden')}
}
async function renderRecentVersions(){
  const shell=document.querySelector('#recent-versions-shell');
  const grid=document.querySelector('#recent-versions-grid');
  if(!shell||!grid)return;
  const rows=readRecentVersions();
  shell.classList.toggle('hidden',rows.length===0);
  if(!rows.length){grid.innerHTML='';return}
  let active=null;
  try{active=JSON.parse(localStorage.getItem('recast_last_request')||'null')?.requestId}catch{}
  grid.innerHTML=rows.map((v,i)=>`
    <article class="recent-version-card ${v.requestId===active?'active':''}" data-version-index="${i}">
      <div class="recent-version-image"><div class="recent-version-loading">Loading…</div><img alt="${escapeHtml(v.styleName||'Saved Recast')}"></div>
      <div class="recent-version-copy">
        <span>VERSION ${rows.length-i}</span>
        <strong>${escapeHtml(v.styleName||'Custom Recast')}</strong>
        <small>${v.qualityMode==='original'?'Original photo · no AI':v.qualityMode==='quick'?'Standard':'High-Quality'} · ${new Date(v.createdAt||Date.now()).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small>
      </div>
      <div class="recent-version-actions">
        <button type="button" data-history-action="use">Use this version</button>
        <button type="button" data-history-action="refine">Refine this version</button>
      </div>
    </article>`).join('');

  rows.forEach(async(v,i)=>{
    const card=grid.querySelector(`[data-version-index="${i}"]`);
    try{
      const image=await fetchStoredPreview(v);
      const img=card?.querySelector('img');
      if(img&&card?.isConnected){img.onload=()=>card?.querySelector('.recent-version-loading')?.remove();img.src=image}
    }catch{
      const loading=card?.querySelector('.recent-version-loading');
      if(loading)loading.textContent='Unavailable';
    }
  });
}


function makeClientAttemptId(){
  return `WEB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}
async function logClientGenerationIssue(kind,message,extra={}){
  try{
    const response=await fetch('/api/client-diagnostic',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        kind,
        message:String(message||'').slice(0,500),
        clientAttemptId:currentClientAttemptId||null,
        page:location.pathname,
        userAgent:navigator.userAgent.slice(0,300),
        ...extra
      })
    });
    return await response.json().catch(()=>({}));
  }catch{return{}}
}
function forceVisibleFailure(message,diagnosticId=''){
  const section=document.querySelector('#preview-section');
  const frame=document.querySelector('.preview-frame');
  section?.classList.remove('hidden');
  try{
    showPreviewError(message,{diagnosticId,retryable:true});
  }catch(error){
    // Last-resort DOM fallback. Even if styling/JS around the normal card breaks,
    // the customer will still see a usable failure state instead of a blank section.
    if(frame){
      let fallback=document.querySelector('#preview-emergency-error');
      if(!fallback){
        fallback=document.createElement('div');
        fallback.id='preview-emergency-error';
        fallback.className='preview-emergency-error';
        frame.appendChild(fallback);
      }
      fallback.innerHTML=`<strong>We couldn’t finish this preview.</strong><p>${String(message||'Please try again.').replaceAll('<','&lt;').replaceAll('>','&gt;')}</p><button type="button" id="preview-emergency-retry">Try again</button>`;
      fallback.querySelector('#preview-emergency-retry')?.addEventListener('click',()=>form.requestSubmit(),{once:true});
    }else{
      alert(message||'We could not finish this preview. Please try again.');
    }
  }
}
async function restoreLastPreview(){
  clearPreviewError();
  document.querySelector('#preview-emergency-error')?.remove();
  if(!hasSuccessfulPreview)return;
  if(lastSuccessfulImage)await renderWatermark(lastSuccessfulImage);
  const section=document.querySelector('#preview-section');
  const previewInfo=document.querySelector('.preview-info');
  section?.classList.remove('hidden');
  previewInfo?.classList.remove('hidden');
  if(lastSuccessfulPreviewMeta){
    document.querySelector('#preview-title').textContent=lastSuccessfulPreviewMeta.title||'Your last Recast is still here.';
    document.querySelector('#request-id').textContent=lastSuccessfulPreviewMeta.requestText||'';
  }
}

const form=document.querySelector('#recast-form');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!wizard.validate())return;
  if(generationInFlight)return;
  const files=[...photos.files].slice(0,4);
  clearRecastError();
  if(!files.length&&!branchReference){showRecastError('Add at least one photo first, or choose “Refine this version” from a recent successful Recast.');document.querySelector('#start').scrollIntoView({behavior:'smooth'});return;}
  if(branchReference&&files.length>3){showRecastError('Use up to 3 original photos when refining a saved version.');return;}
  if(styleSelect.value==='custom'&&!document.querySelector('#custom-world').value.trim()){
    showRecastError('Describe your custom world first, or choose one of the preset Worlds.');
    document.querySelector('#custom-world').focus();
    return;
  }
  generationInFlight=true;
  const available=await refreshRenderAvailability();
  generationInFlight=false;
  if(!available){showRecastError('Image creation is temporarily unavailable. Your settings and last successful preview are still here. Please check again shortly.');return;}
  const button=document.querySelector('#generate-button'),loading=document.querySelector('#loading'),section=document.querySelector('#preview-section');
  const previewInfo=document.querySelector('.preview-info');
  currentClientAttemptId=makeClientAttemptId();
  generationInFlight=true;
  clearPreviewError();
  document.querySelector('#preview-emergency-error')?.remove();

  // Critical v1.0.2 behavior:
  // never erase a successful Recast until the replacement has also succeeded.
  if(!hasSuccessfulPreview){
    clearPreviewCanvas();
    if(previewInfo)previewInfo.classList.add('hidden');
    document.querySelector('#request-id').textContent='';
  }
  document.querySelector('#preview-title').textContent=hasSuccessfulPreview?'Creating another version…':'Creating your Recast…';
  button.disabled=true;button.textContent='Preparing photos…';
  section.classList.remove('hidden');section.scrollIntoView({behavior:'smooth'});loading.classList.remove('hidden');

  try{
    const credits=await refreshCredits(true);
    if(credits.enabled&&(selectedQuality()==='quick'?(credits.remaining>0?0:credits.standardRemaining):credits.remaining)<=0)throw Object.assign(new Error('Your selected preview allowance is used. Check the reset time and available options below.'),{publicMessage:'Your selected preview allowance is used. Check the reset time and available options below.'});
    const fd=new FormData();
    fd.append('style',styleSelect.value);
    const customWorld=styleSelect.value==='custom'?document.querySelector('#custom-world').value.trim():'';
    const submittedSubject=inferSubject(document.querySelector('#subject').value,`${customWorld} ${document.querySelector('#notes').value}`);
    fd.append('subject',submittedSubject);
    fd.append('customWorld',customWorld);
    fd.append('notes',document.querySelector('#notes').value);
    fd.append('referenceLabels',JSON.stringify(wizard.references()));
    if(document.querySelector('#subject').value==='family')fd.append('subjectCount',document.querySelector('#family-count').value);
    if(branchReference){
      fd.append('branchRequestId',branchReference.requestId);
      fd.append('branchAccessToken',branchReference.accessToken);
    }
    fd.append('source',params.get('source')||'site');
    fd.append('sourceTweet',params.get('tweet')||'');
    const qualityMode=selectedQuality();
    lastAttemptQuality=qualityMode;
    fd.append('qualityMode',qualityMode);
    fd.append('clientAttemptId',currentClientAttemptId);
    if(turnstileToken)fd.append('turnstileToken',turnstileToken);

    for(let i=0;i<files.length;i++){
      button.textContent=`Preparing photo ${i+1}…`;
      fd.append(`image_${i}`,await resizeFile(files[i]));
    }
    if(branchReference){
      button.textContent='Preparing saved version…';
      const image=await fetchStoredPreview(branchReference);
      const blob=await fetch(image).then(response=>response.blob());
      fd.append('branchPreview',await resizeFile(new File([blob],'previous-recast.jpg',{type:blob.type||'image/jpeg'})));
    }

    button.textContent=qualityMode==='quick'?'Creating Standard Preview…':'Creating High-Quality Preview…';
    startGenerationUI(qualityMode);
    // Do not locally abort an in-flight image generation request. A browser timer
    // cannot cancel Workers AI and can create an orphaned paid render whose result
    // is discarded. Let the provider/Worker return the authoritative outcome.
    let res,data;
    res=await fetch('/api/transform-v2',{method:'POST',headers:{'x-recast-request':'1'},body:fd});
    refreshCredits().catch(()=>{});
    data=await res.json().catch(()=>({}));

    if(res.status===202&&data.reviewRequired) throw Object.assign(new Error(friendlyGenerationError(data)),{publicMessage:friendlyGenerationError(data),diagnosticId:data.diagnosticId||'',retryable:false});
    if(!res.ok) throw Object.assign(new Error(friendlyGenerationError(data)),{publicMessage:friendlyGenerationError(data),diagnosticId:data.diagnosticId||'',retryable:data.reason==='moderation'?false:data.retryable!==false});
    if(data.watermarked!==true||typeof data.image!=='string'||!data.image.startsWith('data:image/')) throw Object.assign(new Error('invalid preview'),{publicMessage:'The image engine returned an incomplete preview. Please try again.',retryable:true});
    if(!data.persisted)throw Object.assign(new Error('storage unavailable'),{
      publicMessage:'The artwork was generated, but private storage did not save it. Your last saved version is still available. Please try again in a moment.',
      diagnosticId:data.clientAttemptId||'',retryable:true
    });

    addRecentVersion({requestId:data.requestId,accessToken:data.accessToken,styleName:data.style,styleId:styleSelect.value,subjectType:submittedSubject,customWorld,notes:document.querySelector('#notes').value,qualityMode:data.qualityMode||lastAttemptQuality,createdAt:new Date().toISOString()});

    try{await renderWatermark(data.image)}catch(error){throw Object.assign(new Error('preview display failed'),{publicMessage:'Your image was created, but the preview could not be displayed correctly. Please try once more.'})}

    const successTitle=`${data.style} preview ready.`;
    const successRequestText=`Artwork ID: ${data.requestId}${data.persisted?' · saved privately':' · preview generated; storage retry needed'}`;
    document.querySelector('#preview-title').textContent=successTitle;
    document.querySelector('#request-id').textContent=successRequestText;
    if(previewInfo)previewInfo.classList.remove('hidden');
    clearPreviewError();
    document.querySelector('#preview-emergency-error')?.remove();
    hasSuccessfulPreview=true;
    lastSuccessfulImage=data.image;
    previewCache.set(data.requestId,Promise.resolve(data.image));
    const successVersion={
      requestId:data.requestId,
      accessToken:data.accessToken,
      styleName:data.style,
      styleId:styleSelect.value,
      subjectType:submittedSubject,
      customWorld,
      notes:document.querySelector('#notes').value,
      qualityMode:data.qualityMode||lastAttemptQuality,
      modelUsed:data.modelUsed||null,
      createdAt:new Date().toISOString()
    };
    lastSuccessfulPreviewMeta={title:successTitle,requestText:successRequestText,requestId:data.requestId,accessToken:data.accessToken,qualityMode:successVersion.qualityMode};
    activeRequestFromVersion(successVersion);
    addRecentVersion(successVersion);
    clearBranchReference();
    const orderLink=document.querySelector('#order-status-link');
    if(orderLink){orderLink.href=`/order.html?requestId=${encodeURIComponent(data.requestId)}&token=${encodeURIComponent(data.accessToken)}`;orderLink.classList.remove('hidden')}
    stopGenerationUI(true);
  }catch(err){
    stopGenerationUI(false);
    const publicMessage=err.publicMessage||friendlyGenerationError(null,err);
    let diagnosticId=err.diagnosticId||'';
    const logged=await logClientGenerationIssue('generation-catch',err?.message||publicMessage,{
      serverDiagnosticId:diagnosticId||null,
      hadPreviousPreview:hasSuccessfulPreview
    });
    if(!diagnosticId)diagnosticId=logged?.diagnosticId||'';

    document.querySelector('#preview-title').textContent=hasSuccessfulPreview
      ? `That ${qualityLabel(lastAttemptQuality)} didn’t finish.`
      : `${qualityLabel(lastAttemptQuality)} didn’t finish this time.`;
    const retryButton=document.querySelector('#retry-generation');
    const switchButton=document.querySelector('#switch-quality-generation');
    if(retryButton)retryButton.textContent=lastAttemptQuality==='quick'?'Try Standard again':'Try High-Quality again';
    if(switchButton)switchButton.textContent=lastAttemptQuality==='quick'?'Try High-Quality Preview':'Try Standard · lower detail and likeness';
    await refreshRenderAvailability();
    if(!hasSuccessfulPreview)document.querySelector('#request-id').textContent='';

    try{
      showPreviewError(publicMessage,{diagnosticId,retryable:err.retryable!==false});
      const keep=document.querySelector('#keep-last-preview');
      if(keep)keep.classList.toggle('hidden',!hasSuccessfulPreview);
    }catch{
      forceVisibleFailure(publicMessage,diagnosticId);
    }
    showRecastError(publicMessage);

    // If this was a second attempt, the old successful canvas and product choices remain
    // underneath the error card and can be restored with one tap.
    if(previewInfo)previewInfo.classList.toggle('hidden',!hasSuccessfulPreview);
    section.classList.remove('hidden');
    section.scrollIntoView({behavior:'smooth'});
  }finally{
    loading.classList.add('hidden');
    button.disabled=false;
    generationInFlight=false;
    await refreshCredits().catch(()=>{});
    updateQualityUI();
    await refreshRenderAvailability();
    resetTurnstile();
  }
});

document.querySelector('#retry-generation')?.addEventListener('click',async event=>{
  const button=event.currentTarget;if(button.disabled)return;
  const available=await refreshRenderAvailability();
  if(!available||!readinessFor(lastAttemptQuality)?.ready){syncRetryControls();return;}
  clearPreviewError();form.requestSubmit();
});
document.querySelector('#switch-quality-generation')?.addEventListener('click',async event=>{
  const button=event.currentTarget;if(button.disabled)return;
  const next=lastAttemptQuality==='quick'?'high':'quick';
  await refreshRenderAvailability();
  if(!readinessFor(next)?.ready||(next==='quick'&&!currentFallback().standardReady)){syncRetryControls();return;}
  const radio=document.querySelector(`input[name="qualityMode"][value="${next}"]`);
  if(radio){radio.checked=true;updateQualityUI();applyReadiness();}
  clearPreviewError();form.requestSubmit();
});
document.querySelector('#keep-last-preview')?.addEventListener('click',()=>{
  restoreLastPreview().catch(()=>showRecastError('That saved preview could not be displayed. Select it from recent versions.'));
});
document.querySelector('#adjust-generation')?.addEventListener('click',()=>{
  document.querySelector('#start')?.scrollIntoView({behavior:'smooth'});
});



document.querySelector('#recent-versions-grid')?.addEventListener('click',async event=>{
  const button=event.target.closest('[data-history-action]');
  if(!button)return;
  const card=button.closest('[data-version-index]');
  const rows=readRecentVersions();
  const version=rows[Number(card?.dataset.versionIndex)];
  if(!version)return;
  button.disabled=true;
  try{
    if(button.dataset.historyAction==='use')await activateRecentVersion(version);
    if(button.dataset.historyAction==='refine')setBranchReference(version);
  }catch(error){
    showRecastError(error?.message||'That saved version could not be loaded.');
  }finally{button.disabled=false}
});

async function restoreRecentVersionOnLoad(){
  const rows=readRecentVersions();
  if(!rows.length){renderRecentVersions();return}
  renderRecentVersions().catch(console.warn);
  // Only restore the most recent successful art if no preview is already visible.
  let existing=null;
  try{existing=JSON.parse(localStorage.getItem('recast_last_request')||'null')}catch{}
  const candidate=rows.find(v=>v.requestId===existing?.requestId)||rows[0];
  try{await activateRecentVersion(candidate,{scroll:false})}catch{renderRecentVersions()}
}
function openApprovalFromQuery(){
  const requestId=String(params.get('approvalRequest')||'');
  if(!requestId)return false;
  const version=readRecentVersions().find(v=>v?.requestId===requestId);
  if(version?.accessToken){
    const target=new URL('/order.html',location.origin);
    target.searchParams.set('requestId',version.requestId);
    target.searchParams.set('token',version.accessToken);
    history.replaceState(null,'',location.pathname+'#preview-section');
    location.replace(target.href);
    return true;
  }
  const status=document.querySelector('#recover-status');
  if(status){
    status.textContent='To approve this order, open this page in the browser where you created this Recast, then use Track this Recast / downloads.';
  }
  document.querySelector('#preview-section')?.classList.remove('hidden');
  return false;
}

window.addEventListener('error',async event=>{
  if(!generationInFlight)return;
  await logClientGenerationIssue('window-error',event?.message||'Unexpected page error',{source:event?.filename||null,line:event?.lineno||null});
});
window.addEventListener('unhandledrejection',async event=>{
  if(!generationInFlight)return;
  const reason=event?.reason?.message||String(event?.reason||'Unhandled generation promise');
  await logClientGenerationIssue('unhandled-rejection',reason);
});

async function status(){
  try{
    const h=await fetch('/api/health').then(r=>r.json());
    document.querySelector('#ai-dot')?.classList.add(h.aiBinding?'ready':'error');
    if(document.querySelector('#ai-status')) document.querySelector('#ai-status').textContent=h.aiBinding?'Connected':'Missing binding';
    document.querySelector('#storage-dot')?.classList.add(h.privateArtworkStorage?'ready':'error');
    if(document.querySelector('#storage-status')) document.querySelector('#storage-status').textContent=h.privateArtworkStorage?'Private storage ready':'R2 binding needed';
  }catch{}
  try{
    const m=await fetch('/api/model-status').then(r=>r.json());
    if(m.ok){
      window.__recastModels=m;
      updateQualityUI();
    }
  }catch{}
  if(params.get('debug')==='1'){
    try{
      const p=await fetch('/api/printful-status').then(async r=>({ok:r.ok,data:await r.json()}));
      document.querySelector('#pf-dot')?.classList.add(p.ok&&p.data.connected?'ready':'error');
      if(document.querySelector('#pf-status')) document.querySelector('#pf-status').textContent=p.ok&&p.data.connected?`Connected · ${p.data.stores?.[0]?.name||'store ready'}`:'Needs token check';
    }catch{}
  }
}
updateQualityUI();
if(new URLSearchParams(location.hash.slice(1)).has('recast')){restorePrivateLink(location.href).catch(e=>{document.querySelector('#recover-status').textContent=e.message;});}else if(!openApprovalFromQuery()) restoreRecentVersionOnLoad();
status();
setupTurnstile();
document.querySelector('.preview-info a[href="#shop"]')?.addEventListener('click',async event=>{
  let live=publicConfig.liveAppUrl;
  if(!live){try{publicConfig=await fetch('/api/public-config').then(r=>r.json());live=publicConfig.liveAppUrl;}catch{}}
  const active=window.__recastActiveRequest;
  if(!live||!active?.requestId||!active?.accessToken||new URL(live).origin===location.origin)return;
  event.preventDefault();
  const target=new URL(privateRecastLink(live,active));
  const params=new URLSearchParams(target.hash.slice(1));params.set('shop','1');target.hash=params.toString();
  location.href=target.href;
});
refreshRenderAvailability();
setInterval(()=>{if(!generationInFlight)refreshRenderAvailability()},30000);

// Sharing never includes the private access token, source photo or order link.
const exportStatus=document.querySelector('#preview-export-status');
const nativeSave=document.querySelector('#save-native-preview');
if(window.webkit?.messageHandlers?.recastPreview)nativeSave.hidden=false;
async function exportPreview(native=false){
  const button=document.querySelector(native?'#save-native-preview':'#share-preview');
  button.disabled=true;exportStatus.textContent='Preparing your watermarked preview…';
  try{
    const result=await protectedPreviewFile(lastSuccessfulPreviewMeta);
    if(native){
      // Native replies after it has actually persisted the file.
      await window.webkit.messageHandlers.recastPreview.postMessage({id:result.id,image:result.image});
      exportStatus.textContent='Saved to My Recasts on this iPhone.';
    }else if(navigator.canShare?.({files:[result.file]})){
      await navigator.share({files:[result.file],title:'My Recast',text:'Made with @RecastMeAi'});
      exportStatus.textContent='Your watermarked preview is ready to share.';
    }else{
      const url=URL.createObjectURL(result.file),link=document.createElement('a');
      link.href=url;link.download=result.file.name;link.click();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      exportStatus.textContent='Your watermarked preview download has started.';
    }
  }catch(error){exportStatus.textContent=error.name==='AbortError'?'Sharing canceled. Your preview is still here.':error.message||'Could not save this preview.'}
  finally{button.disabled=false}
}
document.querySelector('#share-preview')?.addEventListener('click',()=>exportPreview());
nativeSave?.addEventListener('click',()=>exportPreview(true));

async function restorePrivateLink(value){
  const incoming=new URL(value,location.origin),incomingParams=new URLSearchParams(incoming.hash.slice(1)),goShop=incomingParams.get('shop')==='1';
  const version=readRecastLink(value,location.origin);
  const url=new URL(`/api/request/${encodeURIComponent(version.requestId)}`,location.origin);url.searchParams.set('token',version.accessToken);
  const response=await fetch(url),data=await response.json();
  if(!response.ok||!data.ok)throw new Error('This private link is unavailable or no longer valid.');
  Object.assign(version,data.request); // Safe server metadata, token stays browser-private.
  await fetchStoredPreview(version);
  addRecentVersion(version);await activateRecentVersion(version);
  if(new URLSearchParams(location.hash.slice(1)).has('recast'))history.replaceState(null,'',location.pathname+location.search+(goShop?'#shop':'#preview-section'));
  if(goShop)document.querySelector('#shop')?.scrollIntoView({block:'start'});
  document.querySelector('#recover-status').textContent='Your saved Recast is restored. No new render was used.';
}
document.querySelector('#recover-recast').addEventListener('click',()=>restorePrivateLink(document.querySelector('#recover-recast-link').value).catch(e=>{document.querySelector('#recover-status').textContent=e.message;}));
document.querySelector('#copy-recast-link').addEventListener('click',async()=>{
  const v=window.__recastActiveRequest;if(!v)return;
  const link=privateRecastLink(location.origin,v),field=document.querySelector('#private-recast-link');field.value=link;field.hidden=false;
  let copied=false;try{await navigator.clipboard.writeText(link);copied=true;}catch{}
  document.querySelector('#recast-link-status').textContent=(copied?'Private link copied. ':'Copy the private link below. ')+'Open it in Safari or save it somewhere private. Anyone with this link can access this Recast.';
});
document.querySelector('#original-photo-form').addEventListener('submit',async event=>{
  event.preventDefault();if(generationInFlight)return;
  const form=event.currentTarget,button=form.querySelector('button'),status=document.querySelector('#original-status'),file=document.querySelector('#original-photo').files[0];
  if(!file||!document.querySelector('#original-consent').checked)return;
  if(file.size>12000000){status.textContent='Choose a photo under 12 MB.';return;}
  generationInFlight=true;button.disabled=true;status.textContent='Preparing your photo without AI…';
  try{
    const fd=new FormData();fd.set('photo',file);fd.set('consent','yes');fd.set('turnstileToken',originalTurnstileToken);
    const response=await fetch('/api/original-photo',{method:'POST',headers:{'x-recast-request':'1'},body:fd}),data=await response.json();
    if(!response.ok||!data.ok||!data.persisted||data.watermarked!==true)throw new Error(data.userMessage||'Your photo could not be saved. Please try again.');
    const version={requestId:data.requestId,accessToken:data.accessToken,styleName:'Original photo',styleId:'original',subjectType:'photo',qualityMode:'original',createdAt:data.createdAt};
    previewCache.set(data.requestId,Promise.resolve(data.image));addRecentVersion(version);await activateRecentVersion(version);
    status.textContent='Photo saved. Choose a product below—no AI render was used.';
  }catch(e){status.textContent=e.message;}finally{generationInFlight=false;button.disabled=false;originalTurnstileToken='';if(window.turnstile&&originalTurnstileWidgetId!==null)window.turnstile.reset(originalTurnstileWidgetId);}
});

let creditRefreshAt=0;
function refreshVisibleBalance(){
  if(document.visibilityState==='hidden'||generationInFlight||Date.now()-creditRefreshAt<15000)return;
  creditRefreshAt=Date.now();refreshCredits().then(()=>refreshRenderAvailability()).catch(()=>{});
}
window.addEventListener('focus',refreshVisibleBalance);
document.addEventListener('visibilitychange',refreshVisibleBalance);
setInterval(refreshVisibleBalance,60000);
