const grid = document.querySelector("#product-grid");
const requestLabel = document.querySelector("#request-id");

function lastRequest() {
  try {
    return JSON.parse(localStorage.getItem("recast_last_request") || "null");
  } catch {
    return null;
  }
}

function money(n) {
  const value = Number(n);
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : n;
}

async function loadCheckout() {
  const req = lastRequest();
  if (!req?.requestId || !req?.accessToken || !grid) return;

  const url = new URL("/api/checkout-options", location.origin);
  url.searchParams.set("requestId", req.requestId);
  url.searchParams.set("token", req.accessToken);

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    console.warn("Checkout options unavailable", data);
    return;
  }

  grid.innerHTML = data.products.map((product, index) => {
    const variants = product.variants || [];
    const first = variants[0];
    const prices = variants.map((v) => Number(v.price)).filter(Number.isFinite);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : min;
    const priceText = min === max ? money(min) : `from ${money(min)}`;
    const active = product.status === "ACTIVE";
    const select = variants.length > 1
      ? `<select class="recast-variant" data-product="${index}" style="width:100%;margin:10px 0;padding:10px;border-radius:10px;background:#11111a;color:#fff;border:1px solid #35354a">
          ${variants.map((v) => `<option value="${v.sku}">${v.variantTitle} · ${money(v.price)}</option>`).join("")}
        </select>`
      : `<input type="hidden" class="recast-variant" data-product="${index}" value="${first?.sku || ""}">`;

    return `<div class="product" data-product-index="${index}">
      <small>${active ? "SHOPIFY READY" : "READY TO ACTIVATE"}</small>
      <strong>${product.title.replace(/^Custom Recast /, "")}</strong>
      <span>${priceText}</span>
      ${select}
      <button class="recast-buy" data-product="${index}" ${active ? "" : "disabled"}>
        ${active ? "Buy this Recast" : "Catalog still in draft"}
      </button>
    </div>`;
  }).join("");

  document.querySelectorAll(".recast-buy").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = button.dataset.product;
      const selector = document.querySelector(`.recast-variant[data-product="${index}"]`);
      const sku = selector?.value;
      if (!sku) return;

      button.disabled = true;
      const previous = button.textContent;
      button.textContent = "Opening Shopify…";
      try {
        const res = await fetch("/api/checkout-link", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            requestId: req.requestId,
            accessToken: req.accessToken,
            sku
          })
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.ok || !result.checkoutUrl) {
          throw new Error(result.error || "Checkout link could not be created.");
        }
        location.href = result.checkoutUrl;
      } catch (error) {
        alert(error?.message || String(error));
        button.disabled = false;
        button.textContent = previous;
      }
    });
  });
}

if (requestLabel) {
  const observer = new MutationObserver(() => {
    if (/Artwork ID:/i.test(requestLabel.textContent || "")) loadCheckout();
  });
  observer.observe(requestLabel, { childList: true, subtree: true, characterData: true });
}

if (lastRequest()?.requestId && requestLabel && /Artwork ID:/i.test(requestLabel.textContent || "")) {
  loadCheckout();
}
