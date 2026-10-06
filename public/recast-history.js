export function mergeHistory(rows,last){
  const result=Array.isArray(rows)?rows.filter(v=>v?.requestId&&v?.accessToken):[];
  if(last?.requestId&&last?.accessToken&&!result.some(v=>v.requestId===last.requestId))result.unshift({...last,styleName:last.styleName||last.style||'Saved Recast'});
  return result.filter((v,i)=>result.findIndex(x=>x.requestId===v.requestId)===i).slice(0,4);
}
export function privateRecastLink(origin,version){
  const url=new URL('/',origin);url.hash=new URLSearchParams({recast:version.requestId,key:version.accessToken}).toString();return url.href;
}
function trustedRecastHost(host){
  const value=String(host||'').toLowerCase();
  return value==='recastmeai.com'||value==='www.recastmeai.com'||value==='recast-me.sergz24.workers.dev'||value.endsWith('-recast-me.sergz24.workers.dev');
}
export function readRecastLink(value,origin){
  const url=new URL(value,origin),current=new URL(origin);
  if(url.origin!==current.origin&&!(trustedRecastHost(url.hostname)&&trustedRecastHost(current.hostname)))throw new Error('Open this private link on a trusted Recast Me site.');
  const p=new URLSearchParams(url.hash.slice(1)),requestId=p.get('recast'),accessToken=p.get('key');
  if(!/^RC-[A-Z0-9-]{8,60}$/.test(requestId||'')||!accessToken||accessToken.length>128)throw new Error('Paste the complete private Recast link.');
  return{requestId,accessToken};
}
