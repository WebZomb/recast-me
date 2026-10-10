// Privacy-first, first-party Recast site analytics. No external tracker,
// browser IP, full referrer URL, photo, note, customer token or order data kept.
// All write storage is aggregate HLL sketches + bounded category counters in R2.
import {change,read,equal,sameOrigin,privateJson,fault} from './commerce-store.js';

const PREFIX='analytics/site-v1/';
const P=7,M=1<<P,SHARDS=8,DAY=86400000;
const TYPES=new Set(['visit','page_view','creator_started','photo_added','adventure_selected','render_started','render_succeeded','render_failed','product_preview','checkout_clicked','credit_checkout','credit_redeemed']);
const PAGES=new Set(['home','credits','order','support','privacy']);
const SOURCES=new Set(['direct','internal','google','bing','search','instagram','facebook','tiktok','youtube','x','pinterest','email','other']);
const ID=/^[a-f0-9]{32}$/;
const SAFE_NAME=/^[a-z0-9][a-z0-9_-]{0,31}$/;
const blank=()=>({views:0,events:{},pages:{},sources:{},devices:{},countries:{},campaigns:{},adventures:{},visitors:Array(M).fill(0),sessions:Array(M).fill(0)});
const date=ms=>new Date(ms).toISOString().slice(0,10);
const addCount=(object,key,limit=100)=>{if(Object.hasOwn(object,key)){object[key]++;return;}if(Object.keys(object).length<limit)object[key]=1;else object.other=(object.other||0)+1};
function healthy(snapshot){
 return snapshot&&Array.isArray(snapshot.visitors)&&snapshot.visitors.length===M&&Array.isArray(snapshot.sessions)&&snapshot.sessions.length===M
   &&[...snapshot.visitors,...snapshot.sessions].every(n=>Number.isInteger(n)&&n>=0&&n<=58);
}
// HLL sketches preserve *only* approximate cardinalities, not the browser IDs
// themselves. A day/shard is ~700 bytes instead of storing a visitor database.
async function fingerprint(value){
 const data=new TextEncoder().encode(value);
 const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
 let h=0n;for(let i=0;i<8;i++)h=(h<<8n)|BigInt(digest[i]);
 const index=Number(h>>(64n-BigInt(P))),remaining=(h<<BigInt(P))&((1n<<64n)-1n);
 let rank=1;for(let i=63;i>=BigInt(P)&&!(remaining&(1n<<BigInt(i)));i--)rank++;
 return {index,rank};
}
function register(sketch,item){sketch[item.index]=Math.max(sketch[item.index],item.rank)}
function union(target,next){for(let i=0;i<M;i++)target[i]=Math.max(target[i],next[i])}
function estimate(registers){
 let sum=0,empty=0;
 for(const r of registers){sum+=2**-r;if(!r)empty++}
 const alpha=.7213/(1+1.079/M);
 const estimate=alpha*M*M/sum;
 const corrected=estimate<=2.5*M&&empty?M*Math.log(M/empty):estimate;
 return Math.round(corrected);
}
function countObject(total,sub){for(const [key,n] of Object.entries(sub||{}))total[key]=(total[key]||0)+Number(n||0)}
function top(obj,limit=9){return Object.entries(obj).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,limit).map(([name,count])=>({name,count}))}
function cleanEvent(body){
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length>9)throw fault('analytics_invalid','Invalid traffic event.',400);
 const {type,visitorId,sessionId,path,source,campaign,adventure}=body;
 if(!TYPES.has(type)||!ID.test(visitorId||'')||!ID.test(sessionId||'')||!PAGES.has(path))throw fault('analytics_invalid','Unsupported traffic event.',400);
 if(source!==undefined&&!SOURCES.has(source))throw fault('analytics_invalid','Unsupported referral category.',400);
 if(campaign!==undefined&&campaign!==''&&!SAFE_NAME.test(campaign))throw fault('analytics_invalid','Invalid campaign name.',400);
 if(adventure!==undefined&&adventure!==''&&!SAFE_NAME.test(adventure))throw fault('analytics_invalid','Invalid adventure.',400);
 return {type,visitorId,sessionId,path,source:source||'direct',campaign:campaign||'',adventure:adventure||''};
}
const isBot=request=>{
 const ua=request.headers.get('user-agent')||'';
 const score=request.cf?.botManagement?.score;
 return /(?:bot|crawler|spider|headless|prerender|lighthouse|facebookexternalhit|ChatGPT-User|Google-InspectionTool)/i.test(ua)
   ||(Number.isInteger(score)&&score<15);
};
const device=request=>{
 const ua=request.headers.get('user-agent')||'';
 return /ipad|tablet|silk|kindle|android(?!.*mobile)/i.test(ua)?'tablet':/iphone|ipod|android.*mobile|mobile/i.test(ua)?'mobile':'desktop';
};
async function ingest(request,env){
 sameOrigin(request);
 if(!env.ARTWORK)throw fault('analytics_storage','Traffic stats storage unavailable.',503);
 if(isBot(request)||request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return privateJson({ok:true,recorded:false,reason:'privacy_or_bot'},202);
 const size=Number(request.headers.get('content-length')||0);
 if(size>1024)throw fault('analytics_invalid','Traffic event is too large.',413);
 const raw=await request.text();if(raw.length>1024)throw fault('analytics_invalid','Traffic event is too large.',413);
 let body;try{body=cleanEvent(JSON.parse(raw))}catch(e){if(e.code)throw e;throw fault('analytics_invalid','Invalid traffic event.',400)}
 const now=Date.now(),today=date(now),shard=parseInt(body.visitorId.slice(0,2),16)%SHARDS;
 const key=PREFIX+today+'/'+shard+'.json';
 const visitorHash=await fingerprint('visitor:'+body.visitorId),sessionHash=await fingerprint('session:'+body.sessionId);
 const country=/^[A-Z]{2}$/.test(request.cf?.country||'')?request.cf.country:'Unknown';
 const capped=await change(env,key,blank(),old=>{
   if(!healthy(old))throw fault('analytics_storage','Site stats need owner review.',503);
   // Prevent a high-volume client from growing R2 write costs without bound.
   const total=Object.values(old.events).reduce((sum,n)=>sum+Number(n||0),0);
   if(total>=25000)return undefined;
   old.events[body.type]=(old.events[body.type]||0)+1;
   register(old.visitors,visitorHash);
   register(old.sessions,sessionHash);
   if(body.type==='visit'||body.type==='page_view'){old.views++;addCount(old.pages,body.path,6)}
   if(body.type==='visit'){
     addCount(old.sources,body.source,14);
     addCount(old.devices,device(request),3);
     addCount(old.countries,country,50);
     if(body.campaign)addCount(old.campaigns,body.campaign,30);
   }
   if(body.type==='adventure_selected'&&body.adventure)addCount(old.adventures,body.adventure,70);
   return old;
 });
 return privateJson({ok:true,recorded:true},202);
}
function authenticate(request,env){
 const bearer=(request.headers.get('authorization')||'').match(/^Bearer\s+(.+)$/i)?.[1]||request.headers.get('x-recast-admin');
 if(!env.ADMIN_TOKEN||!equal(bearer,env.ADMIN_TOKEN))throw fault('admin_required','Owner access required.',401);
}
export async function analyticsSummary(env,days=7,now=Date.now()){
 if(![1,7,30].includes(days))throw fault('range_invalid','Choose today, 7 days, or 30 days.',400);
 const totals={views:0,events:{},pages:{},sources:{},devices:{},countries:{},campaigns:{},adventures:{},visitors:Array(M).fill(0),sessions:Array(M).fill(0)};
 const history=[];
 for(let offset=days-1;offset>=0;offset--){
   const day=date(now-offset*DAY);
   const one={views:0,events:{},pages:{},sources:{},devices:{},countries:{},campaigns:{},adventures:{},visitors:Array(M).fill(0),sessions:Array(M).fill(0)};
   const snapshots=await Promise.all(Array.from({length:SHARDS},(_,shard)=>read(env,PREFIX+day+'/'+shard+'.json')));
   for(const row of snapshots){
     if(!row)continue;
     if(!healthy(row))throw fault('analytics_storage','Traffic summary needs owner review.',503);
     one.views+=Number(row.views||0);
     union(one.visitors,row.visitors);union(one.sessions,row.sessions);
     for(const key of ['events','pages','sources','devices','countries','campaigns','adventures'])countObject(one[key],row[key]);
   }
   totals.views+=one.views;
   union(totals.visitors,one.visitors);union(totals.sessions,one.sessions);
   for(const key of ['events','pages','sources','devices','countries','campaigns','adventures'])countObject(totals[key],one[key]);
   history.push({date:day,visitors:estimate(one.visitors),sessions:estimate(one.sessions),pageViews:one.views,renderStarted:one.events.render_started||0,renderSucceeded:one.events.render_succeeded||0,checkoutClicks:one.events.checkout_clicked||0});
 }
 const e=totals.events;
 return {ok:true,days,timezone:'UTC',method:'First-party, opt-out aware; anonymous browser/session HyperLogLog estimates; visits/clicks are not verified purchases.',
  totals:{visitors:estimate(totals.visitors),sessions:estimate(totals.sessions),pageViews:totals.views,creatorStarts:e.creator_started||0,
   photosAdded:e.photo_added||0,renderAttempts:e.render_started||0,renderSuccesses:e.render_succeeded||0,renderFailures:e.render_failed||0,
   productPreviews:e.product_preview||0,checkoutClicks:e.checkout_clicked||0,creditCheckoutClicks:e.credit_checkout||0,redemptions:e.credit_redeemed||0,
   adventuresPicked:e.adventure_selected||0},
  timeline:history,topPages:top(totals.pages),sources:top(totals.sources),devices:top(totals.devices),
  countries:top(totals.countries,8),campaigns:top(totals.campaigns,10),adventures:top(totals.adventures,10),
  note:'Website tracking begins with this release. Browser privacy opt-outs, blockers, bots and off-site Shopify visits are not counted. Verify paid Shopify sales separately in Shopify Analytics.'};
}
export async function trafficRoutes(request,env){
 const url=new URL(request.url);
 if(!['/api/analytics/event','/api/admin/traffic'].includes(url.pathname))return null;
 try{
  if(url.pathname==='/api/analytics/event'){
    if(request.method!=='POST')return privateJson({ok:false,error:'Method not allowed'},405);
    if(env.SITE_ANALYTICS_ENABLED!=='true')return privateJson({ok:true,recorded:false},202);
    return await ingest(request,env);
  }
  authenticate(request,env);
  if(request.method!=='GET')return privateJson({ok:false,error:'Method not allowed'},405);
  return privateJson(await analyticsSummary(env,Number(url.searchParams.get('days')||'7')));
 }catch(error){
  return privateJson({ok:false,error:error.message||'Traffic stats are temporarily unavailable.',code:error.code||'analytics_unavailable'},error.status||503);
 }
}
