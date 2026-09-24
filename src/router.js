import app from "./entry.js";
import { highQualityTransform, modelStatus } from "./highquality.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/transform-v2" && request.method === "POST") {
      return highQualityTransform(request, env);
    }
    if (url.pathname === "/api/model-status" && request.method === "GET") {
      return modelStatus(env);
    }
    return app.fetch(request, env, ctx);
  }
};
