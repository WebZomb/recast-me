// Conservative planning check for blanket full-bleed art.
// This is NOT a Printful preflight approval: final file-guideline dimensions,
// safe zones, placement and manufacturer proof must still be inspected.
// Printful recommends 150–300 DPI for large-format print files, and warns
// that simple enlargement cannot add missing source detail.
export const BLANKET_SIZES=Object.freeze({
 '50 × 60 in':Object.freeze({widthIn:50,heightIn:60,sku:'RECAST-BLANKET-50X60'}),
 '60 × 80 in':Object.freeze({widthIn:60,heightIn:80,sku:'RECAST-BLANKET-60X80'})
});
export const PLANNING_DPI=150;
const validPixels=n=>Number.isSafeInteger(n)&&n>0&&n<=20000;
export function blanketPrintAudit({width,height},size,minDpi=PLANNING_DPI){
 const target=BLANKET_SIZES[size];
 if(!target||!Number.isFinite(minDpi)||minDpi<72||minDpi>300)throw new TypeError('Unknown blanket size or DPI planning target.');
 const expected={width:Math.ceil(target.widthIn*minDpi),height:Math.ceil(target.heightIn*minDpi)};
 if(!validPixels(width)||!validPixels(height))return {size,sku:target.sku,sourceKnown:false,
  requiredPixels:expected,fullBleedReady:false,reason:'source_dimensions_unknown'};
 const effectiveDpi=Math.round(Math.min(width/target.widthIn,height/target.heightIn)*10)/10;
 return {size,sku:target.sku,sourceKnown:true,sourcePixels:{width,height},
  requiredPixels:expected,effectiveDpi,fullBleedReady:width>=expected.width&&height>=expected.height,
  reason:width>=expected.width&&height>=expected.height?'supplier_proof_still_required':'higher_resolution_master_required'};
}
export function blanketDesignAudit(design){
 const source={width:design?.artworkWidth,height:design?.artworkHeight};
 return Object.keys(BLANKET_SIZES).map(size=>({designId:design?.designId,artworkRevision:design?.artworkRevision,...blanketPrintAudit(source,size)}));
}
