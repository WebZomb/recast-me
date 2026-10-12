// Small server-side analysis only. Originals and facial instructions stay intact.
export function combineSubjects(values){
 if(!values.length||values.some(x=>!['pet','people','person and pet','car','custom'].includes(x)))return 'auto';
 const unique=new Set(values);
 if(unique.size===1)return values[0];
 if(values.every(x=>['pet','people','person and pet'].includes(x)))return 'person and pet';
 return 'auto';
}
export function initSubjectDetection({photos,subject,prepare,status,fetcher=fetch}){
 const cache=new WeakMap();let revision=0,controller=null,last=[],locked=false;
 const setStatus=text=>{status.textContent=text;status.hidden=!text;};
 function cancel(){revision++;controller?.abort();controller=null;}
 function select(value){subject.value=value;subject.dispatchEvent(new CustomEvent('change',{detail:{suggestion:true}}));}
 async function check(){
  const files=[...photos.files];
  if(files.length===last.length&&files.every((f,i)=>f===last[i]))return;
  last=files;cancel();locked=false;
  select('auto');
  if(!files.length){setStatus('');return;}
  const current=revision;controller=new AbortController();const activeController=controller,signal=controller.signal;
  setStatus('Checking your photo… You can keep choosing a style.');
  const timer=setTimeout(()=>activeController.abort(),20000);
  try{
   const values=[];
   for(const file of files){
    if(signal.aborted||current!==revision||locked)return;
    if(!cache.has(file)){
     const image=await prepare(file);
     if(signal.aborted||current!==revision||locked)return;
     // Cache failures too: no hidden paid retries for the same File.
     cache.set(file,'auto');
     const response=await fetcher('/api/subject-detection',{method:'POST',headers:{'content-type':'image/jpeg','x-recast-request':'1','x-recast-photo-check':'yes'},body:image,signal});
     const data=await response.json();
     cache.set(file,response.ok?combineSubjects([data.subject]):'auto');
    }
    values.push(cache.get(file));
   }
   if(signal.aborted||current!==revision||locked)return;
   const result=combineSubjects(values);select(result);
   setStatus(result==='auto'?'Choose who to include with Change, or continue with Automatic.':'Suggested from your photo. Use Change to choose who to include.');
  }catch{
   if(current===revision&&!locked)setStatus('Photo check unavailable. Use Change, or continue with Automatic.');
  }finally{clearTimeout(timer);}
 }
 subject.addEventListener('change',event=>{
  if(event.detail?.suggestion)return;
  locked=true;cancel();setStatus('Your selection will be used.');
 });
 document.addEventListener('recast-photos-change',check);
 return {freeze(){locked=true;cancel();if(status.textContent.startsWith('Checking'))setStatus('Using your current selection.');}};
}
