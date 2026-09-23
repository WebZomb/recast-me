const STYLES = [
  ["game","Game World","Urban action energy without borrowed IP.","#5c66ff"],
  ["halloween","Halloween","Costumes, moonlight, fog, pumpkins and fun.","#ff7a33"],
  ["retro","Retro Time Machine","A convincing trip back to the 1980s.","#ff4fd8"],
  ["fantasy","Fantasy Warrior","Armor, ruins and heroic cinematic light.","#8b65ff"],
  ["royal","Royal","Museum-worthy royalty for people and pets.","#e5b85d"],
  ["future","Future City","Neon streets and future-you.","#20d9ff"],
  ["comic","Comic Hero","Bold ink, motion and original hero energy.","#e7417a"],
  ["space","Space Explorer","Put yourself in an original sci-fi universe.","#7e88ff"]
];
const PRODUCTS = [
  ["Hoodie","from $59.99"],["Blanket","from $74.99"],["Framed Poster","from $59.99"],["Poster","from $29.99"],
  ["Canvas","from $69.99"],["Mug","from $24.99"],["Tumbler","$39.99"],["Magnet 3-Pack","$24.99"]
];
const styleGrid = document.querySelector('#style-grid');
const styleSelect = document.querySelector('#style');
styleGrid.innerHTML = STYLES.map(([id,name,copy,color],i)=>`<article class="style-card" style="--accent:${color}" data-style="${id}"><small>STYLE ${String(i+1).padStart(2,'0')}</small><h3>${name}</h3><p>${copy}</p></article>`).join('');
styleSelect.innerHTML = STYLES.map(([id,name])=>`<option value="${id}">${name}</option>`).join('');
document.querySelectorAll('.style-card').forEach(card=>card.addEventListener('click',()=>{styleSelect.value=card.dataset.style;document.querySelector('#start').scrollIntoView({behavior:'smooth'});}));
document.querySelector('#product-grid').innerHTML = PRODUCTS.map(([name,price])=>`<div class="product"><small>RECAST MERCH</small><strong>${name}</strong><span>${price}</span><button disabled>Checkout coming online</button></div>`).join('');

const params = new URLSearchParams(location.search);
if (params.get('request')) {
  document.querySelector('#notes').value = params.get('request');
  document.querySelector('#prefill-note').textContent = `Request loaded from social: “${params.get('request')}”`;
}
if (params.get('style') && STYLES.some(x=>x[0]===params.get('style'))) styleSelect.value=params.get('style');

const photos = document.querySelector('#photos');
photos.addEventListener('change',()=>{
  const selected=[...photos.files].slice(0,4);
  document.querySelector('#file-summary').textContent=selected.length?`${selected.length} photo${selected.length===1?'':'s'} selected`:'';
});

async function resizeFile(file,max=480){
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const w=Math.max(1,Math.round(bitmap.width*scale)),h=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  canvas.getContext('2d').drawImage(bitmap,0,0,w,h);
  bitmap.close();
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'})):reject(new Error('Could not prepare image.')),'image/jpeg',.86));
}

async function renderWatermark(dataUrl){
  const img=new Image();img.src=dataUrl;await img.decode();
  const canvas=document.querySelector('#preview-canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  ctx.save();ctx.globalAlpha=.23;ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.font=`900 ${Math.max(16,canvas.width/24)}px system-ui`;
  ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/5);
  const gap=canvas.width/2.1;
  for(let y=-canvas.height*1.4;y<canvas.height*1.4;y+=gap*.65){for(let x=-canvas.width*1.5;x<canvas.width*1.5;x+=gap){ctx.fillText('RECAST ME • PREVIEW',x,y)}}
  ctx.restore();
  ctx.fillStyle='rgba(7,7,11,.72)';ctx.fillRect(0,canvas.height-46,canvas.width,46);ctx.fillStyle='#fff';ctx.font=`800 ${Math.max(13,canvas.width/34)}px system-ui`;ctx.textAlign='center';ctx.fillText('RECAST ME • PREVIEW',canvas.width/2,canvas.height-18);
}

const form=document.querySelector('#recast-form');
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const files=[...photos.files].slice(0,4);if(!files.length){alert('Add at least one photo first.');return;}
  const button=document.querySelector('#generate-button'),loading=document.querySelector('#loading'),section=document.querySelector('#preview-section');
  button.disabled=true;button.textContent='Preparing photos…';section.classList.remove('hidden');section.scrollIntoView({behavior:'smooth'});loading.classList.remove('hidden');
  try{
    const fd=new FormData();fd.append('style',styleSelect.value);fd.append('subject',document.querySelector('#subject').value);fd.append('notes',document.querySelector('#notes').value);
    for(let i=0;i<files.length;i++){button.textContent=`Preparing photo ${i+1}…`;fd.append(`image_${i}`,await resizeFile(files[i]));}
    button.textContent='Creating and saving your Recast…';
    const res=await fetch('/api/transform',{method:'POST',body:fd});const data=await res.json();
    if(res.status===202&&data.reviewRequired) throw new Error('This request needs human review before generation. Try a more generic, original direction for now.');
    if(!res.ok) throw new Error(`${data.stage?`[${data.stage}] `:''}${data.error||'Generation failed.'}`);
    if(typeof data.image!=='string'||!data.image.startsWith('data:image/')) throw new Error(`[client-preview] The server returned invalid preview data.`);
    try{await renderWatermark(data.image);}catch(error){throw new Error(`[client-watermark] ${error?.message||String(error)}`)}
    document.querySelector('#preview-title').textContent=`${data.style} preview ready.`;document.querySelector('#request-id').textContent=`Artwork ID: ${data.requestId}${data.persisted?' · saved privately':' · preview generated; storage retry needed'}`;localStorage.setItem('recast_last_request',JSON.stringify({requestId:data.requestId,accessToken:data.accessToken,style:data.style}));if(data.storageError)console.warn('Recast storage warning:',data.storageError);
  }catch(err){alert(err.message);section.classList.add('hidden');}finally{loading.classList.add('hidden');button.disabled=false;button.textContent='Generate watermarked preview';}
});

async function status(){
  try{const h=await fetch('/api/health').then(r=>r.json());document.querySelector('#ai-dot').classList.add(h.aiBinding?'ready':'error');document.querySelector('#ai-status').textContent=h.aiBinding?'Connected':'Missing binding';document.querySelector('#storage-dot').classList.add(h.privateArtworkStorage?'ready':'error');document.querySelector('#storage-status').textContent=h.privateArtworkStorage?'Private storage ready':'R2 binding needed';}catch{document.querySelector('#ai-dot').classList.add('error');document.querySelector('#ai-status').textContent='Unavailable';}
  try{const p=await fetch('/api/printful-status').then(async r=>({ok:r.ok,data:await r.json()}));document.querySelector('#pf-dot').classList.add(p.ok&&p.data.connected?'ready':'error');document.querySelector('#pf-status').textContent=p.ok&&p.data.connected?`Connected · ${p.data.stores?.[0]?.name||'store ready'}`:'Needs token check';}catch{document.querySelector('#pf-dot').classList.add('error');document.querySelector('#pf-status').textContent='Unavailable';}
}
status();
