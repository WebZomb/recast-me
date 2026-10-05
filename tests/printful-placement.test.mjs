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
 assert.equal(response.status,200,await response.text());
 const record=await(await env.ARTWORK.get(`mockups/${ID}/RECAST-MUG-11OZ/task.json`)).json();
 assert.deepEqual(record.position,payload.files[0].position);
 assert.match(payload.files[0].image_url,/\/api\/print-source\//);
});
