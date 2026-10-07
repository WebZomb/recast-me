// Choose only groups returned by this product's Printful catalog. Never invent scenes.
const lifestyle=/lifestyle|living|room|interior|bed|sofa|kitchen|desk|home/i;
const studio=/^flat(?:\s|$)|^default$|^standard$|studio|product only/i;
export function selectMockupGroups(catalog,product){
  const groups=(catalog?.option_groups||[]).filter(g=>typeof g==='string');
  const flat=groups.find(g=>studio.test(g));
  if(['Hoodie','T-Shirt'].includes(product))return flat?[flat]:[];
  const scene=groups.find(g=>lifestyle.test(g)&&!/halloween|christmas|holiday/i.test(g));
  return [...new Set([scene,flat].filter(Boolean))];
}
export function rankMockupCandidates(candidates,product){
  const apparel=['Hoodie','T-Shirt'].includes(product),seen=new Set();
  const unique=candidates.filter(x=>{if(!x?.url||seen.has(x.url))return false;seen.add(x.url);return true});
  const score=x=>{
    const scene=lifestyle.test(`${x.group||''} ${x.title||''}`);
    return scene?(apparel?3:0):/front|default|3d/i.test(x.title||'')?1:2;
  };
  return unique.map((x,i)=>({x,i,s:score(x)})).sort((a,b)=>a.s-b.s||a.i-b.i).map(v=>v.x);
}
