// Complete every started operation before returning an error. Never retry writes.
export async function forEachBounded(items,task,limit=4){
 if(!Array.isArray(items)||!Number.isInteger(limit)||limit<1||limit>4)throw new TypeError('Invalid bounded work.');
 let cursor=0,failed=false,failure;
 async function worker(){
  while(!failed&&cursor<items.length){
   const index=cursor++;
   try{await task(items[index],index);}catch(error){failed=true;failure=error;}
  }
 }
 await Promise.all(Array.from({length:Math.min(limit,items.length)},worker));
 if(failed)throw failure;
}
