// RM115 — One obvious choice: make AI artwork or keep the original photo.
// This only rearranges existing forms. No new paid request or changed security flow.
(() => {
  const card=document.querySelector('.create-card');
  const slot=document.querySelector('#original-path-slot');
  const original=document.querySelector('#original-photo-option');
  const ai=document.querySelector('#choose-create-ai');
  const photo=document.querySelector('#choose-original-photo');
  if(!card||!slot||!original||!ai||!photo)return;
  // Keep the original-photo submission, consent, and Turnstile exactly as before.
  // Moving its existing DOM node avoids two competing upload forms.
  slot.append(original);
  original.open=true;
  function switchTo(useOriginal,{focus=false}={}){
    card.classList.toggle('is-original-mode',useOriginal);
    slot.hidden=!useOriginal;
    ai.classList.toggle('is-selected',!useOriginal);
    photo.classList.toggle('is-selected',useOriginal);
    ai.setAttribute('aria-pressed',String(!useOriginal));
    photo.setAttribute('aria-pressed',String(useOriginal));
    original.open=true;
    if(focus&&useOriginal){
      const input=document.querySelector('#original-photo');
      if(input)input.focus({preventScroll:true});
    }
  }
  ai.addEventListener('click',()=>switchTo(false));
  photo.addEventListener('click',()=>switchTo(true,{focus:true}));
  switchTo(false);
})();
