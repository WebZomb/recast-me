import test from 'node:test';
import assert from 'node:assert/strict';
import {communityRoutes,selectCommunity} from '../src/community.js';
function setup(){
 const data=new Map();let revision=0;
 const env={ADMIN_TOKEN:'test-owner',SUBJECT_RATE_LIMITER:{limit:async()=>({success:true})},ARTWORK:{
 async get(key){const o=data.get(key);if(!o)return null;return {etag:o.etag,json:async()=>JSON.parse(o.value),body:o.value}},
 async put(key,value,opts={}){const old=data.get(key);if(opts.onlyIf?.etagMatches&&old?.etag!==opts.onlyIf.etagMatches)return null;if(opts.onlyIf instanceof Headers&&old)return null;data.set(key,{value,etag:String(++revision)});return {etag:String(revision)}},
 async delete(key){data.delete(key)}
 }};
 const deps={authorize:async(e,id,token)=>{if(token!=='secret')throw Object.assign(Error('Invalid artwork access token.'),{status:403});return {styleId:'royal',styleName:'Royal'}},preview:async()=>new Uint8Array([255,216,255]),admin:r=>{if(r.headers.get('authorization')!=='Bearer test-owner')throw Object.assign(Error('Owner required.'),{status:401})}};
 async function call(path,body,admin=false,ip='1.2.3.4',cookie=''){
 const request=new Request('https://recast.test'+path,{method:body?'POST':'GET',headers:{'x-recast-request':'1','cf-connecting-ip':ip,cookie,...(admin?{authorization:'Bearer test-owner'}:{})},...(body?{body:JSON.stringify(body)}:{})});return communityRoutes(request,env,deps);
 }
 return {call,env,deps,data};
}
const submission={requestId:'RC-TEST-123456',accessToken:'secret',consent:true};
test('submission stays private until owner review; public projection never leaks private artwork capability',async()=>{
 const f=setup();const first=await (await f.call('/api/community/submit',submission)).json();assert.equal(first.status,'pending');
 const second=await (await f.call('/api/community/submit',submission)).json();assert.equal(second.id,first.id);
 assert.deepEqual((await (await f.call('/api/community')).json()).posts,[]);
 assert.equal((await f.call(`/api/community/${first.id}/image`)).status,404);
 assert.equal((await f.call(`/api/community/${first.id}/review`,{status:'approved'})).status,403);
 await f.call(`/api/admin/community/${first.id}/review`,{status:'approved'},true);
 const listing=await (await f.call('/api/community')).json();assert.equal(listing.posts.length,1);assert.equal(listing.posts[0].styleId,'royal');
 assert.doesNotMatch(JSON.stringify(listing),/secret|requestId|accessToken|RC-TEST|voters|reporters/);
 assert.equal((await f.call(`/api/community/${first.id}/image`)).headers.get('content-type'),'image/jpeg');
});
test('requires consent, valid owner capability, preset style, same origin and active rate limiter',async()=>{
 const f=setup();assert.equal((await f.call('/api/community/submit',{...submission,consent:false})).status,400);
 assert.equal((await f.call('/api/community/submit',{...submission,accessToken:'wrong'})).status,403);
 f.deps.authorize=async()=>({styleId:'custom'});assert.equal((await f.call('/api/community/submit',submission)).status,400);
 f.env.SUBJECT_RATE_LIMITER.limit=async()=>({success:false});assert.equal((await f.call('/api/community/submit',submission)).status,429);
 const r=new Request('https://recast.test/api/community/submit',{method:'POST',headers:{origin:'https://evil.test'},body:JSON.stringify(submission)});assert.equal((await communityRoutes(r,f.env,f.deps)).status,403);
});
test('hearts are idempotent per network; report never publishes data; creator removal revokes image and favorites',async()=>{
 const f=setup(),{id}=await(await f.call('/api/community/submit',submission)).json();await f.call(`/api/admin/community/${id}/review`,{status:'approved'},true);
 for(let i=0;i<3;i++)await f.call(`/api/community/${id}/heart`,{active:true});
 let posts=(await(await f.call('/api/community')).json()).posts;assert.equal(posts[0].hearts,1);
 await f.call(`/api/community/${id}/heart`,{active:true},false,'2.3.4.5');
 posts=(await(await f.call('/api/community')).json()).posts;assert.equal(posts[0].hearts,2);
 await f.call(`/api/community/${id}/heart`,{active:false});
 assert.equal((await(await f.call('/api/community')).json()).posts[0].hearts,1);
 await f.call(`/api/community/${id}/report`,{});
 assert.equal((await f.call(`/api/community/${id}/remove`,{accessToken:'wrong'})).status,403);
 await f.call(`/api/community/${id}/remove`,{accessToken:'secret'});
 assert.equal((await f.call(`/api/community/${id}/image`)).status,404);
 assert.deepEqual((await(await f.call('/api/community?ids='+id)).json()).posts,[]);
});
test('New and Popular each cap at 100, never include pending, popular uses last 30 days',()=>{
 const now=Date.now(),rows=Array.from({length:120},(_,i)=>({id:String(i),styleId:'royal',styleName:'Royal',status:'approved',voters:Array(i).fill('a'),createdAt:new Date(now-i*1000).toISOString()}));
 rows.push({...rows[0],id:'old',voters:Array(500),createdAt:new Date(now-31*86400000).toISOString()},{...rows[0],id:'pending',status:'pending'});
 assert.equal(selectCommunity(rows,'new',now).length,100);assert.equal(selectCommunity(rows,'popular',now)[0].id,'119');assert.equal(selectCommunity(rows,'popular',now).length,100);assert.ok(!selectCommunity(rows,'new',now).some(r=>r.id==='pending'));
});
test('concurrent duplicate submissions and hearts keep one record and distinct votes',async()=>{
 const f=setup();const results=await Promise.all([f.call('/api/community/submit',submission),f.call('/api/community/submit',submission)]);const a=await results[0].json(),b=await results[1].json();assert.equal(a.id,b.id);
 await f.call(`/api/admin/community/${a.id}/review`,{status:'approved'},true);
 await Promise.all(['1','2','3'].map(ip=>f.call(`/api/community/${a.id}/heart`,{active:true},false,ip)));
 assert.equal((await(await f.call('/api/community')).json()).posts[0].hearts,3);
});

test('signed heart identity survives reload, IP changes and undo without duplicate votes',async()=>{
 const f=setup(),{id}=await(await f.call('/api/community/submit',submission)).json();
 await f.call(`/api/admin/community/${id}/review`,{status:'approved'},true);
 const first=await f.call('/api/community');const cookie=first.headers.get('set-cookie').split(';')[0];
 assert.match(first.headers.get('set-cookie'),/Secure; HttpOnly; SameSite=Lax/);
 await f.call(`/api/community/${id}/heart`,{active:true},false,'1.2.3.4',cookie);
 for(let i=0;i<3;i++)await f.call(`/api/community/${id}/heart`,{active:true},false,'9.8.7.6',cookie);
 let post=(await(await f.call('/api/community',null,false,'9.8.7.6',cookie)).json()).posts[0];
 assert.equal(post.hearts,1);assert.equal(post.liked,true);
 await f.call(`/api/community/${id}/heart`,{active:false},false,'9.8.7.6',cookie);
 post=(await(await f.call('/api/community',null,false,'9.8.7.6',cookie)).json()).posts[0];
 assert.equal(post.hearts,0);assert.equal(post.liked,false);
 await f.call(`/api/community/${id}/heart`,{active:true},false,'9.8.7.6',cookie);
 assert.equal((await(await f.call('/api/community',null,false,'9.8.7.6',cookie)).json()).posts[0].hearts,1);
});
test('tampered cookies cannot impersonate another network vote; legacy votes remain recognized',async()=>{
 const f=setup(),{id}=await(await f.call('/api/community/submit',submission)).json();
 await f.call(`/api/admin/community/${id}/review`,{status:'approved'},true);
 await f.call(`/api/community/${id}/heart`,{active:true});
 const first=await f.call('/api/community');const cookie=first.headers.get('set-cookie').split(';')[0];
 assert.equal((await first.json()).posts[0].liked,true);
 const forged=cookie.slice(0,-1)+(cookie.endsWith('0')?'1':'0');
 const response=await f.call('/api/community',null,false,'9.8.7.6',forged);
 assert.ok(response.headers.get('set-cookie'));assert.equal((await response.json()).posts[0].liked,false);
 await f.call(`/api/community/${id}/heart`,{active:false},false,'9.8.7.6',forged);
 assert.equal((await(await f.call('/api/community')).json()).posts[0].hearts,1);
});

test('viewer block hides contributor across New, Popular, favorites and image route without exposing identity',async()=>{
 const f=setup();const created=await f.call('/api/community/submit',submission);const cookie=created.headers.get('set-cookie').split(';')[0];const {id}=await created.json();
 const second=await(await f.call('/api/community/submit',{...submission,requestId:'RC-TEST-SECOND'},false,'8.8.8.8',cookie)).json();
 for(const item of [id,second.id])await f.call(`/api/admin/community/${item}/review`,{status:'approved'},true);
 const viewer=await f.call('/api/community',null,false,'9.9.9.9');const vc=viewer.headers.get('set-cookie').split(';')[0];
 assert.equal((await f.call(`/api/community/${id}/block`,{},false,'9.9.9.9',vc)).status,200);
 for(const url of ['/api/community','/api/community?sort=popular','/api/community?ids='+second.id])assert.deepEqual((await(await f.call(url,null,false,'10.10.10.10',vc)).json()).posts,[]);
 assert.equal((await f.call(`/api/community/${second.id}/image`,null,false,'10.10.10.10',vc)).status,404);
 const publicResult=await(await f.call('/api/community',null,false,'11.11.11.11')).json();assert.equal(publicResult.posts.length,2);assert.doesNotMatch(JSON.stringify(publicResult),/submitter|networkSubmitter|blockedSubmitters|viewerBlocks/);
 assert.equal((await f.call(`/api/admin/community/${id}/image`,null,true)).status,200);
});
test('admin ban hides all contributor posts, blocks new submissions across IP change and requires explicit unban/review',async()=>{
 const f=setup();const created=await f.call('/api/community/submit',submission);const cookie=created.headers.get('set-cookie').split(';')[0];const {id}=await created.json();
 await f.call(`/api/admin/community/${id}/review`,{status:'approved'},true);
 assert.equal((await f.call(`/api/community/${id}/ban`,{})).status,403);
 assert.equal((await f.call(`/api/admin/community/${id}/ban`,{},true)).status,200);
 assert.deepEqual((await(await f.call('/api/community')).json()).posts,[]);
 assert.equal((await f.call('/api/community/submit',{...submission,requestId:'RC-TEST-NEWBLOCK'},false,'8.8.8.8',cookie)).status,403);
 assert.equal((await f.call(`/api/admin/community/${id}/review`,{status:'approved'},true)).status,409);
 await f.call(`/api/admin/community/${id}/unban`,{},true);
 assert.deepEqual((await(await f.call('/api/community')).json()).posts,[]);
 assert.equal((await f.call(`/api/admin/community/${id}/review`,{status:'approved'},true)).status,200);
 assert.equal((await(await f.call('/api/community')).json()).posts.length,1);
});
test('legacy network-only submitter bans retain an admin recovery reference and prevent new submissions',async()=>{
 const f=setup(),{id}=await(await f.call('/api/community/submit',submission)).json();
 const key='community/v1/index.json',stored=f.data.get(key),state=JSON.parse(stored.value);state.rows[0].submitter=state.rows[0].networkSubmitter;delete state.rows[0].networkSubmitter;stored.value=JSON.stringify(state);
 await f.call(`/api/admin/community/${id}/ban`,{},true);assert.equal((await f.call(`/api/admin/community/${id}/remove`,{},true)).status,200);assert.equal((await(await f.call('/api/admin/community',null,true)).json()).posts[0].status,'removed');
 assert.equal((await f.call('/api/community/submit',{...submission,requestId:'RC-TEST-LEGACY'})).status,403);
});
