# RM-005 — complete Cloudflare Preview bindings for security validation

Date: 2026-09-29
Parent: `4adfa55f39bd0c63d7e8ce8c52281c533eababd2`

The owner attempted the controlled same-dog Halloween test on the successful Worker Preview. The UI correctly failed closed before inference with: "Secure previews need image processing to be configured... No new AI render was started." Therefore this attempt did not provide likeness evidence and should not be counted as a completed AI render by Recast Me.

Cause: Worker Previews do not inherit production bindings. RM-003 added Preview AI, but RM-002 security also requires `env.IMAGES`; saved/request flows also require `ARTWORK`. Cloudflare's current Preview documentation explicitly says API bindings such as Images belong under `previews`, and storage/data bindings must also be declared there.

Change: add `previews.images.binding = "IMAGES"` and an `ARTWORK` R2 binding to the Preview configuration. The existing top-level production R2 and AI bindings are unchanged. Production IMAGES is deliberately not activated by this validation commit.

Important isolation note: this Preview currently points ARTWORK at the existing `recast-me-artwork` bucket so the branch can exercise the exact saved-version flow. This means Preview test artwork/metadata can share that R2 resource; it is not a fully isolated staging bucket. Do not use real customer data for controlled testing. A dedicated preview R2 bucket remains preferable before broader QA.

No image engine, model parameters, commerce setting, X setting, production route, production IMAGES binding or AI-call allowance is changed here. The next test may invoke one High-Quality AI render and Cloudflare Images transformations; record actual result and do not repeat automatically.
