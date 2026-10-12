const $=s=>document.querySelector(s);
const falModels=new Set(['dev','dev-edit','nano-banana','qwen-protected','fill-protected']);
function syncHost(){if(['dev-edit','nano-banana','qwen-protected','fill-protected'].includes($('#engine').value))$('#host').value='fal';if($('#engine').value.startsWith('klein'))$('#host').value='cloudflare';$('#host').disabled=$('#engine').value!=='dev';$('#recipe').disabled=!['nano-banana','dev-edit'].includes($('#engine').value)}
$('#engine').addEventListener('change',syncHost);syncHost();
let originalUrl,originalPreviewRun=0;
async function showOriginal(file){
 const run=++originalPreviewRun;const img=$('#original');img.hidden=true;img.removeAttribute('src');
 if(originalUrl){URL.revokeObjectURL(originalUrl);originalUrl=null;}
 try{const small=await prepare(file,480);if(run!==originalPreviewRun)return;
 originalUrl=URL.createObjectURL(small);img.src=originalUrl;img.hidden=false;
 }catch{if(run===originalPreviewRun)$('#status').textContent='Photo selected; display preview unavailable.';}
}
$('#reference').addEventListener('change',()=>{if($('#reference').files[0])showOriginal($('#reference').files[0])});
try{$('#token').value=sessionStorage.getItem('recast_admin_token')||''}catch{}
async function prepare(file,maxEdge=500){
 const image=await createImageBitmap(file);const scale=Math.min(1,maxEdge/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();try{return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not prepare photo.')),'image/jpeg',.9))}finally{canvas.width=canvas.height=0}
}
$('#use-demo-dog').addEventListener('click',async e=>{
 const button=e.currentTarget;button.disabled=true;$('#status').textContent='Loading the public sample dog…';
 try{
  const response=await fetch('/assets/jack-russell-source-v18.webp',{cache:'force-cache'});
  if(!response.ok)throw Error('Sample image could not be loaded.');
  const blob=await response.blob();
  if(blob.size>2500000||!blob.size)throw Error('Sample image is unavailable.');
  const file=new File([blob],'recast-demo-jack-russell.webp',{type:'image/webp'});
  const transfer=new DataTransfer();transfer.items.add(file);
  $('#reference').files=transfer.files;
  $('#engine').value='nano-banana';$('#recipe').value='concise';$('#host').value='fal';syncHost();showOriginal(file);
  $('#direction').value='Add a royal blue embroidered cape and a small crown.';
  $('#environment').value='A sunlit palace courtyard with warm natural light.';
  $('#status').textContent='Demo dog loaded. Choose Generate one comparison image to test the fal High Quality model.';
 }catch(error){$('#status').textContent=error.message}finally{button.disabled=false}
});
$('#lab').addEventListener('submit',async e=>{
 e.preventDefault();const model=$('#engine').value;const label=$('#engine').selectedOptions[0].textContent;const host=$('#host').value;const subject='auto';const notes=$('#direction').value;const world=$('#environment').value;const file=$('#reference').files[0];const token=$('#token').value.trim();const started=Date.now();$('#run').disabled=true;$('#status').textContent='Preparing '+label+'…';
 const timer=setInterval(()=>$('#status').textContent=`${model.endsWith('-protected')?'Detecting heads / creating scene':'Rendering'} ${label} · ${Math.floor((Date.now()-started)/1000)} seconds elapsed`,1000);
 try{
  if(host==='fal'&&!falModels.has(model))throw Error('Choose Cloudflare for the Standard engines.');
  const form=new FormData();form.set('promptRecipe',$('#recipe').disabled?'baseline':$('#recipe').value);form.set('ownerProvider',host==='fal'?'fal':'cloudflare');form.set('style','custom');form.set('subject',subject);form.set('notes',notes);form.set('customWorld',world);form.set('qualityMode',model.startsWith('klein')?'quick':'high');form.set('image_0',await prepare(file),'reference.jpg');
  if(host==='fal')form.set('hq_image_0',await prepare(file,1024),'detail.jpg');
  const response=await fetch('/api/admin/model-test?model='+model,{method:'POST',headers:{Authorization:'Bearer '+token},body:form});const data=await response.json();if(!response.ok||!data.ok)throw Error((data.userMessage||data.error||'Generation did not finish.')+(data.diagnosticId?' Support reference: '+data.diagnosticId:''));
  const card=document.createElement('article');const title=document.createElement('h2');title.textContent=label+' · '+(form.get('promptRecipe')==='concise'?'concise':'earlier recipe');const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.src=data.image;img.alt='Owner comparison result';const detail=document.createElement('p');detail.textContent=`${Math.round((Date.now()-started)/1000)}s · ${data.providerUsed||host} · ${data.modelUsed} · ${data.promptVersion} · ${file.name} · ${subject} · ${notes} · ${world}`;card.append(title,img,detail);$('#results').append(card);while($('#results').children.length>4)$('#results').firstElementChild.remove();$('#status').textContent='Comparison ready. Select the next engine to run another test.';
 }catch(error){$('#status').textContent=error.message}finally{clearInterval(timer);$('#run').disabled=false}
});
