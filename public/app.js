const STYLES = [
  ["game","Game World","Cinematic city energy, dramatic light, bold illustrated realism.","/assets/style-game-v08.webp"],
  ["halloween","Halloween","Stylish costumes, moonlight, fog, pumpkins — playful, not grim.","/assets/style-halloween-v08.webp"],
  ["retro","Retro Time Machine","A vivid trip through analog color, film grain and 1980s atmosphere.","/assets/style-retro-v08.webp"],
  ["fantasy","Fantasy Warrior","Epic armor, ancient landscapes and cinematic fantasy light.","/assets/style-fantasy-v08.webp"],
  ["royal","Royal","Regal portraiture, palace textures, rich fabric and museum drama.","/assets/style-royal-v08.webp"],
  ["future","Future City","Neon reflections, rain haze and an original high-tech world.","/assets/style-future-v08.webp"],
  ["comic","Comic Hero","Original nonviolent comic-book energy, ink, halftone and motion.","/assets/style-comic-v08.webp"],
  ["space","Space Explorer","Original sci-fi portraiture, planets, spacecraft and epic scale.","/assets/style-space-v08.webp"]
];

const PRODUCT_CATALOG = [
  {name:"Poster",price:"from $29.99",asset:"poster",image:"/assets/product-poster-v10.webp",badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured"},
  {name:"Hoodie",price:"from $59.99",asset:"hoodie",image:"/assets/product-hoodie-v10.webp",badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured"},
  {name:"Framed Poster",price:"from $44.99",asset:"framed-poster",image:"/assets/product-desk-frame-v13.webp",badge:"DESK + WALL",pitch:"8×10 desk size or larger framed wall art — ready to display and gift.",tier:"featured"},
  {name:"Canvas",price:"from $69.99",asset:"canvas",image:"/assets/product-canvas-v10.webp",badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured"},

  {name:"T-Shirt",price:"from $34.99",asset:"tshirt",image:"/assets/product-tshirt-v10.webp",badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary"},
  {name:"Blanket",price:"from $74.99",asset:"blanket",image:"/assets/product-blanket-v10.webp",badge:"COZY PICK",pitch:"Big, soft, personal — especially good for pets and gifts.",tier:"secondary"},
  {name:"Mug",price:"from $24.99",asset:"mug",image:"/assets/product-mug-v10.webp",badge:"GIFTABLE",pitch:"A personalized gift that gets used every day.",tier:"secondary"},
  {name:"Tumbler",price:"$49.99",asset:"tumbler",image:"/assets/product-tumbler-v10.webp",badge:"TAKE IT WITH YOU",pitch:"Your Recast on a 20 oz everyday tumbler.",tier:"secondary"},
  {name:"Magnet 3-Pack",price:"$24.99",asset:"magnet",image:"/assets/product-magnet-v09.jpg",badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary"},
  {name:"Coaster 4-Pack",price:"$39.99",asset:"coaster",image:"/assets/product-coaster-v09.jpg",badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary"},

  {name:"HD Digital Recast",price:"$4.99",asset:"digital",image:"/assets/product-digital-v09.jpg",badge:"DIGITAL ONLY",pitch:"Just want the clean artwork? Keep the high-resolution file without ordering merch.",tier:"digital"},
  {name:"Recast Pack",price:"$9.99",asset:"pack",image:"/assets/product-pack-v09.jpg",badge:"DIGITAL PACK",pitch:"The complete digital set with high-resolution art plus useful crops and formats.",tier:"digital"}
];

const styleGrid = document.querySelector('#style-grid');
const styleSelect = document.querySelector('#style');

styleGrid.innerHTML = STYLES.map(([id,name,copy,image],i)=>`
  <article class="style-card" data-style="${id}" tabindex="0" role="button" aria-label="Choose ${name}">
    <div class="style-art"><img src="${image}" alt="${name} visual direction"></div>
    <span class="style-pick">CHOOSE</span>
    <div class="style-copy">
      <small>STYLE ${String(i+1).padStart(2,'0')}</small>
      <h3>${name}</h3>
      <p>${copy}</p>
    </div>
  </article>`).join('');

styleSelect.innerHTML = STYLES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('')
  + '<option value="custom">Custom World — describe your own</option>';

function chooseStyle(card){
  styleSelect.value=card.dataset.style;
  document.querySelectorAll('.style-card').forEach(c=>c.classList.toggle('selected',c===card));
  document.querySelector('#start').scrollIntoView({behavior:'smooth'});
}
document.querySelectorAll('.style-card').forEach(card=>{
  card.addEventListener('click',()=>chooseStyle(card));
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseStyle(card)}})
});

function merchCard(item,{featured=false,preview=false}={}){
  const classes=['product',featured?'featured-product':'secondary-product'].filter(Boolean).join(' ');
  return `<div class="${classes}">
    <div class="product-art"><img src="${item.image || `/assets/product-${item.asset}-v09.jpg`}" alt="${item.name}"></div>
    <div class="product-body">
      <span class="product-badge">${item.badge}</span>
      <strong>${item.name}</strong>
      <p class="product-pitch">${item.pitch}</p>
      <span class="price">${item.price}</span>
      ${preview
        ? '<button disabled>Create a Recast to order</button>'
        : '<a class="shop-card-cta" href="#start">Create yours <span>→</span></a>'}
    </div>
  </div>`;
}

function renderStaticMerch(){
  const featured=PRODUCT_CATALOG.filter(x=>x.tier==='featured');
  const secondary=PRODUCT_CATALOG.filter(x=>x.tier==='secondary');
  const digital=PRODUCT_CATALOG.filter(x=>x.tier==='digital');

  const catalog=document.querySelector('#catalog-preview');
  if(catalog){
    catalog.classList.add('merch-catalog-shell');
    catalog.innerHTML=`
      <div class="merch-featured-grid">
        ${featured.map(x=>merchCard(x,{featured:true})).join('')}
      </div>
      <div class="merch-subhead">
        <div><span>MORE WAYS TO MAKE IT YOURS</span><h3>Wear it. Gift it. Live with it.</h3></div>
        <p>Made to order — no mass-produced inventory and no generic artwork swap.</p>
      </div>
      <div class="merch-secondary-grid">
        ${secondary.map(x=>merchCard(x)).join('')}
      </div>
      <div class="merch-digital-last">
        <div class="merch-digital-copy">
          <span>LAST OPTION</span>
          <strong>Just want the artwork?</strong>
          <p>The physical products come first. If you only want the file, the digital choices stay here at the end.</p>
        </div>
        <div class="merch-digital-grid">
          ${digital.map(x=>merchCard(x)).join('')}
        </div>
      </div>`;
  }

  const preview=document.querySelector('#product-grid');
  if(preview){
    preview.innerHTML=[...featured,...secondary]
      .map(x=>merchCard(x,{featured:x.tier==='featured',preview:true})).join('');
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

const photos = document.querySelector('#photos');
photos.addEventListener('change',()=>{
  const selected=[...photos.files].slice(0,4);
  document.querySelector('#file-summary').textContent=selected.length?`${selected.length} photo${selected.length===1?'':'s'} selected`:'No photos selected';
});

function updateSubjectQuickPicks(){
  const value=document.querySelector('#subject')?.value;
  document.querySelectorAll('[data-subject-pick]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.subjectPick===value));
}
document.querySelector('#subject')?.addEventListener('change',updateSubjectQuickPicks);
document.querySelectorAll('[data-subject-pick]').forEach(button=>{
  button.addEventListener('click',()=>{
    const select=document.querySelector('#subject');
    if(select)select.value=button.dataset.subjectPick;
    updateSubjectQuickPicks();

document.querySelectorAll('[data-idea-subject]').forEach(card=>{
  card.addEventListener('click',()=>{
    const subject=document.querySelector('#subject');
    if(subject)subject.value=card.dataset.ideaSubject||'person';
    updateSubjectQuickPicks();
    const note=document.querySelector('#notes');
    if(note)note.value=card.dataset.ideaNote||'';
    document.querySelector('#start')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
document.querySelector('[data-desk-frame-start]')?.addEventListener('click',()=>{
  const note=document.querySelector('#notes');
  if(note&&!note.value)note.value='Create a polished portrait that will look especially good in a small 8×10 black frame.';
  document.querySelector('#start')?.scrollIntoView({behavior:'smooth',block:'start'});
});

  });
});
document.querySelector('#pet-only-quickstart')?.addEventListener('click',()=>{
  const subject=document.querySelector('#subject');
  if(subject)subject.value='pet';
  updateSubjectQuickPicks();
  if(!document.querySelector('#notes').value){
    document.querySelector('#notes').value='Keep my pet’s exact face, coat markings, eye color, proportions, and personality recognizable.';
  }
  document.querySelector('#start')?.scrollIntoView({behavior:'smooth',block:'start'});
});
styleSelect.addEventListener('change',()=>{
  const custom=document.querySelector('#custom-world');
  if(styleSelect.value==='custom'&&custom&&!custom.value)custom.focus({preventScroll:true});
});
updateSubjectQuickPicks();


async function resizeFile(file,max=500){
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(bitmap,0,0,w,h);
  bitmap.close();
  return new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'})):reject(new Error('Could not prepare image.')),
    'image/jpeg',.94
  ));
}

async function renderWatermark(dataUrl){
  const img=new Image();img.src=dataUrl;await img.decode();
  const canvas=document.querySelector('#preview-canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font=`900 ${Math.max(16,canvas.width/24)}px system-ui`;
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/5);
  const gap=canvas.width/2.1;
  for(let y=-canvas.height*1.4;y<canvas.height*1.4;y+=gap*.65){
    for(let x=-canvas.width*1.5;x<canvas.width*1.5;x+=gap){ctx.fillText('RECAST ME • PREVIEW',x,y)}
  }
  ctx.restore();
  ctx.fillStyle='rgba(7,7,11,.75)';ctx.fillRect(0,canvas.height-46,canvas.width,46);
  ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(13,canvas.width/34)}px system-ui`;ctx.textAlign='center';
  ctx.fillText('RECAST ME • PREVIEW',canvas.width/2,canvas.height-18);
}

function inferSubject(subject,notes){
  const text=String(notes||'').toLowerCase();
  if(subject==='person' && /\b(dog|puppy|pup|cat|kitten|pet)\b/.test(text)) return 'person and pet';
  if(subject==='person' && /\b(car|truck|vehicle|motorcycle|bike)\b/.test(text)) return 'person and car';
  return subject;
}

const generationMessagesHigh=[
  ['Locking identity…','Preserving facial structure, hair, proportions, pet markings, and defining details.'],
  ['Building the new world…','Rebuilding the scene, wardrobe, lighting, props, and atmosphere around the real subject.'],
  ['Refining likeness…','Using the high-quality model for stronger identity and prompt accuracy.'],
  ['Finishing the preview…','Polishing anatomy, detail, lighting, and composition before reveal.']
];
const generationMessagesQuick=[
  ['Building a quick preview…','Keeping the subject recognizable while we test the idea fast.'],
  ['Applying your world…','Changing the scene, wardrobe, lighting, and atmosphere.'],
  ['Finishing the preview…','Cleaning up the fast concept preview for review.']
];
let generationTimer=null;
function selectedQuality(){
  return document.querySelector('input[name="qualityMode"]:checked')?.value==='quick'?'quick':'high';
}
function qualityLabel(mode=selectedQuality()){
  return mode==='quick'?'Quick Preview':'High-Quality Preview';
}
function updateQualityUI(){
  const mode=selectedQuality();
  document.querySelectorAll('[data-quality-card]').forEach(card=>card.classList.toggle('selected',card.dataset.qualityCard===mode));
  const button=document.querySelector('#generate-button');
  if(button&&!generationInFlight)button.textContent=mode==='quick'?'Create Quick Preview':'Create High-Quality Preview';
  const copy=document.querySelector('#model-copy');
  if(copy)copy.textContent=mode==='quick'
    ? 'Quick Preview · faster, lower detail and likeness accuracy'
    : 'High-Quality Preview · best likeness, prompt accuracy, and detail';
}
document.querySelectorAll('input[name="qualityMode"]').forEach(input=>input.addEventListener('change',updateQualityUI));

function startGenerationUI(mode=selectedQuality()){
  const messages=mode==='quick'?generationMessagesQuick:generationMessagesHigh;
  const status=document.querySelector('#generation-status');
  const detail=document.querySelector('#generation-detail');
  const progress=document.querySelector('#generation-progress');
  let index=0, pct=mode==='quick'?18:10;
  if(status) status.textContent=messages[0][0];
  if(detail) detail.textContent=messages[0][1];
  if(progress) progress.style.width=pct+'%';
  clearInterval(generationTimer);
  generationTimer=setInterval(()=>{
    index=Math.min(messages.length-1,index+1);
    pct=Math.min(90,pct+(mode==='quick'?30:22));
    if(status) status.textContent=messages[index][0];
    if(detail) detail.textContent=messages[index][1];
    if(progress) progress.style.width=pct+'%';
  },mode==='quick'?8000:15000);
}
function stopGenerationUI(success=false){
  clearInterval(generationTimer); generationTimer=null;
  const progress=document.querySelector('#generation-progress');
  if(progress) progress.style.width=success?'100%':'0%';
}
function friendlyGenerationError(data,error){
  const mode=data?.qualityMode||selectedQuality();
  const label=qualityLabel(mode);
  if(error?.name==='AbortError') return `${label} took too long this time. Your photo and settings are still here — try again or switch quality.`;
  if(data?.reviewRequired) return 'This request needs a quick human review before generation.';
  if(data?.code===3036 || data?.reason==='quota') return 'Today’s free AI allowance has been used. Your photo and settings are still saved here, and nothing was charged.';
  if(data?.code===3030 || data?.reason==='moderation') return `${label} could not complete that exact photo and wording combination. Try again, edit the direction, or switch quality.`;
  if(data?.reason==='capacity') return `${label} is temporarily busy. Your photo and settings are still here — try again or switch quality.`;
  return data?.userMessage || `${label} did not finish this time. Your photo and settings are still here.`;
}


let turnstileToken="";
let turnstileWidgetId=null;
async function setupTurnstile(){
  try{
    const config=await fetch('/api/public-config').then(r=>r.json());
    if(!config?.turnstileSiteKey)return;
    const container=document.querySelector('#turnstile-container');container?.classList.remove('hidden');
    await new Promise((resolve,reject)=>{
      if(window.turnstile)return resolve();
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.defer=true;script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
    });
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
  if(copy)copy.textContent=message;
  if(ref){
    if(diagnosticId){ref.textContent=`Support reference: ${diagnosticId}`;ref.classList.remove('hidden')}
    else{ref.textContent='';ref.classList.add('hidden')}
  }
  if(retry)retry.classList.toggle('hidden',retryable===false);
  box?.classList.remove('hidden');
}


let hasSuccessfulPreview=false;
let generationInFlight=false;
let currentClientAttemptId="";
let lastSuccessfulPreviewMeta=null;
let lastAttemptQuality='high';
const RECENT_VERSIONS_KEY='recast_recent_versions_v12';
let branchReference=null;

function readRecentVersions(){
  try{
    const rows=JSON.parse(localStorage.getItem(RECENT_VERSIONS_KEY)||'[]');
    return Array.isArray(rows)?rows.slice(0,4):[];
  }catch{return[]}
}
function writeRecentVersions(rows){
  localStorage.setItem(RECENT_VERSIONS_KEY,JSON.stringify(rows.slice(0,4)));
}
function addRecentVersion(version){
  const rows=readRecentVersions().filter(x=>x?.requestId&&x.requestId!==version.requestId);
  rows.unshift(version);
  writeRecentVersions(rows.slice(0,4));
  renderRecentVersions();
}
function activeRequestFromVersion(version){
  localStorage.setItem('recast_last_request',JSON.stringify({
    requestId:version.requestId,
    accessToken:version.accessToken,
    style:version.styleName||version.style||'Recast',
    model:version.modelUsed||null,
    qualityMode:version.qualityMode||'high'
  }));
}
async function fetchStoredPreview(version){
  const url=new URL(`/api/request/${encodeURIComponent(version.requestId)}/preview`,location.origin);
  url.searchParams.set('token',version.accessToken);
  const response=await fetch(url);
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok||!data.image)throw new Error(data.error||'This saved version is unavailable.');
  return data.image;
}
async function activateRecentVersion(version,{scroll=true}={}){
  const image=await fetchStoredPreview(version);
  await renderWatermark(image);
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
  renderRecentVersions();
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
  const subject=document.querySelector('#subject');
  if(subject&&[...subject.options].some(o=>o.value===branchReference.subjectType))subject.value=branchReference.subjectType;
  if([...[styleSelect.options]].some(o=>o.value===branchReference.styleId))styleSelect.value=branchReference.styleId;
  document.querySelector('#custom-world').value=branchReference.customWorld;
  document.querySelector('#notes').value=branchReference.notes;
  const radio=document.querySelector(`input[name="qualityMode"][value="${branchReference.qualityMode}"]`);
  if(radio){radio.checked=true;updateQualityUI()}
  updateSubjectQuickPicks();
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
  const active=JSON.parse(localStorage.getItem('recast_last_request')||'null')?.requestId;
  grid.innerHTML=rows.map((v,i)=>`
    <article class="recent-version-card ${v.requestId===active?'active':''}" data-version-index="${i}">
      <div class="recent-version-image"><div class="recent-version-loading">Loading…</div><img alt="${v.styleName||'Saved Recast'}"></div>
      <div class="recent-version-copy">
        <span>VERSION ${rows.length-i}</span>
        <strong>${v.styleName||'Custom Recast'}</strong>
        <small>${v.qualityMode==='quick'?'Quick':'High-Quality'} · ${new Date(v.createdAt||Date.now()).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</small>
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
      if(img){img.src=image;img.onload=()=>card?.querySelector('.recent-version-loading')?.remove()}
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
function restoreLastPreview(){
  clearPreviewError();
  document.querySelector('#preview-emergency-error')?.remove();
  if(!hasSuccessfulPreview)return;
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
  const files=[...photos.files].slice(0,4);
  clearRecastError();
  if(!files.length&&!branchReference){showRecastError('Add at least one photo first, or choose “Refine this version” from a recent successful Recast.');document.querySelector('#start').scrollIntoView({behavior:'smooth'});return;}
  if(styleSelect.value==='custom'&&!document.querySelector('#custom-world').value.trim()){
    showRecastError('Describe your custom world first, or choose one of the preset Worlds.');
    document.querySelector('#custom-world').focus();
    return;
  }
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
    const fd=new FormData();
    fd.append('style',styleSelect.value);
    const customWorld=document.querySelector('#custom-world').value.trim();
    const submittedSubject=inferSubject(document.querySelector('#subject').value,`${customWorld} ${document.querySelector('#notes').value}`);
    fd.append('subject',submittedSubject);
    fd.append('customWorld',customWorld);
    fd.append('notes',document.querySelector('#notes').value);
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
    if(!files.length&&branchReference)button.textContent='Preparing saved version…';

    button.textContent=qualityMode==='quick'?'Creating Quick Preview…':'Creating High-Quality Preview…';
    startGenerationUI(qualityMode);
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),qualityMode==='quick'?90000:210000);
    let res,data;
    try{
      res=await fetch('/api/transform-v2',{method:'POST',body:fd,signal:controller.signal});
      data=await res.json().catch(()=>({}));
    }finally{ clearTimeout(timeout); }

    if(res.status===202&&data.reviewRequired) throw Object.assign(new Error(friendlyGenerationError(data)),{publicMessage:friendlyGenerationError(data),diagnosticId:data.diagnosticId||'',retryable:false});
    if(!res.ok) throw Object.assign(new Error(friendlyGenerationError(data)),{publicMessage:friendlyGenerationError(data),diagnosticId:data.diagnosticId||'',retryable:data.retryable!==false});
    if(typeof data.image!=='string'||!data.image.startsWith('data:image/')) throw Object.assign(new Error('invalid preview'),{publicMessage:'The image engine returned an incomplete preview. Please try again.',retryable:true});

    try{await renderWatermark(data.image)}catch(error){throw Object.assign(new Error('preview display failed'),{publicMessage:'Your image was created, but the preview could not be displayed correctly. Please try once more.'})}

    const successTitle=`${data.style} preview ready.`;
    const successRequestText=`Artwork ID: ${data.requestId}${data.persisted?' · saved privately':' · preview generated; storage retry needed'}`;
    document.querySelector('#preview-title').textContent=successTitle;
    document.querySelector('#request-id').textContent=successRequestText;
    if(previewInfo)previewInfo.classList.remove('hidden');
    clearPreviewError();
    document.querySelector('#preview-emergency-error')?.remove();
    hasSuccessfulPreview=true;
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
    addRecentVersion(successVersion);
    activeRequestFromVersion(successVersion);
    clearBranchReference();
    const orderLink=document.querySelector('#order-status-link');
    if(orderLink){orderLink.href=`/order.html?requestId=${encodeURIComponent(data.requestId)}&token=${encodeURIComponent(data.accessToken)}`;orderLink.classList.remove('hidden')}
    if(data.storageError) console.warn('Recast storage warning:',data.storageError);
    if(data.usedFastFallback) console.warn('Recast used the fallback image model for this preview.');
    stopGenerationUI(true);
  }catch(err){
    stopGenerationUI(false);
    const publicMessage=err.publicMessage||friendlyGenerationError(null,err);
    let diagnosticId=err.diagnosticId||'';
    const logged=await logClientGenerationIssue('generation-catch',publicMessage,{
      serverDiagnosticId:diagnosticId||null,
      hadPreviousPreview:hasSuccessfulPreview
    });
    if(!diagnosticId)diagnosticId=logged?.diagnosticId||'';

    document.querySelector('#preview-title').textContent=hasSuccessfulPreview
      ? `That ${qualityLabel(lastAttemptQuality)} didn’t finish.`
      : `${qualityLabel(lastAttemptQuality)} didn’t finish this time.`;
    const retryButton=document.querySelector('#retry-generation');
    const switchButton=document.querySelector('#switch-quality-generation');
    if(retryButton)retryButton.textContent=lastAttemptQuality==='quick'?'Try Quick again':'Try High-Quality again';
    if(switchButton)switchButton.textContent=lastAttemptQuality==='quick'?'Try High-Quality Preview':'Try Quick Preview';
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
    generationInFlight=false;
    loading.classList.add('hidden');
    button.disabled=false;
    generationInFlight=false;
    updateQualityUI();
    resetTurnstile();
  }
});

document.querySelector('#retry-generation')?.addEventListener('click',()=>{
  clearPreviewError();
  form.requestSubmit();
});
document.querySelector('#switch-quality-generation')?.addEventListener('click',()=>{
  const next=lastAttemptQuality==='quick'?'high':'quick';
  const radio=document.querySelector(`input[name="qualityMode"][value="${next}"]`);
  if(radio){radio.checked=true;updateQualityUI();}
  clearPreviewError();
  form.requestSubmit();
});
document.querySelector('#keep-last-preview')?.addEventListener('click',()=>{
  restoreLastPreview();
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
  renderRecentVersions();
  // Only restore the most recent successful art if no preview is already visible.
  const existing=JSON.parse(localStorage.getItem('recast_last_request')||'null');
  const candidate=rows.find(v=>v.requestId===existing?.requestId)||rows[0];
  try{await activateRecentVersion(candidate,{scroll:false})}catch{renderRecentVersions()}
}

window.addEventListener('error',async event=>{
  if(!generationInFlight)return;
  const message='The page hit an unexpected display error while creating your preview.';
  const logged=await logClientGenerationIssue('window-error',event?.message||message,{source:event?.filename||null,line:event?.lineno||null});
  loading?.classList?.add?.('hidden');
  generationInFlight=false;
  forceVisibleFailure(message,logged?.diagnosticId||'');
});
window.addEventListener('unhandledrejection',async event=>{
  if(!generationInFlight)return;
  const reason=event?.reason?.message||String(event?.reason||'Unhandled generation promise');
  const message='The preview request was interrupted before it could finish displaying.';
  const logged=await logClientGenerationIssue('unhandled-rejection',reason);
  document.querySelector('#loading')?.classList.add('hidden');
  generationInFlight=false;
  forceVisibleFailure(message,logged?.diagnosticId||'');
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
renderRecentVersions();
restoreRecentVersionOnLoad();
status();
setupTurnstile();
