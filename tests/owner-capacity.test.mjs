import test from 'node:test';
import assert from 'node:assert/strict';
import {Bucket} from './security-helpers.mjs';
import {hash} from '../src/commerce-store.js';
import {ownerCapacitySnapshot} from '../src/owner-capacity.js';
import {ownerSettingsRoute,withOwnerSettings,policyFromEnv,SETTINGS_KEY} from '../src/owner-settings.js';
import {screeningCapacity,subjectDetectionLimit} from '../src/capacity-policy.js';
const now=new Date('2026-10-17T23:59:59Z'),day='2026-10-17';
const req=(method='GET',token='owner-fixture')=>new Request('https://recast.test/api/admin/capacity',{method,headers:{authorization:`Bearer ${token}`,'cf-connecting-ip':'192.0.2.10'}});
const env=()=>({ARTWORK:new Bucket(),ADMIN_TOKEN:'owner-fixture',CONTENT_MODERATION_ENABLED:'true',MODERATION_OPENAI_API_KEY:'screen-fixture',SUBJECT_DETECTION_ENABLED:'true'});
test('capacity route authenticates before reading and never accepts a mutation',async()=>{
  const e=env();let reads=0;e.ARTWORK.get=async()=>{reads++;return null;};
  assert.equal((await ownerSettingsRoute(req('GET','wrong'),e)).status,401);assert.equal(reads,0);
  for(const method of ['POST','PUT','DELETE'])assert.equal((await ownerSettingsRoute(req(method),e)).status,405);
  assert.equal(reads,0);
  const response=await ownerSettingsRoute(req(),e);assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);
});
test('absent counters and dependencies remain unknown, not zero or full capacity',async()=>{
  for(const e of [env(),{ADMIN_TOKEN:'owner-fixture'}]){
    const result=await ownerCapacitySnapshot(req(),e,now);
    for(const row of result.rows){assert.equal(row.used,null);assert.equal(row.remaining,null);}
    assert.equal(result.resetAt,'2026-10-18T00:00:00.000Z');
  }
});
test('exact limits and failures are read without modifying state or leaking network identifiers',async()=>{
  const e=env(),uploadHash=await hash('owner-fixture:photo:192.0.2.10'),network=await hash('private-salt:192.0.2.10');
  const records={
    [`security/free-screening-budget/${day}.json`]:{count:200},
    [`security/subject-detection/${day}/total.json`]:{used:199},
    [`security/photo-uploads/${day}/${uploadHash}.json`]:{count:10},
    'security/subject-detection/private-salt.json':{salt:'private-salt'},
    [`security/subject-detection/subjects-v3/${day}/${network}.json`]:{checks:{a:{status:'done'},b:{status:'pending'},c:{status:'failed'}}}
  };
  for(const [k,v] of Object.entries(records))await e.ARTWORK.put(k,JSON.stringify(v));
  const serial=e.ARTWORK.serial;e.ARTWORK.put=()=>{throw Error('read must not write');};e.ARTWORK.list=()=>{throw Error('no scanning');};
  const d=await ownerCapacitySnapshot(req(),e,now),rows=Object.fromEntries(d.rows.map(x=>[x.id,x]));
  assert.equal(rows.screening.remaining,0);assert.equal(rows['subject-site'].remaining,1);assert.equal(rows['original-network'].remaining,0);assert.equal(rows['subject-network'].used,3);
  assert.equal(e.ARTWORK.serial,serial);
  const json=JSON.stringify(d);for(const value of ['private-salt','owner-fixture','screen-fixture','192.0.2.10',uploadHash,network])assert.ok(!json.includes(value));
  const next=await ownerCapacitySnapshot(req(),e,new Date('2026-10-18T00:00:00Z'));assert.equal(next.rows[0].used,null);
});
test('corrupt or inaccessible counters cannot appear healthy and raw errors stay private',async()=>{
  const e=env();await e.ARTWORK.put(`security/free-screening-budget/${day}.json`,JSON.stringify({count:-1}));
  let d=await ownerCapacitySnapshot(req(),e,now);assert.equal(d.rows[0].usageStatus,'invalid');assert.equal(d.rows[0].remaining,null);
  e.ARTWORK.get=()=>{throw Error('private credential detail');};d=await ownerCapacitySnapshot(req(),e,now);
  assert.ok(d.rows.every(x=>x.used===null));assert.ok(!JSON.stringify(d).includes('private credential detail'));
});
test('effective screening fallback and subject limits retain enforcement semantics',()=>{
  for(const value of [undefined,'',0])assert.equal(screeningCapacity({CONTENT_SCREENING_DAILY_LIMIT:value}).limit,200);
  assert.deepEqual(screeningCapacity({CONTENT_SCREENING_DAILY_LIMIT:'1000'}),{limit:1000,source:'environment'});
  for(const value of ['0','1001','bad'])assert.deepEqual(screeningCapacity({CONTENT_SCREENING_DAILY_LIMIT:value}),{limit:200,source:'invalid_environment_fallback'});
  assert.equal(subjectDetectionLimit({LIMIT:'0'},'LIMIT',200),0);
  assert.throws(()=>subjectDetectionLimit({LIMIT:'1001'},'LIMIT',200),e=>e.code==='detection_config');
});
test('invalid subject configuration is visible and unavailable current network is not fabricated',async()=>{
  const e={...env(),SUBJECT_DETECTION_DAILY_LIMIT:'bad',SUBJECT_DETECTION_NETWORK_LIMIT:'0'};
  const d=await ownerCapacitySnapshot(new Request('https://recast.test/'),e,now);
  assert.equal(d.rows[1].limit,null);assert.equal(d.rows[1].source,'invalid_environment');assert.equal(d.rows[2].limit,0);assert.equal(d.rows[3].usageStatus,'unavailable');
});
test('saved capacity values report admin origin without changing enforcement or counters',async()=>{
  const e={...env(),CONTENT_SCREENING_DAILY_LIMIT:'200',SUBJECT_DETECTION_DAILY_LIMIT:'200',SUBJECT_DETECTION_NETWORK_LIMIT:'20'};
  const values={...policyFromEnv(e),screeningDaily:250,subjectDaily:300,subjectNetwork:0};
  await e.ARTWORK.put(SETTINGS_KEY,JSON.stringify({revision:1,values,history:[]}));
  const serial=e.ARTWORK.serial;e.ARTWORK.put=()=>{throw Error('diagnostics must not write');};
  const active=await withOwnerSettings(e),response=await ownerSettingsRoute(req(),active),d=await response.json();
  assert.deepEqual(d.rows.slice(0,3).map(r=>[r.limit,r.source]),[[250,'owner_settings'],[300,'owner_settings'],[0,'owner_settings']]);
  assert.equal(screeningCapacity(active).limit,250);assert.equal(subjectDetectionLimit(active,'SUBJECT_DETECTION_NETWORK_LIMIT',20),0);
  assert.equal(d.rows[3].source,'code');assert.equal(e.ARTWORK.serial,serial);assert.equal(await withOwnerSettings(active),active);
  assert.equal(e.CONTENT_SCREENING_DAILY_LIMIT,'200');
});
test('legacy saved settings retain actual inherited default environment and fallback origins',async()=>{
  for(const raw of [undefined,'275','bad']){
    const e={...env(),CONTENT_SCREENING_DAILY_LIMIT:raw,SUBJECT_DETECTION_DAILY_LIMIT:'350'};
    const values=policyFromEnv(e);delete values.screeningDaily;delete values.subjectDaily;delete values.subjectNetwork;
    await e.ARTWORK.put(SETTINGS_KEY,JSON.stringify({revision:1,values,history:[]}));
    const d=await ownerCapacitySnapshot(req(),await withOwnerSettings(e),now);
    assert.deepEqual(d.rows.slice(0,3).map(r=>r.source),[raw===undefined?'default':raw==='bad'?'invalid_environment_fallback':'environment','environment','default']);
    assert.equal(d.rows[0].limit,raw==='275'?275:200);
  }
});
test('without saved settings defaults and environment sources remain unchanged',async()=>{
  const e={...env(),SUBJECT_DETECTION_NETWORK_LIMIT:'0'},active=await withOwnerSettings(e);
  const d=await ownerCapacitySnapshot(req(),active,now);
  assert.deepEqual(d.rows.map(r=>r.source),['default','default','environment','code']);
});
