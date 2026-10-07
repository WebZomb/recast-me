// Bounded defaults only; a public request cannot choose arbitrary supplier IDs.
export function productFromMention(text=''){
  const t=String(text).toLowerCase();
  const options=[
    [/\bhoodie\b/,'RECAST-HOODIE-M','Hoodie'],[/\bt[ -]?shirt\b/,'RECAST-TEE-M','T-Shirt'],
    [/\bframed (?:poster|print)\b/,'RECAST-FRAME-8X10','Framed Poster'],[/\bposter\b/,'RECAST-POSTER-12X16','Poster'],
    [/\bcanvas\b/,'RECAST-CANVAS-12X16','Canvas'],[/\bblanket\b/,'RECAST-BLANKET-50X60','Blanket'],
    [/\btumbler\b/,'RECAST-TUMBLER-20OZ','Tumbler'],[/\bstickers?\b/,'RECAST-STICKER-3X3','Sticker'],
    [/\bphone case\b/,'RECAST-CASE-IP14','Phone Case'],[/\bpillow\b/,'RECAST-PILLOW-14','Pillow'],
    [/\b(journal|notebook)\b/,'RECAST-JOURNAL-HC','Hardcover Journal'],[/\bpuzzle\b/,'RECAST-PUZZLE-252','Puzzle'],
    [/\btote(?: bag)?\b/,'RECAST-TOTE-BLACK','Tote Bag'],[/\bmagnets?\b/,'RECAST-MAGNET-SET','Magnet 3-Pack'],
    [/\bcoasters?\b/,'RECAST-COASTER-SET','Coaster 4-Pack'],[/\b(mug|cup|any product|surprise me with a product)\b/,'RECAST-MUG-11OZ','Mug']
  ];
  const row=options.find(([pattern])=>pattern.test(t));
  if(!row)return null;
  const [,sku,product]=row;
  const drink=['Mug','Tumbler'].includes(product),apparel=['Hoodie','T-Shirt'].includes(product),safe=['Phone Case','Hardcover Journal'].includes(product);
  const cover=['Poster','Framed Poster','Sticker','Puzzle','Magnet 3-Pack','Coaster 4-Pack'].includes(product);
  return {sku,product,design:{version:safe?7:6,product,layout:drink?'two-sided':cover?'cover':'fit',fill:apparel?'transparent':cover?'full-bleed':'ambient',x:'center',scale:product==='Canvas'?90:product==='Blanket'?92:drink?108:100,spacing:'standard',...(apparel?{finish:'soft'}:{}),...(['Canvas','Puzzle'].includes(product)?{orientation:'portrait'}:{})}};
}
export function socialIntent(text=''){
  const product=productFromMention(text);
  const explicitAI=/\b(ai|recast|transform|generate|turn|dress)\b/i.test(text);
  return {mode:product&&!explicitAI?'original-product':'ai',product};
}
