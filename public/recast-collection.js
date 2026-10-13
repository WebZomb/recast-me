// A browser-only collection of private artwork pointers; no photos or clean pixels
// are duplicated into public browser storage, and no extra AI render is triggered.
const KEY='recast_saved_collection_v1';
export const COLLECTION_LIMIT=20;
export function savedRecasts(){
 try {
  const data=JSON.parse(localStorage.getItem(KEY)||'[]');
  if(!Array.isArray(data))return[];
  return data.filter(row=>/^RC-[A-Za-z0-9-]{1,100}$/.test(row?.requestId||'')
   &&/^[a-fA-F0-9]{64}$/.test(row?.accessToken||''))
   .slice(0,COLLECTION_LIMIT);
 }catch{return[]}
}
export function saveRecast(row){
 if(!/^RC-[A-Za-z0-9-]{1,100}$/.test(row?.requestId||'')
  || !/^[a-fA-F0-9]{64}$/.test(row?.accessToken||''))return {ok:false,error:'This private Recast link is unavailable. Select a saved version and try again.'};
 const old=savedRecasts(),without=old.filter(item=>item.requestId!==row.requestId);
 if(without.length>=COLLECTION_LIMIT)return {ok:false,error:'My Recasts is full (20). Remove one favorite first.'};
 const data=[{requestId:row.requestId,accessToken:row.accessToken,styleName:String(row.styleName||'Recast').slice(0,70),savedAt:new Date().toISOString()},...without];
 try{localStorage.setItem(KEY,JSON.stringify(data));return {ok:true,count:data.length}}
 catch{return{ok:false,error:'This browser could not save this picture. Keep its private link for recovery.'}}
}
export function removeRecast(id){
 if(!/^RC-[A-Za-z0-9-]{1,100}$/.test(id||''))return false;
 try{localStorage.setItem(KEY,JSON.stringify(savedRecasts().filter(x=>x.requestId!==id)));return true}
 catch{return false}
}
export function productLink(row){
 const url=new URL('/',location.origin);
 url.hash=new URLSearchParams({recast:row.requestId,key:row.accessToken,shop:'1'}).toString();
 return url.href;
}
