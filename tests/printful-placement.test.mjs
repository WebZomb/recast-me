import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockup,mockupPosition} from '../src/workflow.js';
import {setup,ID,TOKEN} from './security-helpers.mjs';
const catalog={printfiles:[{printfile_id:43,width:2700,height:1050}],variant_printfiles:[{variant_id:1320,placements:{default:43}}]};
test('recommended product composition owns the full Printful area and uses selected variant mapping',()=>{
 assert.deepEqual(mockupPosition(catalog,1320,'default',{width:1024,height:1280,product:'Mug'}),{area_width:2700,area_height:1050,width:2700,height:1050,top:0,left:0});
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
 const data=await response.json();assert.match(data.mockupId,/^v4-Mug-two-sided-ambient-/);
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
 const single=await submit({product:'Mug',layout:'single',fill:'ambient',x:'center',scale:92});
 const double=await submit({product:'Mug',layout:'two-sided',fill:'ambient',x:'center',scale:115});
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
  const design={product:'Mug',layout:'two-sided',fill:'ambient',x:'center',scale:100,spacing};
  const r=await createMockup(new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku:'RECAST-MUG-11OZ',design})}),env);
  assert.equal(r.status,200);return r.json();
 };
 const close=await send('close'),wide=await send('wide');
 assert.notEqual(close.mockupId,wide.mockupId);assert.match(close.mockupId,/close$/);assert.match(wide.mockupId,/wide$/);assert.equal(tasks,2);
});


test('blanket recommended setup submits a full-bleed composed source',async t=>{
 const blanketCatalog={printfiles:[{printfile_id:99,width:7500,height:9000}],variant_printfiles:[{variant_id:10986,placements:{default:99}}]};
 const env=await setup({PRINTFUL_API_TOKEN:'test-only',PRINTFUL_STORE_ID:'123'});let payload;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  if(String(url).endsWith('/printfiles/395'))return Response.json({result:blanketCatalog});
  if(String(url).endsWith('/create-task/395')){payload=JSON.parse(options.body);return Response.json({result:{task_key:'blanket',status:'pending'}})}
  throw Error('unexpected '+url);
 });
 const r=await createMockup(new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku:'RECAST-BLANKET-50X60'})}),env);
 assert.equal(r.status,200);const data=await r.json();
 assert.match(data.mockupId,/^v4-Blanket-cover-full-bleed-/);
 assert.deepEqual(payload.files[0].position,{area_width:7500,area_height:9000,width:7500,height:9000,top:0,left:0});
 assert.match(payload.files[0].image_url,/product=Blanket/);assert.match(payload.files[0].image_url,/layout=cover/);
});
