import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateOffer,publicOffer} from '../src/shop-offers.js';
import {FULFILLMENT} from '../src/entry.js';
export function buildCatalog(source,fulfillment) {
  if(source.version!==1||!Array.isArray(source.offers))throw new Error('Invalid private catalog');
  const ids=new Set();
  const offers=[];
  for(const offer of source.offers){
    if(ids.has(offer.id))throw new Error(`Duplicate offer: ${offer.id}`);
    ids.add(offer.id);
    if(offer.status!=='verified')continue;
    validateOffer(offer,fulfillment);
    offers.push(publicOffer(offer));
  }
  return {version:1,checkoutEnabled:false,offers};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const source=JSON.parse(await fs.readFile(path.join(root,'catalog/shop/offers.json'),'utf8'));
  const result=buildCatalog(source,FULFILLMENT);
  await fs.writeFile(path.join(root,'public/shop-catalog.json'),JSON.stringify(result,null,2)+'\n');
  console.log(`Built ${result.offers.length} verified offers; checkout remains disabled.`);
}
