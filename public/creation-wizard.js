import {initSubjectFocus} from './subject-focus.js?v=283';
// RM117: Two steps. The editing model sees uploaded photos and selects which
// person/pet/vehicle directions apply. Subject tags are OPTIONAL for unusual
// multi-subject photos; no extra model call, image upload or paid inference.
export function initCreationWizard({styles,photos,subject,style,updateWorld,hasBranch}){
 const $=selector=>document.querySelector(selector);
 const labels=new WeakMap();
 const focus=initSubjectFocus(photos);
 let step=1;
 const names={auto:'Automatic',pet:'Pet',person:'Person','person and pet':'People & pets',group:'Group of people',couple:'Couple',family:'Family',car:'My car',custom:'Other — describe it'};
 const kind=()=>subject.value||'auto';
 function roles(){
  const type=kind(),count=Number($('#family-count').value);
  if(type==='pet')return ['pet'];
  if(type==='person')return ['person1'];
  if(type==='person and pet')return ['person1','pet','together'];
  if(type==='couple')return ['person1','person2','together'];
  if(type==='family')return [...Array.from({length:count},(_,i)=>'person'+(i+1)),'together'];
  if(type==='car')return ['car'];
  return [];
 }
 const roleName=value=>value==='together'?'Everyone together':value==='pet'?'Your pet':value==='car'?'Your car':'Person '+value.slice(6);
 function refreshPhotos(){
  const selected=[...photos.files],choices=roles();
  focus.refresh();
  $('#photo-step-error').textContent='';
  $('#photo-subject-details').hidden=!selected.length;
  if(!selected.length)$('#photo-subject-details').open=false;
  $('#photo-include-label').textContent=names[kind()]||'Automatic';
  $('#family-count-label').hidden=kind()!=='family';
  // Never label a random uploaded photo "Your pet" based on the last screen.
  // The image model can inspect pet/person/vehicle content directly.
  const showLabels=kind()!=='auto'&&selected.length>1&&choices.length>1;
  $('#photo-label-help').hidden=!showLabels;
  selected.forEach((file,index)=>{
   const tile=$('#photo-thumbnails').children[index];
   if(!tile)return;
   tile.querySelector('.reference-label')?.remove();
   if(!showLabels)return;
   const label=document.createElement('label');label.className='reference-label';label.textContent='Photo '+(index+1)+' shows (optional)';
   const select=document.createElement('select');select.setAttribute('aria-label','Person or pet in photo '+(index+1));
   const automatic=document.createElement('option');automatic.value='';automatic.textContent='Let AI decide';select.append(automatic);
   for(const value of choices){
    const option=document.createElement('option');option.value=value;option.textContent=roleName(value);select.append(option);
   }
   const prior=labels.get(file);select.value=choices.includes(prior)?prior:'';
   labels.set(file,select.value);
   select.addEventListener('change',()=>{labels.set(file,select.value);$('#photo-step-error').textContent=''});
   label.append(select);tile.insertBefore(label,tile.lastElementChild);
  });
  document.querySelectorAll('[data-subject-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.subjectChoice===kind())));
 }
 function validatePhotos(){
  if([...photos.files].length||hasBranch()){$('#photo-step-error').textContent='';return true;}
  $('#photo-step-error').textContent='Choose a photo to continue.';
  return false;
 }
 function go(to,{scroll=true}={}){
  const next=to===2?2:1;
  step=next===2&&!validatePhotos()?1:next;
  document.querySelectorAll('[data-create-step]').forEach(p=>p.hidden=Number(p.dataset.createStep)!==step);
  document.querySelectorAll('.creation-progress button').forEach(b=>{
   if(Number(b.dataset.goStep)===step)b.setAttribute('aria-current','step');
   else b.removeAttribute('aria-current');
  });
  if(scroll)$('.creation-progress').scrollIntoView({behavior:'auto',block:'start'});
 }
 for(const value of ['auto','pet','person and pet','person','group','couple','family','car','custom']){
  const button=document.createElement('button');button.type='button';button.dataset.subjectChoice=value;button.textContent=names[value];
  button.addEventListener('click',()=>{subject.value=value;subject.dispatchEvent(new Event('change'));$('#photo-subject-details').open=false;$('#change-photo-subject').focus();});
  if(['couple','family','car','custom'].includes(value)){$('#extra-subject-choices').append(button);}else $('#subject-choices').append(button);
 }
 function refreshAdventures(){
  $('#adventure-choices').replaceChildren();
  ['royal','fantasy','space','game'].map(id=>styles.find(s=>s[0]===id)).filter(Boolean).forEach(([id,name,,image,alt])=>{
   const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(style.value===id));
   const picture=document.createElement('img');picture.src=image;picture.alt=alt;picture.loading='lazy';
   const title=document.createElement('strong');title.textContent=name;button.append(picture,title);
   button.addEventListener('click',()=>{style.value=id;updateWorld()});
   $('#adventure-choices').append(button);
  });
  const list=$('#all-worlds-group');
  $('#more-adventures').textContent=list.hidden?'More Styles ↓':'Fewer Styles ↑';
 }
 const allWorlds=$('#all-worlds-group'),moreWorlds=$('#more-adventures');
 function setAllWorldsOpen(open){
  allWorlds.hidden=!open;
  moreWorlds.setAttribute('aria-expanded',String(open));
  moreWorlds.textContent=open?'Fewer Styles ↑':'More Styles ↓';
 }
 moreWorlds.addEventListener('click',()=>{
  setAllWorldsOpen(allWorlds.hidden);
  if(!allWorlds.hidden)style.focus({preventScroll:true});
 });
 setAllWorldsOpen(style.value==='custom'||!['royal','fantasy','space','game'].includes(style.value));
 // The single native summary toggles the optional inclusion controls.
 subject.addEventListener('change',refreshPhotos);$('#family-count').addEventListener('change',refreshPhotos);
 document.addEventListener('recast-photos-change',refreshPhotos);
 document.addEventListener('recast-style-change',refreshAdventures);
 document.querySelectorAll('[data-go-step]').forEach(button=>button.addEventListener('click',()=>go(Number(button.dataset.goStep))));
 $('#recast-form').addEventListener('keydown',event=>{
  if(event.key==='Enter'&&event.target.tagName!=='TEXTAREA'&&event.target.tagName!=='BUTTON'&&!event.target.closest('summary')&&step===1){
   event.preventDefault();go(2);
  }
 });
 $('#recast-form').addEventListener('invalid',event=>{
  if(event.target.closest('[data-create-step="2"]'))go(2);
 },true);
 refreshPhotos();refreshAdventures();
 go(1,{scroll:false});
 return {go,focusNotes:()=>focus.notes(),
  // Only send labels the customer explicitly supplied for ALL photos.
  // Otherwise let the editing model identify the photo contents; no extra step.
  references:()=>{
   const files=[...photos.files],selected=files.map(file=>labels.get(file)||'');
   const valid=roles();
   return files.length>1&&kind()!=='auto'&&valid.length>1&&selected.every(x=>valid.includes(x))?selected:null;
  },
  validate:()=>{if(!validatePhotos()){go(1);return false;}if(step!==2){go(2);return false;}return true;}
 };
}
