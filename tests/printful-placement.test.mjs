import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockup,mockupPosition} from '../src/workflow.js';
import {setup,ID,TOKEN} from './security-helpers.mjs';
const catalog={printfiles:[{printfile_id:43,width:2700,height:1050}],variant_printfiles:[{variant_id:1320,placements:{default:43}}]};
test('portrait fits mug without stretching or cropping and uses selected variant mapping',()=>{
 assert.deepEqual(mockupPosition(catalog,1320,'default',{width:1024,height:1280}),{area_width:2700,area_height:1050,width:840,height:1050,top:0,left:930});
 assert.throws(()=>mockupPosition(catalog,4830,'default',{width:1024,height:1280}),/dimensions/);
});
test('mockup submission sends provider dimensions and persists placement for print approval',async t=>{
 const env=await setup({PRINTFUL_API_TOKEN:'test-only',PRINTFUL_STORE_ID:'123'});let payload;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  if(String(url).endsWith('/printfiles/19'))return Response.json({result:catalog});
  assert.ok(String(url).endsWith('/create-task/19'));payload=JSON.parse(options.body);
  assert.ok(payload.files[0].position);assert.equal(payload.files[0].placement,'default');
  return Response.json({result:{task_key:'test-task',status:'pending'}});
 });
 const response=await createMockup(new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku:'RECAST-MUG-11OZ'})}),env);
 assert.equal(response.status,200);
 const data=await response.json();assert.match(data.mockupId,/^v3-/);
 const record=await(await env.ARTWORK.get(`mockups/${ID}/RECAST-MUG-11OZ/${data.mockupId}/task.json`)).json();
 assert.deepEqual(record.position,payload.files[0].position);
 assert.match(payload.files[0].image_url,/\/api\/print-source\//);
});


test('different mug layouts receive isolated provider task records',async t=>{
 const env=await setup({PRINTFUL_API_TOKEN:'test-only',PRINTFUL_STORE_ID:'123'});let tasks=0;
 t.mock.method(globalThis,'fetch',async(url)=>{
  if(String(url).endsWith('/printfiles/19'))return Response.json({result:catalog});
  if(String(url).endsWith('/create-task/19'))return Response.json({result:{task_key:'task-'+(++tasks),status:'pending'}});
  throw Error('unexpected '+url);
 });
 const submit=async design=>{
  const r=await createMockup(new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku:'RECAST-MUG-11OZ',design})}),env);
  assert.equal(r.status,200);return r.json();
 };
 const single=await submit({product:'Mug',layout:'single',background:'scene-fill',x:'center',scale:92});
 const double=await submit({product:'Mug',layout:'two-sided',background:'scene-fill',x:'center',scale:115});
 assert.notEqual(single.mockupId,double.mockupId);assert.equal(tasks,2);
 assert.ok(await env.ARTWORK.get(`mockups/${ID}/RECAST-MUG-11OZ/${single.mockupId}/task.json`));
 assert.ok(await env.ARTWORK.get(`mockups/${ID}/RECAST-MUG-11OZ/${double.mockupId}/task.json`));
});


test('two-sided spacing changes isolate mockup identity',async t=>{
 const env=await setup({PRINTFUL_API_TOKEN:'test-only',PRINTFUL_STORE_ID:'123'});let tasks=0;
 t.mock.method(globalThis,'fetch',async url=>{
  if(String(url).endsWith('/printfiles/19'))return Response.json({result:catalog});
  if(String(url).endsWith('/create-task/19'))return Response.json({result:{task_key:'spacing-'+(++tasks),status:'pending'}});
  throw Error('unexpected '+url);
 });
 const send=async spacing=>{
  const design={product:'Mug',layout:'two-sided',background:'scene-fill',x:'center',scale:100,spacing};
  const r=await createMockup(new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku:'RECAST-MUG-11OZ',design})}),env);
  assert.equal(r.status,200);return r.json();
 };
 const close=await send('close'),wide=await send('wide');
 assert.notEqual(close.mockupId,wide.mockupId);assert.match(close.mockupId,/close$/);assert.match(wide.mockupId,/wide$/);assert.equal(tasks,2);
});
