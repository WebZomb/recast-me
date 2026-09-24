import app from "./entry.js";
import { highQualityTransform, modelStatus } from "./highquality.js";
import { routeWorkflow, scheduledWorkflow } from "./workflow.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/transform-v2" && request.method === "POST") {
      return highQualityTransform(request, env);
    }
    if (url.pathname === "/api/model-status" && request.method === "GET") {
      return modelStatus(env);
    }
    if (url.pathname === "/api/public-config" && request.method === "GET") {
      return new Response(JSON.stringify({turnstileSiteKey: env.TURNSTILE_SITE_KEY || null}), {headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
    }

    const workflowResponse = await routeWorkflow(request, env, ctx);
    if (workflowResponse) return workflowResponse;

    return app.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    return scheduledWorkflow(controller, env, ctx);
  }
};
