# RM139 — Upload-time subject suggestion feasibility

2026-10-12, owner requests assessment of live upload detection with editable subject label. Baseline `50ce5d9d8ed9f4efd238a0e9cf7f3ec8131cd344`; runtime unchanged RM138.

Read current selector, customer identity builder, moderation and router/AI binding. Existing selector starts Automatic and changes shared render prompt; no pre-render semantic classifier exists. Existing moderation output is safety categories, not intended-subject detection; do not repurpose dedicated moderation credentials. Explicit Pet also changes wardrobe wording versus the three accepted auto presets, which must be separated for a controlled subject-only comparison.

Feasible moderate feature: asynchronous server-side analysis of a small upload copy, strict category/count output, editable visible Include label. Categories pets, people, mixed, vehicle, other, unknown; counts optional/uncertain. Describe visible main subjects and note incidental faceless supporters separately. Classifier output is untrusted structured data, never arbitrary instructions injected into generation prompt. Keep existing face/outfit/scene baseline; controlled subject clause only. No customer cropping. No heavy browser vision bundle given unresolved Safari memory issue.

Proposed safeguards: pre-analysis upload notice/consent consistent with photo processing; rate and separate cost limits; per-upload hash caching and in-flight deduplication; stale-result suppression; manual override always wins; bounded wait, unknown/error falls back to editable Automatic; no blocking whole form and no silent paid retries. Multi-photo aggregation must avoid counting the same person twice; do not claim exact identities or counts without testing. One analysis per changed photo is an extra AI call, not another image render.

Primary sources reviewed:
- https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/ — vision recognition/reasoning, existing Workers binding integration, listed $0.0485/M input + $0.676/M output tokens. Requires explicit Meta terms acceptance before first model use. No acceptance or activation performed. Example arithmetic only: 10,000 input + 200 output tokens = $0.0006202 (~0.062 cents), or ~$0.62/1,000 such checks; actual image token accounting, latency and accuracy not measured.
- https://ai.google.dev/gemini-api/docs/image-understanding — object detection available as another candidate, not enabled. No need for boxes/segmentation in first category-only pilot.

Recommendation: private upload-suggestion pilot using existing Cloudflare host, evaluate one/multiple people, one/multiple pets, mixed, faceless holders, small/background faces, vehicles, repeated references and poor lighting. Measure precision of intended-subject suggestion, override rate, latency and actual billed usage before public rollout. Confidence is not a calibrated probability; ambiguous photos retain Automatic. Detection can clarify instructions but does not guarantee downstream removal or likeness.

Research/source review only: no runtime edits, tests, deployment, paid calls, license acceptance or external photo uploads. No rollback needed. New feature is proposed, not live.
