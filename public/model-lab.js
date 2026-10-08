const $=s=>document.querySelector(s);
try{$('#token').value=sessionStorage.getItem('recast_admin_token')||''}catch{}
async function prepare(file){
 const image=await createImageBitmap(file);const scale=Math.min(1,500/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not prepare photo.')),'image/jpeg',.9));
}
$('#lab').addEventListener('submit',async e=>{
 e.preventDefault();const model=$('#engine').value;const label=$('#engine').selectedOptions[0].textContent;const subject=$('#subject').value;const notes=$('#direction').value;const world=$('#environment').value;const file=$('#reference').files[0];const token=$('#token').value.trim();const started=Date.now();$('#run').disabled=true;
 const timer=setInterval(()=>$('#status').textContent=`Rendering ${label} · ${Math.floor((Date.now()-started)/1000)} seconds elapsed`,1000);
 try{
  const form=new FormData();form.set('style','custom');form.set('subject',subject);form.set('notes',notes);form.set('customWorld',world);form.set('image_0',await prepare(file),'reference.jpg');
  const response=await fetch('/api/admin/model-test?model='+model,{method:'POST',headers:{Authorization:'Bearer '+token},body:form});const data=await response.json();if(!response.ok||!data.ok)throw Error((data.userMessage||data.error||'Generation did not finish.')+(data.diagnosticId?' Support reference: '+data.diagnosticId:''));
  const card=document.createElement('article');const title=document.createElement('h2');title.textContent=label;const img=document.createElement('img');img.src=data.image;img.alt='Owner comparison result';const detail=document.createElement('p');detail.textContent=`${Math.round((Date.now()-started)/1000)}s · ${data.modelUsed} · ${file.name} · ${subject} · ${notes} · ${world}`;card.append(title,img,detail);$('#results').append(card);$('#status').textContent='Comparison ready. Select the next engine to run another test.';
 }catch(error){$('#status').textContent=error.message}finally{clearInterval(timer);$('#run').disabled=false}
});
