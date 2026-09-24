const merchCss=document.createElement('link');
merchCss.rel='stylesheet';
merchCss.href='/merch-v07.css';
document.head.appendChild(merchCss);

const STYLES = [
  ["game","Game World","Cinematic city energy, dramatic light, bold illustrated realism.","/assets/style-game.svg"],
  ["halloween","Halloween","Stylish costumes, moonlight, fog, pumpkins — playful, not grim.","/assets/style-halloween.svg"],
  ["retro","Retro Time Machine","A vivid trip through analog color, film grain and 1980s atmosphere.","/assets/style-retro.svg"],
  ["fantasy","Fantasy Warrior","Epic armor, ancient landscapes and cinematic fantasy light.","/assets/style-fantasy.svg"],
  ["royal","Royal","Regal portraiture, palace textures, rich fabric and museum drama.","/assets/style-royal.svg"],
  ["future","Future City","Neon reflections, rain haze and an original high-tech world.","/assets/style-future.svg"],
  ["comic","Comic Hero","Original nonviolent comic-book energy, ink, halftone and motion.","/assets/style-comic.svg"],
  ["space","Space Explorer","Original sci-fi portraiture, planets, spacecraft and epic scale.","/assets/style-space.svg"]
];

const PRODUCT_CATALOG = [
  {name:"Poster",price:"from $29.99",asset:"poster",badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured"},
  {name:"Hoodie",price:"from $59.99",asset:"hoodie",badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured"},
  {name:"Framed Poster",price:"from $59.99",asset:"framed-poster",badge:"PREMIUM PICK",pitch:"Display-ready artwork with a finished, giftable feel.",tier:"featured"},
  {name:"Canvas",price:"from $69.99",asset:"canvas",badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured"},

  {name:"T-Shirt",price:"from $34.99",asset:"tshirt",badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary"},
  {name:"Blanket",price:"from $74.99",asset:"blanket",badge:"COZY PICK",pitch:"Big, soft, personal — especially good for pets and gifts.",tier:"secondary"},
  {name:"Mug",price:"from $24.99",asset:"mug",badge:"GIFTABLE",pitch:"A personalized gift that gets used every day.",tier:"secondary"},
  {name:"Tumbler",price:"$49.99",asset:"tumbler",badge:"TAKE IT WITH YOU",pitch:"Your Recast on a 20 oz everyday tumbler.",tier:"secondary"},
  {name:"Magnet 3-Pack",price:"$24.99",asset:"magnet",badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary"},
  {name:"Coaster 4-Pack",price:"$39.99",asset:"coaster",badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary"},

  {name:"HD Digital Recast",price:"$4.99",asset:"digital",badge:"DIGITAL ONLY",pitch:"Just want the clean artwork? Keep the high-resolution file without ordering merch.",tier:"digital"},
  {name:"Recast Pack",price:"$9.99",asset:"pack",badge:"DIGITAL PACK",pitch:"The complete digital set with high-resolution art plus useful crops and formats.",tier:"digital"}
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
    <div class="product-art"><img src="/assets/product-${item.asset}.svg" alt="${item.name}"></div>
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

async function resizeFile(file,max=480){
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(bitmap,0,0,w,h);
  bitmap.close();
  return new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'})):reject(new Error('Could not prepare image.')),
    'image/jpeg',.9
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

const form=document.querySelector('#recast-form');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const files=[...photos.files].slice(0,4);
  if(!files.length){alert('Add at least one photo first.');return;}
  const button=document.querySelector('#generate-button'),loading=document.querySelector('#loading'),section=document.querySelector('#preview-section');
  button.disabled=true;button.textContent='Preparing photos…';
  section.classList.remove('hidden');section.scrollIntoView({behavior:'smooth'});loading.classList.remove('hidden');

  try{
    const fd=new FormData();
    fd.append('style',styleSelect.value);
    fd.append('subject',document.querySelector('#subject').value);
    fd.append('notes',document.querySelector('#notes').value);

    for(let i=0;i<files.length;i++){
      button.textContent=`Preparing photo ${i+1}…`;
      fd.append(`image_${i}`,await resizeFile(files[i]));
    }

    button.textContent='Creating high-fidelity preview…';
    const res=await fetch('/api/transform-v2',{method:'POST',body:fd});
    const data=await res.json();

    if(res.status===202&&data.reviewRequired) throw new Error('This request needs human review before generation. Try a more generic, original direction for now.');
    if(!res.ok) throw new Error(`${data.stage?`[${data.stage}] `:''}${data.error||'Generation failed.'}`);
    if(typeof data.image!=='string'||!data.image.startsWith('data:image/')) throw new Error('[client-preview] The server returned invalid preview data.');

    try{await renderWatermark(data.image)}catch(error){throw new Error(`[client-watermark] ${error?.message||String(error)}`)}

    document.querySelector('#preview-title').textContent=`${data.style} preview ready.`;
    document.querySelector('#request-id').textContent=`Artwork ID: ${data.requestId}${data.persisted?' · saved privately':' · preview generated; storage retry needed'}`;
    localStorage.setItem('recast_last_request',JSON.stringify({
      requestId:data.requestId,accessToken:data.accessToken,style:data.style,model:data.modelUsed
    }));
    if(data.storageError) console.warn('Recast storage warning:',data.storageError);
    if(data.usedFastFallback) console.warn('Recast used the fast fallback image model for this preview.');
  }catch(err){
    alert(err.message);
    section.classList.add('hidden');
  }finally{
    loading.classList.add('hidden');
    button.disabled=false;
    button.textContent='Create my preview';
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
