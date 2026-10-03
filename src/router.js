import app from "./entry.js";
import { highQualityTransform, modelStatus } from "./highquality.js";
import { routeWorkflow, scheduledWorkflow, requireAdmin } from "./workflow.js";
import { socialRoutes } from './social.js';
import { secureApplication } from './preview-security.js';
import { readinessSnapshot } from './render-health.js';

import { printFinishRoutes } from './print-finish.js';

const application = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if(url.pathname === '/api/admin/model-test' && request.method === 'POST'){
      try{
        requireAdmin(request,env);
        const models={dev:'@cf/black-forest-labs/flux-2-dev',klein9:'@cf/black-forest-labs/flux-2-klein-9b',klein4:'@cf/black-forest-labs/flux-2-klein-4b'};
        const choice=url.searchParams.get('model');
        if(!Object.hasOwn(models,choice))return Response.json({error:'Choose a supported test model.'},{status:400});
        const form=await request.formData();form.set('qualityMode',choice==='dev'?'high':'quick');form.set('source','owner-model-test');
        const testRequest=new Request(request.url,{method:'POST',body:form});
        return highQualityTransform(testRequest,{...env,IMAGE_MODEL_HIGH_QUALITY:models.dev,IMAGE_MODEL_QUICK:models[choice]}, {trustedSocialJob:true});
      }catch(error){return Response.json({error:error.message},{status:error.status||500});}
    }
    const finishResponse=await printFinishRoutes(request,env);
    if(finishResponse)return finishResponse;
    const socialResponse=await socialRoutes(request,env,ctx);
    if(socialResponse)return socialResponse;

    if ((url.pathname === "/api/transform-v2" || url.pathname === "/api/transform") && request.method === "POST") {
      return highQualityTransform(request, env);
    }
    if (url.pathname === "/api/model-status" && request.method === "GET") {
      return modelStatus(env);
    }
    if (url.pathname === "/api/render-readiness" && request.method === "GET") {
      const snapshot=await readinessSnapshot(env);
      return new Response(JSON.stringify(snapshot),{status:snapshot.ok?200:503,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
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

// All external API responses cross this boundary. Internal artwork stays private.
export default secureApplication(application);
