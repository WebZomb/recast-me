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
    prompt: "original comic-book hero illustration, dynamic pose, clean ink linework, halftone texture, graphic shadows, original costume design"
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
    "Edit the provided customer photo rather than inventing a different person.",
    "Preserve the recognizable identity, face, pet markings, vehicle shape, pose cues, and defining features of the provided subject as closely as possible.",
    `Subject type: ${subjectType || "person"}.`,
    style.prompt + ".",
    safeNotes(notes || ""),
    "Create an original composition. Do not add logos, trademarks, famous characters, copied franchise costumes, branded typography, or recognizable copyrighted title treatments.",
    "No text in the artwork. Premium polished commercial quality."
  ].filter(Boolean).join(" ");
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
  if (!env.AI) return json({ error: "Workers AI binding is not connected." }, 503);
  const incoming = await request.formData();
  const styleId = String(incoming.get("style") || "game");
  const subjectType = String(incoming.get("subject") || "person");
  const notes = String(incoming.get("notes") || "");
  const requestText = `${styleId} ${subjectType} ${notes}`;
  const safety = assess(requestText);
  if (safety.status === "rejected") {
    return json({ error: "This request is not a fit for Recast Me's good-will content policy.", safety }, 422);
  }
  if (safety.status === "review") {
    return json({ reviewRequired: true, safety, message: "This request needs human approval before generation." }, 202);
  }

  const aiForm = new FormData();
  aiForm.append("prompt", makePrompt(styleId, subjectType, notes));
  aiForm.append("width", "512");
  aiForm.append("height", "512");

  let imageCount = 0;
  for (let i = 0; i < 4; i++) {
    const file = incoming.get(`image_${i}`);
    if (file instanceof File && file.size > 0) {
      if (!file.type.startsWith("image/")) return json({ error: "Uploads must be images." }, 400);
      if (file.size > 2_000_000) return json({ error: "Each prepared image must be under 2 MB." }, 400);
      aiForm.append(`input_image_${i}`, file, file.name || `reference-${i}.jpg`);
      imageCount++;
    }
  }
  if (!imageCount) return json({ error: "Upload at least one photo." }, 400);

  const image = await runImage(aiForm, env);
  const requestId = `RC-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  return json({
    ok: true,
    requestId,
    style: STYLES[styleId]?.name || STYLES.game.name,
    image: `data:image/jpeg;base64,${image}`,
    demoMode: true,
    notice: "MVP preview: uploads are processed in-memory and are not yet stored for paid fulfillment. Checkout stays disabled until secure request storage is connected."
  });
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
          mode: "MVP"
        });
      }
      if (url.pathname === "/api/ai-test" && request.method === "POST") return aiTest(env);
      if (url.pathname === "/api/transform" && request.method === "POST") return transform(request, env);
      if (url.pathname === "/api/printful-status" && request.method === "GET") return printfulStatus(env);
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({ error: error?.message || "Unexpected Recast Me error." }, 500);
    }
  }
};
