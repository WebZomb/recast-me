# Recast Me v1.7 — One dog, eight worlds

This cumulative patch installs over v1.5, v1.5.1, or v1.6. Unzip and merge into your existing repository, keeping the folders and replacing matching files. Keep all other existing files. Deploy using your existing GitHub/Cloudflare workflow.

The original before/after layout now starts with a natural-looking beagle source image and a royal transformation of that same beagle. All eight style cards use that dog, with distinct costumes and settings. The upload and artwork-preview steps now show the appropriate images rather than merchandise. The broader pet, couple, family, person, and car merchandise examples remain further down the page.

Demo images were made with the built-in image generator using the same beagle reference for each transformation; they are illustrative, not benchmarks of the site's live renderer. Product marketing images remain illustrative mockups. The existing real-product-preview action uses the mapped Printful product and the customer's exact artwork. Labels distinguish example designs from actual customer product previews.

The live generation engine, quality settings, billing settings, and X automation activation are unchanged.

Validation: 18 automated tests passed; JavaScript syntax and whitespace checks passed. Mobile/desktop browser checks cover image loading, overflow, and switching an environment suggestion into a custom description. No live orders or customer AI renders were made.

## Lower-cost generation
Cloudflare FLUX.2 klein 4B is a candidate for a controlled pet-likeness comparison, not a proven replacement. At roughly 1024x1280 with one small reference, estimate $0.0015–$0.0018 per attempt, before allowance and other costs. The shared 10,000-neuron daily allowance could cover roughly 60–75 such attempts if no other AI usage consumes it. Unlimited production-quality image editing at no cost has not been verified. Keep the current quality option until real comparisons establish acceptable likeness and retry rates.

Source: https://developers.cloudflare.com/workers-ai/platform/pricing/
