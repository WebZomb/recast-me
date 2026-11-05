// Request-local concurrency only: no stale price, approval or availability cache.
// Each offer still crosses the complete existing verification function.
export const SHOP_CATALOG_READ_CONCURRENCY=4;
export async function collectVerifiedShopOffers(offers,verify){
 if(!Array.isArray(offers)||offers.length>500||typeof verify!=='function')throw new TypeError('Invalid catalog verification input.');
 const result=new Array(offers.length);let cursor=0;
 async function worker(){
  while(cursor<offers.length){
   const index=cursor++;
   try{result[index]=await verify(offers[index],index);}catch{/* Invalid or unavailable offers stay hidden. */}
  }
 }
 await Promise.all(Array.from({length:Math.min(SHOP_CATALOG_READ_CONCURRENCY,offers.length)},worker));
 return result.filter(offer=>offer!==undefined&&offer!==null);
}
