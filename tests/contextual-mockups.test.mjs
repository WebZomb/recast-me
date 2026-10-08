import test from 'node:test';
import assert from 'node:assert/strict';
import {contextualMockupSpec,loadContextualSpec} from '../src/contextual-mockups.js';
import {createMockup} from '../src/workflow.js';
import {setup,ID,TOKEN} from './security-helpers.mjs';
const map={product:'Blanket',printfulProductId:395,printfulVariantId:10986,preferredPlacement:'default'};
const position={area_width:9450,area_height:7950,width:9450,height:7950,top:0,left:0};
const style=(id,group,title='Front',variants=[10986])=>({id,category_name:group,view_name:title,restricted_to_variants:variants});
const row={placement:'default',technique:'sublimation',print_area_type:'simple',print_area_width:63,print_area_height:53,dpi:150,mockup_styles:[style(1,'Flat'),style(2,'Lifestyle'),style(3,'Lifestyle 2'),style(4,'Folded'),style(5,'Lifestyle 3'),style(6,'Lifestyle 4'),style(10,'Lifestyle 5'),style(11,'Lifestyle 6'),style(7,'Lifestyle','Back'),style(8,'Lifestyle','Front',[13222])]};
test('context scenes retain exact dimensions, include a flat proof, and exclude folded/back/wrong variant views',()=>{
 const spec=contextualMockupSpec(map,position,[row]);assert.deepEqual(spec.styles.map(s=>s.id),[11,1]);assert.deepEqual(spec.position,position);
 for(const change of [{dpi:300},{placement:'back'},{print_area_type:'advanced'},{print_area_width:53,print_area_height:63},{mockup_styles:[style(9,'Lifestyle','Front',[13222])]}])assert.equal(contextualMockupSpec(map,position,[{...row,...change}]),null);
 assert.equal(contextualMockupSpec({...map,product:'Pillow'},position,[row]),null);
 assert.equal(contextualMockupSpec({...map,printfulVariantId:13222},position,[row]),null);
 const canvas=contextualMockupSpec({...map,product:'Canvas'},position,[{...row,mockup_styles:[style(12,'Multi-product'),style(13,'Wall'),style(14,'Lifestyle')]}]);assert.deepEqual(canvas.styles.map(s=>s.id),[14,13]);
});
test('only exact product styles are read, with bounded pagination and no inferred scenes',async()=>{
 const calls=[];const spec=await loadContextualSpec(async(path,opts)=>{calls.push({path,opts});return {data:[row]}},map,position);assert.equal(calls.length,1);assert.equal(calls[0].opts.method,'GET');assert.match(calls[0].path,/catalog-products\/395\/mockup-styles\?placements=default/);assert.ok(spec);
});
test('new room preview does not reuse or overwrite an old approved proof and uses identical print geometry',async t=>{
 const env=await setup({PRINTFUL_API_TOKEN:'fixture'});let payload;
 const old='v6-Blanket-fit-ambient-accuracy1-fixed-center-92-standard',key=`mockups/${ID}/RECAST-BLANKET-50X60/${old}/task.json`;
 await env.ARTWORK.put(key,JSON.stringify({status:'completed',approvedAt:'old',images:[{url:'old-proof'}]}));
 t.mock.method(globalThis,'fetch',async(url,opts)=>{
  const u=String(url);
  if(u.endsWith('/catalog-variants/10986'))return Response.json({data:{id:10986,catalog_product_id:395}});
  if(u.endsWith('/printfiles/395'))return Response.json({result:{printfiles:[{printfile_id:208,width:9450,height:7950}],variant_printfiles:[{variant_id:10986,placements:{default:208}}]}});
  if(u.includes('/395/mockup-styles'))return Response.json({data:[row]});
  assert.ok(u.endsWith('/v2/mockup-tasks'));payload=JSON.parse(opts.body);return Response.json({data:[{id:100,status:'pending'}]});
 });
 const response=await createMockup(new Request('https://recast.test/api/mockup/create',{method:'POST',body:JSON.stringify({requestId:ID,accessToken:TOKEN,sku:'RECAST-BLANKET-50X60',presentation:'room-v1',design:{version:6,layout:'fit',fill:'ambient',scale:92}})}),env),data=await response.json();
 assert.equal(response.status,200,JSON.stringify(data));assert.equal(data.mockupId,old+'-room2');assert.deepEqual(payload.products[0].mockup_style_ids,[11,1]);assert.equal(payload.products[0].placements[0].layers[0].position.width,63);assert.equal((await(await env.ARTWORK.get(key)).json()).approvedAt,'old');
});
