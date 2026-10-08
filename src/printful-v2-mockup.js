/* RM052: narrow V2 fallback for the existing tumbler when V1 has no print area.
 * No guessed variants, template dimensions, placements or production settings.
 */
const bad=(message)=>Object.assign(new Error(message),{code:'printful_catalog_review',status:502,renderControl:true});
const integer=n=>Number.isSafeInteger(Number(n))&&Number(n)>0;
const scene=/lifestyle|living|room|interior|bed|sofa|kitchen|desk|home/i;
export function selectV2MockupSpec(map,variant,rows){
  if(map.product!=='Tumbler'||!integer(map.printfulVariantId)||!integer(map.printfulProductId))throw bad('This product needs its existing Printful catalog mapping.');
  if(Number(variant?.id)!==Number(map.printfulVariantId)||Number(variant?.catalog_product_id)!==Number(map.printfulProductId))throw bad('The tumbler catalog identity could not be verified.');
  const placement=map.preferredPlacement||'default';
  const choices=(Array.isArray(rows)?rows:[]).filter(r=>r?.placement===placement&&r.print_area_type==='simple'&&['sublimation','digital','uv'].includes(r.technique));
  for(const row of choices){
    const width=Number(row.print_area_width),height=Number(row.print_area_height),dpi=Number(row.dpi);
    if(![width,height,dpi].every(n=>Number.isFinite(n)&&n>0)||dpi>1200||width*dpi>12000||height*dpi>12000)continue;
    const styles=(row.mockup_styles||[]).filter(s=>integer(s.id)&&(s.restricted_to_variants===null||Array.isArray(s.restricted_to_variants)&&s.restricted_to_variants.some(v=>Number(v)===Number(map.printfulVariantId))));
    const lifestyle=styles.find(s=>scene.test(s.category_name||'')&&!/holiday|christmas|halloween/i.test(s.category_name||''));
    const studio=styles.find(s=>!scene.test(s.category_name||'')&&/front|default|3d/i.test(s.view_name||''))||styles.find(s=>!scene.test(s.category_name||''));
    const selected=[...new Map([lifestyle,studio].filter(Boolean).map(s=>[Number(s.id),s])).values()];
    if(!selected.length)continue;
    const areaWidth=Math.round(width*dpi),areaHeight=Math.round(height*dpi);
    if(areaWidth<1||areaHeight<1)continue;
    return {placement,technique:row.technique,width,height,dpi,styles:selected.map(s=>({id:Number(s.id),group:String(s.category_name||''),title:String(s.view_name||row.display_name||placement)})),position:{area_width:areaWidth,area_height:areaHeight,width:areaWidth,height:areaHeight,top:0,left:0}};
  }
  throw bad('Printful has not supplied a compatible tumbler print area and view. Your artwork is saved; this product needs a catalog review.');
}
export async function loadV2MockupSpec(call,map){
  const variantResponse=await call(`/v2/catalog-variants/${map.printfulVariantId}`,{method:'GET'});
  // Bounded pagination: only the exact known product/placement, never follow URLs.
  const rows=[];
  for(let page=0;page<3;page++){
    const response=await call(`/v2/catalog-products/${map.printfulProductId}/mockup-styles?placements=${encodeURIComponent(map.preferredPlacement||'default')}&limit=100&offset=${page*100}`,{method:'GET'});
    if(!Array.isArray(response?.data))throw bad('The tumbler catalog response was incomplete.');
    rows.push(...response.data);
    if(!response._links?.next||response.data.length===0)break;
  }
  return selectV2MockupSpec(map,variantResponse?.data,rows);
}
export function v2MockupPayload(map,spec,sourceUrl){
  return {format:'jpg',mockup_width_px:1200,products:[{source:'catalog',catalog_product_id:map.printfulProductId,catalog_variant_ids:[map.printfulVariantId],mockup_style_ids:spec.styles.map(s=>s.id),placements:[{placement:spec.placement,technique:spec.technique,print_area_type:'simple',layers:[{type:'file',url:sourceUrl,position:{width:spec.width,height:spec.height,top:0,left:0}}]}]}]};
}
export function v2CreatedTask(response){
  const rows=response?.data;
  if(!Array.isArray(rows)||rows.length!==1||!integer(rows[0].id))throw bad('Printful did not return a verifiable product preview task.');
  return {task_key:String(rows[0].id),status:'pending'};
}
export function v2PolledTask(response,record){
  const rows=(response?.data||[]).filter(r=>String(r.id)===String(record.taskKey));
  if(rows.length!==1)throw bad('The exact product preview task could not be verified.');
  const task=rows[0];
  if(task.status==='failed'||task.failure_reasons?.length)return {status:'failed',error:task.failure_reasons?.map(r=>r.detail).filter(Boolean).join('; ')||'Printful could not finish this preview.'};
  if(task.status!=='completed')return {status:'pending'};
  const variant=(task.catalog_variant_mockups||[]).find(r=>Number(r.catalog_variant_id)===Number(record.printfulVariantId));
  const mockups=(variant?.mockups||[]).filter(m=>m.placement===record.v2Spec.placement&&m.technique===record.v2Spec.technique&&record.v2Spec.styles.some(s=>s.id===Number(m.style_id))).map(m=>{
    const style=record.v2Spec.styles.find(s=>s.id===Number(m.style_id));
    return {mockup_url:m.mockup_url,placement:m.placement,display_name:style.title,option_group:style.group};
  });
  if(!mockups.length)throw bad('Printful did not return a view for this exact product variant.');
  return {status:'completed',mockups};
}
