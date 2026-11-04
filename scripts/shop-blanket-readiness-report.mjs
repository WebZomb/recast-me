// Read-only design-production planning report; no supplier calls or customer orders.
// Run: node scripts/shop-blanket-readiness-report.mjs
import {readFileSync} from 'node:fs';
import {blanketDesignAudit,PLANNING_DPI} from '../public/shop-print-readiness.js';

const gallery=JSON.parse(readFileSync(new URL('../public/shop-gallery.json',import.meta.url),'utf8'));
if(!Array.isArray(gallery.designs)||gallery.designs.length!==35)throw Error('Source gallery changed; review before preparing blanket products.');
const rows=gallery.designs.flatMap(blanketDesignAudit);
if(rows.length!==70||new Set(rows.map(r=>r.designId+'|'+r.sku)).size!==70)throw Error('Incomplete or duplicate blanket size candidates.');
const counts={
 sourceDesigns:gallery.designs.length,
 plannedSizeVariants:rows.length,
 fullBleedPixelTargetsSatisfied:rows.filter(x=>x.fullBleedReady).length,
 largerPrintMasterNeeded:rows.filter(x=>!x.fullBleedReady).length,
 individuallyApprovedSupplierProofs:0,
 activePremadeBlanketOffersVerified:0
};
console.log(JSON.stringify({
 report:'Recast Christmas blanket print-readiness planning — NOT supplier approval',
 planningMinDpi:PLANNING_DPI,
 counts,
 reason:'Existing approved artwork is 1254×1254. Do not stretch that source across a 50×60 or 60×80-inch throw.',
 nextSteps:['Create genuinely detailed product-sized artwork while preserving subject identity','Inspect Printful catalog templates and safe zones','Prepare separate locked clean print files per exact size','Generate authentic Printful preview tasks','Visually review every proof and enable only signed checkout offers'],
 items:rows
},null,2));
