import core from "./index.js";

export const FULFILLMENT = {
  "RECAST-HOODIE-S":      { printfulProductId: 380, printfulVariantId: 10779, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-M":      { printfulProductId: 380, printfulVariantId: 10780, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-L":      { printfulProductId: 380, printfulVariantId: 10781, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-XL":     { printfulProductId: 380, printfulVariantId: 10782, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 27.84, product: "Hoodie", color: "Black" },
  "RECAST-HOODIE-2XL":    { printfulProductId: 380, printfulVariantId: 10783, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 29.84, product: "Hoodie", color: "Black" },

  "RECAST-TEE-S":         { printfulProductId: 71, printfulVariantId: 4016, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-M":         { printfulProductId: 71, printfulVariantId: 4017, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-L":         { printfulProductId: 71, printfulVariantId: 4018, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-XL":        { printfulProductId: 71, printfulVariantId: 4019, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 11.92, product: "T-Shirt", color: "Black" },
  "RECAST-TEE-2XL":       { printfulProductId: 71, printfulVariantId: 4020, preferredPlacement: "front", orderFileType: "front", quantity: 1, baseCost: 13.92, product: "T-Shirt", color: "Black" },

  "RECAST-BLANKET-50X60": { printfulProductId: 395, printfulVariantId: 10986, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 29.36, product: "Blanket" },
  "RECAST-BLANKET-60X80": { printfulProductId: 395, printfulVariantId: 13222, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 39.76, product: "Blanket" },

  "RECAST-POSTER-12X16":  { printfulProductId: 1, printfulVariantId: 1349, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 11.11, product: "Poster" },
  "RECAST-POSTER-18X24":  { printfulProductId: 1, printfulVariantId: 1, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 13.15, product: "Poster" },
  "RECAST-POSTER-24X36":  { printfulProductId: 1, printfulVariantId: 2, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 18.25, product: "Poster" },

  "RECAST-FRAME-8X10":    { printfulProductId: 2, printfulVariantId: 4651, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 20.76, product: "Framed Poster", color: "Black" },
  "RECAST-FRAME-12X16":   { printfulProductId: 2, printfulVariantId: 1350, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 32.20, product: "Framed Poster", color: "Black" },
  "RECAST-FRAME-18X24":   { printfulProductId: 2, printfulVariantId: 3, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 46.30, product: "Framed Poster", color: "Black" },

  "RECAST-CANVAS-12X16":  { printfulProductId: 3, printfulVariantId: 5, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 23.41, product: "Canvas" },
  "RECAST-CANVAS-18X24":  { printfulProductId: 3, printfulVariantId: 7, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 33.66, product: "Canvas" },
  "RECAST-CANVAS-24X36":  { printfulProductId: 3, printfulVariantId: 825, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 52.02, product: "Canvas" },

  "RECAST-MUG-11OZ":      { printfulProductId: 19, printfulVariantId: 1320, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 6.07, product: "Mug", color: "White" },
  "RECAST-MUG-15OZ":      { printfulProductId: 19, printfulVariantId: 4830, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 8.11, product: "Mug", color: "White" },

  "RECAST-TUMBLER-20OZ":  { printfulProductId: 909, printfulVariantId: 23470, preferredPlacement: "default", orderFileType: "default", quantity: 1, baseCost: 24.97, product: "Tumbler", color: "White" },
  "RECAST-MAGNET-SET":     { printfulProductId: 656, printfulVariantId: 16366, preferredPlacement: "default", orderFileType: "default", quantity: 3, baseCost: 3.39, product: "Magnet 3-Pack", color: "White" },
  "RECAST-COASTER-SET":    { printfulProductId: 611, printfulVariantId: 15662, preferredPlacement: "default", orderFileType: "default", quantity: 4, baseCost: 5.55, product: "Coaster 4-Pack" },

  "RECAST-DIGITAL-HD":     { digital: true, quantity: 1, baseCost: 0, product: "HD Digital Recast" },
  "RECAST-DIGITAL-PACK":   { digital: true, quantity: 1, baseCost: 0, product: "Recast Pack" }
};

const PRODUCT_ORDER = [
  "Custom Recast Hoodie",
  "Custom Recast T-Shirt",
  "Custom Recast Blanket",
  "Custom Recast Framed Poster",
  "Custom Recast Poster",
  "Custom Recast Canvas",
  "Custom Recast Mug",
  "Custom Recast Tumbler",
  "Custom Recast Magnet 3-Pack",
  "Custom Recast Coaster 4-Pack",
  "HD Digital Recast",
  "Recast Pack"
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function shopDomain(env) {
  const raw = String(env.SHOPIFY_SHOP || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return raw.endsWith(".myshopify.com") ? raw : `${raw}.myshopify.com`;
}

function numericVariantId(gid) {
  const match = String(gid || "").match(/ProductVariant\/(\d+)$/);
  return match ? match[1] : null;
}

function base64UrlUtf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function callCore(request, env, ctx, path) {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = "";
  return core.fetch(new Request(url.toString(), { method: "GET" }), env, ctx);
}

async function validateRecast(request, env, ctx, requestId, accessToken) {
  if (!requestId || !accessToken) throw new Error("Missing Recast request credentials.");
  const url = new URL(request.url);
  url.pathname = `/api/request/${encodeURIComponent(requestId)}`;
  url.search = new URLSearchParams({ token: accessToken }).toString();
  const response = await core.fetch(new Request(url.toString(), { method: "GET" }), env, ctx);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || "Recast request could not be verified.");
  return data.request;
}

async function shopifySnapshot(request, env, ctx) {
  const response = await callCore(request, env, ctx, "/api/shopify-status");
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.connected) throw new Error(data.error || "Shopify is not connected.");
  return data;
}

function flattenShopifyProducts(snapshot) {
  const rows = [];
  for (const product of snapshot.recastProducts || []) {
    for (const variant of product.variants?.nodes || []) {
      if (!variant.sku || !FULFILLMENT[variant.sku]) continue;
      const fulfillment = FULFILLMENT[variant.sku];
      const retail = Number(variant.price || 0);
      const productionCost = Number(fulfillment.baseCost || 0) * Number(fulfillment.quantity || 1);
      rows.push({
        productId: product.id,
        title: product.title,
        handle: product.handle,
        status: product.status,
        variantId: variant.id,
        variantTitle: variant.title,
        sku: variant.sku,
        price: variant.price,
        printfulVariantId: fulfillment.printfulVariantId || null,
        printfulQuantity: fulfillment.quantity || 1,
        digital: Boolean(fulfillment.digital),
        productionCost: productionCost.toFixed(2),
        marginBeforeShippingAndFees: (retail - productionCost).toFixed(2)
      });
    }
  }
  return rows;
}

async function checkoutOptions(request, env, ctx) {
  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const accessToken = url.searchParams.get("token");
  const recast = await validateRecast(request, env, ctx, requestId, accessToken);
  const snapshot = await shopifySnapshot(request, env, ctx);
  const rows = flattenShopifyProducts(snapshot);

  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.title)) {
      grouped.set(row.title, {
        title: row.title,
        handle: row.handle,
        status: row.status,
        variants: []
      });
    }
    grouped.get(row.title).variants.push(row);
  }

  const products = [...grouped.values()].sort((a, b) => {
    const ai = PRODUCT_ORDER.indexOf(a.title);
    const bi = PRODUCT_ORDER.indexOf(b.title);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
  });

  return json({
    ok: true,
    request: {
      requestId: recast.requestId,
      styleName: recast.styleName,
      subjectType: recast.subjectType
    },
    products,
    allProductsActive: products.length > 0 && products.every((p) => p.status === "ACTIVE")
  });
}

async function checkoutLink(request, env, ctx) {
  const body = await request.json().catch(() => ({}));
  const requestId = String(body.requestId || "");
  const accessToken = String(body.accessToken || "");
  const sku = String(body.sku || "");
  const recast = await validateRecast(request, env, ctx, requestId, accessToken);

  if (!FULFILLMENT[sku]) return json({ ok: false, error: "Unknown Recast SKU." }, 400);

  const snapshot = await shopifySnapshot(request, env, ctx);
  const row = flattenShopifyProducts(snapshot).find((item) => item.sku === sku);
  if (!row) return json({ ok: false, error: "Shopify variant not found for this SKU." }, 404);
  if (row.status !== "ACTIVE") {
    return json({
      ok: false,
      ready: false,
      error: "This Shopify product is still in DRAFT status. Activate the catalog before checkout testing.",
      sku,
      product: row.title
    }, 409);
  }

  const numericId = numericVariantId(row.variantId);
  if (!numericId) return json({ ok: false, error: "Could not parse the Shopify variant ID." }, 500);

  const properties = {
    "Artwork ID": requestId,
    "Recast Style": recast.styleName || "",
    "Recast Subject": recast.subjectType || ""
  };
  const encodedProperties = base64UrlUtf8(JSON.stringify(properties));
  const checkoutUrl = `https://${shopDomain(env)}/cart/${numericId}:1?properties=${encodeURIComponent(encodedProperties)}&ref=recast-me`;

  return json({
    ok: true,
    ready: true,
    checkoutUrl,
    sku,
    product: row.title,
    variant: row.variantTitle,
    price: row.price,
    fulfillment: FULFILLMENT[sku]
  });
}

async function orderMatch(request, env, ctx) {
  const url = new URL(request.url);
  const requestId = String(url.searchParams.get("requestId") || "");
  const accessToken = String(url.searchParams.get("token") || "");
  await validateRecast(request, env, ctx, requestId, accessToken);
  const snapshot = await shopifySnapshot(request, env, ctx);

  for (const order of snapshot.recentOrders || []) {
    for (const line of order.lineItems?.nodes || []) {
      const artwork = (line.customAttributes || []).find((attr) => attr.key === "Artwork ID");
      if (artwork?.value === requestId) {
        return json({
          ok: true,
          found: true,
          order: {
            id: order.id,
            name: order.name,
            createdAt: order.createdAt,
            financialStatus: order.displayFinancialStatus,
            lineItem: {
              name: line.name,
              sku: line.sku,
              quantity: line.quantity,
              customAttributes: line.customAttributes
            }
          }
        });
      }
    }
  }
  return json({ ok: true, found: false, requestId });
}

async function injectCheckoutScript(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  const html = await response.text();
  if (html.includes("/checkout.js")) return new Response(html, response);
  const next = html.replace("</body>", '  <script src="/checkout.js?v=131" type="module"></script>\n</body>');
  return new Response(next, {
    status: response.status,
    headers: response.headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/fulfillment-map" && request.method === "GET") {
      return json({ ok: true, mapping: FULFILLMENT });
    }

    if (url.pathname === "/api/checkout-options" && request.method === "GET") {
      try {
        return await checkoutOptions(request, env, ctx);
      } catch (error) {
        return json({ ok: false, error: error?.message || String(error) }, 400);
      }
    }

    if (url.pathname === "/api/checkout-link" && request.method === "POST") {
      try {
        return await checkoutLink(request, env, ctx);
      } catch (error) {
        return json({ ok: false, error: error?.message || String(error) }, 400);
      }
    }

    if (url.pathname === "/api/order-match" && request.method === "GET") {
      try {
        return await orderMatch(request, env, ctx);
      } catch (error) {
        return json({ ok: false, error: error?.message || String(error) }, 400);
      }
    }

    const response = await core.fetch(request, env, ctx);
    return injectCheckoutScript(response);
  }
};
