// Only pass a result from protectedPreviewFile: never a source or private URL.
export function offerDeviceSave(result, status, env=window) {
  const doc=env.document;
  const mobile=env.matchMedia('(pointer: coarse)').matches;
  if (!mobile && !env.webkit?.messageHandlers?.recastPreview) {
    const url=env.URL.createObjectURL(result.file), link=doc.createElement('a');
    link.href=url;link.download=result.file.name;doc.body.append(link);link.click();link.remove();
    env.setTimeout(()=>env.URL.revokeObjectURL(url),60000);
    status.textContent='✓ Saved to My Recasts. Your watermarked download was requested; your browser chooses the folder.';
    return;
  }
  doc.querySelector('#device-preview-save')?.remove();
  const dialog=doc.createElement('dialog');dialog.id='device-preview-save';
  dialog.style.cssText='width:min(90vw,440px);max-height:85dvh;overflow:auto;background:#101020;color:white;border:1px solid #72729b;border-radius:20px;padding:20px;';
  const heading=doc.createElement('h2');heading.textContent='Save your watermarked photo';heading.id='device-preview-title';
  dialog.setAttribute('aria-labelledby',heading.id);
  const help=doc.createElement('p');help.textContent='Saved to My Recasts. Tap Save to device and choose Save Image if offered. You can also touch and hold the picture below for your browser’s save options.';
  const save=doc.createElement('button');save.type='button';save.textContent='Save to device';
  save.style.cssText='padding:14px 22px;min-height:48px;background:linear-gradient(110deg,#9738ed,#06b8db);color:white;border:0;border-radius:12px;font:inherit;font-weight:bold;';
  const feedback=doc.createElement('p');feedback.setAttribute('role','status');
  const picture=doc.createElement('img');picture.src=result.image;picture.alt='Your watermarked Recast preview';picture.style.cssText='display:block;width:100%;height:auto;border-radius:12px;margin:16px 0;';
  const close=doc.createElement('button');close.type='button';close.textContent='Done';close.style.cssText='min-height:48px;padding:12px 24px;font:inherit;';
  close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
  // A fresh tap preserves the user activation required by mobile file sharing.
  save.onclick=async()=>{
    try {
      if(env.navigator.canShare?.({files:[result.file]})) {
        await env.navigator.share({files:[result.file],title:'My Recast'});
        feedback.textContent='Device menu closed. Your copy is still in My Recasts.';
      } else {
        feedback.textContent='Touch and hold the picture below, then choose Save Image or your browser’s download option.';
      }
    } catch(error) {
      feedback.textContent=error.name==='AbortError'?'Device save canceled. Your copy is still in My Recasts.':'Touch and hold the picture below to see your browser’s save options. Your copy is still in My Recasts.';
    }
  };
  dialog.append(heading,help,save,feedback,picture,close);doc.body.append(dialog);dialog.showModal();
  status.textContent='✓ Saved to My Recasts. Choose a device-save option to keep the watermarked photo on this device.';
}
