export function initCreationWizard({styles,photos,subject,style,updateWorld,hasBranch}){
  const $=s=>document.querySelector(s), labels=new WeakMap();
  let step=0;
  const names={'pet':'My pet','multiple pets':'My pets','person':'Just me','person and pet':'Me + my pet','couple':'Couple','family':'Family','friends':'Friends / group','child':'Child / teen','baby':'Baby','horse':'Horse','animal':'Another animal','car':'Car / truck','motorcycle':'Motorcycle / bike','home':'Home / place','couple and pet':'Couple + pet','family and pet':'Family + pet','person and car':'Me + vehicle','memorial':'Memorial / tribute','custom':'Anything else'};
  function roles(){
    const count=Number($('#family-count').value);
    if(subject.value==='pet'||subject.value==='horse'||subject.value==='animal')return ['pet'];
    if(subject.value==='multiple pets')return ['pet1','pet2','together'];
    if(['person','child','baby'].includes(subject.value))return ['person1'];
    if(subject.value==='person and pet')return ['person1','pet','together'];
    if(subject.value==='couple')return ['person1','person2','together'];
    if(subject.value==='family')return [...Array.from({length:count},(_,i)=>'person'+(i+1)),'together'];
    if(subject.value==='friends')return ['person1','person2','together'];
    if(subject.value==='couple and pet')return ['person1','person2','pet','together'];
    if(subject.value==='family and pet')return [...Array.from({length:count},(_,i)=>'person'+(i+1)),'pet','together'];
    if(subject.value==='person and car')return ['person1','car','together'];
    if(subject.value==='car'||subject.value==='motorcycle')return ['car'];
    return ['together'];
  }
  const roleName=value=>value==='together'?'Everyone / everything together':value==='pet'?'Your pet / animal':value==='pet1'?'Pet 1':value==='pet2'?'Pet 2':value==='car'?'Your vehicle':`Person ${value.slice(6)}`;
  function refreshPhotos(){
    const options=roles();
    $('#photo-step-error').textContent='';
    $('#family-count-label').hidden=subject.value!=='family';
    const animal=['pet','multiple pets','horse','animal'].includes(subject.value),vehicle=['car','motorcycle'].includes(subject.value),place=subject.value==='home';
    $('#photo-guidance').textContent=animal?'Add clear photos that show the animal’s face, markings and distinctive features.':vehicle?'Add a clear photo showing the whole vehicle and its distinctive details.':place?'Add a clear photo of the home or place you want transformed.':subject.value==='person'?'Add a clear photo of your face.':'Add one clear photo per subject, or use a photo together. Label each photo below. Another angle of the same subject should use the same label.';
    [...photos.files].forEach((file,index)=>{
      const tile=$('#photo-thumbnails').children[index];if(!tile)return;
      tile.querySelector('.reference-label')?.remove();
      const label=document.createElement('label');label.className='reference-label';label.textContent=`Photo ${index+1} shows`;
      const select=document.createElement('select');select.setAttribute('aria-label',`Who is in photo ${index+1}?`);
      for(const value of options){const o=document.createElement('option');o.value=value;o.textContent=roleName(value);select.append(o);}
      // Multi-subject photos must be labeled deliberately; don't guess identity from position.
      if(options.length>1){const o=document.createElement('option');o.value='';o.textContent='Choose who’s in this photo';select.prepend(o);}
      const prior=labels.get(file);select.value=options.includes(prior)?prior:options.length===1?options[0]:'';
      labels.set(file,select.value);select.addEventListener('change',()=>{labels.set(file,select.value);$('#photo-step-error').textContent='';});
      label.append(select);tile.insertBefore(label,tile.lastElementChild);
    });
    document.querySelectorAll('[data-subject-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.subjectChoice===subject.value)));
  }
  function validatePhotos(){
    const selected=[...photos.files];
    let message=!selected.length&&!hasBranch()?'Add a photo to continue.':'';
    if(selected.some(f=>!labels.get(f)))message='Choose who appears in each photo before continuing.';
    const needed=roles().filter(r=>r!=='together');
    if(selected.length&&!selected.some(f=>labels.get(f)==='together')&&needed.some(r=>!selected.some(f=>labels.get(f)===r)))message='Add a photo for each subject, or label a photo that shows everyone together.';
    $('#photo-step-error').textContent=message;return !message;
  }
  function go(next){
    if(next===2&&!validatePhotos())next=1;
    step=next;
    document.querySelectorAll('[data-create-step]').forEach(p=>p.hidden=Number(p.dataset.createStep)!==step);
    document.querySelectorAll('.creation-progress button').forEach(b=>{if(Number(b.dataset.goStep)===step)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('.creation-progress').scrollIntoView({behavior:'auto',block:'start'});
  }
  const quickSubjects=['pet','person','person and pet','couple','family','car','friends','custom'];
  for(const value of quickSubjects){
    const title=names[value],b=document.createElement('button');b.type='button';b.dataset.subjectChoice=value;b.textContent=title;
    b.addEventListener('click',()=>{subject.value=value;subject.dispatchEvent(new Event('change'));});$('#subject-choices').append(b);
  }
  const browse=document.createElement('button');browse.type='button';browse.className='browse-subjects';browse.textContent='Browse all subjects ↓';
  browse.addEventListener('click',()=>{const label=document.querySelector('.native-subject');label.hidden=!label.hidden;browse.textContent=label.hidden?'Browse all subjects ↓':'Hide all subjects ↑';if(!label.hidden)subject.focus({preventScroll:true});});
  $('#subject-choices').append(browse);
  function refreshAdventures(){
    $('#adventure-choices').replaceChildren();
    ['royal','fantasy','space','game'].map(id=>styles.find(s=>s[0]===id)).filter(Boolean).forEach(([id,name,,src,alt])=>{
      const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(style.value===id));
      const img=document.createElement('img');img.src=src;img.alt=alt;img.loading='lazy';
      const title=document.createElement('strong');title.textContent=name;b.append(img,title);
      b.addEventListener('click',()=>{style.value=id;updateWorld();});$('#adventure-choices').append(b);
    });
    $('#more-adventures').textContent='Browse all worlds ↓';
  }
  $('#more-adventures').addEventListener('click',()=>{
    style.scrollIntoView({behavior:'smooth',block:'center'});
    style.focus({preventScroll:true});
  });
  subject.addEventListener('change',refreshPhotos);$('#family-count').addEventListener('change',refreshPhotos);
  document.addEventListener('recast-photos-change',refreshPhotos);document.addEventListener('recast-style-change',refreshAdventures);
  document.querySelectorAll('[data-go-step]').forEach(b=>b.addEventListener('click',()=>go(Number(b.dataset.goStep))));
  $('#recast-form').addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.tagName!=='TEXTAREA'&&event.target.tagName!=='BUTTON'&&step<2){event.preventDefault();go(step+1);}});
  $('#recast-form').addEventListener('invalid',event=>{if(event.target.closest('[data-create-step="2"]'))go(2);},true);
  refreshPhotos();refreshAdventures();
  document.querySelector('.creation-progress button').setAttribute('aria-current','step');
  return {go,references:()=>[...photos.files].map(f=>labels.get(f)||''),validate:()=>{if(!validatePhotos()){go(1);return false;}if(step!==2){go(2);return false;}return true;}};
}
