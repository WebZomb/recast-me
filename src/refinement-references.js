// Saved originals remain private and retain their best available detail.
// Prepare a provider-sized copy only when a restored reference needs it.
export function originalReferenceCount(saved){
  const total=Number(saved.inputCount);
  if(!Number.isInteger(total)||total<1||total>4)return 0;
  const count=saved.originalInputCount===undefined
    ?total-(saved.parentRequestId?1:0):Number(saved.originalInputCount);
  return Number.isInteger(count)&&count>=1&&count<=total?Math.min(3,count):0;
}

export async function prepareSavedReference(env,file,{qualityMode,provider}){
  if(qualityMode==='high'&&provider==='fal')return file;
  const info=await env.IMAGES.info(file.stream());
  if(!Number.isFinite(info.width)||!Number.isFinite(info.height)||info.width<=0||info.height<=0)
    throw new Error('Saved reference dimensions unavailable');
  if(info.width<=500&&info.height<=500)return file;
  const response=(await env.IMAGES.input(file.stream())
    .transform({width:500,height:500,fit:'scale-down'})
    .output({format:'image/jpeg',quality:90})).response();
  if(!response.ok||!response.headers.get('content-type')?.startsWith('image/jpeg'))
    throw new Error('Saved reference preparation failed');
  const prepared=new File([await response.arrayBuffer()],file.name,{type:'image/jpeg'});
  if(!prepared.size||prepared.size>2_000_000)throw new Error('Invalid prepared reference');
  return prepared;
}
