const grid = document.querySelector("#product-grid");
const requestLabel = document.querySelector("#request-id");

const PRODUCT_ART = {
  "Custom Recast Sticker Sheet":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-sticker-sheet-rm061.png?v=1791427937&width=1000",
  "Custom Recast Poster":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-poster-rm059.png?v=1791422885&width=1000",
  "Custom Recast Hoodie":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-hoodie-rm059.png?v=1791422966&width=1000",
  "Custom Recast Framed Poster":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-frame-rm059.png?v=1791422870&width=1000",
  "Custom Recast Canvas":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-canvas-rm059.png?v=1791422862&width=1000",
  "Custom Recast T-Shirt":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-tshirt-rm059.png?v=1791422934&width=1000",
  "Custom Recast Blanket":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-blanket-rm059.png?v=1791422915&width=1000",
  "Custom Recast Mug":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-mug-rm059.png?v=1791422827&width=1000",
  "Custom Recast Tumbler":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-tumbler-rm059.png?v=1791422982&width=1000",
  "Custom Recast Magnet 3-Pack":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-magnet-rm059.png?v=1791422997&width=1000",
  "Custom Recast Coaster 4-Pack":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-coaster-rm059.png?v=1791423005&width=1000",
  "HD Digital Recast":"/assets/product-digital-v16.webp",
  "Recast Pack":"/assets/product-pack-v16.webp",
  "Custom Recast Sticker":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-full-picture-sticker-rm060.png?v=1791426248&width=1000",
  "Custom Recast Phone Case":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-case-rm059.png?v=1791422989&width=1000",
  "Custom Recast Pillow":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-pillow-rm059.png?v=1791422893&width=1000",
  "Custom Recast Hardcover Journal":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-journal-rm059.png?v=1791422974&width=1000",
  "Custom Recast Puzzle":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-puzzle-rm059.png?v=1791422922&width=1000",
  "Custom Recast Tote Bag":"https://cdn.shopify.com/s/files/1/0854/3810/3796/files/recast-lifestyle-tote-rm059.png?v=1791422941&width=1000"
};

const PRODUCT_META = {
  "Custom Recast Poster": {order:1,badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured",cta:"Shop Poster"},
  "Custom Recast Hoodie": {order:2,badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured",cta:"Customize Hoodie"},
  "Custom Recast Framed Poster": {order:3,badge:"DESK + WALL",pitch:"Choose an 8×10 desk frame or larger framed wall art.",tier:"featured",cta:"Shop Framed Print"},
  "Custom Recast Canvas": {order:4,badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured",cta:"Shop Canvas"},
  "Custom Recast T-Shirt": {order:5,badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary",cta:"Shop T-Shirt"},
  "Custom Recast Blanket": {order:6,badge:"COZY PICK",pitch:"Big, soft, personal — especially good for pets and gifts.",tier:"secondary",cta:"Shop Blanket"},
  "Custom Recast Mug": {order:7,badge:"GIFTABLE",pitch:"A personalized gift that gets used every day.",tier:"secondary",cta:"Shop Mug"},
  "Custom Recast Tumbler": {order:8,badge:"TAKE IT WITH YOU",pitch:"Your Recast on a 20 oz everyday tumbler.",tier:"secondary",cta:"Shop Tumbler"},
  "Custom Recast Magnet 3-Pack": {order:15,badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary",cta:"Shop Magnet Set"},
  "Custom Recast Coaster 4-Pack": {order:16,badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary",cta:"Shop Coaster Set"},
  "HD Digital Recast": {order:90,badge:"DIGITAL ONLY",pitch:"Just want the clean artwork? Keep the high-resolution file without ordering merch.",tier:"digital",cta:"Get HD File"},
  "Recast Pack": {order:91,badge:"DIGITAL PACK",pitch:"The complete digital set with useful crops and formats.",tier:"digital",cta:"Get Recast Pack"}
,
  "Custom Recast Sticker Sheet": {order:9,badge:"SIX STICKERS · ONE SHEET",pitch:"Six matching full-picture stickers. Your adventure background stays in every one. Glossy 5.83×8.27-inch sheet; indoor use.",tier:"secondary",cta:"Shop Sticker Sheet"},
  "Custom Recast Sticker": {order:9,badge:"NEW · EASY GIFT",pitch:"A glossy 3×3 full-picture sticker, adventure background included.",tier:"secondary",cta:"Shop Sticker"},
  "Custom Recast Phone Case": {order:10,badge:"NEW · EVERYDAY",pitch:"Carry your Recast every day on a supplier-verified clear iPhone case.",tier:"secondary",cta:"Shop Phone Case"},
  "Custom Recast Pillow": {order:11,badge:"NEW · HOME",pitch:"A soft personalized accent pillow made from your Recast.",tier:"secondary",cta:"Shop Pillow"},
  "Custom Recast Hardcover Journal": {order:12,badge:"NEW · DESK",pitch:"Put your Recast on a matte hardcover journal you can use every day.",tier:"secondary",cta:"Shop Journal"},
  "Custom Recast Puzzle": {order:13,badge:"NEW · GIFT",pitch:"Turn your Recast into a personalized jigsaw puzzle for a fun keepsake.",tier:"secondary",cta:"Shop Puzzle"},
  "Custom Recast Tote Bag": {order:14,badge:"NEW · CARRY IT",pitch:"A roomy all-over print tote featuring your Recast artwork.",tier:"secondary",cta:"Shop Tote Bag"}
};

const PRIMARY_PRODUCT_TITLES=new Set(["Custom Recast Mug","Custom Recast Blanket","Custom Recast Poster","Custom Recast Canvas"]);
const PRODUCT_DESIGN_PRESETS = {
  "Custom Recast Hoodie": {product:"Hoodie",layout:"fit",fill:"transparent",x:"center",scale:100,spacing:"standard",finish:"soft",label:"Scene blend · soft fade into fabric"},
  "Custom Recast T-Shirt": {product:"T-Shirt",layout:"fit",fill:"transparent",x:"center",scale:100,spacing:"standard",finish:"soft",label:"Scene blend · soft fade into fabric"},
  "Custom Recast Mug": {product:"Mug",layout:"two-sided",fill:"ambient",x:"center",scale:110,spacing:"standard",label:"Best setup · two-sided wrap"},
  "Custom Recast Tumbler": {product:"Tumbler",layout:"two-sided",fill:"ambient",x:"center",scale:108,spacing:"standard",label:"Best setup · two-sided wrap"},
  "Custom Recast Blanket": {product:"Blanket",layout:"fit",fill:"ambient",x:"center",scale:92,spacing:"standard",label:"Best setup · full image on blanket"},
  "Custom Recast Poster": {product:"Poster",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Framed Poster": {product:"Framed Poster",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Canvas": {product:"Canvas",layout:"fit",fill:"ambient",x:"center",scale:90,spacing:"standard",label:"Best setup · whole image inside wrapped edges"},
  "Custom Recast Magnet 3-Pack": {product:"Magnet 3-Pack",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Coaster 4-Pack": {product:"Coaster 4-Pack",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Sticker Sheet": {product:"Sticker Sheet",layout:"six-pictures",fill:"transparent",x:"center",scale:100,spacing:"safe",label:"Six whole pictures · safe peel spacing"},
  "Custom Recast Sticker": {product:"Sticker",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full sticker"},
  "Custom Recast Phone Case": {product:"Phone Case",layout:"fit",fill:"ambient",x:"center",scale:100,spacing:"standard",label:"Best setup · whole image below camera"},
  "Custom Recast Pillow": {product:"Pillow",layout:"fit",fill:"ambient",x:"center",scale:100,spacing:"standard",label:"Best setup · whole image"},
  "Custom Recast Hardcover Journal": {product:"Hardcover Journal",layout:"fit",fill:"ambient",x:"center",scale:100,spacing:"standard",label:"Best setup · whole image on both covers"},
  "Custom Recast Puzzle": {product:"Puzzle",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full puzzle"},
  "Custom Recast Tote Bag": {product:"Tote Bag",layout:"fit",fill:"ambient",x:"center",scale:100,spacing:"standard",label:"Best setup · whole image"}
};
function presetFor(card){return PRODUCT_DESIGN_PRESETS[card?.dataset?.productTitle]||{product:"Generic",layout:"fit",fill:"ambient",x:"center",scale:100,spacing:"standard",label:"Recommended setup"}}


const ROADMAP_PRODUCTS=[
 {title:"Custom Recast Sticker Pack",price:"14.99",variant:"5.83×8.27 sticker sheet"},
 {title:"Custom Recast Phone Case",price:"29.99",variant:"Popular iPhone models"},
 {title:"Custom Recast Pillow",price:"39.99",variant:"18×18"},
 {title:"Custom Recast Notebook",price:"24.99",variant:"5.5×8.5"},
 {title:"Custom Recast Pet Bandana",price:"34.99",variant:"S–XL"},
 {title:"Custom Recast Puzzle",price:"34.99",variant:"252 pieces · US only"},
 {title:"Custom Recast Tote Bag",price:"39.99",variant:"15×15"}
];
function roadmapMarkup(){ return ""; }


// Store cards keep the curated Recast examples the owner approved.
const USE_SUPPLIER_EXAMPLES_ON_STORE_CARDS=false;
let catalogExamplesPromise;
function catalogExamples(){
  if(!USE_SUPPLIER_EXAMPLES_ON_STORE_CARDS)return Promise.resolve({examples:{}});
  return catalogExamplesPromise ||= fetch('/catalog-examples.json?v=2552',{cache:'no-cache'})
    .then(r=>r.ok?r.json():{examples:{}}).catch(()=>({examples:{}}));
}
function trustedExample(row,sku,design){
  if(!row||row.sku!==sku||row.status!=='provider-verified'||!row.variantIdentity||!row.position||!row.sourceHash||!row.reviewedAt)return false;
  if(!Number.isSafeInteger(row.variantIdentity.id)||row.variantIdentity.id<=0)return false;
  if(!['area_width','area_height','width','height'].every(k=>Number.isFinite(row.position[k])&&row.position[k]>0))return false;
  if(typeof row.image!=='string'||!(/^\/assets\/catalog\/[a-z0-9-]+\.(png|jpg|webp)$/.test(row.image)||/^https:\/\/cdn\.shopify\.com\//.test(row.image)))return false;
  return !design||['version','product','layout','fill','x','scale','spacing','finish','orientation'].every(k=>(row.design?.[k]??null)===(design[k]??null));
}
async function applyCatalogExample(card,sku,{staticCard=false}={}){
  if(!USE_SUPPLIER_EXAMPLES_ON_STORE_CARDS||!card||!sku)return;
  const run=String(Number(card.dataset.exampleRun||0)+1);card.dataset.exampleRun=run;
  const data=await catalogExamples(),row=data.examples?.[sku];
  // Read controls after the await: initial cards apply their presets synchronously.
  const design=staticCard?null:productDesign(card);
  if(card.dataset.exampleRun!==run||card.classList.contains('real-mockup-ready')||(!staticCard&&stateFor(card).busy))return;
  if(!staticCard&&card.querySelector('.recast-variant')?.value!==sku)return;
  const image=card.querySelector('.product-art img'),caption=card.querySelector('.example-design-label');
  if(!image)return;
  if(trustedExample(row,sku,design)){
    image.src=row.image;image.alt=`Printful example for ${row.product} · ${row.variantLabel}`;
    if(caption)caption.textContent=`${row.viewType==='Room'?'Room example':'Example'} · ${row.variantLabel} · supplier mockup`;
    card.dataset.exampleSku=sku;card.dataset.exampleVerified='true';
  }else{
    if(caption)caption.textContent='Lifestyle example · preview your selected size';
    delete card.dataset.exampleVerified;
  }
}
function refreshStaticExamples(){
  document.querySelectorAll('#product-grid:not(.checkout-catalog) .product[data-example-sku]').forEach(card=>applyCatalogExample(card,card.dataset.exampleSku,{staticCard:true}));
}
document.addEventListener('recast-static-catalog',refreshStaticExamples);
refreshStaticExamples();

function checkoutEndpoint(path,req){
  const routes={'/api/checkout-options':'products','/api/checkout-link':'checkout','/api/mockup/create':'mockup-create','/api/mockup/status':'mockup-status'};
  return req?.shareId?`/api/social/${encodeURIComponent(req.shareId)}/${routes[path]}`:path;
}
function lastRequest(){if(window.__recastActiveRequest)return window.__recastActiveRequest;try{return JSON.parse(localStorage.getItem("recast_last_request")||"null")}catch{return null}}
function showCatalogError(message){
  grid.replaceChildren();
  const copy=document.createElement("p");copy.className="product-loading";copy.setAttribute("role","status");copy.textContent=message;
  const retry=document.createElement("button");retry.type="button";retry.className="button";retry.textContent="Try loading products again";retry.addEventListener("click",loadCheckout);
  grid.append(copy,retry);
}
function money(n){const value=Number(n);return Number.isFinite(value)?`$${value.toFixed(2)}`:n}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
let checkoutLoadId=0;
const mockupState=new WeakMap();
const productReviewState=new WeakMap();

function stateFor(card){
  let state=mockupState.get(card);
  if(!state){state={run:0,busy:false,cooldownUntil:0};mockupState.set(card,state);}
  return state;
}
function productDesign(card){
  const preset=presetFor(card);
  const layout=card?.querySelector?.("[data-design-layout]")?.value||preset.layout;
  const x=card?.querySelector?.("[data-design-x]")?.value||preset.x;
  const scale=Number(card?.querySelector?.("[data-design-scale]")?.value||preset.scale);
  const spacing=card?.querySelector?.("[data-design-spacing]")?.value||preset.spacing;
  const fill=card?.querySelector?.("[data-design-fill]")?.value||preset.fill;
  return {version:preset.product==="Sticker Sheet"?8:["Hardcover Journal","Phone Case"].includes(preset.product)?7:6,product:preset.product,layout,fill,x,scale,spacing,...(["Poster","Framed Poster","Canvas","Puzzle"].includes(preset.product)?{orientation:"portrait"}:{}),...(preset.finish?{finish:card?.querySelector?.("[data-design-finish]")?.value||preset.finish}:{})};
}
function designSignature(card,sku){return JSON.stringify({sku,design:productDesign(card)})}
function designControlsMarkup(title,preset){
  if(preset.product==='Sticker Sheet')return `<details class="product-design-controls compact-product-edit"><summary><span>Sheet details</span></summary><div class="design-edit-body"><p>Six matching copies of your whole picture, arranged in two columns and three rows. Each picture fits inside a 2.25-inch square and keeps its original proportions. Small white borders and safe gaps let each sticker peel separately.</p><p>One 5.83×8.27-inch sheet per quantity. For flat indoor surfaces. Choose another saved Recast above to change the artwork, then preview the sheet again.</p></div></details>`;

  const wrap=['Custom Recast Mug','Custom Recast Tumbler'].includes(title);
  const apparel=Boolean(preset.finish);
  const journal=preset.product==="Hardcover Journal",phone=preset.product==="Phone Case";
  const layoutOptions=phone?`<option value="fit" selected>Whole image below camera opening</option>`:journal?`<option value="fit" selected>Whole image on both covers</option>`:wrap
    ? `<option value="two-sided" selected>Best setup · image on both sides</option><option value="wrap">Full wrap / full bleed</option><option value="single">One image</option><option value="fit">Keep whole image + blended background</option>`
    : `<option value="cover" selected>Best setup · fill the product</option><option value="fit">Keep whole image + background fill</option>`;
  const spacing=wrap?`<label data-design-spacing-wrap>Image spacing<select data-design-spacing><option value="close">Closer together</option><option value="standard" selected>Standard</option><option value="wide">Farther apart</option></select></label>`:"";
  return `<details class="product-design-controls compact-product-edit ${apparel?"apparel-design":""}">
    <summary><span>Edit design</span></summary>
    <div class="design-edit-body">
      <label data-layout-label>Layout<select data-design-layout>${layoutOptions}</select></label>
      ${apparel?`<label>Artwork finish<select data-design-finish><option value="soft">Scene blend · fade into fabric</option><option value="cutout">Subject cutout · no background</option><option value="rectangle">Original photo · straight edges</option></select></label><p class="apparel-finish-note">Scene blend keeps the full Recast sharp in the center and gradually dissolves the outer edges into the garment so there is no visible rectangular border. Cutout remains available for designs that work better without a scene.</p>`:""}
      ${spacing}
      <label data-design-fill-wrap hidden>Background fill<select data-design-fill><option value="ambient" selected>Blend artwork colors</option><option value="transparent" hidden>No added background</option><option value="dark">Dark fill</option><option value="light">Light fill</option><option value="full-bleed">Artwork edge fill</option></select></label>
      <label data-design-position-wrap>Image position<select data-design-x><option value="left">Left</option><option value="center" selected>Center</option><option value="right">Right</option></select></label>
      <label data-design-scale-wrap>Print-area size <strong data-design-scale-label>${preset.scale}%</strong><input data-design-scale type="range" min="75" max="${apparel||journal||phone?100:125}" step="${apparel?1:5}" value="${preset.scale}"></label>
      <button type="button" class="button ghost" data-reset-design>Reset to best setup</button><p class="product-mockup-note">Review a new preview after changing the design.</p>
    </div>
  </details>`;
}
function applyPresetToControls(card){
  const preset=presetFor(card);
  const layout=card?.querySelector?.("[data-design-layout]"),x=card?.querySelector?.("[data-design-x]"),scale=card?.querySelector?.("[data-design-scale]"),spacing=card?.querySelector?.("[data-design-spacing]"),fill=card?.querySelector?.("[data-design-fill]");
  if(layout)layout.value=preset.layout;
  if(x)x.value=preset.x;
  if(scale){scale.value=String(preset.scale);const label=card.querySelector?.("[data-design-scale-label]");if(label)label.textContent=preset.scale+"%";}
  if(spacing)spacing.value=preset.spacing;
  if(fill)fill.value=preset.fill;
  const finish=card?.querySelector?.("[data-design-finish]");if(finish)finish.value=preset.finish;
  syncDesignControls(card);
}
function syncDesignControls(card){
  const layout=card?.querySelector?.("[data-design-layout]")?.value;
  const spacing=card?.querySelector?.("[data-design-spacing-wrap]");
  const fill=card?.querySelector?.("[data-design-fill-wrap]");
  const position=card?.querySelector?.("[data-design-position-wrap]");
  const scale=card?.querySelector?.("[data-design-scale-wrap]");
  if(spacing)spacing.hidden=layout!=="two-sided";
  if(fill)fill.hidden=layout!=="fit";
  const fullBleed=layout==="cover"||layout==="wrap";
  if(position)position.hidden=fullBleed||["Hardcover Journal","Phone Case"].includes(presetFor(card).product);
  if(scale)scale.hidden=fullBleed;
}

function requireFreshPreview(card){
  const buy=card?.querySelector?.(".recast-buy");
  if(!buy||card?.dataset?.digital==="true"||card?.dataset?.active!=="true")return;
  buy.disabled=true;buy.hidden=true;buy.textContent="Continue to final review";
}
function setPreviewLoading(card,busy){
  const state=stateFor(card);
  clearInterval(state.loadingTimer);state.loadingTimer=null;
  const art=card.querySelector?.('.product-art');
  if(!art)return;
  art.setAttribute('aria-busy',String(busy));
  let panel=art.querySelector('.product-preview-loading');
  if(!busy){if(panel)panel.hidden=true;return;}
  if(!panel){
    panel=document.createElement('div');panel.className='product-preview-loading';
    panel.innerHTML='<span class="product-preview-spinner" aria-hidden="true"></span><strong role="status">Preparing your product preview</strong><p>We’re placing your artwork on your selected product. Please keep this page open.</p><small data-preview-elapsed aria-hidden="true">Just started…</small>';
    art.append(panel);
  }
  panel.hidden=false;
  panel.querySelector('p').textContent='We’re placing your artwork on your selected product. Please keep this page open.';
  const started=Date.now(),elapsed=panel.querySelector('[data-preview-elapsed]');
  elapsed.textContent='Just started…';
  state.loadingTimer=setInterval(()=>{
    if(card.isConnected===false){setPreviewLoading(card,false);return;}
    const seconds=Math.floor((Date.now()-started)/1000);
    elapsed.textContent=`${seconds}s elapsed`;
    if(seconds>=30)panel.querySelector('p').textContent='Still preparing your preview. Some products take longer. There’s no need to click again.';
  },1000);
  art.scrollIntoView?.({block:'center',behavior:'smooth'});
}
function resetProductPreview(card,{invalidate=true}={}){
  if(!card)return;
  const summary=card?.querySelector?.('[data-design-summary]');
  if(summary){const preset=presetFor(card),design=productDesign(card);summary.textContent=['layout','fill','x','scale','spacing','finish'].every(k=>design[k]===preset[k])?'Recommended layout applied':'Custom layout';}
  const state=stateFor(card);if(invalidate){state.run++;state.busy=false;}
  if(invalidate)setPreviewLoading(card,false);
  const title=card.dataset.productTitle,img=card.querySelector?.(".product-art img");
  if(img&&title){img.src=PRODUCT_ART[title];img.alt="Example design on "+title;}
  card.classList?.remove("real-mockup-ready","preview-room-close");
  card.querySelector?.(".mockup-views")?.remove?.();
  delete card.dataset.mockupSignature;delete card.dataset.mockupId;productReviewState.delete(card);
  const example=card.querySelector?.(".product-art img");if(example){example.src=PRODUCT_ART[card.dataset.productTitle];example.alt="Style illustration; preview your selected size";}
  const caption=card.querySelector?.(".example-design-label");if(caption)caption.textContent="Lifestyle example · preview your selected size";
  const error=card.querySelector?.(".mockup-error");if(error){error.hidden=true;error.textContent="";}
  const preview=card.querySelector?.(".product-preview-action");
  if(preview){preview.disabled=state.busy;preview.textContent=state.busy?"Waiting for current preview…":"Preview my product";}
  requireFreshPreview(card);
  applyCatalogExample(card,card?.querySelector?.(".recast-variant")?.value);
}

function viewLabel(title,index){
  const raw=String(title||"").trim();
  if(/^default$/i.test(raw))return "Product";
  if(/handle on left/i.test(raw))return "Handle left";
  if(/handle on right/i.test(raw))return "Handle right";
  if(/product details?|detail/i.test(raw))return "Detail";
  if(/\bfront\b/i.test(raw))return "Front";
  if(/\bback\b/i.test(raw))return "Back";
  if(/\bleft\b/i.test(raw))return "Left";
  if(/\bright\b/i.test(raw))return "Right";
  return raw.replace(/\s+/g," ").slice(0,22)||`View ${index+1}`;
}
function uniqueMockupViews(input=[],productTitle=""){
  const seen=new Set(),labels=new Set(),output=[];let scenes=0;
  for(const view of input){
    if(!view?.url||seen.has(view.url)||/multi-product/i.test(`${view.group||""} ${view.title||""}`))continue;
    if(productTitle==='Custom Recast Blanket'&&/^Lifestyle(?: [2-5])?$/i.test(view.group||""))continue;
    seen.add(view.url);
    const isScene=/lifestyle|room|interior|sofa|bed|kitchen|desk|home/i.test(`${view.group||""} ${view.title||""}`);
    const key=isScene?`${view.group||""}|${view.title||""}`:viewLabel(view.title,output.length);
    if(labels.has(key))continue;labels.add(key);
    const label=isScene?(++scenes===1?"In a room":`Room view ${scenes}`):viewLabel(view.title,output.length);
    output.push({...view,label,isScene});if(output.length===4)break;
  }
  return output;
}
function showProductView(card,img,view,close=true){
  img.src=view.url;img.alt="Your Recast on the actual product mockup";
  const wall=/^Custom Recast (Poster|Canvas|Framed Poster)$/.test(card.dataset.productTitle||"");
  card.classList.toggle('preview-room-close',Boolean(wall&&view.isScene&&close));
}
function designSummary(card){
  const d=productDesign(card),parts=[];
  parts.push(d.layout==="two-sided"?"Two-sided wrap":d.layout==="wrap"?"Full wrap":d.layout==="cover"?"Full bleed":d.layout==="fit"?"Keep whole image":"One image");
  if(d.layout==="two-sided")parts.push(d.spacing==="close"?"Closer spacing":d.spacing==="wide"?"Wider spacing":"Standard spacing");
  if(d.finish)parts.push(d.finish==="cutout"?"Subject cutout · transparent background":d.finish==="soft"?"Soft-edge photo · transparent dot fade":"Original photo · no added background");
  if(d.layout==="fit"&&!d.finish)parts.push(d.fill==="dark"?"Dark fill":d.fill==="light"?"Light fill":d.fill==="full-bleed"?"Artwork fill":"Blended fill");
  parts.push((d.x||"center").replace(/^./,m=>m.toUpperCase()));
  if(d.scale!==100)parts.push(`${d.scale}% size`);
  return parts.join(" · ");
}
function closeFinalReview(){
  document.querySelector(".recast-final-review")?.remove();
  document.documentElement.classList.remove("recast-review-open");
}
async function confirmCheckout({req,sku,card,button,modal}){
  const state=productReviewState.get(card),errorCopy=modal.querySelector(".final-review-error"),confirm=modal.querySelector("[data-final-confirm]");
  if(!state||card.dataset.mockupSignature!==state.signature||card.dataset.mockupId!==state.mockupId){
    errorCopy.textContent="Your product settings changed. Close this review and generate a fresh product preview.";errorCopy.hidden=false;return;
  }
  confirm.disabled=true;confirm.textContent="Opening secure checkout…";errorCopy.hidden=true;
  try{
    const res=await fetch(checkoutEndpoint("/api/checkout-link",req),{method:"POST",headers:{"x-recast-request":"1","content-type":"application/json"},body:JSON.stringify({
      requestId:req.requestId,accessToken:req.accessToken,sku,mockupId:state.mockupId,design:state.design,confirmDesign:true
    })});
    const result=await res.json().catch(()=>({}));
    if(!res.ok||!result.ok||!result.checkoutUrl)throw new Error(result.error||"Checkout link could not be created.");
    location.href=result.checkoutUrl;
  }catch(error){
    confirm.disabled=false;confirm.textContent="Confirm design & checkout";
    errorCopy.textContent=error.message||"Checkout is temporarily unavailable. Please try again.";errorCopy.hidden=false;
    button.disabled=false;
  }
}
function openFinalReview({req,sku,card,button}){
  const state=productReviewState.get(card);
  if(!state||card.dataset.mockupSignature!==state.signature||card.dataset.mockupId!==state.mockupId){
    const error=card.querySelector(".checkout-error");if(error){error.textContent="Generate and review the product preview for these exact settings first.";error.hidden=false;}requireFreshPreview(card);return;
  }
  closeFinalReview();
  const modal=document.createElement("div");modal.className="recast-final-review";modal.setAttribute("role","dialog");modal.setAttribute("aria-modal","true");modal.setAttribute("aria-labelledby","recast-review-title");
  const views=state.views.slice(0,3);
  modal.innerHTML=`<div class="final-review-backdrop" data-final-close></div><section class="final-review-panel">
    <div class="final-review-top"><div><span>FINAL CHECK</span><h2 id="recast-review-title">This is the design that will be printed.</h2><p>Check the image, product and placement. After you confirm, checkout is the last customer step.</p></div><button type="button" class="final-review-x" data-final-close aria-label="Close final review">×</button></div>
    <div class="final-review-angles">${views.map((v,i)=>`<figure><img src="${v.url}" alt="${v.label||viewLabel(v.title,i)}"><figcaption>${v.label||viewLabel(v.title,i)}</figcaption></figure>`).join("")}</div>
    <div class="final-review-summary"><div><small>PRODUCT</small><strong>${card.dataset.productTitle?.replace(/^Custom Recast /,"")||"Product"} · ${card.querySelector(".recast-variant option:checked")?.textContent||card.querySelector(".recast-variant")?.value||sku}</strong></div><div><small>ARTWORK</small><strong>${req.requestId}</strong></div><div><small>PRINT SETTINGS</small><strong>${designSummary(card)}</strong></div></div>
    <div class="final-review-note"><strong>Size &amp; finish:</strong> The preview is for your selected variant. Actual print placement and color can vary slightly with manufacturing; a screen is not a physical ruler.</div>
    <div class="final-review-note"><strong>Looks right?</strong> The preview watermark is only for protection. Your clean private artwork is used for the print file.</div>
    <div class="final-review-note"><strong>Sending a gift?</strong> Use your own email and billing details at checkout, and your recipient’s name and shipping address. Place separate orders for different addresses. Gift wrapping and gift messages are not currently offered.</div>
    <p class="final-review-error" role="alert" hidden></p>
    <div class="final-review-actions"><button type="button" class="button ghost" data-final-image>Change image</button><button type="button" class="button ghost" data-final-edit>Edit placement</button><button type="button" class="button primary" data-final-confirm>Confirm design & checkout</button></div>
  </section>`;
  document.body.append(modal);document.documentElement.classList.add("recast-review-open");
  modal.querySelectorAll("[data-final-close],[data-final-edit]").forEach(el=>el.addEventListener("click",()=>{closeFinalReview();card.scrollIntoView({behavior:"smooth",block:"center"});}));
  modal.querySelector("[data-final-image]")?.addEventListener("click",()=>{closeFinalReview();if(req.shareId){location.href="/#start";return;}document.querySelector("#recent-versions-shell")?.scrollIntoView({behavior:"smooth",block:"start"});});
  modal.querySelector("[data-final-confirm]").addEventListener("click",()=>confirmCheckout({req,sku,card,button,modal}));
  modal.querySelector("[data-final-confirm]").focus();
}

async function generateRealMockup({req,sku,card,button}){
  if(!sku||!card||!button)return;
  if(stateFor(card).busy)return;
  const state=stateFor(card),run=++state.run,design=productDesign(card),signature=JSON.stringify({sku,design});
  state.busy=true;
  resetProductPreview(card,{invalidate:false});
  const errorCopy=card.querySelector(".mockup-error");
  button.disabled=true;button.textContent="Preparing real product preview…";
  setPreviewLoading(card,true);
  const current=()=>stateFor(card).run===run&&designSignature(card,sku)===signature;
  const safeWait=async ms=>{await sleep(ms);return current()};
  try{
    const initialWait=Math.max(0,state.cooldownUntil-Date.now());
    if(initialWait){
      button.textContent="Preparing preview…";
      if(!await safeWait(initialWait))return;
    }
    const startRequest=()=>fetch(checkoutEndpoint("/api/mockup/create",req),{
      method:"POST",headers:{"x-recast-request":"1","content-type":"application/json","cache-control":"no-cache"},
      body:JSON.stringify({requestId:req.requestId,accessToken:req.accessToken,sku,design,presentation:"room-v1"}),
      cache:"no-store"
    });
    let create,data;
    for(let attempt=0;attempt<3;attempt++){
      if(!current())return;
      state.cooldownUntil=Date.now()+2500;
      create=await startRequest();
      data=await create.json().catch(()=>({}));
      if(create.ok&&data.ok)break;
      const missingBinding=create.status===503&&data.reason==="printful_binding_missing";
      const rateLimited=data.providerStatus===429||/too many requests|try again after\s+\d+\s+seconds?/i.test(String(data.error||""));
      if(missingBinding&&attempt===0){
        button.textContent="Refreshing product connection…";
        if(!await safeWait(1200))return;
        continue;
      }
      if(rateLimited&&attempt<2){
        const seconds=Math.max(3,Math.min(8,Number(String(data.error||"").match(/after\s+(\d+)\s+seconds?/i)?.[1]||3)));
        state.cooldownUntil=Date.now()+seconds*1000;
        button.textContent=`Printful is busy · retrying in ${seconds}s…`;
        if(!await safeWait(seconds*1000))return;
        continue;
      }
      break;
    }
    if(!current())return;
    if(!create?.ok||!data?.ok){
      const internal=[data?.error||"Could not start the product preview.",data?.stage?("Stage: "+data.stage):"",data?.workerVersionId?("Worker: "+data.workerVersionId):""].filter(Boolean).join(" · ");
      const customer=String(data?.reason||'').startsWith('apparel_')
        ?"Background removal couldn't finish. Your Recast is saved — open Edit design and choose Soft-edge photo to keep the scene without a print box."
        :data?.reason==='printful_catalog_review'
        ?"This tumbler's preview needs a Printful catalog check. Your Recast is saved; another product can still be previewed."
        :/print dimensions are unavailable|print_area_missing/i.test(internal)
        ?"This product preview is being updated. Your Recast is saved — try again in a moment or choose another product."
        :"We couldn't build this product preview right now. Your Recast is saved — please try again.";
      console.warn("Recast product preview start failed",JSON.stringify({sku,detail:internal.replace(/https?:\/\/[^\s]+/g,'[protected source]')}));
      throw new Error(customer);
    }
    const mockupId=data.mockupId||"legacy";
    for(let attempt=0;attempt<10;attempt++){
      if(!current())return;
      button.textContent=attempt?"Building updated mockup…":"Building real mockup…";
      if(!await safeWait(attempt===0?10000:8000))return;
      const url=new URL(checkoutEndpoint("/api/mockup/status",req),location.origin);
      url.searchParams.set("requestId",req.requestId);url.searchParams.set("token",req.accessToken);url.searchParams.set("sku",sku);url.searchParams.set("mockup",mockupId);
      const response=await fetch(url,{cache:"no-store"});data=await response.json().catch(()=>({}));
      if(!current())return;
      if(response.ok&&data.status==="completed"&&data.images?.length){
        const img=card.querySelector(".product-art img"),views=uniqueMockupViews(data.images,card.dataset.productTitle);
        const sidePreferred=/^Custom Recast (Mug|Tumbler)$/i.test(card.dataset.productTitle||"")?views.findIndex(view=>/^(Handle left|Handle right|Left|Right|3D|Product)$/i.test(view.label)):-1;
        const isBlanket=card.dataset.productTitle==='Custom Recast Blanket';
        const preferredSceneGroup=['Custom Recast Coaster 4-Pack','Custom Recast Hardcover Journal'].includes(card.dataset.productTitle)?'Lifestyle 2':isBlanket?'Lifestyle 6':null;
        const scenePreferred=views.findIndex(view=>view.isScene&&(!preferredSceneGroup||view.group===preferredSceneGroup));
        const preferred=scenePreferred>=0?scenePreferred:sidePreferred>=0?sidePreferred:views.findIndex(view=>/^(Product|3D|Flat|Front)$/i.test(view.label)),selected=preferred>=0?preferred:0;
        showProductView(card,img,views[selected]);
        card.querySelector(".mockup-views")?.remove();
        if(views.length>1){
          const controls=document.createElement("div");controls.className="mockup-views";
          controls.setAttribute("aria-label","Product preview views");
          views.forEach((view,index)=>{
            const choice=document.createElement("button");choice.type="button";choice.className="mockup-view-chip";
            choice.textContent=view.label;
            choice.setAttribute("aria-pressed",String(index===selected));
            choice.addEventListener("click",()=>{showProductView(card,img,view);for(const other of controls.children)other.setAttribute("aria-pressed",String(other===choice));});
            controls.append(choice);
          });
          if(/^Custom Recast (Poster|Canvas|Framed Poster)$/.test(card.dataset.productTitle||"")&&views.some(v=>v.isScene)){
            const room=views.find(v=>v.isScene),full=document.createElement('button');full.type='button';full.className='mockup-view-chip';full.textContent='Full room';full.setAttribute('aria-pressed','false');
            full.addEventListener('click',()=>{showProductView(card,img,room,false);for(const other of controls.children)other.setAttribute('aria-pressed',String(other===full));});controls.append(full);
          }
          card.querySelector(".product-art").after(controls);
        }
        const caption=card.querySelector(".example-design-label");if(caption)caption.textContent=["Custom Recast Poster","Custom Recast Canvas"].includes(card.dataset.productTitle)?`Your artwork · ${card.querySelector(".recast-variant option:checked")?.textContent||"selected size"} · supplier mockup`:"Your artwork · product preview";
        card.dataset.mockupSignature=signature;card.dataset.mockupId=mockupId;
        productReviewState.set(card,{sku,design,mockupId,views:views.slice(0,3),signature});
        card.classList.add("real-mockup-ready");
        state.busy=false;
        button.disabled=true;button.textContent="Preview ready ✓";
        const buy=card.querySelector(".recast-buy");
        if(buy&&card.dataset.active==="true"){buy.hidden=false;buy.disabled=false;buy.textContent="Continue to final review";}
        return;
      }
      if(data.status==="failed"||(!response.ok&&response.status!==202)){console.warn("Recast product preview provider failure",{sku,detail:data.error||"unknown"});throw new Error("We couldn't finish this product preview right now. Your Recast is saved — please try again.");}
    }
    throw new Error("The real product preview is still processing. Please try again in a moment.");
  }catch(error){
    if(!current())return;
    state.busy=false;
    button.disabled=false;button.textContent="Try real product preview again";
    const message=error?.message||String(error);button.title=message;
    if(errorCopy){errorCopy.textContent=message;errorCopy.hidden=false;}
    requireFreshPreview(card);
  }finally{
    if(stateFor(card).run===run)setPreviewLoading(card,false);
  }
}

async function loadCheckout(){
  const loadId=++checkoutLoadId;
  const req=lastRequest();
  if(!req?.requestId||(!req?.accessToken&&!req?.shareId)||!grid)return;
  grid.classList.remove('merch-home-compact');
  grid.classList.add('checkout-catalog');
  grid.innerHTML='<p class="product-loading">Loading products for the selected Artwork ID…</p>';

  let response,data;
  try{
    const url=new URL(checkoutEndpoint("/api/checkout-options",req),location.origin);
    url.searchParams.set("requestId",req.requestId);
    url.searchParams.set("token",req.accessToken);
    response=await fetch(url);
    data=await response.json().catch(()=>({}));
  }catch(error){data={error:error?.message||'Connection interrupted.'}}
  if(loadId!==checkoutLoadId)return;
  if(!response?.ok||!data.ok){
    showCatalogError("Products are temporarily unavailable for this Recast. Your artwork is saved; try loading products again.");
    console.warn("Checkout options unavailable",data);
    return;
  }

  const ordered=[...(data.products||[])]
    .filter(product=>PRODUCT_META[product.title]&&product.status==="ACTIVE")
    .sort((a,b)=>{
      const ap=PRIMARY_PRODUCT_TITLES.has(a.title)?0:1,bp=PRIMARY_PRODUCT_TITLES.has(b.title)?0:1;
      return ap-bp||((PRODUCT_META[a.title]?.order??50)-(PRODUCT_META[b.title]?.order??50));
    });

  if(!ordered.length){showCatalogError("No products are available for this Recast yet. Your artwork is saved.");return;}

  grid.innerHTML=ordered.map((product,index)=>{
    const meta=PRODUCT_META[product.title];
    const variants=product.variants||[],first=variants[0];
    const prices=variants.map(v=>Number(v.price)).filter(Number.isFinite);
    const min=prices.length?Math.min(...prices):0,max=prices.length?Math.max(...prices):min;
    const priceText=min===max?money(min):`from ${money(min)}`;
    const active=product.status==="ACTIVE"&&variants.length>0;
    const featured=meta.tier==="featured";
    const digital=meta.tier==="digital";
    const extra=!PRIMARY_PRODUCT_TITLES.has(product.title);
    const classes=["product",featured?"featured-product":"secondary-product",digital?"digital-product":"",extra?"catalog-extra-product":""].filter(Boolean).join(" ");
    const select=variants.length>1
      ? `<select class="recast-variant" data-product="${index}">
          ${variants.map(v=>`<option value="${v.sku}">${v.variantTitle} · ${money(v.price)}</option>`).join("")}
         </select>`
      : `<input type="hidden" class="recast-variant" data-product="${index}" value="${first?.sku||""}">`;
    const preset=PRODUCT_DESIGN_PRESETS[product.title]||presetFor({dataset:{productTitle:product.title}});
    const designControls=digital?"":designControlsMarkup(product.title,preset);
    const realPreview=digital?"":`<button class="product-preview-action" data-product="${index}" type="button">Preview my product</button><p class="mockup-error" role="alert" hidden></p>`;

    return `<div class="${classes}" data-product-index="${index}" data-product-title="${product.title}" data-active="${active}" data-digital="${digital}">
      <div class="product-art"><img src="${PRODUCT_ART[product.title]}" alt="Style illustration for ${product.title}; generate the selected-size preview before buying" loading="lazy"><span class="example-design-label">Lifestyle example · preview your selected size</span></div>
      <div class="product-body">
        <span class="product-badge">${meta.badge}</span>
        <strong>${product.title.replace(/^Custom Recast /,"")}</strong>
        <p class="product-pitch">${meta.pitch}</p>
        <span class="price">${priceText}</span>
        ${select}
        ${realPreview}
        ${preset.finish?'<p class="apparel-finish-note">Recommended: full scene with soft edges, fitted inside this garment’s printable area. Check the selected size in your product preview.</p>':""}
        <button class="recast-buy" data-product="${index}" data-buy-label="${meta.cta}" ${active&&digital?"":"disabled"} ${active&&!digital?"hidden":""}>
          ${active?(digital?meta.cta:"Continue to final review"):"Not available to buy yet"}
        </button>
        ${designControls}
        ${active?"":'<p class="product-mockup-note">This product is still a draft. Purchasing opens after store setup and testing.</p>'}
        <p class="checkout-error" role="alert" hidden></p>
      </div>
    </div>`;
  }).join("")+roadmapMarkup()+`<button type="button" class="catalog-more-toggle">See more products</button>`;
  grid.querySelectorAll(".product[data-product-index]").forEach(card=>applyCatalogExample(card,card.querySelector(".recast-variant")?.value));
  const moreToggle=grid.querySelector?.(".catalog-more-toggle");
  moreToggle?.addEventListener("click",()=>{grid.classList.add("show-all-products");moreToggle.remove();});

  document.querySelectorAll(".product-preview-action").forEach(button=>{
    button.addEventListener("click",async()=>{
      const index=button.dataset.product;
      const selector=document.querySelector(`.recast-variant[data-product="${index}"]`);
      const card=document.querySelector(`[data-product-index="${index}"]`);
      await generateRealMockup({req,sku:selector?.value,card,button});
    });
  });

  document.querySelectorAll("select.recast-variant").forEach(select=>{
    select.addEventListener("change",()=>{
      const index=select.dataset.product;resetProductPreview(document.querySelector(`[data-product-index="${index}"]`));
    });
  });

  document.querySelectorAll("[data-design-scale]").forEach(control=>{
    const card=control.closest?.("[data-product-index]");
    const label=card?.querySelector?.("[data-design-scale-label]");
    control.addEventListener("input",()=>{if(label)label.textContent=control.value+"%";resetProductPreview(card);});
  });
  document.querySelectorAll("[data-design-layout],[data-design-x],[data-design-spacing],[data-design-fill],[data-design-finish]").forEach(control=>{
    const card=control.closest?.("[data-product-index]");
    if(control.matches?.("[data-design-layout]"))syncDesignControls(card);
    control.addEventListener("change",()=>{syncDesignControls(card);resetProductPreview(card);});
  });
  document.querySelectorAll(".product-design-controls").forEach(details=>{
    details.open=false;applyPresetToControls(details.closest("[data-product-index]"));
  });
  document.querySelectorAll('[data-reset-design]').forEach(button=>button.addEventListener('click',()=>{
    const card=button.closest('[data-product-index]');applyPresetToControls(card);resetProductPreview(card);
    const details=card.querySelector('.product-design-controls');if(details)details.open=false;
  }));

  document.querySelectorAll(".recast-buy").forEach(button=>{
    button.addEventListener("click",async()=>{
      const index=button.dataset.product;
      const selector=document.querySelector(`.recast-variant[data-product="${index}"]`);
      const sku=selector?.value;if(!sku)return;
      const card=document.querySelector(`[data-product-index="${index}"]`),digital=card?.dataset?.digital==="true";
      if(lastRequest()?.requestId!==req.requestId||lastRequest()?.accessToken!==req.accessToken){await loadCheckout();return;}
      const errorCopy=button.parentElement.querySelector(".checkout-error");
      errorCopy.hidden=true;errorCopy.textContent="";
      const signature=designSignature(card,sku);
      if(!digital&&(card?.dataset?.mockupSignature!==signature||!card?.dataset?.mockupId)){
        errorCopy.textContent="Generate and review the product preview for these exact settings before checkout.";errorCopy.hidden=false;requireFreshPreview(card);return;
      }
      if(!digital){openFinalReview({req,sku,card,button});return;}
      button.disabled=true;const previous=button.textContent;button.textContent="Opening Shopify…";
      try{
        const res=await fetch(checkoutEndpoint("/api/checkout-link",req),{method:"POST",headers:{"x-recast-request":"1","content-type":"application/json"},body:JSON.stringify({requestId:req.requestId,accessToken:req.accessToken,sku})});
        const result=await res.json().catch(()=>({}));
        if(!res.ok||!result.ok||!result.checkoutUrl)throw new Error(result.error||"Checkout link could not be created.");
        location.href=result.checkoutUrl;
      }catch(error){
        button.disabled=false;button.textContent=previous;
        errorCopy.textContent=error.message||"Checkout is temporarily unavailable. Please try again.";errorCopy.hidden=false;
      }
    })
  })
}

// Artwork activation is explicit: wait until both ID and token are committed.
document.addEventListener('recast-artwork-selected',loadCheckout);
if(lastRequest()?.requestId&&requestLabel&&/Artwork ID:/i.test(requestLabel.textContent||""))loadCheckout();
