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
  {name:"Framed Poster",price:"from $59.99",asset:"framed-poster",image:"/assets/product-framed-poster-v10.webp",badge:"PREMIUM PICK",pitch:"Display-ready artwork with a finished, giftable feel.",tier:"featured"},
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

styleSelect.innerHTML = STYLES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');

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
if (params.get('style') && STYLES.some(x=>x[0]===params.get('style'))) styleSelect.value=params.get('style');

const photos = document.querySelector('#photos');
photos.addEventListener('change',()=>{
  const selected=[...photos.files].slice(0,4);
  document.querySelector('#file-summary').textContent=selected.length?`${selected.length} photo${selected.length===1?'':'s'} selected`:'No photos selected';
});

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

const generationMessages=[
  ['Locking identity…','Keeping the face, hair, body proportions, pet markings, and defining details recognizable.'],
  ['Building the new world…','Changing the scene, wardrobe, lighting, props, and atmosphere around the subject.'],
  ['Following your direction…','Using your written notes as the primary creative instruction.'],
  ['Finishing the preview…','Cleaning up anatomy, detail, lighting, and composition for a polished result.']
];
let generationTimer=null;
function startGenerationUI(){
  const status=document.querySelector('#generation-status');
  const detail=document.querySelector('#generation-detail');
  const progress=document.querySelector('#generation-progress');
  let index=0, pct=12;
  if(status) status.textContent=generationMessages[0][0];
  if(detail) detail.textContent=generationMessages[0][1];
  if(progress) progress.style.width=pct+'%';
  clearInterval(generationTimer);
  generationTimer=setInterval(()=>{
    index=Math.min(generationMessages.length-1,index+1);
    pct=Math.min(88,pct+22);
    if(status) status.textContent=generationMessages[index][0];
    if(detail) detail.textContent=generationMessages[index][1];
    if(progress) progress.style.width=pct+'%';
  },12000);
}
function stopGenerationUI(success=false){
  clearInterval(generationTimer); generationTimer=null;
  const progress=document.querySelector('#generation-progress');
  if(progress) progress.style.width=success?'100%':'0%';
}
function friendlyGenerationError(data,error){
  if(error?.name==='AbortError') return 'This preview is taking too long. Please try again — we stopped the wait instead of leaving you hanging.';
  if(data?.reviewRequired) return 'This request needs a quick human review before generation.';
  if(data?.code===3030 || data?.reason==='moderation') return 'The image engine would not complete that exact photo and wording combination. We already tried a safer version. Try the same idea with simpler wording or another reference photo.';
  if(data?.reason==='capacity') return 'The image engine is temporarily busy. Please try again in a moment.';
  return data?.userMessage || 'We could not finish this preview. Please try again — your uploaded photo was not changed.';
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
  el.textContent=message;el.classList.remove('hidden');
}
function clearRecastError(){
  const el=document.querySelector('#recast-error');
  if(!el)return;
  el.textContent='';el.classList.add('hidden');
}

const form=document.querySelector('#recast-form');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const files=[...photos.files].slice(0,4);
  clearRecastError();
  if(!files.length){showRecastError('Add at least one photo first.');document.querySelector('#start').scrollIntoView({behavior:'smooth'});return;}
  const button=document.querySelector('#generate-button'),loading=document.querySelector('#loading'),section=document.querySelector('#preview-section');
  button.disabled=true;button.textContent='Preparing photos…';
  section.classList.remove('hidden');section.scrollIntoView({behavior:'smooth'});loading.classList.remove('hidden');

  try{
    const fd=new FormData();
    fd.append('style',styleSelect.value);
    const submittedSubject=inferSubject(document.querySelector('#subject').value,document.querySelector('#notes').value);
    fd.append('subject',submittedSubject);
    fd.append('notes',document.querySelector('#notes').value);
    fd.append('source',params.get('source')||'site');
    fd.append('sourceTweet',params.get('tweet')||'');
    if(turnstileToken)fd.append('turnstileToken',turnstileToken);

    for(let i=0;i<files.length;i++){
      button.textContent=`Preparing photo ${i+1}…`;
      fd.append(`image_${i}`,await resizeFile(files[i]));
    }

    button.textContent='Creating your Recast…';
    startGenerationUI();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),120000);
    let res,data;
    try{
      res=await fetch('/api/transform-v2',{method:'POST',body:fd,signal:controller.signal});
      data=await res.json().catch(()=>({}));
    }finally{ clearTimeout(timeout); }

    if(res.status===202&&data.reviewRequired) throw Object.assign(new Error(friendlyGenerationError(data)),{publicMessage:friendlyGenerationError(data)});
    if(!res.ok) throw Object.assign(new Error(friendlyGenerationError(data)),{publicMessage:friendlyGenerationError(data)});
    if(typeof data.image!=='string'||!data.image.startsWith('data:image/')) throw Object.assign(new Error('invalid preview'),{publicMessage:'The image engine returned an incomplete preview. Please try again.'});

    try{await renderWatermark(data.image)}catch(error){throw Object.assign(new Error('preview display failed'),{publicMessage:'Your image was created, but the preview could not be displayed correctly. Please try once more.'})}

    document.querySelector('#preview-title').textContent=`${data.style} preview ready.`;
    document.querySelector('#request-id').textContent=`Artwork ID: ${data.requestId}${data.persisted?' · saved privately':' · preview generated; storage retry needed'}`;
    localStorage.setItem('recast_last_request',JSON.stringify({
      requestId:data.requestId,accessToken:data.accessToken,style:data.style,model:data.modelUsed
    }));
    const orderLink=document.querySelector('#order-status-link');
    if(orderLink){orderLink.href=`/order.html?requestId=${encodeURIComponent(data.requestId)}&token=${encodeURIComponent(data.accessToken)}`;orderLink.classList.remove('hidden')}
    if(data.storageError) console.warn('Recast storage warning:',data.storageError);
    if(data.usedFastFallback) console.warn('Recast used the fallback image model for this preview.');
    stopGenerationUI(true);
  }catch(err){
    stopGenerationUI(false);
    const publicMessage=err.publicMessage||friendlyGenerationError(null,err);
    showRecastError(publicMessage);
    document.querySelector('#start').scrollIntoView({behavior:'smooth'});
    section.classList.add('hidden');
  }finally{
    loading.classList.add('hidden');
    button.disabled=false;
    button.textContent='Create my preview';
    resetTurnstile();
  }
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
    if(m.ok && document.querySelector('#model-copy')) document.querySelector('#model-copy').textContent=`${m.label} · high fidelity`;
  }catch{}
  if(params.get('debug')==='1'){
    try{
      const p=await fetch('/api/printful-status').then(async r=>({ok:r.ok,data:await r.json()}));
      document.querySelector('#pf-dot')?.classList.add(p.ok&&p.data.connected?'ready':'error');
      if(document.querySelector('#pf-status')) document.querySelector('#pf-status').textContent=p.ok&&p.data.connected?`Connected · ${p.data.stores?.[0]?.name||'store ready'}`:'Needs token check';
    }catch{}
  }
}
status();
setupTurnstile();
