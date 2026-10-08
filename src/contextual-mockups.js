// Presentation-only supplier scenes. Exact V1 geometry and saved design stay unchanged.
const scene=/lifestyle|living|room|interior|bed|sofa|kitchen|desk|home/i;
const excluded=/holiday|christmas|halloween|placeholder|details|back|folded|multi-product/i;
export function contextualMockupSpec(map,position,rows){
  // Both pillow sides must remain in one proof; the existing V1 path handles them.
  if(map.product==='Pillow')return null;
  // Live V2 task rejected the published landscape area for this exact large blanket.
  // Retain its working V1 proof and geometry until supplier orientation is resolved.
  if(map.product==='Blanket'&&Number(map.printfulVariantId)===13222)return null;
  const placement=map.preferredPlacement||'default';
  for(const row of rows||[]){
    const width=Number(row.print_area_width),height=Number(row.print_area_height),dpi=Number(row.dpi);
    if(row.placement!==placement||row.print_area_type!=='simple'||!['sublimation','digital','uv','dtg'].includes(row.technique))continue;
    if(![width,height,dpi].every(n=>Number.isFinite(n)&&n>0)||Math.abs(width*dpi-position.area_width)>1||Math.abs(height*dpi-position.area_height)>1)continue;
    const styles=(row.mockup_styles||[]).filter(s=>Number.isSafeInteger(Number(s.id))&&Number(s.id)>0&&(s.restricted_to_variants===null||Array.isArray(s.restricted_to_variants)&&s.restricted_to_variants.some(v=>Number(v)===Number(map.printfulVariantId)))&&!excluded.test(`${s.category_name} ${s.view_name}`));
    const order=s=>{
      const lifestyle=scene.test(s.category_name||'');
      const side=['Mug','Tumbler'].includes(map.product)&&/left|right/i.test(s.view_name||'');
      return lifestyle?(side?0:/front|lifestyle/i.test(s.view_name||'')?1:2):side?3:/^front$|^default$/i.test(s.view_name||'')?4:5;
    };
    styles.sort((a,b)=>order(a)-order(b));
    const scenes=styles.filter(s=>scene.test(s.category_name||'')&&(map.product!=='Blanket'||!/^Lifestyle(?: [2-5])?$/i.test(s.category_name||'')));
    const flat=styles.find(s=>!scene.test(s.category_name||'')&&/^flat$|^default$|^wall$/i.test(s.category_name||''))||styles.find(s=>!scene.test(s.category_name||''));
    const selected=[];const groups=new Set();
    for(const s of scenes){if(groups.has(s.category_name))continue;selected.push(s);groups.add(s.category_name);if(selected.length===(map.product==='Blanket'?3:2))break;}
    if(flat)selected.push(flat);
    if(!selected.length)return null;
    return {placement,technique:row.technique,width,height,dpi,position,styles:selected.map(s=>({id:Number(s.id),group:String(s.category_name||''),title:String(s.view_name||placement)}))};
  }
  return null;
}
export async function loadContextualSpec(call,map,position){
  const rows=[];
  for(let page=0;page<3;page++){
    const response=await call(`/v2/catalog-products/${map.printfulProductId}/mockup-styles?placements=${encodeURIComponent(map.preferredPlacement||'default')}&limit=100&offset=${page*100}`,{method:'GET'});
    if(!Array.isArray(response?.data))return null;
    rows.push(...response.data);
    if(!response._links?.next||!response.data.length)break;
  }
  return contextualMockupSpec(map,position,rows);
}
