// Optional manual face locations; no classifier, network call or biometric storage.
export function initSubjectFocus(photos){
 const points=new WeakMap();
 const trigger=document.querySelector('#select-photo-faces');
 trigger.addEventListener('click',()=>{
  const files=[...photos.files];if(!files.length)return;
  const dialog=document.createElement('dialog');dialog.className='subject-focus-dialog';
  dialog.innerHTML='<h2>Who should be in your picture?</h2><p>Tap each face to include. Tap a marker to remove it. Leave unmarked for Automatic.</p><div data-focus-photos></div><p data-focus-status role="status"></p><p class="focus-key-help">Keyboard: focus a photo, move with arrow keys, then press Enter to mark a face.</p><button type="button" class="button primary" data-focus-done>Done</button>';
  const urls=[];const status=()=>{const count=files.reduce((n,f)=>n+(points.get(f)||[]).length,0);dialog.querySelector('[data-focus-status]').textContent=count?`${count} face${count===1?'':'s'} selected`:'Automatic — main subjects';trigger.textContent=count?'Change selected faces':'Select specific faces (optional)';};
  files.forEach((file,index)=>{
   const row=document.createElement('section'),title=document.createElement('h3');title.textContent='Photo '+(index+1);
   const frame=document.createElement('div');frame.className='focus-photo';const img=document.createElement('img');img.src=URL.createObjectURL(file);urls.push(img.src);img.alt='Photo '+(index+1)+': select faces to include';frame.append(img);
   const surface=document.createElement('button');surface.type='button';surface.className='focus-surface';surface.setAttribute('aria-label','Select a face in photo '+(index+1));frame.append(surface);
   let cursor={x:50,y:50};
   const draw=()=>{frame.querySelectorAll('.face-marker').forEach(el=>el.remove());(points.get(file)||[]).forEach((point,n)=>{const marker=document.createElement('button');marker.type='button';marker.className='face-marker';marker.style.left=point.x+'%';marker.style.top=point.y+'%';marker.textContent=String(n+1);marker.setAttribute('aria-label',`Remove face ${n+1} from photo ${index+1}`);marker.addEventListener('click',()=>{points.set(file,(points.get(file)||[]).filter(p=>p!==point));draw();status()});frame.append(marker)});};
   const add=(x,y)=>{const list=points.get(file)||[];if(files.reduce((n,f)=>n+(points.get(f)||[]).length,0)>=8){dialog.querySelector('[data-focus-status]').textContent='Up to eight faces. Remove a marker to change the selection.';return;}points.set(file,[...list,{x:Math.round(x),y:Math.round(y)}]);draw();status();};
   surface.addEventListener('click',event=>{if(event.detail===0){add(cursor.x,cursor.y);return;}const rect=surface.getBoundingClientRect();add((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100)});
   surface.addEventListener('keydown',event=>{const delta={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[event.key];if(!delta)return;event.preventDefault();cursor={x:Math.max(0,Math.min(100,cursor.x+delta[0])),y:Math.max(0,Math.min(100,cursor.y+delta[1]))};surface.style.setProperty('--cursor-x',cursor.x+'%');surface.style.setProperty('--cursor-y',cursor.y+'%');});
   row.append(title,frame);dialog.querySelector('[data-focus-photos]').append(row);draw();
  });
  dialog.querySelector('[data-focus-done]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{urls.forEach(URL.revokeObjectURL);dialog.remove();trigger.focus()},{once:true});document.body.append(dialog);status();dialog.showModal();
 });
 return {refresh(){const count=[...photos.files].reduce((n,f)=>n+(points.get(f)||[]).length,0);trigger.hidden=!photos.files.length;trigger.textContent=count?'Change selected faces':'Select specific faces (optional)';},notes(){const selected=[...photos.files].flatMap((file,index)=>(points.get(file)||[]).map(p=>`photo ${index+1}: face at ${p.x}% from left, ${p.y}% from top`));return selected.length?'Keep ONLY subjects whose faces are nearest these selected locations: '+selected.join('; ')+'. Other figures are incidental. Preserve selected faces and head angles.':'';}};
}
