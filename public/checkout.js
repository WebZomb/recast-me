const grid = document.querySelector("#product-grid");
const requestLabel = document.querySelector("#request-id");

const PRODUCT_ART = {
  "Custom Recast Hoodie":"hoodie","Custom Recast T-Shirt":"tshirt","Custom Recast Blanket":"blanket",
  "Custom Recast Framed Poster":"framed-poster","Custom Recast Poster":"poster","Custom Recast Canvas":"canvas",
  "Custom Recast Mug":"mug","Custom Recast Tumbler":"tumbler","Custom Recast Magnet 3-Pack":"magnet",
  "Custom Recast Coaster 4-Pack":"coaster"
};

const PRODUCT_META = {
  "Custom Recast Poster": {order:1,badge:"MOST POPULAR",pitch:"The easiest way to turn your Recast into wall art.",tier:"featured",cta:"Shop Poster"},
  "Custom Recast Hoodie": {order:2,badge:"FAN FAVORITE",pitch:"Wear your Recast as a premium statement piece.",tier:"featured",cta:"Customize Hoodie"},
  "Custom Recast Framed Poster": {order:3,badge:"PREMIUM PICK",pitch:"Display-ready artwork with a finished, giftable feel.",tier:"featured",cta:"Shop Framed Print"},
  "Custom Recast Canvas": {order:4,badge:"GALLERY PICK",pitch:"A bold upgrade for artwork that deserves more presence.",tier:"featured",cta:"Shop Canvas"},
  "Custom Recast T-Shirt": {order:5,badge:"WEAR IT",pitch:"An easy everyday way to show off your Recast.",tier:"secondary",cta:"Shop T-Shirt"},
  "Custom Recast Blanket": {order:6,badge:"COZY PICK",pitch:"Big, soft, personal — especially good for pets and gifts.",tier:"secondary",cta:"Shop Blanket"},
  "Custom Recast Mug": {order:7,badge:"GIFTABLE",pitch:"A personalized gift that gets used every day.",tier:"secondary",cta:"Shop Mug"},
  "Custom Recast Tumbler": {order:8,badge:"TAKE IT WITH YOU",pitch:"Your Recast on a 20 oz everyday tumbler.",tier:"secondary",cta:"Shop Tumbler"},
  "Custom Recast Magnet 3-Pack": {order:9,badge:"ADD-ON",pitch:"Three matching magnets for a smaller, easy add-on.",tier:"secondary",cta:"Shop Magnet Set"},
  "Custom Recast Coaster 4-Pack": {order:10,badge:"ADD-ON",pitch:"Four matching cork-back coasters featuring your artwork.",tier:"secondary",cta:"Shop Coaster Set"}
};

function lastRequest(){try{return JSON.parse(localStorage.getItem("recast_last_request")||"null")}catch{return null}}
function money(n){const value=Number(n);return Number.isFinite(value)?`$${value.toFixed(2)}`:n}

async function loadCheckout(){
  const req=lastRequest();
  if(!req?.requestId||!req?.accessToken||!grid)return;

  const url=new URL("/api/checkout-options",location.origin);
  url.searchParams.set("requestId",req.requestId);
  url.searchParams.set("token",req.accessToken);
  const response=await fetch(url);
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.ok){console.warn("Checkout options unavailable",data);return}

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
    const art=PRODUCT_ART[product.title]||"poster";
    const featured=meta.tier==="featured";
    const classes=["product",featured?"featured-product":"secondary-product"].join(" ");
    const select=variants.length>1
      ? `<select class="recast-variant" data-product="${index}">
          ${variants.map(v=>`<option value="${v.sku}">${v.variantTitle} · ${money(v.price)}</option>`).join("")}
         </select>`
      : `<input type="hidden" class="recast-variant" data-product="${index}" value="${first?.sku||""}">`;

    return `<div class="${classes}" data-product-index="${index}">
      <div class="product-art"><img src="/assets/product-${art}.svg" alt="${product.title}"></div>
      <div class="product-body">
        <span class="product-badge">${meta.badge}</span>
        <strong>${product.title.replace(/^Custom Recast /,"")}</strong>
        <p class="product-pitch">${meta.pitch}</p>
        <span class="price">${priceText}</span>
        ${select}
        <button class="recast-buy" data-product="${index}" ${active?"":"disabled"}>
          ${active?meta.cta:"Catalog still in draft"}
        </button>
      </div>
    </div>`;
  }).join("");

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
      }catch(error){alert(error?.message||String(error));button.disabled=false;button.textContent=previous}
    })
  })
}

if(requestLabel){
  const observer=new MutationObserver(()=>{if(/Artwork ID:/i.test(requestLabel.textContent||""))loadCheckout()});
  observer.observe(requestLabel,{childList:true,subtree:true,characterData:true})
}
if(lastRequest()?.requestId&&requestLabel&&/Artwork ID:/i.test(requestLabel.textContent||""))loadCheckout();
