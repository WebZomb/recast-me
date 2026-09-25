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

function lastRequest(){try{return JSON.parse(localStorage.getItem("recast_last_request")||"null")||window.__recastActiveRequest}catch{return window.__recastActiveRequest||null}}
function money(n){const value=Number(n);return Number.isFinite(value)?`$${value.toFixed(2)}`:n}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
let checkoutLoadId=0;

async function generateRealMockup({req,sku,card,button}){
  if(!sku)return;
  const original=button.textContent;
  button.disabled=true;button.textContent="Preparing real product preview…";
  try{
    let create=await fetch("/api/mockup/create",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({requestId:req.requestId,accessToken:req.accessToken,sku})
    });
    let data=await create.json().catch(()=>({}));
    if(!create.ok||!data.ok)throw new Error(data.error||"Could not start the product preview.");

    for(let attempt=0;attempt<10;attempt++){
      button.textContent=`Building real mockup${attempt?"…":"…"}`;
      await sleep(attempt===0?10000:8000);
      const url=new URL("/api/mockup/status",location.origin);
      url.searchParams.set("requestId",req.requestId);url.searchParams.set("token",req.accessToken);url.searchParams.set("sku",sku);
      const response=await fetch(url);data=await response.json().catch(()=>({}));
      if(response.ok&&data.status==="completed"&&data.images?.length){
        const img=card.querySelector(".product-art img");
        img.src=data.images[0].url;img.alt="Your Recast on the actual product mockup";
        button.textContent="Real product preview ready ✓";
        card.classList.add("real-mockup-ready");
        return;
      }
      if(data.status==="failed"||(!response.ok&&response.status!==202))throw new Error(data.error||"Printful could not finish this mockup.");
    }
    throw new Error("The real product preview is still processing. Tap again in a moment.");
  }catch(error){
    button.disabled=false;button.textContent="Try real product preview again";
    button.title=error?.message||String(error);
  }
}

async function loadCheckout(){
  const loadId=++checkoutLoadId;
  const req=lastRequest();
  if(!req?.requestId||!req?.accessToken||!grid)return;
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
    grid.innerHTML='<p class="product-loading">Products are temporarily unavailable for this Recast. Your artwork is saved; please try again shortly.</p>';
    console.warn("Checkout options unavailable",data);
    return;
  }

  const ordered=[...(data.products||[])]
    .filter(product=>PRODUCT_META[product.title])
    .sort((a,b)=>(PRODUCT_META[a.title]?.order??50)-(PRODUCT_META[b.title]?.order??50));

  grid.innerHTML=ordered.map((product,index)=>{
    const meta=PRODUCT_META[product.title];
    const variants=product.variants||[],first=variants[0];
    const prices=variants.map(v=>Number(v.price)).filter(Number.isFinite);
    const min=prices.length?Math.min(...prices):0,max=prices.length?Math.max(...prices):min;
    const priceText=min===max?money(min):`from ${money(min)}`;
    const active=product.status==="ACTIVE";
    const featured=meta.tier==="featured";
    const digital=meta.tier==="digital";
    const classes=["product",featured?"featured-product":"secondary-product",digital?"digital-product":""].filter(Boolean).join(" ");
    const select=variants.length>1
      ? `<select class="recast-variant" data-product="${index}">
          ${variants.map(v=>`<option value="${v.sku}">${v.variantTitle} · ${money(v.price)}</option>`).join("")}
         </select>`
      : `<input type="hidden" class="recast-variant" data-product="${index}" value="${first?.sku||""}">`;
    const realPreview=digital?"":`<button class="product-preview-action" data-product="${index}" type="button">Preview my Recast on the real product</button><p class="product-mockup-note">Uses the mapped Printful product and your exact Artwork ID.</p>`;

    return `<div class="${classes}" data-product-index="${index}" data-product-title="${product.title}">
      <div class="product-art"><img src="${PRODUCT_ART[product.title]}" alt="${product.title}"></div>
      <div class="product-body">
        <span class="product-badge">${meta.badge}</span>
        <strong>${product.title.replace(/^Custom Recast /,"")}</strong>
        <p class="product-pitch">${meta.pitch}</p>
        <span class="price">${priceText}</span>
        ${select}
        ${realPreview}
        <button class="recast-buy" data-product="${index}" ${active?"":"disabled"}>
          ${active?meta.cta:"Checkout stays locked until launch"}
        </button>
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
      const index=select.dataset.product;const card=document.querySelector(`[data-product-index="${index}"]`);
      const title=card?.dataset.productTitle;const img=card?.querySelector(".product-art img");
      if(img&&title)img.src=PRODUCT_ART[title];
      card?.classList.remove("real-mockup-ready");
      const preview=card?.querySelector(".product-preview-action");if(preview){preview.disabled=false;preview.textContent="Preview my Recast on the real product"}
    });
  });

  document.querySelectorAll(".recast-buy").forEach(button=>{
    button.addEventListener("click",async()=>{
      const index=button.dataset.product;
      const selector=document.querySelector(`.recast-variant[data-product="${index}"]`);
      const sku=selector?.value;if(!sku)return;
      button.disabled=true;const previous=button.textContent;button.textContent="Opening Shopify…";
      try{
        const res=await fetch("/api/checkout-link",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({requestId:req.requestId,accessToken:req.accessToken,sku})});
        const result=await res.json().catch(()=>({}));
        if(!res.ok||!result.ok||!result.checkoutUrl)throw new Error(result.error||"Checkout link could not be created.");
        location.href=result.checkoutUrl;
      }catch(error){button.disabled=false;button.textContent=previous;console.warn(error)}
    })
  })
}

if(requestLabel){
  const observer=new MutationObserver(()=>{if(/Artwork ID:/i.test(requestLabel.textContent||""))loadCheckout()});
  observer.observe(requestLabel,{childList:true,subtree:true,characterData:true})
}
if(lastRequest()?.requestId&&requestLabel&&/Artwork ID:/i.test(requestLabel.textContent||""))loadCheckout();
