// Owner-only metadata view of attempted fal jobs; never fetches source images,
// customer tokens, full prompts or paid inference. Protected by requireOwner in router.
const KEY_PREFIX='system/providers/fal-jobs/';
const ALLOWED_STATUS=new Set(['submitting','rejected_before_ack','accepted','completed','pending_for_recovery','accepted_unknown_outcome','submission_uncertain','result-error','still-pending']);
const allowedKey=/^system\/providers\/fal-jobs\/[a-zA-Z0-9._-]{10,100}\.json$/;
const safe=x=>typeof x==='string'?x.slice(0,160):null;
export async function providerJobIndex(env,search=new URLSearchParams()){
 if(!env.ARTWORK?.list||!env.ARTWORK?.get)throw Object.assign(new Error('Private provider records are unavailable.'),{status:503,code:'provider_ledger_unavailable'});
 const cursor=String(search.get('cursor')||'');
 if(cursor.length>800||(!/^[a-zA-Z0-9+/=_:.-]*$/.test(cursor)))throw Object.assign(new Error('Invalid jobs page cursor.'),{status:400,code:'invalid_cursor'});
 const batch=await env.ARTWORK.list({prefix:KEY_PREFIX,limit:60,...(cursor?{cursor}:{})});
 const items=[];
 for(const entry of batch.objects||[]){
  if(!allowedKey.test(entry.key))continue;
  const row=await env.ARTWORK.get(entry.key);if(!row)continue;
  let record;try{record=await row.json()}catch{continue}
  if(!record||typeof record!=='object')continue;
  const status=ALLOWED_STATUS.has(record.status)?record.status:'needs_review';
  items.push({attemptId:entry.key.slice(KEY_PREFIX.length,-5),
   status,model:'FLUX.2 dev',provider:'fal',requestId:safe(record.requestId),createdAt:safe(record.startedAt),
   updatedAt:safe(record.updatedAt),completedAt:safe(record.completedAt),imageCount:Number.isSafeInteger(record.imageCount)?record.imageCount:null,
   lastError:safe(record.error),bytes:Number.isSafeInteger(record.bytes)?record.bytes:null});
 }
 items.sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));
 return {ok:true,items,cursor:batch.truncated?String(batch.cursor||''):null,hasMore:Boolean(batch.truncated)};
}
