import core from "./index.js";

const TARGETS = {
  hoodie: {
    label: "Hoodie",
    match: (title) => /cotton heritage.*m2580|m2580.*cotton heritage/i.test(title),
    filter: (v) => /^(S|M|L|XL|2XL)$/.test(v.size || "") && /^black$/i.test(v.color || "")
  },
  tshirt: {
    label: "T-Shirt",
    match: (title) => /bella.*canvas.*3001|3001.*bella.*canvas/i.test(title),
    filter: (v) => /^(S|M|L|XL|2XL)$/.test(v.size || "") && /^black$/i.test(v.color || "")
  },
  blanket: {
    label: "Blanket",
    match: (title) => /^throw blanket$/i.test(title.trim()),
    filter: (v) => /50.?×.?60|50.?x.?60|60.?×.?80|60.?x.?80/i.test(v.size || v.name || "")
  },
  poster: {
    label: "Poster",
    match: (title) => /enhanced matte paper poster \(in\)/i.test(title),
    filter: (v) => /12.?×.?16|12.?x.?16|18.?×.?24|18.?x.?24|24.?×.?36|24.?x.?36/i.test(v.size || v.name || "")
  },
  framedPoster: {
    label: "Framed Poster",
    match: (title) => /enhanced matte paper framed poster \(in\)/i.test(title),
    filter: (v) => /12.?×.?16|12.?x.?16|18.?×.?24|18.?x.?24/i.test(v.size || v.name || "") && (!v.color || /black/i.test(v.color))
  },
  canvas: {
    label: "Canvas",
    match: (title) => /^canvas \(in\)$/i.test(title.trim()),
    filter: (v) => /12.?×.?16|12.?x.?16|18.?×.?24|18.?x.?24|24.?×.?36|24.?x.?36/i.test(v.size || v.name || "")
  },
  mug: {
    label: "Mug",
    match: (title) => /^white glossy mug$/i.test(title.trim()),
    filter: (v) => /11\s*oz|15\s*oz/i.test(v.size || v.name || "")
  },
  tumbler: {
    label: "Tumbler",
    match: (title) => /stainless steel tumbler/i.test(title),
    filter: (v) => /20\s*oz/i.test(v.size || v.name || "")
  },
  magnet: {
    label: "Magnet 3-Pack",
    match: (title) => /die-cut magnets?/i.test(title),
    filter: (v) => /3.?×.?3|3.?x.?3/i.test(v.size || v.name || "")
  },
  coaster: {
    label: "Coaster 4-Pack",
    match: (title) => /cork-back coaster/i.test(title),
    filter: () => true
  }
};

async function pf(env, path) {
  if (!env.PRINTFUL_API_TOKEN) throw new Error("PRINTFUL_API_TOKEN is missing.");
  const response = await fetch(`https://api.printful.com${path}`, {
    headers: { Authorization: `Bearer ${env.PRINTFUL_API_TOKEN}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || (data.code && data.code >= 400)) {
    throw new Error(data?.error?.message || data?.result || `Printful HTTP ${response.status}`);
  }
  return data.result;
}

function compactVariant(v) {
  return {
    id: v.id,
    name: v.name,
    size: v.size,
    color: v.color,
    price: v.price,
    in_stock: v.in_stock
  };
}

async function buildPrintfulMap(env) {
  const products = await pf(env, "/products");
  const result = {};

  for (const [key, target] of Object.entries(TARGETS)) {
    const matches = (products || []).filter((p) => target.match(p.title || ""));
    if (!matches.length) {
      result[key] = {
        label: target.label,
        found: false,
        candidates: (products || [])
          .filter((p) => {
            const title = (p.title || "").toLowerCase();
            const words = target.label.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
            return words.some((w) => title.includes(w));
          })
          .slice(0, 10)
          .map((p) => ({ id: p.id, title: p.title, type: p.type }))
      };
      continue;
    }

    const selectedProduct = matches[0];
    const info = await pf(env, `/products/${selectedProduct.id}`);
    const allVariants = info?.variants || [];
    let selectedVariants = allVariants.filter(target.filter);
    if (!selectedVariants.length) selectedVariants = allVariants.slice(0, 30);

    result[key] = {
      label: target.label,
      found: true,
      product: {
        id: info?.product?.id ?? selectedProduct.id,
        title: info?.product?.title ?? selectedProduct.title,
        type: info?.product?.type ?? selectedProduct.type
      },
      variants: selectedVariants.map(compactVariant)
    };
  }

  return result;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/printful-map" && request.method === "GET") {
      try {
        const mapping = await buildPrintfulMap(env);
        return new Response(JSON.stringify({ ok: true, mapping }, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
        });
      } catch (error) {
        return new Response(JSON.stringify({ ok: false, error: error?.message || String(error) }), {
          status: 502,
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
        });
      }
    }
    return core.fetch(request, env, ctx);
  }
};
