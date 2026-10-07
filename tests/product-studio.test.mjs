import test from 'node:test';
import assert from 'node:assert/strict';
import {selectMockupGroups,rankMockupCandidates} from '../src/product-gallery.js';
import {selectV2MockupSpec,loadV2MockupSpec,v2MockupPayload,v2CreatedTask,v2PolledTask} from '../src/printful-v2-mockup.js';
import {createMockup,mockupStatus} from '../src/workflow.js';
import {setup,ID,TOKEN,CLEAN} from './security-helpers.mjs';
const map={product:'Tumbler',printfulProductId:909,printfulVariantId:23470,preferredPlacement:'default'};
const variant={id:23470,catalog_product_id:909};
const row={placement:'default',technique:'sublimation',print_area_type:'simple',print_area_width:'9',print_area_height:'7',dpi:150,mockup_styles:[{id:12,category_name:'Lifestyle kitchen',view_name:'Kitchen view',restricted_to_variants:null},{id:13,category_name:'Flat',view_name:'Front',restricted_to_variants:[23470]},{id:14,category_name:'Flat',view_name:'Side',restricted_to_variants:[999]}]};
test('lifestyle groups are selected only when actually supported; apparel keeps a studio view',()=>{
 const catalog={option_groups:['Christmas','Lifestyle kitchen','Flat','Lifestyle living room']};
 assert.deepEqual(selectMockupGroups(catalog,'Mug'),['Lifestyle kitchen','Flat']);assert.deepEqual(selectMockupGroups(catalog,'T-Shirt'),['Flat']);
 assert.deepEqual(selectMockupGroups({option_groups:['Christmas']},'Mug'),[]);assert.deepEqual(selectMockupGroups({},'Canvas'),[]);
});
test('candidate ordering prefers lifestyle except for apparel and deduplicates URLs',()=>{
 const views=[{url:'a',title:'Default'},{url:'b',title:'Front'},{url:'c',title:'Scene',group:'Lifestyle'},{url:'c',title:'Duplicate'}];
 assert.equal(rankMockupCandidates(views,'Canvas')[0].url,'c');assert.equal(rankMockupCandidates(views,'Hoodie')[0].url,'a');assert.equal(rankMockupCandidates(views,'Mug').length,3);
});
test('tumbler V2 uses exact catalog identity, supported style and dimensional conversion',()=>{
 const spec=selectV2MockupSpec(map,variant,[row]);assert.deepEqual(spec.styles.map(s=>s.id),[12,13]);
 assert.deepEqual(spec.position,{area_width:1350,area_height:1050,width:1350,height:1050,top:0,left:0});
 const payload=v2MockupPayload(map,spec,'https://recast.test/protected-print-source');assert.deepEqual(payload.products[0].catalog_variant_ids,[23470]);assert.equal(payload.products[0].placements[0].layers[0].position.width,9);assert.equal(payload.format,'jpg');
});
test('V2 refuses mismatched identities, unspecified restrictions and unsupported complex geometry',()=>{
 assert.throws(()=>selectV2MockupSpec(map,{...variant,id:1},[row]),/identity/);
 assert.throws(()=>selectV2MockupSpec(map,{...variant,catalog_product_id:1},[row]),/identity/);
 for(const change of [{placement:'front'},{technique:'embroidery'},{print_area_type:'advanced'},{dpi:0},{print_area_width:Infinity},{mockup_styles:[{id:15,category_name:'Flat'}]}])assert.throws(()=>selectV2MockupSpec(map,variant,[{...row,...change}]),/compatible/);
});
test('catalog loading is exact-product, bounded and reads only',async()=>{
 const calls=[];const call=async(path,options)=>{calls.push({path,options});return path.includes('catalog-variants')?{data:variant}:{data:[row]}};
 await loadV2MockupSpec(call,map);assert.equal(calls.length,2);assert.ok(calls.every(c=>c.options.method==='GET'));assert.match(calls[1].path,/catalog-products\/909\/mockup-styles\?placements=default/);
});
test('V2 task handling fails closed on wrong task, variants, placements or provider failures',()=>{
 assert.throws(()=>v2CreatedTask({data:[]}),/task/);assert.deepEqual(v2CreatedTask({data:[{id:123,status:'pending'}]}),{task_key:'123',status:'pending'});
 const record={taskKey:'123',printfulVariantId:23470,v2Spec:selectV2MockupSpec(map,variant,[row])};
 const body={data:[{id:123,status:'completed',catalog_variant_mockups:[{catalog_variant_id:23470,mockups:[{placement:'default',technique:'sublimation',style_id:12,mockup_url:'https://provider.test/mockup.jpg'}]}]}]};
 assert.equal(v2PolledTask(body,record).mockups[0].option_group,'Lifestyle kitchen');
 assert.throws(()=>v2PolledTask(body,{...record,taskKey:'321'}),/exact/);
 assert.throws(()=>v2PolledTask(body,{...record,printfulVariantId:999}),/exact/);
 assert.equal(v2PolledTask({data:[{id:123,status:'pending'}]},record).status,'pending');
 assert.equal(v2PolledTask({data:[{id:123,status:'failed',failure_reasons:[{detail:'Rejected file'}]}]},record).status,'failed');
});
const req=(sku,design)=>new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku,design})});
test('missing V1 tumbler area takes validated V2 path, then polls exact task and preserves proof position',async t=>{
 const env=await setup({PRINTFUL_API_TOKEN:'fixture-only'}),calls=[];let payload;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const u=String(url);calls.push(u);
  if(u.endsWith('/printfiles/909'))return Response.json({result:{printfiles:[],variant_printfiles:[]}});
  if(u.endsWith('/v2/catalog-variants/23470'))return Response.json({data:variant});
  if(u.includes('/v2/catalog-products/909/mockup-styles'))return Response.json({data:[row]});
  if(u.endsWith('/v2/mockup-tasks')){payload=JSON.parse(options.body);return Response.json({data:[{id:100,status:'pending'}]})}
  if(u.endsWith('/v2/mockup-tasks?id=100'))return Response.json({data:[{id:100,status:'completed',catalog_variant_mockups:[{catalog_variant_id:23470,mockups:[{placement:'default',technique:'sublimation',style_id:12,mockup_url:'https://mockup.example.com/fixture.jpg'}]}]}]});
  if(u==='https://mockup.example.com/fixture.jpg')return new Response(CLEAN,{headers:{'content-type':'image/jpeg'}});
  throw Error('unexpected '+u);
 });
 const created=await createMockup(req('RECAST-TUMBLER-20OZ'),env),data=await created.json();assert.equal(created.status,200,JSON.stringify(data));assert.match(data.mockupId,/studio2/);
 assert.equal(payload.products[0].catalog_product_id,909);assert.equal(payload.products[0].placements[0].layers[0].position.height,7);
 const p=new URL(payload.products[0].placements[0].layers[0].url);assert.equal(p.searchParams.get('areaWidth'),'1350');assert.equal(p.searchParams.get('version'),'4');
 const task=await(await env.ARTWORK.get(`mockups/${ID}/RECAST-TUMBLER-20OZ/${data.mockupId}/task.json`)).json();assert.equal(task.providerApi,'v2');
 const status=await mockupStatus(new Request(`https://recast.test/api/mockup/status?requestId=${ID}&token=${TOKEN}&sku=RECAST-TUMBLER-20OZ&mockup=${data.mockupId}`),env);const proof=await status.json();assert.equal(proof.status,'completed',JSON.stringify(proof));assert.equal(proof.images[0].group,'Lifestyle kitchen');assert.equal(proof.position.area_width,1350);
 const count=calls.length;await createMockup(req('RECAST-TUMBLER-20OZ'),env);assert.equal(calls.length,count,'no duplicate provider task');
});
test('working V1 products do not use V2; new gallery task does not overwrite old proof',async t=>{
 const env=await setup({PRINTFUL_API_TOKEN:'fixture'});let payload;
 const oldKey=`mockups/${ID}/RECAST-MUG-11OZ/v4-Mug-two-sided-ambient-center-110-standard/task.json`;await env.ARTWORK.put(oldKey,JSON.stringify({approvedAt:'old',images:[{url:'old-proof'}]}));
 t.mock.method(globalThis,'fetch',async(url,options)=>{
   if(String(url).endsWith('/printfiles/19'))return Response.json({result:{option_groups:['Lifestyle kitchen','Flat'],printfiles:[{printfile_id:43,width:2700,height:1050}],variant_printfiles:[{variant_id:1320,placements:{default:43}}]}});
   assert.ok(String(url).endsWith('/create-task/19'));payload=JSON.parse(options.body);return Response.json({result:{task_key:'new-gallery',status:'pending'}});
 });
 const created=await createMockup(req('RECAST-MUG-11OZ'),env);assert.equal(created.status,200);assert.deepEqual(payload.option_groups,['Lifestyle kitchen','Flat']);assert.equal((await(await env.ARTWORK.get(oldKey)).json()).approvedAt,'old');
});
