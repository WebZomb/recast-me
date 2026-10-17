import {hash} from './commerce-store.js';
import {moderationReadiness} from './content-safety.js';
import {SUBJECT_VERSION} from './subject-detection.js';
import {screeningCapacity,subjectDetectionLimit,ORIGINAL_PHOTO_DAILY_LIMIT} from './capacity-policy.js';

// Read only. Never initializes a salt, claims capacity, probes a provider or writes a ledger.
async function record(env,key){
  if(!env.ARTWORK||!key)return {status:'unavailable'};
  try{
    const object=await env.ARTWORK.get(key);
    if(!object)return {status:'not_recorded'};
    const value=await object.json();
    return value&&typeof value==='object'&&!Array.isArray(value)?{status:'recorded',value}:{status:'invalid'};
  }catch{return {status:'unavailable'};}
}
function usage(row,field){
  if(row.status!=='recorded')return {used:null,usageStatus:row.status};
  const used=row.value[field];
  return Number.isSafeInteger(used)&&used>=0?{used,usageStatus:'recorded'}:{used:null,usageStatus:'invalid'};
}
function detectionPolicy(env,key,fallback){
  try{return {limit:subjectDetectionLimit(env,key,fallback),source:env[key]==null?'default':'environment'};}
  catch{return {limit:null,source:'invalid_environment'};}
}
function capacity(id,label,policy,count,extra={}){
  return {id,label,...policy,...count,remaining:Number.isSafeInteger(policy.limit)&&count.used!==null?Math.max(0,policy.limit-count.used):null,...extra};
}
export async function ownerCapacitySnapshot(request,env,now=new Date()){
  const day=now.toISOString().slice(0,10),resetAt=new Date(Date.parse(day+'T00:00:00Z')+86400000).toISOString();
  const ip=request.headers.get('cf-connecting-ip'),salt=env.CREDIT_IP_SALT||env.ADMIN_TOKEN;
  const uploadKey=ip&&salt?`security/photo-uploads/${day}/${await hash(`${salt}:photo:${ip}`)}.json`:null;
  const [screen,subjects,uploads,subjectSalt]=await Promise.all([
    record(env,`security/free-screening-budget/${day}.json`),
    record(env,`security/subject-detection/${day}/total.json`),
    record(env,uploadKey),record(env,'security/subject-detection/private-salt.json')
  ]);
  let networkUsage={used:null,usageStatus:'unavailable'};
  if(ip&&subjectSalt.status==='recorded'&&typeof subjectSalt.value.salt==='string'&&subjectSalt.value.salt){
    const network=await hash(subjectSalt.value.salt+':'+ip);
    const row=await record(env,`security/subject-detection/${SUBJECT_VERSION}/${day}/${network}.json`);
    if(row.status==='recorded'){
      const checks=row.value.checks;
      networkUsage=checks&&typeof checks==='object'&&!Array.isArray(checks)
        ?{used:Object.keys(checks).length,usageStatus:'recorded'}:{used:null,usageStatus:'invalid'};
    }else networkUsage={used:null,usageStatus:row.status};
  }
  const moderation=moderationReadiness(env);
  return {ok:true,checkedAt:now.toISOString(),day,timezone:'UTC',resetAt,rows:[
    capacity('screening','Photo screening',screeningCapacity(env),usage(screen,'count'),{
      scope:'Site-wide',enabled:moderation.enabled,configured:moderation.configured,
      note:'Shared by photo uploads and uncached artwork checks at checkout. Reserved before screening; failures and rejections consume slots. Configuration is not a provider health check.'}),
    capacity('subject-site','Subject detection',detectionPolicy(env,'SUBJECT_DETECTION_DAILY_LIMIT',200),usage(subjects,'used'),{
      scope:'Site-wide',enabled:env.SUBJECT_DETECTION_ENABLED==='true'&&env.RENDER_PAUSED!=='true',
      note:'Separate from rendering and moderation. Counts reserved classification attempts.'}),
    capacity('subject-network','Subject detection on this network',detectionPolicy(env,'SUBJECT_DETECTION_NETWORK_LIMIT',20),networkUsage,{
      scope:'Current request network only',enabled:env.SUBJECT_DETECTION_ENABLED==='true'&&env.RENDER_PAUSED!=='true',
      note:'Unique photo hashes, including pending and failed checks. Completed duplicates reuse their result.'}),
    capacity('original-network','Original-photo uploads on this network',{limit:ORIGINAL_PHOTO_DAILY_LIMIT,source:'code'},usage(uploads,'count'),{
      scope:'Current request network only',
      note:'Reserved before dimensions and screening; later failures consume slots. No AI rendering, but storage, image processing and screening still apply.'})
  ],note:'Read-only snapshot. Missing or unreadable counters are unknown, not zero. Network rows are not site totals or per-person allowances. All four counters reset at midnight UTC; render credits use separate rolling 24-hour windows. Provider balance, burst-limit usage and actual alert delivery are not measured here.'};
}
