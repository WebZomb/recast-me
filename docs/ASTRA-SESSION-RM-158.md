# RM158 — Grand Recast Me branded purchase celebration

**Owner intent:** turn an already-verified physical-gift purchase confirmation into a memorable, share-worthy moment: purple/cyan lights, spinning, dramatic pop, fireworks, branded RM graphics, and a replay button, shared between mobile website and native iOS web studio. Owner authorized implementing and using available Codemagic/PC access.

**Design source:** new `public/grand-celebration.js`, `grand-celebration.css` on draft web PR74. Existing paid-order verification + idempotent HQ bonus remain entirely in `public/order-experience.js`. No changes to Shopify billing, Printful, signed app entitlements, credit ledger, rendering providers, or order creation.

### Choreography and copy
- Dark blurred Recast Me nebula grows in purple/cyan. A radial light-fan sweeps out from center.
- Three cyan / hot-pink / purple luminous orbit rings spin in opposite directions around the *approved* Recast Me RM icon. Offline/network fallback is an on-brand neon RM monogram. At ~0.2–1.2 s the emblem twists and pops into place.
- 44 deterministic stars/confetti shards burst radially, not continuously, with a 2.75-second flight, plus four light-beams and two brief flare flashes.
- Bold one-line gradient **CONGRATULATIONS!** slides/pops after ~0.83 s (mobile wrap inspected and fixed at 390×844). Subheading and backend-confirmed order reference reveal around 1.1–1.3 s. Always say *purchase confirmed / becoming something real*, never falsely *shipped*.
- Gradient **BONUS UNLOCKED** tile flips in around 1.42 s, displaying `+N HQ RECASTS` **only when the server-confirmed credit balance actually gained N**. No invented credits for replays or unverified wallet. Other cases show a subdued next-adventure message with accurate claim status.
- Buttons appear around 1.8 s: **View my order & tracking**, **Make another Recast**, **↻ Replay the magic**. Order destinations use the original private request capability; no public artwork links.
- Accessible dialog close, Escape, Tab focus trap, background scroll lock restoration, safe areas / small-height mobile layout, preferring reduced motion with no moving particles. Animations settle and do not loop indefinitely.
- iOS native bridge already planned in PR71 accepts `success` haptic on entrance and `tap` on reward reveal ~1.48 s. Timers are canceled when replayed/closed. Website shares all HTML/CSS/JS because native Create/Orders are WKWebViews.

### Replay + free demo safety
- A **Replay celebration** button appears beside each *already server-verified paid* item in My Orders. It calls the same renderer with `added=0`. It only restarts CSS animation and haptics: no additional backend payments, credit grants, requests, or fulfillment actions.
- `/purchase-demo.html` opens the **same renderer automatically** with a highly visible `INTERACTIVE DEMO · NO REAL ORDER` notice and `SAMPLE REWARD REVEAL`. It has a sample order timeline and replay action without checkout or payment. No private customer or order details in screenshots/repository.
- Static tests `tests/grand-celebration.test.mjs` plus prior charge/credit/backend security tests cover those guardrails.

### Verification
- Only previously authorized PC was used to render a **390×844 mobile screenshot in isolated headless Chrome**, by loading the draft JS/CSS read-only from GitHub and opening the *existing no-charge demo page*. No credentials were read, no paid call was executed. First screenshot identified an orphan exclamation mark on small phones; CSS tightened heading and retested to show complete **CONGRATULATIONS!** on one line, legible bonus reward tile and accessible buttons. 44 particles present; replay reset demonstrated.
- Await final GitHub security and customer-policy/Chromium/WebKit browser validations on exact PR74 SHA and guarded main deploy. Verify live app page link after deployment and write release receipt with deploy version + test count.
- Native iOS PR71 remains separately draft/simulator-tested. A signed Codemagic build is NOT implied by uploading website files. Codemagic account/build controls need read-access verification and a manual internal TestFlight build unless an authenticated build trigger is actually available.
