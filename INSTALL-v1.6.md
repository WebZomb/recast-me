# Recast Me v1.6 — Pets lead the story

Install over v1.5 or v1.5.1. This patch includes the v1.5.1 cleanup.

1. Unzip the update.
2. Merge its contents into the existing repository, preserving the public/assets and src folders. Replace matching files. Keep all other existing files.
3. Commit through your existing GitHub upload workflow and let Cloudflare deploy.
4. Reload the site. Look for “Your pet. A whole new world.” and the two numbered creation panels.

## Changes
- Pet-focused introduction and default subject, while keeping people, couples, families, cars, and custom subjects.
- Explicit couple + pet suggestion.
- Separate panels for who is pictured and their look, and the world/environment.
- Environment suggestions populate editable text. Editing switches to the custom setting and sends that description to the generator.
- Twelve new illustrative merchandise images, with pets appearing in most examples. Actual customer product previews still use the existing Printful flow.
- Waiting screen shows elapsed time instead of simulated model stages. This does not change model speed or reduce quality.
- Correct X handle: recastmeai. Automatic replies remain disabled pending API setup and approval.

## AI budget
The $5 Workers subscription is the base plan, not unlimited image generation. Cloudflare includes a shared 10,000-neuron daily allowance. With the configured FLUX.2 dev model, 18 steps, 1024x1280 output and one prepared photo, estimate about 4–5 cents per render, or roughly two complete renders within the daily allowance. Extra photos, retries, and other AI usage change the total.

For 20 renders every day, budget roughly $26–$32 total per 30-day month including the $5 base, excluding other services and extra attempts. Verify actual usage in the Cloudflare billing dashboard. This update does not change billing settings or impose a new customer cap.

Pricing source: https://developers.cloudflare.com/workers-ai/platform/pricing/

## Validation
All 18 existing automated tests passed. JavaScript syntax checks passed. Merchandise images were visually reviewed. A browser layout check could not run because the browser download failed; inspect the mobile form after deployment. No live customer orders, AI calls on your account, or X replies were performed.

The layout concept shown in chat is a design illustration, not a screenshot of the installed patch. New product assets are in public/assets/product-*-v16.webp; the built-in image-generation prompt subjects are recorded in mockups-v16.json.
