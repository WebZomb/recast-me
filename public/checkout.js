const grid = document.querySelector("#product-grid");
const requestLabel = document.querySelector("#request-id");

const PRODUCT_ART = {
  "Custom Recast Poster":"/assets/product-poster-v16.webp",
  "Custom Recast Hoodie":"/assets/product-hoodie-v16.webp",
  "Custom Recast Framed Poster":"/assets/product-desk-frame-v16.webp",
  "Custom Recast Canvas":"/assets/product-canvas-v16.webp",
  "Custom Recast T-Shirt":"/assets/product-tshirt-v16.webp",
  "Custom Recast Blanket":"/assets/product-blanket-v16.webp",
  "Custom Recast Mug":"/assets/product-mug-v16.webp",
  "Custom Recast Tumbler":"/assets/product-tumbler-v16.webp",
  "Custom Recast Magnet 3-Pack":"/assets/product-magnet-v16.webp",
  "Custom Recast Coaster 4-Pack":"/assets/product-coaster-v16.webp",
  "HD Digital Recast":"/assets/product-digital-v16.webp",
  "Recast Pack":"/assets/product-pack-v16.webp"
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
  "Custom Recast Magnet 3-Pack": {order:9,badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary",cta:"Shop Magnet Set"},
  "Custom Recast Coaster 4-Pack": {order:10,badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary",cta:"Shop Coaster Set"},
  "HD Digital Recast": {order:90,badge:"DIGITAL ONLY",pitch:"Just want the clean artwork? Keep the high-resolution file without ordering merch.",tier:"digital",cta:"Get HD File"},
  "Recast Pack": {order:91,badge:"DIGITAL PACK",pitch:"The complete digital set with useful crops and formats.",tier:"digital",cta:"Get Recast Pack"}
};

const PRODUCT_DESIGN_PRESETS = {
  "Custom Recast Mug": {product:"Mug",layout:"two-sided",fill:"ambient",x:"center",scale:110,spacing:"standard",label:"Best setup · two-sided wrap"},
  "Custom Recast Tumbler": {product:"Tumbler",layout:"two-sided",fill:"ambient",x:"center",scale:108,spacing:"standard",label:"Best setup · two-sided wrap"},
  "Custom Recast Blanket": {product:"Blanket",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full blanket"},
  "Custom Recast Poster": {product:"Poster",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Framed Poster": {product:"Framed Poster",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Canvas": {product:"Canvas",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Magnet 3-Pack": {product:"Magnet 3-Pack",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"},
  "Custom Recast Coaster 4-Pack": {product:"Coaster 4-Pack",layout:"cover",fill:"full-bleed",x:"center",scale:100,spacing:"standard",label:"Best setup · full bleed"}
};
function presetFor(card){return PRODUCT_DESIGN_PRESETS[card?.dataset?.productTitle]||{product:"Generic",layout:"fit",fill:"ambient",x:"center",scale:100,spacing:"standard",label:"Recommended setup"}}


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
  return {product:preset.product,layout,fill,x,scale,spacing};
}
function designSignature(card,sku){return JSON.stringify({sku,design:productDesign(card)})}
function designControlsMarkup(title,preset){
  const wrap=['Custom Recast Mug','Custom Recast Tumbler'].includes(title);
  const layoutOptions=wrap
    ? `<option value="two-sided" selected>Best setup · image on both sides</option><option value="wrap">Full wrap / full bleed</option><option value="single">One image</option><option value="fit">Keep whole image + blended background</option>`
    : `<option value="cover" selected>Best setup · fill the product</option><option value="fit">Keep whole image + background fill</option>`;
  const spacing=wrap?`<label data-design-spacing-wrap>Image spacing<select data-design-spacing><option value="close">Closer together</option><option value="standard" selected>Standard</option><option value="wide">Farther apart</option></select></label>`:"";
  return `<details class="product-design-controls">
    <summary><span>Edit design</span><small>${preset.label}</small></summary>
    <div class="design-edit-body">
      <label>Layout<select data-design-layout>${layoutOptions}</select></label>
      ${spacing}
      <label data-design-fill-wrap hidden>Background fill<select data-design-fill><option value="ambient" selected>Blend artwork colors</option><option value="dark">Dark fill</option><option value="light">Light fill</option><option value="full-bleed">Artwork edge fill</option></select></label>
      <label data-design-position-wrap>Image position<select data-design-x><option value="left">Left</option><option value="center" selected>Center</option><option value="right">Right</option></select></label>
      <label data-design-scale-wrap>Image size <strong data-design-scale-label>${preset.scale}%</strong><input data-design-scale type="range" min="75" max="125" step="5" value="${preset.scale}"></label>
      <p class="product-mockup-note">Recommended setup is already applied. Edit only if you want a different crop or composition.</p>
    </div>
  </details>`;
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
  if(position)position.hidden=fullBleed;
  if(scale)scale.hidden=fullBleed;
}

function requireFreshPreview(card){
  const buy=card?.querySelector?.(".recast-buy");
  if(!buy||card?.dataset?.digital==="true"||card?.dataset?.active!=="true")return;
  buy.disabled=true;buy.textContent="Preview product before buying";
}
function resetProductPreview(card,{invalidate=true}={}){
  if(!card)return;
  const state=stateFor(card);if(invalidate){state.run++;state.busy=false;}
  const title=card.dataset.productTitle,img=card.querySelector?.(".product-art img");
  if(img&&title){img.src=PRODUCT_ART[title];img.alt="Example design on "+title;}
  card.classList?.remove("real-mockup-ready");
  card.querySelector?.(".mockup-views")?.remove?.();
  delete card.dataset.mockupSignature;delete card.dataset.mockupId;productReviewState.delete(card);
  const caption=card.querySelector?.(".example-design-label");if(caption)caption.textContent="Example design";
  const error=card.querySelector?.(".mockup-error");if(error){error.hidden=true;error.textContent="";}
  const preview=card.querySelector?.(".product-preview-action");
  if(preview){preview.disabled=state.busy;preview.textContent=state.busy?"Waiting for current preview…":"Preview recommended design";}
  requireFreshPreview(card);
}

function viewLabel(title,index){
  const raw=String(title||"");
  if(/^default$/i.test(raw))return "3D view";
  if(/handle on left/i.test(raw))return "Handle left";
  if(/front/i.test(raw))return "Front view";
  return raw||`View ${index+1}`;
}
function designSummary(card){
  const d=productDesign(card),parts=[];
  parts.push(d.layout==="two-sided"?"Two-sided wrap":d.layout==="wrap"?"Full wrap":d.layout==="cover"?"Full bleed":d.layout==="fit"?"Keep whole image":"One image");
  if(d.layout==="two-sided")parts.push(d.spacing==="close"?"Closer spacing":d.spacing==="wide"?"Wider spacing":"Standard spacing");
  if(d.layout==="fit")parts.push(d.fill==="dark"?"Dark fill":d.fill==="light"?"Light fill":d.fill==="full-bleed"?"Artwork fill":"Blended fill");
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
    const res=await fetch("/api/checkout-link",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
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
    <div class="final-review-angles">${views.map((v,i)=>`<figure><img src="${v.url}" alt="${viewLabel(v.title,i)}"><figcaption>${viewLabel(v.title,i)}</figcaption></figure>`).join("")}</div>
    <div class="final-review-summary"><div><small>PRODUCT</small><strong>${card.dataset.productTitle?.replace(/^Custom Recast /,"")||"Product"} · ${card.querySelector(".recast-variant option:checked")?.textContent||card.querySelector(".recast-variant")?.value||sku}</strong></div><div><small>ARTWORK</small><strong>${req.requestId}</strong></div><div><small>PRINT SETTINGS</small><strong>${designSummary(card)}</strong></div></div>
    <div class="final-review-note"><strong>Looks right?</strong> The preview watermark is only for protection. Your clean private artwork is used for the print file.</div>
    <p class="final-review-error" role="alert" hidden></p>
    <div class="final-review-actions"><button type="button" class="button ghost" data-final-image>Change image</button><button type="button" class="button ghost" data-final-edit>Edit placement</button><button type="button" class="button primary" data-final-confirm>Confirm design & checkout</button></div>
  </section>`;
  document.body.append(modal);document.documentElement.classList.add("recast-review-open");
  modal.querySelectorAll("[data-final-close],[data-final-edit]").forEach(el=>el.addEventListener("click",()=>{closeFinalReview();card.scrollIntoView({behavior:"smooth",block:"center"});}));
  modal.querySelector("[data-final-image]")?.addEventListener("click",()=>{closeFinalReview();document.querySelector("#recent-versions-shell")?.scrollIntoView({behavior:"smooth",block:"start"});});
  modal.querySelector("[data-final-confirm]").addEventListener("click",()=>confirmCheckout({req,sku,card,button,modal}));
  modal.querySelector("[data-final-confirm]").focus();
}

async function generateRealMockup({req,sku,card,button}){
  if(!sku||!card||!button)return;
  const state=stateFor(card),run=++state.run,design=productDesign(card),signature=JSON.stringify({sku,design});
  state.busy=true;
  resetProductPreview(card,{invalidate:false});
  const errorCopy=card.querySelector(".mockup-error");
  button.disabled=true;button.textContent="Preparing real product preview…";
  const current=()=>stateFor(card).run===run&&designSignature(card,sku)===signature;
  const safeWait=async ms=>{await sleep(ms);return current()};
  try{
    const initialWait=Math.max(0,state.cooldownUntil-Date.now());
    if(initialWait){
      button.textContent="Preparing preview…";
      if(!await safeWait(initialWait))return;
    }
    const startRequest=()=>fetch("/api/mockup/create",{
      method:"POST",headers:{"content-type":"application/json","cache-control":"no-cache"},
      body:JSON.stringify({requestId:req.requestId,accessToken:req.accessToken,sku,design}),
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
      const details=[data?.error||"Could not start the product preview.",data?.stage?("Stage: "+data.stage):"",data?.workerVersionId?("Worker: "+data.workerVersionId):""].filter(Boolean).join(" · ");
      throw new Error(details);
    }
    const mockupId=data.mockupId||"legacy";
    for(let attempt=0;attempt<10;attempt++){
      if(!current())return;
      button.textContent=attempt?"Building updated mockup…":"Building real mockup…";
      if(!await safeWait(attempt===0?10000:8000))return;
      const url=new URL("/api/mockup/status",location.origin);
      url.searchParams.set("requestId",req.requestId);url.searchParams.set("token",req.accessToken);url.searchParams.set("sku",sku);url.searchParams.set("mockup",mockupId);
      const response=await fetch(url,{cache:"no-store"});data=await response.json().catch(()=>({}));
      if(!current())return;
      if(response.ok&&data.status==="completed"&&data.images?.length){
        const img=card.querySelector(".product-art img"),views=data.images;
        const preferred=views.findIndex(view=>/front/i.test(view.title||"")),selected=preferred>=0?preferred:0;
        img.src=views[selected].url;img.alt="Your Recast on the actual product mockup";
        card.querySelector(".mockup-views")?.remove();
        if(views.length>1){
          const controls=document.createElement("div");controls.className="mockup-views";
          controls.style.cssText="display:flex;gap:8px;flex-wrap:wrap;padding:12px";
          controls.setAttribute("aria-label","Product preview camera angles");
          views.forEach((view,index)=>{
            const choice=document.createElement("button");choice.type="button";choice.className="button secondary";
            choice.style.cssText="min-height:44px;padding:8px 12px;font-size:14px";
            const raw=String(view.title||"");
            choice.textContent=/^default$/i.test(raw)?"3D view":/handle on left/i.test(raw)?"Handle left":/front/i.test(raw)?"Front view":raw||`View ${index+1}`;
            choice.setAttribute("aria-pressed",String(index===selected));
            choice.addEventListener("click",()=>{img.src=view.url;for(const other of controls.children)other.setAttribute("aria-pressed",String(other===choice));});
            controls.append(choice);
          });
          card.querySelector(".product-art").after(controls);
        }
        const caption=card.querySelector(".example-design-label");if(caption)caption.textContent="Your artwork · product preview";
        card.dataset.mockupSignature=signature;card.dataset.mockupId=mockupId;
        productReviewState.set(card,{sku,design,mockupId,views:views.slice(0,3),signature});
        card.classList.add("real-mockup-ready");
        state.busy=false;
        button.disabled=true;button.textContent="Real product preview ready ✓";
        const buy=card.querySelector(".recast-buy");
        if(buy&&card.dataset.active==="true"){buy.disabled=false;buy.textContent="Continue to final review";}
        return;
      }
      if(data.status==="failed"||(!response.ok&&response.status!==202))throw new Error(data.error||"Printful could not finish this mockup.");
    }
    throw new Error("The real product preview is still processing. Please try again in a moment.");
  }catch(error){
    if(!current())return;
    state.busy=false;
    button.disabled=false;button.textContent="Try real product preview again";
    const message=error?.message||String(error);button.title=message;
    if(errorCopy){errorCopy.textContent=message;errorCopy.hidden=false;}
    requireFreshPreview(card);
  }
}

async function loadCheckout(){
  const loadId=++checkoutLoadId;
  const req=lastRequest();
  if(!req?.requestId||!req?.accessToken||!grid)return;
  grid.classList.remove('merch-home-compact');
  grid.classList.add('checkout-catalog');
  grid.innerHTML='<p class="product-loading">Loading products for the selected Artwork ID…</p>';

  let response,data;
  try{
    const url=new URL("/api/checkout-options",location.origin);
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
    .filter(product=>PRODUCT_META[product.title])
    .sort((a,b)=>(PRODUCT_META[a.title]?.order??50)-(PRODUCT_META[b.title]?.order??50));

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
    const classes=["product",featured?"featured-product":"secondary-product",digital?"digital-product":""].filter(Boolean).join(" ");
    const select=variants.length>1
      ? `<select class="recast-variant" data-product="${index}">
          ${variants.map(v=>`<option value="${v.sku}">${v.variantTitle} · ${money(v.price)}</option>`).join("")}
         </select>`
      : `<input type="hidden" class="recast-variant" data-product="${index}" value="${first?.sku||""}">`;
    const preset=PRODUCT_DESIGN_PRESETS[product.title]||presetFor({dataset:{productTitle:product.title}});
    const designControls=digital?"":designControlsMarkup(product.title,preset);
    const realPreview=digital?"":`<div class="recommended-design-row"><span>Recommended setup applied</span><strong>${preset.label}</strong></div>${designControls}<button class="product-preview-action" data-product="${index}" type="button">Preview recommended design</button><p class="mockup-error" role="alert" hidden></p>`;

    return `<div class="${classes}" data-product-index="${index}" data-product-title="${product.title}" data-active="${active}" data-digital="${digital}">
      <div class="product-art"><img src="${PRODUCT_ART[product.title]}" alt="Example design on ${product.title}" loading="lazy"><span class="example-design-label">Example design</span></div>
      <div class="product-body">
        <span class="product-badge">${meta.badge}</span>
        <strong>${product.title.replace(/^Custom Recast /,"")}</strong>
        <p class="product-pitch">${meta.pitch}</p>
        <span class="price">${priceText}</span>
        ${select}
        ${realPreview}
        <button class="recast-buy" data-product="${index}" data-buy-label="${meta.cta}" ${active&&digital?"":"disabled"}>
          ${active?(digital?meta.cta:"Preview product before buying"):"Not available to buy yet"}
        </button>
        ${active?"":'<p class="product-mockup-note">This product is still a draft. Purchasing opens after store setup and testing.</p>'}
        <p class="checkout-error" role="alert" hidden></p>
      </div>
    </div>`;
  }).join("");

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
  document.querySelectorAll("[data-design-layout],[data-design-x],[data-design-spacing],[data-design-fill]").forEach(control=>{
    const card=control.closest?.("[data-product-index]");
    if(control.matches?.("[data-design-layout]"))syncDesignControls(card);
    control.addEventListener("change",()=>{syncDesignControls(card);resetProductPreview(card);});
  });
  document.querySelectorAll(".product-design-controls").forEach(details=>syncDesignControls(details.closest("[data-product-index]")));

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
        const res=await fetch("/api/checkout-link",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({requestId:req.requestId,accessToken:req.accessToken,sku})});
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
