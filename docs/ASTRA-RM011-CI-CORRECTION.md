# RM-011 CI correction

The first RM-011 CI run at 71ddfad executed 92 tests: 91 passed and 1 failed. The only failure was a stale assertion in tests/generator.test.mjs that still expected the retired Klein 9B model for qualityMode=quick. Application behavior was correct: Standard used @cf/black-forest-labs/flux-2-dev as intended.

Correction is test-only: rename the case to Standard and assert that a capacity result comes from FLUX.2 dev without switching models. No application settings, prompt, rendering behavior, pricing assumptions, watermarking, provider configuration, or production deployment changed in this correction.

Rerun the complete repository validation and require a successful Cloudflare Preview deployment before the owner spends the controlled 12-step benchmark render.
