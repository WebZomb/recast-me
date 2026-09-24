const MODEL = "@cf/black-forest-labs/flux-2-klein-4b";

const STYLES = {
  game: {
    name: "Game World",
    prompt: "original cinematic open-world action-game key art, bold illustrated realism, dramatic fictional city, neon and sunset accents, dynamic camera angle, premium commercial poster composition"
  },
  halloween: {
    name: "Halloween",
    prompt: "playful premium Halloween portrait, stylish original costumes, cinematic moonlight, atmospheric fog, carved pumpkins, dramatic but friendly spooky setting"
  },
  retro: {
    name: "Retro Time Machine",
    prompt: "authentic 1980s-inspired portrait, vintage flash photography, period wardrobe and styling, subtle film grain, nostalgic studio or neighborhood setting"
  },
  fantasy: {
    name: "Fantasy Warrior",
    prompt: "original epic fantasy warrior portrait, detailed armor and fabrics, ancient ruins, heroic cinematic lighting, dramatic atmosphere"
  },
  royal: {
    name: "Royal",
    prompt: "regal museum-worthy portrait, ornate palace-inspired environment, rich fabrics, ceremonial accessories, elegant painterly lighting"
  },
  future: {
    name: "Future City",
    prompt: "original futuristic city portrait, neon reflections, high-tech skyline, rain haze, dramatic premium sci-fi lighting"
  },
  comic: {
    name: "Comic Hero",
    prompt: "original upbeat comic-book adventure portrait, friendly heroic costumes, confident nonviolent pose, clean ink linework, halftone texture, bright graphic shadows, original costume design, no weapons, no combat"
  },
  space: {
    name: "Space Explorer",
    prompt: "original cinematic space explorer portrait, distant planets, spacecraft-inspired environment, dramatic rim light, epic scale, original suit and insignia"
  }
};

const AUTO_REJECT = [
  "war", "invasion", "airstrike", "bombing", "missile strike", "battlefield", "casualties", "ceasefire",
  "mass shooting", "school shooting", "murder", "kidnapping", "hostage", "terrorism", "suicide", "self-harm",
  "earthquake", "wildfire", "flood disaster", "plane crash", "funeral", "obituary", "genocide", "hate crime"
];

const REVIEW_TERMS = [
  "election", "campaign", "president", "senate", "congress", "governor", "protest", "riot", "boycott",
  "pandemic", "outbreak", "public health emergency"
];

const IP_MARKERS = [
  "gta", "grand theft auto", "rockstar games", "disney", "pixar", "marvel", "dc comics", "pokemon",
  "naruto", "studio ghibli", "star wars", "harry potter", "fortnite", "minecraft"
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

function assess(text = "") {
  const value = String(text).toLowerCase();
  const reject = AUTO_REJECT.filter((term) => value.includes(term));
  if (reject.length) return { status: "rejected", reasons: reject };
  const review = REVIEW_TERMS.filter((term) => value.includes(term));
  const ip = IP_MARKERS.filter((term) => value.includes(term));
  if (review.length || ip.length) return { status: "review", reasons: [...review, ...ip] };
  return { status: "approved", reasons: [] };
}

function safeNotes(text = "") {
  let result = String(text);
  for (const marker of IP_MARKERS) {
    result = result.replace(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "an original unbranded aesthetic");
  }
  return result;
}

function makePrompt(styleId, subjectType, notes) {
  const style = STYLES[styleId] || STYLES.game;
  return [
    "Edit the supplied customer reference photo. The reference identity is the highest priority.",
    "Preserve facial geometry, eye shape, nose, mouth, jawline, skin tone, hairline, age range, body proportions, pet markings, vehicle silhouette, and other defining features as closely as possible.",
    "Do not replace the customer with a generic model. Do not materially alter ethnicity, age, or recognizable facial structure.",
    "For multiple subjects, preserve each subject distinctly and keep their relative identities clear.",
    `Subject type: ${subjectType || "person"}.`,
    style.prompt + ".",
    safeNotes(notes || ""),
    "Change styling, wardrobe, environment, lighting, props, and atmosphere more than identity.",
    "Create an original composition. Do not add logos, trademarks, famous characters, copied franchise costumes, branded typography, or recognizable copyrighted title treatments.",
    "No text in the artwork. Premium polished editorial/commercial quality, natural face detail, no distorted hands or duplicated features."
  ].filter(Boolean).join(" ");
}

function safeFallbackPrompt(styleId, subjectType) {
  const style = STYLES[styleId] || STYLES.game;
  return [
    "Edit the supplied reference photo into a family-safe, nonviolent, original portrait.",
    "Preserve the recognizable identity of every person, pet, or vehicle as closely as possible.",
    `Subject type: ${subjectType || "person"}.`,
    style.prompt + ".",
    "Friendly confident expressions. No weapons, combat, injuries, threatening gestures, logos, trademarks, famous characters, copied costumes, or text.",
    "Premium editorial quality with natural facial detail and an original setting."
  ].join(" ");
}

function requestKey(id, suffix) {
  return `requests/${id}/${suffix}`;
}

function normalizeBase64(value) {
  return String(value || "")
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "")
    .replace(/\s+/g, "");
}

function randomHex(byteCount = 16) {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readMetadata(env, requestId) {
  if (!env.ARTWORK) return null;
  const object = await env.ARTWORK.get(requestKey(requestId, "request.json"));
  if (!object) return null;
  return object.json();
}

function tokenMatches(meta, token) {
  return Boolean(meta?.accessToken && token && meta.accessToken === token);
}

async function storeRequest(env, { requestId, accessToken, styleId, subjectType, notes, inputs, imageBase64, safety }) {
  if (!env.ARTWORK) return { persisted: false, storageError: "ARTWORK binding is missing." };

  const createdAt = new Date().toISOString();
  const metadata = {
    requestId,
    accessToken,
    styleId,
    styleName: STYLES[styleId]?.name || STYLES.game.name,
    subjectType,
    notes,
    safety,
    status: "preview_ready",
    createdAt,
    updatedAt: createdAt,
    inputCount: inputs.length,
    paid: false,
    fulfillment: "not_started"
  };

  try {
    for (let i = 0; i < inputs.length; i++) {
      const file = inputs[i];
      await env.ARTWORK.put(requestKey(requestId, `input-${i}.jpg`), await file.arrayBuffer());
    }
    await env.ARTWORK.put(requestKey(requestId, "preview.b64"), normalizeBase64(imageBase64));
    await env.ARTWORK.put(requestKey(requestId, "request.json"), JSON.stringify(metadata));
    return { persisted: true, metadata, storageError: null };
  } catch (error) {
    console.error("R2 storage error", error);
    return { persisted: false, metadata, storageError: error?.message || String(error) || "Unknown R2 storage error" };
  }
}

async function storageTest(env) {
  if (!env.ARTWORK) return json({ ok: false, stage: "binding", error: "ARTWORK binding is missing." }, 503);
  const key = `diagnostics/${Date.now()}-${randomHex(4)}.txt`;
  try {
    await env.ARTWORK.put(key, "recast-storage-ok");
    const object = await env.ARTWORK.get(key);
    const value = object ? await object.text() : null;
    await env.ARTWORK.delete(key);
    return json({ ok: value === "recast-storage-ok", keyFormat: "valid", write: true, read: Boolean(object), delete: true });
  } catch (error) {
    return json({ ok: false, stage: "r2", error: error?.message || String(error) }, 500);
  }
}

async function runImage(form, env) {
  const serialized = new Response(form);
  const result = await env.AI.run(MODEL, {
    multipart: {
      body: serialized.body,
      contentType: serialized.headers.get("content-type")
    }
  });
  if (!result?.image) throw new Error("Workers AI returned no image.");
  return result.image;
}

async function transform(request, env) {
  let stage = "start";
  try {
    if (!env.AI) return json({ error: "Workers AI binding is not connected.", stage: "binding" }, 503);
    stage = "parse-form";
    const incoming = await request.formData();
    const styleId = String(incoming.get("style") || "game");
    const subjectType = String(incoming.get("subject") || "person");
    const notes = String(incoming.get("notes") || "");
    const requestText = `${styleId} ${subjectType} ${notes}`;
    const safety = assess(requestText);
    if (safety.status === "rejected") return json({ error: "This request is not a fit for Recast Me's good-will content policy.", safety, stage: "safety" }, 422);
    if (safety.status === "review") return json({ reviewRequired: true, safety, message: "This request needs human approval before generation.", stage: "safety" }, 202);

    stage = "prepare-ai";
    const aiForm = new FormData();
    aiForm.append("prompt", makePrompt(styleId, subjectType, notes));
    aiForm.append("width", "512");
    aiForm.append("height", "512");

    const inputFiles = [];
    for (let i = 0; i < 4; i++) {
      const file = incoming.get(`image_${i}`);
      if (file instanceof File && file.size > 0) {
        if (!file.type.startsWith("image/")) return json({ error: "Uploads must be images.", stage: "validate-input" }, 400);
        if (file.size > 2_000_000) return json({ error: "Each prepared image must be under 2 MB.", stage: "validate-input" }, 400);
        aiForm.append(`input_image_${i}`, file, file.name || `reference-${i}.jpg`);
        inputFiles.push(file);
      }
    }
    if (!inputFiles.length) return json({ error: "Upload at least one photo.", stage: "validate-input" }, 400);

    stage = "ai-generation";
    let rawImage;
    let usedSafeRetry = false;
    try {
      rawImage = await runImage(aiForm, env);
    } catch (error) {
      const message = error?.message || String(error);
      if (message.includes("3030") || message.toLowerCase().includes("flagged")) {
        stage = "ai-safe-retry";
        const safeForm = new FormData();
        safeForm.append("prompt", safeFallbackPrompt(styleId, subjectType));
        safeForm.append("width", "512");
        safeForm.append("height", "512");
        for (let i = 0; i < inputFiles.length; i++) {
          safeForm.append(`input_image_${i}`, inputFiles[i], inputFiles[i].name || `reference-${i}.jpg`);
        }
        try {
          rawImage = await runImage(safeForm, env);
          usedSafeRetry = true;
        } catch (retryError) {
          const retryMessage = retryError?.message || String(retryError);
          if (retryMessage.includes("3030") || retryMessage.toLowerCase().includes("flagged")) {
            return json({
              error: "Workers AI declined this photo/request combination. Try a different photo or a simpler, nonviolent original direction.",
              stage: "ai-moderation",
              code: 3030
            }, 422);
          }
          throw retryError;
        }
      } else {
        throw error;
      }
    }
    const image = normalizeBase64(rawImage);
    if (!image || image.length < 100) throw new Error("AI returned malformed image data.");

    stage = "identifiers";
    const requestId = `RC-${Date.now().toString(36).toUpperCase()}-${randomHex(3).toUpperCase()}`;
    const accessToken = randomHex(32);

    stage = "storage";
    const stored = await storeRequest(env, { requestId, accessToken, styleId, subjectType, notes, inputs: inputFiles, imageBase64: image, safety });

    stage = "response";
    return json({
      ok: true,
      requestId,
      accessToken,
      style: STYLES[styleId]?.name || STYLES.game.name,
      image: `data:image/jpeg;base64,${image}`,
      imageLength: image.length,
      persisted: stored.persisted,
      storageReady: Boolean(env.ARTWORK),
      storageError: stored.storageError || null,
      debugStage: "complete",
      usedSafeRetry
    });
  } catch (error) {
    console.error("Transform error", stage, error);
    return json({ error: error?.message || String(error) || "Unexpected transform error.", stage }, 500);
  }
}

async function aiTest(env) {
  if (!env.AI) return json({ ok: false, error: "AI binding missing" }, 503);
  const form = new FormData();
  form.append("prompt", "premium cinematic portrait of an original futuristic explorer, blue and violet rim lighting, dark luxury background, no text, no logos");
  form.append("width", "512");
  form.append("height", "512");
  const image = await runImage(form, env);
  return json({ ok: true, image: `data:image/jpeg;base64,${image}` });
}


let shopifyTokenCache = { token: null, expiresAt: 0 };

function shopifyDomain(env) {
  const raw = String(env.SHOPIFY_SHOP || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!raw) return null;
  return raw.endsWith(".myshopify.com") ? raw : `${raw}.myshopify.com`;
}

async function getShopifyToken(env) {
  if (!env.SHOPIFY_CLIENT_ID || !env.SHOPIFY_CLIENT_SECRET || !env.SHOPIFY_SHOP) {
    throw new Error("Shopify credentials are not fully configured in Cloudflare.");
  }
  if (shopifyTokenCache.token && shopifyTokenCache.expiresAt > Date.now() + 60_000) {
    return shopifyTokenCache.token;
  }
  const domain = shopifyDomain(env);
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.SHOPIFY_CLIENT_ID,
      client_secret: env.SHOPIFY_CLIENT_SECRET
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const detail = data?.error_description || data?.error || data?.errors || `HTTP ${response.status}`;
    throw new Error(`Shopify token request failed: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
  const expiresIn = Number(data.expires_in || 86399);
  shopifyTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000
  };
  return data.access_token;
}

async function shopifyGraphQL(env, query, variables = {}) {
  const domain = shopifyDomain(env);
  const token = await getShopifyToken(env);
  const response = await fetch(`https://${domain}/admin/api/2026-07/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-access-token": token
    },
    body: JSON.stringify({ query, variables })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Shopify GraphQL HTTP ${response.status}`);
  if (payload.errors?.length) throw new Error(`Shopify GraphQL error: ${payload.errors.map((e) => e.message).join("; ")}`);
  return payload.data;
}

async function shopifyStatus(env) {
  try {
    const data = await shopifyGraphQL(env, `
      query RecastStatus {
        shop { name myshopifyDomain }
        products(first: 20, query: "vendor:'Recast Me'") {
          nodes {
            id
            title
            handle
            status
            variants(first: 20) { nodes { id title sku price } }
          }
        }
        orders(first: 5, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            name
            createdAt
            displayFinancialStatus
            lineItems(first: 20) {
              nodes {
                name
                sku
                quantity
                customAttributes { key value }
              }
            }
          }
        }
      }
    `);
    return json({
      connected: true,
      shop: data.shop,
      recastProducts: data.products?.nodes || [],
      recentOrders: data.orders?.nodes || [],
      productCount: data.products?.nodes?.length || 0,
      recentOrderCount: data.orders?.nodes?.length || 0
    });
  } catch (error) {
    return json({
      connected: false,
      error: error?.message || String(error),
      hint: "If the error says shop_not_permitted, this Shopify store is not in the same Dev Dashboard organization as the app; we will switch to the authorization-code flow instead."
    }, 502);
  }
}

async function printfulStatus(env) {
  if (!env.PRINTFUL_API_TOKEN) return json({ connected: false, error: "PRINTFUL_API_TOKEN secret is missing." }, 503);
  const response = await fetch("https://api.printful.com/stores", {
    headers: { Authorization: `Bearer ${env.PRINTFUL_API_TOKEN}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return json({ connected: false, status: response.status, error: data?.error?.message || "Printful connection failed." }, 502);
  const stores = Array.isArray(data.result) ? data.result.map(({ id, name, type }) => ({ id, name, type })) : [];
  return json({ connected: true, stores });
}

async function requestStatus(request, env, requestId) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const meta = await readMetadata(env, requestId);
  if (!meta) return json({ error: "Request not found." }, 404);
  if (!tokenMatches(meta, token)) return json({ error: "Invalid request token." }, 403);
  const safe = { ...meta };
  delete safe.accessToken;
  return json({ ok: true, request: safe });
}

async function requestPreview(request, env, requestId) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const meta = await readMetadata(env, requestId);
  if (!meta) return json({ error: "Request not found." }, 404);
  if (!tokenMatches(meta, token)) return json({ error: "Invalid request token." }, 403);
  const object = await env.ARTWORK.get(requestKey(requestId, "preview.b64"));
  if (!object) return json({ error: "Preview not found." }, 404);
  const base64 = (await object.text()).replace(/\s+/g, "");
  return json({ ok: true, image: `data:${["image/jpeg","image/png","image/webp"].includes(meta.previewMime)?meta.previewMime:"image/jpeg"};base64,${base64}` });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health") {
        return json({
          ok: true,
          brand: "Recast Me",
          aiBinding: Boolean(env.AI),
          printfulSecretConfigured: Boolean(env.PRINTFUL_API_TOKEN),
          privateArtworkStorage: Boolean(env.ARTWORK),
          shopifyConfigured: Boolean(env.SHOPIFY_CLIENT_ID && env.SHOPIFY_CLIENT_SECRET && env.SHOPIFY_SHOP),
          mode: "MVP"
        });
      }
      if (url.pathname === "/api/storage-test" && request.method === "GET") return storageTest(env);
      if (url.pathname === "/api/ai-test" && request.method === "POST") return aiTest(env);
      if (url.pathname === "/api/transform" && request.method === "POST") return transform(request, env);
      if (url.pathname === "/api/printful-status" && request.method === "GET") return printfulStatus(env);
      if (url.pathname === "/api/shopify-status" && request.method === "GET") return shopifyStatus(env);

      const requestMatch = url.pathname.match(/^\/api\/request\/([^/]+)$/);
      if (requestMatch && request.method === "GET") return requestStatus(request, env, requestMatch[1]);
      const previewMatch = url.pathname.match(/^\/api\/request\/([^/]+)\/preview$/);
      if (previewMatch && request.method === "GET") return requestPreview(request, env, previewMatch[1]);

      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({ error: error?.message || "Unexpected Recast Me error." }, 500);
    }
  }
};
