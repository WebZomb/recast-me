# RM-011 — Flux 12-step Standard Preview benchmark

Date: 2026-09-29
Parent: dc82b0f3bf826337ab3dafee534e24bf685bf2d4

Owner decision after controlled live comparison: retire Klein from the customer preview path. Klein 9B produced polished Halloween imagery but materially changed the owner's dog and did not meet the core personalized-merch identity requirement. High Quality FLUX.2 dev at 18 steps completed successfully in about one minute and produced acceptable likeness, direction following and protected watermarking.

RM-011 changes the existing internal quick mode to a customer-facing Standard Preview while preserving the existing qualityMode=quick wire value for compatibility. Standard uses the same @cf/black-forest-labs/flux-2-dev model and the same identity-first prompt/reference pipeline as High Quality, at 768x960, 12 steps, guidance 5. High Quality remains 1024x1280, 18 steps, guidance 5. No Klein model remains configured in wrangler for either public mode.

This is a benchmark, not a final production choice. Run one controlled same-photo/same-Halloween-direction Standard render and compare exact pet identity, instruction adherence, completion time and watermark against the accepted 18-step High Quality result. Do not merge to production solely from mocked tests. If 12-step Standard passes, separately test whether purchase-time enlargement can preserve the selected artwork pixel identity; do not regenerate the purchased artwork because that could change the subject or composition.

Scale requirement from owner: architecture must ultimately support roughly 100-1000 successful images on peak days at sustainable cost. Queue/concurrency/cost controls remain a separate required phase after the Standard quality benchmark.

Cloudflare docs confirm FLUX.2 dev supports configurable steps, width/height and up to four reference images; higher steps may improve quality while increasing generation time. Current documented pricing is per input/output 512x512 tile per step, making a lower-step/lower-resolution Standard tier worth validating.

No production merge, purchase, Printful action, X post, provider switch outside Preview, or automatic live render is authorized by this note.
