// Offline candidate only: no upload, supplier call, approval or publication.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const SOURCE = 'aa68c2b65da6e7d40fa8c2d844bda8e7e6bd82afde431dd030f8da098c50f169';
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw Error('Usage: node scripts/prepare-golden-blanket-candidate.cjs INPUT OUTPUT_DIRECTORY');
  const bytes = await fs.readFile(input);
  if (hash(bytes) !== SOURCE) throw Error('Candidate source hash mismatch');
  const source = await sharp(bytes).metadata();
  if (source.width !== 8192 || source.height !== 8192 || source.format !== 'jpeg') throw Error('Unexpected source dimensions or format');
  const {recommendedCheckoutDesign} = await import('../src/commerce-store.js');
  const design = recommendedCheckoutDesign({product:'Blanket'});
  if (design.layout !== 'fit' || design.fill !== 'dark' || design.scale !== 100 || design.x !== 'center') throw Error('Blanket preset changed; review recipe');
  // Mirrors existing fit-over-fill geometry, including its 92% artwork inset.
  // Native dimensions are the saved Printful395 / variant10986 audit; refresh
  // supplier template and obtain an actual proof before approving this file.
  const width=9450, height=7950, size=Math.round(height*.92);
  const left=Math.round((width-size)/2), top=Math.round((height-size)/2);
  const picture=await sharp(bytes).resize(size,size,{fit:'fill',withoutEnlargement:true}).toBuffer();
  const result=await sharp({create:{width,height,channels:3,background:{r:12,g:16,b:28}}})
    .composite([{input:picture,left,top}]).withMetadata({density:150}).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toBuffer();
  const verified=await sharp(result).metadata();
  if(verified.width!==width || verified.height!==height || verified.density!==150 || result.length>=20_000_000) throw Error('Output does not meet candidate limits');
  await fs.mkdir(output,{recursive:true});
  await fs.writeFile(path.join(output,'golden-blanket-50x60-CANDIDATE.jpg'),result,{flag:'wx'});
  await sharp(result).resize({width:1000}).jpeg({quality:90}).toFile(path.join(output,'golden-blanket-layout-preview.jpg'));
  const manifest={status:'candidate_not_approved',sku:'RECAST-BLANKET-50X60',productId:395,variantId:10986,
    sourceSHA256:SOURCE,sourceDimensions:[8192,8192],originalDimensions:[1254,1254],aiOutputDimensions:[5016,5016],
    processing:'Real-ESRGAN x4plus 4x, then bicubic resize to8192; pixel count is not recovered-detail proof',
    design,printArea:{width,height,dpi:150},artworkBox:{left,top,width:size,height:size},
    outputSHA256:hash(result),outputBytes:result.length,supplierProof:false,published:false,charges:0,
    note:'Local Sharp candidate; not claimed byte-identical to Cloudflare Images rendering. Future proof must use these exact bytes or a separately verified final revision.'};
  await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(manifest,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
