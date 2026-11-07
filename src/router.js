import {runShopSeed} from './shop-seed.js';
import {runShopExpansion} from './shop-expansion.js';
import {runSmallGiftRelease} from './shop-small-gift-release.js';
import {runGiftBatch} from './shop-gift-batch.js';
import {runHeldTaskReconcile,heldTaskReconcileRoute} from './shop-held-task-reconcile.js';
import {frenchiePreviewRepairRoute} from './shop-frenchie-preview-repair.js';
import {siameseSourceRepairRoute} from './shop-siamese-source-repair.js';
import {runPrintfileAudit} from './shop-printfile-audit.js';
import {runCoasterPilot} from './shop-coaster-pilot.js';
import {runMagnetPilot} from './shop-magnet-pilot.js';
import {runStickerSheetPilot} from './shop-sticker-sheet-pilot.js';
import {shopRoutes} from './shop-routes.js';
import {expireSeasonalCheckouts} from './seasonal-checkout.js';
import {basketRoutes} from './basket-routes.js';
import {basketAdminRoute} from './basket-admin.js';
import {holidayRoutes} from './holiday-campaigns.js';
import app from "./entry.js";
import {subjectDetection} from "./subject-detection.js";
import {printfulDiagnosticRoute} from "./printful-diagnostics.js";
import {creditPackRoutes} from './credit-packs.js';
import {trafficRoutes} from './traffic-analytics.js';
import { highQualityTransform, modelStatus } from "./highquality.js";
import { routeWorkflow, scheduledWorkflow, requireAdmin } from "./workflow.js";
import { socialRoutes } from './social.js';
import { secureApplication } from './owner-native-print-boundary.js';
import { readinessSnapshot } from './render-health.js';

import { printFinishRoutes } from './print-finish.js';

const application = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // Single stickers were replaced by six-picture sheets; preserve historical orders.
    if(['GET','HEAD'].includes(request.method)&&['/shop-stickers','/shop-stickers.html'].includes(url.pathname))return Response.redirect(new URL('/shop-sticker-sheets',url.origin).href,301);
    const frenchieRepair=await frenchiePreviewRepairRoute(request,env);if(frenchieRepair)return frenchieRepair;
    const sourceRepair=await siameseSourceRepairRoute(request,env);if(sourceRepair)return sourceRepair;
    const heldTask=await heldTaskReconcileRoute(request,env);if(heldTask)return heldTask;
    const shop=await shopRoutes(request,env);if(shop)return shop;
    const basketAdmin=await basketAdminRoute(request,env,{requireAdmin});
    if(basketAdmin)return basketAdmin;
    const basket=await basketRoutes(request,env,ctx);
    if(basket)return basket;
    const holiday=await holidayRoutes(request,env);
    if(holiday)return holiday;
    if(url.pathname==='/api/subject-detection' && request.method==='POST')return subjectDetection(request,env);
    const traffic=await trafficRoutes(request,env);
    if(traffic)return traffic;
    const creditPacks=await creditPackRoutes(request,env);
    if(creditPacks)return creditPacks;
    const diagnostic = await printfulDiagnosticRoute(request, env, {requireAdmin});
    if (diagnostic) return diagnostic;
    if(url.pathname === '/api/admin/model-test' && request.method === 'POST'){
      try{
        requireAdmin(request,env);
        const models={'qwen-protected':'@cf/black-forest-labs/flux-2-dev','fill-protected':'@cf/black-forest-labs/flux-2-dev','dev-edit':'@cf/black-forest-labs/flux-2-dev','nano-banana':'@cf/black-forest-labs/flux-2-dev',dev:'@cf/black-forest-labs/flux-2-dev',klein9:'@cf/black-forest-labs/flux-2-klein-9b',klein4:'@cf/black-forest-labs/flux-2-klein-4b'};
        const choice=url.searchParams.get('model');
        if(!Object.hasOwn(models,choice))return Response.json({error:'Choose a supported test model.'},{status:400});
        const form=await request.formData();form.set('qualityMode',choice.startsWith('klein')?'quick':'high');form.set('source','owner-model-test');
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
      return new Response(JSON.stringify({turnstileSiteKey: env.TURNSTILE_SITE_KEY || null,liveAppUrl: env.LIVE_APP_URL || env.PUBLIC_APP_URL || null}), {headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
    }

    const workflowResponse = await routeWorkflow(request, env, ctx);
    if (workflowResponse) return workflowResponse;

    return app.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runShopSeed(env).catch(()=>console.error('Premade catalog preparation needs review.')));
    ctx.waitUntil(runShopExpansion(env).catch(()=>console.error('Christmas Village mug preparation needs review.')));
    ctx.waitUntil(runSmallGiftRelease(env).catch(()=>console.error('Small gift print-file preparation needs review.')));
    ctx.waitUntil(runGiftBatch(env).catch(()=>console.error('Breed-specific gift preparation needs review.')));
    ctx.waitUntil(runHeldTaskReconcile(env).catch(()=>console.error('Saved supplier-task reconciliation needs review.')));
    ctx.waitUntil(runPrintfileAudit(env).catch(()=>console.error('Physical product printfile audit needs review.')));
    ctx.waitUntil(runCoasterPilot(env).catch(()=>console.error('Coaster preview canary needs review.')));
    ctx.waitUntil(runMagnetPilot(env).catch(()=>console.error('Magnet supplier-proof canary needs review.')));
    ctx.waitUntil(runStickerSheetPilot(env).catch(()=>console.error('Sticker sheet supplier-proof canary needs review.')));
    ctx.waitUntil(expireSeasonalCheckouts(env).catch(error=>console.error("Seasonal invoice expiry failed:",error.message)));
    return scheduledWorkflow(controller, env, ctx);
  }
};

// All external API responses cross this boundary. Internal artwork stays private.
export default secureApplication(application);
