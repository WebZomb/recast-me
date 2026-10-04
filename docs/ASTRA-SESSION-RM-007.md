# RM-007 — zero-render readiness gate and per-mode circuit breaker

Date: 2026-09-29
Implementation commit: ed7ec0ad127059032eaf84c5b2e4ce37c89a7a69

GET /api/render-readiness passively checks AI, ARTWORK, IMAGES, call-limit configuration, and recent per-mode capacity/quota state without calling AI.run. Browser polling is 30 seconds while idle plus an immediate check before submit. Server preflight independently enforces the same gate, so bypassing the UI cannot invoke inference during a cooldown.

High and Quick have independent circuit state. Capacity cooldown defaults to 90 seconds; quota cooldown to 300 seconds. Expiry reopens eligibility without a dummy/probe render. Actual inference retains rejectIfBusy to cover capacity changes after preflight. Quick is never silently substituted for High. Only capacity/quota failures open circuits; moderation/input errors do not.

Tests were added for zero-AI-call readiness, missing Images fail-closed, mode isolation, direct POST blocking, cooldown expiry, recovery, and invalid limit config. No live render, purchase, engine switch, Printful action, or X post was performed while implementing RM-007. Full CI and Cloudflare Preview deployment remain required evidence before the owner is told to render again.
